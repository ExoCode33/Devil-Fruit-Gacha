// src/features/gacha/app/GachaService.js - FIXED: Complete Gacha Service Implementation
const Logger = require('../../../shared/utils/Logger');
const DatabaseManager = require('../../../shared/db/DatabaseManager');
const Config = require('../../../shared/config/Config');
const Constants = require('../../../shared/constants/Constants');

// Import devil fruit data safely
let DEVIL_FRUITS = {};
try {
    DEVIL_FRUITS = require('../data/DevilFruits');
} catch (error) {
    console.warn('DevilFruits data not found, using fallback system');
}

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA');
        this.pullCost = Config.game?.pullCost || 1000;
        
        // Pity system configuration
        this.pityConfig = {
            hardPity: 1500,      // Guaranteed mythical/divine at 1500 pulls
            softPity: 1200,      // Increased rates start at 1200 pulls
            resetRarities: ['mythical', 'divine']
        };
        
        this.logger.info('GachaService initialized with pity system');
    }

    /**
     * Perform single or multiple pulls
     */
    async performPulls(userId, count = 1) {
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, 'Unknown', null);
            
            const results = [];
            let pityUsedInSession = false;
            
            for (let i = 0; i < count; i++) {
                // Get current pity count
                const pityCount = await this.getPityCount(userId);
                
                // Determine if pity should activate
                const shouldUsePity = this.shouldActivatePity(pityCount);
                
                // Get rarity (with pity consideration)
                const rarity = shouldUsePity ? this.getPityRarity() : this.determineRarity(pityCount);
                
                // Get fruit of that rarity
                const fruitData = this.getRandomFruit(rarity);
                
                // Add fruit to user's collection
                const addResult = await this.addFruitToUser(userId, fruitData, rarity);
                
                // Update pity counter
                const shouldResetPity = this.pityConfig.resetRarities.includes(rarity);
                await this.updatePityCount(userId, shouldResetPity);
                
                if (shouldUsePity) pityUsedInSession = true;
                
                results.push({
                    fruit: addResult.fruit,
                    isNewFruit: addResult.isNewFruit,
                    duplicateCount: addResult.duplicateCount,
                    pityUsed: shouldUsePity,
                    rarity
                });
            }
            
            this.logger.info(`User ${userId} performed ${count}x pulls, pity used: ${pityUsedInSession}`);
            
            return {
                success: true,
                results,
                pityUsedInSession,
                totalCost: this.pullCost * count
            };
            
        } catch (error) {
            this.logger.error(`Failed to perform pulls for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Determine if pity should activate
     */
    shouldActivatePity(pityCount) {
        if (pityCount >= this.pityConfig.hardPity) {
            return true; // Hard pity - guaranteed
        }
        
        if (pityCount >= this.pityConfig.softPity) {
            // Soft pity - increasing chance
            const softPityRange = this.pityConfig.hardPity - this.pityConfig.softPity;
            const currentProgress = pityCount - this.pityConfig.softPity;
            const pityChance = (currentProgress / softPityRange) * 0.5; // Up to 50% chance
            
            return Math.random() < pityChance;
        }
        
        return false;
    }

    /**
     * Get pity rarity (mythical/divine)
     */
    getPityRarity() {
        const pityRates = Constants.PITY_SYSTEM?.PREMIUM_RATES || {
            mythical: 90.0,
            divine: 10.0
        };
        
        const random = Math.random() * 100;
        return random <= pityRates.divine ? 'divine' : 'mythical';
    }

    /**
     * Determine rarity based on pull rates
     */
    determineRarity(pityCount = 0) {
        const rates = Constants.BASE_PULL_RATES || {
            common: 45,
            uncommon: 30,
            rare: 15,
            epic: 7,
            legendary: 2.5,
            mythical: 0.45,
            divine: 0.05
        };

        // Apply soft pity rate boost
        let adjustedRates = { ...rates };
        if (pityCount >= this.pityConfig.softPity) {
            const boost = Math.min((pityCount - this.pityConfig.softPity) / 100, 2); // Up to 2x boost
            adjustedRates.mythical *= (1 + boost);
            adjustedRates.divine *= (1 + boost);
        }

        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const [rarity, rate] of Object.entries(adjustedRates)) {
            cumulative += rate;
            if (random <= cumulative) {
                return rarity;
            }
        }

        return 'common'; // Fallback
    }

    /**
     * Get random fruit of specified rarity
     */
    getRandomFruit(rarity) {
        // Try to get from actual fruit data
        if (DEVIL_FRUITS && typeof DEVIL_FRUITS === 'object') {
            const fruitsOfRarity = Object.values(DEVIL_FRUITS).filter(fruit => 
                fruit.rarity === rarity
            );

            if (fruitsOfRarity.length > 0) {
                const randomFruit = fruitsOfRarity[Math.floor(Math.random() * fruitsOfRarity.length)];
                return this.enhanceFruitData(randomFruit, rarity);
            }
        }

        // Generate fallback fruit
        return this.generateFallbackFruit(rarity);
    }

    /**
     * Enhance fruit data with proper formatting
     */
    enhanceFruitData(fruit, rarity) {
        return {
            id: fruit.id || `fruit_${Date.now()}`,
            name: fruit.name || 'Unknown Fruit',
            type: fruit.type || 'Paramecia',
            rarity: rarity,
            element: fruit.element || 'Unknown',
            description: fruit.description || fruit.power || 'A mysterious devil fruit',
            multiplier: this.getMultiplierForRarity(rarity)
        };
    }

    /**
     * Generate fallback fruit when no data available
     */
    generateFallbackFruit(rarity) {
        const fruitNames = [
            'Mystery Fruit', 'Unknown Fruit', 'Rare Fruit', 'Special Fruit',
            'Ancient Fruit', 'Legendary Fruit', 'Mystic Fruit', 'Divine Fruit'
        ];

        const elements = [
            'Fire', 'Ice', 'Lightning', 'Earth', 'Wind', 'Water',
            'Light', 'Darkness', 'Metal', 'Wood', 'Poison', 'Healing'
        ];

        const types = ['Paramecia', 'Logia', 'Zoan'];

        const randomName = fruitNames[Math.floor(Math.random() * fruitNames.length)];
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];

        return {
            id: `fallback_${rarity}_${Date.now()}`,
            name: `${randomElement} ${randomName}`,
            type: randomType,
            rarity: rarity,
            element: randomElement,
            description: `A ${rarity} ${randomElement} fruit with mysterious powers`,
            multiplier: this.getMultiplierForRarity(rarity)
        };
    }

    /**
     * Get CP multiplier for rarity
     */
    getMultiplierForRarity(rarity) {
        const multipliers = Constants.CP_MULTIPLIERS || {
            common: { min: 1.0, max: 1.2 },
            uncommon: { min: 1.2, max: 1.4 },
            rare: { min: 1.4, max: 1.7 },
            epic: { min: 1.7, max: 2.1 },
            legendary: { min: 1.95, max: 2.6 },
            mythical: { min: 2.6, max: 3.2 },
            divine: { min: 3.7, max: 4.0 }
        };

        const range = multipliers[rarity] || multipliers.common;
        return Math.random() * (range.max - range.min) + range.min;
    }

    /**
     * Add fruit to user's collection
     */
    async addFruitToUser(userId, fruitData, rarity) {
        try {
            // Use DatabaseManager.addDevilFruit method
            const result = await DatabaseManager.addDevilFruit(userId, fruitData);
            
            this.logger.debug(`Added ${rarity} fruit ${fruitData.name} to user ${userId}`);
            
            return result;
            
        } catch (error) {
            this.logger.error(`Failed to add fruit to user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get user's current pity count
     */
    async getPityCount(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            return user?.pity_count || 0;
        } catch (error) {
            this.logger.error(`Failed to get pity count for ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Update pity count
     */
    async updatePityCount(userId, shouldReset = false) {
        try {
            if (shouldReset) {
                await DatabaseManager.query(
                    'UPDATE users SET pity_count = 0, updated_at = NOW() WHERE user_id = $1',
                    [userId]
                );
            } else {
                await DatabaseManager.query(
                    'UPDATE users SET pity_count = pity_count + 1, updated_at = NOW() WHERE user_id = $1',
                    [userId]
                );
            }
        } catch (error) {
            this.logger.error(`Failed to update pity count for ${userId}:`, error);
        }
    }

    /**
     * Get pity information for display
     */
    async getPityInfo(userId) {
        try {
            const current = await this.getPityCount(userId);
            const hardPity = this.pityConfig.hardPity;
            
            return {
                current,
                hardPity,
                remaining: hardPity - current,
                pityActive: current >= this.pityConfig.softPity,
                percentage: Math.min((current / hardPity) * 100, 100)
            };
        } catch (error) {
            this.logger.error(`Failed to get pity info for ${userId}:`, error);
            return {
                current: 0,
                hardPity: this.pityConfig.hardPity,
                remaining: this.pityConfig.hardPity,
                pityActive: false,
                percentage: 0
            };
        }
    }

    /**
     * Format pity display for embeds
     */
    formatPityDisplay(pityInfo, pityUsedInSession = false) {
        const pityBar = this.createPityProgressBar(pityInfo.current, pityInfo.hardPity);
        
        let display = `🎯 **Pity System:**\n`;
        display += `${pityBar}\n`;
        display += `Progress: **${pityInfo.current}/${pityInfo.hardPity}** (${pityInfo.percentage.toFixed(1)}%)\n`;
        
        if (pityUsedInSession) {
            display += `✨ **PITY ACTIVATED THIS SESSION!**\n`;
        } else if (pityInfo.pityActive) {
            display += `🔥 **Soft Pity Active** - Increased rates!\n`;
        } else {
            display += `💤 **Pity Inactive** - ${pityInfo.remaining} pulls remaining\n`;
        }
        
        return display;
    }

    /**
     * Create visual pity progress bar
     */
    createPityProgressBar(current, max, length = 20) {
        const filled = Math.floor((current / max) * length);
        const empty = length - filled;
        
        const filledChar = '█';
        const emptyChar = '░';
        
        return `[${filledChar.repeat(filled)}${emptyChar.repeat(empty)}]`;
    }

    /**
     * Get gacha statistics
     */
    async getGachaStats() {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    fruit_rarity,
                    COUNT(*) as count
                FROM user_devil_fruits 
                GROUP BY fruit_rarity
                ORDER BY count DESC
            `);

            return result.rows.reduce((stats, row) => {
                stats[row.fruit_rarity] = parseInt(row.count);
                return stats;
            }, {});
        } catch (error) {
            this.logger.error('Failed to get gacha stats:', error);
            return {};
        }
    }

    /**
     * Get user's balance (helper method)
     */
    async getUserBalance(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            return user?.berries || 0;
        } catch (error) {
            this.logger.error(`Failed to get balance for ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Check if user can afford pulls
     */
    async canAffordPulls(userId, count) {
        const balance = await this.getUserBalance(userId);
        const cost = this.pullCost * count;
        return balance >= cost;
    }

    /**
     * Get pull cost
     */
    getPullCost(count = 1) {
        return this.pullCost * count;
    }

    /**
     * Validate pull request
     */
    validatePullRequest(userId, count) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        if (!count || count < 1 || count > 100) {
            throw new Error('Invalid pull count (1-100)');
        }
        
        return true;
    }
}

// Export singleton instance
module.exports = new GachaService();
