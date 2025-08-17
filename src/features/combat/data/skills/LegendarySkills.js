// src/data/skills/LegendarySkills.js - All 14 Legendary Fruit Skills
const LEGENDARY_SKILLS = {
  // Kuma's Paw Repulsion
  "nikyu_nikyu_no_mi": {
    name: "Ursus Shock Wave",
    damage: 200,
    cooldown: 5,
    effect: "paw_repulsion",
    description: "Repel everything - even pain itself - and compress air into devastating paw-shaped bombs",
    type: "attack",
    range: "area",
    cost: 50,
    special: {
      repelEverything: true,
      painExtraction: true,
      airCompression: true
    }
  },

  // Law's Spatial Surgery
  "ope_ope_no_mi": {
    name: "ROOM - Puncture Wille",
    damage: 190,
    cooldown: 4,
    effect: "spatial_surgery",
    description: "Create a surgical room where you are the absolute doctor - cut space itself with precision",
    type: "attack",
    range: "multi",
    cost: 45,
    special: {
      spatialCut: true,
      organDamage: true,
      positionSwap: true
    }
  },

  // Crocodile's Desert King
  "suna_suna_no_mi": {
    name: "Desert Spada Dehydration",
    damage: 180,
    cooldown: 4,
    effect: "desert_king",
    description: "Command the desert itself - sand that drains moisture and life from everything it touches",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      moistureDrain: true,
      sandstorm: true,
      desertTerrain: true
    }
  },

  // Magellan's Poison Hell
  "doku_doku_no_mi": {
    name: "Venom Demon Hell's Judgment",
    damage: 175,
    cooldown: 5,
    effect: "poison_hell",
    description: "Become a demon of poison - toxic death that spreads and corrupts everything nearby",
    type: "attack",
    range: "area",
    cost: 45,
    special: {
      poisonSpread: true,
      venomDemon: true,
      toxicImmunity: true
    }
  },

  // Shiki's Float Control
  "fuwa_fuwa_no_mi": {
    name: "Lion's Threat Earth Float",
    damage: 185,
    cooldown: 5,
    effect: "float_mastery",
    description: "Make the earth itself your weapon - floating islands and seas that crush from above",
    type: "attack",
    range: "area",
    cost: 50,
    special: {
      islandFloat: true,
      earthWeapons: true,
      aerialAdvantage: true
    }
  },

  // Bartolomeo's Absolute Defense
  "bari_bari_no_mi": {
    name: "Barrier Crash Absolute Defense",
    damage: 160,
    cooldown: 3,
    effect: "absolute_barrier",
    description: "Create barriers that nothing can break - defense becomes the ultimate offense",
    type: "defense",
    range: "area",
    cost: 35,
    special: {
      unbreakableBarrier: true,
      barrierCrash: true,
      reflectAll: true
    }
  },

  // Kid's Magnetic Force
  "jiki_jiki_no_mi": {
    name: "Electromagnetic Railgun Punk",
    damage: 195,
    cooldown: 4,
    effect: "magnetic_force",
    description: "Turn the battlefield's metal into weapons - electromagnetic force that attracts destruction",
    type: "attack",
    range: "multi",
    cost: 40,
    special: {
      metalControl: true,
      electromagneticRail: true,
      ironWill: true
    }
  },

  // Katakuri's Perfect Mochi
  "mochi_mochi_no_mi": {
    name: "Power Mochi Future Sight",
    damage: 170,
    cooldown: 4,
    effect: "future_sight_mochi",
    description: "See the future and shape mochi accordingly - attacks that hit before they're thrown",
    type: "attack",
    range: "multi",
    cost: 45,
    special: {
      futureSight: true,
      mochiTrap: true,
      perfectDodge: true
    }
  },

  // Rob Lucci's Predator Instinct
  "neko_neko_no_mi_leopard": {
    name: "Leopard Rokushiki Rampage",
    damage: 185,
    cooldown: 3,
    effect: "predator_instinct",
    description: "Unleash the perfect predator - leopard speed combined with martial arts mastery",
    type: "attack",
    range: "single",
    cost: 35,
    special: {
      rokushikiMastery: true,
      predatorSpeed: true,
      criticalHunt: true
    }
  },

  // Jack's Ancient Mammoth
  "zou_zou_no_mi_mammoth": {
    name: "Ancient Mammoth Rampage",
    damage: 200,
    cooldown: 4,
    effect: "ancient_mammoth",
    description: "Channel the fury of ancient giants - mammoth strength that crushes everything",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      ancientStrength: true,
      trample: true,
      tuskCrush: true
    }
  },

  // King's Pteranodon
  "ryu_ryu_no_mi_pteranodon": {
    name: "Aerial Pteranodon Hunter",
    damage: 190,
    cooldown: 4,
    effect: "aerial_predator",
    description: "Soar as an ancient flying predator - aerial dominance with devastating dive attacks",
    type: "attack",
    range: "multi",
    cost: 40,
    special: {
      aerialSuperiority: true,
      diveBomb: true,
      windSlash: true
    }
  },

  // Queen's Brachiosaurus
  "ryu_ryu_no_mi_brachiosaurus": {
    name: "Brachio Launcher Serpent",
    damage: 185,
    cooldown: 5,
    effect: "brachio_cannon",
    description: "Launch attacks with ancient dinosaur power - neck that becomes a serpentine cannon",
    type: "attack",
    range: "area",
    cost: 45,
    special: {
      neckCannon: true,
      serpentStrike: true,
      ancientEndurance: true
    }
  },

  // Sengoku's Buddha Power
  "hito_hito_no_mi_daibutsu": {
    name: "Buddha Impact Shockwave",
    damage: 175,
    cooldown: 4,
    effect: "buddha_enlightenment",
    description: "Channel the wisdom and power of Buddha - golden shockwaves that purify and punish",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      goldenLight: true,
      shockwavePalm: true,
      wisdomBoost: true
    }
  },

  // Yamato's Guardian Wolf
  "inu_inu_no_mi_okuchi_no_makami": {
    name: "Divine Wolf Ice Fang",
    damage: 180,
    cooldown: 4,
    effect: "divine_wolf",
    description: "Become the guardian wolf deity - ice fangs that protect Wano with divine power",
    type: "attack",
    range: "multi",
    cost: 40,
    special: {
      iceFangs: true,
      guardianSpirit: true,
      wanoProtection: true
    }
  }
};

module.exports = LEGENDARY_SKILLS;
