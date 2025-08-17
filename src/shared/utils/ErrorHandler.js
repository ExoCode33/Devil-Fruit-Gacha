// src/utils/ErrorHandler.js - Professional Error Handling
const Logger = require('./Logger');
const { EmbedBuilder } = require('discord.js');

class ErrorHandler {
    constructor() {
        this.logger = new Logger('ERROR_HANDLER');
        this.errorCodes = {
            'INSUFFICIENT_BERRIES': {
                message: 'You don\'t have enough berries for this action.',
                emoji: '💸'
            },
            'USER_NOT_FOUND': {
                message: 'User not found in the database.',
                emoji: '❓'
            },
            'FRUIT_NOT_FOUND': {
                message: 'Devil Fruit not found.',
                emoji: '🍈'
            },
            'COOLDOWN_ACTIVE': {
                message: 'This action is on cooldown.',
                emoji: '⏰'
            },
            'PERMISSION_DENIED': {
                message: 'You don\'t have permission to do this.',
                emoji: '🚫'
            },
            'DATABASE_ERROR': {
                message: 'A database error occurred. Please try again.',
                emoji: '🗄️'
            },
            'NETWORK_ERROR': {
                message: 'A network error occurred. Please check your connection.',
                emoji: '🌐'
            }
        };
    }
    
    async handleCommandError(interaction, error) {
        const errorId = Date.now().toString(36);
        this.logger.error(`Command Error [${errorId}]:`, {
            command: interaction.commandName,
            user: interaction.user.tag,
            guild: interaction.guild?.name || 'DM',
            error: error.stack
        });
        
        const errorEmbed = this.createErrorEmbed(error, errorId);
        
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (replyError) {
            this.logger.error('Failed to send error message:', replyError);
        }
    }
    
    createErrorEmbed(error, errorId) {
        const errorInfo = this.errorCodes[error.code] || {
            message: 'An unexpected error occurred.',
            emoji: '❌'
        };
        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`${errorInfo.emoji} Error`)
            .setDescription(error.userMessage || errorInfo.message)
            .setFooter({ text: `Error ID: ${errorId}` })
            .setTimestamp();
        
        if (process.env.NODE_ENV === 'development') {
            embed.addFields({
                name: 'Debug Info',
                value: `\`\`\`${error.message}\`\`\``,
                inline: false
            });
        }
        
        return embed;
    }
    
    handleUnhandledRejection(reason, promise) {
        this.logger.error('Unhandled Promise Rejection:', {
            reason: reason?.stack || reason,
            promise: promise
        });
    }
    
    handleUncaughtException(error) {
        this.logger.error('Uncaught Exception:', {
            error: error.stack,
            message: error.message
        });
    }
    
    createCustomError(code, message, userMessage) {
        const error = new Error(message);
        error.code = code;
        error.userMessage = userMessage;
        return error;
    }
}

module.exports = new ErrorHandler();
