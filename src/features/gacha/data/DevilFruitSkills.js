// src/data/DevilFruitSkills.js - UPDATED: Modular Skills System Manager
const Logger = require('../utils/Logger');

// Import all skill tier modules
const DIVINE_TIER_SKILLS = require('./skills/DivineSkills');
const MYTHICAL_TIER_SKILLS = require('./skills/MythicalSkills');
const LEGENDARY_TIER_SKILLS = require('./skills/LegendarySkills');
const EPIC_TIER_SKILLS = require('./skills/EpicSkills');
const RARE_TIER_SKILLS = require('./skills/RareSkills');
const UNCOMMON_TIER_SKILLS = require('./skills/UncommonSkills');
const COMMON_TIER_SKILLS = require('./skills/CommonSkills');

/**
 * DEVIL FRUIT SKILLS MANAGER - MODULAR SYSTEM
 * 
 * This system organizes skills by rarity tiers in separate files for better maintainability.
 * Each skill is lore-accurate and designed for meaningful turn-based PvP combat.
 * 
 * File Structure:
 * - src/data/skills/DivineSkills.js     (4 skills)
 * - src/data/skills/MythicalSkills.js   (12 skills) 
 * - src/data/skills/LegendarySkills.js  (14 skills)
 * - src/data/skills/EpicSkills.js       (24 skills)
 * - src/data/skills/RareSkills.js       (30 skills)
 * - src/data/skills/UncommonSkills.js   (30 skills)
 * - src/data/skills/CommonSkills.js     (51 skills)
 * 
 * Total: 165 unique, lore-accurate skills
 */

class DevilFruitSkillsManager {
  constructor() {
    this.skillTiers = {
      divine: DIVINE_TIER_SKILLS,
      mythical: MYTHICAL_TIER_SKILLS,
      legendary: LEGENDARY_TIER_SKILLS,
      epic: EPIC_TIER_SKILLS,
      rare: RARE_TIER_SKILLS,
      uncommon: UNCOMMON_TIER_SKILLS,
      common: COMMON_TIER_SKILLS
    };

    // Initialize logger
    this.logger = new Logger('DEVIL_FRUIT_SKILLS_MANAGER');
    this.logger.info(`Skills Manager initialized with ${this.getTotalSkillCount()} lore-accurate skills`);
  }

  /**
   * Get skill data for a specific fruit
   * @param {string} fruitId - The fruit ID to get skill for
   * @param {string} rarity - Optional: The rarity tier to search in first
   * @returns {Object|null} Skill data or null if not found
   */
  getSkillData(fruitId, rarity = null) {
    try {
      // Try to find in appropriate tier first if rarity provided
      if (rarity && this.skillTiers[rarity] && this.skillTiers[rarity][fruitId]) {
        return { ...this.skillTiers[rarity][fruitId], tier: rarity };
      }

      // Search all tiers if not found in specified tier
      for (const [tierName, tierSkills] of Object.entries(this.skillTiers)) {
        if (tierSkills[fruitId]) {
          return { ...tierSkills[fruitId], tier: tierName };
        }
      }

      // Not found - will need fallback
      return null;
    } catch (error) {
      this.logger.error(`Error getting skill data for ${fruitId}:`, error);
      return null;
    }
  }

