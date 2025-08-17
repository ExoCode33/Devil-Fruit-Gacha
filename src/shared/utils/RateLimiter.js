// src/utils/RateLimiter.js - Professional Rate Limiting System
const Config = require('../config/Config');
const Logger = require('./Logger');

class RateLimiter {
    constructor() {
        this.logger = new Logger('RATE_LIMITER');
        this.userLimits = new Map();
        this.globalLimits = new Map();
        
        // Default rate limit configuration
        this.config = {
            window: Config.performance?.rateLimit?.window || 60000, // 1 minute
            maxRequests: Config.performance?.rateLimit?.max || 30,   // 30 requests per minute
            globalWindow: 10000, // 10 seconds
            globalMaxRequests: 100 // 100 requests per 10 seconds globally
        };
        
        // Cleanup interval
        setInterval(() => this.cleanup(), 60000); // Cleanup every minute
        
        this.logger.debug('Rate limiter initialized', this.config);
    }

    /**
     * Check if user is rate limited
     */
    async checkLimit(userId, endpoint = 'default') {
        const now = Date.now();
        const key = `${userId}:${endpoint}`;
        
        // Check user-specific rate limit
        if (this.isUserLimited(key, now)) {
            this.logger.warn(`Rate limit exceeded for user ${userId} on ${endpoint}`);
            return true;
        }
        
        // Check global rate limit
        if (this.isGloballyLimited(endpoint, now)) {
            this.logger.warn(`Global rate limit exceeded for ${endpoint}`);
            return true;
        }
        
        // Record the request
        this.recordRequest(key, now);
        this.recordGlobalRequest(endpoint, now);
        
        return false;
    }

    /**
     * Check user-specific rate limit
     */
    isUserLimited(key, now) {
        const userLimit = this.userLimits.get(key);
        
        if (!userLimit) {
            return false;
        }
        
        // Remove expired requests
        userLimit.requests = userLimit.requests.filter(
            timestamp => now - timestamp < this.config.window
        );
        
        // Check if limit exceeded
        return userLimit.requests.length >= this.config.maxRequests;
    }

    /**
     * Check global rate limit
     */
    isGloballyLimited(endpoint, now) {
        const globalLimit = this.globalLimits.get(endpoint);
        
        if (!globalLimit) {
            return false;
        }
        
        // Remove expired requests
        globalLimit.requests = globalLimit.requests.filter(
            timestamp => now - timestamp < this.config.globalWindow
        );
        
        // Check if limit exceeded
        return globalLimit.requests.length >= this.config.globalMaxRequests;
    }

    /**
     * Record a user request
     */
    recordRequest(key, now) {
        if (!this.userLimits.has(key)) {
            this.userLimits.set(key, { requests: [] });
        }
        
        this.userLimits.get(key).requests.push(now);
    }

    /**
     * Record a global request
     */
    recordGlobalRequest(endpoint, now) {
        if (!this.globalLimits.has(endpoint)) {
            this.globalLimits.set(endpoint, { requests: [] });
        }
        
        this.globalLimits.get(endpoint).requests.push(now);
    }

    /**
     * Get remaining requests for user
     */
    getRemainingRequests(userId, endpoint = 'default') {
        const key = `${userId}:${endpoint}`;
        const userLimit = this.userLimits.get(key);
        
        if (!userLimit) {
            return this.config.maxRequests;
        }
        
        const now = Date.now();
        const validRequests = userLimit.requests.filter(
            timestamp => now - timestamp < this.config.window
        );
        
        return Math.max(0, this.config.maxRequests - validRequests.length);
    }

    /**
     * Get time until rate limit resets
     */
    getResetTime(userId, endpoint = 'default') {
        const key = `${userId}:${endpoint}`;
        const userLimit = this.userLimits.get(key);
        
        if (!userLimit || userLimit.requests.length === 0) {
            return 0;
        }
        
        const oldestRequest = Math.min(...userLimit.requests);
        const resetTime = oldestRequest + this.config.window;
        
        return Math.max(0, resetTime - Date.now());
    }

    /**
     * Clear rate limit for user
     */
    clearUserLimit(userId, endpoint = 'default') {
        const key = `${userId}:${endpoint}`;
        this.userLimits.delete(key);
        this.logger.debug(`Cleared rate limit for ${key}`);
    }

    /**
     * Set custom rate limit for user
     */
    setCustomLimit(userId, endpoint, maxRequests, window) {
        const key = `${userId}:${endpoint}`;
        
        // Store original config
        if (!this.customLimits) {
            this.customLimits = new Map();
        }
        
        this.customLimits.set(key, { maxRequests, window });
        this.logger.debug(`Set custom rate limit for ${key}: ${maxRequests}/${window}ms`);
    }

