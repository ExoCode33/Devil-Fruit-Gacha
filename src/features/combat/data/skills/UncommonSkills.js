// src/data/skills/UncommonSkills.js - All 30 Uncommon Fruit Skills
const UNCOMMON_SKILLS = {
  // Animal Taming
  "kibi_kibi_no_mi": {
    name: "Dango Taming Command",
    damage: 70,
    cooldown: 2,
    effect: "animal_taming",
    description: "Tame any animal with magical dango - turn wild beasts into loyal companions",
    type: "support",
    range: "single",
    cost: 15,
    special: {
      animalTaming: true,
      dangoMagic: true,
      beastArmy: true
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
      blizzardStorm: true,
      snowWall: true
    }
  },

  // Soot Concealment
  "susu_susu_no_mi": {
    name: "Soot Storm Concealment",
    damage: 75,
    cooldown: 2,
    effect: "soot_cloud",
    description: "Create concealing clouds of soot - hide your movements while choking enemies",
    type: "support",
    range: "area",
    cost: 15,
    special: {
      sootCloud: true,
      concealment: true,
      chokingDust: true
    }
  },

  // Body Splitting
  "bara_bara_no_mi": {
    name: "Bara Bara Festival Split",
    damage: 80,
    cooldown: 2,
    effect: "body_split",
    description: "Split your body into pieces - become immune to slicing attacks and surprise enemies",
    type: "defense",
    range: "self",
    cost: 12,
    special: {
      sliceImmunity: true,
      bodyParts: true,
      surpriseFly: true
    }
  },

  // Explosion Body
  "bomu_bomu_no_mi": {
    name: "Nose Fancy Cannon",
    damage: 90,
    cooldown: 2,
    effect: "explosion_body",
    description: "Turn body parts into explosives - breath explosive attacks and immune to blasts",
    type: "attack",
    range: "area",
    cost: 15,
    special: {
      explosiveBody: true,
      blastImmunity: true,
      noseCannon: true
    }
  },

  // Steel Blades
  "supa_supa_no_mi": {
    name: "Steel Blade Body Slicer",
    damage: 95,
    cooldown: 2,
    effect: "blade_body",
    description: "Transform into living steel blades - cut through anything with metallic precision",
    type: "attack",
    range: "multi",
    cost: 16,
    special: {
      steelBody: true,
      bladeEdges: true,
      metalPrecision: true
    }
  },

  // Wax Creation
  "doru_doru_no_mi": {
    name: "Candle Champion Fortress",
    damage: 70,
    cooldown: 3,
    effect: "wax_creation",
    description: "Create wax constructs harder than steel - build fortresses and weapons from candle wax",
    type: "defense",
    range: "area",
    cost: 18,
    special: {
      waxHardening: true,
      fortressWax: true,
      candleWeapons: true
    }
  },

  // Eat Everything
  "baku_baku_no_mi": {
    name: "Munch Munch Incorporation",
    damage: 78,
    cooldown: 3,
    effect: "munch_incorporate",
    description: "Eat anything and incorporate it into your body - gain the properties of what you consume",
    type: "support",
    range: "self",
    cost: 16,
    special: {
      eatAnything: true,
      incorporateProperties: true,
      bodyModify: true
    }
  },

  // Perfect Mimicry
  "mane_mane_no_mi": {
    name: "Perfect Clone Mimicry",
    damage: 72,
    cooldown: 2,
    effect: "perfect_mimic",
    description: "Perfectly copy the appearance of anyone you touch - become the ultimate imposter",
    type: "support",
    range: "self",
    cost: 14,
    special: {
      perfectCopy: true,
      memoryFace: true,
      imposterMode: true
    }
  },

  // Soap Bubbles
  "awa_awa_no_mi": {
    name: "Soap Bubble Power Drain",
    damage: 65,
    cooldown: 3,
    effect: "soap_drain",
    description: "Create soap bubbles that clean away strength and defenses - make enemies slippery and weak",
    type: "support",
    range: "area",
    cost: 17,
    special: {
      strengthDrain: true,
      slipperyEffect: true,
      defenseCleaning: true
    }
  },

  // Slow Beam
  "noro_noro_no_mi": {
    name: "Noro Noro Slow Beam",
    damage: 68,
    cooldown: 2,
    effect: "time_slow",
    description: "Emit beams that slow down anything for 30 seconds - time manipulation at its basic form",
    type: "support",
    range: "multi",
    cost: 12,
    special: {
      timeSlowBeam: true,
      thirtySecondEffect: true,
      movementHinder: true
    }
  },

  // Scissors Cut
  "choki_choki_no_mi": {
    name: "Scissors Cut Dimension",
    damage: 88,
    cooldown: 2,
    effect: "scissor_cut",
    description: "Turn hands into scissors that can cut anything like paper - even the air itself",
    type: "attack",
    range: "single",
    cost: 15,
    special: {
      cutAnything: true,
      paperThin: true,
      dimensionCut: true
    }
  },

  // Washing Power
  "woshu_woshu_no_mi": {
    name: "Wash Wash Purification",
    damage: 60,
    cooldown: 3,
    effect: "purify_wash",
    description: "Wash and cleanse anything, including evil from hearts and corruption from souls",
    type: "support",
    range: "single",
    cost: 18,
    special: {
      evilCleanse: true,
      corruptionRemove: true,
      soulPurify: true
    }
  },

  // Book World
  "buku_buku_no_mi": {
    name: "Book World Prison",
    damage: 74,
    cooldown: 4,
    effect: "book_dimension",
    description: "Trap people in books and control entire book dimensions - literary imprisonment",
    type: "support",
    range: "single",
    cost: 20,
    special: {
      bookTrap: true,
      literaryWorld: true,
      storyControl: true
    }
  },

  // Ground Pushing
  "oshi_oshi_no_mi": {
    name: "Push Push Ground Shaper",
    damage: 82,
    cooldown: 3,
    effect: "ground_push",
    description: "Push and manipulate the ground like clay - reshape the battlefield to your advantage",
    type: "support",
    range: "area",
    cost: 16,
    special: {
      groundShape: true,
      clayManipulation: true,
      terrainControl: true
    }
  },

  // Inspiration Power
  "kobu_kobu_no_mi": {
    name: "Inspiration Battle Cry",
    damage: 0,
    cooldown: 4,
    effect: "inspire_allies",
    description: "Inspire others and boost their fighting spirit and abilities through revolutionary fervor",
    type: "support",
    range: "area",
    cost: 20,
    special: {
      allyBoost: true,
      spiritRaise: true,
      revolutionPower: true
    }
  },

  // Snake Transformation
  "hebi_hebi_no_mi_anaconda": {
    name: "Anaconda Constriction Crush",
    damage: 92,
    cooldown: 3,
    effect: "snake_constrict",
    description: "Transform into massive anaconda or king cobra with crushing constriction power",
    type: "attack",
    range: "single",
    cost: 18,
    special: {
      constrictCrush: true,
      snakeForm: true,
      venomFangs: true
    }
  },

  // Egg Evolution
  "tama_tama_no_mi": {
    name: "Egg Evolution Resurrection",
    damage: 76,
    cooldown: 5,
    effect: "egg_evolution",
    description: "Transform through egg and chicken forms - become stronger each time you're 'killed'",
    type: "defense",
    range: "self",
    cost: 20,
    special: {
      evolutionCycle: true,
      deathResurrection: true,
      strengthIncrease: true
    }
  },

  // Pegasus Flight
  "uma_uma_no_mi_pegasus": {
    name: "Pegasus Divine Flight",
    damage: 84,
    cooldown: 3,
    effect: "divine_flight",
    description: "Transform into mythical winged horse with divine flight and celestial powers",
    type: "attack",
    range: "area",
    cost: 17,
    special: {
      divineWings: true,
      celestialPower: true,
      skyDominance: true
    }
  },

  // Swamp Storage
  "numa_numa_no_mi": {
    name: "Swamp Storage Ambush",
    damage: 78,
    cooldown: 3,
    effect: "swamp_storage",
    description: "Create swamps and store unlimited items in your body - ambush from muddy terrain",
    type: "support",
    range: "area",
    cost: 19,
    special: {
      infiniteStorage: true,
      swampAmbush: true,
      mudTrap: true
    }
  },

  // Slippery Skin
  "sube_sube_no_mi": {
    name: "Perfect Slip Smoothness",
    damage: 58,
    cooldown: 2,
    effect: "slip_smooth",
    description: "Perfect smooth skin that makes everything slip off - attacks, dirt, even emotions",
    type: "defense",
    range: "self",
    cost: 12,
    special: {
      perfectSlip: true,
      attackDeflect: true,
      beautyEnhance: true
    }
  },

  // Iron Bonds
  "ori_ori_no_mi": {
    name: "Iron Cage Restraint",
    damage: 72,
    cooldown: 3,
    effect: "iron_restraint",
    description: "Create iron bonds and cages to restrain and capture enemies",
    type: "support",
    range: "multi",
    cost: 16,
    special: {
      ironBonds: true,
      cageCreation: true,
      restraintMaster: true
    }
  },

  // Cooking Power
  "kuku_kuku_no_mi": {
    name: "Gourmet Cooking Animation",
    damage: 64,
    cooldown: 3,
    effect: "cooking_animate",
    description: "Cook anything into delicious food and animate ingredients to fight for you",
    type: "support",
    range: "area",
    cost: 15,
    special: {
      ingredientAnimate: true,
      gourmetCooking: true,
      foodArmy: true
    }
  },

  // Liquid Consumption
  "gabu_gabu_no_mi": {
    name: "Infinite Drink Cannon",
    damage: 80,
    cooldown: 2,
    effect: "liquid_cannon",
    description: "Drink unlimited amounts of liquid and use them as pressurized weapons",
    type: "attack",
    range: "area",
    cost: 14,
    special: {
      liquidCannon: true,
      unlimitedDrink: true,
      pressureBlast: true
    }
  },

  // Tube Transformation
  "tsutsu_tsutsu_no_mi": {
    name: "Tube Cannon Barrage",
    damage: 86,
    cooldown: 2,
    effect: "tube_cannon",
    description: "Transform body parts into tubes for rapid-fire projectile attacks",
    type: "attack",
    range: "multi",
    cost: 15,
    special: {
      tubeBarrage: true,
      rapidFire: true,
      projectileMaster: true
    }
  },

  // Arrow Control
  "aro_aro_no_mi": {
    name: "Arrow Trajectory Master",
    damage: 88,
    cooldown: 2,
    effect: "arrow_control",
    description: "Control the trajectory of any projectile - make arrows curve and change direction",
    type: "attack",
    range: "multi",
    cost: 13,
    special: {
      trajectoryControl: true,
      curveShot: true,
      neverMiss: true
    }
  },

  // Bison Charge
  "ushi_ushi_no_mi_bison": {
    name: "Bison Stampede Charge",
    damage: 94,
    cooldown: 3,
    effect: "bison_stampede",
    description: "Transform into powerful bison with devastating charging attacks",
    type: "attack",
    range: "area",
    cost: 17,
    special: {
      stampedeCharge: true,
      bisonStrength: true,
      hornGore: true
    }
  },

  // Jackal Form
  "inu_inu_no_mi_jackal": {
    name: "Jackal Desert Hunter",
    damage: 82,
    cooldown: 2,
    effect: "desert_hunt",
    description: "Transform into desert jackal with enhanced senses and pack hunting instincts",
    type: "attack",
    range: "single",
    cost: 14,
    special: {
      desertAdapt: true,
      packHunting: true,
      enhancedSenses: true
    }
  },

  // Albatross Flight
  "tori_tori_no_mi_albatross": {
    name: "Albatross Ocean Soar",
    damage: 75,
    cooldown: 2,
    effect: "ocean_soar",
    description: "Transform into large seabird with excellent flight range and ocean mastery",
    type: "support",
    range: "area",
    cost: 16,
    special: {
      oceanMastery: true,
      longRangeFlight: true,
      weatherSense: true
    }
  },

  // Turtle Defense
  "kame_kame_no_mi": {
    name: "Turtle Shell Fortress",
    damage: 65,
    cooldown: 4,
    effect: "shell_fortress",
    description: "Transform into turtle with impenetrable shell defense and patient combat style",
    type: "defense",
    range: "self",
    cost: 18,
    special: {
      shellDefense: true,
      patientCounter: true,
      longevityBoost: true
    }
  },

  // Bat Echolocation
  "batto_batto_no_mi": {
    name: "Bat Echo Sonic Burst",
    damage: 70,
    cooldown: 2,
    effect: "echo_sonic",
    description: "Transform into bat with echolocation abilities and ultrasonic attacks",
    type: "attack",
    range: "area",
    cost: 15,
    special: {
      echolocation: true,
      ultrasonicBurst: true,
      nightVision: true
    }
  }
};

module.exports = UNCOMMON_SKILLS;
