// src/battle/effects.js
// Centralized effect engine for buffs/debuffs in PvP & raids (CommonJS).

const EFFECT_ICONS = {
  buff: "🟢", debuff: "🔴",
  ATK: "🗡️", DEF: "🛡️", SPD: "💨", CRIT: "💥",
  Burn: "🔥", Poison: "☠️", Bleed: "🩸", Regen: "✨",
  Shield: "🧿", Stun: "💫", Silence: "🤐", Taunt: "📣"
};

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function pct(v){ return (v>=0?"+":"") + Math.round(v*100) + "%"; }

function createEffect(def) {
  const e = {
    id: def.id || def.name,
    name: def.name,
    kind: def.kind || "debuff",            // "buff" | "debuff"
    duration: def.duration ?? 2,           // remaining turns
    maxStacks: def.maxStacks ?? 1,
    stacks: def.stacks ?? 1,
    // percentage stat multipliers (per stack)
    statMods: { ATK:0, DEF:0, SPD:0, CRIT:0, ...(def.statMods||{}) },
    // flat stat adds (per stack)
    flat: { ATK:0, DEF:0, SPD:0, ...(def.flat||{}) },
    // multiplicative damage dealt/taken (per stack)
    dmgDealtMult: def.dmgDealtMult ?? 0,
    dmgTakenMult: def.dmgTakenMult ?? 0,
    // periodic effects (per stack)
    dot: def.dot ? { amount: def.dot.amount, type: def.dot.type || "true" } : null,
    hot: def.hot ? { amount: def.hot.amount } : null,
    shield: def.shield ? { amount: def.shield.amount } : null, // consumed by damage
    stun: !!def.stun,
    silence: !!def.silence,
    taunt: !!def.taunt,
    ticksAt: def.ticksAt || "turnStart",   // "turnStart" | "turnEnd"
    decaysAt: def.decaysAt || "turnEnd",   // when duration-- happens
    stacking: def.stacking || "stack",     // "stack" | "refresh" | "extend"
    source: def.source || null,
    meta: def.meta || {}
  };
  return e;
}

function describeEffect(e) {
  const parts = [];
  const head = `${EFFECT_ICONS[e.kind] || ""} ${e.name}${e.maxStacks>1?` x${e.stacks}`:""} (${e.duration}t)`;
  if (e.statMods.ATK) parts.push(`${EFFECT_ICONS.ATK} ${pct(e.statMods.ATK)} ATK`);
  if (e.statMods.DEF) parts.push(`${EFFECT_ICONS.DEF} ${pct(e.statMods.DEF)} DEF`);
  if (e.statMods.SPD) parts.push(`${EFFECT_ICONS.SPD} ${pct(e.statMods.SPD)} SPD`);
  if (e.statMods.CRIT) parts.push(`${EFFECT_ICONS.CRIT} ${pct(e.statMods.CRIT)} CRIT`);
  if (e.dot) parts.push(`${EFFECT_ICONS[e.name]||"🔥"} DOT ${e.dot.amount}/t`);
  if (e.hot) parts.push(`${EFFECT_ICONS.Regen} HOT ${e.hot.amount}/t`);
  if (e.shield) parts.push(`${EFFECT_ICONS.Shield} Shield ${e.shield.amount}`);
  if (e.stun) parts.push(`${EFFECT_ICONS.Stun} Stunned`);
  if (e.silence) parts.push(`${EFFECT_ICONS.Silence} Silenced`);
  if (e.taunt) parts.push(`${EFFECT_ICONS.Taunt} Taunting`);
  return parts.length ? `${head} — ${parts.join(", ")}` : head;
}

function getActiveEffects(entity) {
  return entity.effects || (entity.effects = []);
}

