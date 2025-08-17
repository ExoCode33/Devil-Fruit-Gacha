// src/services/EconomyService.js - FIXED: New Income System Based on Devil Fruits Count
const DatabaseManager = require('../database/DatabaseManager');
const Logger = require('../utils/Logger');
const Config = require('../config/Config');

class EconomyService {
    constructor() {
        this.logger = new Logger('ECONOMY');
        this.incomeCache = new Map(); // Cache for manual income cooldowns
    }

    /**
     * Get user's current berry balance
     */
    async getBalance(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            return user?.berries || 0;
        } catch (error) {
            this.logger.error(`Failed to get balance for ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Add berries to user account
     */
    async addBerries(userId, amount, reason = 'unknown') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        try {
            const newBalance = await DatabaseManager.updateUserBerries(userId, amount, reason);
            this.logger.debug(`Added ${amount} berries to ${userId} (${reason}). New balance: ${newBalance}`);
            return newBalance;
        } catch (error) {
            this.logger.error(`Failed to add berries to ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Deduct berries from user account
     */
    async deductBerries(userId, amount, reason = 'unknown') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const currentBalance = await this.getBalance(userId);
        if (currentBalance < amount) {
            throw new Error('Insufficient berries');
        }

        try {
            const newBalance = await DatabaseManager.updateUserBerries(userId, -amount, reason);
            this.logger.debug(`Deducted ${amount} berries from ${userId} (${reason}). New balance: ${newBalance}`);
            return newBalance;
        } catch (error) {
            this.logger.error(`Failed to deduct berries from ${userId}:`, error);
            throw error;
        }
    }

    /**
     * FIXED: Calculate income based on devil fruits count (NOT CP)
     * - 0 fruits = 0 income per hour
     * - 5+ fruits = 6,250 berries per hour (flat rate)
     * - Less than 5 fruits = proportional income
     */
    async calculateIncome(userId) {
        try {
            // Get user's devil fruits count
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            const fruitCount = fruits?.length || 0;
            
            // FIXED: New income calculation based on fruit count
            let hourlyIncome = 0;
            
            if (fruitCount === 0) {
                // No fruits = no income
                hourlyIncome = 0;
            } else if (fruitCount >= 5) {
                // 5+ fruits = full income (6,250 per hour)
                hourlyIncome = Config.game.fullIncome || 6250;
            } else {
                // Less than 5 fruits = proportional income
                const baseIncome = Config.game.fullIncome || 6250;
                hourlyIncome = Math.floor((baseIncome / 5) * fruitCount);
            }
            
            // Convert to per-10-minute periods (income is calculated every 10 minutes)
            const perPeriodIncome = Math.floor(hourlyIncome / 6);

            return {
                fruitCount,
                hourlyIncome,
                perPeriodIncome,
                total: perPeriodIncome // For compatibility
            };
        } catch (error) {
            this.logger.error(`Failed to calculate income for ${userId}:`, error);
            return {
                fruitCount: 0,
                hourlyIncome: 0,
                perPeriodIncome: 0,
                total: 0
            };
        }
    }

    /**
     * FIXED: Process automatic income based on fruit count
     */
    async processAutomaticIncome(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;

            const lastIncome = new Date(user.last_income);
            const now = new Date();
            const hoursSinceLastIncome = (now - lastIncome) / (1000 * 60 * 60);

            // Minimum interval is 10 minutes
            if (hoursSinceLastIncome < (1 / 6)) {
                return null;
            }

            const maxHours = Config.game.maxStoredHours || 24;
            const effectiveHours = Math.min(hoursSinceLastIncome, maxHours);
            const periods = Math.floor(effectiveHours * 6); // 6 periods per hour (10 min each)

            const incomeData = await this.calculateIncome(userId);
            const totalIncome = incomeData.perPeriodIncome * periods;

            if (totalIncome > 0) {
                await this.addBerries(userId, totalIncome, 'automatic_income');
                await DatabaseManager.recordIncome(userId, totalIncome, incomeData.fruitCount, 'automatic');
            }

            return {
                periods,
                perPeriod: incomeData.perPeriodIncome,
                total: totalIncome,
                hoursAccumulated: effectiveHours,
                fruitCount: incomeData.fruitCount,
                hourlyRate: incomeData.hourlyIncome
            };
        } catch (error) {
            this.logger.error(`Failed to process automatic income for ${userId}:`, error);
            return null;
        }
    }

