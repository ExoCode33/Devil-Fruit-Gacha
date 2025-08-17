// src/commands/CommandManager.js - COMPLETE: Discord.js v14 Compatible Version
const fs = require('fs').promises;
const path = require('path');
const { Collection, MessageFlags } = require('discord.js');
const Logger = require('../utils/Logger');
const RateLimiter = require('../utils/RateLimiter');
const InteractionHandler = require('../utils/InteractionHandler');
const Config = require('../config/Config');

class CommandManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger('COMMANDS');
        this.rateLimiter = new RateLimiter();
        this.commandsPath = path.join(__dirname, 'slash');
        this.cooldowns = new Collection();
        this.usage = new Map();
        this.loadedCommands = 0;
    }

    /**
     * Load all commands from the commands directory
     */
    async loadCommands() {
        try {
            this.logger.info('📁 Loading slash commands...');
            
            const commandFiles = await this.getCommandFiles();
            
            for (const filePath of commandFiles) {
                await this.loadCommand(filePath);
            }
            
            this.logger.success(`✅ Successfully loaded ${this.loadedCommands} commands`);
            
        } catch (error) {
            this.logger.error('Failed to load commands:', error);
            throw error;
        }
    }

    /**
     * Get all command files recursively
     */
    async getCommandFiles() {
        const commandFiles = [];
        
        const scanDirectory = async (dir) => {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (item.isFile() && item.name.endsWith('.js')) {
                    commandFiles.push(fullPath);
                }
            }
        };
        
        await scanDirectory(this.commandsPath);
        return commandFiles;
    }

    /**
     * Load a single command file
     */
    async loadCommand(filePath) {
        try {
            // Clear require cache for hot reloading in development
            if (Config.development.hotReload) {
                delete require.cache[require.resolve(filePath)];
            }
            
            const command = require(filePath);
            
            // Validate command structure
            if (!this.validateCommand(command, filePath)) {
                return;
            }
            
            // Add metadata
            command.filePath = filePath;
            command.category = this.getCommandCategory(filePath);
            command.loadedAt = Date.now();
            
            // Set default properties
            this.setCommandDefaults(command);
            
            // Register command
            this.client.commands.set(command.data.name, command);
            this.loadedCommands++;
            
            this.logger.debug(`✅ Loaded command: ${command.data.name} (${command.category})`);
            
        } catch (error) {
            this.logger.error(`Failed to load command from ${filePath}:`, error);
        }
    }

    /**
     * Validate command structure
     */
    validateCommand(command, filePath) {
        const fileName = path.basename(filePath);
        
        if (!command.data) {
            this.logger.warn(`⚠️ Command ${fileName} missing 'data' property`);
            return false;
        }
        
        if (!command.execute) {
            this.logger.warn(`⚠️ Command ${fileName} missing 'execute' function`);
            return false;
        }
        
        if (typeof command.execute !== 'function') {
            this.logger.warn(`⚠️ Command ${fileName} 'execute' is not a function`);
            return false;
        }
        
        if (!command.data.name) {
            this.logger.warn(`⚠️ Command ${fileName} missing name in data`);
            return false;
        }
        
        return true;
    }

    /**
     * Get command category from file path
     */
    getCommandCategory(filePath) {
        const relativePath = path.relative(this.commandsPath, filePath);
        const pathParts = relativePath.split(path.sep);
        
        // If in subdirectory, use directory name as category
        if (pathParts.length > 1) {
            return pathParts[0];
        }
        
        return 'general';
    }

    /**
     * Set default properties for commands
     */
    setCommandDefaults(command) {
        // Set default cooldown
        if (!command.cooldown) {
            command.cooldown = Config.performance.commandCooldown / 1000; // Convert to seconds
        }
        
        // Set default permissions
        if (!command.permissions) {
            command.permissions = [];
        }
        
        // Set default admin only
        if (command.adminOnly === undefined) {
            command.adminOnly = false;
        }
        
        // Set default ephemeral
        if (command.ephemeral === undefined) {
            command.ephemeral = false;
        }
        
        // Set default defer
        if (command.defer === undefined) {
            command.defer = false;
        }
    }

    /**
     * Execute a command with error handling and logging
     */
    async executeCommand(interaction) {
        const commandName = interaction.commandName;
        const command = this.client.commands.get(commandName);
        
        if (!command) {
            this.logger.warn(`Unknown command executed: ${commandName}`);
            return;
        }
        
        const timer = this.logger.time(`Command ${commandName}`);
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        
        try {
            // Check if command is disabled
            if (command.disabled) {
                await InteractionHandler.safeReply(interaction, {
                    content: '❌ This command is currently disabled.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            
            // Check permissions
            if (!await this.checkPermissions(interaction, command)) {
                return;
            }
            
            // Check cooldowns
            if (!await this.checkCooldown(interaction, command)) {
                return;
            }
            
            // Check rate limits
            if (!await this.checkRateLimit(interaction)) {
                return;
            }
            
            // Auto-defer if configured
            if (command.defer && !interaction.replied && !interaction.deferred) {
                await InteractionHandler.safeDefer(interaction, { 
                    flags: command.ephemeral ? MessageFlags.Ephemeral : undefined 
                });
            }
            
            // Record usage
            this.recordUsage(commandName, userId, guildId);
            
            // Execute command
            await command.execute(interaction);
            
            const duration = timer.end();
            
            // Log successful execution
            this.logger.command(userId, commandName, true, duration);
            
            // Record to database with graceful error handling
            await this.recordCommandUsageGraceful(userId, commandName, guildId, true, duration);
            
        } catch (error) {
            const duration = timer.end();
            
            this.logger.error(`Command ${commandName} failed:`, error);
            this.logger.command(userId, commandName, false, duration, error.message);
            
            // Record failed execution with graceful error handling
            await this.recordCommandUsageGraceful(userId, commandName, guildId, false, duration, error.message);
            
            // Send error response
            await this.handleCommandError(interaction, error);
        }
    }

    /**
     * FIXED: Check if user has required permissions using Discord.js v14 methods
     */
    async checkPermissions(interaction, command) {
        const userId = interaction.user.id;
        
        // Check admin only
        if (command.adminOnly) {
            const adminUsers = Config.security.adminUsers;
            if (!adminUsers.includes(userId)) {
                await InteractionHandler.safeReply(interaction, {
                    content: '❌ This command is restricted to administrators only.',
                    flags: MessageFlags.Ephemeral
                });
                
                this.logger.security('Unauthorized admin command attempt', userId, {
                    command: command.data.name,
                    guild: interaction.guildId
                });
                
                return false;
            }
        }
        
        // FIXED: Check Discord permissions using InteractionHandler
        if (command.permissions.length > 0) {
            const permCheck = InteractionHandler.checkPermissions(interaction, command.permissions);
            
            if (!permCheck.hasPermission) {
                await InteractionHandler.safeReply(interaction, {
                    content: `❌ You do not have the required permissions to use this command.\nReason: ${permCheck.reason}`,
                    flags: MessageFlags.Ephemeral
                });
                return false;
            }
        }
        
        // Check moderator roles
        if (command.moderatorOnly && interaction.member) {
            const moderatorRoles = Config.security.moderatorRoles;
            const member = interaction.member;
            
            let hasModRole = false;
            
            // Try different methods to check roles
            if (member.roles) {
                if (member.roles.cache) {
                    // GuildMember object
                    hasModRole = member.roles.cache.some(role => 
                        moderatorRoles.includes(role.id) || moderatorRoles.includes(role.name)
                    );
                } else if (Array.isArray(member.roles)) {
                    // APIInteractionGuildMember object
                    hasModRole = member.roles.some(roleId => moderatorRoles.includes(roleId));
                }
            }
            
            if (!hasModRole && !Config.security.adminUsers.includes(userId)) {
                await InteractionHandler.safeReply(interaction, {
                    content: '❌ This command requires moderator privileges.',
                    flags: MessageFlags.Ephemeral
                });
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check command cooldown
     */
    async checkCooldown(interaction, command) {
        const userId = interaction.user.id;
        const commandName = command.data.name;
        const cooldownTime = (command.cooldown || 3) * 1000;
        
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Collection());
        }
        
        const timestamps = this.cooldowns.get(commandName);
        const now = Date.now();
        
        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId) + cooldownTime;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                
                await InteractionHandler.safeReply(interaction, {
                    content: `⏰ Please wait ${timeLeft.toFixed(1)} more seconds before using \`${commandName}\` again.`,
                    flags: MessageFlags.Ephemeral
                });
                
                return false;
            }
        }
        
        timestamps.set(userId, now);
        
        // Clean up old timestamps
        setTimeout(() => timestamps.delete(userId), cooldownTime);
        
        return true;
    }

    /**
     * Check rate limits
     */
    async checkRateLimit(interaction) {
        const userId = interaction.user.id;
        
        // Skip rate limit for bypass users
        if (Config.security.rateLimitBypass.includes(userId)) {
            return true;
        }
        
        const isLimited = await this.rateLimiter.checkLimit(userId);
        
        if (isLimited) {
            await InteractionHandler.safeReply(interaction, {
                content: '🚫 You are being rate limited. Please slow down and try again later.',
                flags: MessageFlags.Ephemeral
            });
            
            this.logger.security('Rate limit exceeded', userId, {
                guild: interaction.guildId,
                command: interaction.commandName
            });
            
            return false;
        }
        
        return true;
    }

    /**
     * Record command usage statistics
     */
    recordUsage(commandName, userId, guildId) {
        const key = `${commandName}:${userId}`;
        const current = this.usage.get(key) || { count: 0, lastUsed: 0 };
        
        this.usage.set(key, {
            count: current.count + 1,
            lastUsed: Date.now(),
            guildId
        });
    }

    /**
     * Record command usage to database with graceful error handling
     */
    async recordCommandUsageGraceful(userId, commandName, guildId, success, executionTime, errorMessage = null) {
        try {
            // First verify user exists (additional safety check)
            const DatabaseManager = require('../database/DatabaseManager');
            const user = await DatabaseManager.getUser(userId);
            
            if (!user) {
                this.logger.warn(`Cannot record command usage: User ${userId} not found in database`);
                return; // Silently skip recording if user doesn't exist
            }
            
            // Record command usage
            await DatabaseManager.query(`
                INSERT INTO command_usage (user_id, command_name, guild_id, success, execution_time, error_message, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [userId, commandName, guildId, success, executionTime, errorMessage]);
            
            this.logger.debug(`✅ Recorded command usage: ${commandName} by ${userId}`);
            
        } catch (error) {
            // Log the error but don't let it crash the command execution
            this.logger.error('Failed to record command usage (non-fatal):', {
                userId,
                commandName,
                guildId,
                success,
                executionTime,
                errorMessage,
                error: error.message,
                errorCode: error.code,
                constraint: error.constraint
            });
            
            // If it's a foreign key constraint error, log it specially
            if (error.code === '23503' && error.constraint?.includes('user_id_fkey')) {
                this.logger.error('🚨 FOREIGN KEY VIOLATION: User not found in database when recording command usage', {
                    userId,
                    commandName,
                    guildId,
                    constraint: error.constraint,
                    detail: error.detail
                });
            }
        }
    }

    /**
     * FIXED: Handle command errors with proper flags
     */
    async handleCommandError(interaction, error) {
        const errorId = Date.now().toString(36);
        
        this.logger.error(`Command error [${errorId}]:`, {
            command: interaction.commandName,
            user: interaction.user.id,
            guild: interaction.guildId,
            error: error.message,
            stack: error.stack
        });
        
        const errorMessage = Config.isDevelopment 
            ? `❌ Command failed: ${error.message}\n\`Error ID: ${errorId}\``
            : `❌ Something went wrong! Please try again.\n\`Error ID: ${errorId}\``;
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: errorMessage,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await InteractionHandler.safeReply(interaction, {
                    content: errorMessage,
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (responseError) {
            this.logger.error('Failed to send error response:', responseError);
        }
    }

    /**
     * Get command statistics
     */
    getStats() {
        const totalCommands = this.client.commands.size;
        const categoriesCount = {};
        const usageStats = {};
        
        // Count by category
        this.client.commands.forEach(command => {
            const category = command.category || 'unknown';
            categoriesCount[category] = (categoriesCount[category] || 0) + 1;
        });
        
        // Calculate usage stats
        let totalUsage = 0;
        this.usage.forEach((stats, key) => {
            const [commandName] = key.split(':');
            usageStats[commandName] = (usageStats[commandName] || 0) + stats.count;
            totalUsage += stats.count;
        });
        
        return {
            totalCommands,
            totalUsage,
            categoriesCount,
            usageStats,
            loadedAt: Date.now()
        };
    }

    /**
     * Get command usage statistics from database
     */
    async getDatabaseStats(hours = 24) {
        try {
            const result = await this.client.db.query(`
                SELECT 
                    command_name,
                    COUNT(*) as total_uses,
                    COUNT(CASE WHEN success THEN 1 END) as successful_uses,
                    COUNT(CASE WHEN NOT success THEN 1 END) as failed_uses,
                    AVG(execution_time) as avg_execution_time,
                    MAX(execution_time) as max_execution_time
                FROM command_usage 
                WHERE created_at > NOW() - INTERVAL '${hours} hours'
                GROUP BY command_name
                ORDER BY total_uses DESC
            `);
            
            return result.rows;
            
        } catch (error) {
            this.logger.error('Failed to get command statistics:', error);
            return [];
        }
    }

    /**
     * Reload a specific command
     */
    async reloadCommand(commandName) {
        try {
            const command = this.client.commands.get(commandName);
            
            if (!command) {
                throw new Error(`Command ${commandName} not found`);
            }
            
            const filePath = command.filePath;
            
            // Remove from collection
            this.client.commands.delete(commandName);
            
            // Clear require cache
            delete require.cache[require.resolve(filePath)];
            
            // Reload command
            await this.loadCommand(filePath);
            
            this.logger.success(`✅ Reloaded command: ${commandName}`);
            return true;
            
        } catch (error) {
            this.logger.error(`Failed to reload command ${commandName}:`, error);
            return false;
        }
    }

    /**
     * Reload all commands
     */
    async reloadAllCommands() {
        this.logger.info('🔄 Reloading all commands...');
        
        // Clear collections
        this.client.commands.clear();
        this.loadedCommands = 0;
        
        // Clear require cache
        this.clearRequireCache();
        
        // Reload commands
        await this.loadCommands();
        
        this.logger.success('✅ All commands reloaded');
    }

    /**
     * Clear require cache for hot reloading
     */
    clearRequireCache() {
        Object.keys(require.cache).forEach(key => {
            if (key.includes(this.commandsPath)) {
                delete require.cache[key];
            }
        });
    }

    /**
     * Get command by name
     */
    getCommand(name) {
        return this.client.commands.get(name);
    }

    /**
     * Get commands by category
     */
    getCommandsByCategory(category) {
        return Array.from(this.client.commands.values())
            .filter(command => command.category === category);
    }

    /**
     * Get all categories
     */
    getCategories() {
        const categories = new Set();
        this.client.commands.forEach(command => {
            categories.add(command.category || 'general');
        });
        return Array.from(categories);
    }

    /**
     * Enable/disable command
     */
    setCommandStatus(commandName, enabled) {
        const command = this.client.commands.get(commandName);
        if (command) {
            command.disabled = !enabled;
            this.logger.info(`Command ${commandName} ${enabled ? 'enabled' : 'disabled'}`);
            return true;
        }
        return false;
    }

    /**
     * Create safe command context
     */
    createCommandContext(interaction) {
        return InteractionHandler.createContext(interaction);
    }

    /**
     * Validate command execution environment
     */
    validateExecutionEnvironment(interaction, command) {
        // Check if command can be used in DMs
        if (!interaction.guild && command.guildOnly) {
            return {
                valid: false,
                reason: 'This command can only be used in servers'
            };
        }

        // Check if command requires specific channel types
        if (command.channelTypes && interaction.channel) {
            if (!command.channelTypes.includes(interaction.channel.type)) {
                return {
                    valid: false,
                    reason: `This command can only be used in ${command.channelTypes.join(', ')} channels`
                };
            }
        }

        // Check if bot has required permissions
        if (command.botPermissions && interaction.guild) {
            const botMember = interaction.guild.members.me;
            if (botMember && !botMember.permissions.has(command.botPermissions)) {
                return {
                    valid: false,
                    reason: 'Bot is missing required permissions for this command'
                };
            }
        }

        return { valid: true };
    }
}

module.exports = CommandManager;
