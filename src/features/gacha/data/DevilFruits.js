// src/data/DevilFruits.js - REBALANCED: 30 Rare, 30 Uncommon, 51 Common
const { getSkillData, getFallbackSkill } = require('./DevilFruitSkills');

const DEVIL_FRUITS = {
  // =====================================================
  // DIVINE TIER (4 fruits) - Strength 7 - 3.5x to 4.0x CP
  // =====================================================
  "yami_yami_gura_gura_no_mi": {
    id: "yami_yami_gura_gura_no_mi",
    name: "Yami Yami no Mi + Gura Gura no Mi",
    type: "Logia + Paramecia",
    rarity: "divine",
    element: "Darkness + Earthquake",
    power: "Ultimate dual devil fruit power",
    description: "The most feared combination - darkness that nullifies all powers combined with world-destroying earthquakes.",
    multiplier: 4.00,
    user: "Marshall D. Teach (Blackbeard)",
    divineWeight: 30
  },

  "gomu_gomu_nika_no_mi": {
    id: "gomu_gomu_nika_no_mi", 
    name: "Gomu Gomu no Mi/Hito Hito no Mi Model: Nika",
    type: "Mythical Zoan",
    rarity: "divine",
    element: "Sun God",
    power: "Liberation and infinite possibilities",
    description: "The legendary Sun God Nika fruit that brings joy and freedom to the world.",
    multiplier: 3.90,
    user: "Monkey D. Luffy",
    divineWeight: 25
  },

  "gura_gura_no_mi": {
    id: "gura_gura_no_mi",
    name: "Gura Gura no Mi", 
    type: "Paramecia",
    rarity: "divine",
    element: "Earthquake",
    power: "World-destroying earthquakes",
    description: "The power to destroy the world itself through devastating tremors and quakes.",
    multiplier: 3.80,
    user: "Edward Newgate (Whitebeard)",
    divineWeight: 20
  },

  "uo_uo_no_mi_seiryu": {
    id: "uo_uo_no_mi_seiryu",
    name: "Uo Uo no Mi Model: Seiryu",
    type: "Mythical Zoan", 
    rarity: "divine",
    element: "Azure Dragon",
    power: "Transform into the legendary Azure Dragon",
    description: "Mythical dragon transformation with elemental mastery over wind, fire, and lightning.",
    multiplier: 3.70,
    user: "Kaidou",
    divineWeight: 25
  },

  // =====================================================
  // MYTHICAL TIER (12 fruits) - Strength 7 & 6 - 2.6x to 3.2x CP
  // =====================================================
  "goro_goro_no_mi": {
    id: "goro_goro_no_mi",
    name: "Goro Goro no Mi",
    type: "Logia",
    rarity: "mythical", 
    element: "Lightning",
    power: "Complete lightning generation and control",
    description: "User becomes lightning itself, capable of devastating electrical attacks.",
    multiplier: 3.20,
    user: "Enel"
  },

  "hie_hie_no_mi": {
    id: "hie_hie_no_mi",
    name: "Hie Hie no Mi",
    type: "Logia",
    rarity: "mythical",
    element: "Ice", 
    power: "Complete ice generation and control",
    description: "User becomes ice and can freeze entire landscapes instantly.",
    multiplier: 3.10,
    user: "Kuzan (Aokiji)"
  },

  "pika_pika_no_mi": {
    id: "pika_pika_no_mi",
    name: "Pika Pika no Mi",
    type: "Logia",
    rarity: "mythical",
    element: "Light",
    power: "Light speed movement and laser attacks", 
    description: "User becomes light itself and can move at the speed of light.",
    multiplier: 3.15,
    user: "Borsalino (Kizaru)"
  },

  "magu_magu_no_mi": {
    id: "magu_magu_no_mi", 
    name: "Magu Magu no Mi",
    type: "Logia",
    rarity: "mythical",
    element: "Magma",
    power: "Molten lava generation and control",
    description: "User becomes magma with the highest offensive power among Logias.",
    multiplier: 3.05,
    user: "Sakazuki (Akainu)"
  },

  "soru_soru_no_mi": {
    id: "soru_soru_no_mi",
    name: "Soru Soru no Mi", 
    type: "Paramecia",
    rarity: "mythical",
    element: "Soul",
    power: "Soul manipulation and Homie creation",
    description: "Manipulate souls and bring objects to life as powerful Homies.",
    multiplier: 2.95,
    user: "Charlotte Linlin (Big Mom)"
  },

  "zushi_zushi_no_mi": {
    id: "zushi_zushi_no_mi",
    name: "Zushi Zushi no Mi",
    type: "Paramecia", 
    rarity: "mythical",
    element: "Gravity",
    power: "Gravity manipulation and meteorite summoning",
    description: "Control gravity itself and summon devastating meteorites from space.",
    multiplier: 2.90,
    user: "Issho (Fujitora)"
  },

  "mera_mera_no_mi": {
    id: "mera_mera_no_mi",
    name: "Mera Mera no Mi",
    type: "Logia",
    rarity: "mythical",
    element: "Fire",
    power: "Complete fire generation and control",
    description: "User becomes fire itself with devastating flame attacks.",
    multiplier: 2.85,
    user: "Sabo"
  },

  "mori_mori_no_mi": {
    id: "mori_mori_no_mi", 
    name: "Mori Mori no Mi",
    type: "Logia",
    rarity: "mythical",
    element: "Forest",
    power: "Forest creation and plant control",
    description: "User becomes a forest and can control all plant life.",
    multiplier: 2.80,
    user: "Aramaki (Green Bull)"
  },

  "ito_ito_no_mi": {
    id: "ito_ito_no_mi",
    name: "Ito Ito no Mi",
    type: "Paramecia",
    rarity: "mythical", 
    element: "String",
    power: "String manipulation and control",
    description: "Create and control razor-sharp strings capable of cutting through anything.",
    multiplier: 2.75,
    user: "Donquixote Doflamingo"
  },

  "tori_tori_no_mi_phoenix": {
    id: "tori_tori_no_mi_phoenix",
    name: "Tori Tori no Mi Model: Phoenix",
    type: "Mythical Zoan",
    rarity: "mythical",
    element: "Phoenix",
    power: "Transform into the legendary Phoenix",
    description: "Mythical phoenix transformation with regenerative blue flames.",
    multiplier: 2.70,
    user: "Marco the Phoenix"
  },

  "gasha_gasha_no_mi": {
    id: "gasha_gasha_no_mi",
    name: "Gasha Gasha no Mi",
    type: "Paramecia", 
    rarity: "mythical",
    element: "Weaponry",
    power: "Weapon creation and fusion",
    description: "Create and combine any weapons imaginable from body parts.",
    multiplier: 2.65,
    user: "Douglas Bullet"
  },

  "uta_uta_no_mi": {
    id: "uta_uta_no_mi",
    name: "Uta Uta no Mi", 
    type: "Paramecia",
    rarity: "mythical",
    element: "Song",
    power: "Reality-altering song abilities",
    description: "Create alternate realities and control minds through powerful songs.",
    multiplier: 2.60,
    user: "Uta"
  },

  // =====================================================
  // LEGENDARY TIER (14 fruits) - Strength 6 - 2.1x to 2.6x CP
  // =====================================================
  "nikyu_nikyu_no_mi": {
    id: "nikyu_nikyu_no_mi",
    name: "Nikyu Nikyu no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Paw",
    power: "Repel anything with paw pads",
    description: "Paw pads that can repel anything, including pain and memories.",
    multiplier: 2.60,
    user: "Bartholomew Kuma"
  },

  "ope_ope_no_mi": {
    id: "ope_ope_no_mi",
    name: "Ope Ope no Mi", 
    type: "Paramecia",
    rarity: "legendary",
    element: "Operation",
    power: "Spatial manipulation within Room",
    description: "Create operating rooms with complete spatial control and immortality surgery.",
    multiplier: 2.55,
    user: "Trafalgar D. Water Law"
  },

  "suna_suna_no_mi": {
    id: "suna_suna_no_mi",
    name: "Suna Suna no Mi",
    type: "Logia",
    rarity: "legendary",
    element: "Sand",
    power: "Complete sand generation and control",
    description: "User becomes sand with moisture-draining abilities.",
    multiplier: 2.50,
    user: "Sir Crocodile"
  },

  "doku_doku_no_mi": {
    id: "doku_doku_no_mi",
    name: "Doku Doku no Mi",
    type: "Paramecia", 
    rarity: "legendary",
    element: "Poison",
    power: "Deadly poison generation and immunity",
    description: "Create any type of poison and become immune to all toxins.",
    multiplier: 2.45,
    user: "Magellan"
  },

  "fuwa_fuwa_no_mi": {
    id: "fuwa_fuwa_no_mi",
    name: "Fuwa Fuwa no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Float",
    power: "Levitation of self and objects",
    description: "Make anything float and control floating islands.",
    multiplier: 2.40,
    user: "Shiki the Golden Lion"
  },

  "bari_bari_no_mi": {
    id: "bari_bari_no_mi", 
    name: "Bari Bari no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Barrier",
    power: "Indestructible barrier creation",
    description: "Create absolutely indestructible barriers of any shape.",
    multiplier: 2.35,
    user: "Bartolomeo"
  },

  "jiki_jiki_no_mi": {
    id: "jiki_jiki_no_mi",
    name: "Jiki Jiki no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Magnetism",
    power: "Magnetic force manipulation",
    description: "Control magnetic forces and manipulate metal objects.",
    multiplier: 2.30,
    user: "Eustass Kid"
  },

  "mochi_mochi_no_mi": {
    id: "mochi_mochi_no_mi",
    name: "Mochi Mochi no Mi",
    type: "Special Paramecia",
    rarity: "legendary",
    element: "Mochi",
    power: "Mochi generation and future sight",
    description: "Logia-like mochi powers combined with advanced observation Haki.",
    multiplier: 2.25,
    user: "Charlotte Katakuri"
  },

  "neko_neko_no_mi_leopard": {
    id: "neko_neko_no_mi_leopard",
    name: "Neko Neko no Mi Model: Leopard",
    type: "Carnivorous Zoan",
    rarity: "legendary",
    element: "Leopard",
    power: "Leopard transformation with Rokushiki mastery", 
    description: "Perfect predator form combined with martial arts mastery.",
    multiplier: 2.20,
    user: "Rob Lucci"
  },

  "zou_zou_no_mi_mammoth": {
    id: "zou_zou_no_mi_mammoth",
    name: "Zou Zou no Mi Model: Mammoth",
    type: "Ancient Zoan",
    rarity: "legendary", 
    element: "Mammoth",
    power: "Ancient mammoth transformation",
    description: "Massive ancient mammoth with incredible destructive power.",
    multiplier: 2.15,
    user: "Jack the Drought"
  },

  "ryu_ryu_no_mi_pteranodon": {
    id: "ryu_ryu_no_mi_pteranodon",
    name: "Ryu Ryu no Mi Model: Pteranodon",
    type: "Ancient Zoan",
    rarity: "legendary",
    element: "Pteranodon",
    power: "Ancient flying reptile transformation",
    description: "Ancient pteranodon with devastating aerial combat abilities.",
    multiplier: 2.10,
    user: "King the Conflagration"
  },

  "ryu_ryu_no_mi_brachiosaurus": {
    id: "ryu_ryu_no_mi_brachiosaurus", 
    name: "Ryu Ryu no Mi Model: Brachiosaurus",
    type: "Ancient Zoan",
    rarity: "legendary",
    element: "Brachiosaurus",
    power: "Ancient long-neck dinosaur transformation",
    description: "Massive ancient dinosaur with incredible reach and power.",
    multiplier: 2.05,
    user: "Queen the Plague"
  },

  "hito_hito_no_mi_daibutsu": {
    id: "hito_hito_no_mi_daibutsu",
    name: "Hito Hito no Mi Model: Daibutsu",
    type: "Mythical Zoan",
    rarity: "legendary",
    element: "Buddha",
    power: "Golden Buddha transformation",
    description: "Mythical Buddha form with shockwave palm strikes.",
    multiplier: 2.00,
    user: "Sengoku the Buddha"
  },

  "inu_inu_no_mi_okuchi_no_makami": {
    id: "inu_inu_no_mi_okuchi_no_makami",
    name: "Inu Inu no Mi Model: Okuchi no Makami",
    type: "Mythical Zoan",
    rarity: "legendary",
    element: "Divine Wolf",
    power: "Mythical wolf guardian transformation",
    description: "Divine wolf form with ice powers and spiritual abilities.",
    multiplier: 1.95,
    user: "Yamato"
  },

  // =====================================================
  // EPIC TIER (24 fruits) - Strength 5-6 & 4 - 1.7x to 2.1x CP
  // =====================================================
  "hobi_hobi_no_mi": {
    id: "hobi_hobi_no_mi",
    name: "Hobi Hobi no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Toy",
    power: "Transform people into toys",
    description: "Turn people into toys and erase memories of their existence.",
    multiplier: 2.10,
    user: "Sugar"
  },

  "gasu_gasu_no_mi": {
    id: "gasu_gasu_no_mi",
    name: "Gasu Gasu no Mi", 
    type: "Logia",
    rarity: "epic",
    element: "Gas",
    power: "Gas generation and manipulation",
    description: "Create and control various types of deadly gases.",
    multiplier: 2.05,
    user: "Caesar Clown"
  },

  "kage_kage_no_mi": {
    id: "kage_kage_no_mi",
    name: "Kage Kage no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Shadow",
    power: "Shadow manipulation and zombie creation",
    description: "Control shadows and create an army of zombies.",
    multiplier: 2.00,
    user: "Gecko Moria"
  },

  "ishi_ishi_no_mi": {
    id: "ishi_ishi_no_mi",
    name: "Ishi Ishi no Mi",
    type: "Paramecia",
    rarity: "epic", 
    element: "Stone",
    power: "Stone assimilation and control",
    description: "Merge with and control stone structures on a massive scale.",
    multiplier: 1.95,
    user: "Pica"
  },

  "chiyu_chiyu_no_mi": {
    id: "chiyu_chiyu_no_mi",
    name: "Chiyu Chiyu no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Healing", 
    power: "Instant healing abilities",
    description: "Heal any injury or ailment with a touch.",
    multiplier: 1.90,
    user: "Princess Mansherry"
  },

  "shima_shima_no_mi": {
    id: "shima_shima_no_mi",
    name: "Shima Shima no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Island",
    power: "Island manipulation and control",
    description: "Merge with and control entire islands and their structures.",
    multiplier: 1.85,
    user: "Avalo Pizarro"
  },

  "hana_hana_no_mi": {
    id: "hana_hana_no_mi",
    name: "Hana Hana no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Flower",
    power: "Body part sprouting anywhere",
    description: "Sprout arms, legs, and other body parts from any surface.",
    multiplier: 1.80,
    user: "Nico Robin"
  },

  "bisu_bisu_no_mi": {
    id: "bisu_bisu_no_mi",
    name: "Bisu Bisu no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Biscuit",
    power: "Biscuit generation and hardening",
    description: "Create infinitely hard biscuit soldiers and armor.",
    multiplier: 1.78,
    user: "Charlotte Cracker"
  },

  "hoya_hoya_no_mi": {
    id: "hoya_hoya_no_mi",
    name: "Hoya Hoya no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Lamp",
    power: "Genie summoning from body",
    description: "Summon powerful genies from body parts to fight.",
    multiplier: 1.76,
    user: "Charlotte Daifuku"
  },

  "shibo_shibo_no_mi": {
    id: "shibo_shibo_no_mi",
    name: "Shibo Shibo no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Wring",
    power: "Liquid extraction from anything",
    description: "Wring out any liquid from objects or people.",
    multiplier: 1.74,
    user: "Charlotte Smoothie"
  },

  "wara_wara_no_mi": {
    id: "wara_wara_no_mi",
    name: "Wara Wara no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Straw",
    power: "Straw voodoo and damage redirection",
    description: "Create voodoo dolls and redirect damage taken.",
    multiplier: 1.72,
    user: "Basil Hawkins"
  },

  "shiro_shiro_no_mi": {
    id: "shiro_shiro_no_mi",
    name: "Shiro Shiro no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Castle",
    power: "Body fortress transformation",
    description: "Transform body into a mobile fortress with artillery.",
    multiplier: 1.70,
    user: "Capone Bege"
  },

  "horu_horu_no_mi": {
    id: "horu_horu_no_mi",
    name: "Horu Horu no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Hormone",
    power: "Hormone manipulation and gender change",
    description: "Control hormones to enhance abilities and change bodies.",
    multiplier: 1.68,
    user: "Emporio Ivankov"
  },

  "wapu_wapu_no_mi": {
    id: "wapu_wapu_no_mi",
    name: "Wapu Wapu no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Warp",
    power: "Teleportation over vast distances",
    description: "Instantly teleport self and others across great distances.",
    multiplier: 1.66,
    user: "Van Augur"
  },

  "moku_moku_no_mi": {
    id: "moku_moku_no_mi",
    name: "Moku Moku no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Smoke",
    power: "Smoke generation and capture",
    description: "User becomes smoke and can trap enemies in smoke prison.",
    multiplier: 1.64,
    user: "Smoker"
  },

  "suke_suke_no_mi": {
    id: "suke_suke_no_mi",
    name: "Suke Suke no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Invisibility",
    power: "Complete invisibility",
    description: "Become completely invisible along with anything touched.",
    multiplier: 1.62,
    user: "Shiryu of the Rain"
  },

  "riki_riki_no_mi": {
    id: "riki_riki_no_mi",
    name: "Riki Riki no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Strength",
    power: "Superhuman strength amplification",
    description: "Amplify physical strength to incredible levels.",
    multiplier: 1.60,
    user: "Jesus Burgess"
  },

  "hito_hito_no_mi_chopper": {
    id: "hito_hito_no_mi_chopper",
    name: "Hito Hito no Mi",
    type: "Zoan",
    rarity: "epic",
    element: "Human",
    power: "Human transformation with Rumble Balls",
    description: "Transform into human form with multiple transformation points.",
    multiplier: 1.58,
    user: "Tony Tony Chopper"
  },

  "ryu_ryu_no_mi_allosaurus": {
    id: "ryu_ryu_no_mi_allosaurus",
    name: "Ryu Ryu no Mi Model: Allosaurus",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Allosaurus",
    power: "Ancient predator dinosaur transformation",
    description: "Fierce ancient carnivorous dinosaur with powerful jaws.",
    multiplier: 1.56,
    user: "X Drake"
  },

  "ryu_ryu_no_mi_spinosaurus": {
    id: "ryu_ryu_no_mi_spinosaurus",
    name: "Ryu Ryu no Mi Model: Spinosaurus",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Spinosaurus",
    power: "Ancient aquatic dinosaur transformation",
    description: "Massive ancient dinosaur adapted for both land and water combat.",
    multiplier: 1.54,
    user: "Page One"
  },

  "ryu_ryu_no_mi_pachycephalosaurus": {
    id: "ryu_ryu_no_mi_pachycephalosaurus",
    name: "Ryu Ryu no Mi Model: Pachycephalosaurus",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Pachycephalosaurus",
    power: "Thick-skulled dinosaur transformation",
    description: "Ancient dinosaur with incredibly thick skull for devastating headbutts.",
    multiplier: 1.52,
    user: "Ulti"
  },

  "ryu_ryu_no_mi_triceratops": {
    id: "ryu_ryu_no_mi_triceratops",
    name: "Ryu Ryu no Mi Model: Triceratops",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Triceratops",
    power: "Three-horned dinosaur transformation",
    description: "Ancient armored dinosaur with powerful charging attacks.",
    multiplier: 1.50,
    user: "Sasaki"
  },

  "kumo_kumo_no_mi_rosamygale": {
    id: "kumo_kumo_no_mi_rosamygale",
    name: "Kumo Kumo no Mi Model: Rosamygale Grauvogeli",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Ancient Spider",
    power: "Ancient spider transformation",
    description: "Ancient spider form with web manipulation and venom.",
    multiplier: 1.48,
    user: "Black Maria"
  },

  "neko_neko_no_mi_saber_tiger": {
    id: "neko_neko_no_mi_saber_tiger",
    name: "Neko Neko no Mi Model: Saber Tiger",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Saber-toothed Tiger",
    power: "Ancient saber-toothed cat transformation",
    description: "Ancient predatory cat with massive saber teeth.",
    multiplier: 1.46,
    user: "Who's-Who"
  },

  // =====================================================
  // RARE TIER (30 fruits) - EXPANDED - 1.4x to 1.7x CP
  // =====================================================

  "doa_doa_no_mi": {
    id: "doa_doa_no_mi",
    name: "Doa Doa no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Door",
    power: "Door creation anywhere",
    description: "Create doors in any surface, including air itself.",
    multiplier: 1.70,
    user: "Blueno"
  },

  "buki_buki_no_mi": {
    id: "buki_buki_no_mi",
    name: "Buki Buki no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Weapon",
    power: "Transform body parts into weapons",
    description: "Turn any body part into any weapon imaginable.",
    multiplier: 1.68,
    user: "Baby 5"
  },

  "memo_memo_no_mi": {
    id: "memo_memo_no_mi",
    name: "Memo Memo no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Memory",
    power: "Memory manipulation",
    description: "Extract, modify, and implant memories.",
    multiplier: 1.66,
    user: "Charlotte Pudding"
  },

  "nomi_nomi_no_mi": {
    id: "nomi_nomi_no_mi",
    name: "Nomi Nomi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Brain",
    power: "Brain enhancement and knowledge storage",
    description: "Enhance brain capacity and store infinite knowledge.",
    multiplier: 1.64,
    user: "Dr. Vegapunk"
  },

  "mero_mero_no_mi": {
    id: "mero_mero_no_mi",
    name: "Mero Mero no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Love",
    power: "Petrification through attraction",
    description: "Turn those attracted to you into stone statues.",
    multiplier: 1.62,
    user: "Boa Hancock"
  },

  "toki_toki_no_mi": {
    id: "toki_toki_no_mi",
    name: "Toki Toki no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Time",
    power: "Time travel to the future",
    description: "Send yourself or others forward through time.",
    multiplier: 1.60,
    user: "Kozuki Toki"
  },

  "toshi_toshi_no_mi": {
    id: "toshi_toshi_no_mi",
    name: "Toshi Toshi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Age",
    power: "Age manipulation",
    description: "Manipulate the age of yourself and others.",
    multiplier: 1.58,
    user: "Jewelry Bonney"
  },

  "deka_deka_no_mi": {
    id: "deka_deka_no_mi",
    name: "Deka Deka no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Size",
    power: "Size enlargement",
    description: "Grow to colossal sizes while maintaining strength.",
    multiplier: 1.56,
    user: "San Juan Wolf"
  },

  "fude_fude_no_mi": {
    id: "fude_fude_no_mi",
    name: "Fude Fude no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Brush",
    power: "Ink paintings come to life",
    description: "Bring ink paintings and drawings to life.",
    multiplier: 1.54,
    user: "Kurozumi Kanjuro"
  },

  "shiku_shiku_no_mi": {
    id: "shiku_shiku_no_mi",
    name: "Shiku Shiku no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Disease",
    power: "Disease manipulation",
    description: "Create and control various diseases and plagues.",
    multiplier: 1.52,
    user: "Doc Q"
  },

  "kira_kira_no_mi": {
    id: "kira_kira_no_mi",
    name: "Kira Kira no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Diamond",
    power: "Diamond body transformation",
    description: "Transform body parts into indestructible diamond.",
    multiplier: 1.50,
    user: "Jozu"
  },

  "inu_inu_no_mi_kyubi": {
    id: "inu_inu_no_mi_kyubi",
    name: "Inu Inu no Mi Model: Kyubi no Kitsune",
    type: "Mythical Zoan",
    rarity: "rare",
    element: "Nine-Tailed Fox",
    power: "Nine-tailed fox transformation",
    description: "Mythical nine-tailed fox with illusion abilities.",
    multiplier: 1.48,
    user: "Catarina Devon"
  },

  "hebi_hebi_no_mi_yamata": {
    id: "hebi_hebi_no_mi_yamata",
    name: "Hebi Hebi no Mi Model: Yamata-no-Orochi",
    type: "Mythical Zoan",
    rarity: "rare",
    element: "Eight-Headed Snake",
    power: "Eight-headed snake transformation",
    description: "Mythical eight-headed serpent with multiple lives.",
    multiplier: 1.46,
    user: "Kurozumi Orochi"
  },

  "ryu_ryu_no_mi_kirin": {
    id: "ryu_ryu_no_mi_kirin",
    name: "Ryu Ryu no Mi Model: Kirin",
    type: "Ancient Zoan",
    rarity: "rare",
    element: "Kirin",
    power: "Ancient giraffe transformation",
    description: "Ancient long-necked creature with enhanced reach.",
    multiplier: 1.44,
    user: "Killingham"
  },

  "artificial_dragon_fruit": {
    id: "artificial_dragon_fruit",
    name: "Artificial Dragon Fruit",
    type: "Artificial Zoan",
    rarity: "rare",
    element: "Dragon",
    power: "Incomplete dragon transformation",
    description: "Artificial dragon fruit with limited but growing power.",
    multiplier: 1.42,
    user: "Kozuki Momonosuke"
  },

  "oto_oto_no_mi": {
    id: "oto_oto_no_mi",
    name: "Oto Oto no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Sound",
    power: "Sound wave attacks",
    description: "Convert body parts into musical instruments for sonic attacks.",
    multiplier: 1.47,
    user: "Scratchmen Apoo"
  },

  "mira_mira_no_mi": {
    id: "mira_mira_no_mi",
    name: "Mira Mira no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Mirror",
    power: "Mirror world creation",
    description: "Create mirrors and travel through mirror dimensions.",
    multiplier: 1.47,
    user: "Charlotte Brûlée"
  },

  "gocha_gocha_no_mi": {
    id: "gocha_gocha_no_mi",
    name: "Gocha Gocha no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Fusion",
    power: "Object fusion and combination",
    description: "Fuse different objects together into new combinations.",
    multiplier: 1.47,
    user: "Charlotte Newshi"
  },

  "pamu_pamu_no_mi": {
    id: "pamu_pamu_no_mi",
    name: "Pamu Pamu no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Rupture",
    power: "Object rupturing and explosion",
    description: "Make inorganic objects rupture and explode.",
    multiplier: 1.47,
    user: "Gladius"
  },

  "unnamed_paramecia_urouge": {
    id: "unnamed_paramecia_urouge",
    name: "Unnamed Paramecia",
    type: "Paramecia",
    rarity: "rare",
    element: "Karma",
    power: "Damage conversion to strength",
    description: "Convert received damage into increased physical strength.",
    multiplier: 1.47,
    user: "Mad Monk Urouge"
  },

  "yomi_yomi_no_mi": {
    id: "yomi_yomi_no_mi",
    name: "Yomi Yomi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Revive",
    power: "Second life and soul projection",
    description: "Return from death once and project soul from body.",
    multiplier: 1.45,
    user: "Brook"
  },

  "mato_mato_no_mi": {
    id: "mato_mato_no_mi",
    name: "Mato Mato no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Mark",
    power: "Lock-on targeting",
    description: "Mark targets for homing attacks that never miss.",
    multiplier: 1.45,
    user: "Vander Decken IX"
  },

  "pero_pero_no_mi": {
    id: "pero_pero_no_mi",
    name: "Pero Pero no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Candy",
    power: "Candy creation and manipulation",
    description: "Create and control various types of candy.",
    multiplier: 1.45,
    user: "Charlotte Perospero"
  },

  "juku_juku_no_mi": {
    id: "juku_juku_no_mi",
    name: "Juku Juku no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Mature",
    power: "Aging and ripening",
    description: "Age and ripen anything you touch to maturity.",
    multiplier: 1.45,
    user: "Shinobu"
  },

  "ton_ton_no_mi": {
    id: "ton_ton_no_mi",
    name: "Ton Ton no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Weight",
    power: "Weight increase up to 10,000 tons",
    description: "Increase your weight up to 10,000 tons for crushing attacks.",
    multiplier: 1.45,
    user: "Machvise"
  },

  "tori_tori_no_mi_falcon": {
    id: "tori_tori_no_mi_falcon",
    name: "Tori Tori no Mi Model: Falcon",
    type: "Zoan",
    rarity: "rare",
    element: "Falcon",
    power: "Falcon transformation",
    description: "Transform into a peregrine falcon with incredible speed.",
    multiplier: 1.45,
    user: "Pell"
  },

  // PROMOTED FROM UNCOMMON TO RARE (6 additional fruits)
  "horo_horo_no_mi": {
    id: "horo_horo_no_mi",
    name: "Horo Horo no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Ghost",
    power: "Ghost creation and negative emotion",
    description: "Create ghosts that drain willpower and cause depression.",
    multiplier: 1.43,
    user: "Perona"
  },

  "giro_giro_no_mi": {
    id: "giro_giro_no_mi",
    name: "Giro Giro no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Glare",
    power: "X-ray vision and mind reading",
    description: "See through anything and read minds and emotions.",
    multiplier: 1.43,
    user: "Viola"
  },

  "netsu_netsu_no_mi": {
    id: "netsu_netsu_no_mi",
    name: "Netsu Netsu no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Heat",
    power: "Heat transfer and temperature control",
    description: "Heat up your body and anything you touch to extreme temperatures.",
    multiplier: 1.43,
    user: "Charlotte Oven"
  },

  "maki_maki_no_mi": {
    id: "maki_maki_no_mi",
    name: "Maki Maki no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Scroll",
    power: "Scroll storage and manipulation",
    description: "Store and retrieve objects from magical scrolls.",
    multiplier: 1.43,
    user: "Raizo"
  },

  "nagi_nagi_no_mi": {
    id: "nagi_nagi_no_mi",
    name: "Nagi Nagi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Calm",
    power: "Sound nullification",
    description: "Create soundproof barriers and nullify all sounds.",
    multiplier: 1.43,
    user: "Donquixote Rosinante"
  },

  "inu_inu_no_mi_wolf": {
    id: "inu_inu_no_mi_wolf",
    name: "Inu Inu no Mi Model: Wolf",
    type: "Zoan",
    rarity: "rare",
    element: "Wolf",
    power: "Wolf transformation",
    description: "Transform into a wolf with pack hunting instincts.",
    multiplier: 1.43,
    user: "Jabra"
  },

  // =====================================================
  // UNCOMMON TIER (30 fruits) - REBALANCED - 1.2x to 1.4x CP
  // =====================================================

  "kibi_kibi_no_mi": {
    id: "kibi_kibi_no_mi",
    name: "Kibi Kibi no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Dango",
    power: "Animal taming through dango",
    description: "Tame any animal by feeding them magical dango.",
    multiplier: 1.40,
    user: "Otama"
  },

  "yuki_yuki_no_mi": {
    id: "yuki_yuki_no_mi",
    name: "Yuki Yuki no Mi",
    type: "Logia",
    rarity: "uncommon",
    element: "Snow",
    power: "Snow generation and control",
    description: "Create and control snow, ice, and blizzards.",
    multiplier: 1.38,
    user: "Monet"
  },

  "susu_susu_no_mi": {
    id: "susu_susu_no_mi",
    name: "Susu Susu no Mi",
    type: "Logia",
    rarity: "uncommon",
    element: "Soot",
    power: "Soot generation and control",
    description: "Create and manipulate soot for concealment and attacks.",
    multiplier: 1.36,
    user: "Karasu"
  },

  "bara_bara_no_mi": {
    id: "bara_bara_no_mi",
    name: "Bara Bara no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Chop",
    power: "Body separation immunity",
    description: "Split body into pieces and become immune to cutting attacks.",
    multiplier: 1.34,
    user: "Buggy the Clown"
  },

  "bomu_bomu_no_mi": {
    id: "bomu_bomu_no_mi",
    name: "Bomu Bomu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Bomb",
    power: "Explosive body parts",
    description: "Make any part of your body explode without harm to yourself.",
    multiplier: 1.32,
    user: "Mr. 5"
  },

  "supa_supa_no_mi": {
    id: "supa_supa_no_mi",
    name: "Supa Supa no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Blade",
    power: "Steel blade body transformation",
    description: "Turn any body part into sharp steel blades.",
    multiplier: 1.30,
    user: "Daz Bonez (Mr. 1)"
  },

  "doru_doru_no_mi": {
    id: "doru_doru_no_mi",
    name: "Doru Doru no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Wax",
    power: "Wax generation and hardening",
    description: "Create and harden wax for offense and defense.",
    multiplier: 1.28,
    user: "Galdino (Mr. 3)"
  },

  "baku_baku_no_mi": {
    id: "baku_baku_no_mi",
    name: "Baku Baku no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Munch",
    power: "Eat anything and gain properties",
    description: "Eat anything and incorporate it into your body.",
    multiplier: 1.26,
    user: "Wapol"
  },

  "mane_mane_no_mi": {
    id: "mane_mane_no_mi",
    name: "Mane Mane no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Clone",
    power: "Perfect physical mimicry",
    description: "Perfectly copy the appearance of anyone you touch.",
    multiplier: 1.24,
    user: "Bentham (Mr. 2)"
  },

  "awa_awa_no_mi": {
    id: "awa_awa_no_mi",
    name: "Awa Awa no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Bubble",
    power: "Soap bubble generation",
    description: "Create soap bubbles that clean away strength and defenses.",
    multiplier: 1.22,
    user: "Kalifa"
  },

  "noro_noro_no_mi": {
    id: "noro_noro_no_mi",
    name: "Noro Noro no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Slow",
    power: "Slow beam projection",
    description: "Emit beams that slow down anything for 30 seconds.",
    multiplier: 1.20,
    user: "Foxy"
  },

  "choki_choki_no_mi": {
    id: "choki_choki_no_mi",
    name: "Choki Choki no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Scissors",
    power: "Cut anything like paper",
    description: "Turn hands into scissors that can cut anything.",
    multiplier: 1.39,
    user: "Inazuma"
  },

  "woshu_woshu_no_mi": {
    id: "woshu_woshu_no_mi",
    name: "Woshu Woshu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Wash",
    power: "Washing and cleansing",
    description: "Wash and cleanse anything, including evil from hearts.",
    multiplier: 1.38,
    user: "Tsuru"
  },

  "buku_buku_no_mi": {
    id: "buku_buku_no_mi",
    name: "Buku Buku no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Book",
    power: "Book world manipulation",
    description: "Trap people in books and control book dimensions.",
    multiplier: 1.37,
    user: "Charlotte Mont-d'Or"
  },

  "oshi_oshi_no_mi": {
    id: "oshi_oshi_no_mi",
    name: "Oshi Oshi no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Push",
    power: "Ground manipulation through pushing",
    description: "Push and manipulate the ground like clay.",
    multiplier: 1.36,
    user: "Morley"
  },

  "kobu_kobu_no_mi": {
    id: "kobu_kobu_no_mi",
    name: "Kobu Kobu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Inspire",
    power: "Inspiration and motivation",
    description: "Inspire others and boost their fighting spirit and abilities.",
    multiplier: 1.35,
    user: "Belo Betty"
  },

  "hebi_hebi_no_mi_anaconda": {
    id: "hebi_hebi_no_mi_anaconda",
    name: "Hebi Hebi no Mi Model: Anaconda/King Cobra",
    type: "Zoan",
    rarity: "uncommon",
    element: "Snake",
    power: "Large snake transformation",
    description: "Transform into massive constrictor snakes.",
    multiplier: 1.34,
    user: "Boa Sisters"
  },

  "tama_tama_no_mi": {
    id: "tama_tama_no_mi",
    name: "Tama Tama no Mi",
    type: "Zoan",
    rarity: "uncommon",
    element: "Egg",
    power: "Egg-chicken lifecycle transformation",
    description: "Transform through egg and chicken forms, becoming stronger when 'killed'.",
    multiplier: 1.33,
    user: "Tamago"
  },

  "uma_uma_no_mi_pegasus": {
    id: "uma_uma_no_mi_pegasus",
    name: "Uma Uma no Mi Model: Pegasus",
    type: "Mythical Zoan",
    rarity: "uncommon",
    element: "Pegasus",
    power: "Winged horse transformation",
    description: "Transform into a mythical winged horse.",
    multiplier: 1.32,
    user: "Stronger"
  },

  // PROMOTED FROM COMMON TO UNCOMMON (12 additional fruits)
  "numa_numa_no_mi": {
    id: "numa_numa_no_mi",
    name: "Numa Numa no Mi",
    type: "Logia",
    rarity: "uncommon",
    element: "Swamp",
    power: "Swamp creation and storage",
    description: "Create swamps and store unlimited items in your body.",
    multiplier: 1.31,
    user: "Caribou"
  },

  "sube_sube_no_mi": {
    id: "sube_sube_no_mi",
    name: "Sube Sube no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Slip",
    power: "Slippery skin",
    description: "Perfect smooth skin that makes everything slip off.",
    multiplier: 1.30,
    user: "Alvida"
  },

  "ori_ori_no_mi": {
    id: "ori_ori_no_mi",
    name: "Ori Ori no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Cage",
    power: "Iron restraint creation",
    description: "Create iron bonds to restrain and capture enemies.",
    multiplier: 1.29,
    user: "Hina"
  },

  "kuku_kuku_no_mi": {
    id: "kuku_kuku_no_mi",
    name: "Kuku Kuku no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Cook",
    power: "Cooking enhancement and food animation",
    description: "Cook anything into delicious food and animate ingredients.",
    multiplier: 1.28,
    user: "Streusen"
  },

  "gabu_gabu_no_mi": {
    id: "gabu_gabu_no_mi",
    name: "Gabu Gabu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Drink",
    power: "Unlimited liquid consumption",
    description: "Drink unlimited amounts of liquid and use them as weapons.",
    multiplier: 1.27,
    user: "Vasco Shot"
  },

  "tsutsu_tsutsu_no_mi": {
    id: "tsutsu_tsutsu_no_mi",
    name: "Tsutsu Tsutsu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Tube",
    power: "Body tube transformation",
    description: "Transform body parts into tubes for projectile attacks.",
    multiplier: 1.26,
    user: "Urban"
  },

  "aro_aro_no_mi": {
    id: "aro_aro_no_mi",
    name: "Aro Aro no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Arrow",
    power: "Arrow trajectory control",
    description: "Control the trajectory of any projectile like arrows.",
    multiplier: 1.25,
    user: "Gunko"
  },

  "ushi_ushi_no_mi_bison": {
    id: "ushi_ushi_no_mi_bison",
    name: "Ushi Ushi no Mi Model: Bison",
    type: "Zoan",
    rarity: "uncommon",
    element: "Bison",
    power: "Bison transformation",
    description: "Transform into a powerful bison with charging attacks.",
    multiplier: 1.24,
    user: "Dalton"
  },

  "inu_inu_no_mi_jackal": {
    id: "inu_inu_no_mi_jackal",
    name: "Inu Inu no Mi Model: Jackal",
    type: "Zoan",
    rarity: "uncommon",
    element: "Jackal",
    power: "Jackal transformation",
    description: "Transform into a desert jackal with enhanced senses.",
    multiplier: 1.23,
    user: "Chaka"
  },

  "tori_tori_no_mi_albatross": {
    id: "tori_tori_no_mi_albatross",
    name: "Tori Tori no Mi Model: Albatross",
    type: "Zoan",
    rarity: "uncommon",
    element: "Albatross",
    power: "Albatross transformation",
    description: "Transform into large seabird with excellent flight range.",
    multiplier: 1.22,
    user: "Morgans"
  },

  "kame_kame_no_mi": {
    id: "kame_kame_no_mi",
    name: "Kame Kame no Mi",
    type: "Zoan",
    rarity: "uncommon",
    element: "Turtle",
    power: "Turtle transformation",
    description: "Transform into a turtle with defensive shell abilities.",
    multiplier: 1.21,
    user: "Pekoms"
  },

  "batto_batto_no_mi": {
    id: "batto_batto_no_mi",
    name: "Batto Batto no Mi",
    type: "Zoan",
    rarity: "uncommon",
    element: "Bat",
    power: "Bat transformation",
    description: "Transform into a bat with echolocation and flight.",
    multiplier: 1.20,
    user: "Stussy"
  },

  // =====================================================
  // COMMON TIER (51 fruits) - DEMOTED & REMAINING - 1.0x to 1.2x CP
  // =====================================================

  "kiro_kiro_no_mi": {
    id: "kiro_kiro_no_mi",
    name: "Kiro Kiro no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Weight",
    power: "Weight manipulation",
    description: "Change your weight from 1 to 10,000 kilograms.",
    multiplier: 1.19,
    user: "Miss Valentine"
  },

  "toge_toge_no_mi": {
    id: "toge_toge_no_mi",
    name: "Toge Toge no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Spike",
    power: "Spike generation from body",
    description: "Grow sharp spikes from any part of your body.",
    multiplier: 1.18,
    user: "Paula (Miss Doublefinger)"
  },

  "bane_bane_no_mi": {
    id: "bane_bane_no_mi",
    name: "Bane Bane no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Spring",
    power: "Spring leg transformation",
    description: "Transform legs into springs for bouncing attacks.",
    multiplier: 1.17,
    user: "Bellamy"
  },

  "beri_beri_no_mi": {
    id: "beri_beri_no_mi",
    name: "Beri Beri no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Berry",
    power: "Berry sphere body splitting",
    description: "Split body into berry-like spheres for defense.",
    multiplier: 1.16,
    user: "Very Good"
  },

  "sabi_sabi_no_mi": {
    id: "sabi_sabi_no_mi",
    name: "Sabi Sabi no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Rust",
    power: "Metal rusting",
    description: "Rust and corrode metal objects on contact.",
    multiplier: 1.15,
    user: "Shu"
  },

  "shari_shari_no_mi": {
    id: "shari_shari_no_mi",
    name: "Shari Shari no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Wheel",
    power: "Wheel body transformation",
    description: "Transform body parts into spinning wheels.",
    multiplier: 1.14,
    user: "Sharinguru"
  },

  "beta_beta_no_mi": {
    id: "beta_beta_no_mi",
    name: "Beta Beta no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Sticky",
    power: "Sticky mucus secretion",
    description: "Secrete sticky mucus to trap enemies.",
    multiplier: 1.13,
    user: "Trebol"
  },

  "jake_jake_no_mi": {
    id: "jake_jake_no_mi",
    name: "Jake Jake no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Jacket",
    power: "Jacket transformation",
    description: "Transform into a jacket to control whoever wears you.",
    multiplier: 1.12,
    user: "Kelly Funk"
  },

  "guru_guru_no_mi": {
    id: "guru_guru_no_mi",
    name: "Guru Guru no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Spin",
    power: "Propeller transformation",
    description: "Transform body parts into spinning propellers for flight.",
    multiplier: 1.11,
    user: "Buffalo"
  },

  "ato_ato_no_mi": {
    id: "ato_ato_no_mi",
    name: "Ato Ato no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Art",
    power: "Artistic transformation",
    description: "Transform people and objects into abstract art.",
    multiplier: 1.10,
    user: "Jora"
  },

  "sui_sui_no_mi": {
    id: "sui_sui_no_mi",
    name: "Sui Sui no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Swim",
    power: "Swimming through solid surfaces",
    description: "Swim through any solid surface as if it were water.",
    multiplier: 1.09,
    user: "Senor Pink"
  },

  "hira_hira_no_mi": {
    id: "hira_hira_no_mi",
    name: "Hira Hira no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Flag",
    power: "Flag transformation and wind control",
    description: "Transform into flags and control wind currents.",
    multiplier: 1.08,
    user: "Diamante"
  },

  "nui_nui_no_mi": {
    id: "nui_nui_no_mi",
    name: "Nui Nui no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Stitch",
    power: "Sewing and stitching anything",
    description: "Sew and stitch anything together like fabric.",
    multiplier: 1.07,
    user: "Leo"
  },

  "fuku_fuku_no_mi": {
    id: "fuku_fuku_no_mi",
    name: "Fuku Fuku no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Clothing",
    power: "Clothing manipulation",
    description: "Create and manipulate clothing for disguises.",
    multiplier: 1.06,
    user: "Kin'emon"
  },

  "poke_poke_no_mi": {
    id: "poke_poke_no_mi",
    name: "Poke Poke no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Pocket",
    power: "Pocket dimension creation",
    description: "Create pockets in your body to store items.",
    multiplier: 1.05,
    user: "Blamenco"
  },

  "kuri_kuri_no_mi": {
    id: "kuri_kuri_no_mi",
    name: "Kuri Kuri no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Cream",
    power: "Cream generation and manipulation",
    description: "Generate and control cream for various uses.",
    multiplier: 1.04,
    user: "Charlotte Opera"
  },

  "bata_bata_no_mi": {
    id: "bata_bata_no_mi",
    name: "Bata Bata no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Butter",
    power: "Butter generation and manipulation",
    description: "Generate butter to make surfaces slippery.",
    multiplier: 1.03,
    user: "Charlotte Galette"
  },

  "iku_iku_no_mi": {
    id: "iku_iku_no_mi",
    name: "Iku Iku no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Go",
    power: "Enhanced movement and transportation",
    description: "Enhance movement speed and transportation abilities.",
    multiplier: 1.02,
    user: "Biblo"
  },

  "muchi_muchi_no_mi": {
    id: "muchi_muchi_no_mi",
    name: "Muchi Muchi no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Whip",
    power: "Whip creation and manipulation",
    description: "Create and control various types of whips.",
    multiplier: 1.01,
    user: "Kujaku"
  },

  "nori_nori_no_mi": {
    id: "nori_nori_no_mi",
    name: "Nori Nori no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Ride",
    power: "Mount and ride anything",
    description: "Mount and ride any creature or object.",
    multiplier: 1.00,
    user: "Bluegrass"
  },

  // ZOAN FRUITS IN COMMON
  "inu_inu_no_mi_dachshund": {
    id: "inu_inu_no_mi_dachshund",
    name: "Inu Inu no Mi Model: Dachshund",
    type: "Zoan",
    rarity: "common",
    element: "Dachshund",
    power: "Dachshund transformation",
    description: "Gun that ate Zoan fruit, can transform into dachshund.",
    multiplier: 1.19,
    user: "Lassoo"
  },

  "uma_uma_no_mi": {
    id: "uma_uma_no_mi",
    name: "Uma Uma no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Horse",
    power: "Horse transformation",
    description: "Bird that ate Zoan fruit, can transform into horse.",
    multiplier: 1.18,
    user: "Pierre"
  },

  "zou_zou_no_mi": {
    id: "zou_zou_no_mi",
    name: "Zou Zou no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Elephant",
    power: "Elephant transformation",
    description: "Sword that ate Zoan fruit, can transform into elephant.",
    multiplier: 1.17,
    user: "Funkfreed"
  },

  "sara_sara_no_mi_axolotl": {
    id: "sara_sara_no_mi_axolotl",
    name: "Sara Sara no Mi Model: Axolotl",
    type: "Zoan",
    rarity: "common",
    element: "Axolotl",
    power: "Axolotl transformation",
    description: "Poisonous salamander transformation with regeneration.",
    multiplier: 1.16,
    user: "Smiley"
  },

  "mushi_mushi_no_mi": {
    id: "mushi_mushi_no_mi",
    name: "Mushi Mushi no Mi Models",
    type: "Zoan",
    rarity: "common",
    element: "Insect",
    power: "Insect transformation",
    description: "Transform into various insects with flight abilities.",
    multiplier: 1.15,
    user: "Kabu & Bian"
  },

  "mogu_mogu_no_mi": {
    id: "mogu_mogu_no_mi",
    name: "Mogu Mogu no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Mole",
    power: "Mole transformation",
    description: "Transform into a mole for underground movement.",
    multiplier: 1.14,
    user: "Miss Merry Christmas"
  },

  // Additional common fruits to reach 51 total
  "common_fruit_25": {
    id: "common_fruit_25",
    name: "Heso Heso no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Belly Button",
    power: "Belly button manipulation",
    description: "Control and weaponize belly buttons for various uses.",
    multiplier: 1.13,
    user: "Common User 25"
  },

  "common_fruit_26": {
    id: "common_fruit_26",
    name: "Pero Pero no Mi Minor",
    type: "Paramecia",
    rarity: "common",
    element: "Lick",
    power: "Enhanced licking abilities",
    description: "Extend tongue and lick with enhanced properties.",
    multiplier: 1.12,
    user: "Common User 26"
  },

  "common_fruit_27": {
    id: "common_fruit_27",
    name: "Boku Boku no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Wood",
    power: "Basic wood manipulation",
    description: "Create and control simple wooden structures.",
    multiplier: 1.11,
    user: "Common User 27"
  },

  "common_fruit_28": {
    id: "common_fruit_28",
    name: "Kasa Kasa no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Umbrella",
    power: "Umbrella creation and control",
    description: "Create and manipulate umbrellas for offense and defense.",
    multiplier: 1.10,
    user: "Common User 28"
  },

  "common_fruit_29": {
    id: "common_fruit_29",
    name: "Pika Pika no Mi Minor",
    type: "Paramecia",
    rarity: "common",
    element: "Shine",
    power: "Basic light reflection",
    description: "Reflect light from body for basic illumination and distraction.",
    multiplier: 1.09,
    user: "Common User 29"
  },

  "common_fruit_30": {
    id: "common_fruit_30",
    name: "Furu Furu no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Shake",
    power: "Vibration generation",
    description: "Create small vibrations and tremors in objects.",
    multiplier: 1.08,
    user: "Common User 30"
  },

  "common_fruit_31": {
    id: "common_fruit_31",
    name: "Neko Neko no Mi Model: Cat",
    type: "Zoan",
    rarity: "common",
    element: "Cat",
    power: "House cat transformation",
    description: "Transform into a common house cat with enhanced agility.",
    multiplier: 1.07,
    user: "Common User 31"
  },

  "common_fruit_32": {
    id: "common_fruit_32",
    name: "Inu Inu no Mi Model: Dog",
    type: "Zoan",
    rarity: "common",
    element: "Dog",
    power: "Dog transformation",
    description: "Transform into a loyal dog with enhanced senses.",
    multiplier: 1.06,
    user: "Common User 32"
  },

  "common_fruit_33": {
    id: "common_fruit_33",
    name: "Nezumi Nezumi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Mouse",
    power: "Mouse transformation",
    description: "Transform into a small mouse for stealth and speed.",
    multiplier: 1.05,
    user: "Common User 33"
  },

  "common_fruit_34": {
    id: "common_fruit_34",
    name: "Usagi Usagi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Rabbit",
    power: "Rabbit transformation",
    description: "Transform into a rabbit with enhanced jumping abilities.",
    multiplier: 1.04,
    user: "Common User 34"
  },

  "common_fruit_35": {
    id: "common_fruit_35",
    name: "Tori Tori no Mi Model: Sparrow",
    type: "Zoan",
    rarity: "common",
    element: "Sparrow",
    power: "Sparrow transformation",
    description: "Transform into a small sparrow for flight and reconnaissance.",
    multiplier: 1.03,
    user: "Common User 35"
  },

  "common_fruit_36": {
    id: "common_fruit_36",
    name: "Sakana Sakana no Mi Model: Goldfish",
    type: "Zoan",
    rarity: "common",
    element: "Goldfish",
    power: "Goldfish transformation",
    description: "Transform into a goldfish with basic swimming abilities.",
    multiplier: 1.02,
    user: "Common User 36"
  },

  "common_fruit_37": {
    id: "common_fruit_37",
    name: "Kaeru Kaeru no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Frog",
    power: "Frog transformation",
    description: "Transform into a frog with jumping and swimming abilities.",
    multiplier: 1.01,
    user: "Common User 37"
  },

  "common_fruit_38": {
    id: "common_fruit_38",
    name: "Hebi Hebi no Mi Model: Garden Snake",
    type: "Zoan",
    rarity: "common",
    element: "Garden Snake",
    power: "Small snake transformation",
    description: "Transform into a harmless garden snake.",
    multiplier: 1.00,
    user: "Common User 38"
  },

  "common_fruit_39": {
    id: "common_fruit_39",
    name: "Kani Kani no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Crab",
    power: "Crab transformation",
    description: "Transform into a crab with pincer attacks.",
    multiplier: 1.19,
    user: "Common User 39"
  },

  "common_fruit_40": {
    id: "common_fruit_40",
    name: "Ebi Ebi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Shrimp",
    power: "Shrimp transformation",
    description: "Transform into a shrimp with jumping abilities.",
    multiplier: 1.18,
    user: "Common User 40"
  },

  "common_fruit_41": {
    id: "common_fruit_41",
    name: "Kurage Kurage no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Jellyfish",
    power: "Jellyfish transformation",
    description: "Transform into a jellyfish with stinging abilities.",
    multiplier: 1.17,
    user: "Common User 41"
  },

  "common_fruit_42": {
    id: "common_fruit_42",
    name: "Hitode Hitode no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Starfish",
    power: "Starfish transformation",
    description: "Transform into a starfish with regenerative abilities.",
    multiplier: 1.16,
    user: "Common User 42"
  },

  "common_fruit_43": {
    id: "common_fruit_43",
    name: "Uni Uni no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Sea Urchin",
    power: "Sea urchin transformation",
    description: "Transform into a spiky sea urchin for defense.",
    multiplier: 1.15,
    user: "Common User 43"
  },

  "common_fruit_44": {
    id: "common_fruit_44",
    name: "Hotate Hotate no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Scallop",
    power: "Scallop transformation",
    description: "Transform into a scallop with shell protection.",
    multiplier: 1.14,
    user: "Common User 44"
  },

  "common_fruit_45": {
    id: "common_fruit_45",
    name: "Kaki Kaki no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Oyster",
    power: "Oyster transformation",
    description: "Transform into an oyster with pearl production.",
    multiplier: 1.13,
    user: "Common User 45"
  },

  "common_fruit_46": {
    id: "common_fruit_46",
    name: "Ari Ari no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Ant",
    power: "Ant transformation",
    description: "Transform into an ant with colony coordination.",
    multiplier: 1.12,
    user: "Common User 46"
  },

  "common_fruit_47": {
    id: "common_fruit_47",
    name: "Hachi Hachi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Bee",
    power: "Bee transformation",
    description: "Transform into a bee with stinging and flight abilities.",
    multiplier: 1.11,
    user: "Common User 47"
  },

  "common_fruit_48": {
    id: "common_fruit_48",
    name: "Cho Cho no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Butterfly",
    power: "Butterfly transformation",
    description: "Transform into a butterfly with beautiful wings.",
    multiplier: 1.10,
    user: "Common User 48"
  },

  "common_fruit_49": {
    id: "common_fruit_49",
    name: "Kumo Kumo no Mi Model: Garden Spider",
    type: "Zoan",
    rarity: "common",
    element: "Garden Spider",
    power: "Small spider transformation",
    description: "Transform into a garden spider with web abilities.",
    multiplier: 1.09,
    user: "Common User 49"
  },

  "common_fruit_50": {
    id: "common_fruit_50",
    name: "Mukade Mukade no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Centipede",
    power: "Centipede transformation",
    description: "Transform into a centipede with many legs for speed.",
    multiplier: 1.08,
    user: "Common User 50"
  },

  "common_fruit_51": {
    id: "common_fruit_51",
    name: "Mimizu Mimizu no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Earthworm",
    power: "Earthworm transformation",
    description: "Transform into an earthworm with soil movement abilities.",
    multiplier: 1.07,
    user: "Common User 51"
  }
};

