// src/discord/client/CommandManager.js
// Scans and loads commands from src/features/**/commands, exposes them on client,
// and can optionally register slash commands via REST. Collision-safe variable names.

const nodePath = require('path');
const fsp = require('fs').promises;

// Shared modules (new locations), wrapped to avoid hard crashes
let LoggerMod, RateLimiterMod, InteractionHandlerMod, ConfigMod;
try { LoggerMod = require('../../shared/utils/Logger'); } catch {}
try { RateLimiterMod = require('../../shared/utils/RateLimiter'); } catch {}
try { InteractionHandlerMod = require('../../shared/utils/InteractionHandler'); } catch {}
try { ConfigMod = require('../../shared/config/Config'); } catch { ConfigMod = {}; }

function getLogger(scope = 'CommandManager') {
  if (!LoggerMod) return console;
  try {
    if (typeof LoggerMod === 'function') return new LoggerMod(scope);
    if (LoggerMod?.child) return LoggerMod.child(scope);
    return LoggerMod;
  } catch {
    return console;
  }
}

class CommandManager {
  constructor(client) {
    this.client = client;
    this.logger = getLogger('CommandManager');
    this.commands = new Map();
    this.cooldowns = new Map(); // Map<commandName, Map<userId, timestamp>>
    this.rateLimiter = null;

    const cfg = (ConfigMod && ConfigMod.default) ? ConfigMod.default : ConfigMod;
    this.windowMs = Number(process.env.RATE_LIMIT_WINDOW || cfg.RATE_LIMIT_WINDOW || 60_000);
    this.maxRequests = Number(process.env.RATE_LIMIT_MAX || cfg.RATE_LIMIT_MAX || 30);
    this.cooldownMs = Number(process.env.COMMAND_COOLDOWN || cfg.COMMAND_COOLDOWN || 3_000);

    try {
      if (RateLimiterMod) {
        this.rateLimiter = new RateLimiterMod({ windowMs: this.windowMs, max: this.maxRequests });
      }
    } catch (e) {
      this.logger.warn?.('RateLimiter init failed; continuing without rate limit.', e) || console.warn('RateLimiter init failed; continuing without rate limit.', e);
      this.rateLimiter = null;
    }

    // Scan base(s) for commands in the new structure
    this.scanBases = [ nodePath.join(process.cwd(), 'src', 'features') ];
  }

  async initialize() {
    const files = await this.getCommandFiles();
    for (const filePath of files) {
      try { await this.loadCommand(filePath); }
      catch (err) {
        this.logger.error?.('Failed to load command from', filePath, err) || console.error('Failed to load command from', filePath, err);
      }
    }

    // expose on client
    this.client.commands = this.commands;
    this.client.commandManager = this;

    this.logger.info?.(`Loaded ${this.commands.size} command(s).`) || console.log(`Loaded ${this.commands.size} command(s).`);
    return this.commands;
  }

