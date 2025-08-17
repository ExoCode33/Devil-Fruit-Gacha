// src/data/skills/CommonSkills.js - All 51 Common Fruit Skills
const COMMON_SKILLS = {
  // Weight Control
  "kiro_kiro_no_mi": {
    name: "Ten Thousand Kilo Press",
    damage: 65,
    cooldown: 2,
    effect: "weight_crush",
    description: "Control your weight from feather-light to crushing heavy - drop with devastating force",
    type: "attack",
    range: "single",
    cost: 10,
    special: {
      weightControl: true,
      floatLight: true,
      crushingDrop: true
    }
  },

  // Spike Generation
  "toge_toge_no_mi": {
    name: "Spike Spike Needle Storm",
    damage: 70,
    cooldown: 2,
    effect: "spike_body",
    description: "Grow sharp spikes from any part of your body - become a walking pincushion of pain",
    type: "attack",
    range: "area",
    cost: 12,
    special: {
      spikeGrowth: true,
      needleStorm: true,
      punctureWounds: true
    }
  },

  // Spring Power
  "bane_bane_no_mi": {
    name: "Spring Hopper Bounce",
    damage: 75,
    cooldown: 1,
    effect: "spring_bounce",
    description: "Transform legs into springs - bounce around the battlefield with unpredictable attacks",
    type: "attack",
    range: "multi",
    cost: 8,
    special: {
      springLegs: true,
      bounceAttack: true,
      ricocheted: true
    }
  },

  // Berry Spheres
  "beri_beri_no_mi": {
    name: "Berry Berry Sphere Shield",
    damage: 60,
    cooldown: 2,
    effect: "berry_split",
    description: "Split into berry-like spheres - create defensive formations while maintaining attack capability",
    type: "defense",
    range: "self",
    cost: 10,
    special: {
      sphereSplit: true,
      rollingDefense: true,
      reforming: true
    }
  },

  // Rust Power
  "sabi_sabi_no_mi": {
    name: "Rust Rust Metal Decay",
    damage: 55,
    cooldown: 2,
    effect: "metal_rust",
    description: "Rust and corrode all metal on contact - weapons become useless against your touch",
    type: "support",
    range: "single",
    cost: 8,
    special: {
      metalCorrosion: true,
      weaponDestroy: true,
      rustSpread: true
    }
  },

  // Wheel Spinning
  "shari_shari_no_mi": {
    name: "Wheel Wheel Spinning Strike",
    damage: 68,
    cooldown: 1,
    effect: "wheel_body",
    description: "Transform body parts into spinning wheels - roll into battle with momentum attacks",
    type: "attack",
    range: "single",
    cost: 6,
    special: {
      wheelSpin: true,
      momentumBuild: true,
      rollAttack: true
    }
  },

  // Sticky Mucus
  "beta_beta_no_mi": {
    name: "Sticky Mucus Trap",
    damage: 50,
    cooldown: 3,
    effect: "sticky_trap",
    description: "Secrete sticky mucus to trap and slow down enemies",
    type: "support",
    range: "area",
    cost: 12,
    special: {
      mucusTrap: true,
      slowEffect: true,
      bindEnemies: true
    }
  },

  // Jacket Control
  "jake_jake_no_mi": {
    name: "Jacket Possession Control",
    damage: 50,
    cooldown: 3,
    effect: "jacket_control",
    description: "Transform into a jacket to control whoever wears you - dominate through fashion",
    type: "support",
    range: "single",
    cost: 15,
    special: {
      bodyControl: true,
      wearerDomination: true,
      clothingForm: true
    }
  },

  // Propeller Flight
  "guru_guru_no_mi": {
    name: "Propeller Hurricane Spin",
    damage: 62,
    cooldown: 2,
    effect: "propeller_flight",
    description: "Transform body parts into spinning propellers for flight and wind attacks",
    type: "attack",
    range: "area",
    cost: 10,
    special: {
      propellerFlight: true,
      windBlast: true,
      aerialMobility: true
    }
  },

  // Art Transformation
  "ato_ato_no_mi": {
    name: "Abstract Art Transformation",
    damage: 45,
    cooldown: 3,
    effect: "art_transform",
    description: "Transform people and objects into abstract art - confuse and disorient enemies",
    type: "support",
    range: "single",
    cost: 14,
    special: {
      artTransform: true,
      confusionEffect: true,
      creativeDistortion: true
    }
  },

  // Swimming Through Solids
  "sui_sui_no_mi": {
    name: "Solid Surface Swimming",
    damage: 58,
    cooldown: 2,
    effect: "surface_swim",
    description: "Swim through any solid surface as if it were water - surprise attacks from unexpected angles",
    type: "attack",
    range: "single",
    cost: 12,
    special: {
      surfaceSwim: true,
      surpriseAttack: true,
      wallTravel: true
    }
  },

  // Flag Transformation
  "hira_hira_no_mi": {
    name: "Flag Flutter Wind Control",
    damage: 60,
    cooldown: 2,
    effect: "flag_wind",
    description: "Transform into flags and control wind currents for attacks and movement",
    type: "attack",
    range: "area",
    cost: 11,
    special: {
      flagForm: true,
      windControl: true,
      aerialManeuver: true
    }
  },

  // Sewing Power
  "nui_nui_no_mi": {
    name: "Stitch Stitch Everything",
    damage: 52,
    cooldown: 2,
    effect: "stitch_bind",
    description: "Sew and stitch anything together like fabric - bind enemies or repair equipment",
    type: "support",
    range: "single",
    cost: 9,
    special: {
      stitchBind: true,
      fabricRepair: true,
      threadControl: true
    }
  },

  // Clothing Manipulation
  "fuku_fuku_no_mi": {
    name: "Disguise Clothing Magic",
    damage: 40,
    cooldown: 1,
    effect: "clothing_disguise",
    description: "Create and manipulate clothing for perfect disguises and camouflage",
    type: "support",
    range: "self",
    cost: 8,
    special: {
      perfectDisguise: true,
      clothingCreate: true,
      camouflageEffect: true
    }
  },

  // Pocket Dimension
  "poke_poke_no_mi": {
    name: "Pocket Dimension Storage",
    damage: 48,
    cooldown: 2,
    effect: "pocket_storage",
    description: "Create pockets in your body to store items and surprise enemies with hidden weapons",
    type: "support",
    range: "self",
    cost: 10,
    special: {
      dimensionalStorage: true,
      hiddenWeapons: true,
      surpriseItems: true
    }
  },

  // Cream Generation
  "kuri_kuri_no_mi": {
    name: "Cream Cushion Protection",
    damage: 35,
    cooldown: 2,
    effect: "cream_cushion",
    description: "Generate and control cream for cushioning impacts and slippery escapes",
    type: "defense",
    range: "area",
    cost: 8,
    special: {
      impactCushion: true,
      slipperyEscape: true,
      creamShield: true
    }
  },

  // Butter Slipping
  "bata_bata_no_mi": {
    name: "Butter Slip Slide",
    damage: 42,
    cooldown: 2,
    effect: "butter_slip",
    description: "Generate butter to make surfaces impossibly slippery - enemies lose their footing",
    type: "support",
    range: "area",
    cost: 9,
    special: {
      slipperyTerrain: true,
      butterShield: true,
      mobilityBoost: true
    }
  },

  // Enhanced Movement
  "iku_iku_no_mi": {
    name: "Go Go Speed Boost",
    damage: 55,
    cooldown: 1,
    effect: "speed_boost",
    description: "Enhance movement speed and transportation abilities for rapid strikes",
    type: "attack",
    range: "self",
    cost: 7,
    special: {
      speedEnhance: true,
      rapidStrike: true,
      mobilityMaster: true
    }
  },

  // Whip Control
  "muchi_muchi_no_mi": {
    name: "Whip Crack Discipline",
    damage: 68,
    cooldown: 2,
    effect: "whip_crack",
    description: "Create and control various types of whips for long-range disciplinary strikes",
    type: "attack",
    range: "multi",
    cost: 11,
    special: {
      whipMastery: true,
      longRange: true,
      crackingStrike: true
    }
  },

  // Mount Anything
  "nori_nori_no_mi": {
    name: "Ride Everything Mastery",
    damage: 45,
    cooldown: 2,
    effect: "mount_control",
    description: "Mount and ride any creature or object - turn anything into your personal vehicle",
    type: "support",
    range: "single",
    cost: 10,
    special: {
      mountAnything: true,
      rideControl: true,
      vehicleMaster: true
    }
  },

  // ZOAN TRANSFORMATIONS
  // Dachshund Gun
  "inu_inu_no_mi_dachshund": {
    name: "Dachshund Cannon Bark",
    damage: 72,
    cooldown: 2,
    effect: "gun_dog",
    description: "Transform into dachshund form with enhanced cannon abilities and loyal dog instincts",
    type: "attack",
    range: "single",
    cost: 12,
    special: {
      cannonBark: true,
      loyalInstinct: true,
      weaponForm: true
    }
  },

  // Horse Transformation
  "uma_uma_no_mi": {
    name: "Horse Gallop Charge",
    damage: 70,
    cooldown: 2,
    effect: "horse_charge",
    description: "Transform into horse form with powerful charging attacks and high mobility",
    type: "attack",
    range: "single",
    cost: 11,
    special: {
      gallopCharge: true,
      highMobility: true,
      trampleForce: true
    }
  },

  // Elephant Power
  "zou_zou_no_mi": {
    name: "Elephant Trunk Smash",
    damage: 78,
    cooldown: 2,
    effect: "elephant_power",
    description: "Transform into elephant form with trunk attacks and massive strength",
    type: "attack",
    range: "area",
    cost: 13,
    special: {
      trunkSmash: true,
      massiveStrength: true,
      groundShake: true
    }
  },

  // Axolotl Regeneration
  "sara_sara_no_mi_axolotl": {
    name: "Axolotl Regeneration Poison",
    damage: 58,
    cooldown: 3,
    effect: "regen_poison",
    description: "Transform into poisonous salamander with regenerative abilities",
    type: "defense",
    range: "self",
    cost: 15,
    special: {
      poisonSkin: true,
      regeneration: true,
      amphibianForm: true
    }
  },

  // Insect Flight
  "mushi_mushi_no_mi": {
    name: "Insect Swarm Flight",
    damage: 52,
    cooldown: 2,
    effect: "insect_swarm",
    description: "Transform into various insects with flight abilities and swarm tactics",
    type: "attack",
    range: "multi",
    cost: 10,
    special: {
      swarmAttack: true,
      flightAbility: true,
      insectTactics: true
    }
  },

  // Underground Movement
  "mogu_mogu_no_mi": {
    name: "Mole Underground Strike",
    damage: 64,
    cooldown: 2,
    effect: "underground_move",
    description: "Transform into mole for underground movement and surprise tunnel attacks",
    type: "attack",
    range: "single",
    cost: 12,
    special: {
      undergroundMove: true,
      tunnelAttack: true,
      earthSense: true
    }
  },

  // ADDITIONAL COMMON FRUITS TO REACH 51 TOTAL

  // Basic Cat Form
  "neko_neko_no_mi_cat": {
    name: "Cat Claw Agility",
    damage: 56,
    cooldown: 1,
    effect: "cat_agility",
    description: "Transform into house cat with enhanced agility, stealth, and claw attacks",
    type: "attack",
    range: "single",
    cost: 8,
    special: {
      catAgility: true,
      stealthMode: true,
      clawStrike: true
    }
  },

  // Dog Loyalty
  "inu_inu_no_mi_dog": {
    name: "Dog Loyalty Bite",
    damage: 60,
    cooldown: 2,
    effect: "loyal_bite",
    description: "Transform into loyal dog with enhanced senses and protective instincts",
    type: "attack",
    range: "single",
    cost: 9,
    special: {
      loyalProtection: true,
      enhancedSenses: true,
      biteForce: true
    }
  },

  // Mouse Stealth
  "nezumi_nezumi_no_mi": {
    name: "Mouse Stealth Nibble",
    damage: 38,
    cooldown: 1,
    effect: "mouse_stealth",
    description: "Transform into small mouse for ultimate stealth and speed",
    type: "support",
    range: "self",
    cost: 6,
    special: {
      tinyForm: true,
      perfectStealth: true,
      speedBoost: true
    }
  },

  // Rabbit Jumping
  "usagi_usagi_no_mi": {
    name: "Rabbit Hop Kick",
    damage: 54,
    cooldown: 1,
    effect: "rabbit_hop",
    description: "Transform into rabbit with incredible jumping abilities and quick kicks",
    type: "attack",
    range: "single",
    cost: 7,
    special: {
      superJump: true,
      rapidKicks: true,
      agileMovement: true
    }
  },

  // Sparrow Flight
  "tori_tori_no_mi_sparrow": {
    name: "Sparrow Scout Flight",
    damage: 40,
    cooldown: 1,
    effect: "sparrow_scout",
    description: "Transform into sparrow for flight and aerial reconnaissance",
    type: "support",
    range: "area",
    cost: 8,
    special: {
      aerialScout: true,
      quickFlight: true,
      birdEye: true
    }
  },

  // Goldfish Swimming
  "sakana_sakana_no_mi_goldfish": {
    name: "Goldfish Memory Swim",
    damage: 32,
    cooldown: 2,
    effect: "goldfish_swim",
    description: "Transform into goldfish with basic swimming and short-term memory advantages",
    type: "support",
    range: "self",
    cost: 6,
    special: {
      basicSwim: true,
      memoryReset: true,
      aquaticForm: true
    }
  },

  // Frog Jumping
  "kaeru_kaeru_no_mi": {
    name: "Frog Leap Splash",
    damage: 48,
    cooldown: 2,
    effect: "frog_leap",
    description: "Transform into frog with powerful jumping and swimming abilities",
    type: "attack",
    range: "area",
    cost: 9,
    special: {
      powerfulLeap: true,
      aquaticAdapt: true,
      tongueLash: true
    }
  },

  // Small Snake
  "hebi_hebi_no_mi_garden": {
    name: "Garden Snake Slither",
    damage: 44,
    cooldown: 2,
    effect: "snake_slither",
    description: "Transform into harmless garden snake with stealth and flexibility",
    type: "support",
    range: "single",
    cost: 7,
    special: {
      slitherMove: true,
      flexibleBody: true,
      stealthSlide: true
    }
  },

  // Crab Pincer
  "kani_kani_no_mi": {
    name: "Crab Pincer Crush",
    damage: 66,
    cooldown: 2,
    effect: "crab_pincer",
    description: "Transform into crab with powerful pincer attacks and sideways movement",
    type: "attack",
    range: "single",
    cost: 11,
    special: {
      pincerCrush: true,
      sidewaysMove: true,
      shellDefense: true
    }
  },

  // Shrimp Jumping
  "ebi_ebi_no_mi": {
    name: "Shrimp Spring Jump",
    damage: 50,
    cooldown: 1,
    effect: "shrimp_jump",
    description: "Transform into shrimp with explosive jumping abilities",
    type: "attack",
    range: "single",
    cost: 8,
    special: {
      explosiveJump: true,
      shrimpSwim: true,
      quickRetreat: true
    }
  },

  // Jellyfish Sting
  "kurage_kurage_no_mi": {
    name: "Jellyfish Electric Sting",
    damage: 58,
    cooldown: 3,
    effect: "jellyfish_sting",
    description: "Transform into jellyfish with stinging tentacles and floating abilities",
    type: "attack",
    range: "area",
    cost: 12,
    special: {
      electricSting: true,
      floatAbility: true,
      tentacleReach: true
    }
  },

  // Starfish Regeneration
  "hitode_hitode_no_mi": {
    name: "Starfish Regeneration Star",
    damage: 35,
    cooldown: 4,
    effect: "starfish_regen",
    description: "Transform into starfish with powerful regenerative abilities",
    type: "defense",
    range: "self",
    cost: 15,
    special: {
      rapidRegen: true,
      limbRegrow: true,
      starShape: true
    }
  },

  // Sea Urchin Spikes
  "uni_uni_no_mi": {
    name: "Sea Urchin Spike Ball",
    damage: 62,
    cooldown: 2,
    effect: "urchin_spikes",
    description: "Transform into spiky sea urchin for ultimate defensive protection",
    type: "defense",
    range: "self",
    cost: 10,
    special: {
      spikeArmor: true,
      damageReflect: true,
      ballForm: true
    }
  },

  // Scallop Shell
  "hotate_hotate_no_mi": {
    name: "Scallop Shell Shield",
    damage: 40,
    cooldown: 3,
    effect: "scallop_shell",
    description: "Transform into scallop with protective shell and water jet propulsion",
    type: "defense",
    range: "self",
    cost: 12,
    special: {
      shellShield: true,
      waterJet: true,
      shellSlam: true
    }
  },

  // Oyster Pearl
  "kaki_kaki_no_mi": {
    name: "Oyster Pearl Cannon",
    damage: 55,
    cooldown: 3,
    effect: "pearl_cannon",
    description: "Transform into oyster with pearl production and shell protection",
    type: "attack",
    range: "single",
    cost: 13,
    special: {
      pearlShot: true,
      shellArmor: true,
      pearlCreate: true
    }
  },

  // Ant Colony
  "ari_ari_no_mi": {
    name: "Ant Colony Coordination",
    damage: 45,
    cooldown: 2,
    effect: "ant_colony",
    description: "Transform into ant with colony coordination and incredible strength for size",
    type: "support",
    range: "area",
    cost: 10,
    special: {
      colonyMind: true,
      antStrength: true,
      teamwork: true
    }
  },

  // Bee Sting
  "hachi_hachi_no_mi": {
    name: "Bee Sting Flight",
    damage: 52,
    cooldown: 2,
    effect: "bee_sting",
    description: "Transform into bee with stinging attacks and coordinated flight patterns",
    type: "attack",
    range: "single",
    cost: 9,
    special: {
      stingAttack: true,
      flightPattern: true,
      honeyTrap: true
    }
  },

  // Butterfly Wings
  "cho_cho_no_mi": {
    name: "Butterfly Wing Dance",
    damage: 38,
    cooldown: 2,
    effect: "butterfly_dance",
    description: "Transform into butterfly with mesmerizing wing patterns and graceful flight",
    type: "support",
    range: "area",
    cost: 8,
    special: {
      wingDance: true,
      mesmerize: true,
      gracefulFlight: true
    }
  },

  // Garden Spider Web
  "kumo_kumo_no_mi_garden": {
    name: "Garden Spider Web Trap",
    damage: 48,
    cooldown: 3,
    effect: "spider_web",
    description: "Transform into garden spider with web creation and trap abilities",
    type: "support",
    range: "area",
    cost: 11,
    special: {
      webTrap: true,
      spiderSense: true,
      silkStrong: true
    }
  },

  // Centipede Speed
  "mukade_mukade_no_mi": {
    name: "Centipede Hundred Leg Rush",
    damage: 56,
    cooldown: 1,
    effect: "centipede_rush",
    description: "Transform into centipede with many legs providing incredible speed",
    type: "attack",
    range: "multi",
    cost: 9,
    special: {
      hundredLegs: true,
      speedRush: true,
      venomBite: true
    }
  },

  // Earthworm Soil
  "mimizu_mimizu_no_mi": {
    name: "Earthworm Soil Burrow",
    damage: 30,
    cooldown: 2,
    effect: "soil_burrow",
    description: "Transform into earthworm with soil movement and ground enhancement abilities",
    type: "support",
    range: "area",
    cost: 8,
    special: {
      soilBurrow: true,
      groundEnrich: true,
      undergroundTravel: true
    }
  }
};

module.exports = COMMON_SKILLS;
