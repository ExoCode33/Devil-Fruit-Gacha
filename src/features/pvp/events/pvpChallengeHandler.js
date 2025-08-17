// src/features/pvp/events/pvpChallengeHandler.js - CLEAN: PvP Challenge Handler
const Logger = require('../../../shared/utils/Logger');
const DatabaseManager = require('../../../shared/db/DatabaseManager');

const logger = new Logger('PVP_HANDLER');

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute({ client }, interaction) {
        try {
            // Only handle PvP button interactions
            if (!interaction.isButton() || !interaction.customId.startsWith('pvp:')) {
                return;
            }

            const [, action, raidId] = interaction.customId.split(':');
            const userId = interaction.user.id;

            logger.info(`PvP action: ${action} for raid ${raidId} by ${interaction.user.tag}`);

            switch (action) {
                case 'accept':
                    await this.handleAccept(interaction, raidId, userId);
                    break;
                    
                case 'decline':
                    await this.handleDecline(interaction, raidId, userId);
                    break;
                    
                default:
                    await interaction.reply({
                        content: `❓ Unknown PvP action: ${action}`,
                        ephemeral: true
                    });
            }

        } catch (error) {
            logger.error('PvP handler error:', error);
            
            const errorMessage = {
                content: '❌ An error occurred processing your PvP action.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    async handleAccept(interaction, raidId, userId) {
        try {
            // Update raid status
            await DatabaseManager.query(
                'UPDATE raids SET status = $1, accepted_at = NOW(), defender_id = $2 WHERE id = $3',
                ['accepted', userId, raidId]
            );

            await interaction.reply({
                content: `✅ **${interaction.user.username}** accepted the PvP challenge!`,
                ephemeral: false
            });

            logger.info(`Challenge ${raidId} accepted by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Error accepting challenge:', error);
            throw error;
        }
    },

    async handleDecline(interaction, raidId, userId) {
        try {
            // Update raid status
            await DatabaseManager.query(
                'UPDATE raids SET status = $1, declined_at = NOW(), declined_by = $2 WHERE id = $3',
                ['declined', userId, raidId]
            );

            await interaction.reply({
                content: `❌ **${interaction.user.username}** declined the PvP challenge.`,
                ephemeral: false
            });

            logger.info(`Challenge ${raidId} declined by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Error declining challenge:', error);
            throw error;
        }
    }
};