  async getCommandFiles() {
    const results = [];
    const walk = async (dir) => {
      const items = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const it of items) {
        const full = nodePath.join(dir, it.name);
        if (it.isDirectory()) {
          await walk(full);
        } else if (it.isFile() && it.name.endsWith('.js') && full.includes(`${nodePath.sep}commands${nodePath.sep}`)) {
          results.push(full);
        }
      }
    };
    for (const base of this.scanBases) { await walk(base); }
    return results;
  }

  async loadCommand(filePath) {
    // Clear cache for dev reload
    try { delete require.cache[require.resolve(filePath)]; } catch {}

    const mod = require(filePath);
    const exported = mod && mod.default ? mod.default : mod;

    // Normalize
    let data, execute, name;
    if (exported && typeof exported === 'object') {
      data = exported.data || exported.command || null;
      execute = exported.execute || exported.run || exported.handler || null;
    } else if (typeof exported === 'function') {
      execute = exported;
      data = { name: this.deriveNameFromFilename(filePath) };
    }

    if (!data) data = { name: this.deriveNameFromFilename(filePath) };
    name = data?.name || this.deriveNameFromFilename(filePath);

    if (!name || typeof execute !== 'function') {
      this.logger.warn?.(`Skipping ${filePath} (missing 'data.name' or 'execute').`) || console.warn(`Skipping ${filePath} (missing 'data.name' or 'execute').`);
      return null;
    }

    // Wrap with cooldown + rate limit if available
    const wrapped = this.wrapExecutor(name, execute, filePath);

    // Store
    this.commands.set(name, { name, data, execute: wrapped, rawExecute: execute, filePath });
    this.logger.info?.(`Registered command: /${name}`) || console.log(`Registered command: /${name}`);
    return this.commands.get(name);
  }

  wrapExecutor(name, execute, filePath) {
    return async (context) => {
      const interaction = context?.interaction || context;
      const userId = interaction?.user?.id || context?.userId || 'unknown';

      // Rate limit
      if (this.rateLimiter && typeof this.rateLimiter.consume === 'function') {
        try { await this.rateLimiter.consume(userId); }
        catch (e) {
          const msg = 'You are doing that too much. Please slow down.';
          try { await interaction?.reply?.({ content: msg, ephemeral: true }); } catch {}
          return;
        }
      }

      // Cooldown per command
      const now = Date.now();
      let bucket = this.cooldowns.get(name);
      if (!bucket) { bucket = new Map(); this.cooldowns.set(name, bucket); }
      const last = bucket.get(userId) || 0;
      if (now - last < this.cooldownMs) {
        const wait = Math.ceil((this.cooldownMs - (now - last)) / 1000);
        const msg = `⏳ Please wait ${wait}s before using \`/${name}\` again.`;
        try { await interaction?.reply?.({ content: msg, ephemeral: true }); } catch {}
        return;
      }
      bucket.set(userId, now);

      // Run command
      try {
        const logger = getLogger(`cmd:${name}`);
        const cfg = (ConfigMod && ConfigMod.default) ? ConfigMod.default : ConfigMod;
        const ctx = { client: this.client, logger, config: cfg, filePath };

        // Execute supports two common shapes:
        // 1) execute({ interaction, client, ctx })
        // 2) execute(interaction, client, ctx)
        if (execute.length >= 1) {
          return await execute({ interaction, client: this.client, ctx });
        }
        return await execute(interaction, this.client, ctx);
      } catch (err) {
        this.logger.error?.(`Error in /${name} (${filePath})`, err) || console.error(`Error in /${name} (${filePath})`, err);
        try { await interaction?.reply?.({ content: '❌ Command failed. Please try again.', ephemeral: true }); } catch {}
      }
    };
  }

  deriveNameFromFilename(filePath) {
    const base = nodePath.basename(filePath, '.js');
    return base; // keep dashes intact, e.g., pvp-raid-history
  }

  // Optional: register slash commands with Discord REST.
  async registerSlashCommands() {
    const token = process.env.DISCORD_TOKEN;
    const appId = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.GUILD_ID || null;

    if (!token || !appId) {
      this.logger.warn?.('Skipping slash registration: DISCORD_TOKEN or CLIENT_ID missing.') || console.warn('Skipping slash registration: DISCORD_TOKEN or CLIENT_ID missing.');
      return;
    }

    const body = [];
    for (const cmd of this.commands.values()) {
      if (cmd.data?.toJSON) body.push(cmd.data.toJSON());
      else if (typeof cmd.data === 'object') body.push(cmd.data);
    }

    let REST = null, Routes = null;
    try {
      const dj = require('discord.js');
      if (dj?.REST && dj?.Routes) {
        REST = dj.REST;
        Routes = dj.Routes;
      }
    } catch {}

    if (!REST || !Routes) {
      try {
        REST = require('@discordjs/rest').REST;
        Routes = require('discord-api-types/v10').Routes;
      } catch {
        this.logger.info?.('REST libs not installed; skipping slash registration.') || console.log('REST libs not installed; skipping slash registration.');
        return;
      }
    }

    const rest = new REST({ version: '10' }).setToken(token);
    try {
      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
        this.logger.info?.(`Registered ${body.length} guild commands for guild ${guildId}.`) || console.log(`Registered ${body.length} guild commands for guild ${guildId}.`);
      } else {
        await rest.put(Routes.applicationCommands(appId), { body });
        this.logger.info?.(`Registered ${body.length} global commands.`) || console.log(`Registered ${body.length} global commands.`);
      }
    } catch (err) {
      this.logger.error?.('Slash registration failed:', err) || console.error('Slash registration failed:', err);
    }
  }
}

module.exports = CommandManager;
module.exports.CommandManager = CommandManager;
module.exports.default = CommandManager;
