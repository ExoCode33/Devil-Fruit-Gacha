// src/services/SkillEffectService.js - Complete Skill Effect Processing System
// Add this file to your bot: src/services/SkillEffectService.js

const Logger = require('../utils/Logger');

// Effect definitions for all skills
const SKILL_EFFECTS = {
  // === DAMAGE OVER TIME EFFECTS ===
  "burn_1_turn": { type: "dot", duration: 1, damagePercent: 0.15, name: "Burn", icon: "🔥" },
  "burn_3_turns": { type: "dot", duration: 3, damagePercent: 0.2, name: "Intense Burn", icon: "🔥" },
  "poison_1_turn": { type: "dot", duration: 1, damagePercent: 0.1, name: "Poison", icon: "☠️" },
  "poison_2_turns": { type: "dot", duration: 2, damagePercent: 0.15, name: "Poison", icon: "☠️" },
  "deadly_poison_3_turns": { type: "dot", duration: 3, damagePercent: 0.25, name: "Deadly Poison", icon: "💀" },
  "poison_weak": { type: "dot", duration: 1, damagePercent: 0.08, name: "Weak Poison", icon: "☠️" },
  "jellyfish_poison": { type: "dot", duration: 1, damagePercent: 0.1, name: "Jellyfish Sting", icon: "🎐" },
  "dehydrate_3_turns": { type: "dot", duration: 3, damagePercent: 0.18, name: "Dehydration", icon: "🏜️" },
  "squeeze_3_turns": { type: "dot", duration: 3, damagePercent: 0.12, name: "Constriction", icon: "🐍" },
  "magma_burn": { type: "dot", duration: 2, damagePercent: 0.2, name: "Magma Burn", icon: "🌋" },

  // === DISABLE EFFECTS ===
  "freeze_2_turns": { type: "disable", duration: 2, name: "Frozen", icon: "❄️" },
  "stun_1_turn": { type: "disable", duration: 1, name: "Stunned", icon: "⚡" },
  "trap_2_turns": { type: "disable", duration: 2, name: "Trapped", icon: "⛓️" },
  "immobilize_1_turn": { type: "disable", duration: 1, name: "Immobilized", icon: "🕸️" },

  // === DEBUFF EFFECTS ===
  "slow_1_turn": { type: "debuff", duration: 1, effect: "speed", modifier: -0.3, name: "Slowed", icon: "🐌" },
  "speed_debuff": { type: "debuff", duration: 2, effect: "speed", modifier: -0.4, name: "Slowed", icon: "🐌" },
  "blind_1_turn": { type: "debuff", duration: 1, effect: "accuracy", modifier: -0.5, name: "Blinded", icon: "👁️‍🗨️" },
  "blind_brief": { type: "debuff", duration: 1, effect: "accuracy", modifier: -0.3, name: "Dazzled", icon: "💫" },
  "fear_effect": { type: "debuff", duration: 2, effect: "damage", modifier: -0.3, name: "Frightened", icon: "😨" },
  "fear_minor": { type: "debuff", duration: 1, effect: "damage", modifier: -0.2, name: "Spooked", icon: "👻" },
  "depression_debuff": { type: "debuff", duration: 3, effect: "damage", modifier: -0.4, name: "Depressed", icon: "😢" },
  "charm_1_turn": { type: "debuff", duration: 1, effect: "accuracy", modifier: -0.4, name: "Charmed", icon: "💕" },
  "confuse_enemy": { type: "debuff", duration: 1, effect: "accuracy", modifier: -0.3, name: "Confused", icon: "😵‍💫" },
  "intimidate": { type: "debuff", duration: 2, effect: "damage", modifier: -0.2, name: "Intimidated", icon: "😰" },
  "royal_intimidation": { type: "debuff", duration: 2, effect: "damage", modifier: -0.25, name: "Awed", icon: "👑" },
  "alpha_presence": { type: "debuff", duration: 2, effect: "damage", modifier: -0.3, name: "Dominated", icon: "🐺" },
  "playful_debuff": { type: "debuff", duration: 1, effect: "damage", modifier: -0.15, name: "Playful", icon: "🧸" },
  "slippery_debuff": { type: "debuff", duration: 2, effect: "accuracy", modifier: -0.3, name: "Slippery", icon: "🧼" },
  "chill_effect": { type: "debuff", duration: 1, effect: "speed", modifier: -0.2, name: "Chilled", icon: "🧊" },
  "chill_1_turn": { type: "debuff", duration: 1, effect: "speed", modifier: -0.25, name: "Chilled", icon: "🧊" },
  "weapon_degrade": { type: "debuff", duration: 3, effect: "damage", modifier: -0.2, name: "Rusted Weapons", icon: "🦀" },
  "reduce_enemy_damage": { type: "debuff", duration: 2, effect: "damage", modifier: -0.3, name: "Restrained", icon: "⛓️" },
  "spook_effect": { type: "debuff", duration: 1, effect: "accuracy", modifier: -0.2, name: "Spooked", icon: "👻" },
  "sleep_powder": { type: "debuff", duration: 1, effect: "speed", modifier: -0.4, name: "Drowsy", icon: "😴" },
  "slow_effect": { type: "debuff", duration: 1, effect: "speed", modifier: -0.2, name: "Slowed", icon: "🐌" },
  "visibility_reduce": { type: "debuff", duration: 1, effect: "accuracy", modifier: -0.3, name: "Obscured", icon: "🌫️" },
  "transformation_curse": { type: "debuff", duration: 2, effect: "damage", modifier: -0.5, name: "Toy Curse", icon: "🧸" },

  // === DEFENSIVE EFFECTS ===
  "deflect_next_attack": { type: "defense", duration: 1, effect: "reflect", value: 0.5, name: "Spring Defense", icon: "🌀" },
  "dodge_boost": { type: "defense", duration: 2, effect: "dodge", modifier: 0.3, name: "Enhanced Dodge", icon: "💨" },
  "dodge_next": { type: "defense", duration: 1, effect: "dodge", modifier: 0.5, name: "Slip Away", icon: "💨" },
  "shield_next_turn": { type: "defense", duration: 1, effect: "damage_reduction", value: 0.4, name: "Wax Shield", icon: "🛡️" },
  "shield_counter": { type: "defense", duration: 1, effect: "reflect", value: 0.3, name: "Barrier Counter", icon: "🛡️" },
  "turtle_shell": { type: "defense", duration: 1, effect: "damage_reduction", value: 0.5, name: "Shell Defense", icon: "🐢" },
  "soft_defense": { type: "defense", duration: 1, effect: "damage_reduction", value: 0.3, name: "Wool Cushion", icon: "🐑" },
  "spike_defense": { type: "defense", duration: 2, effect: "reflect", value: 0.2, name: "Spike Shield", icon: "🦔" },
  "reflective_barrier": { type: "defense", duration: 1, effect: "reflect", value: 0.4, name: "Pearl Barrier", icon: "🦪" },
  "slippery_coating": { type: "defense", duration: 2, effect: "dodge", modifier: 0.25, name: "Slime Coat", icon: "🟢" },
  "defense_boost": { type: "defense", duration: 2, effect: "damage_reduction", value: 0.25, name: "Castle Wall", icon: "🏰" },
  "reflect_damage": { type: "defense", duration: 2, effect: "reflect", value: 0.3, name: "Spike Reflect", icon: "🦔" },

  // === HEALING EFFECTS ===
  "heal_on_hit": { type: "heal", value: 0.3, name: "Vampiric", icon: "🩸" },
  "small_heal": { type: "heal", value: 0.2, name: "Minor Heal", icon: "💚" },
  "self_heal": { type: "heal", value: 0.4, name: "Healing Touch", icon: "💚" },
  "phoenix_rebirth": { type: "heal", value: 0.5, name: "Phoenix Flames", icon: "🔥💙" },
  "health_restore": { type: "heal", value: 0.3, name: "Regeneration", icon: "💚" },

  // === BUFF EFFECTS ===
  "pack_bonus": { type: "buff", duration: 3, effect: "damage", modifier: 0.3, name: "Pack Strength", icon: "🐺" },
  "critical_boost": { type: "buff", duration: 2, effect: "critical", modifier: 0.4, name: "Predator Instinct", icon: "🎯" },
  "speed_boost": { type: "buff", duration: 2, effect: "speed", modifier: 0.3, name: "Speed Boost", icon: "💨" },
  "speed_burst": { type: "buff", duration: 1, effect: "speed", modifier: 0.5, name: "Burst Speed", icon: "💨" },
  "rage_boost": { type: "buff", duration: 3, effect: "damage", modifier: 0.2, name: "Ancient Rage", icon: "😡" },
  "stat_boost": { type: "buff", duration: 2, effect: "damage", modifier: 0.25, name: "Hormone Boost", icon: "💉" },
  "size_boost": { type: "buff", duration: 2, effect: "damage", modifier: 0.3, name: "Size Amplify", icon: "📏" },
  "control_boost": { type: "buff", duration: 2, effect: "accuracy", modifier: 0.3, name: "Body Control", icon: "🎮" },
  "worker_boost": { type: "buff", duration: 2, effect: "damage", modifier: 0.2, name: "Colony Strength", icon: "🐜" },
  "heat_aura": { type: "buff", duration: 2, effect: "reflect", value: 0.15, name: "Flame Body", icon: "🔥" },

  // === SPECIAL EFFECTS ===
  "blunt_immunity": { type: "immunity", effect: "blunt", name: "Rubber Body", icon: "🤸" },
  "cannot_dodge": { type: "special", effect: "undodgeable", name: "Light Speed", icon: "⚡" },
  "reality_bend": { type: "special", effect: "bypass_all", name: "Reality Manipulation", icon: "🌌" },
  "power_null": { type: "special", effect: "disable_skills", duration: 2, name: "Darkness Void", icon: "⚫" },
  "status_cleanse": { type: "special", effect: "remove_debuffs", name: "Liberation", icon: "✨" },
  "area_explosion": { type: "special", effect: "multi_hit", value: 1.5, name: "Earthquake", icon: "💥" },
  "devastating_blast": { type: "special", effect: "armor_pierce", value: 0.8, name: "Ancient Weapon", icon: "💥" },
  "position_swap": { type: "special", effect: "tactical", name: "Room", icon: "🔄" },
  "teleport_strike": { type: "special", effect: "undodgeable", name: "Air Door", icon: "🚪" },
  "steal_strength": { type: "special", effect: "power_drain", value: 0.2, name: "Shadow Steal", icon: "👥" },

  // === UTILITY EFFECTS ===
  "hold_enemy": { type: "utility", effect: "immobilize", duration: 1, name: "Metal Grip", icon: "🤲" },
  "grab_hold": { type: "utility", effect: "immobilize", duration: 1, name: "Pincer Grab", icon: "🦀" },
  "entangle": { type: "utility", effect: "immobilize", duration: 1, name: "Kelp Wrap", icon: "🌿" },
  "sound_null": { type: "utility", effect: "stealth", duration: 1, name: "Silent", icon: "🤫" },
  "transformation_trick": { type: "utility", effect: "confuse", duration: 1, name: "Disguise", icon: "🎭" },
  "escape_counter": { type: "utility", effect: "counter", value: 0.5, name: "Quick Exit", icon: "🚪" },
  "mimic_last_attack": { type: "utility", effect: "copy_move", name: "Copy Technique", icon: "🪞" },
  "copy_ability": { type: "utility", effect: "copy_skill", duration: 2, name: "Power Copy", icon: "📋" },
  "summon_ally": { type: "utility", effect: "ally_assist", duration: 2, name: "Living Art", icon: "🎨" },
  "animal_ally": { type: "utility", effect: "ally_assist", duration: 1, name: "Animal Friend", icon: "🐾" },

  // === ATTACK MODIFIERS ===
  "multi_strike": { type: "attack", effect: "multi_hit", value: 0.6, name: "Multi-Hit", icon: "👊" },
  "combo_strike": { type: "attack", effect: "multi_hit", value: 0.4, name: "Combo", icon: "👊" },
  "split_damage": { type: "attack", effect: "multi_hit", value: 0.3, name: "Split Attack", icon: "✂️" },
  "explosion_radius": { type: "attack", effect: "area_damage", value: 0.5, name: "Explosion", icon: "💥" },
  "crush_effect": { type: "attack", effect: "armor_pierce", value: 0.3, name: "Crushing", icon: "🔨" },
  "bleed_effect": { type: "attack", effect: "dot_minor", duration: 2, damagePercent: 0.1, name: "Bleeding", icon: "🩸" },
  "precise_cut": { type: "attack", effect: "armor_pierce", value: 0.4, name: "Precise Cut", icon: "🗡️" },
  "surgical_cut": { type: "attack", effect: "armor_pierce", value: 0.5, name: "Surgical", icon: "🔬" },
  "puncture": { type: "attack", effect: "armor_pierce", value: 0.2, name: "Puncture", icon: "📌" },
  "ranged_attack": { type: "attack", effect: "undodgeable", name: "Wind Blade", icon: "💨" },
  "wind_slice": { type: "attack", effect: "undodgeable", name: "Wind Cut", icon: "💨" },
  "precision_strike": { type: "attack", effect: "critical_boost", value: 0.5, name: "Precision", icon: "🎯" },
  "faithful_strike": { type: "attack", effect: "undodgeable", name: "Never Miss", icon: "❤️" },
  "agile_attack": { type: "attack", effect: "speed_boost", value: 0.2, name: "Agile", icon: "🏃" },
  "speed_strike": { type: "attack", effect: "speed_boost", value: 0.3, name: "Swift Strike", icon: "💨" },
  "surprise_attack": { type: "attack", effect: "critical_boost", value: 0.4, name: "Surprise", icon: "❗" },
  "stealth_attack": { type: "attack", effect: "critical_boost", value: 0.3, name: "Stealth", icon: "👻" },
  "next_attack_surprise": { type: "attack", effect: "critical_boost", value: 0.6, name: "Invisible Strike", icon: "👻" },

  // === SOUND AND ENVIRONMENTAL ===
  "sound_stun": { type: "debuff", duration: 1, effect: "stun", name: "Sonic Stun", icon: "🔊" },
  "sound_wave": { type: "attack", effect: "area_damage", value: 0.3, name: "Sound Wave", icon: "〰️" },
  "sound_wave_stun": { type: "debuff", duration: 1, effect: "stun", name: "Whale Song", icon: "🐋" },
  "sonic_clap": { type: "attack", effect: "area_damage", value: 0.2, name: "Sonic Clap", icon: "👏" },
  "wind_gust": { type: "attack", effect: "knockback", name: "Wind Gust", icon: "🌬️" },
  "knockback": { type: "utility", effect: "reposition", name: "Knockback", icon: "↩️" },
  "knockdown": { type: "debuff", duration: 1, effect: "prone", name: "Knocked Down", icon: "⬇️" },
  "ram_attack": { type: "attack", effect: "knockback", name: "Ramming", icon: "🐏" },
  "spinning_attack": { type: "attack", effect: "multi_hit", value: 0.5, name: "Death Roll", icon: "🌀" },

  // === PROJECTILE AND SPECIAL ===
  "scatter_shot": { type: "attack", effect: "multi_hit", value: 0.4, name: "Scatter Shot", icon: "🎯" },
  "projectile_barrage": { type: "attack", effect: "multi_hit", value: 0.3, name: "Projectile Barrage", icon: "🎯" },
  "water_spray": { type: "utility", effect: "blind_brief", name: "Water Splash", icon: "💧" },
  "water_jet": { type: "attack", effect: "knockback", name: "Water Jet", icon: "💧" },
  "ink_blind": { type: "debuff", duration: 1, effect: "blind", name: "Ink Cloud", icon: "🖤" },
  "web_trap": { type: "utility", effect: "slow", duration: 1, name: "Web Trap", icon: "🕸️" },
  "slip_trap": { type: "utility", effect: "knockdown", name: "Slip Trap", icon: "🍌" },
  "slip_hazard": { type: "utility", effect: "dodge_debuff", duration: 1, name: "Slippery", icon: "🧼" },

  // === PHYSICAL ATTRIBUTES ===
  "jump_strike": { type: "attack", effect: "critical_boost", value: 0.3, name: "Jumping Attack", icon: "🦘" },
  "horn_attack": { type: "attack", effect: "armor_pierce", value: 0.3, name: "Horn Strike", icon: "🦏" },
  "piercing_horn": { type: "attack", effect: "armor_pierce", value: 0.4, name: "Horn Drill", icon: "🦏" },
  "claw_slash": { type: "attack", effect: "bleed_minor", duration: 1, damagePercent: 0.08, name: "Claw Marks", icon: "🐅" },
  "cutting_fin": { type: "attack", effect: "bleed_minor", duration: 1, damagePercent: 0.08, name: "Fin Slice", icon: "🦈" },
  "powerful_bite": { type: "attack", effect: "armor_pierce", value: 0.4, name: "Crushing Bite", icon: "🦛" },
  "crushing_embrace": { type: "attack", effect: "squeeze", duration: 1, name: "Bear Hug", icon: "🐻" },
  "quick_strike": { type: "attack", effect: "speed_boost", value: 0.4, name: "Quick Strike", icon: "⚡" },
  "balance_strike": { type: "attack", effect: "knockdown", name: "Balance Strike", icon: "🦎" },
  "reach_advantage": { type: "attack", effect: "undodgeable", name: "Long Reach", icon: "🦒" },
  "aerial_strike": { type: "attack", effect: "critical_boost", value: 0.3, name: "Aerial Attack", icon: "🦅" },
  "multi_arm_strike": { type: "attack", effect: "multi_hit", value: 0.3, name: "Multi-Arm", icon: "🐙" },
  "sticky_grab": { type: "utility", effect: "pull_closer", name: "Tongue Lash", icon: "🐸" },

  // === ELEMENTAL ===
  "fire_puff": { type: "attack", effect: "burn_minor", duration: 1, damagePercent: 0.05, name: "Dragon Breath", icon: "🐲" },
  "mystical_flame": { type: "attack", effect: "burn_minor", duration: 1, damagePercent: 0.05, name: "Fox Fire", icon: "🦊" },
  "electric_stun": { type: "debuff", duration: 1, effect: "stun", name: "Electric Shock", icon: "⚡" },
  "ground_shake": { type: "attack", effect: "area_damage", value: 0.3, name: "Mini Quake", icon: "🌍" },
  "gravity_pull": { type: "utility", effect: "pull_closer", name: "Dark Gravity", icon: "⚫" },
  "hard_growth": { type: "attack", effect: "armor_pierce", value: 0.2, name: "Coral Spike", icon: "🪸" },
  "never_forget": { type: "buff", duration: 2, effect: "accuracy", modifier: 0.3, name: "Elephant Memory", icon: "🐘" },
  "echolocation": { type: "buff", duration: 1, effect: "critical", modifier: 0.4, name: "Sonar", icon: "🐬" },

  // === MISC EFFECTS ===
  "speed_bite": { type: "attack", effect: "speed_boost", value: 0.2, name: "Quick Bite", icon: "🐭" },
  "stubborn_attack": { type: "attack", effect: "undodgeable", name: "Stubborn Charge", icon: "🐷" },
  "dark_damage": { type: "attack", effect: "shadow_bonus", value: 0.1, name: "Shadow Power", icon: "🌑" },
  "precise_snip": { type: "attack", effect: "armor_pierce", value: 0.3, name: "Precise Snip", icon: "✂️" },
  "compress_damage": { type: "attack", effect: "armor_pierce", value: 0.3, name: "Compression", icon: "📦" }
};