    /**
     * FIXED: Process manual income with fruit-based calculation
     */
    async processManualIncome(userId) {
        const lastManual = this.incomeCache.get(userId);
        const now = Date.now();
        const cooldown = (Config.game.manualIncomeCooldown || 60) * 1000;

        if (lastManual && (now - lastManual) < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastManual)) / 1000);
            return { success: false, cooldown: remaining };
        }

        try {
            const incomeData = await this.calculateIncome(userId);
            
            // Manual income has a multiplier (default 6x)
            const multiplier = Config.game.manualIncomeMultiplier || 6;
            const manualIncome = Math.floor(incomeData.perPeriodIncome * multiplier);

            if (manualIncome <= 0) {
                return { 
                    success: false, 
                    error: 'You need at least 1 Devil Fruit to earn income!' 
                };
            }

            await this.addBerries(userId, manualIncome, 'manual_income');
            await DatabaseManager.recordIncome(userId, manualIncome, incomeData.fruitCount, 'manual');

            this.incomeCache.set(userId, now);

            return {
                success: true,
                income: manualIncome,
                multiplier,
                baseIncome: incomeData.perPeriodIncome,
                fruitCount: incomeData.fruitCount,
                hourlyRate: incomeData.hourlyIncome
            };
        } catch (error) {
            this.logger.error(`Failed to process manual income for ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }



    /**
     * Transfer berries between users
     */
    async transferBerries(fromUserId, toUserId, amount, reason = 'transfer') {
        if (fromUserId === toUserId) {
            throw new Error('Cannot transfer to yourself');
        }

        try {
            await this.deductBerries(fromUserId, amount, `transfer_to_${toUserId}`);
            await this.addBerries(toUserId, amount, `transfer_from_${fromUserId}`);

            this.logger.info(`Transfer: ${amount} berries from ${fromUserId} to ${toUserId} (${reason})`);
            return true;
        } catch (error) {
            this.logger.error('Transfer failed:', error);
            throw error;
        }
    }

    /**
     * Get top berry balances
     */
    async getTopBalances(limit = 10) {
        try {
            const result = await DatabaseManager.query(`
                SELECT user_id, username, berries, total_earned, total_spent
                FROM users
                ORDER BY berries DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get top balances:', error);
            return [];
        }
    }

    /**
     * Get economy statistics
     */
    async getEconomyStats() {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(berries) as total_berries,
                    AVG(berries) as avg_berries,
                    MAX(berries) as max_berries,
                    SUM(total_earned) as total_earned,
                    SUM(total_spent) as total_spent
                FROM users
            `);

            const stats = result.rows[0];
            return {
                totalUsers: parseInt(stats.total_users),
                totalBerries: parseInt(stats.total_berries) || 0,
                avgBerries: Math.floor(parseFloat(stats.avg_berries)) || 0,
                maxBerries: parseInt(stats.max_berries) || 0,
                totalEarned: parseInt(stats.total_earned) || 0,
                totalSpent: parseInt(stats.total_spent) || 0
            };
        } catch (error) {
            this.logger.error('Failed to get economy stats:', error);
            return {
                totalUsers: 0,
                totalBerries: 0,
                avgBerries: 0,
                maxBerries: 0,
                totalEarned: 0,
                totalSpent: 0
            };
        }
    }

    /**
     * Check if user can afford amount
     */
    async canAfford(userId, amount) {
        const balance = await this.getBalance(userId);
        return balance >= amount;
    }

    /**
     * Get manual income cooldown remaining
     */
    getManualIncomeCooldown(userId) {
        const lastManual = this.incomeCache.get(userId);
        if (!lastManual) return 0;

        const now = Date.now();
        const cooldown = (Config.game.manualIncomeCooldown || 60) * 1000;
        const remaining = Math.max(0, cooldown - (now - lastManual));

        return Math.ceil(remaining / 1000);
    }

    /**
     * Format berry amount for display
     */
    formatBerries(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toLocaleString();
    }

    /**
     * FIXED: Get income display info for commands
     */
    async getIncomeDisplayInfo(userId) {
        try {
            const incomeData = await this.calculateIncome(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            let statusText;
            if (incomeData.fruitCount === 0) {
                statusText = "❌ No income - Get Devil Fruits to start earning!";
            } else if (incomeData.fruitCount >= 5) {
                statusText = "✅ Maximum income rate achieved!";
            } else {
                const needed = 5 - incomeData.fruitCount;
                statusText = `📈 Need ${needed} more Devil Fruit${needed > 1 ? 's' : ''} for maximum income`;
            }
            
            return {
                fruitCount: incomeData.fruitCount,
                hourlyIncome: incomeData.hourlyIncome,
                perPeriodIncome: incomeData.perPeriodIncome,
                statusText,
                maxPossible: Config.game.fullIncome || 6250
            };
        } catch (error) {
            this.logger.error(`Failed to get income display info for ${userId}:`, error);
            return {
                fruitCount: 0,
                hourlyIncome: 0,
                perPeriodIncome: 0,
                statusText: "❌ Error calculating income",
                maxPossible: 6250
            };
        }
    }
}

module.exports = new EconomyService();
