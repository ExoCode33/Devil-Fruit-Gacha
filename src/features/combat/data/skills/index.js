// =====================================================
// PROPOSED NEW STRUCTURE
// =====================================================

// src/data/skills/index.js - Main Skills Manager
const DivineSkills = require('./DivineSkills');
const MythicalSkills = require('./MythicalSkills');
const LegendarySkills = require('./LegendarySkills');
const EpicSkills = require('./EpicSkills');
const RareSkills = require('./RareSkills');
const UncommonSkills = require('./UncommonSkills');
const CommonSkills = require('./CommonSkills');

class DevilFruitSkillsManager {
  constructor() {
    this.skillTiers = {
      divine: DivineSkills,
      mythical: MythicalSkills,
      legendary: LegendarySkills,
      epic: EpicSkills,
      rare: RareSkills,
      uncommon: UncommonSkills,
      common: CommonSkills
    };
  }

  /**
   * Get skill data for a specific fruit
   */
  getSkillData(fruitId, rarity) {
    // Try to find in appropriate tier first
    if (this.skillTiers[rarity] && this.skillTiers[rarity][fruitId]) {
      return this.skillTiers[rarity][fruitId];
    }

    // Search all tiers if not found
    for (const [tierName, tierSkills] of Object.entries(this.skillTiers)) {
      if (tierSkills[fruitId]) {
        return tierSkills[fruitId];
      }
    }

    // Return fallback skill
    return this.generateFallbackSkill(fruitId, rarity);
  }

  /**
   * Generate fallback skill based on rarity and fruit data
   */
  generateFallbackSkill(fruitId, rarity, fruitData = null) {
    const rarityTemplates = {
      divine: { 
        damage: [320, 350], 
        cooldown: [7, 9], 
        type: "ultimate", 
        cost: [85, 100],
        specialCount: 3
      },
      mythical: { 
        damage: [240, 290], 
        cooldown: [5, 7], 
        type: "special", 
        cost: [55, 80],
        specialCount: 2
      },
      legendary: { 
        damage: [170, 220], 
        cooldown: [3, 5], 
        type: "attack", 
        cost: [35, 50],
        specialCount: 2
      },
      epic: { 
        damage: [120, 170], 
        cooldown: [3, 5], 
        type: "attack", 
        cost: [25, 45],
        specialCount: 2
      },
      rare: { 
        damage: [90, 130], 
        cooldown: [2, 4], 
        type: "attack", 
        cost: [15, 30],
        specialCount: 1
      },
      uncommon: { 
        damage: [70, 100], 
        cooldown: [2, 3], 
        type: "attack", 
        cost: [10, 20],
        specialCount: 1
      },
      common: { 
        damage: [50, 80], 
        cooldown: [1, 2], 
        type: "attack", 
        cost: [5, 15],
        specialCount: 1
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

    return {
      name: fruitData ? `${fruitData.element} ${template.type.charAt(0).toUpperCase() + template.type.slice(1)}` : `${rarity} Power`,
      damage,
      cooldown,
      effect: this.getEffectByElement(fruitData?.element, rarity),
      description: fruitData ? 
        `Harness the power of ${fruitData.element} with this ${rarity}-level devil fruit technique` :
        `A ${rarity}-level devil fruit technique`,
      type: template.type,
      range: this.getRangeByType(template.type),
      cost,
      special
    };
  }

  /**
   * Generate special abilities based on fruit element and power level
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
      'Gravity': ['crushTarget', 'floatObject', 'massIncrease']
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
      'Gravity': 'gravity_crush'
    };

    const baseEffect = effectMap[element] || 'basic_damage';
    
    // Enhance effect based on rarity
    if (['divine', 'mythical'].includes(rarity)) {
      return `enhanced_${baseEffect}`;
    }
    
    return baseEffect;
  }

  /**
   * Get range based on attack type
   */
  getRangeByType(type) {
    const rangeMap = {
      'ultimate': 'all',
      'special': 'area',
      'attack': 'single',
      'defense': 'self',
      'support': 'area'
    };

    return rangeMap[type] || 'single';
  }

  /**
   * Get all skills for a specific rarity
   */
  getSkillsByRarity(rarity) {
    return this.skillTiers[rarity] || {};
  }

  /**
   * Get comprehensive statistics
   */
  getSkillStats() {
    const stats = {
      totalSkills: 0,
      byRarity: {},
      averageDamage: {},
      averageCooldown: {}
    };

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      const skillList = Object.values(skills);
      const count = skillList.length;
      
      stats.byRarity[rarity] = count;
      stats.totalSkills += count;

      if (count > 0) {
        const avgDamage = skillList.reduce((sum, skill) => sum + skill.damage, 0) / count;
        const avgCooldown = skillList.reduce((sum, skill) => sum + skill.cooldown, 0) / count;
        
        stats.averageDamage[rarity] = Math.round(avgDamage);
        stats.averageCooldown[rarity] = Math.round(avgCooldown * 10) / 10;
      }
    });

    return stats;
  }