class SkillEffectService {
  constructor() {
    this.logger = new Logger('SKILL_EFFECTS');
  }

  /**
   * Apply skill effect to battle participants
   */
  applySkillEffect(attacker, defender, effectName, skillDamage) {
    const effectData = SKILL_EFFECTS[effectName];
    if (!effectData) {
      this.logger.warn(`Unknown effect: ${effectName}`);
      return null;
    }

    const result = {
      effectName,
      effectData,
      messages: []
    };

    try {
      switch (effectData.type) {
        case 'dot':
          this.applyDamageOverTime(defender, effectData, skillDamage, result);
          break;
        case 'debuff':
          this.applyDebuff(defender, effectData, result);
          break;
        case 'buff':
          this.applyBuff(attacker, effectData, result);
          break;
        case 'defense':
          this.applyDefense(attacker, effectData, result);
          break;
        case 'heal':
          this.applyHealing(attacker, effectData, skillDamage, result);
          break;
        case 'special':
          this.applySpecialEffect(attacker, defender, effectData, result);
          break;
        case 'utility':
          this.applyUtilityEffect(attacker, defender, effectData, result);
          break;
        case 'attack':
          this.applyAttackModifier(attacker, effectData, skillDamage, result);
          break;
        case 'immunity':
          this.applyImmunity(attacker, effectData, result);
          break;
        case 'disable':
          this.applyDisable(defender, effectData, result);
          break;
        default:
          this.logger.warn(`Unknown effect type: ${effectData.type}`);
      }
    } catch (error) {
      this.logger.error(`Error applying effect ${effectName}:`, error);
    }

    return result;
  }

