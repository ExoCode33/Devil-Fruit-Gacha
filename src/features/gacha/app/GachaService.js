// src/services/GachaService.js - UPDATED: Fixed Pity System (900-1000 start, 0.05% divine)
const DatabaseManager = require('../database/DatabaseManager');
const EconomyService = require('./EconomyService');
const Logger = require('../utils/Logger');
const Config = require('../config/Config');

// Import fruit and skill systems
const { 
  getFruitsByRarity, 
  getRandomFruitByRarity, 
  selectWeightedDivineFruit,
  getFruitWithSkill,
  RARITY_WEIGHTS,
  DIVINE_WEIGHTS 
} = require('../data/DevilFruits');

const { 
  getSkillData, 
  getFallbackSkill 
} = require('../data/DevilFruitSkills');

const { 
  BASE_PULL_RATES, 
  PITY_SYSTEM, 
  RARITY_EMOJIS 
} = require('../data/Constants');

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA');
        this.pullHistory = new Map(); // Cache recent pulls
    }

    /**
     * Perform multiple pulls for a user
     */
    async performPulls(userId, count = 1) {
        const results = [];
        let totalCpGained = 0;
        let pityUsedInSession = false;
        
        // Get user's current pity count
        let currentPity = await this.getPityCount(userId);
        
        this.logger.info(`User ${userId} performing ${count} pulls (starting pity: ${currentPity})`);
        
        for (let i = 0; i < count; i++) {
            try {
                // Pull single fruit
                const pullResult = await this.pullSingleFruit(userId, currentPity);
                
                // Add fruit to user's collection
                const addResult = await DatabaseManager.addDevilFruit(userId, pullResult.fruit);
                
                // Track pity usage
                if (pullResult.pityUsed) {
                    pityUsedInSession = true;
                }
                
                // Combine results
                const combinedResult = {
                    fruit: addResult.fruit,
                    isNewFruit: addResult.isNewFruit,
                    duplicateCount: addResult.duplicateCount,
                    pityUsed: pullResult.pityUsed,
                    pityCount: pullResult.pityCount,
                    cpGained: addResult.fruit.total_cp || 0
                };
                
                results.push(combinedResult);
                totalCpGained += combinedResult.cpGained;
                
                // Update pity for next pull
                currentPity = pullResult.pityCount;
                
            } catch (error) {
                this.logger.error(`Error in pull ${i + 1} for user ${userId}:`, error);
                throw error;
            }
        }
        
        this.logger.info(`User ${userId} completed ${count} pulls. Total CP gained: ${totalCpGained}, Pity used: ${pityUsedInSession}`);
        
        return {
            results,
            totalCpGained,
            pityUsedInSession,
            finalPityCount: currentPity
        };
    }

    /**
     * Pull a single devil fruit with UPDATED pity system and skill integration
     */
    async pullSingleFruit(userId, pityCount) {
        try {
            this.logger.debug(`Pulling single fruit for user ${userId} with pity ${pityCount}`);
            
            // Calculate if pity should trigger
            const pityChance = this.calculatePityChance(pityCount);
            const shouldUsePity = Math.random() * 100 < pityChance;
            
            let selectedRarity;
            let pityUsed = false;
            
            if (shouldUsePity && pityCount >= 900) { // UPDATED: Minimum pity requirement raised to 900
                // Pity triggered - use premium rates (mythical/divine only)
                selectedRarity = this.selectPityRarity();
                pityUsed = true;
                pityCount = 0; // Reset pity
                this.logger.info(`User ${userId} pity triggered! Selected rarity: ${selectedRarity}`);
            } else {
                // Normal pull rates
                selectedRarity = this.selectNormalRarity();
                pityCount++; // Increment pity
            }
            
            // Update pity count in database
            await this.updatePityCount(userId, pityCount);
            
            // Get fruits of selected rarity
            const fruitsOfRarity = getFruitsByRarity(selectedRarity);
            if (!fruitsOfRarity || fruitsOfRarity.length === 0) {
                throw new Error(`No fruits found for rarity: ${selectedRarity}`);
            }
            
            // Select fruit from rarity (use weighted selection for divine)
            let selectedFruit;
            if (selectedRarity === 'divine') {
                selectedFruit = selectWeightedDivineFruit(fruitsOfRarity);
                
                // Log if One Piece was pulled (ultra rare)
                if (selectedFruit.id === 'one_piece_treasure') {
                    this.logger.warn(`🏆 ULTRA RARE: User ${userId} pulled ONE PIECE! (${pityCount} pity, pity used: ${pityUsed})`);
                }
            } else {
                selectedFruit = fruitsOfRarity[Math.floor(Math.random() * fruitsOfRarity.length)];
            }
            
            // IMPORTANT: Get skill data from DevilFruitSkills.js
            const skillData = getSkillData(selectedFruit.id);
            const skill = skillData || getFallbackSkill(selectedFruit.rarity);
            
            // Combine fruit data with skill
            const fruitWithSkill = {
                ...selectedFruit,
                skill
            };
            
            this.logger.debug(`User ${userId} pulled ${selectedFruit.name} (${selectedRarity}) - Pity: ${pityCount}, Used: ${pityUsed}, Skill: ${skill.name}`);
            
            return { 
                fruit: fruitWithSkill,  // Return fruit with skill data
                pityUsed: pityUsed,
                pityCount: pityCount
            };
            
        } catch (error) {
            this.logger.error(`Error pulling single fruit for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate pity chance based on current pity count
     * UPDATED: Pity doesn't really start until 900-1000 pulls
     */
    calculatePityChance(pityCount) {
        if (pityCount >= PITY_SYSTEM.HARD_PITY_LIMIT) {
            return 100; // 100% chance at hard pity (1500)
        }
        
        // UPDATED: No meaningful pity before 900 pulls
        if (pityCount < 900) {
            return 0; // No pity chance before 900 pulls
        }
        
        // Pity starts ramping up from 900 to hard pity limit
        const pityStart = 900;
        const progress = (pityCount - pityStart) / (PITY_SYSTEM.HARD_PITY_LIMIT - pityStart);
        const chance = Math.pow(progress, PITY_SYSTEM.SCALING_POWER) * PITY_SYSTEM.MAX_PITY_CHANCE;
        
        return Math.min(chance, PITY_SYSTEM.MAX_PITY_CHANCE);
    }

    /**
     * Select rarity when pity is triggered (mythical/divine only)
     * UPDATED: Much lower divine chance (0.05% instead of default)
     */
    selectPityRarity() {
        const random = Math.random() * 100;
        
        // UPDATED: Divine chance reduced to 0.05%
        const UPDATED_PITY_RATES = {
            divine: 0.05,    // UPDATED: Was higher, now 0.05%
            mythical: 99.95  // UPDATED: Rest goes to mythical
        };
        
        if (random < UPDATED_PITY_RATES.divine) {
            return 'divine';
        } else {
            return 'mythical';
        }
    }

    /**
     * Select rarity for normal pulls
     */
    selectNormalRarity() {
        const random = Math.random() * 100;
        let cumulative = 0;
        
        // Use rates from Constants.js
        const rates = BASE_PULL_RATES;
        
        for (const [rarity, rate] of Object.entries(rates)) {
            cumulative += rate;
            if (random <= cumulative) {
                return rarity;
            }
        }
        
        return 'common'; // Fallback
    }

    /**
     * Get user's current pity count
     */
    async getPityCount(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            return user?.pity_count || 0;
        } catch (error) {
            this.logger.error(`Error getting pity count for ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Update user's pity count
     */
    async updatePityCount(userId, newCount) {
        try {
            await DatabaseManager.updateUser(userId, { pity_count: newCount });
        } catch (error) {
            this.logger.error(`Error updating pity count for ${userId}:`, error);
        }
    }

    /**
     * Get detailed pity information for display
     * UPDATED: Reflects new pity thresholds
     */
    async getPityInfo(userId) {
        try {
            const pityCount = await this.getPityCount(userId);
            const pityChance = this.calculatePityChance(pityCount);
            const remainingPulls = Math.max(0, PITY_SYSTEM.HARD_PITY_LIMIT - pityCount);
            
            // UPDATED: Show when pity actually starts being meaningful
            let nextGuaranteed;
            if (pityCount < 900) {
                const pullsTo900 = 900 - pityCount;
                nextGuaranteed = `${pullsTo900} pulls until pity starts`;
            } else if (remainingPulls === 0) {
                nextGuaranteed = 'Next pull';
            } else {
                nextGuaranteed = `${remainingPulls} pulls`;
            }
            
            return {
                current: pityCount,
                hardPity: PITY_SYSTEM.HARD_PITY_LIMIT,
                chance: pityChance,
                remaining: remainingPulls,
                nextGuaranteed,
                pityActive: pityCount >= 900 // UPDATED: Show if pity is actually active
            };
        } catch (error) {
            this.logger.error(`Error getting pity info for ${userId}:`, error);
            return {
                current: 0,
                hardPity: PITY_SYSTEM.HARD_PITY_LIMIT,
                chance: 0,
                remaining: PITY_SYSTEM.HARD_PITY_LIMIT,
                nextGuaranteed: `${PITY_SYSTEM.HARD_PITY_LIMIT} pulls`,
                pityActive: false
            };
        }
    }

    /**
     * Format pity display for embeds
     * UPDATED: Better messaging for new pity system
     */
    formatPityDisplay(pityInfo, pityUsedInSession = false) {
        const progressBar = this.createProgressBar(pityInfo.current, pityInfo.hardPity);
        
        let pityText = `🎯 **Pity System:** ${pityInfo.current}/${pityInfo.hardPity}\n`;
        pityText += `${progressBar}\n`;
        
        if (pityInfo.pityActive) {
            pityText += `📊 **Current Chance:** ${pityInfo.chance.toFixed(2)}%\n`;
        } else {
            pityText += `📊 **Pity Status:** Inactive (starts at 900 pulls)\n`;
        }
        
        pityText += `⏭️ **Next Guaranteed:** ${pityInfo.nextGuaranteed}`;
        
        if (pityUsedInSession) {
            pityText += `\n✨ **Pity was used this session!**`;
        }
        
        // UPDATED: Add note about divine rates
        if (pityInfo.pityActive) {
            pityText += `\n🌟 **Divine Rate:** 0.05% (when pity triggers)`;
        }
        
        return pityText;
    }

    /**
     * Create visual progress bar for pity
     */
    createProgressBar(current, max, length = 20) {
        const progress = Math.min(current / max, 1);
        const filledBars = Math.floor(progress * length);
        const emptyBars = length - filledBars;
        
        const filled = '▰'.repeat(filledBars);
        const empty = '▱'.repeat(emptyBars);
        
        return `${filled}${empty} (${(progress * 100).toFixed(1)}%)`;
    }

    /**
     * Get pull statistics for a user
     */
    async getUserPullStats(userId) {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    fruit_rarity,
                    COUNT(*) as count,
                    COUNT(DISTINCT fruit_id) as unique_count
                FROM user_devil_fruits 
                WHERE user_id = $1 
                GROUP BY fruit_rarity
                ORDER BY 
                    CASE fruit_rarity
                        WHEN 'divine' THEN 7
                        WHEN 'mythical' THEN 6
                        WHEN 'legendary' THEN 5
                        WHEN 'epic' THEN 4
                        WHEN 'rare' THEN 3
                        WHEN 'uncommon' THEN 2
                        WHEN 'common' THEN 1
                        ELSE 0
                    END DESC
            `, [userId]);
            
            const stats = {};
            let totalPulls = 0;
            
            result.rows.forEach(row => {
                const count = parseInt(row.count);
                stats[row.fruit_rarity] = {
                    total: count,
                    unique: parseInt(row.unique_count),
                    emoji: RARITY_EMOJIS[row.fruit_rarity] || '⚪'
                };
                totalPulls += count;
            });
            
            return { stats, totalPulls };
        } catch (error) {
            this.logger.error(`Error getting pull stats for ${userId}:`, error);
            return { stats: {}, totalPulls: 0 };
        }
    }

    /**
     * Get global pull statistics
     */
    async getGlobalPullStats() {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    fruit_rarity,
                    COUNT(*) as total_pulled,
                    COUNT(DISTINCT user_id) as users_who_pulled,
                    COUNT(DISTINCT fruit_id) as unique_fruits_pulled
                FROM user_devil_fruits 
                GROUP BY fruit_rarity
                ORDER BY 
                    CASE fruit_rarity
                        WHEN 'divine' THEN 7
                        WHEN 'mythical' THEN 6
                        WHEN 'legendary' THEN 5
                        WHEN 'epic' THEN 4
                        WHEN 'rare' THEN 3
                        WHEN 'uncommon' THEN 2
                        WHEN 'common' THEN 1
                        ELSE 0
                    END DESC
            `);
            
            const stats = {};
            let totalPulls = 0;
            
            result.rows.forEach(row => {
                const count = parseInt(row.total_pulled);
                stats[row.fruit_rarity] = {
                    totalPulled: count,
                    usersWhoPulled: parseInt(row.users_who_pulled),
                    uniqueFruitsPulled: parseInt(row.unique_fruits_pulled),
                    emoji: RARITY_EMOJIS[row.fruit_rarity] || '⚪'
                };
                totalPulls += count;
            });
            
            return { stats, totalPulls };
        } catch (error) {
            this.logger.error('Error getting global pull stats:', error);
            return { stats: {}, totalPulls: 0 };
        }
    }

    /**
     * Get rarest pulls (divine fruits)
     */
    async getRarestPulls(limit = 10) {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    u.username,
                    udf.fruit_name,
                    udf.fruit_rarity,
                    udf.obtained_at,
                    udf.user_id
                FROM user_devil_fruits udf
                JOIN users u ON udf.user_id = u.user_id
                WHERE udf.fruit_rarity IN ('divine', 'mythical')
                ORDER BY 
                    CASE udf.fruit_rarity
                        WHEN 'divine' THEN 2
                        WHEN 'mythical' THEN 1
                        ELSE 0
                    END DESC,
                    udf.obtained_at DESC
                LIMIT $1
            `, [limit]);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Error getting rarest pulls:', error);
            return [];
        }
    }

    /**
     * Check if user has specific fruit
     */
    async userHasFruit(userId, fruitId) {
        try {
            const result = await DatabaseManager.query(`
                SELECT COUNT(*) as count 
                FROM user_devil_fruits 
                WHERE user_id = $1 AND fruit_id = $2
            `, [userId, fruitId]);
            
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            this.logger.error(`Error checking if user ${userId} has fruit ${fruitId}:`, error);
            return false;
        }
    }

    /**
     * Get user's duplicate count for a specific fruit
     */
    async getUserFruitCount(userId, fruitId) {
        try {
            const result = await DatabaseManager.query(`
                SELECT COUNT(*) as count 
                FROM user_devil_fruits 
                WHERE user_id = $1 AND fruit_id = $2
            `, [userId, fruitId]);
            
            return parseInt(result.rows[0].count);
        } catch (error) {
            this.logger.error(`Error getting fruit count for user ${userId}, fruit ${fruitId}:`, error);
            return 0;
        }
    }

    /**
     * Get featured fruit of the day/week
     */
    getFeaturedFruit() {
        // Simple featured fruit rotation based on day
        const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        const allFruits = Object.values(require('../data/DevilFruits').DEVIL_FRUITS);
        const featuredIndex = dayOfYear % allFruits.length;
        
        const featuredFruit = allFruits[featuredIndex];
        
        // Add skill data
        return getFruitWithSkill(featuredFruit.id);
    }

    /**
     * Simulate pulls for testing (doesn't affect user data)
     */
    async simulatePulls(count = 100) {
        const results = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            mythical: 0,
            divine: 0
        };
        
        for (let i = 0; i < count; i++) {
            const rarity = this.selectNormalRarity();
            results[rarity]++;
        }
        
        // Calculate percentages
        const percentages = {};
        Object.keys(results).forEach(rarity => {
            percentages[rarity] = ((results[rarity] / count) * 100).toFixed(2);
        });
        
        return { results, percentages, totalPulls: count };
    }

    /**
     * Get pull cost for multiple pulls
     */
    getPullCost(count = 1) {
        // No discounts - full price for all pulls
        return Config.game.pullCost * count;
    }

    /**
     * Validate pull request
     */
    async validatePullRequest(userId, count = 1) {
        const errors = [];
        
        // Check if count is valid
        if (count < 1 || count > 100) {
            errors.push('Pull count must be between 1 and 100');
        }
        
        // Check if user has enough berries
        const cost = this.getPullCost(count);
        const balance = await EconomyService.getBalance(userId);
        
        if (balance < cost) {
            errors.push(`Insufficient berries. Need ${cost.toLocaleString()}, have ${balance.toLocaleString()}`);
        }
        
        // Check rate limits (if implemented)
        // Could add daily pull limits here
        
        return {
            valid: errors.length === 0,
            errors,
            cost
        };
    }

    /**
     * Record pull event for analytics
     */
    async recordPullEvent(userId, results, cost) {
        try {
            // Record each pull result
            for (const result of results) {
                await DatabaseManager.query(`
                    INSERT INTO pull_history (
                        user_id, fruit_id, fruit_name, fruit_rarity, 
                        pity_used, pity_count, cost_paid, created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                `, [
                    userId,
                    result.fruit.fruit_id || result.fruit.id,
                    result.fruit.fruit_name || result.fruit.name,
                    result.fruit.fruit_rarity || result.fruit.rarity,
                    result.pityUsed,
                    result.pityCount,
                    cost / results.length // Cost per pull
                ]);
            }
        } catch (error) {
            this.logger.error('Error recording pull event:', error);
            // Don't throw - this is analytics only
        }
    }

    /**
     * Get user's pull history
     */
    async getUserPullHistory(userId, limit = 20) {
        try {
            const result = await DatabaseManager.query(`
                SELECT * FROM pull_history 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `, [userId, limit]);
            
            return result.rows;
        } catch (error) {
            this.logger.error(`Error getting pull history for ${userId}:`, error);
            return [];
        }
    }

    /**
     * Get service statistics
     */
    async getServiceStats() {
        try {
            const [totalPulls, uniqueUsers, rarestPulls] = await Promise.all([
                DatabaseManager.query('SELECT COUNT(*) as count FROM user_devil_fruits'),
                DatabaseManager.query('SELECT COUNT(DISTINCT user_id) as count FROM user_devil_fruits'),
                this.getRarestPulls(5)
            ]);
            
            return {
                totalPulls: parseInt(totalPulls.rows[0].count),
                uniqueUsers: parseInt(uniqueUsers.rows[0].count),
                rarestPulls: rarestPulls.map(pull => ({
                    username: pull.username,
                    fruitName: pull.fruit_name,
                    rarity: pull.fruit_rarity,
                    when: pull.obtained_at
                }))
            };
        } catch (error) {
            this.logger.error('Error getting service stats:', error);
            return {
                totalPulls: 0,
                uniqueUsers: 0,
                rarestPulls: []
            };
        }
    }

    /**
     * Reset user's pity count (admin function)
     */
    async resetUserPity(userId) {
        try {
            await this.updatePityCount(userId, 0);
            this.logger.info(`Reset pity count for user ${userId}`);
            return true;
        } catch (error) {
            this.logger.error(`Error resetting pity for user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Get current pull rates with pity consideration
     * UPDATED: Reflects new pity thresholds
     */
    getCurrentRates(pityCount = 0) {
        const baseRates = { ...BASE_PULL_RATES };
        
        if (pityCount >= 900) { // UPDATED: Changed from 100 to 900
            const pityChance = this.calculatePityChance(pityCount);
            
            // Show how pity affects rates
            return {
                baseRates,
                pityChance,
                effectiveRates: {
                    ...baseRates,
                    pityInfo: `${pityChance.toFixed(2)}% chance for guaranteed Mythical/Divine (Divine: 0.05%)`
                }
            };
        }
        
        return { baseRates, pityChance: 0, effectiveRates: baseRates };
    }

    /**
     * Get fruit collection completion percentage
     */
    async getCollectionCompletion(userId) {
        try {
            const [userFruits, totalFruits] = await Promise.all([
                DatabaseManager.query(`
                    SELECT COUNT(DISTINCT fruit_id) as count 
                    FROM user_devil_fruits 
                    WHERE user_id = $1
                `, [userId]),
                DatabaseManager.query('SELECT COUNT(*) as count FROM (SELECT DISTINCT id FROM devil_fruits_catalog) as unique_fruits')
            ]);
            
            const owned = parseInt(userFruits.rows[0].count);
            const total = Object.keys(require('../data/DevilFruits').DEVIL_FRUITS).length;
            const percentage = total > 0 ? (owned / total) * 100 : 0;
            
            return {
                owned,
                total,
                percentage: Math.round(percentage * 100) / 100
            };
        } catch (error) {
            this.logger.error(`Error calculating collection completion for ${userId}:`, error);
            return { owned: 0, total: 0, percentage: 0 };
        }
    }
}

module.exports = new GachaService();
