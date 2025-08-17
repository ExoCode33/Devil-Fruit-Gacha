// src/discord/client/EventManager.js
// Loads and wires Discord client events from both core and feature modules.
// Compatible with the new folder structure and tolerant of different export shapes.

const path = require('path');
const fs = require('fs').promises;

// Shared logger/config (new locations)
let LoggerMod;
try { LoggerMod = require('../../shared/utils/Logger'); } catch { LoggerMod = null; }
let ConfigMod;
try { ConfigMod = require('../../shared/config/Config'); } catch { ConfigMod = {}; }

function getLogger(scope = 'EventManager') {
  // Try a few common logger shapes; fall back to console
  if (!LoggerMod) return console;
  try {
    if (typeof LoggerMod === 'function') return new LoggerMod(scope);
    if (LoggerMod?.child) return LoggerMod.child(scope);
    return LoggerMod;
  } catch {
    return console;
  }
}

class EventManager {
  constructor(client) {
    this.client = client;
    this.logger = getLogger('EventManager');
    this.loadedEvents = [];

    // Scan both the discord-level events and feature-scoped events
    this.eventsPaths = [
      path.join(process.cwd(), 'src', 'discord', 'events'),
      path.join(process.cwd(), 'src', 'features'),
    ];
  }

  async register() { return this.initialize(); } // alias
  async load() { return this.initialize(); }     // alias

  async initialize() {
    const files = await this.collectEventFiles();
    const results = [];
    for (const filePath of files) {
      const category = filePath.includes(`${path.sep}discord${path.sep}events`) ? 'client' : 'feature';
      try {
        const ev = await this.loadEvent(filePath, category);
        if (ev) results.push(ev);
      } catch (err) {
        this.logger.error?.('Failed to load event from', filePath, err) || console.error('Failed to load event from', filePath, err);
      }
    }
    this.loadedEvents = results;
    this.logger.info?.(`Loaded ${results.length} event handler(s).`) || console.log(`Loaded ${results.length} event handler(s).`);
    return results;
  }

  async collectEventFiles() {
    const found = [];
    const walk = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const it of items) {
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
          await walk(full);
        } else if (it.isFile() && it.name.endsWith('.js') && full.includes(`${path.sep}events${path.sep}`)) {
          found.push(full);
        }
      }
    };
    for (const base of this.eventsPaths) {
      await walk(base);
    }
    return found;
  }

  async loadEvent(filePath, category) {
    // Clear require cache to allow reloads during dev
    try {
      delete require.cache[require.resolve(filePath)];
    } catch {}

    const mod = require(filePath);
    const exported = mod && mod.default ? mod.default : mod;

    // Normalize to a common shape
    let name, once = false, handler;

    if (exported && typeof exported === 'object' && (exported.execute || exported.run)) {
      name = exported.name || this.deriveNameFromFilename(filePath);
      once = Boolean(exported.once);
      handler = exported.execute || exported.run;
    } else if (typeof exported === 'function') {
      name = this.deriveNameFromFilename(filePath);
      handler = exported;
    } else {
      this.logger.warn?.(`Skipping ${filePath} (no recognizable export).`) || console.warn(`Skipping ${filePath} (no recognizable export).`);
      return null;
    }

    if (!name) name = this.deriveNameFromFilename(filePath);

    // Attach to Discord client
    const wrapped = (...args) => {
      const ctx = { config: ConfigMod || {}, logger: this.logger, category, filePath };
      try {
        // Prefer the modern shape: execute({ client, ctx }, ...args)
        if (handler.length >= 1) {
          return handler({ client: this.client, ctx }, ...args);
        }
        // Fallback: execute(client, ...args)
        return handler(this.client, ...args);
      } catch (err) {
        this.logger.error?.(`Error in event "${name}" (${filePath}):`, err) || console.error(`Error in event "${name}" (${filePath}):`, err);
      }
    };

    if (once) {
      this.client.once(name, wrapped);
    } else {
      this.client.on(name, wrapped);
    }

    this.logger.info?.(`Registered ${category} event: ${name}`) || console.log(`Registered ${category} event: ${name}`);
    return { name, category, filePath, once };
  }

  deriveNameFromFilename(filePath) {
    const base = path.basename(filePath, '.js');
    // Common event file names already match Discord event names (e.g., ready, interactionCreate)
    return base;
  }
}

module.exports = EventManager;
module.exports.EventManager = EventManager;
module.exports.default = EventManager;
