// src/utils/Logger.js - Professional Logging System
const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
    constructor(component = 'SYSTEM') {
        this.component = component;
        this.levels = {
            ERROR: { value: 0, color: '\x1b[31m', emoji: '❌' },
            WARN: { value: 1, color: '\x1b[33m', emoji: '⚠️' },
            INFO: { value: 2, color: '\x1b[36m', emoji: 'ℹ️' },
            DEBUG: { value: 3, color: '\x1b[35m', emoji: '🔍' },
            SUCCESS: { value: 2, color: '\x1b[32m', emoji: '✅' }
        };
        
        this.currentLevel = this.getLevelFromEnv();
        this.shouldLogToFile = process.env.LOG_FILE === 'true';
        this.logDirectory = process.env.LOG_FILE_PATH || './logs';
        
        this.ensureLogDirectory();
    }

    /**
     * Get log level from environment
     */
    getLevelFromEnv() {
        const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
        return this.levels[envLevel]?.value ?? this.levels.INFO.value;
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (this.shouldLogToFile && !fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    /**
     * Format timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     */
    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const levelInfo = this.levels[level];
        
        let formatted = `[${timestamp}] [${level.padEnd(5)}] [${this.component}] ${message}`;
        
        if (data !== null && data !== undefined) {
            if (typeof data === 'object') {
                formatted += '\n' + util.inspect(data, { 
                    depth: 3, 
                    colors: false, 
                    compact: false 
                });
            } else {
                formatted += ` ${data}`;
            }
        }
        
        return formatted;
    }

    /**
     * Format colored console message
     */
    formatConsoleMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const levelInfo = this.levels[level];
        const reset = '\x1b[0m';
        const gray = '\x1b[90m';
        
        let formatted = `${gray}[${timestamp}]${reset} ${levelInfo.color}[${level.padEnd(5)}]${reset} ${gray}[${this.component}]${reset} ${levelInfo.emoji} ${message}`;
        
        if (data !== null && data !== undefined) {
            if (typeof data === 'object') {
                formatted += '\n' + util.inspect(data, { 
                    depth: 3, 
                    colors: true, 
                    compact: false 
                });
            } else {
                formatted += ` ${data}`;
            }
        }
        
        return formatted;
    }

    /**
     * Write to file
     */
    writeToFile(level, message, data = null) {
        if (!this.shouldLogToFile) return;
        
        try {
            const formatted = this.formatMessage(level, message, data);
            const date = new Date().toISOString().split('T')[0];
            const filename = `${date}.log`;
            const filepath = path.join(this.logDirectory, filename);
            
            fs.appendFileSync(filepath, formatted + '\n');
            
            // Rotate logs if needed
            this.rotateLogs();
            
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Rotate old log files
     */
    rotateLogs() {
        try {
            const maxFiles = parseInt(process.env.LOG_MAX_FILES) || 14;
            const files = fs.readdirSync(this.logDirectory)
                .filter(file => file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDirectory, file),
                    stat: fs.statSync(path.join(this.logDirectory, file))
                }))
                .sort((a, b) => b.stat.mtime - a.stat.mtime);
            
            // Remove old files
            if (files.length > maxFiles) {
                files.slice(maxFiles).forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
            
        } catch (error) {
            // Silently fail rotation
        }
    }

    /**
     * Log a message at the specified level
     */
    log(level, message, data = null) {
        const levelInfo = this.levels[level];
        if (!levelInfo || levelInfo.value > this.currentLevel) {
            return;
        }
        
        // Console output
        if (process.env.LOG_CONSOLE !== 'false') {
            const consoleMessage = this.formatConsoleMessage(level, message, data);
            
            if (level === 'ERROR') {
                console.error(consoleMessage);
            } else if (level === 'WARN') {
                console.warn(consoleMessage);
            } else {
                console.log(consoleMessage);
            }
        }
        
        // File output
        this.writeToFile(level, message, data);
        
        // Database logging for important events
        this.logToDatabase(level, message, data);
    }

    /**
     * Log to database for important events
     */
    async logToDatabase(level, message, data = null) {
        // Only log ERROR and WARN to database to avoid spam
        if (level !== 'ERROR' && level !== 'WARN') return;
        
        try {
            // Import here to avoid circular dependency
            const DatabaseManager = require('../database/DatabaseManager');
            
            if (DatabaseManager.isConnected) {
                await DatabaseManager.query(`
                    INSERT INTO system_logs (level, component, message, metadata, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [level, this.component, message, data ? JSON.stringify(data) : null]);
            }
        } catch (error) {
            // Silently fail database logging to avoid infinite loops
        }
    }

    /**
     * Convenience methods
     */
    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    info(message, data = null) {
        this.log('INFO', message, data);
    }

    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    success(message, data = null) {
        this.log('SUCCESS', message, data);
    }

    /**
     * Create child logger with extended component name
     */
    child(subComponent) {
        return new Logger(`${this.component}:${subComponent}`);
    }

    /**
     * Log method execution time
     */
    time(label) {
        const start = Date.now();
        return {
            end: () => {
                const duration = Date.now() - start;
                this.debug(`⏱️ ${label} took ${duration}ms`);
                return duration;
            }
        };
    }

    /**
     * Log performance metrics
     */
    performance(operation, duration, metadata = {}) {
        const level = duration > 1000 ? 'WARN' : duration > 500 ? 'INFO' : 'DEBUG';
        this.log(level, `⚡ Performance: ${operation} (${duration}ms)`, metadata);
    }

    /**
     * Log API requests
     */
    request(method, url, statusCode, duration, userAgent = null) {
        const level = statusCode >= 400 ? 'WARN' : 'INFO';
        const emoji = statusCode >= 500 ? '💥' : statusCode >= 400 ? '⚠️' : '📡';
        
        this.log(level, `${emoji} ${method} ${url} ${statusCode} (${duration}ms)`, {
            method,
            url,
            statusCode,
            duration,
            userAgent
        });
    }

    /**
     * Log user actions
     */
    userAction(userId, action, metadata = {}) {
        this.info(`👤 User ${userId} performed action: ${action}`, metadata);
    }

    /**
     * Log command usage
     */
    command(userId, commandName, success, duration, error = null) {
        const level = success ? 'INFO' : 'WARN';
        const emoji = success ? '🎮' : '❌';
        
        this.log(level, `${emoji} Command: ${commandName} by ${userId} (${duration}ms)`, {
            userId,
            commandName,
            success,
            duration,
            error
        });
    }

    /**
     * Log system events
     */
    system(event, metadata = {}) {
        this.info(`🔧 System event: ${event}`, metadata);
    }

    /**
     * Log security events
     */
    security(event, userId = null, metadata = {}) {
        this.warn(`🔐 Security event: ${event}`, {
            userId,
            ...metadata,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Get recent logs from database
     */
    async getRecentLogs(limit = 100, level = null) {
        try {
            const DatabaseManager = require('../database/DatabaseManager');
            
            let query = 'SELECT * FROM system_logs';
            const params = [];
            
            if (level) {
                query += ' WHERE level = $1';
                params.push(level);
            }
            
            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
            params.push(limit);
            
            const result = await DatabaseManager.query(query, params);
            return result.rows;
            
        } catch (error) {
            this.error('Failed to retrieve logs from database:', error);
            return [];
        }
    }

    /**
     * Get log statistics
     */
    async getLogStats(hours = 24) {
        try {
            const DatabaseManager = require('../database/DatabaseManager');
            
            const result = await DatabaseManager.query(`
                SELECT 
                    level,
                    COUNT(*) as count
                FROM system_logs 
                WHERE created_at > NOW() - INTERVAL '${hours} hours'
                GROUP BY level
                ORDER BY count DESC
            `);
            
            return result.rows.reduce((acc, row) => {
                acc[row.level] = parseInt(row.count);
                return acc;
            }, {});
            
        } catch (error) {
            this.error('Failed to get log statistics:', error);
            return {};
        }
    }

    /**
     * Set log level at runtime
     */
    setLevel(level) {
        const levelUpper = level.toUpperCase();
        if (this.levels[levelUpper]) {
            this.currentLevel = this.levels[levelUpper].value;
            this.info(`Log level changed to ${levelUpper}`);
        }
    }

    /**
     * Get current log level
     */
    getLevel() {
        const currentLevelName = Object.keys(this.levels)
            .find(name => this.levels[name].value === this.currentLevel);
        return currentLevelName || 'UNKNOWN';
    }
}

module.exports = Logger;