    /**
     * Get rate limit info for user
     */
    getLimitInfo(userId, endpoint = 'default') {
        const remaining = this.getRemainingRequests(userId, endpoint);
        const resetTime = this.getResetTime(userId, endpoint);
        
        return {
            maxRequests: this.config.maxRequests,
            remaining,
            resetTime,
            window: this.config.window
        };
    }

    /**
     * Check if user is currently rate limited
     */
    isLimited(userId, endpoint = 'default') {
        return this.getRemainingRequests(userId, endpoint) <= 0;
    }

    /**
     * Add multiple requests for batch operations
     */
    recordBatch(userId, endpoint, count) {
        const now = Date.now();
        const key = `${userId}:${endpoint}`;
        
        for (let i = 0; i < count; i++) {
            this.recordRequest(key, now);
        }
    }

    /**
     * Get rate limit statistics
     */
    getStats() {
        const userCount = this.userLimits.size;
        const globalCount = this.globalLimits.size;
        
        let totalRequests = 0;
        let limitedUsers = 0;
        
        this.userLimits.forEach((limit, key) => {
            totalRequests += limit.requests.length;
            if (limit.requests.length >= this.config.maxRequests) {
                limitedUsers++;
            }
        });
        
        return {
            userCount,
            globalCount,
            totalRequests,
            limitedUsers,
            config: this.config
        };
    }

    /**
     * Cleanup expired rate limit data
     */
    cleanup() {
        const now = Date.now();
        let cleanedUsers = 0;
        let cleanedGlobal = 0;
        
        // Cleanup user limits
        for (const [key, limit] of this.userLimits.entries()) {
            limit.requests = limit.requests.filter(
                timestamp => now - timestamp < this.config.window
            );
            
            if (limit.requests.length === 0) {
                this.userLimits.delete(key);
                cleanedUsers++;
            }
        }
        
        // Cleanup global limits
        for (const [key, limit] of this.globalLimits.entries()) {
            limit.requests = limit.requests.filter(
                timestamp => now - timestamp < this.config.globalWindow
            );
            
            if (limit.requests.length === 0) {
                this.globalLimits.delete(key);
                cleanedGlobal++;
            }
        }
        
        if (cleanedUsers > 0 || cleanedGlobal > 0) {
            this.logger.debug(`Cleaned up ${cleanedUsers} user limits and ${cleanedGlobal} global limits`);
        }
    }

    /**
     * Reset all rate limits
     */
    reset() {
        this.userLimits.clear();
        this.globalLimits.clear();
        this.logger.info('All rate limits reset');
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('Rate limiter configuration updated', this.config);
    }

    /**
     * Create a middleware function for Express-like frameworks
     */
    middleware(endpoint = 'api') {
        return async (req, res, next) => {
            const userId = req.user?.id || req.ip;
            
            if (await this.checkLimit(userId, endpoint)) {
                const limitInfo = this.getLimitInfo(userId, endpoint);
                
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    retryAfter: Math.ceil(limitInfo.resetTime / 1000),
                    limit: limitInfo.maxRequests,
                    remaining: limitInfo.remaining
                });
                
                return;
            }
            
            next();
        };
    }

    /**
     * Create rate limit headers for HTTP responses
     */
    getHeaders(userId, endpoint = 'default') {
        const limitInfo = this.getLimitInfo(userId, endpoint);
        
        return {
            'X-RateLimit-Limit': limitInfo.maxRequests.toString(),
            'X-RateLimit-Remaining': limitInfo.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil((Date.now() + limitInfo.resetTime) / 1000).toString()
        };
    }

    /**
     * Log rate limit violations
     */
    logViolation(userId, endpoint, additionalInfo = {}) {
        this.logger.security('Rate limit violation', userId, {
            endpoint,
            timestamp: Date.now(),
            ...additionalInfo
        });
    }

    /**
     * Whitelist user from rate limiting
     */
    whitelist(userId) {
        if (!this.whitelisted) {
            this.whitelisted = new Set();
        }
        
        this.whitelisted.add(userId);
        this.logger.info(`User ${userId} whitelisted from rate limiting`);
    }

    /**
     * Remove user from whitelist
     */
    unwhitelist(userId) {
        if (this.whitelisted) {
            this.whitelisted.delete(userId);
            this.logger.info(`User ${userId} removed from rate limit whitelist`);
        }
    }

    /**
     * Check if user is whitelisted
     */
    isWhitelisted(userId) {
        return this.whitelisted?.has(userId) || false;
    }
}

module.exports = RateLimiter;