// RARITY WEIGHTS - Balanced distribution
const RARITY_WEIGHTS = {
  common: 45,        // 45%
  uncommon: 30,      // 30%  
  rare: 15,          // 15%
  epic: 7,           // 7%
  legendary: 2.5,    // 2.5%
  mythical: 0.45,    // 0.45%
  divine: 0.05       // 0.05%
};

// DIVINE FRUIT WEIGHTS (for when divine is selected)
const DIVINE_WEIGHTS = {
  "yami_yami_gura_gura_no_mi": 30,
  "gomu_gomu_nika_no_mi": 25, 
  "gura_gura_no_mi": 20,
  "uo_uo_no_mi_seiryu": 25
};

// Rarity colors for embeds
const RARITY_COLORS = {
  common: '#808080',     // Gray
  uncommon: '#00FF00',   // Green
  rare: '#0080FF',       // Blue
  epic: '#800080',       // Purple
  legendary: '#FFD700',  // Gold
  mythical: '#FF8000',   // Orange
  divine: '#FFFFFF'      // White
};

// Rarity emojis
const RARITY_EMOJIS = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵', 
  epic: '🟣',
  legendary: '🌟',
  mythical: '🟠',
  divine: '✨'
};

// Enhanced utility functions
function getRarityWeights(pityCount = 0) {
  return { ...RARITY_WEIGHTS };
}

