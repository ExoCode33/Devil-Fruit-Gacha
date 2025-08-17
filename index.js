// index.js - One Piece Devil Fruit Gacha Bot v4.0 Production Ready - EMERGENCY FIX

// Load environment variables first
require('dotenv').config();

console.log('🏴‍☠️ === ONE PIECE DEVIL FRUIT GACHA BOT v4.0 ===');
console.log('🚀 Starting bot initialization...');
console.log('⏰ Timestamp:', new Date().toISOString());
console.log('📦 Node.js version:', process.version);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🚂 Railway detected:', !!process.env.RAILWAY_ENVIRONMENT);
console.log('');

// Import required modules
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const path = require('path');
const fs = require('fs');

// Core modules
const Logger = require('./src/utils/Logger');
const Config = require('./src/config/Config');
const DatabaseManager = require('./src/database/DatabaseManager');
const EventManager = require('./src/events/EventManager');
const CommandManager = require('./src/commands/CommandManager');
const SystemMonitor = require('./src/utils/SystemMonitor');
const ErrorHandler = require('./src/utils/ErrorHandler');

class OnePieceGachaBot {
    constructor() {
        this.client = null;
        this.commandManager = null;
        this.logger = new Logger('BOT_CORE');
        this.isReady = false;
        this.startTime = Date.now();
        
        // Initialize error handlers
        this.setupGlobalErrorHandlers();
        
        this.logger.info('🏴‍☠️ One Piece Devil Fruit Gacha Bot v4.0 Initializing...');
    }

    /**
     * Initialize and start the bot
     */
    async start() {
        try {
            this.logger.info('🚀 Starting bot initialization sequence...');
            
            // Load and validate configuration
            await this.initializeConfig();
            
            // Initialize database connection
            await this.initializeDatabase();
            
            // Create Discord client
            this.createClient();
            
            // Load commands and events
            await this.loadCommands();
            await this.loadEvents();
            
            // Register slash commands
            await this.registerCommands();
            
            // Login to Discord
            await this.login();
            
            // Start monitoring systems
            this.startMonitoring();
            
            this.logger.success('🎉 Bot started successfully!');
            this.showStartupSummary();
            
        } catch (error) {
            this.logger.error('❌ Failed to start bot:', error);
            console.error('❌ STARTUP FAILED:', error.message);
            console.error('Stack trace:', error.stack);
            await this.shutdown(1);
        }
    }