  /**
   * Apply damage over time effect
   */
  applyDamageOverTime(target, effectData, baseDamage, result) {
    const dotDamage = Math.floor(baseDamage * effectData.damagePercent);
    
    this.addStatusEffect(target, {
      type: 'dot',
      name: effectData.name,
      duration: effectData.duration,
      damage: dotDamage,
      icon: effectData.icon
    });

    result.messages.push(`${effectData.icon} ${target.username} is affected by ${effectData.name} (${dotDamage} damage/turn for ${effectData.duration} turns)`);
  }

  /**
   * Apply debuff effect
   */
  applyDebuff(target, effectData, result) {
    this.addStatusEffect(target, {
      type: 'debuff',
      name: effectData.name,
      duration: effectData.duration,
      effect: effectData.effect,
      modifier: effectData.modifier,
      icon: effectData.icon
    });

    const modifierText = effectData.modifier > 0 ? `+${Math.abs(effectData.modifier * 100)}%` : `-${Math.abs(effectData.modifier * 100)}%`;
    result.messages.push(`${effectData.icon} ${target.username} is ${effectData.name} (${effectData.effect} ${modifierText} for ${effectData.duration} turns)`);
  }

  /**
   * Apply buff effect
   */
  applyBuff(target, effectData, result) {
    this.addStatusEffect(target, {
      type: 'buff',
      name: effectData.name,
      duration: effectData.duration,
      effect: effectData.effect,
      modifier: effectData.modifier,
      icon: effectData.icon
    });

    const modifierText = `+${Math.abs(effectData.modifier * 100)}%`;
    result.messages.push(`${effectData.icon} ${target.username} gains ${effectData.name} (${effectData.effect} ${modifierText} for ${effectData.duration} turns)`);
  }

