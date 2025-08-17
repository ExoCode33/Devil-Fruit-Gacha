// src/commands/slash/pvp/pvp-raid-history.js
// Discord.js v14+
// Clean, crash-safe raid history viewer with message collectors (no null collector).
// Storage: reads from data/pvp_raid_history.json if present (array of entries).
// Each entry shape expected (example):
// {
//   id: "raid_123",
//   userId: "1234567890",
//   userName: "ExoCode",
//   opponentName: "AI",
//   outcome: "win" | "loss" | "draw",
//   turns: 17,
//   timestamp: 1723500000000,
//   summary: "Luffy defeated Kaido",
//   teamA: [{ name, emoji, maxHP, finalHP }],
//   teamB: [{ name, emoji, maxHP, finalHP }],
//   logTail: ["line1", "line2", ... up to 10]
// }

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

// ---------- CONFIG ----------
const STORE_PATH = path.join(process.cwd(), "data", "pvp_raid_history.json");
const PAGE_SIZE = 5;
const COLLECTOR_MS = 120_000;

// ---------- SAFE REPLY HELPERS ----------
async function sendOrEdit(interaction, payload) {
  // Always return a Message
  if (interaction.deferred || interaction.replied) {
    const msg = await interaction.editReply(payload);
    // In v14, editReply returns a Message when a reply already exists
    return msg ?? await interaction.fetchReply().catch(() => null);
  }
  return await interaction.reply({ ...payload, fetchReply: true });
}

async function getReplyMessage(interaction) {
  return await interaction.fetchReply().catch(() => null);
}

