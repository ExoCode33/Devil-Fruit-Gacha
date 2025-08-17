// src/data/skills/RareSkills.js - All 30 Rare Fruit Skills
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

  // Nine-Tailed Fox
  "inu_inu_no_mi_kyubi": {
    name: "Nine-Tailed Fox Illusion",
    damage: 115,
    cooldown: 4,
    effect: "fox_illusion",
    description: "Create illusions with nine-tailed fox power - confuse enemies with false realities",
    type: "support",
    range: "area",
    cost: 25,
    special: {
      nineTails: true,
      illusionMaster: true,
      foxFire: true
    }
  },

  // Eight-Headed Serpent
  "hebi_hebi_no_mi_yamata": {
    name: "Eight-Headed Serpent Rampage",
    damage: 135,
    cooldown: 4,
    effect: "eight_heads",
    description: "Become the legendary eight-headed serpent - multiple attacks with venomous fury",
    type: "attack",
    range: "multi",
    cost: 30,
    special: {
      eightHeads: true,
      serpentVenom: true,
      multiStrike: true
    }
  },

  // Ancient Giraffe
  "ryu_ryu_no_mi_kirin": {
    name: "Kirin Neck Whip Strike",
    damage: 118,
    cooldown: 3,
    effect: "neck_whip",
    description: "Ancient long-necked creature with devastating whip-like neck attacks",
    type: "attack",
    range: "multi",
    cost: 22,
    special: {
      neckWhip: true,
      longReach: true,
      ancientPower: true
    }
  },

  // Artificial Dragon
  "artificial_dragon_fruit": {
    name: "Incomplete Dragon Roar",
    damage: 108,
    cooldown: 4,
    effect: "dragon_flame",
    description: "Artificial dragon fruit with growing power - flame breath and flight capabilities",
    type: "attack",
    range: "area",
    cost: 28,
    special: {
      dragonBreath: true,
      artificialGrowth: true,
      flightMode: true
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

  // Karma Conversion
  "unnamed_paramecia_urouge": {
    name: "Karma Damage Conversion",
    damage: 95,
    cooldown: 4,
    effect: "karma_power",
    description: "Convert received damage into increased physical strength - pain becomes power",
    type: "defense",
    range: "self",
    cost: 25,
    special: {
      damageToStrength: true,
      karmaBalance: true,
      painPower: true
    }
  },

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

  // Ghost Negativity
  "horo_horo_no_mi": {
    name: "Negative Hollow Depression",
    damage: 65,
    cooldown: 3,
    effect: "negative_ghosts",
    description: "Create ghosts that drain willpower and cause overwhelming negativity",
    type: "support",
    range: "area",
    cost: 20,
    special: {
      willpowerDrain: true,
      depressionAura: true,
      ghostPhase: true
    }
  },

  // X-ray Vision
  "giro_giro_no_mi": {
    name: "Glare Glare Mind Reading",
    damage: 70,
    cooldown: 3,
    effect: "mind_read",
    description: "See through anything and read minds and emotions with penetrating gaze",
    type: "support",
    range: "single",
    cost: 22,
    special: {
      xrayVision: true,
      mindReading: true,
      emotionSense: true
    }
  },

  // Heat Transfer
  "netsu_netsu_no_mi": {
    name: "Heat Transfer Overdrive",
    damage: 112,
    cooldown: 3,
    effect: "heat_transfer",
    description: "Heat up your body and anything you touch to extreme temperatures",
    type: "attack",
    range: "single",
    cost: 20,
    special: {
      heatTransfer: true,
      burnTouch: true,
      temperatureControl: true
    }
  },

  // Scroll Storage
  "maki_maki_no_mi": {
    name: "Scroll Storage Jutsu",
    damage: 85,
    cooldown: 3,
    effect: "scroll_storage",
    description: "Store and retrieve objects from magical scrolls - ninja techniques made real",
    type: "support",
    range: "area",
    cost: 24,
    special: {
      scrollStorage: true,
      ninjaArts: true,
      instantSummon: true
    }
  },

  // Sound Nullification
  "nagi_nagi_no_mi": {
    name: "Calm Calm Soundproof Barrier",
    damage: 60,
    cooldown: 4,
    effect: "sound_null",
    description: "Create soundproof barriers and nullify all sounds within your domain",
    type: "support",
    range: "area",
    cost: 25,
    special: {
      soundBarrier: true,
      silentZone: true,
      stealthMode: true
    }
  },

  // Wolf Pack
  "inu_inu_no_mi_wolf": {
    name: "Wolf Pack Alpha Strike",
    damage: 105,
    cooldown: 3,
    effect: "pack_hunt",
    description: "Transform into wolf with pack hunting instincts and leadership aura",
    type: "attack",
    range: "multi",
    cost: 20,
    special: {
      packLeader: true,
      huntingInstinct: true,
      alphaRoar: true
    }
  }
};

module.exports = RARE_SKILLS;