  /**
   * Apply defensive effect
   */
  applyDefense(target, effectData, result) {
    this.addStatusEffect(target, {
      type: 'defense',
      name: effectData.name,
      duration: effectData.duration,
      effect: effectData.effect,
      value: effectData.value || effectData.modifier,
      icon: effectData.icon
    });

    result.messages.push(`${effectData.icon} ${target.username} activates ${effectData.name}`);
  }

  /**
   * Apply healing effect
   */
  applyHealing(target, effectData, baseDamage, result) {
    const healAmount = Math.floor(baseDamage * effectData.value);
    const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
    
    target.hp = Math.min(target.maxHp, target.hp + actualHeal);
    
    result.messages.push(`${effectData.icon} ${target.username} heals for ${actualHeal} HP`);
  }

  /**
   * Apply special effects
   */
  applySpecialEffect(attacker, defender, effectData, result) {
    switch (effectData.effect) {
      case 'bypass_all':
        result.bypassDefenses = true;
        result.messages.push("🌌 Attack bypasses all defenses!");
        break;
      case 'disable_skills':
        this.addStatusEffect(defender, {
          type: 'disable',
          name: 'Skill Locked',
          duration: effectData.duration,
          effect: 'no_skills',
          icon: '🚫'
        });
        result.messages.push(`🚫 ${defender.username}'s skills are disabled for ${effectData.duration} turns`);
        break;
      case 'remove_debuffs':
        this.removeDebuffs(attacker);
        result.messages.push(`✨ ${attacker.username} is freed from all debuffs!`);
        break;
      case 'multi_hit':
        result.damageMultiplier = 1 + effectData.value;
        result.messages.push("💥 Multi-hit attack!");
        break;
      case 'armor_pierce':
        result.armorPierce = effectData.value;
        result.messages.push("🗡️ Attack pierces through defenses!");
        break;
      case 'undodgeable':
        result.undodgeable = true;
        result.messages.push("⚡ Attack cannot be dodged!");
        break;
      case 'power_drain':
        this.drainPower(attacker, defender, effectData.value, result);
        break;
    }
  }

