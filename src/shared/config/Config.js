// src/config/Config.js - UPDATED: Added STARTING_BERRIES and FULL_INCOME configuration
const path = require('path');
const fs = require('fs');

class ConfigManager {
    constructor() {
        this.config = {};
        this.isLoaded = false;
        this.environment = process.env.NODE_ENV || 'production';
    }

    async load() {
        try {
            console.log('🔍 === CPU-OPTIMIZED CONFIG LOADING (FIXED) ===');
            console.log('Starting LIGHTWEIGHT configuration load...');
            console.log('Timestamp:', new Date().toISOString());
            console.log('Environment:', this.environment);
            console.log('');
            
            // Load config files first (optional)
            await this.loadOptionalConfigs();
            
            // Load environment variables LAST to override
            this.loadEnvironmentVariables();
            
            // Simple validation
            this.validateConfig();
            
            this.isLoaded = true;
            console.log('✅ CPU-optimized configuration loaded');
            console.log('🔍 === CONFIG LOADING COMPLETE ===');
            
        } catch (error) {
            console.log('❌ Configuration loading failed:', error.message);
            throw new Error(`Configuration loading failed: ${error.message}`);
        }
    }

    loadEnvironmentVariables() {
        console.log('🔍 === RAILWAY ENVIRONMENT LOADING (OPTIMIZED) ===');
        
        // Discord Configuration - Required
        const discordToken = process.env.DISCORD_TOKEN;
        const discordClientId = process.env.DISCORD_CLIENT_ID;
        
        if (!discordToken) {
            throw new Error('DISCORD_TOKEN environment variable is required');
        }
        
        this.config.discord = {
            token: discordToken.trim(),
            clientId: discordClientId || this.extractClientIdFromToken(discordToken),
            guildId: process.env.DISCORD_GUILD_ID || null
        };

        // Database Configuration - Required
        const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL environment variable is required');
        }
        
        // RAILWAY-OPTIMIZED DATABASE SETTINGS (FIXED)
        this.config.database = {
            url: databaseUrl.trim(),
            ssl: this.environment === 'production',
            pool: {
                min: 1,                    // Reduced from 2
                max: 8,                    // Increased from 5 to 8 for stability
                acquireTimeoutMillis: 20000,  // Increased from 15000
                createTimeoutMillis: 15000,   // Increased from 10000
                destroyTimeoutMillis: 5000,   // Kept same
                idleTimeoutMillis: 30000,     // Increased from 20000
                reapIntervalMillis: 10000,    // Increased from 5000
                createRetryIntervalMillis: 500  // Reduced from 1000
            }
        };

        // FIXED PERFORMANCE SETTINGS
        this.config.performance = {
            commandCooldown: parseInt(process.env.COMMAND_COOLDOWN) || 3000,  // Reduced from 5000
            rateLimit: {
                window: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
                max: parseInt(process.env.RATE_LIMIT_MAX) || 30  // Increased from 15
            },
            cacheSize: parseInt(process.env.CACHE_SIZE) || 500,      // Increased from 100
            cacheTTL: parseInt(process.env.CACHE_TTL) || 300000      // Reduced from 600000
        };

        // FIXED MONITORING (Enable for debugging)
        this.config.monitoring = {
            enabled: process.env.MONITORING_ENABLED !== 'false',  // Default TRUE for debugging
            interval: parseInt(process.env.MONITORING_INTERVAL) || 120000,  // 2 minutes
            alertThresholds: {
                memory: parseInt(process.env.ALERT_MEMORY_THRESHOLD) || 256,  // Increased
                cpu: parseInt(process.env.ALERT_CPU_THRESHOLD) || 70,         // Increased from 50
                latency: parseInt(process.env.ALERT_LATENCY_THRESHOLD) || 2000 // Increased
            }
        };

        // FIXED LOGGING (Enable info level for debugging)
        this.config.logging = {
            level: process.env.LOG_LEVEL || 'info',  // CHANGED from 'warn' to 'info'
            console: process.env.LOG_CONSOLE !== 'false',
            file: process.env.LOG_FILE === 'true',  // Allow file logging if requested
            filePath: process.env.LOG_FILE_PATH || './logs',
            maxFiles: 5,  // Reduced from 3
            maxSize: '10m' // Increased from 5m
        };

