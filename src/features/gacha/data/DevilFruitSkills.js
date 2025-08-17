// src/features/gacha/data/DevilFruitSkills.js
const Logger = require('../../../shared/utils/Logger');

// Import skill tiers from combat feature
const DivineSkills = require('../../combat/data/skills/DivineSkills');
const MythicalSkills = require('../../combat/data/skills/MythicalSkills');
const LegendarySkills = require('../../combat/data/skills/LegendarySkills');
const EpicSkills = require('../../combat/data/skills/EpicSkills');
const RareSkills = require('../../combat/data/skills/RareSkills');
const UncommonSkills = require('../../combat/data/skills/UncommonSkills');
const CommonSkills = require('../../combat/data/skills/CommonSkills');

class DevilFruitSkillsManager {
    constructor() {
        this.logger = new Logger('DEVIL_FRUIT_SKILLS');
        this.skillTiers = {
            divine: DivineSkills,
            mythical: MythicalSkills,
            legendary: LegendarySkills,
            epic: EpicSkills,
            rare: RareSkills,
            uncommon: UncommonSkills,
            common: CommonSkills
        };
        
        this.logger.info(`Skills Manager initialized with ${this.getTotalSkillCount()} skills`);
    }

    /**
     * Get skill data for a specific fruit
     */
    getSkillData(fruitId, rarity = null) {
        try {
            // Try specific tier first
            if (rarity && this.skillTiers[rarity]?.[fruitId]) {
                return { ...this.skillTiers[rarity][fruitId], tier: rarity };
            }

            // Search all tiers
            for (const [tierName, tierSkills] of Object.entries(this.skillTiers)) {
                if (tierSkills[fruitId]) {
                    return { ...tierSkills[fruitId], tier: tierName };
                }
            }

            // Generate fallback
            return this.generateFallbackSkill(fruitId, rarity);
        } catch (error) {
            this.logger.error(`Error getting skill for ${fruitId}:`, error);
            return this.generateFallbackSkill(fruitId, rarity);
        }
    }

    /**
     * Generate fallback skill
     */
    generateFallbackSkill(fruitId, rarity, fruitData = null) {
        const templates = {
            divine: { damage: [320, 350], cooldown: [7, 9], cost: [85, 100], type: "ultimate", range: "all" },
            mythical: { damage: [240, 290], cooldown: [5, 7], cost: [55, 80], type: "special", range: "area" },
            legendary: { damage: [170, 220], cooldown: [3, 5], cost: [35, 50], type: "attack", range: "multi" },
            epic: { damage: [120, 170], cooldown: [3, 5], cost: [25, 45], type: "attack", range: "area" },
            rare: { damage: [90, 130], cooldown: [2, 4], cost: [15, 30], type: "attack", range: "single" },
            uncommon: { damage: [70, 100], cooldown: [2, 3], cost: [10, 20], type: "attack", range: "single" },
            common: { damage: [50, 80], cooldown: [1, 2], cost: [5, 15], type: "attack", range: "single" }
        };

        const template = templates[rarity] || templates.common;
        
        return {
            name: `${rarity || 'Unknown'} Power`,
            damage: Math.floor(Math.random() * (template.damage[1] - template.damage[0] + 1)) + template.damage[0],
            cooldown: Math.floor(Math.random() * (template.cooldown[1] - template.cooldown[0] + 1)) + template.cooldown[0],
            cost: Math.floor(Math.random() * (template.cost[1] - template.cost[0] + 1)) + template.cost[0],
            effect: `${rarity}_power`,
            description: `A ${rarity}-level devil fruit technique`,
            type: template.type,
            range: template.range,
            tier: rarity,
            isGenerated: true
        };
    }

    /**
     * Get all skills for a rarity tier
     */
    getSkillsByRarity(rarity) {
        return this.skillTiers[rarity] || {};
    }

    /**
     * Get skill statistics
     */
    getSkillStats() {
        const stats = { totalSkills: 0, byRarity: {} };
        
        Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
            const count = Object.keys(skills).length;
            stats.byRarity[rarity] = count;
            stats.totalSkills += count;
        });
        
        return stats;
    }

    /**
     * Get total skill count
     */
    getTotalSkillCount() {
        return Object.values(this.skillTiers).reduce((total, tierSkills) => {
            return total + Object.keys(tierSkills).length;
        }, 0);
    }

    /**
     * Check if fruit has custom skill
     */
    hasCustomSkill(fruitId) {
        return Object.values(this.skillTiers).some(tierSkills => tierSkills[fruitId]);
    }
}

// Export singleton instance
module.exports = new DevilFruitSkillsManager();