  /**
   * Apply utility effects
   */
  applyUtilityEffect(attacker, defender, effectData, result) {
    switch (effectData.effect) {
      case 'immobilize':
        this.addStatusEffect(defender, {
          type: 'disable',
          name: effectData.name,
          duration: effectData.duration,
          effect: 'immobilized',
          icon: effectData.icon
        });
        result.messages.push(`${effectData.icon} ${defender.username} is immobilized for ${effectData.duration} turns`);
        break;
      case 'stealth':
        this.addStatusEffect(attacker, {
          type: 'buff',
          name: 'Stealth',
          duration: effectData.duration,
          effect: 'dodge',
          modifier: 0.5,
          icon: effectData.icon
        });
        result.messages.push(`${effectData.icon} ${attacker.username} becomes stealthy`);
        break;
      case 'counter':
        result.counterChance = effectData.value;
        result.messages.push(`🚪 ${attacker.username} prepares to counter`);
        break;
      case 'copy_move':
        result.copyLastMove = true;
        result.messages.push(`🪞 ${attacker.username} copies the enemy's technique`);
        break;
    }
  }

  /**
   * Apply attack modifiers
   */
  applyAttackModifier(attacker, effectData, baseDamage, result) {
    switch (effectData.effect) {
      case 'multi_hit':
        result.damageMultiplier = 1 + effectData.value;
        result.messages.push("👊 Multiple strikes!");
        break;
      case 'critical_boost':
        result.criticalBoost = effectData.value;
        result.messages.push("🎯 Enhanced critical chance!");
        break;
      case 'speed_boost':
        this.addStatusEffect(attacker, {
          type: 'buff',
          name: 'Speed Boost',
          duration: 1,
          effect: 'speed',
          modifier: effectData.value,
          icon: '💨'
        });
        break;
      case 'area_damage':
        result.damageMultiplier = 1 + effectData.value;
        result.messages.push("💥 Area effect damage!");
        break;
    }
  }