function addEffect(entity, effectDef, log) {
  const effs = getActiveEffects(entity);
  const id = effectDef.id || effectDef.name;
  const idx = effs.findIndex(e => e.id === id);
  if (idx >= 0) {
    const cur = effs[idx];
    if (cur.stacking === "stack") {
      cur.stacks = Math.min(cur.maxStacks, cur.stacks + (effectDef.stacks || 1));
      log?.push(`↗️ ${entity.name} gains a stack of **${cur.name}** (x${cur.stacks}).`);
    } else if (cur.stacking === "refresh") {
      cur.duration = Math.max(cur.duration, effectDef.duration ?? cur.duration);
      log?.push(`🔄 ${entity.name}'s **${cur.name}** refreshed (${cur.duration}t).`);
    } else if (cur.stacking === "extend") {
      cur.duration += (effectDef.duration ?? 1);
      log?.push(`⏩ ${entity.name}'s **${cur.name}** extended to ${cur.duration}t.`);
    }
    return cur;
  } else {
    const e = createEffect(effectDef);
    effs.push(e);
    log?.push(`✨ ${entity.name} gains ${describeEffect(e)}.`);
    return e;
  }
}

function hasCC(entity) {
  const effs = getActiveEffects(entity);
  return {
    stunned: effs.some(e => e.stun),
    silenced: effs.some(e => e.silence),
    taunted: effs.some(e => e.taunt)
  };
}

function getEffectiveStats(base, entity) {
  const effs = getActiveEffects(entity);
  const out = { ...base };
  // flat
  for (const e of effs) {
    for (const k of Object.keys(e.flat)) {
      out[k] = (out[k] ?? 0) + e.flat[k]*e.stacks;
    }
  }
  // percentage
  for (const e of effs) {
    for (const k of Object.keys(e.statMods)) {
      out[k] = (out[k] ?? 0) * (1 + e.statMods[k]*e.stacks);
    }
  }
  return out;
}

function modifyDamage({ raw, attacker, defender }) {
  const aEffs = getActiveEffects(attacker);
  const dEffs = getActiveEffects(defender);
  let dmg = raw;

  for (const e of aEffs) dmg *= (1 + (e.dmgDealtMult || 0)*e.stacks);
  for (const e of dEffs) dmg *= (1 + (e.dmgTakenMult || 0)*e.stacks);

  // shield absorption
  const shield = dEffs.find(e => e.shield && e.shield.amount > 0);
  if (shield) {
    const absorbed = Math.min(shield.shield.amount, dmg);
    shield.shield.amount -= absorbed;
    dmg -= absorbed;
  }
  return Math.max(0, Math.floor(dmg));
}

function tickEffects(entity, phase, log) {
  const effs = getActiveEffects(entity);
  let dotTotal = 0, hotTotal = 0;

  for (const e of effs) {
    if (e.ticksAt === phase) {
      if (e.dot) {
        const amt = e.dot.amount * e.stacks;
        dotTotal += amt;
        log?.push(`${EFFECT_ICONS[e.name]||"🔥"} ${entity.name} suffers ${amt} from **${e.name}**.`);
      }
      if (e.hot) {
        const amt = e.hot.amount * e.stacks;
        hotTotal += amt;
        log?.push(`✨ ${entity.name} heals ${amt} from **${e.name}**.`);
      }
    }
  }

  // duration decay + expire
  for (let i = effs.length - 1; i >= 0; i--) {
    const e = effs[i];
    if (e.decaysAt === phase) {
      e.duration -= 1;
      if (e.duration <= 0) {
        log?.push(`⏹️ ${entity.name}'s **${e.name}** expired.`);
        effs.splice(i, 1);
      }
    }
  }
  return { dotTotal, hotTotal };
}

function listEffectSummaries(entity) {
  const effs = getActiveEffects(entity);
  if (!effs.length) return "—";
  return effs.map(describeEffect).join("\n");
}

module.exports = {
  EFFECT_ICONS,
  createEffect,
  describeEffect,
  getActiveEffects,
  addEffect,
  hasCC,
  getEffectiveStats,
  modifyDamage,
  tickEffects,
  listEffectSummaries,
  deepClone
};
