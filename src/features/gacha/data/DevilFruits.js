// src/features/gacha/data/DevilFruits.js - BASIC: Devil Fruits Data
const DEVIL_FRUITS = {
    // Divine Tier (4 fruits)
    "yami_yami_gura_gura_no_mi": {
        id: "yami_yami_gura_gura_no_mi",
        name: "Yami Yami + Gura Gura no Mi",
        type: "Special Paramecia",
        rarity: "divine",
        element: "Darkness & Earthquake",
        description: "Blackbeard's dual Devil Fruit power - darkness that nullifies abilities and earthquakes that destroy the world",
        power: "Ultimate Destruction"
    },
    "gomu_gomu_nika_no_mi": {
        id: "gomu_gomu_nika_no_mi", 
        name: "Gomu Gomu no Mi (Nika)",
        type: "Mythical Zoan",
        rarity: "divine",
        element: "Liberation",
        description: "Luffy's awakened rubber fruit - actually the Human Human Fruit Model: Nika, the Sun God",
        power: "Liberation of Everything"
    },
    "gura_gura_no_mi": {
        id: "gura_gura_no_mi",
        name: "Gura Gura no Mi",
        type: "Paramecia", 
        rarity: "divine",
        element: "Earthquake",
        description: "Whitebeard's world-destroying power - create earthquakes and tsunamis",
        power: "World Destruction"
    },
    "uo_uo_no_mi_seiryu": {
        id: "uo_uo_no_mi_seiryu",
        name: "Uo Uo no Mi, Model: Seiryu",
        type: "Mythical Zoan",
        rarity: "divine", 
        element: "Dragon",
        description: "Kaido's Azure Dragon form - control weather and elements",
        power: "Elemental Mastery"
    },

    // Mythical Tier (12 fruits)
    "goro_goro_no_mi": {
        id: "goro_goro_no_mi",
        name: "Goro Goro no Mi",
        type: "Logia",
        rarity: "mythical",
        element: "Lightning", 
        description: "Enel's lightning power - move at light speed and control electricity",
        power: "Lightning God"
    },
    "hie_hie_no_mi": {
        id: "hie_hie_no_mi",
        name: "Hie Hie no Mi", 
        type: "Logia",
        rarity: "mythical",
        element: "Ice",
        description: "Aokiji's ice power - freeze entire oceans and create ice ages",
        power: "Absolute Zero"
    },
    "pika_pika_no_mi": {
        id: "pika_pika_no_mi",
        name: "Pika Pika no Mi",
        type: "Logia", 
        rarity: "mythical",
        element: "Light",
        description: "Kizaru's light power - move at light speed and fire laser beams",
        power: "Light Speed"
    },
    "magu_magu_no_mi": {
        id: "magu_magu_no_mi",
        name: "Magu Magu no Mi",
        type: "Logia",
        rarity: "mythical",
        element: "Magma",
        description: "Akainu's magma power - burn through anything with molten rock",
        power: "Absolute Justice"
    },
    "soru_soru_no_mi": {
        id: "soru_soru_no_mi", 
        name: "Soru Soru no Mi",
        type: "Paramecia",
        rarity: "mythical",
        element: "Soul",
        description: "Big Mom's soul power - manipulate souls and create homies", 
        power: "Soul Manipulation"
    },
    "zushi_zushi_no_mi": {
        id: "zushi_zushi_no_mi",
        name: "Zushi Zushi no Mi",
        type: "Paramecia",
        rarity: "mythical", 
        element: "Gravity",
        description: "Fujitora's gravity power - control gravity and pull meteors from space",
        power: "Gravity Control"
    },

    // Add more fruits for other rarities as needed...
    // For now, this basic set will prevent the import error

    // Legendary Tier (14 fruits)
    "nikyu_nikyu_no_mi": {
        id: "nikyu_nikyu_no_mi",
        name: "Nikyu Nikyu no Mi",
        type: "Paramecia",
        rarity: "legendary",
        element: "Repulsion",
        description: "Kuma's paw power - repel anything including pain and air",
        power: "Paw Repulsion"
    },
    "ope_ope_no_mi": {
        id: "ope_ope_no_mi",
        name: "Ope Ope no Mi", 
        type: "Paramecia",
        rarity: "legendary",
        element: "Surgery",
        description: "Law's operation power - create ROOMs where you control everything",
        power: "Spatial Surgery"
    },

    // Epic Tier (24 fruits) 
    "hobi_hobi_no_mi": {
        id: "hobi_hobi_no_mi",
        name: "Hobi Hobi no Mi",
        type: "Paramecia", 
        rarity: "epic",
        element: "Toys",
        description: "Sugar's toy power - turn people into toys and erase memories",
        power: "Toy Transformation"
    },

    // Rare Tier (30 fruits)
    "doa_doa_no_mi": {
        id: "doa_doa_no_mi", 
        name: "Doa Doa no Mi",
        type: "Paramecia",
        rarity: "rare",
        element: "Doors",
        description: "Blueno's door power - create doors in air itself",
        power: "Dimensional Doors"
    },

    // Uncommon Tier (30 fruits)
    "kibi_kibi_no_mi": {
        id: "kibi_kibi_no_mi",
        name: "Kibi Kibi no Mi", 
        type: "Paramecia",
        rarity: "uncommon",
        element: "Dango",
        description: "Tama's dango power - tame animals with magical dumplings",
        power: "Animal Taming"
    },

    // Common Tier (51 fruits)
    "kiro_kiro_no_mi": {
        id: "kiro_kiro_no_mi",
        name: "Kiro Kiro no Mi",
        type: "Paramecia",
        rarity: "common", 
        element: "Weight",
        description: "Miss Valentine's weight power - control your body weight",
        power: "Weight Control"
    }
};

module.exports = DEVIL_FRUITS;