  /**
   * Apply immunity effects
   */
  applyImmunity(target, effectData, result) {
    this.addStatusEffect(target, {
      type: 'immunity',
      name: effectData.name,
      duration: 999, // Permanent
      effect: effectData.effect,
      icon: effectData.icon
    });

    result.messages.push(`🤸 ${target.username} gains immunity to ${effectData.effect} damage`);
  }

  /**
   * Apply disable effects
   */
  applyDisable(target, effectData, result) {
    this.addStatusEffect(target, {
      type: 'disable',
      name: effectData.name,
      duration: effectData.duration,
      effect: 'skip_turn',
      icon: effectData.icon
    });

    result.messages.push(`${effectData.icon} ${target.username} is ${effectData.name} for ${effectData.duration} turns`);
  }

  /**
   * Add status effect to player
   */
  addStatusEffect(player, effect) {
    if (!player.statusEffects) {
      player.statusEffects = [];
    }

    // Check if effect already exists
    const existingEffect = player.statusEffects.find(e => e.name === effect.name);
    
    if (existingEffect) {
      // Refresh duration or stack if stackable
      existingEffect.duration = Math.max(existingEffect.duration, effect.duration);
      if (effect.stacks !== undefined) {
        existingEffect.stacks = Math.min((existingEffect.stacks || 1) + 1, 3);
      }
    } else {
      // Add new effect
      player.statusEffects.push({
        ...effect,
        stacks: 1
      });
    }
  }