  /**
   * Search skills by name or description
   */
  searchSkills(query) {
    const results = [];
    const lowercaseQuery = query.toLowerCase();

    Object.entries(this.skillTiers).forEach(([rarity, skills]) => {
      Object.entries(skills).forEach(([fruitId, skill]) => {
        if (skill.name.toLowerCase().includes(lowercaseQuery) ||
            skill.description.toLowerCase().includes(lowercaseQuery)) {
          results.push({ fruitId, rarity, ...skill });
        }
      });
    });

    return results;
  }

  /**
   * Validate skill data structure
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
    
    return { valid: true };
  }

  /**
   * Load all skill files and validate
   */
  validateAllSkills() {
    const errors = [];
    
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
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
module.exports = new DevilFruitSkillsManager();

// =====================================================
// EXAMPLE: src/data/skills/RareSkills.js
// =====================================================

const RARE_SKILLS = {
  // Blueno's Door Master
  "doa_doa_no_mi": {
    name: "Air Door Dimension Strike",
    damage: 120,
    cooldown: 3,
    effect: "dimensional_door",
    description: "Create doors in air itself - escape to pocket dimensions and strike from impossible angles",
    type: "attack",
    range: "single",
    cost: 25,
    special: {
      dimensionalEscape: true,
      airDoor: true,
      surpriseAttack: true
    }
  },

  // Baby 5's Weapon Transformation
  "buki_buki_no_mi": {
    name: "Full Arsenal Transformation",
    damage: 110,
    cooldown: 3,
    effect: "weapon_arsenal",
    description: "Transform into any weapon imaginable - become the perfect tool for destruction",
    type: "attack",
    range: "multi",
    cost: 20,
    special: {
      weaponShift: true,
      explosiveForm: true,
      precisionStrike: true
    }
  },

  // Memory Editing Power
  "memo_memo_no_mi": {
    name: "Memory Film Editing",
    damage: 80,
    cooldown: 4,
    effect: "memory_manipulation",
    description: "Edit memories like film reels - make enemies forget their abilities or create false experiences",
    type: "support",
    range: "single",
    cost: 30,
    special: {
      memoryEdit: true,
      abilityForget: true,
      falseMemory: true
    }
  },

  // Brain Enhancement
  "nomi_nomi_no_mi": {
    name: "Genius Brain Overdrive",
    damage: 90,
    cooldown: 5,
    effect: "brain_boost",
    description: "Expand brain capacity infinitely - store unlimited knowledge and predict enemy patterns",
    type: "support",
    range: "self",
    cost: 35,
    special: {
      infiniteKnowledge: true,
      patternPrediction: true,
      geniusMode: true
    }
  },

  // Hancock's Love Power
  "mero_mero_no_mi": {
    name: "Love Love Mellow Petrification",
    damage: 130,
    cooldown: 4,
    effect: "petrification",
    description: "Turn hearts to stone with overwhelming beauty - those who feel attraction become statues",
    type: "attack",
    range: "area",
    cost: 25,
    special: {
      beautyAura: true,
      stoneBeam: true,
      empressKick: true
    }
  },

  // Time Travel Power
  "toki_toki_no_mi": {
    name: "Time Leap to Future",
    damage: 0,
    cooldown: 8,
    effect: "time_travel",
    description: "Send yourself or others forward through time - escape death by jumping to the future",
    type: "support",
    range: "area",
    cost: 50,
    special: {
      futureJump: true,
      escapeTime: true,
      prophesy: true
    }
  },

  // Age Control
  "toshi_toshi_no_mi": {
    name: "Age Age Distortion Field",
    damage: 100,
    cooldown: 3,
    effect: "age_manipulation",
    description: "Control the flow of age itself - turn enemies into helpless children or frail elders",
    type: "attack",
    range: "multi",
    cost: 20,
    special: {
      ageReverse: true,
      rapidAging: true,
      primeForm: true
    }
  },

  // Size Growth
  "deka_deka_no_mi": {
    name: "Colossal Battleship Growth",
    damage: 140,
    cooldown: 4,
    effect: "giant_growth",
    description: "Grow to the size of a battleship - become a walking fortress of destruction",
    type: "attack",
    range: "area",
    cost: 35,
    special: {
      colossalSize: true,
      shipForm: true,
      massiveReach: true
    }
  },

  // Living Art
  "fude_fude_no_mi": {
    name: "Ink Ink Living Nightmare",
    damage: 105,
    cooldown: 4,
    effect: "living_art",
    description: "Bring nightmarish drawings to life - ink creatures that fight with artistic fury",
    type: "support",
    range: "area",
    cost: 25,
    special: {
      inkCreatures: true,
      artisticFury: true,
      nightmareForm: true
    }
  },

  // Disease Control
  "shiku_shiku_no_mi": {
    name: "Plague Doctor's Epidemic",
    damage: 95,
    cooldown: 5,
    effect: "disease_spread",
    description: "Spread deadly diseases and plagues - weaken enemies with supernatural sickness",
    type: "attack",
    range: "area",
    cost: 30,
    special: {
      plagueSpread: true,
      diseaseImmunity: true,
      weakenAll: true
    }
  },

  // Continue pattern for all 30 rare fruits...
  // This shows how each file would be structured

  // Diamond Defense
  "kira_kira_no_mi": {
    name: "Diamond Jozu Brilliance",
    damage: 125,
    cooldown: 3,
    effect: "diamond_body",
    description: "Transform into the hardest substance - diamond body that reflects and refracts attacks",
    type: "defense",
    range: "self",
    cost: 20,
    special: {
      diamondHardness: true,
      lightRefraction: true,
      brilliantCutter: true
    }
  },

  // Sound Wave Attacks
  "oto_oto_no_mi": {
    name: "Sonic Boom Orchestra",
    damage: 115,
    cooldown: 3,
    effect: "sound_waves",
    description: "Convert body parts into musical instruments for devastating sonic attacks",
    type: "attack",
    range: "area",
    cost: 22,
    special: {
      sonicBoom: true,
      rhythmControl: true,
      soundBarrier: true
    }
  },

  // Mirror World
  "mira_mira_no_mi": {
    name: "Mirror World Reflection",
    damage: 85,
    cooldown: 4,
    effect: "mirror_dimension",
    description: "Create mirrors and travel through mirror dimensions - reflect attacks and confuse enemies",
    type: "support",
    range: "area",
    cost: 28,
    special: {
      mirrorTravel: true,
      reflectAttacks: true,
      illusionMirrors: true
    }
  },

  // Object Fusion
  "gocha_gocha_no_mi": {
    name: "Fusion Combination Art",
    damage: 110,
    cooldown: 4,
    effect: "object_fusion",
    description: "Fuse different objects together into powerful new combinations",
    type: "support",
    range: "area",
    cost: 25,
    special: {
      objectMerge: true,
      strengthCombine: true,
      creativeWeapons: true
    }
  },

  // Object Rupturing
  "pamu_pamu_no_mi": {
    name: "Rupture Explosion Chain",
    damage: 125,
    cooldown: 3,
    effect: "rupture_explosion",
    description: "Make inorganic objects rupture and explode in devastating chain reactions",
    type: "attack",
    range: "area",
    cost: 23,
    special: {
      chainExplosion: true,
      ruptureControl: true,
      metalWeakness: true
    }
  },

  // Additional rare skills following the same pattern...
  // Each rare fruit should have a unique, lore-accurate skill
  
  // Soul Projection
  "yomi_yomi_no_mi": {
    name: "Soul King's Astral Strike",
    damage: 95,
    cooldown: 4,
    effect: "soul_projection",
    description: "Project your soul from your body to attack while remaining unhittable",
    type: "attack",
    range: "single",
    cost: 30,
    special: {
      astralForm: true,
      soulAttack: true,
      phaseThrough: true
    }
  },

  // Lock-on Targeting
  "mato_mato_no_mi": {
    name: "Mark Mark Homing Strike",
    damage: 105,
    cooldown: 3,
    effect: "homing_mark",
    description: "Mark targets for homing attacks that never miss their intended destination",
    type: "attack",
    range: "single",
    cost: 20,
    special: {
      neverMiss: true,
      multiMark: true,
      homingPower: true
    }
  },

  // Candy Creation
  "pero_pero_no_mi": {
    name: "Candy Wall Fortress",
    damage: 90,
    cooldown: 4,
    effect: "candy_creation",
    description: "Create candy structures and weapons - sweet defense with bitter consequences",
    type: "defense",
    range: "area",
    cost: 25,
    special: {
      candyWalls: true,
      sugarRush: true,
      stickTrap: true
    }
  },

  // Aging Power
  "juku_juku_no_mi": {
    name: "Maturation Ripening Touch",
    damage: 75,
    cooldown: 3,
    effect: "aging_touch",
    description: "Age and ripen anything to maturity - weapons rust, defenses crumble",
    type: "support",
    range: "single",
    cost: 18,
    special: {
      weaponRust: true,
      buildingDecay: true,
      fruitRipen: true
    }
  },

  // Weight Multiplication
  "ton_ton_no_mi": {
    name: "Ten Thousand Ton Drop",
    damage: 135,
    cooldown: 4,
    effect: "massive_weight",
    description: "Increase weight to 10,000 tons and drop with crushing force",
    type: "attack",
    range: "single",
    cost: 27,
    special: {
      weightCrush: true,
      groundShatter: true,
      unstoppableForce: true
    }
  },

  // Falcon Speed
  "tori_tori_no_mi_falcon": {
    name: "Falcon Strike Velocity",
    damage: 100,
    cooldown: 2,
    effect: "aerial_speed",
    description: "Strike with the speed of a peregrine falcon - fastest predator in the sky",
    type: "attack",
    range: "single",
    cost: 18,
    special: {
      diveBomb: true,
      aerialDominance: true,
      speedBlitz: true
    }
  },

  // Additional skills would continue this pattern...
  // Each fruit gets a unique, lore-accurate skill that respects One Piece canon
};

module.exports = RARE_SKILLS;

// =====================================================
// EXAMPLE: src/data/skills/UncommonSkills.js  
// =====================================================

const UNCOMMON_SKILLS = {
  // Animal Taming
  "kibi_kibi_no_mi": {
    name: "Dango Taming Command",
    damage: 70,
    cooldown: 2,
    effect: "animal_taming",
    description: "Tame any animal with magical dango - turn beasts into loyal companions",
    type: "support",
    range: "single",
    cost: 15,
    special: {
      animalTaming: true,
      dangoMagic: true
    }
  },

  // Snow Control
  "yuki_yuki_no_mi": {
    name: "Snow Woman's Blizzard",
    damage: 85,
    cooldown: 3,
    effect: "snow_storm",
    description: "Become snow itself - create blizzards that blind and freeze enemies",
    type: "attack",
    range: "area",
    cost: 18,
    special: {
      snowForm: true,
      blizzardStorm: true
    }
  },

  // Soot Concealment
  "susu_susu_no_mi": {
    name: "Soot Storm Concealment",
    damage: 75,
    cooldown: 2,
    effect: "soot_cloud",
    description: "Create concealing clouds of soot - hide movements while choking enemies",
    type: "support",
    range: "area",
    cost: 15,
    special: {
      sootCloud: true,
      concealment: true
    }
  },

  // Body Splitting
  "bara_bara_no_mi": {
    name: "Bara Bara Festival Split",
    damage: 80,
    cooldown: 2,
    effect: "body_split",
    description: "Split body into pieces - immune to slicing attacks and surprise enemies",
    type: "defense",
    range: "self",
    cost: 12,
    special: {
      sliceImmunity: true,
      surpriseFly: true
    }
  },

  // Continue for all 30 uncommon fruits...
  // Each with balanced damage (70-100), cooldown (2-3), cost (10-20)
};

module.exports = UNCOMMON_SKILLS;

// =====================================================
// EXAMPLE: src/data/skills/CommonSkills.js
// =====================================================

const COMMON_SKILLS = {
  // Weight Control
  "kiro_kiro_no_mi": {
    name: "Ten Thousand Kilo Press",
    damage: 65,
    cooldown: 2,
    effect: "weight_crush",
    description: "Control weight from feather-light to crushing heavy - drop with devastating force",
    type: "attack",
    range: "single",
    cost: 10,
    special: {
      weightControl: true
    }
  },

  // Spike Generation
  "toge_toge_no_mi": {
    name: "Spike Spike Needle Storm",
    damage: 70,
    cooldown: 2,
    effect: "spike_body",
    description: "Grow sharp spikes from any part of your body - become a walking pincushion",
    type: "attack",
    range: "area",
    cost: 12,
    special: {
      spikeGrowth: true
    }
  },

  // Continue for all 51 common fruits...
  // Each with balanced damage (50-80), cooldown (1-2), cost (5-15)
};

module.exports = COMMON_SKILLS;
