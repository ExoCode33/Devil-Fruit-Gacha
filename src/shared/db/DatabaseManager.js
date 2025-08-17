// src/database/DatabaseManager.js - Professional Database Management
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
        this.migrations = new Map();
        this.queryCount = 0;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
    }

    /**
     * Connect to PostgreSQL database with retry logic
     */
    async connect() {
        while (this.connectionAttempts < this.maxRetries) {
            try {
                this.connectionAttempts++;
                this.logger.info(`🔄 Attempting database connection (${this.connectionAttempts}/${this.maxRetries})...`);

                const config = Config.database;
                
                // Log connection details for debugging
                this.logger.info('📊 Connection details:', {
                    url: config.url ? `${config.url.substring(0, 30)}...` : 'NOT SET',
                    ssl: config.ssl,
                    poolMax: config.pool?.max || 'default'
                });
                
                this.pool = new Pool({
                    connectionString: config.url,
                    ssl: config.ssl ? { rejectUnauthorized: false } : false,
                    ...config.pool,
                    // Railway-optimized settings
                    keepAlive: true,
                    keepAliveInitialDelayMillis: 10000,
                    statement_timeout: 30000,
                    query_timeout: 30000,
                    connectionTimeoutMillis: 15000,
                    // Connection pool settings for Railway
                    max: 10, // Reduced for Railway free tier
                    min: 2,
                    idleTimeoutMillis: 30000,
                    acquireTimeoutMillis: 60000,
                    createTimeoutMillis: 30000,
                    destroyTimeoutMillis: 5000,
                    reapIntervalMillis: 1000,
                    createRetryIntervalMillis: 200,
                    // Additional PostgreSQL settings
                    application_name: 'OnePieceGachaBot_v4'
                });

                // Test connection with proper timeout handling
                const client = await Promise.race([
                    this.pool.connect(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
                    )
                ]);

                try {
                    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
                    
                    this.logger.info('📊 Database info:', {
                        time: result.rows[0].current_time,
                        version: result.rows[0].pg_version.split(' ')[0],
                        connected: true
                    });
                    
                } finally {
                    client.release();
                }

                this.isConnected = true;
                this.setupEventHandlers();
                
                this.logger.success(`✅ Database connected successfully (attempt ${this.connectionAttempts})`);
                return;

            } catch (error) {
                this.logger.error(`❌ Database connection failed (attempt ${this.connectionAttempts}):`, {
                    message: error.message,
                    code: error.code,
                    errno: error.errno,
                    syscall: error.syscall,
                    hostname: error.hostname,
                    host: error.host || 'unknown',
                    port: error.port || 'unknown'
                });
                
                if (this.connectionAttempts >= this.maxRetries) {
                    throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff with longer delays for Railway
                const delay = Math.min(3000 * Math.pow(2, this.connectionAttempts - 1), 20000);
                this.logger.info(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Setup event handlers for pool
     */
    setupEventHandlers() {
        this.pool.on('connect', (client) => {
            this.logger.debug('📡 New client connected to database');
        });

        this.pool.on('remove', (client) => {
            this.logger.debug('📡 Client removed from database pool');
        });

        this.pool.on('error', (error, client) => {
            this.logger.error('💥 Database pool error:', {
                message: error.message,
                code: error.code,
                severity: error.severity
            });
        });

        this.pool.on('acquire', (client) => {
            this.logger.debug('📡 Client acquired from pool');
        });

        // Graceful shutdown handling
        process.on('SIGINT', () => this.disconnect());
        process.on('SIGTERM', () => this.disconnect());
    }

    /**
     * Execute database query with error handling and metrics
     */
    async query(text, params = [], options = {}) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        const startTime = Date.now();
        const queryId = ++this.queryCount;
        
        try {
            this.logger.debug(`🔍 Executing query ${queryId}:`, text.substring(0, 100));
            
            const result = await this.pool.query(text, params);
            const duration = Date.now() - startTime;
            
            // Log slow queries
            if (duration > 1000) {
                this.logger.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
            }
            
            this.logger.debug(`✅ Query ${queryId} completed in ${duration}ms, rows: ${result.rowCount}`);
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`❌ Query ${queryId} failed after ${duration}ms:`, {
                error: error.message,
                code: error.code,
                detail: error.detail,
                query: text.substring(0, 100)
            });
            throw error;
        }
    }

    /**
     * Execute query with transaction
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            this.logger.debug('✅ Transaction committed successfully');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('❌ Transaction rolled back:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Load and execute database migrations
     */
    async migrate() {
        try {
            this.logger.info('🔄 Starting database migrations...');
            
            // Ensure migrations table exists
            await this.createMigrationsTable();
            
            // Load migration files
            await this.loadMigrations();
            
            // Get executed migrations
            const executedMigrations = await this.getExecutedMigrations();
            
            // Execute pending migrations
            const pending = Array.from(this.migrations.keys())
                .filter(name => !executedMigrations.includes(name))
                .sort();
            
            if (pending.length === 0) {
                this.logger.info('✅ No pending migrations');
                return;
            }
            
            this.logger.info(`📋 Found ${pending.length} pending migrations`);
            
            for (const migrationName of pending) {
                await this.executeMigration(migrationName);
            }
            
            this.logger.success('✅ All migrations executed successfully');
            
        } catch (error) {
            this.logger.error('❌ Migration failed:', error);
            throw error;
        }
    }

    /**
     * Create migrations tracking table
     */
    async createMigrationsTable() {
        await this.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Load migration files from filesystem
     */
    async loadMigrations() {
        const migrationsDir = path.join(__dirname, 'migrations');
        
        try {
            const files = await fs.readdir(migrationsDir);
            const migrationFiles = files.filter(file => file.endsWith('.sql')).sort();
            
            for (const file of migrationFiles) {
                const filePath = path.join(migrationsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const name = file.replace('.sql', '');
                
                this.migrations.set(name, content);
            }
            
            this.logger.info(`📁 Loaded ${this.migrations.size} migration files`);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.warn('⚠️ Migrations directory not found, creating...');
                await fs.mkdir(migrationsDir, { recursive: true });
            } else {
                throw error;
            }
        }
    }

    /**
     * Get list of executed migrations
     */
    async getExecutedMigrations() {
        const result = await this.query('SELECT name FROM _migrations ORDER BY id');
        return result.rows.map(row => row.name);
    }

    /**
     * Execute a single migration
     */
    async executeMigration(migrationName) {
        const sql = this.migrations.get(migrationName);
        if (!sql) {
            throw new Error(`Migration ${migrationName} not found`);
        }
        
        this.logger.info(`🔄 Executing migration: ${migrationName}`);
        
        await this.transaction(async (client) => {
            // Execute migration SQL
            await client.query(sql);
            
            // Record migration as executed
            await client.query(
                'INSERT INTO _migrations (name) VALUES ($1)',
                [migrationName]
            );
        });
        
        this.logger.success(`✅ Migration completed: ${migrationName}`);
    }

    /**
     * User management methods
     */
    async ensureUser(userId, username, guildId = null) {
        const result = await this.query(`
            INSERT INTO users (user_id, username, guild_id, level, base_cp, total_cp, berries, created_at, updated_at)
            VALUES ($1, $2, $3, 0, 100, 100, 0, NOW(), NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                guild_id = EXCLUDED.guild_id,
                updated_at = NOW()
            RETURNING *
        `, [userId, username, guildId]);
        
        return result.rows[0];
    }

    async getUser(userId) {
        const result = await this.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] || null;
    }

    async updateUser(userId, updates) {
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [userId, ...Object.values(updates)];
        
        const result = await this.query(`
            UPDATE users 
            SET ${setClause}, updated_at = NOW()
            WHERE user_id = $1
            RETURNING *
        `, values);
        
        return result.rows[0];
    }

    async updateUserBerries(userId, amount, reason = 'Unknown') {
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
            throw new Error('User not found');
        }
        
        return result.rows[0].berries;
    }

    /**
     * Devil Fruit management methods
     */
    async addDevilFruit(userId, fruitData) {
        // Check for duplicates
        const existing = await this.query(`
            SELECT COUNT(*) as count 
            FROM user_devil_fruits 
            WHERE user_id = $1 AND fruit_id = $2
        `, [userId, fruitData.id]);
        
        const duplicateCount = parseInt(existing.rows[0].count) + 1;
        const isNewFruit = duplicateCount === 1;
        
        // Get user's base CP
        const user = await this.getUser(userId);
        const baseCp = user.base_cp;
        
        // Calculate values
        const multiplier = parseFloat(fruitData.multiplier) || 1.0;
        const multiplierAsInt = Math.floor(multiplier * 100);
        const totalCp = Math.floor(baseCp * multiplier);
        
        // Insert fruit
        const result = await this.query(`
            INSERT INTO user_devil_fruits (
                user_id, fruit_id, fruit_name, fruit_type, fruit_rarity,
                fruit_element, fruit_fruit_type, fruit_power, fruit_description,
                base_cp, duplicate_count, total_cp, obtained_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            RETURNING *
        `, [
            userId,
            fruitData.id || 'unknown_fruit',
            fruitData.name || 'Unknown Fruit',
            fruitData.type || 'Paramecia',
            fruitData.rarity || 'common',
            fruitData.element || fruitData.fruitType || 'Unknown',
            fruitData.fruitType || 'Unknown',
            fruitData.power || 'Unknown power',
            fruitData.description || fruitData.power || 'Unknown power',
            multiplierAsInt,
            duplicateCount,
            totalCp
        ]);
        
        // Recalculate user's total CP
        await this.recalculateUserCP(userId);
        
        return {
            fruit: result.rows[0],
            isNewFruit,
            duplicateCount,
            totalCp: await this.getUserTotalCP(userId)
        };
    }

    async getUserDevilFruits(userId) {
        const result = await this.query(`
            SELECT *, 
                   (SELECT COUNT(*) FROM user_devil_fruits udf2 
                    WHERE udf2.user_id = $1 AND udf2.fruit_id = user_devil_fruits.fruit_id) as duplicate_count
            FROM user_devil_fruits 
            WHERE user_id = $1 
            ORDER BY obtained_at DESC
        `, [userId]);
        
        return result.rows;
    }

    async recalculateUserCP(userId) {
        const user = await this.getUser(userId);
        if (!user) return 0;
        
        const baseCp = user.base_cp;
        
        // Get all user's fruits
        const fruits = await this.query(`
            SELECT fruit_id, base_cp, duplicate_count 
            FROM user_devil_fruits 
            WHERE user_id = $1
        `, [userId]);
        
        let totalCp = baseCp;
        const fruitGroups = {};
        
        // Group by fruit type
        fruits.rows.forEach(fruit => {
            if (!fruitGroups[fruit.fruit_id]) {
                fruitGroups[fruit.fruit_id] = {
                    baseCp: fruit.base_cp,
                    count: 0
                };
            }
            fruitGroups[fruit.fruit_id].count++;
        });
        
        // Calculate total CP
        Object.values(fruitGroups).forEach(group => {
            const multiplier = group.baseCp / 100;
            const duplicateBonus = 1 + ((group.count - 1) * 0.01);
            const fruitCp = (baseCp * multiplier) * duplicateBonus;
            totalCp += fruitCp;
        });
        
        const finalTotalCp = Math.floor(totalCp);
        
        await this.query(
            'UPDATE users SET total_cp = $2, updated_at = NOW() WHERE user_id = $1',
            [userId, finalTotalCp]
        );
        
        return finalTotalCp;
    }

    async getUserTotalCP(userId) {
        const result = await this.query(
            'SELECT total_cp FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0]?.total_cp || 0;
    }

    /**
     * Statistics and leaderboards
     */
    async getServerStats() {
        const stats = await Promise.all([
            this.query('SELECT COUNT(*) as count FROM users'),
            this.query('SELECT COUNT(*) as count FROM user_devil_fruits'),
            this.query('SELECT COALESCE(SUM(berries), 0) as total FROM users')
        ]);
        
        return {
            totalUsers: parseInt(stats[0].rows[0].count),
            totalFruits: parseInt(stats[1].rows[0].count),
            totalBerries: parseInt(stats[2].rows[0].total)
        };
    }

    async getLeaderboard(type = 'cp', limit = 10) {
        let query;
        
        switch (type) {
            case 'cp':
                query = `
                    SELECT user_id, username, total_cp, level
                    FROM users 
                    ORDER BY total_cp DESC 
                    LIMIT $1
                `;
                break;
            case 'berries':
                query = `
                    SELECT user_id, username, berries, total_earned
                    FROM users 
                    ORDER BY berries DESC 
                    LIMIT $1
                `;
                break;
            case 'fruits':
                query = `
                    SELECT u.user_id, u.username, COUNT(DISTINCT df.fruit_id) as unique_fruits
                    FROM users u
                    LEFT JOIN user_devil_fruits df ON u.user_id = df.user_id
                    GROUP BY u.user_id, u.username
                    ORDER BY unique_fruits DESC 
                    LIMIT $1
                `;
                break;
            case 'level':
                query = `
                    SELECT user_id, username, level, base_cp
                    FROM users 
                    ORDER BY level DESC, base_cp DESC 
                    LIMIT $1
                `;
                break;
            default:
                throw new Error('Invalid leaderboard type');
        }
        
        const result = await this.query(query, [limit]);
        return result.rows;
    }

    /**
     * Income tracking
     */
    async recordIncome(userId, amount, cpAtTime, incomeType = 'automatic') {
        await this.query(`
            INSERT INTO income_history (user_id, amount, cp_at_time, income_type, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [userId, amount, Math.floor(cpAtTime), incomeType]);
        
        await this.query(
            'UPDATE users SET last_income = NOW() WHERE user_id = $1',
            [userId]
        );
    }

    /**
     * Health check and diagnostics
     */
    async healthCheck() {
        try {
            const start = Date.now();
            const result = await this.query('SELECT 1 as health_check, NOW() as current_time');
            const latency = Date.now() - start;
            
            const poolStats = {
                totalCount: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            };
            
            return {
                status: 'healthy',
                latency,
                connected: this.isConnected,
                queryCount: this.queryCount,
                poolStats,
                dbTime: result.rows[0].current_time
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connected: false,
                latency: null
            };
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        const health = await this.healthCheck();
        
        return {
            ...health,
            connectionAttempts: this.connectionAttempts,
            maxRetries: this.maxRetries,
            migrationsLoaded: this.migrations.size
        };
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        if (this.pool) {
            this.logger.info('🔌 Closing database connections...');
            
            try {
                await this.pool.end();
                this.isConnected = false;
                this.logger.success('✅ Database disconnected successfully');
            } catch (error) {
                this.logger.error('❌ Error closing database connections:', error);
            }
        }
    }

    /**
     * Test connection
     */
    async testConnection() {
        try {
            const result = await this.query('SELECT NOW() as current_time, version() as pg_version');
            this.logger.info('✅ Database connection test successful:', {
                time: result.rows[0].current_time,
                version: result.rows[0].pg_version.split(' ')[0]
            });
            return true;
        } catch (error) {
            this.logger.error('❌ Database connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Get connection pool status
     */
    getPoolStatus() {
        if (!this.pool) {
            return { status: 'no_pool' };
        }

        return {
            status: 'active',
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            maxSize: this.pool.options.max,
            minSize: this.pool.options.min
        };
    }

    /**
     * Force reconnection
     */
    async reconnect() {
        this.logger.info('🔄 Forcing database reconnection...');
        
        await this.disconnect();
        this.connectionAttempts = 0;
        this.isConnected = false;
        
        await this.connect();
    }
}

// Export singleton instance
module.exports = new DatabaseManager();
