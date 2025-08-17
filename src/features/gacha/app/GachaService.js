// src/features/gacha/app/GachaService.js - CLEAN: Gacha Service
const Logger = require('../../../shared/utils/Logger');
const DatabaseManager = require('../../../shared/db/DatabaseManager');
const Config = require('../../../shared/config/Config');
const Constants = require('../../../shared/constants/Constants');
const DevilFruitSkills = require('../data/DevilFruitSkills');

// Import devil fruit data (you'll need to create this or use existing)
let DEVIL_FRUITS = {};
try {
    DEVIL_FRUITS = require('../data/DevilFruits');
} catch (error) {
    console.warn('DevilFruits data not found, using empty object');
}

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA');
        this.pullCost = Config.game?.pullCost || 1000;
    }

    /**
     * Perform a single gacha pull
     */
    async performPull(userId, username, guildId) {
        try {
            // Check if user can afford pull
            const userBalance = await this.getUserBalance(userId);
            if (userBalance < this.pullCost) {
                throw new Error('Insufficient berries');
            }

            // Deduct cost
            await DatabaseManager.updateUserBerries(userId, -this.pullCost, 'gacha_pull');

            // Determine rarity
            const rarity = this.determineRarity();

            // Get random fruit of that rarity
            const fruit = this.getRandomFruit(rarity);

            // Add fruit to user's collection
            const result = await DatabaseManager.addDevilFruit(userId, fruit);

            this.logger.info(`User ${username} pulled ${rarity} fruit: ${fruit.name}`);

            return {
                success: true,
                fruit,
                rarity,
                isNewFruit: result.isNewFruit,
                duplicateCount: result.duplicateCount,
                cost: this.pullCost
            };

        } catch (error) {
            this.logger.error(`Failed to perform pull for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Perform multiple pulls
     */
    async performMultiPull(userId, username, guildId, count = 10) {
        const results = [];
        const totalCost = this.pullCost * count;

        try {
            // Check if user can afford multi-pull
            const userBalance = await this.getUserBalance(userId);
            if (userBalance < totalCost) {
                throw new Error('Insufficient berries for multi-pull');
            }

            // Deduct total cost
            await DatabaseManager.updateUserBerries(userId, -totalCost, 'gacha_multi_pull');

            // Perform pulls
            for (let i = 0; i < count; i++) {
                try {
                    const rarity = this.determineRarity();
                    const fruit = this.getRandomFruit(rarity);
                    const result = await DatabaseManager.addDevilFruit(userId, fruit);

                    results.push({
                        fruit,
                        rarity,
                        isNewFruit: result.isNewFruit,
                        duplicateCount: result.duplicateCount
                    });
                } catch (pullError) {
                    this.logger.error(`Failed single pull ${i + 1} for ${userId}:`, pullError);
                    // Continue with other pulls
                }
            }

            this.logger.info(`User ${username} performed ${count}-pull, got ${results.length} fruits`);

            return {
                success: true,
                results,
                totalCost,
                count: results.length
            };

        } catch (error) {
            this.logger.error(`Failed to perform multi-pull for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Determine rarity based on pull rates
     */
    determineRarity() {
        const rates = Constants.BASE_PULL_RATES;
        const random = Math.random() * 100;

        let cumulative = 0;
        for (const [rarity, rate] of Object.entries(rates)) {
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
        // If we have devil fruits data, use it
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
     * Enhance fruit data with skill information
     */
    enhanceFruitData(fruit, rarity) {
        const skill = DevilFruitSkills.getSkillData(fruit.id, rarity);
        
        return {
            id: fruit.id || `fruit_${Date.now()}`,
            name: fruit.name || 'Unknown Fruit',
            type: fruit.type || 'Paramecia',
            rarity: rarity,
            element: fruit.element || 'Unknown',
            description: fruit.description || fruit.power || 'A mysterious devil fruit',
            multiplier: this.getMultiplierForRarity(rarity),
            skill: skill || null
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
     * Get user's berry balance
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
}

module.exports = new GachaService();