  /**
   * Generate fallback skill based on rarity and fruit data
   * @param {string} fruitId - The fruit ID
   * @param {string} rarity - The rarity tier
   * @param {Object} fruitData - Optional fruit data for context
   * @returns {Object} Generated fallback skill
   */
  generateFallbackSkill(fruitId, rarity, fruitData = null) {
    const rarityTemplates = {
      divine: { 
        damage: [320, 350], 
        cooldown: [7, 9], 
        type: "ultimate", 
        cost: [85, 100],
        specialCount: 3,
        range: "all"
      },
      mythical: { 
        damage: [240, 290], 
        cooldown: [5, 7], 
        type: "special", 
        cost: [55, 80],
        specialCount: 2,
        range: "area"
      },
      legendary: { 
        damage: [170, 220], 
        cooldown: [3, 5], 
        type: "attack", 
        cost: [35, 50],
        specialCount: 2,
        range: "multi"
      },
      epic: { 
        damage: [120, 170], 
        cooldown: [3, 5], 
        type: "attack", 
        cost: [25, 45],
        specialCount: 2,
        range: "area"
      },
      rare: { 
        damage: [90, 130], 
        cooldown: [2, 4], 
        type: "attack", 
        cost: [15, 30],
        specialCount: 1,
        range: "single"
      },
      uncommon: { 
        damage: [70, 100], 
        cooldown: [2, 3], 
        type: "attack", 
        cost: [10, 20],
        specialCount: 1,
        range: "single"
      },
      common: { 
        damage: [50, 80], 
        cooldown: [1, 2], 
        type: "attack", 
        cost: [5, 15],
        specialCount: 1,
        range: "single"
      }
    };

    const template = rarityTemplates[rarity] || rarityTemplates.common;
    
    const damage = Math.floor(
      Math.random() * (template.damage[1] - template.damage[0] + 1) + template.damage[0]
    );
    
    const cooldown = Math.floor(
      Math.random() * (template.cooldown[1] - template.cooldown[0] + 1) + template.cooldown[0]
    );

    const cost = Math.floor(
      Math.random() * (template.cost[1] - template.cost[0] + 1) + template.cost[0]
    );

    // Generate special abilities based on fruit data
    const special = this.generateSpecialAbilities(fruitData, template.specialCount);

    const skillName = fruitData ? 
      `${fruitData.element} ${template.type.charAt(0).toUpperCase() + template.type.slice(1)}` : 
      `${rarity} Power Strike`;

    const description = fruitData ? 
      `Harness the power of ${fruitData.element} with this ${rarity}-level devil fruit technique` :
      `A ${rarity}-level devil fruit technique with significant combat potential`;

    return {
      name: skillName,
      damage,
      cooldown,
      effect: this.getEffectByElement(fruitData?.element, rarity),
      description,
      type: template.type,
      range: template.range,
      cost,
      special,
      tier: rarity,
      isGenerated: true
    };
  }

  /**
   * Generate special abilities based on fruit element and power level
   * @param {Object} fruitData - The fruit data
   * @param {number} count - Number of special abilities to generate
   * @returns {Object} Special abilities object
   */
  generateSpecialAbilities(fruitData, count) {
    if (!fruitData || count === 0) return {};

    const elementalEffects = {
      'Fire': ['burnDamage', 'heatWave', 'igniteArea'],
      'Ice': ['freezeTarget', 'iceWall', 'slowEffect'],
      'Lightning': ['paralyze', 'chainLightning', 'speedBoost'],
      'Darkness': ['blindTarget', 'nullifyAbility', 'fearEffect'],
      'Light': ['blindingFlash', 'lightSpeed', 'purifyEffect'],
      'Earthquake': ['groundShake', 'structureDamage', 'stunEffect'],
      'Poison': ['poisonDot', 'weakenTarget', 'areaPoison'],
      'Sand': ['sandstorm', 'moistureDrain', 'earthControl'],
      'String': ['bindTarget', 'cutThrough', 'puppetControl'],
      'Shadow': ['shadowClone', 'fearEffect', 'darkHide'],
      'Magma': ['meltWeapons', 'lavaTrap', 'burnDamage'],
      'Gas': ['suffocate', 'poisonCloud', 'gasForm'],
      'Gravity': ['crushTarget', 'floatObject', 'massIncrease'],
      'Time': ['timeStop', 'futureSight', 'pastEcho'],
      'Space': ['teleport', 'dimensionalRift', 'spaceWarp'],
      'Soul': ['soulDrain', 'spiritAttack', 'lifeForce'],
      'Memory': ['memoryWipe', 'falseMemory', 'skillForget'],
      'Age': ['rapidAging', 'youthRestore', 'timeAccelerate'],
      'Weight': ['massIncrease', 'gravityPull', 'crushForce'],
      'Size': ['giantGrowth', 'massiveReach', 'colossalStrength']
    };

    const possibleEffects = elementalEffects[fruitData.element] || ['basicBoost', 'damageUp', 'defenseUp'];
    const special = {};

    for (let i = 0; i < count && i < possibleEffects.length; i++) {
      const effect = possibleEffects[i];
      special[effect] = true;
    }

    return special;
  }

