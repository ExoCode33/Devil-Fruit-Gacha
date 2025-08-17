// src/shared/db/DatabaseManager.js - COMPLETE: Enhanced DatabaseManager with proper user initialization
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const Config = require('../config/Config');
const Logger = require('../utils/Logger');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.logger = new Logger('DATABASE');
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }

    /**
     * Connect to the database
     */
    async connect() {
        try {
            // Get database URL from config or environment
            const databaseUrl = Config?.database?.url || process.env.DATABASE_URL;
            
            if (!databaseUrl) {
                throw new Error('Database URL not found in config or environment');
            }

            this.logger.info('🔗 Connecting to PostgreSQL database...');

            // Create connection pool with optimized settings
            this.pool = new Pool({
                connectionString: databaseUrl,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: Config?.database?.pool?.max || 20,
                idleTimeoutMillis: Config?.database?.pool?.idleTimeoutMillis || 30000,
                connectionTimeoutMillis: Config?.database?.pool?.connectionTimeoutMillis || 10000,
                statement_timeout: 60000,
                query_timeout: 60000
            });

            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            this.connectionRetries = 0;
            this.logger.success('✅ Database connected successfully');

            // Initialize tables
            await this.initializeTables();

        } catch (error) {
            this.logger.error('❌ Database connection failed:', error);
            this.isConnected = false;
            this.connectionRetries++;

            if (this.connectionRetries < this.maxRetries) {
                this.logger.info(`🔄 Retrying connection in 5 seconds... (${this.connectionRetries}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.connect();
            } else {
                throw error;
            }
        }
    }

    /**
     * Initialize required tables
     */
    async initializeTables() {
        try {
            this.logger.info('🔧 Initializing database tables...');

            // Users table with proper defaults
            await this.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    guild_id TEXT,
                    berries BIGINT DEFAULT 5000,
                    total_cp BIGINT DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    total_earned BIGINT DEFAULT 5000,
                    total_spent BIGINT DEFAULT 0,
                    last_income TIMESTAMP DEFAULT NOW(),
                    pity_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);

            // Devil fruits table
            await this.query(`
                CREATE TABLE IF NOT EXISTS user_devil_fruits (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    fruit_id TEXT NOT NULL,
                    fruit_name TEXT NOT NULL,
                    fruit_type TEXT DEFAULT 'Paramecia',
                    fruit_rarity TEXT DEFAULT 'common',
                    fruit_description TEXT,
                    base_cp INTEGER DEFAULT 100,
                    total_cp INTEGER DEFAULT 100,
                    obtained_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT fk_user_fruits FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
            `);

            // Income history table
            await this.query(`
                CREATE TABLE IF NOT EXISTS income_history (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    fruit_count INTEGER DEFAULT 0,
                    income_type TEXT DEFAULT 'manual',
                    created_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
            `);

            // User levels table
            await this.query(`
                CREATE TABLE IF NOT EXISTS user_levels (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT fk_level_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
            `);

            // Command usage tracking
            await this.query(`
                CREATE TABLE IF NOT EXISTS command_usage (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT,
                    command_name TEXT NOT NULL,
                    guild_id TEXT,
                    used_at TIMESTAMP DEFAULT NOW()
                );
            `);

            // PvP raids table
            await this.query(`
                CREATE TABLE IF NOT EXISTS raids (
                    id TEXT PRIMARY KEY,
                    challenger_id TEXT NOT NULL,
                    target_id TEXT NOT NULL,
                    defender_id TEXT,
                    guild_id TEXT,
                    status TEXT DEFAULT 'pending',
                    winner_id TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    accepted_at TIMESTAMP,
                    declined_at TIMESTAMP,
                    declined_by TEXT
                );
            `);

            // Create indexes for performance
            await this.query('CREATE INDEX IF NOT EXISTS idx_user_fruits_user_id ON user_devil_fruits(user_id);');
            await this.query('CREATE INDEX IF NOT EXISTS idx_income_history_user_id ON income_history(user_id);');
            await this.query('CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);');
            await this.query('CREATE INDEX IF NOT EXISTS idx_command_usage_user_id ON command_usage(user_id);');
            await this.query('CREATE INDEX IF NOT EXISTS idx_raids_challenger ON raids(challenger_id);');
            await this.query('CREATE INDEX IF NOT EXISTS idx_raids_target ON raids(target_id);');

            this.logger.success('✅ Database tables initialized successfully');

        } catch (error) {
            this.logger.error('❌ Failed to initialize tables:', error);
            throw error;
        }
    }

    /**
     * Execute a query with error handling
     */
    async query(text, params = []) {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            // Log slow queries
            if (duration > 1000) {
                this.logger.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
            }
            
            return result;
        } catch (error) {
            this.logger.error('Query error:', {
                error: error.message,
                query: text.substring(0, 100),
                params: params?.slice(0, 5) // Only log first 5 params for security
            });
            throw error;
        }
    }

    /**
     * CRITICAL: Ensure user exists with proper error handling and FK protection
     */
    async ensureUser(userId, username, guildId = null) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID provided');
        }

        try {
            // First, check if user exists
            const existingUser = await this.query(
                'SELECT user_id FROM users WHERE user_id = $1',
                [userId]
            );

            if (existingUser.rows.length > 0) {
                // User exists, just update the username and guild if provided
                await this.query(`
                    UPDATE users 
                    SET username = $2, guild_id = COALESCE($3, guild_id), updated_at = NOW()
                    WHERE user_id = $1
                `, [userId, username || 'Unknown', guildId]);
                
                return existingUser.rows[0];
            }

            // User doesn't exist, create new user with proper defaults
            const newUser = await this.query(`
                INSERT INTO users (
                    user_id, username, guild_id, berries, total_cp, level,
                    total_earned, total_spent, last_income, pity_count,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, 5000, 0, 1,
                    5000, 0, NOW(), 0,
                    NOW(), NOW()
                ) RETURNING *
            `, [userId, username || 'Unknown', guildId]);

            // Also create user level entry
            await this.query(`
                INSERT INTO user_levels (user_id, level, experience, updated_at)
                VALUES ($1, 1, 0, NOW())
                ON CONFLICT (user_id) DO NOTHING
            `, [userId]);

            this.logger.info(`✅ Created new user: ${username} (${userId})`);
            return newUser.rows[0];

        } catch (error) {
            this.logger.error(`Failed to ensure user ${userId}:`, error);
            
            // If it's a foreign key constraint error, try to resolve it
            if (error.message.includes('foreign key') || error.message.includes('violates')) {
                this.logger.warn('Foreign key constraint detected, attempting to resolve...');
                
                // Try creating a minimal user record
                try {
                    await this.query(`
                        INSERT INTO users (user_id, username, guild_id)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (user_id) DO UPDATE SET
                        username = EXCLUDED.username,
                        guild_id = COALESCE(EXCLUDED.guild_id, users.guild_id),
                        updated_at = NOW()
                    `, [userId, username || 'Unknown', guildId]);
                    
                    return { user_id: userId, username: username || 'Unknown' };
                } catch (retryError) {
                    this.logger.error('Failed to resolve foreign key constraint:', retryError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Get user information
     */
    async getUser(userId) {
        if (!userId) {
            return null;
        }

        try {
            const result = await this.query(
                'SELECT * FROM users WHERE user_id = $1',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            this.logger.error(`Failed to get user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Update user berries with transaction safety
     */
    async updateUserBerries(userId, amount, reason = 'unknown') {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Ensure user exists first
            await this.ensureUser(userId, 'Unknown');

            // Get current balance
            const currentResult = await client.query(
                'SELECT berries, total_earned, total_spent FROM users WHERE user_id = $1',
                [userId]
            );

            if (currentResult.rows.length === 0) {
                throw new Error('User not found after ensure');
            }

            const currentBalance = currentResult.rows[0].berries || 0;
            const currentEarned = currentResult.rows[0].total_earned || 0;
            const currentSpent = currentResult.rows[0].total_spent || 0;
            const newBalance = Math.max(0, currentBalance + amount);

            // Update totals
            const newEarned = amount > 0 ? currentEarned + amount : currentEarned;
            const newSpent = amount < 0 ? currentSpent + Math.abs(amount) : currentSpent;

            // Update user balance and totals
            await client.query(`
                UPDATE users 
                SET berries = $2, total_earned = $3, total_spent = $4, updated_at = NOW() 
                WHERE user_id = $1
            `, [userId, newBalance, newEarned, newSpent]);

            await client.query('COMMIT');
            return newBalance;

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error(`Failed to update berries for ${userId}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Add devil fruit to user collection
     */
    async addDevilFruit(userId, fruitData) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Ensure user exists first
            await this.ensureUser(userId, 'Unknown');

            // Check if user already has this fruit
            const existingFruit = await client.query(
                'SELECT COUNT(*) as count FROM user_devil_fruits WHERE user_id = $1 AND fruit_id = $2',
                [userId, fruitData.id]
            );

            const duplicateCount = parseInt(existingFruit.rows[0].count) + 1;
            const isNewFruit = duplicateCount === 1;

            // Calculate CP values
            const baseCP = Math.floor((fruitData.multiplier || 1) * 100);
            const totalCP = baseCP;

            // Insert the fruit
            const insertResult = await client.query(`
                INSERT INTO user_devil_fruits (
                    user_id, fruit_id, fruit_name, fruit_type, fruit_rarity,
                    fruit_description, base_cp, total_cp, obtained_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING *
            `, [
                userId,
                fruitData.id,
                fruitData.name,
                fruitData.type,
                fruitData.rarity,
                fruitData.description,
                baseCP,
                totalCP
            ]);

            // Recalculate user's total CP
            await this.recalculateUserCP(userId, client);

            await client.query('COMMIT');

            return {
                fruit: insertResult.rows[0],
                isNewFruit,
                duplicateCount
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error(`Failed to add fruit for ${userId}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get user's devil fruits
     */
    async getUserDevilFruits(userId) {
        if (!userId) {
            return [];
        }

        try {
            const result = await this.query(`
                SELECT * FROM user_devil_fruits 
                WHERE user_id = $1 
                ORDER BY fruit_rarity DESC, total_cp DESC, obtained_at DESC
            `, [userId]);

            return result.rows || [];
        } catch (error) {
            this.logger.error(`Failed to get fruits for ${userId}:`, error);
            return [];
        }
    }

    /**
     * Recalculate user's total CP
     */
    async recalculateUserCP(userId, client = null) {
        const queryClient = client || this.pool;
        
        try {
            const result = await queryClient.query(`
                UPDATE users 
                SET total_cp = (
                    SELECT COALESCE(SUM(total_cp), 0) 
                    FROM user_devil_fruits 
                    WHERE user_id = $1
                ), updated_at = NOW()
                WHERE user_id = $1
                RETURNING total_cp
            `, [userId]);

            return result.rows[0]?.total_cp || 0;
        } catch (error) {
            this.logger.error(`Failed to recalculate CP for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Record income transaction
     */
    async recordIncome(userId, amount, fruitCount, incomeType = 'manual') {
        try {
            await this.ensureUser(userId, 'Unknown');
            
            await this.query(`
                INSERT INTO income_history (user_id, amount, fruit_count, income_type, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [userId, amount, fruitCount, incomeType]);

            // Update last income time
            await this.query(`
                UPDATE users SET last_income = NOW(), updated_at = NOW() WHERE user_id = $1
            `, [userId]);

        } catch (error) {
            this.logger.error(`Failed to record income for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get server statistics
     */
    async getServerStats() {
        try {
            const userStats = await this.query(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(berries) as total_berries,
                    AVG(berries) as avg_berries,
                    MAX(berries) as max_berries
                FROM users
            `);

            const fruitStats = await this.query(`
                SELECT COUNT(*) as total_fruits FROM user_devil_fruits
            `);

            return {
                totalUsers: parseInt(userStats.rows[0].total_users) || 0,
                totalBerries: parseInt(userStats.rows[0].total_berries) || 0,
                avgBerries: Math.floor(parseFloat(userStats.rows[0].avg_berries)) || 0,
                maxBerries: parseInt(userStats.rows[0].max_berries) || 0,
                totalFruits: parseInt(fruitStats.rows[0].total_fruits) || 0
            };
        } catch (error) {
            this.logger.error('Failed to get server stats:', error);
            return {
                totalUsers: 0,
                totalBerries: 0,
                avgBerries: 0,
                maxBerries: 0,
                totalFruits: 0
            };
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const start = Date.now();
            await this.query('SELECT 1');
            const latency = Date.now() - start;
            
            return {
                status: 'healthy',
                latency: `${latency}ms`,
                connected: this.isConnected,
                pool: {
                    total: this.pool?.totalCount || 0,
                    idle: this.pool?.idleCount || 0,
                    waiting: this.pool?.waitingCount || 0
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connected: false
            };
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.end();
                this.isConnected = false;
                this.logger.info('📡 Database disconnected');
            }
        } catch (error) {
            this.logger.error('Error disconnecting from database:', error);
        }
    }

    /**
     * Run database migrations (placeholder for future use)
     */
    async runMigrations() {
        try {
            this.logger.info('🔄 Running database migrations...');
            // Migration logic would go here
            this.logger.success('✅ Migrations completed');
        } catch (error) {
            this.logger.error('❌ Migration failed:', error);
            throw error;
        }
    }

    /**
     * Emergency cleanup for testing
     */
    async emergencyCleanup() {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.warn('🧹 Running emergency cleanup (DEV ONLY)');
            
            try {
                await this.query('TRUNCATE TABLE command_usage, income_history, user_devil_fruits, user_levels, raids CASCADE');
                await this.query('TRUNCATE TABLE users CASCADE');
                this.logger.success('✅ Emergency cleanup completed');
            } catch (error) {
                this.logger.error('❌ Emergency cleanup failed:', error);
            }
        }
    }
}

// Export singleton instance
const databaseManager = new DatabaseManager();
module.exports = databaseManager;