        // UPDATED GAME CONFIGURATION - FIXED INCOME SYSTEM
        this.config.game = {
            pullCost: parseInt(process.env.PULL_COST) || 1000,
            
            // REMOVED: Old CP-based income settings
            // baseIncome: parseInt(process.env.BASE_INCOME) || 50,
            // incomeRate: parseFloat(process.env.INCOME_RATE) || 0.1,
            
            // NEW: Fruit-based income system
            startingBerries: parseInt(process.env.STARTING_BERRIES) || 5000,    // NEW: Starting money for new users
            fullIncome: parseInt(process.env.FULL_INCOME) || 6250,              // NEW: Full hourly income (5+ fruits)
            
            // Kept existing settings
            manualIncomeMultiplier: parseFloat(process.env.MANUAL_INCOME_MULTIPLIER) || 6,
            manualIncomeCooldown: parseInt(process.env.MANUAL_INCOME_COOLDOWN) || 60,
            autoIncomeInterval: parseInt(process.env.AUTO_INCOME_INTERVAL) || 10,
            maxStoredHours: parseInt(process.env.MAX_STORED_HOURS) || 24
        };

        // SECURITY (minimal)
        this.config.security = {
            adminUsers: process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [],
            moderatorRoles: process.env.MODERATOR_ROLES ? process.env.MODERATOR_ROLES.split(',').map(id => id.trim()) : [],
            rateLimitBypass: process.env.RATE_LIMIT_BYPASS ? process.env.RATE_LIMIT_BYPASS.split(',').map(id => id.trim()) : []
        };

        // DEVELOPMENT (enable for debugging)
        this.config.development = {
            hotReload: process.env.NODE_ENV === 'development',   // Enable in dev
            debugMode: process.env.DEBUG_MODE === 'true',       // Allow debug mode
            testMode: process.env.TEST_MODE === 'true',         // Allow test mode
            mockData: process.env.MOCK_DATA === 'true'          // Allow mock data
        };

        // PVP (minimal but enabled)
        this.config.pvp = {
            enabled: process.env.PVP_ENABLED !== 'false',  // Default enabled
            maxQueueSize: parseInt(process.env.PVP_MAX_QUEUE) || 10,
            matchmakingTime: parseInt(process.env.PVP_MATCHMAKING_TIME) || 300,
            battleCooldown: parseInt(process.env.PVP_BATTLE_COOLDOWN) || 600,
            maxBattleTurns: parseInt(process.env.PVP_MAX_TURNS) || 15,
            cpBalanceThreshold: parseFloat(process.env.PVP_CP_THRESHOLD) || 0.5
        };
        
