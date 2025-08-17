// src/utils/SystemMonitor.js - Lightweight System Monitoring (CPU EMERGENCY FIX)
const os = require('os');
const Logger = require('./Logger');
const Config = require('../config/Config');

class SystemMonitor {
    constructor(client) {
        this.client = client;
        this.logger = new Logger('MONITOR');
        this.interval = null;
        this.metrics = {
            messagesSent: 0,
            commandsExecuted: 0,
            errorsLogged: 0,
            startTime: Date.now()
        };
        
        // EMERGENCY: Disable monitoring by default
        this.enabled = false;
    }
    
    start() {
        // EMERGENCY: Check if monitoring should be enabled
        if (!Config.monitoring?.enabled) {
            this.logger.info('📊 System monitoring DISABLED (CPU optimization)');
            return;
        }
        
        // EMERGENCY: Much longer interval to reduce CPU usage
        const monitoringInterval = Math.max(Config.monitoring.interval || 300000, 300000); // Minimum 5 minutes
        
        this.interval = setInterval(() => {
            this.collectBasicMetrics();
        }, monitoringInterval);
        
        this.enabled = true;
        this.logger.info(`📊 Lightweight system monitoring started (${monitoringInterval/1000}s interval)`);
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.enabled = false;
            this.logger.info('📊 System monitoring stopped');
        }
    }
    
    // EMERGENCY: Simplified metrics collection
    collectBasicMetrics() {
        try {
            const now = Date.now();
            
            // Only collect essential metrics
            const metrics = {
                timestamp: now,
                uptime: now - this.metrics.startTime,
                
                // Discord metrics (lightweight)
                guilds: this.client?.guilds?.cache?.size || 0,
                users: this.client?.users?.cache?.size || 0,
                
                // Memory only (no CPU calculation to reduce load)
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
                    percent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                },
                
                // Bot metrics
                commandsExecuted: this.metrics.commandsExecuted,
                errorsLogged: this.metrics.errorsLogged
            };
            
            // EMERGENCY: Only check memory threshold (skip CPU)
            this.checkMemoryThreshold(metrics);
            
            // Log only if debug mode (reduce logging)
            if (Config.development?.debugMode) {
                this.logger.debug('System metrics collected (lightweight)', {
                    memory: `${metrics.memory.used}MB (${metrics.memory.percent}%)`,
                    guilds: metrics.guilds,
                    users: metrics.users
                });
            }
            
            return metrics;
            
        } catch (error) {
            this.logger.error('Error collecting metrics:', error);
            return null;
        }
    }
    
    // EMERGENCY: Only check memory, skip CPU checks
    checkMemoryThreshold(metrics) {
        try {
            const thresholds = Config.monitoring?.alertThresholds || {};
            
            // Memory threshold only
            if (metrics.memory.used > (thresholds.memory || 128)) {
                this.logger.warn(`⚠️ High memory usage: ${metrics.memory.used} MB (${metrics.memory.percent}%)`);
            }
            
            // EMERGENCY: Removed CPU threshold check entirely
            
        } catch (error) {
            this.logger.error('Error checking thresholds:', error);
        }
    }
    
    // EMERGENCY: Simplified database metrics
    async getDatabaseMetrics() {
        try {
            const DatabaseManager = require('../database/DatabaseManager');
            
            // Quick health check only
            const health = await Promise.race([
                DatabaseManager.healthCheck(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            return {
                status: health.status,
                latency: health.latency || 0
            };
            
        } catch (error) {
            return { 
                status: 'error', 
                error: error.message,
                latency: 0
            };
        }
    }
    
    // Simple increment methods
    incrementCommand() {
        this.metrics.commandsExecuted++;
    }
    
    incrementMessage() {
        this.metrics.messagesSent++;
    }
    
    incrementError() {
        this.metrics.errorsLogged++;
    }
    
    // EMERGENCY: Async version to prevent blocking
    async getMetrics() {
        if (!this.enabled) {
            return {
                status: 'disabled',
                uptime: Date.now() - this.metrics.startTime,
                memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
            };
        }
        
        try {
            return await Promise.race([
                this.collectBasicMetrics(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Metrics timeout')), 3000))
            ]);
        } catch (error) {
            this.logger.error('Metrics collection timeout:', error);
            return { status: 'timeout', error: error.message };
        }
    }
    
    getUptimeString() {
        const uptime = Date.now() - this.metrics.startTime;
        const hours = Math.floor(uptime / (60 * 60 * 1000));
        const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
        
        return `${hours}h ${minutes}m`;
    }
    
    // EMERGENCY: Force garbage collection if available
    forceGarbageCollection() {
        try {
            if (global.gc) {
                global.gc();
                this.logger.debug('🗑️ Forced garbage collection');
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    // EMERGENCY: Get simple status
    getSimpleStatus() {
        return {
            enabled: this.enabled,
            uptime: this.getUptimeString(),
            memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            guilds: this.client?.guilds?.cache?.size || 0,
            users: this.client?.users?.cache?.size || 0
        };
    }
}

module.exports = SystemMonitor;
