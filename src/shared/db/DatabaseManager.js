// src/shared/db/DatabaseManager.js - FIXED: Enhanced with proper user initialization
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
                    max: 10,
                    min: 2,
                    idleTimeoutMillis: 30000,
                    acquireTimeoutMillis: 60000,
                    createTimeoutMillis: 30000,
                    destroyTimeoutMillis: 5000,
                    reapIntervalMillis: 1000,
                    createRetryIntervalMillis: 200,
                    application_name: 'OnePieceGachaBot_v4'
                });

                // Test connection
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
                    code: error.code
                });
                
                if (this.connectionAttempts >= this.maxRetries) {
                    throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff
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
        this.pool.on('error', (error, client) => {
            this.logger.error('💥 Database pool error:', {
                message: error.message,
                code: error.code,
                severity: error.severity
            });
        });

        // Graceful shutdown handling