  /**
   * Get effect based on element and rarity
   * @param {string} element - The fruit element
   * @param {string} rarity - The rarity tier
   * @returns {string} Effect name
   */
  getEffectByElement(element, rarity) {
    const effectMap = {
      'Fire': 'burn_damage',
      'Ice': 'freeze_effect', 
      'Lightning': 'lightning_strike',
      'Darkness': 'void_null',
      'Light': 'blinding_light',
      'Earthquake': 'ground_shake',
      'Poison': 'poison_dot',
      'Sand': 'moisture_drain',
      'String': 'bind_control',
      'Shadow': 'shadow_bind',
      'Magma': 'molten_burn',
      'Gas': 'toxic_cloud',
      'Gravity': 'gravity_crush',
      'Time': 'time_manipulation',
      'Space': 'spatial_distort',
      'Soul': 'soul_drain',
      'Memory': 'memory_alter',
      'Age': 'age_change',
      'Weight': 'weight_crush',
      'Size': 'size_change'
    };

    const baseEffect = effectMap[element] || 'basic_damage';
    
    // Enhance effect based on rarity
    if (['divine', 'mythical'].includes(rarity)) {
      return `enhanced_${baseEffect}`;
    }
    
    if (['legendary', 'epic'].includes(rarity)) {
      return `advanced_${baseEffect}`;
    }
    
    return baseEffect;
  }

  /**
   * Get all skills for a specific rarity tier
   * @param {string} rarity - The rarity tier
   * @returns {Object} Skills object for that rarity
   */
  getSkillsByRarity(rarity) {
    return this.skillTiers[rarity] || {};
  }

