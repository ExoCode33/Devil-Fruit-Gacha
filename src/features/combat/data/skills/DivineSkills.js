// src/data/skills/DivineSkills.js - All 4 Divine Fruit Skills
const DIVINE_SKILLS = {
  // Blackbeard's Dual Devil Fruit Power
  "yami_yami_gura_gura_no_mi": {
    name: "Darkness Quake Devastation",
    damage: 350,
    cooldown: 8,
    effect: "reality_bend",
    description: "Combine the nullifying void of darkness with world-destroying earthquakes, creating a reality-warping catastrophe",
    type: "ultimate",
    range: "all",
    cost: 100,
    special: {
      nullifyAbilities: true,
      earthquakeAura: true,
      gravityPull: true,
      dualPower: true
    }
  },

  // Luffy's Gear 5 Sun God Nika Power
  "gomu_gomu_nika_no_mi": {
    name: "Bajrang Liberation",
    damage: 320,
    cooldown: 7,
    effect: "toon_force_reality",
    description: "Channel the Sun God's power to bend reality like rubber, creating an island-sized fist of pure liberation",
    type: "ultimate",
    range: "area",
    cost: 90,
    special: {
      cartoonPhysics: true,
      environmentRubber: true,
      immuneToLogic: true,
      liberationPower: true
    }
  },

  // Whitebeard's World-Destroying Earthquake Power
  "gura_gura_no_mi": {
    name: "Seismic World Ender",
    damage: 330,
    cooldown: 7,
    effect: "world_shaker",
    description: "Crack the very air itself and shatter space with vibrations that can destroy the world",
    type: "ultimate",
    range: "all",
    cost: 95,
    special: {
      crackAir: true,
      tsunamiWaves: true,
      spaceShatter: true,
      worldDestroyer: true
    }
  },

  // Kaido's Azure Dragon Mythical Power
  "uo_uo_no_mi_seiryu": {
    name: "Azure Dragon Storm Lord",
    damage: 300,
    cooldown: 6,
    effect: "elemental_mastery",
    description: "Command the elements as the Azure Dragon - fire, lightning, wind, and weather itself bow to your will",
    type: "ultimate",
    range: "area",
    cost: 85,
    special: {
      weatherControl: true,
      islandLevitation: true,
      drunkMaster: true,
      elementalDominion: true
    }
  }
};

module.exports = DIVINE_SKILLS;