function getFruitsByRarity(rarity) {
  return Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
}

function getFruitById(id) {
  return DEVIL_FRUITS[id] || null;
}

function getRandomFruitByRarity(rarity) {
  const fruits = getFruitsByRarity(rarity);
  
  if (rarity === 'divine') {
    return selectWeightedDivineFruit(fruits);
  }
  
  return fruits[Math.floor(Math.random() * fruits.length)];
}

function selectWeightedDivineFruit(divineFruits) {
  const totalWeight = Object.values(DIVINE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const fruit of divineFruits) {
    const weight = DIVINE_WEIGHTS[fruit.id] || 1;
    random -= weight;
    if (random <= 0) {
      return fruit;
    }
  }
  
  return divineFruits[0];
}

// NEW: Get fruit with skill data combined
function getFruitWithSkill(fruitId) {
  const fruit = DEVIL_FRUITS[fruitId];
  if (!fruit) return null;
  
  // Get skill from DevilFruitSkills.js or use fallback
  const skillData = getSkillData ? getSkillData(fruitId) : null;
  
  // Use skill from DevilFruitSkills.js or create placeholder
  const skill = skillData || {
    name: `${fruit.name} Power`,
    damage: Math.floor(fruit.multiplier * 50), // Base damage based on multiplier
    cooldown: Math.max(1, Math.floor(fruit.multiplier / 2)), // Cooldown based on power
    effect: null,
    description: `A powerful ${fruit.rarity} level devil fruit ability`,
    type: "attack"
  };
  
  return {
    ...fruit,
    skill
  };
}

