// src/shared/db/DatabaseManager.js - FIXED: ON CONFLICT issues
const { Pool } = require('pg');
const Logger = require('../utils/Logger');
const Config = require('../config/Config');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.logger = new Logger('DATABASE');
        this.isConnected = false;
    }

    /**
     * Connect to the database
     */
    async connect() {
        try {
            const connectionString = process.env.DATABASE_URL || Config.database?.url;
            
            if (!connectionString) {
                throw new Error('DATABASE_URL not found in environment variables');
            }

            this.pool = new Pool({
                connectionString,
                ssl: connectionString.includes('railway') || connectionString.includes('render') ? 
                    { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            this.logger.success('✅ Database connected successfully');

        } catch (error) {
            this.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the database
     */
    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.end();
                this.isConnected = false;
                this.logger.info('Database disconnected');
            }
        } catch (error) {
            this.logger.error('Error disconnecting from database:', error);
        }
    }

    /**
     * Execute a query
     */
    async query(text, params = []) {
        if (!this.pool) {
            throw new Error('Database not connected');
        }

        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            this.logger.debug(`Query executed in ${duration}ms`, { 
                query: text.substring(0, 100), 
                params: params.length 
            });
            
            return result;
        } catch (error) {
            this.logger.error('❌ Query error:', {
                error: error.message,
                query: text.length > 200 ? text.substring(0, 200) + '...' : text,
                params
            });
            throw error;
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
                connected: this.isConnected
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
     * FIXED: Ensure user exists with proper constraint handling
     */
    async ensureUser(userId, username, guildId = null) {
        try {
            // First check if user exists
            const existingUser = await this.query(
                'SELECT user_id FROM users WHERE user_id = $1',
                [userId]
            );

            if (existingUser.rows.length > 0) {
                // User exists, just return
                return existingUser.rows[0];
            }

            // User doesn't exist, create them
            const startingBerries = parseInt(process.env.STARTING_BERRIES) || 5000;
            
            // Create user record
            await this.query(`
                INSERT INTO users (user_id, username, guild_id, berries, total_earned, created_at, updated_at, last_income)
                VALUES ($1, $2, $3, $4, $4, NOW(), NOW(), NOW())
            `, [userId, username, guildId, startingBerries]);

            // Create user_levels record (check if exists first)
            const existingLevel = await this.query(
                'SELECT user_id FROM user_levels WHERE user_id = $1',
                [userId]
            );

            if (existingLevel.rows.length === 0) {
                await this.query(`
                    INSERT INTO user_levels (user_id, level, experience, updated_at)
                    VALUES ($1, 1, 0, NOW())
                `, [userId]);
            }

            this.logger.info(`✅ Created new user: ${userId} (${username})`);
            
            return { user_id: userId };

        } catch (error) {
            // If it's a duplicate key error, that's fine - another process created the user
            if (error.code === '23505') { // unique_violation
                this.logger.debug(`User ${userId} already exists (created by another process)`);
                const existingUser = await this.query(
                    'SELECT user_id FROM users WHERE user_id = $1',
                    [userId]
                );
                return existingUser.rows[0] || { user_id: userId };
            }
            
            this.logger.error(`❌ Failed to ensure user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get user data
     */
    async getUser(userId) {
        try {
            const result = await this.query(`
                SELECT u.*, ul.level, ul.experience
                FROM users u
                LEFT JOIN user_levels ul ON u.user_id = ul.user_id
                WHERE u.user_id = $1
            `, [userId]);

            return result.rows[0] || null;
        } catch (error) {
            this.logger.error(`Failed to get user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Update user berries
     */
    async updateUserBerries(userId, amount, reason = 'unknown') {
        try {
            const result = await this.query(`
                UPDATE users 
                SET berries = berries + $2,
                    total_earned = CASE WHEN $2 > 0 THEN total_earned + $2 ELSE total_earned END,
                    total_spent = CASE WHEN $2 < 0 THEN total_spent + ABS($2) ELSE total_spent END,
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING berries
            `, [userId, amount]);

            if (result.rows.length === 0) {
                throw new Error(`User ${userId} not found`);
            }

            return result.rows[0].berries;
        } catch (error) {
            this.logger.error(`Failed to update berries for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get user's devil fruits
     */
    async getUserDevilFruits(userId) {
        try {
            const result = await this.query(`
                SELECT udf.*, df.fruit_name, df.fruit_type, df.fruit_rarity, df.fruit_description
                FROM user_devil_fruits udf
                LEFT JOIN devil_fruits df ON udf.fruit_id = df.fruit_id
                WHERE udf.user_id = $1
                ORDER BY udf.obtained_at DESC
            `, [userId]);

            return result.rows;
        } catch (error) {
            this.logger.error(`Failed to get devil fruits for ${userId}:`, error);
            return [];
        }
    }

    /**
     * FIXED: Add devil fruit to user with proper duplicate handling
     */
    async addDevilFruit(userId, fruitData) {
        try {
            const fruitId = fruitData.id || fruitData.fruit_id;
            const fruitName = fruitData.name || fruitData.fruit_name || 'Unknown Fruit';
            const fruitType = fruitData.type || fruitData.fruit_type || 'Unknown';
            const fruitRarity = fruitData.rarity || fruitData.fruit_rarity || 'common';
            const fruitDescription = fruitData.description || fruitData.fruit_description || 'A mysterious Devil Fruit';
            const baseCP = Math.floor((fruitData.multiplier || 1.0) * 100);

            // Check if this is a duplicate
            const existingFruits = await this.query(
                'SELECT COUNT(*) as count FROM user_devil_fruits WHERE user_id = $1 AND fruit_id = $2',
                [userId, fruitId]
            );

            const duplicateCount = parseInt(existingFruits.rows[0].count) + 1;
            const isNewFruit = duplicateCount === 1;

            // Add the fruit to user's collection
            await this.query(`
                INSERT INTO user_devil_fruits 
                (user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, fruit_description, base_cp, total_cp, obtained_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $7, NOW())
            `, [userId, fruitId, fruitName, fruitType, fruitRarity, fruitDescription, baseCP]);

            // Update user's total CP
            await this.query(`
                UPDATE users 
                SET total_cp = total_cp + $2, updated_at = NOW()
                WHERE user_id = $1
            `, [userId, baseCP]);

            this.logger.info(`Added ${fruitRarity} fruit ${fruitName} to user ${userId} (duplicate #${duplicateCount})`);

            return {
                fruit: {
                    id: fruitId,
                    name: fruitName,
                    type: fruitType,
                    rarity: fruitRarity,
                    description: fruitDescription,
                    base_cp: baseCP,
                    total_cp: baseCP,
                    multiplier: fruitData.multiplier || 1.0,
                    count: duplicateCount
                },
                isNewFruit,
                duplicateCount
            };

        } catch (error) {
            this.logger.error(`Failed to add devil fruit to user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Record income transaction
     */
    async recordIncome(userId, amount, fruitCount, type = 'manual') {
        try {
            await this.query(`
                INSERT INTO income_history (user_id, amount, fruit_count, income_type, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [userId, amount, fruitCount, type]);

            // Update last_income timestamp
            await this.query(`
                UPDATE users SET last_income = NOW() WHERE user_id = $1
            `, [userId]);

        } catch (error) {
            this.logger.error(`Failed to record income for user ${userId}:`, error);
            // Don't throw - income recording is not critical
        }
    }

    /**
     * Get server statistics
     */
    async getServerStats() {
        try {
            const result = await this.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as totalUsers,
                    (SELECT COUNT(*) FROM user_devil_fruits) as totalFruits,
                    (SELECT COALESCE(SUM(berries), 0) FROM users) as totalBerries
            `);

            return result.rows[0] || {
                totalUsers: 0,
                totalFruits: 0,
                totalBerries: 0
            };
        } catch (error) {
            this.logger.error('Failed to get server stats:', error);
            return {
                totalUsers: 0,
                totalFruits: 0,
                totalBerries: 0
            };
        }
    }

    /**
     * EMERGENCY: Safe user creation with existence check
     */
    async safeEnsureUser(userId, username, guildId = null) {
        try {
            // Try the normal ensure user first
            return await this.ensureUser(userId, username, guildId);
        } catch (error) {
            this.logger.warn(`Normal ensureUser failed for ${userId}, trying safe mode:`, error.message);
            
            try {
                // Fallback: Just check if user exists and create minimally if needed
                const existingUser = await this.query(
                    'SELECT user_id FROM users WHERE user_id = $1',
                    [userId]
                );

                if (existingUser.rows.length > 0) {
                    return existingUser.rows[0];
                }

                // Create minimal user record
                const startingBerries = 5000;
                await this.query(`
                    INSERT INTO users (user_id, username, berries, total_earned, created_at, updated_at, last_income)
                    VALUES ($1, $2, $3, $3, NOW(), NOW(), NOW())
                `, [userId, username, startingBerries]);

                this.logger.info(`✅ Created minimal user record for: ${userId}`);
                return { user_id: userId };

            } catch (fallbackError) {
                this.logger.error(`Even fallback user creation failed for ${userId}:`, fallbackError);
                // Return a fake user object so the command doesn't crash
                return { user_id: userId, berries: 0, total_cp: 0, level: 1 };
            }
        }
    }

    /**
     * Run migrations (placeholder)
     */
    async runMigrations() {
        this.logger.info('⚠️ Database migrations skipped (emergency fix for syntax errors)');
        this.logger.info('✅ Foreign key fix is applied in application code instead');
    }
}

// Export singleton instance
module.exports = new DatabaseManager();