// ---------- DATA ----------
function loadHistory() {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const text = fs.readFileSync(STORE_PATH, "utf8");
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function fmtDate(ts) {
  try {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "unknown";
    // Display as YYYY-MM-DD HH:mm
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return "unknown";
  }
}

function hpLine(u) {
  if (!u) return "—";
  const e = u.emoji ? `${u.emoji} ` : "";
  const max = u.maxHP ?? 1, cur = u.finalHP ?? 0;
  const pct = Math.max(0, Math.min(100, Math.round((cur / Math.max(1,max)) * 100)));
  return `${e}**${u.name || "?"}**  ${cur}/${max} (${pct}%)`;
}

// ---------- STATE / RENDER ----------
function filterAndSort(history, userId, mineOnly) {
  let list = history.slice();
  if (mineOnly && userId) {
    list = list.filter(x => String(x.userId) === String(userId));
  }
  // newest first
  list.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
  return list;
}

function paginate(list, page, size) {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const p = Math.max(1, Math.min(page, totalPages));
  const start = (p - 1) * size;
  const slice = list.slice(start, start + size);
  return { page: p, totalPages, slice, total };
}

function buildRow(disabled, page, totalPages, mineOnly) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pvp_hist:first:${mineOnly ? "mine" : "all"}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⏮️")
      .setDisabled(disabled || page <= 1),
    new ButtonBuilder()
      .setCustomId(`pvp_hist:prev:${mineOnly ? "mine" : "all"}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("◀️")
      .setDisabled(disabled || page <= 1),
    new ButtonBuilder()
      .setCustomId(`pvp_hist:toggle:${mineOnly ? "mine" : "all"}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel(mineOnly ? "Showing: Mine" : "Showing: All"),
    new ButtonBuilder()
      .setCustomId(`pvp_hist:next:${mineOnly ? "mine" : "all"}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("▶️")
      .setDisabled(disabled || page >= totalPages),
    new ButtonBuilder()
      .setCustomId(`pvp_hist:last:${mineOnly ? "mine" : "all"}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⏭️")
      .setDisabled(disabled || page >= totalPages)
  );
}

function colorForOutcome(outcome) {
  if (outcome === "win") return 0x28a745;
  if (outcome === "loss") return 0xdc3545;
  return 0x6c757d;
}

function buildEmbeds(user, list, page, totalPages, total, mineOnly) {
  const title = `PvP Raid History ${mineOnly ? "— Yours" : "— All"}`;
  const descr = total
    ? `Page **${page} / ${totalPages}** • Total **${total}**`
    : "No history found.";

  const embeds = [];
  if (list.length === 0) {
    embeds.push(
      new EmbedBuilder()
        .setTitle(title)
        .setDescription(descr)
        .setColor(0x2b2d31)
    );
    return embeds;
  }

  for (const item of list) {
    const a0 = (item.teamA && item.teamA[0]) || null;
    const b0 = (item.teamB && item.teamB[0]) || null;
    const logTail = Array.isArray(item.logTail) ? item.logTail.slice(-5).join("\n") : "—";
    const who = item.userName || item.userId || "Player";
    const opp = item.opponentName || "Opponent";

    const em = new EmbedBuilder()
      .setTitle(`${who} vs ${opp}`)
      .setColor(colorForOutcome(item.outcome))
      .setDescription(
        `**Result:** ${item.outcome ? item.outcome.toUpperCase() : "UNKNOWN"} • ` +
        `**Turns:** ${item.turns ?? "?"} • **When:** ${fmtDate(item.timestamp)}`
      )
      .addFields(
        { name: "Team A", value: a0 ? hpLine(a0) : "—", inline: true },
        { name: "Team B", value: b0 ? hpLine(b0) : "—", inline: true },
        { name: "Summary", value: item.summary || "—" },
        { name: "Recent log", value: "```md\n" + logTail + "\n```" }
      )
      .setFooter({ text: `ID: ${item.id || "—"}` });

    embeds.push(em);
  }

  // Insert a header embed on top
  embeds.unshift(
    new EmbedBuilder()
      .setTitle(title)
      .setDescription(descr)
      .setColor(0x2b2d31)
  );

  return embeds;
}

// ---------- RENDER WRAPPER STATE ----------
function makeState(interaction, allHistory) {
  return {
    page: 1,
    mineOnly: true,
    historyAll: allHistory,
    get list() {
      return filterAndSort(this.historyAll, interaction.user.id, this.mineOnly);
    },
    render(opts = {}) {
      const disabled = !!opts.disabled;
      const { page, totalPages, slice, total } = paginate(this.list, this.page, PAGE_SIZE);
      const embeds = buildEmbeds(interaction.user, slice, page, totalPages, total, this.mineOnly);
      const row = buildRow(disabled, page, totalPages, this.mineOnly);
      return { embeds, components: [row] };
    },
    first() { this.page = 1; },
    prev() { this.page = Math.max(1, this.page - 1); },
    next() {
      const totalPages = Math.max(1, Math.ceil(this.list.length / PAGE_SIZE));
      this.page = Math.min(totalPages, this.page + 1);
    },
    last() {
      const totalPages = Math.max(1, Math.ceil(this.list.length / PAGE_SIZE));
      this.page = totalPages;
    },
    toggleMine() {
      this.mineOnly = !this.mineOnly;
      this.page = 1;
    }
  };
}

// ---------- COLLECTOR ----------
async function setupHistoryCollector(interaction, message, state) {
  // Ensure we have a Message
  let msg = message;
  if (!msg) msg = await getReplyMessage(interaction);
  if (!msg) msg = await sendOrEdit(interaction, state.render());
  if (!msg) {
    console.warn("[pvp-raid-history] No message available; skipping collector init.");
    return;
  }

  const filter = i => i.user.id === interaction.user.id &&
    i.customId?.startsWith("pvp_hist:");

  // Prefer message collector
  let collector = null;
  if (typeof msg.createMessageComponentCollector === "function") {
    collector = msg.createMessageComponentCollector({ time: COLLECTOR_MS, filter });
  } else if (interaction.channel?.createMessageComponentCollector) {
    // Fallback on channel (filter by message id + user)
    collector = interaction.channel.createMessageComponentCollector({
      time: COLLECTOR_MS,
      filter: i => i.message?.id === msg.id && filter(i)
    });
  } else {
    console.warn("[pvp-raid-history] No place to attach a collector; aborting.");
    return;
  }

  collector.on("collect", async (i) => {
    try {
      const [, action, scope] = i.customId.split(":"); // pvp_hist:prev:mine
      if (action === "first") state.first();
      else if (action === "prev") state.prev();
      else if (action === "next") state.next();
      else if (action === "last") state.last();
      else if (action === "toggle") state.toggleMine();

      await i.deferUpdate().catch(() => {});
      const newPayload = state.render();
      const updated = await sendOrEdit(interaction, newPayload);
      if (!updated) collector.stop("no_message");
    } catch (err) {
      console.error("[pvp-raid-history] collector error:", err);
    }
  });

  collector.on("end", async () => {
    try {
      const payload = state.render({ disabled: true });
      await sendOrEdit(interaction, payload);
    } catch {
      /* ignore */
    }
  });
}

// ---------- COMMAND ----------
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pvp-raid-history")
    .setDescription("View PvP raid history with paging and filters.")
    .addBooleanOption(o =>
      o.setName("all")
       .setDescription("Show all players (default shows only yours)")
    ),

  async execute(interaction) {
    try {
      const showAll = interaction.options.getBoolean("all") || false;

      // Load data
      const history = loadHistory();
      const state = makeState(interaction, history);
      state.mineOnly = !showAll; // default: mine only

      // First render (guarantee a Message back)
      const msg = await sendOrEdit(interaction, state.render());

      // Collector (safe)
      await setupHistoryCollector(interaction, msg, state);
    } catch (err) {
      console.error("PvP Raid History error:", err);
      const embed = new EmbedBuilder()
        .setTitle("PvP Raid History")
        .setDescription("Something went wrong showing history.")
        .setColor(0xcc0000);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
      }
    }
  }
};
