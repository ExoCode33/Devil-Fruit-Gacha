// src/discord/events/interactionCreate.js
// New-structure compatible interaction entrypoint.
// Uses shared Logger / ErrorHandler / InteractionHandler / Config.

const Logger = require('../../shared/utils/Logger');
let ErrorHandler;
try { ErrorHandler = require('../../shared/utils/ErrorHandler'); } catch { ErrorHandler = null; }
let InteractionHandler;
try { InteractionHandler = require('../../shared/utils/InteractionHandler'); } catch { InteractionHandler = null; }
const Config = require('../../shared/config/Config');

const logger = (typeof Logger === 'function') ? new Logger('interactionCreate') : (Logger?.child ? Logger.child('interactionCreate') : console);

module.exports = {
  name: 'interactionCreate',
  once: false,

  /**
   * @param {{ client: import('discord.js').Client, ctx: any }} param0
   * @param {import('discord.js').Interaction} interaction
   */
  async execute({ client, ctx }, interaction) {
    try {
      // Slash commands
      if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
        const cmdName = interaction.commandName;
        const command = client.commands?.get(cmdName);
        if (!command) {
          try { await interaction.reply({ content: '❓ Unknown command.', ephemeral: true }); } catch {}
          return;
        }
        return await command.execute({ interaction, client, ctx });
      }

      // Context menu (if any)
      if (interaction.isContextMenuCommand && interaction.isContextMenuCommand()) {
        const cmdName = interaction.commandName;
        const command = client.commands?.get(cmdName);
        if (command) return await command.execute({ interaction, client, ctx });
        return;
      }

      // Buttons / Selects routed via shared InteractionHandler if present
      if ((interaction.isButton && interaction.isButton()) || (interaction.isAnySelectMenu && interaction.isAnySelectMenu())) {
        if (InteractionHandler && typeof InteractionHandler.handle === 'function') {
          return await InteractionHandler.handle({ interaction, client, ctx });
        }
        // Fallback: no-op
        return;
      }
    } catch (err) {
      logger.error?.('interactionCreate error:', err) || console.error('interactionCreate error:', err);
      // Shared error handler preferred
      if (ErrorHandler && typeof ErrorHandler.notify === 'function') {
        try { await ErrorHandler.notify(err, { where: 'interactionCreate', interaction }); } catch {}
      }
      try {
        if (interaction && !interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
        }
      } catch {}
    }
  }
};