  /**
   * Remove all debuffs from player
   */
  removeDebuffs(player) {
    if (player.statusEffects) {
      player.statusEffects = player.statusEffects.filter(effect => 
        effect.type !== 'debuff' && effect.type !== 'disable'
      );
    }
  }

  /**
   * Drain power from defender to attacker
   */
  drainPower(attacker, defender, drainPercent, result) {
    // Temporarily boost attacker
    this.addStatusEffect(attacker, {
      type: 'buff',
      name: 'Power Drain',
      duration: 3,
      effect: 'damage',
      modifier: drainPercent,
      icon: '👥'
    });

    // Temporarily weaken defender
    this.addStatusEffect(defender, {
      type: 'debuff',
      name: 'Power Drained',
      duration: 3,
      effect: 'damage',
      modifier: -drainPercent,
      icon: '💀'
    });

    result.messages.push(`👥 ${attacker.username} drains power from ${defender.username}`);
  }

  /**
   * Process all status effects at turn start
   */
  processStatusEffects(player, battleLog) {
    if (!player.statusEffects) return;

    player.statusEffects = player.statusEffects.filter(effect => {
      // Apply effect
      switch (effect.type) {
        case 'dot':
          const damage = effect.damage * (effect.stacks || 1);
          player.hp = Math.max(0, player.hp - damage);
          battleLog.push({
            type: 'status_effect',
            message: `${effect.icon} ${player.username} takes ${damage} damage from ${effect.name}`,
            icon: effect.icon
          });
          break;
          
        case 'heal':
          const healAmount = effect.value * (effect.stacks || 1);
          const actualHeal = Math.min(healAmount, player.maxHp - player.hp);
          player.hp = Math.min(player.maxHp, player.hp + actualHeal);
          if (actualHeal > 0) {
            battleLog.push({
              type: 'status_effect',
              message: `${effect.icon} ${player.username} recovers ${actualHeal} HP from ${effect.name}`,
              icon: effect.icon
            });
          }
          break;
      }
      
      // Reduce duration
      if (effect.duration > 0) {
        effect.duration--;
        return effect.duration > 0;
      }
      
      return effect.duration === 999; // Permanent effects
    });
  }

