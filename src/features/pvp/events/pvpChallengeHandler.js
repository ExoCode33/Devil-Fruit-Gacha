// src/features/pvp/events/pvpChallengeHandler.js
// Handles PvP challenge button/select interactions.

const Logger = require('../../../shared/utils/Logger');
const Config = require('../../../shared/config/Config');
const { pool } = require('../../../shared/db/DatabaseManager');
const Constants = require('../../../shared/constants/Constants');
// Cross-feature data/services
const DevilFruitSkills = require('../../gacha/data/DevilFruitSkills');
let SkillEffectService;
try { SkillEffectService = require('../../combat/app/SkillEffectService'); } catch {}

const logger = (typeof Logger === 'function') ? new Logger('pvpChallengeHandler') : (Logger?.child ? Logger.child('pvpChallengeHandler') : console);

module.exports = {
  name: 'interactionCreate',
  once: false,

  /**
   * @param {{ client: import('discord.js').Client, ctx: any }} param0
   * @param {import('discord.js').Interaction} interaction
   */
  async execute({ client, ctx }, interaction) {
    try {
      if (!interaction || !interaction.isButton || !interaction.isButton()) return;
      const id = interaction.customId || '';
      if (!id.startsWith('pvp:')) return; // not a PvP interaction

      // Example: pvp:accept:<raidId>
      const parts = id.split(':');
      const action = parts[1] || 'unknown';
      const raidId = parts[2] || null;

      if (action === 'accept') {
        // (Placeholder) load raid from DB and mark accepted
        try {
          if (pool?.query) {
            await pool.query('UPDATE raids SET accepted = true WHERE id = $1', [raidId]);
          }
        } catch (e) { logger.warn?.('DB update failed', e); }

        try { await interaction.reply({ content: '✅ Challenge accepted!', ephemeral: true }); } catch {}
        return;
      }

      if (action === 'decline') {
        try { await interaction.reply({ content: '❌ Challenge declined.', ephemeral: true }); } catch {}
        return;
      }

      // Fallback action
      try { await interaction.reply({ content: '🤔 Unknown PvP action.', ephemeral: true }); } catch {}
    } catch (err) {
      logger.error?.('pvpChallengeHandler error:', err) || console.error('pvpChallengeHandler error:', err);
      try { await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }); } catch {}
    }
  }
};