        console.log('✅ CPU-optimized environment variables loaded');
        console.log('🔍 === ENVIRONMENT LOADING COMPLETE ===');
    }

    async loadOptionalConfigs() {
        // Load configs but don't fail if they don't exist
        try {
            const defaultConfigPath = path.join(__dirname, 'default.json');
            if (fs.existsSync(defaultConfigPath)) {
                const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
                this.config = { ...defaultConfig };
                console.log('✅ Default configuration loaded');
            }
        } catch (error) {
            console.log('ℹ️ No default config (optional)');
        }

        try {
            const envConfigPath = path.join(__dirname, `${this.environment}.json`);
            if (fs.existsSync(envConfigPath)) {
                const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
                this.config = { ...this.config, ...envConfig };
                console.log(`✅ ${this.environment} configuration loaded`);
            }
        } catch (error) {
            console.log(`ℹ️ No ${this.environment} config (optional)`);
        }
    }

    extractClientIdFromToken(token) {
        try {
            const base64 = token.split('.')[0];
            const decoded = Buffer.from(base64, 'base64').toString('ascii');
            return decoded;
        } catch (error) {
            console.log('⚠️ Could not extract client ID from token');
            return null;
        }
    }

    validateConfig() {
        console.log('🔍 === LIGHTWEIGHT CONFIG VALIDATION ===');
        
        const errors = [];
        
        // Only validate critical items
        if (!this.config.discord?.token) {
            errors.push('Discord token is missing');
        }
        
        if (!this.config.database?.url) {
            errors.push('Database URL is missing');
        }
        
        // Validate token format
        if (this.config.discord?.token && !this.config.discord.token.startsWith('Bot ') && !this.config.discord.token.includes('.')) {
            errors.push('Discord token appears to be invalid format');
        }
        
        // Validate database URL format
        if (this.config.database?.url && !this.config.database.url.startsWith('postgresql://') && !this.config.database.url.startsWith('postgres://')) {
            errors.push('Database URL should start with postgresql:// or postgres://');
        }
        
        // Validate new game config values
        if (this.config.game?.startingBerries && this.config.game.startingBerries < 0) {
            errors.push('Starting berries must be positive');
        }
        
        if (this.config.game?.fullIncome && this.config.game.fullIncome < 0) {
            errors.push('Full income must be positive');
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        console.log('✅ Configuration validation passed (lightweight)');
        
        // Log config summary (without sensitive data)
        console.log('📋 Configuration Summary:');
        console.log(`   Discord: ${this.config.discord?.token ? '✅ Token Set' : '❌ No Token'}`);
        console.log(`   Database: ${this.config.database?.url ? '✅ URL Set' : '❌ No URL'}`);
        console.log(`   Log Level: ${this.config.logging?.level || 'unknown'}`);
        console.log(`   Environment: ${this.environment}`);
        console.log(`   Monitoring: ${this.config.monitoring?.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`   Starting Berries: ${this.config.game?.startingBerries || 5000}`);
        console.log(`   Full Hourly Income: ${this.config.game?.fullIncome || 6250}`);
    }

    // Getters (simplified)
    getAll() {
        if (!this.isLoaded) throw new Error('Configuration not loaded');
        return { ...this.config };
    }

    get(section) {
        if (!this.isLoaded) throw new Error('Configuration not loaded');
        return this.config[section] || {};
    }

    get loaded() { return this.isLoaded; }
    get env() { return this.environment; }
    get isDevelopment() { return this.environment === 'development'; }
    get isProduction() { return this.environment === 'production'; }
    get discord() { return this.get('discord'); }
    get database() { return this.get('database'); }
    get game() { return this.get('game'); }
    get performance() { return this.get('performance'); }
    get monitoring() { return this.get('monitoring'); }
    get security() { return this.get('security'); }
    get logging() { return this.get('logging'); }
    get development() { return this.get('development'); }
    get pvp() { return this.get('pvp'); }

    async reload() {
        console.log('🔄 Reloading configuration...');
        this.config = {};
        this.isLoaded = false;
        await this.load();
        console.log('✅ Configuration reloaded');
    }

    // Helper methods for debugging
    logConfig() {
        if (!this.isLoaded) {
            console.log('❌ Configuration not loaded');
            return;
        }
        
        console.log('🔍 === CURRENT CONFIGURATION ===');
        console.log('Discord Config:', {
            hasToken: !!this.config.discord?.token,
            tokenLength: this.config.discord?.token?.length || 0,
            clientId: this.config.discord?.clientId || 'Not set'
        });
        console.log('Database Config:', {
            hasUrl: !!this.config.database?.url,
            ssl: this.config.database?.ssl,
            poolMax: this.config.database?.pool?.max
        });
        console.log('Game Config:', this.config.game);
        console.log('Logging Config:', this.config.logging);
        console.log('=================================');
    }

    // Test configuration
    async test() {
        try {
            console.log('🧪 Testing configuration...');
            
            // Test Discord token format
            if (!this.config.discord?.token) {
                throw new Error('No Discord token configured');
            }
            
            // Test database URL format
            if (!this.config.database?.url) {
                throw new Error('No database URL configured');
            }
            
            console.log('✅ Configuration test passed');
            return true;
            
        } catch (error) {
            console.log('❌ Configuration test failed:', error.message);
            return false;
        }
    }
}

module.exports = new ConfigManager();