  /**
   * Get comprehensive skill statistics
   * @returns {Object} Statistics about all skills
   */
  getSkillStats() {
    const stats = {
      totalSkills: 0,
      byRarity: {},
      averageDamage: {},
      averageCooldown: {},
      averageCost: {},
      typeDistribution: {},
      rangeDistribution: {}
    };

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      const skillList = Object.values(skills);
      const count = skillList.length;
      
      stats.byRarity[rarity] = count;
      stats.totalSkills += count;

      if (count > 0) {
        // Calculate averages
        const avgDamage = skillList.reduce((sum, skill) => sum + skill.damage, 0) / count;
        const avgCooldown = skillList.reduce((sum, skill) => sum + skill.cooldown, 0) / count;
        const avgCost = skillList.reduce((sum, skill) => sum + (skill.cost || 0), 0) / count;
        
        stats.averageDamage[rarity] = Math.round(avgDamage);
        stats.averageCooldown[rarity] = Math.round(avgCooldown * 10) / 10;
        stats.averageCost[rarity] = Math.round(avgCost);

        // Type distribution
        skillList.forEach(skill => {
          stats.typeDistribution[skill.type] = (stats.typeDistribution[skill.type] || 0) + 1;
          stats.rangeDistribution[skill.range || 'single'] = (stats.rangeDistribution[skill.range || 'single'] || 0) + 1;
        });
      }
    });

    return stats;
  }

  /**
   * Search skills by name or description
   * @param {string} query - Search query
   * @returns {Array} Array of matching skills with metadata
   */
  searchSkills(query) {
    const results = [];
    const lowercaseQuery = query.toLowerCase();

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        if (skill.name.toLowerCase().includes(lowercaseQuery) ||
            skill.description.toLowerCase().includes(lowercaseQuery) ||
            (skill.effect && skill.effect.toLowerCase().includes(lowercaseQuery))) {
          results.push({ 
            fruitId, 
            rarity, 
            score: this.calculateSearchScore(skill, lowercaseQuery),
            ...skill 
          });
        }
      });
    });

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate search relevance score
   * @param {Object} skill - Skill object
   * @param {string} query - Search query
   * @returns {number} Relevance score
   */
  calculateSearchScore(skill, query) {
    let score = 0;
    
    // Name match is most important
    if (skill.name.toLowerCase().includes(query)) score += 10;
    
    // Description match
    if (skill.description.toLowerCase().includes(query)) score += 5;
    
    // Effect match
    if (skill.effect && skill.effect.toLowerCase().includes(query)) score += 3;
    
    // Exact word matches get bonus
    const words = query.split(' ');
    words.forEach(word => {
      if (skill.name.toLowerCase().includes(word)) score += 2;
      if (skill.description.toLowerCase().includes(word)) score += 1;
    });
    
    return score;
  }

  /**
   * Get skills by damage range
   * @param {number} minDamage - Minimum damage
   * @param {number} maxDamage - Maximum damage
   * @returns {Array} Skills within damage range
   */
  getSkillsByDamageRange(minDamage, maxDamage) {
    const results = [];

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        if (skill.damage >= minDamage && skill.damage <= maxDamage) {
          results.push({ fruitId, rarity, ...skill });
        }
      });
    });

    return results.sort((a, b) => b.damage - a.damage);
  }

  /**
   * Get skills by type
   * @param {string} type - Skill type (attack, defense, support, etc.)
   * @returns {Array} Skills of specified type
   */
  getSkillsByType(type) {
    const results = [];

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        if (skill.type === type) {
          results.push({ fruitId, rarity, ...skill });
        }
      });
    });

    return results;
  }

  /**
   * Validate skill data structure
   * @param {Object} skillData - Skill data to validate
   * @returns {Object} Validation result
   */
  validateSkill(skillData) {
    const required = ['name', 'damage', 'cooldown', 'description', 'type'];
    
    for (const field of required) {
      if (!skillData.hasOwnProperty(field)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
    
    if (typeof skillData.damage !== 'number' || skillData.damage < 0) {
      return { valid: false, error: 'Damage must be a non-negative number' };
    }
    
    if (typeof skillData.cooldown !== 'number' || skillData.cooldown < 0) {
      return { valid: false, error: 'Cooldown must be a non-negative number' };
    }

    const validTypes = ['attack', 'defense', 'support', 'ultimate', 'special', 'passive'];
    if (!validTypes.includes(skillData.type)) {
      return { valid: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
    }

    const validRanges = ['single', 'multi', 'area', 'all', 'self'];
    if (skillData.range && !validRanges.includes(skillData.range)) {
      return { valid: false, error: `Invalid range. Must be one of: ${validRanges.join(', ')}` };
    }
    
    return { valid: true };
  }

  /**
   * Validate all skills across all tiers
   * @returns {Object} Validation results
   */
  validateAllSkills() {
    const errors = [];
    const warnings = [];
    
    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        const validation = this.validateSkill(skill);
        if (!validation.valid) {
          errors.push({
            rarity,
            fruitId,
            error: validation.error
          });
        }

        // Check for missing optional fields
        if (!skill.range) {
          warnings.push({
            rarity,
            fruitId,
            warning: 'Missing range field, will default to "single"'
          });
        }

        if (!skill.cost) {
          warnings.push({
            rarity,
            fruitId,
            warning: 'Missing cost field, will default to 0'
          });
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalSkills: this.getTotalSkillCount(),
      validSkills: this.getTotalSkillCount() - errors.length
    };
  }

  /**
   * Get total skill count across all tiers
   * @returns {number} Total number of skills
   */
  getTotalSkillCount() {
    return Object.values(this.skillTiers).reduce((total, tierSkills) => {
      return total + Object.keys(tierSkills).length;
    }, 0);
  }

  /**
   * Get skill counts by rarity
   * @returns {Object} Skill counts per rarity
   */
  getSkillCounts() {
    const counts = {};
    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      counts[rarity] = Object.keys(skills).length;
    });
    return counts;
  }

  /**
   * Check if a fruit has a custom skill
   * @param {string} fruitId - Fruit ID to check
   * @returns {boolean} True if custom skill exists
   */
  hasCustomSkill(fruitId) {
    for (const tierSkills of Object.values(this.skillTiers)) {
      if (tierSkills[fruitId]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all skills as a flat object
   * @returns {Object} All skills combined
   */
  getAllSkills() {
    const allSkills = {};
    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        allSkills[fruitId] = { ...skill, tier: rarity };
      });
    });
    return allSkills;
  }

  /**
   * Check if rarity is valid
   * @param {string} rarity - Rarity to validate
   * @returns {boolean} True if valid rarity
   */
  isValidRarity(rarity) {
    return Object.keys(this.skillTiers).includes(rarity);
  }

  /**
   * Get skill tier information
   * @returns {Object} Information about each tier
   */
  getTierInfo() {
    const tierInfo = {};
    
    Object.keys(this.skillTiers).forEach(rarity => {
      const skills = this.skillTiers[rarity];
      const skillList = Object.values(skills);
      
      tierInfo[rarity] = {
        count: skillList.length,
        averageDamage: skillList.length > 0 ? 
          Math.round(skillList.reduce((sum, s) => sum + s.damage, 0) / skillList.length) : 0,
        averageCooldown: skillList.length > 0 ? 
          Math.round(skillList.reduce((sum, s) => sum + s.cooldown, 0) / skillList.length * 10) / 10 : 0,
        types: [...new Set(skillList.map(s => s.type))],
        ranges: [...new Set(skillList.map(s => s.range || 'single'))],
        effects: [...new Set(skillList.map(s => s.effect).filter(Boolean))]
      };
    });
    
    return tierInfo;
  }

  /**
   * Get random skill from a specific tier
   * @param {string} rarity - Rarity tier
   * @returns {Object|null} Random skill from that tier
   */
  getRandomSkillFromTier(rarity) {
    const tierSkills = this.skillTiers[rarity];
    if (!tierSkills) return null;
    
    const skillIds = Object.keys(tierSkills);
    if (skillIds.length === 0) return null;
    
    const randomId = skillIds[Math.floor(Math.random() * skillIds.length)];
    return { 
      fruitId: randomId, 
      rarity, 
      ...tierSkills[randomId] 
    };
  }

  /**
   * Get skills with specific special abilities
   * @param {string} specialAbility - Special ability to search for
   * @returns {Array} Skills with that special ability
   */
  getSkillsWithSpecial(specialAbility) {
    const results = [];

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        if (skill.special && skill.special[specialAbility]) {
          results.push({ fruitId, rarity, ...skill });
        }
      });
    });

    return results;
  }

  /**
   * Calculate skill power rating
   * @param {Object} skill - Skill to rate
   * @returns {number} Power rating (0-100)
   */
  calculateSkillPowerRating(skill) {
    let rating = 0;
    
    // Base damage contribution (0-40 points)
    rating += Math.min(skill.damage / 10, 40);
    
    // Cooldown penalty (lower cooldown = higher rating)
    rating += Math.max(0, 20 - skill.cooldown * 2);
    
    // Range bonus
    const rangeBonus = {
      'single': 0,
      'multi': 5,
      'area': 10,
      'all': 15,
      'self': -5
    };
    rating += rangeBonus[skill.range] || 0;
    
    // Type bonus
    const typeBonus = {
      'ultimate': 15,
      'special': 10,
      'attack': 5,
      'defense': 3,
      'support': 3,
      'passive': 1
    };
    rating += typeBonus[skill.type] || 0;
    
    // Special abilities bonus
    if (skill.special) {
      rating += Object.keys(skill.special).length * 3;
    }
    
    // Effect bonus
    if (skill.effect) {
      rating += 5;
      if (skill.effect.includes('enhanced_')) rating += 5;
      if (skill.effect.includes('advanced_')) rating += 3;
    }
    
    return Math.min(Math.round(rating), 100);
  }

  /**
   * Get top skills by power rating
   * @param {number} count - Number of top skills to return
   * @returns {Array} Top skills with power ratings
   */
  getTopSkillsByPower(count = 10) {
    const allSkillsWithRating = [];

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        const powerRating = this.calculateSkillPowerRating(skill);
        allSkillsWithRating.push({ 
          fruitId, 
          rarity, 
          powerRating,
          ...skill 
        });
      });
    });

    return allSkillsWithRating
      .sort((a, b) => b.powerRating - a.powerRating)
      .slice(0, count);
  }

  /**
   * Generate skill comparison report
   * @param {string} fruitId1 - First fruit ID
   * @param {string} fruitId2 - Second fruit ID
   * @returns {Object} Comparison report
   */
  compareSkills(fruitId1, fruitId2) {
    const skill1 = this.getSkillData(fruitId1);
    const skill2 = this.getSkillData(fruitId2);

    if (!skill1 || !skill2) {
      return { error: 'One or both skills not found' };
    }

    const rating1 = this.calculateSkillPowerRating(skill1);
    const rating2 = this.calculateSkillPowerRating(skill2);

    return {
      skill1: { fruitId: fruitId1, ...skill1, powerRating: rating1 },
      skill2: { fruitId: fruitId2, ...skill2, powerRating: rating2 },
      comparison: {
        damageWinner: skill1.damage > skill2.damage ? fruitId1 : fruitId2,
        cooldownWinner: skill1.cooldown < skill2.cooldown ? fruitId1 : fruitId2,
        powerRatingWinner: rating1 > rating2 ? fruitId1 : fruitId2,
        damageDifference: Math.abs(skill1.damage - skill2.damage),
        cooldownDifference: Math.abs(skill1.cooldown - skill2.cooldown),
        ratingDifference: Math.abs(rating1 - rating2)
      }
    };
  }
}

