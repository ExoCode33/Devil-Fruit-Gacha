// src/utils/InteractionHandler.js - FIXED: Discord.js v14 Safe Interaction Management
const Logger = require('./Logger');
const { InteractionResponseType, MessageFlags } = require('discord.js');

class InteractionHandler {
    constructor() {
        this.logger = new Logger('INTERACTION_HANDLER');
        this.processedInteractions = new Set();
        this.interactionTimeouts = new Map();
        
        // Cleanup old interactions every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }

    /**
     * Check if interaction is still valid and not expired
     */
    isInteractionValid(interaction) {
        if (!interaction) return false;
        
        // Check if interaction is too old (15 minutes = Discord's limit)
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > 900000) { // 15 minutes
            this.logger.debug('Interaction expired due to age', {
                id: interaction.id,
                age: interactionAge
            });
            return false;
        }
        
        // Check if already processed
        if (this.processedInteractions.has(interaction.id)) {
            this.logger.debug('Interaction already processed', {
                id: interaction.id
            });
            return false;
        }
        
        return true;
    }

    /**
     * FIXED: Safely reply to an interaction with Discord.js v14 flags instead of ephemeral
     */
    async safeReply(interaction, options) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Skipping reply to invalid interaction');
                return false;
            }

            // Mark as processed
            this.processedInteractions.add(interaction.id);

            // FIXED: Convert ephemeral to flags for Discord.js v14
            const fixedOptions = this.fixOptionsForV14(options);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(fixedOptions);
            } else {
                await interaction.reply(fixedOptions);
            }

            return true;

        } catch (error) {
            this.logger.error('Safe reply failed:', {
                error: error.message,
                code: error.code,
                interactionId: interaction.id
            });

            // Try followUp as fallback if reply failed
            if (error.code === 40060 && !interaction.replied) {
                try {
                    const fixedOptions = this.fixOptionsForV14(options);
                    await interaction.followUp(fixedOptions);
                    return true;
                } catch (followUpError) {
                    this.logger.error('Followup also failed:', followUpError.message);
                }
            }

            return false;
        }
    }

    /**
     * FIXED: Safely defer an interaction with Discord.js v14 flags
     */
    async safeDefer(interaction, options = {}) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Skipping defer of invalid interaction');
                return false;
            }

            if (interaction.deferred || interaction.replied) {
                this.logger.debug('Interaction already deferred or replied');
                return true;
            }

            // Mark as processed
            this.processedInteractions.add(interaction.id);

            // FIXED: Convert ephemeral to flags for Discord.js v14
            const fixedOptions = this.fixOptionsForV14(options);

            await interaction.deferReply(fixedOptions);
            return true;

        } catch (error) {
            this.logger.error('Safe defer failed:', {
                error: error.message,
                code: error.code,
                interactionId: interaction.id
            });
            return false;
        }
    }

    /**
     * FIXED: Safely update an interaction with Discord.js v14 flags
     */
    async safeUpdate(interaction, options) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Skipping update of invalid interaction');
                return false;
            }

            // FIXED: Convert ephemeral to flags for Discord.js v14
            const fixedOptions = this.fixOptionsForV14(options);

            await interaction.update(fixedOptions);
            return true;

        } catch (error) {
            this.logger.error('Safe update failed:', {
                error: error.message,
                code: error.code,
                interactionId: interaction.id
            });

            // Try editReply as fallback
            try {
                const fixedOptions = this.fixOptionsForV14(options);
                await interaction.editReply(fixedOptions);
                return true;
            } catch (editError) {
                this.logger.error('Edit reply fallback failed:', editError.message);
            }

            return false;
        }
    }

    /**
     * FIXED: Convert Discord.js v13 ephemeral option to v14 flags
     */
    fixOptionsForV14(options) {
        if (!options || typeof options !== 'object') {
            return options;
        }

        const fixedOptions = { ...options };

        // FIXED: Convert ephemeral boolean to flags for Discord.js v14
        if (options.ephemeral === true) {
            delete fixedOptions.ephemeral;
            fixedOptions.flags = fixedOptions.flags ? 
                fixedOptions.flags | MessageFlags.Ephemeral : 
                MessageFlags.Ephemeral;
        } else if (options.ephemeral === false) {
            delete fixedOptions.ephemeral;
            // Remove ephemeral flag if explicitly set to false
            if (fixedOptions.flags) {
                fixedOptions.flags = fixedOptions.flags & ~MessageFlags.Ephemeral;
            }
        }

        return fixedOptions;
    }

    /**
     * Create a safe message component collector
     */
    createSafeCollector(channel, options = {}) {
        try {
            // Set default timeout if not provided
            if (!options.time) {
                options.time = 300000; // 5 minutes default
            }

            const collector = channel.createMessageComponentCollector(options);

            // Store collector for cleanup
            const collectorId = Date.now().toString() + Math.random().toString(36);
            this.interactionTimeouts.set(collectorId, {
                collector,
                createdAt: Date.now()
            });

            // Auto-cleanup when collector ends
            collector.on('end', () => {
                this.interactionTimeouts.delete(collectorId);
            });

            return collector;

        } catch (error) {
            this.logger.error('Failed to create safe collector:', error);
            throw error;
        }
    }

    /**
     * Handle component interaction safely
     */
    async handleComponentInteraction(interaction, handler) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Ignoring invalid component interaction');
                return false;
            }

            await handler(interaction);
            return true;

        } catch (error) {
            this.logger.error('Component interaction handler failed:', {
                error: error.message,
                customId: interaction.customId,
                interactionId: interaction.id
            });

            // Try to send error response
            try {
                const errorMessage = {
                    content: '❌ An error occurred processing your action. Please try again.',
                    flags: MessageFlags.Ephemeral // FIXED: Use flags instead of ephemeral
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (replyError) {
                this.logger.error('Failed to send error response:', replyError.message);
            }

            return false;
        }
    }

    /**
     * Create safe interaction context
     */
    createContext(interaction) {
        return {
            interaction,
            isValid: () => this.isInteractionValid(interaction),
            safeReply: (options) => this.safeReply(interaction, options),
            safeDefer: (options) => this.safeDefer(interaction, options),
            safeUpdate: (options) => this.safeUpdate(interaction, options)
        };
    }

    /**
     * FIXED: Enhanced permission checking for Discord.js v14
     */
    checkPermissions(interaction, requiredPermissions) {
        if (!interaction.guild) {
            return { hasPermission: false, reason: 'Command only available in servers' };
        }

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return { hasPermission: true };
        }

        const member = interaction.member;
        if (!member) {
            return { hasPermission: false, reason: 'Member not found' };
        }

        // Check if user is guild owner
        if (interaction.user.id === interaction.guild.ownerId) {
            return { hasPermission: true, reason: 'Guild owner' };
        }

        try {
            // Method 1: Use interaction.memberPermissions (Discord.js v14 feature)
            if (interaction.memberPermissions && typeof interaction.memberPermissions.has === 'function') {
                const hasPerms = requiredPermissions.every(perm => 
                    interaction.memberPermissions.has(perm)
                );
                if (hasPerms) {
                    return { hasPermission: true };
                }
            }

            // Method 2: Check if member is GuildMember with permissions
            if (member.permissions && typeof member.permissions.has === 'function') {
                const hasPerms = requiredPermissions.every(perm => 
                    member.permissions.has(perm)
                );
                if (hasPerms) {
                    return { hasPermission: true };
                }
            }

            // Method 3: Handle APIInteractionGuildMember (permissions as string)
            if (typeof member.permissions === 'string') {
                const permissions = BigInt(member.permissions);
                const hasPerms = requiredPermissions.every(perm => {
                    const permFlag = BigInt(perm);
                    return (permissions & permFlag) === permFlag;
                });
                if (hasPerms) {
                    return { hasPermission: true };
                }
            }

            // Method 4: Try to get from guild cache
            const guildMember = interaction.guild.members.cache.get(interaction.user.id);
            if (guildMember && guildMember.permissions && typeof guildMember.permissions.has === 'function') {
                const hasPerms = requiredPermissions.every(perm => 
                    guildMember.permissions.has(perm)
                );
                if (hasPerms) {
                    return { hasPermission: true };
                }
            }

        } catch (error) {
            this.logger.error('Error checking permissions:', error);
        }

        return { 
            hasPermission: false, 
            reason: 'Insufficient permissions' 
        };
    }

    /**
     * FIXED: Safe error response with proper flags
     */
    async sendErrorResponse(interaction, errorMessage, errorId = null) {
        const message = errorId ? 
            `${errorMessage}\n\`Error ID: ${errorId}\`` : 
            errorMessage;

        const options = {
            content: message,
            flags: MessageFlags.Ephemeral // FIXED: Use flags instead of ephemeral
        };

        return await this.safeReply(interaction, options);
    }

    /**
     * FIXED: Safe success response with proper flags
     */
    async sendSuccessResponse(interaction, successMessage, ephemeral = false) {
        const options = {
            content: successMessage
        };

        if (ephemeral) {
            options.flags = MessageFlags.Ephemeral;
        }

        return await this.safeReply(interaction, options);
    }

    /**
     * Cleanup old processed interactions and timeouts
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 1800000; // 30 minutes

        // Clean processed interactions
        const oldInteractions = [];
        this.processedInteractions.forEach(id => {
            // Remove old interaction IDs (Discord snowflakes contain timestamps)
            try {
                const timestamp = (BigInt(id) >> 22n) + 1420070400000n;
                if (now - Number(timestamp) > maxAge) {
                    oldInteractions.push(id);
                }
            } catch (error) {
                // If we can't parse the timestamp, remove it anyway
                oldInteractions.push(id);
            }
        });

        oldInteractions.forEach(id => this.processedInteractions.delete(id));

        // Clean interaction timeouts
        const oldTimeouts = [];
        this.interactionTimeouts.forEach((data, id) => {
            if (now - data.createdAt > maxAge) {
                oldTimeouts.push(id);
                try {
                    data.collector.stop('cleanup');
                } catch (error) {
                    // Ignore errors when stopping collectors
                }
            }
        });

        oldTimeouts.forEach(id => this.interactionTimeouts.delete(id));

        if (oldInteractions.length > 0 || oldTimeouts.length > 0) {
            this.logger.debug(`Cleaned up ${oldInteractions.length} old interactions and ${oldTimeouts.length} old timeouts`);
        }
    }

    /**
     * Force cleanup specific interaction
     */
    forceCleanup(interactionId) {
        this.processedInteractions.delete(interactionId);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            processedInteractions: this.processedInteractions.size,
            activeTimeouts: this.interactionTimeouts.size
        };
    }

    /**
     * FIXED: Validate interaction response options
     */
    validateResponseOptions(options) {
        if (!options || typeof options !== 'object') {
            return { valid: false, error: 'Options must be an object' };
        }

        // Check for deprecated ephemeral usage
        if (options.ephemeral !== undefined && options.flags !== undefined) {
            this.logger.warn('Both ephemeral and flags specified, flags will take precedence');
        }

        // Validate content length
        if (options.content && options.content.length > 2000) {
            return { valid: false, error: 'Content too long (max 2000 characters)' };
        }

        // Validate embeds
        if (options.embeds && Array.isArray(options.embeds)) {
            if (options.embeds.length > 10) {
                return { valid: false, error: 'Too many embeds (max 10)' };
            }
        }

        return { valid: true };
    }

    /**
     * FIXED: Batch reply for multiple interactions
     */
    async batchReply(interactions, options) {
        const results = [];
        const fixedOptions = this.fixOptionsForV14(options);

        for (const interaction of interactions) {
            try {
                const success = await this.safeReply(interaction, fixedOptions);
                results.push({ interaction: interaction.id, success });
            } catch (error) {
                results.push({ 
                    interaction: interaction.id, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        return results;
    }
}

module.exports = new InteractionHandler();