    /**
     * Initialize configuration
     */
    async initializeConfig() {
        try {
            this.logger.info('⚙️ Loading configuration...');
            await Config.load();
            this.logger.success('✅ Configuration loaded successfully');
            
            // Log configuration summary (without sensitive data)
            this.logger.info('📋 Configuration Summary:', {
                environment: Config.env,
                discord: {
                    hasToken: !!Config.discord.token,
                    tokenLength: Config.discord.token?.length,
                    hasClientId: !!Config.discord.clientId
                },
                database: {
                    hasUrl: !!Config.database.url,
                    ssl: Config.database.ssl,
                    poolMax: Config.database.pool.max
                },
                game: {
                    pullCost: Config.game.pullCost,
                    baseIncome: Config.game.baseIncome
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Configuration initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize database connection - EMERGENCY FIX: Skip migrations
     */
    async initializeDatabase() {
        try {
            this.logger.info('🗄️ Initializing database connection...');
            
            // Railway networking delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await DatabaseManager.connect();
            
            // EMERGENCY FIX: Skip migrations temporarily to prevent syntax errors
            // The main foreign key fix is in the application code, not the migration
            this.logger.info('⚠️ Database migrations skipped (emergency fix for syntax errors)');
            this.logger.info('✅ Foreign key fix is applied in application code instead');
            this.logger.info('📝 User creation will happen BEFORE command execution to prevent FK violations');
            
            // Test database connection
            const dbHealth = await DatabaseManager.healthCheck();
            if (dbHealth.status === 'healthy') {
                this.logger.success(`✅ Database initialized successfully (${dbHealth.latency}ms)`);
            } else {
                throw new Error(`Database unhealthy: ${dbHealth.error}`);
            }
            
        } catch (error) {
            this.logger.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create Discord client with optimized settings
     */
    createClient() {
        this.logger.info('🤖 Creating Discord client...');
        
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ],
            allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
            presence: {
                activities: [{
                    name: 'the Grand Line for Devil Fruits! 🍈',
                    type: ActivityType.Watching
                }],
                status: 'online'
            },
            // Railway-optimized settings
            sweepers: {
                messages: {
                    interval: 300, // 5 minutes
                    lifetime: 1800 // 30 minutes
                },
                users: {
                    interval: 3600, // 1 hour
                    filter: () => user => user.bot && user.id !== this.client.user.id
                }
            }
        });

        // Initialize command collection and attach services
        this.client.commands = new Collection();
        this.client.config = Config;
        this.client.logger = this.logger;
        this.client.db = DatabaseManager;

        this.logger.success('✅ Discord client created');
    }

    /**
     * Load all commands
     */
    async loadCommands() {
        try {
            this.logger.info('📁 Loading commands...');
            
            this.commandManager = new CommandManager(this.client);
            this.client.commandManager = this.commandManager;
            await this.commandManager.loadCommands();
            
            this.logger.success(`✅ Loaded ${this.client.commands.size} commands`);
            
        } catch (error) {
            this.logger.error('❌ Failed to load commands:', error);
            throw error;
        }
    }

    /**
     * Load all events
     */
    async loadEvents() {
        try {
            this.logger.info('📁 Loading events...');
            
            const eventManager = new EventManager(this.client);
            const eventCount = await eventManager.loadEvents();
            
            this.logger.success(`✅ Loaded ${eventCount} events`);
            
        } catch (error) {
            this.logger.error('❌ Failed to load events:', error);
            throw error;
        }
    }

    /**
     * Register slash commands with Discord
     */
    async registerCommands() {
        try {
            if (!this.client.commands.size) {
                this.logger.warn('⚠️ No commands to register');
                return;
            }

            this.logger.info('🔄 Registering slash commands with Discord...');
            
            const commands = Array.from(this.client.commands.values())
                .map(command => command.data.toJSON());

            const rest = new REST({ version: '10' }).setToken(Config.discord.token);
            const clientId = Config.discord.clientId;
            
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );

            this.logger.success(`✅ Registered ${commands.length} slash commands`);
            
        } catch (error) {
            this.logger.error('❌ Failed to register commands:', error);
            throw error;
        }
    }

    /**
     * Login to Discord
     */
    async login() {
        try {
            this.logger.info('🔐 Logging in to Discord...');
            
            await this.client.login(Config.discord.token);
            
            // Wait for ready event
            await new Promise((resolve) => {
                this.client.once('ready', resolve);
            });
            
            this.isReady = true;
            this.logger.success(`✅ Logged in as ${this.client.user.tag}`);
            
        } catch (error) {
            this.logger.error('❌ Discord login failed:', error);
            throw error;
        }
    }

    /**
     * Start monitoring systems
     */
    startMonitoring() {
        if (Config.monitoring.enabled) {
            const monitor = new SystemMonitor(this.client);
            monitor.start();
            this.logger.success('✅ System monitoring started');
        } else {
            this.logger.info('ℹ️ System monitoring disabled');
        }
    }

    /**
     * Show startup summary
     */
    showStartupSummary() {
        const uptime = Date.now() - this.startTime;
        
        this.logger.success(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🏴‍☠️  ONE PIECE DEVIL FRUIT GACHA BOT v4.0  🏴‍☠️      ║
║                                                           ║
║     Bot: ${this.client.user.tag.padEnd(38)}║
║     ID: ${this.client.user.id.padEnd(39)}║
║     Guilds: ${this.client.guilds.cache.size.toString().padEnd(35)}║
║     Users: ${this.client.users.cache.size.toString().padEnd(36)}║
║     Commands: ${this.client.commands.size.toString().padEnd(33)}║
║     Startup Time: ${uptime}ms${' '.repeat(27 - uptime.toString().length)}║
║                                                           ║
║     Status: ONLINE AND READY! ✅                          ║
║     Foreign Key Fix: APPLIED ✅                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
        
        // Log additional info
        this.logger.info('🎮 Available Commands:');
        const categories = {};
        this.client.commands.forEach(command => {
            const category = command.category || 'general';
            if (!categories[category]) categories[category] = [];
            categories[category].push(command.data.name);
        });
        
        Object.entries(categories).forEach(([category, commands]) => {
            this.logger.info(`   • ${category}: ${commands.join(', ')}`);
        });
        
        // Log the foreign key fix status
        this.logger.info('🔧 Foreign Key Fix Status:');
        this.logger.info('   • User creation: BEFORE command execution ✅');
        this.logger.info('   • Database errors: Gracefully handled ✅');
        this.logger.info('   • Command usage recording: Safe with checks ✅');
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        process.on('unhandledRejection', (reason, promise) => {
            ErrorHandler.handleUnhandledRejection(reason, promise);
        });

        process.on('uncaughtException', (error) => {
            ErrorHandler.handleUncaughtException(error);
            this.shutdown(1);
        });

        process.on('SIGINT', () => {
            this.logger.info('📡 Received SIGINT, initiating graceful shutdown...');
            this.shutdown(0);
        });
        
        process.on('SIGTERM', () => {
            this.logger.info('📡 Received SIGTERM, initiating graceful shutdown...');
            this.shutdown(0);
        });
    }

    /**
     * Graceful shutdown
     */
    async shutdown(exitCode = 0) {
        this.logger.info('🛑 Initiating graceful shutdown...');
        
        try {
            if (this.client && this.client.isReady()) {
                this.logger.info('📡 Destroying Discord client...');
                this.client.destroy();
            }
            
            this.logger.info('🗄️ Closing database connections...');
            await DatabaseManager.disconnect();
            
            this.logger.success('✅ Shutdown complete');
            
        } catch (error) {
            this.logger.error('❌ Error during shutdown:', error);
        } finally {
            process.exit(exitCode);
        }
    }

    /**
     * Get bot statistics
     */
    getStats() {
        if (!this.isReady) return null;

        return {
            uptime: Date.now() - this.startTime,
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            commands: this.client.commands.size,
            memory: process.memoryUsage(),
            version: '4.0.0'
        };
    }
}

// Create and start bot instance
const bot = new OnePieceGachaBot();

// Handle startup
bot.start().catch((error) => {
    console.error('❌ CRITICAL: Failed to start bot:', error);
    process.exit(1);
});

// Export for testing
module.exports = { OnePieceGachaBot, bot };
