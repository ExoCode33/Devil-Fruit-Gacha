// src/data/skills/MythicalSkills.js - All 12 Mythical Fruit Skills
const MYTHICAL_SKILLS = {
  // Enel's Lightning God Power
  "goro_goro_no_mi": {
    name: "Divine Lightning Judgment",
    damage: 280,
    cooldown: 6,
    effect: "lightning_god",
    description: "Strike with the fury of a thunder god - lightning that moves at light speed and judges all",
    type: "special",
    range: "multi",
    cost: 70,
    special: {
      lightSpeed: true,
      heartRestart: true,
      electromagneticSight: true
    }
  },

  // Aokiji's Absolute Ice Power
  "hie_hie_no_mi": {
    name: "Ice Age Absolute Zero",
    damage: 260,
    cooldown: 6,
    effect: "ice_age",
    description: "Freeze entire oceans and bring forth an ice age that stops all movement and life",
    type: "special",
    range: "area",
    cost: 65,
    special: {
      freezeOcean: true,
      iceTime: true,
      climateChange: true
    }
  },

  // Kizaru's Light Speed Power
  "pika_pika_no_mi": {
    name: "Yasakani Sacred Jewel",
    damage: 270,
    cooldown: 5,
    effect: "light_speed_barrage",
    description: "Move and attack at the speed of light with beams that pierce through everything",
    type: "special",
    range: "multi",
    cost: 60,
    special: {
      lightSpeedMovement: true,
      undodgeable: true,
      blindingFlash: true
    }
  },

  // Akainu's Absolute Justice Magma
  "magu_magu_no_mi": {
    name: "Molten Absolute Justice",
    damage: 290,
    cooldown: 6,
    effect: "molten_justice",
    description: "Burn through everything with magma hotter than fire itself - absolute justice that melts all",
    type: "special",
    range: "single",
    cost: 65,
    special: {
      meltAll: true,
      elementalSuperiority: true,
      persistentLava: true
    }
  },

  // Big Mom's Soul Manipulation
  "soru_soru_no_mi": {
    name: "Soul Pocus Terror",
    damage: 250,
    cooldown: 6,
    effect: "soul_manipulation",
    description: "Steal the very souls of those who fear you and command them as living weapons",
    type: "special",
    range: "multi",
    cost: 70,
    special: {
      fearRequired: true,
      createHomies: true,
      soulDrain: true
    }
  },

  // Fujitora's Gravity Control
  "zushi_zushi_no_mi": {
    name: "Gravity Meteor Drop",
    damage: 275,
    cooldown: 7,
    effect: "gravity_mastery",
    description: "Pull meteors from space itself and control gravity to crush enemies with the weight of heaven",
    type: "special",
    range: "area",
    cost: 75,
    special: {
      meteorSummon: true,
      gravityCrush: true,
      spacePull: true
    }
  },

  // Sabo's Flame Emperor Power
  "mera_mera_no_mi": {
    name: "Flame Emperor's Wrath",
    damage: 255,
    cooldown: 5,
    effect: "flame_emperor",
    description: "Command fire itself as the Flame Emperor - flames that burn with the spirit of revolution",
    type: "special",
    range: "area",
    cost: 55,
    special: {
      revolutionFlame: true,
      fireImmunity: true,
      flameClones: true
    }
  },

  // Green Bull's Forest Power
  "mori_mori_no_mi": {
    name: "Nature's Absolute Dominion",
    damage: 240,
    cooldown: 6,
    effect: "forest_god",
    description: "Become one with nature itself - forests that devour enemies and drain their life force",
    type: "special",
    range: "area",
    cost: 60,
    special: {
      lifeDrain: true,
      forestSanctuary: true,
      plantControl: true
    }
  },

  // Doflamingo's String Mastery
  "ito_ito_no_mi": {
    name: "Parasitic String God Thread",
    damage: 235,
    cooldown: 5,
    effect: "heavenly_strings",
    description: "Control the very heavens with strings that can slice clouds and puppeteer enemies",
    type: "special",
    range: "multi",
    cost: 55,
    special: {
      puppetControl: true,
      cloudSlicing: true,
      stringClone: true
    }
  },

  // Marco's Phoenix Regeneration
  "tori_tori_no_mi_phoenix": {
    name: "Phoenix Resurrection Flames",
    damage: 220,
    cooldown: 6,
    effect: "phoenix_rebirth",
    description: "Blue flames of regeneration that heal allies while burning enemies - the immortal phoenix rises",
    type: "special",
    range: "area",
    cost: 65,
    special: {
      healAllies: true,
      resurrection: true,
      blueFlames: true
    }
  },

  // Bullet's Combination Power
  "gasha_gasha_no_mi": {
    name: "Bullet Fest Combination",
    damage: 265,
    cooldown: 7,
    effect: "weapon_fusion",
    description: "Combine and fuse anything into ultimate weapons - create mechanical monsters from the battlefield",
    type: "special",
    range: "area",
    cost: 70,
    special: {
      mechanicalFusion: true,
      weaponCreation: true,
      giantMecha: true
    }
  },

  // Uta's Song Reality
  "uta_uta_no_mi": {
    name: "New Genesis Song World",
    damage: 230,
    cooldown: 8,
    effect: "song_reality",
    description: "Trap enemies in a world of song where your voice becomes reality itself",
    type: "special",
    range: "all",
    cost: 80,
    special: {
      alternateReality: true,
      songPrison: true,
      emotionControl: true
    }
  }
};

module.exports = MYTHICAL_SKILLS;