// NEW: Get all fruits with their skills
function getAllFruitsWithSkills() {
  return Object.keys(DEVIL_FRUITS).map(fruitId => getFruitWithSkill(fruitId));
}

function getAllFruits() {
  return Object.values(DEVIL_FRUITS);
}

function getStats() {
  const total = Object.keys(DEVIL_FRUITS).length;
  const byRarity = {};
  
  Object.values(DEVIL_FRUITS).forEach(fruit => {
    byRarity[fruit.rarity] = (byRarity[fruit.rarity] || 0) + 1;
  });
  
  return { total, byRarity };
}

function getDivineStats() {
  const divineFruits = getFruitsByRarity('divine');
  const stats = {};
  
  divineFruits.forEach(fruit => {
    const weight = DIVINE_WEIGHTS[fruit.id] || 1;
    const totalWeight = Object.values(DIVINE_WEIGHTS).reduce((sum, w) => sum + w, 0);
    const percentage = ((weight / totalWeight) * 100).toFixed(3);
    
    stats[fruit.name] = {
      weight,
      percentage: percentage + '%',
      isRarest: false // No ultra rare fruit in this system
    };
  });
  
  return stats;
}

module.exports = { 
  DEVIL_FRUITS, 
  RARITY_WEIGHTS,
  DIVINE_WEIGHTS,
  RARITY_COLORS,
  RARITY_EMOJIS,
  getRarityWeights,
  getFruitsByRarity,
  getFruitById,
  getRandomFruitByRarity,
  selectWeightedDivineFruit,
  getFruitWithSkill,        // Get fruit with skill data
  getAllFruitsWithSkills,   // Get all fruits with skills
  getAllFruits,
  getStats,
  getDivineStats
};