// Create and export singleton instance
const skillsManager = new DevilFruitSkillsManager();

// Legacy function exports for backward compatibility
const getSkillData = (fruitId, rarity) => skillsManager.getSkillData(fruitId, rarity);
const getFallbackSkill = (fruitId, rarity, fruitData) => skillsManager.generateFallbackSkill(fruitId, rarity, fruitData);
const getSkillsByRarity = (rarity) => skillsManager.getSkillsByRarity(rarity);
const validateSkillData = (skillData) => skillsManager.validateSkill(skillData);
const getSkillStats = () => skillsManager.getSkillStats();
const hasCustomSkill = (fruitId) => skillsManager.hasCustomSkill(fruitId);
const getAllSkills = () => skillsManager.getAllSkills();
const getSkillCounts = () => skillsManager.getSkillCounts();
const searchSkillsByName = (query) => skillsManager.searchSkills(query);
const getSkillsByDamageRange = (min, max) => skillsManager.getSkillsByDamageRange(min, max);
const isValidRarity = (rarity) => skillsManager.isValidRarity(rarity);

// Export both the manager instance and legacy functions
module.exports = {
  // Main manager instance
  skillsManager,
  
  // Individual skill tier exports
  DIVINE_TIER_SKILLS,
  MYTHICAL_TIER_SKILLS,
  LEGENDARY_TIER_SKILLS,
  EPIC_TIER_SKILLS,
  RARE_TIER_SKILLS,
  UNCOMMON_TIER_SKILLS,
  COMMON_TIER_SKILLS,

  // Legacy function exports for backward compatibility
  getSkillData,
  getFallbackSkill,
  getSkillsByRarity,
  validateSkillData,
  getSkillStats,
  hasCustomSkill,
  getAllSkills,
  getSkillCounts,
  searchSkillsByName,
  getSkillsByDamageRange,
  isValidRarity,

  // New advanced functions
  getTopSkillsByPower: (count) => skillsManager.getTopSkillsByPower(count),
  compareSkills: (id1, id2) => skillsManager.compareSkills(id1, id2),
  getRandomSkillFromTier: (rarity) => skillsManager.getRandomSkillFromTier(rarity),
  getSkillsWithSpecial: (special) => skillsManager.getSkillsWithSpecial(special),
  getTierInfo: () => skillsManager.getTierInfo(),
  validateAllSkills: () => skillsManager.validateAllSkills(),
  calculateSkillPowerRating: (skill) => skillsManager.calculateSkillPowerRating(skill),
  getSkillsByType: (type) => skillsManager.getSkillsByType(type)
};