  /**
   * Calculate damage modifiers from status effects
   */
  calculateDamageModifiers(player) {
    if (!player.statusEffects) return { damageModifier: 1, criticalModifier: 0, speedModifier: 1, accuracyModifier: 1 };

    let damageModifier = 1;
    let criticalModifier = 0;
    let speedModifier = 1;
    let accuracyModifier = 1;

    player.statusEffects.forEach(effect => {
      const stacks = effect.stacks || 1;
      
      if (effect.type === 'buff' || effect.type === 'debuff') {
        const modifier = effect.modifier * stacks;
        
        switch (effect.effect) {
          case 'damage':
            damageModifier *= (1 + modifier);
            break;
          case 'critical':
            criticalModifier += modifier;
            break;
          case 'speed':
            speedModifier *= (1 + modifier);
            break;
          case 'accuracy':
            accuracyModifier *= (1 + modifier);
            break;
        }
      }
    });

    return {
      damageModifier: Math.max(0.1, damageModifier),
      criticalModifier: Math.max(0, Math.min(0.95, criticalModifier)),
      speedModifier: Math.max(0.1, speedModifier),
      accuracyModifier: Math.max(0.05, Math.min(1, accuracyModifier))
    };
  }

  /**
   * Check if player has specific immunity
   */
  hasImmunity(player, damageType) {
    if (!player.statusEffects) return false;
    
    return player.statusEffects.some(effect => 
      effect.type === 'immunity' && effect.effect === damageType
    );
  }

  /**
   * Check if player is disabled
   */
  isDisabled(player) {
    if (!player.statusEffects) return false;
    
    return player.statusEffects.some(effect => 
      effect.type === 'disable' && (effect.effect === 'skip_turn' || effect.effect === 'immobilized')
    );
  }

  /**
   * Check if skills are disabled
   */
  areSkillsDisabled(player) {
    if (!player.statusEffects) return false;
    
    return player.statusEffects.some(effect => 
      effect.type === 'disable' && effect.effect === 'no_skills'
    );
  }

  /**
   * Get effect data by name
   */
  getEffectData(effectName) {
    return SKILL_EFFECTS[effectName] || null;
  }
}

module.exports = new SkillEffectService();
