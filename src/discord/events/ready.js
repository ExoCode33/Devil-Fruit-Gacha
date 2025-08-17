// src/discord/events/ready.js
// Logs basic startup info and sets presence.

const Logger = require('../../shared/utils/Logger');
const Config = require('../../shared/config/Config');

const logger = (typeof Logger === 'function') ? new Logger('ready') : (Logger?.child ? Logger.child('ready') : console);

module.exports = {
  name: 'ready',
  once: true,
  /**
   * @param {{ client: import('discord.js').Client, ctx: any }} param0
   */
  async execute({ client, ctx }) {
    const tag = client?.user?.tag || 'bot';
    logger.info?.(`✅ Logged in as ${tag}`) || console.log(`✅ Logged in as ${tag}`);
    try {
      const activity = Config?.PRESENCE_TEXT || '/help | Gacha-Bot';
      const type = Config?.PRESENCE_TYPE || 0; // Playing
      if (client.user?.setPresence) {
        client.user.setPresence({ activities: [{ name: activity, type }], status: 'online' });
      }
    } catch {}
  }
};
