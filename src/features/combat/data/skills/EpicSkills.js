// src/data/skills/EpicSkills.js - All 24 Epic Fruit Skills
const EPIC_SKILLS = {
  // Sugar's Reality Erasure
  "hobi_hobi_no_mi": {
    name: "Toy Transformation Erasure",
    damage: 120,
    cooldown: 6,
    effect: "existential_erasure",
    description: "One touch turns enemies into toys while erasing their existence from memory",
    type: "special",
    range: "single",
    cost: 60,
    special: {
      toyTransformation: true,
      memoryErase: true,
      contractBinding: true
    }
  },

  // Caesar's Gas Master
  "gasu_gasu_no_mi": {
    name: "Shinokuni Death Gas",
    damage: 140,
    cooldown: 4,
    effect: "death_gas",
    description: "Become a master of gas - poisonous death that spreads through the air",
    type: "attack",
    range: "area",
    cost: 35,
    special: {
      gasSpread: true,
      oxygenRemoval: true,
      chemicalWeapons: true
    }
  },

  // Moria's Shadow Army
  "kage_kage_no_mi": {
    name: "Shadow's Asgard Army",
    damage: 130,
    cooldown: 5,
    effect: "shadow_mastery",
    description: "Command an army of shadows - steal shadows to create undead warriors",
    type: "support",
    range: "area",
    cost: 40,
    special: {
      shadowArmy: true,
      shadowAbsorption: true,
      nightmareForm: true
    }
  },

  // Pica's Stone Assimilation
  "ishi_ishi_no_mi": {
    name: "Stone Giant Assimilation",
    damage: 150,
    cooldown: 4,
    effect: "stone_giant",
    description: "Become one with stone itself - merge with buildings to become a colossal warrior",
    type: "attack",
    range: "area",
    cost: 35,
    special: {
      stoneAssimilation: true,
      giantForm: true,
      buildingMerge: true
    }
  },

  // Mansherry's Miracle Healing
  "chiyu_chiyu_no_mi": {
    name: "Heal Everything Miracle",
    damage: 0,
    cooldown: 3,
    effect: "miracle_healing",
    description: "Heal any wound instantly - the power to cure even the most fatal injuries",
    type: "support",
    range: "area",
    cost: 30,
    special: {
      instantHeal: true,
      cureAll: true,
      lifeRestoration: true
    }
  },

  // Avalo Pizarro's Island Control
  "shima_shima_no_mi": {
    name: "Island Ship Manipulation",
    damage: 160,
    cooldown: 5,
    effect: "island_control",
    description: "Merge with entire islands - control landmasses as extensions of your body",
    type: "attack",
    range: "all",
    cost: 45,
    special: {
      islandMerge: true,
      landmassControl: true,
      territoryDominance: true
    }
  },

  // Robin's Thousand Arms
  "hana_hana_no_mi": {
    name: "Thousand Fleur Clutch",
    damage: 135,
    cooldown: 3,
    effect: "body_bloom",
    description: "Bloom body parts anywhere - grab and crush with the power of a thousand arms",
    type: "attack",
    range: "multi",
    cost: 25,
    special: {
      multipleGrab: true,
      jointCrush: true,
      spinalSnap: true
    }
  },

  // Cracker's Infinite Biscuits
  "bisu_bisu_no_mi": {
    name: "Biscuit Soldier Army",
    damage: 145,
    cooldown: 4,
    effect: "biscuit_army",
    description: "Create an endless army of hardened biscuit soldiers that fight with unwavering loyalty",
    type: "support",
    range: "area",
    cost: 35,
    special: {
      biscuitArmy: true,
      infiniteGeneration: true,
      hardenedDefense: true
    }
  },

  // Daifuku's Genie Power
  "hoya_hoya_no_mi": {
    name: "Genie Lamp Rampage",
    damage: 140,
    cooldown: 4,
    effect: "genie_summon",
    description: "Summon a massive genie from your body - wish for destruction and it shall be granted",
    type: "attack",
    range: "area",
    cost: 30,
    special: {
      genieSummon: true,
      wishPower: true,
      spectralAttack: true
    }
  },

  // Smoothie's Liquid Extraction
  "shibo_shibo_no_mi": {
    name: "Life Juice Extraction",
    damage: 155,
    cooldown: 4,
    effect: "liquid_extraction",
    description: "Wring out the very life essence from enemies - grow stronger by draining their fluids",
    type: "attack",
    range: "single",
    cost: 30,
    special: {
      fluidDrain: true,
      sizeIncrease: true,
      strengthAbsorption: true
    }
  },

  // Hawkins' Voodoo Power
  "wara_wara_no_mi": {
    name: "Straw Voodoo Redirect",
    damage: 125,
    cooldown: 5,
    effect: "voodoo_doll",
    description: "Create voodoo dolls that redirect all damage - let others suffer for your pain",
    type: "defense",
    range: "self",
    cost: 35,
    special: {
      damageRedirect: true,
      voodooDoll: true,
      fateManipulation: true
    }
  },

  // Capone's Fortress
  "shiro_shiro_no_mi": {
    name: "Castle Tank Formation",
    damage: 150,
    cooldown: 4,
    effect: "fortress_mode",
    description: "Transform into a mobile fortress - become an impregnable castle with artillery",
    type: "defense",
    range: "area",
    cost: 40,
    special: {
      fortressForm: true,
      artilleryFire: true,
      mobileCastle: true
    }
  },

  // Ivankov's Hormone Control
  "horu_horu_no_mi": {
    name: "Hormone Revolution Therapy",
    damage: 132,
    cooldown: 4,
    effect: "hormone_control",
    description: "Control hormones to enhance abilities and completely change bodies",
    type: "support",
    range: "single",
    cost: 32,
    special: {
      genderChange: true,
      abilityEnhance: true,
      bodyModify: true
    }
  },

  // Van Augur's Teleportation
  "wapu_wapu_no_mi": {
    name: "Warp Warp Dimensional Jump",
    damage: 128,
    cooldown: 3,
    effect: "teleportation",
    description: "Instantly teleport self and others across great distances",
    type: "support",
    range: "area",
    cost: 38,
    special: {
      longRangeTeleport: true,
      groupTransport: true,
      dimensionalJump: true
    }
  },

  // Smoker's Smoke Prison
  "moku_moku_no_mi": {
    name: "White Smoke Prison",
    damage: 118,
    cooldown: 3,
    effect: "smoke_prison",
    description: "User becomes smoke and can trap enemies in inescapable smoke prison",
    type: "support",
    range: "area",
    cost: 28,
    special: {
      smokePrison: true,
      intangibleForm: true,
      smokeTraps: true
    }
  },

  // Shiryu's Invisibility
  "suke_suke_no_mi": {
    name: "Clear Clear Invisible Strike",
    damage: 142,
    cooldown: 3,
    effect: "total_invisibility",
    description: "Become completely invisible along with anything touched - the perfect assassin",
    type: "attack",
    range: "single",
    cost: 30,
    special: {
      perfectInvisibility: true,
      silentKill: true,
      assassinStrike: true
    }
  },

  // Burgess' Strength
  "riki_riki_no_mi": {
    name: "Strength Strength Mountain Crusher",
    damage: 165,
    cooldown: 3,
    effect: "superhuman_strength",
    description: "Amplify physical strength to incredible levels - crush mountains with bare hands",
    type: "attack",
    range: "area",
    cost: 25,
    special: {
      mountainCrusher: true,
      superStrength: true,
      shockwaveForce: true
    }
  },

  // Chopper's Human Form
  "hito_hito_no_mi_chopper": {
    name: "Monster Point Rampage",
    damage: 148,
    cooldown: 5,
    effect: "monster_transformation",
    description: "Transform into human form with multiple transformation points and monster power",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      monsterPoint: true,
      multipleTransforms: true,
      rumbleBall: true
    }
  },

  // X Drake's Allosaurus
  "ryu_ryu_no_mi_allosaurus": {
    name: "Allosaurus Ancient Hunt",
    damage: 152,
    cooldown: 3,
    effect: "ancient_predator",
    description: "Fierce ancient carnivorous dinosaur with powerful jaws and predator instincts",
    type: "attack",
    range: "single",
    cost: 30,
    special: {
      ancientHunter: true,
      powerfulJaws: true,
      predatorInstinct: true
    }
  },

  // Page One's Spinosaurus
  "ryu_ryu_no_mi_spinosaurus": {
    name: "Spinosaurus Aquatic Destroyer",
    damage: 146,
    cooldown: 4,
    effect: "aquatic_dinosaur",
    description: "Massive ancient dinosaur adapted for both land and water combat",
    type: "attack",
    range: "area",
    cost: 32,
    special: {
      aquaticAdapt: true,
      sailFin: true,
      amphibiousStrike: true
    }
  },

  // Ulti's Pachycephalosaurus
  "ryu_ryu_no_mi_pachycephalosaurus": {
    name: "Pachycephalosaurus Skull Bash",
    damage: 158,
    cooldown: 3,
    effect: "skull_crusher",
    description: "Ancient dinosaur with incredibly thick skull for devastating headbutts",
    type: "attack",
    range: "single",
    cost: 28,
    special: {
      skullBash: true,
      thickSkull: true,
      headbuttMaster: true
    }
  },

  // Sasaki's Triceratops
  "ryu_ryu_no_mi_triceratops": {
    name: "Triceratops Tri-Horn Charge",
    damage: 154,
    cooldown: 4,
    effect: "horn_charge",
    description: "Ancient armored dinosaur with powerful three-horn charging attacks",
    type: "attack",
    range: "area",
    cost: 30,
    special: {
      triHornCharge: true,
      armoredHide: true,
      unstoppableCharge: true
    }
  },

  // Black Maria's Ancient Spider
  "kumo_kumo_no_mi_rosamygale": {
    name: "Ancient Spider Web Dominion",
    damage: 138,
    cooldown: 4,
    effect: "ancient_web",
    description: "Ancient spider form with massive web manipulation and ancient venom",
    type: "support",
    range: "area",
    cost: 35,
    special: {
      ancientWeb: true,
      venomFangs: true,
      webDominion: true
    }
  },

  // Who's-Who's Saber Tiger
  "neko_neko_no_mi_saber_tiger": {
    name: "Saber Tiger Ancient Fangs",
    damage: 144,
    cooldown: 3,
    effect: "saber_fangs",
    description: "Ancient predatory cat with massive saber teeth and prehistoric hunting skills",
    type: "attack",
    range: "single",
    cost: 28,
    special: {
      saberFangs: true,
      ancientHunter: true,
      prehistoricPower: true
    }
  }
};

module.exports = EPIC_SKILLS;
