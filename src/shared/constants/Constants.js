// src/data/Constants.js - UPDATED: New Balanced Rarity System
module.exports = {
    // Game Economy Constants
    PULL_COST: 1000,
    MULTI_PULL_DISCOUNT: 0.9, // 10% discount for 10-pulls
    BASE_INCOME: 50,
    INCOME_MULTIPLIER: 0.1,
    MANUAL_INCOME_MULTIPLIER: 6,
    MANUAL_INCOME_COOLDOWN: 60, // seconds
    
    // Enhanced Rarity Colors for embeds
    RARITY_COLORS: {
        common: '#808080',     // Gray
        uncommon: '#00FF00',   // Green
        rare: '#0080FF',       // Blue
        epic: '#800080',       // Purple
        legendary: '#FFD700',  // Gold
        mythical: '#FF8000',   // Orange
        divine: '#FFFFFF'      // White (Divine Tier)
    },
    
    // Enhanced Rarity Emojis
    RARITY_EMOJIS: {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🌟',
        mythical: '🟠',
        divine: '✨'           // Divine Tier
    },

    // Rarity Names (formatted)
    RARITY_NAMES: {
        common: 'Common',
        uncommon: 'Uncommon',
        rare: 'Rare',
        epic: 'Epic',
        legendary: 'Legendary',
        mythical: 'Mythical',
        divine: 'Divine'       // Divine Tier
    },
    
    // NEW BALANCED PULL RATES - Based on actual distribution
    BASE_PULL_RATES: {
        common: 45,             // 45% - Most fruits
        uncommon: 30,           // 30% - Common but useful
        rare: 15,               // 15% - Notable powers
        epic: 7,                // 7% - Strong abilities
        legendary: 2.5,         // 2.5% - Very powerful
        mythical: 0.45,         // 0.45% - Extremely rare
        divine: 0.05            // 0.05% - Ultra rare
    },

    // BALANCED PITY SYSTEM - Mythical/Divine focus
    PITY_SYSTEM: {
        HARD_PITY_LIMIT: 1500,     // Guaranteed at 1500
        
        // Premium rates when pity procs - ONLY Mythical/Divine
        PREMIUM_RATES: {
            mythical: 90.0,         // 90% when pity procs  
            divine: 10.0            // 10% when pity procs
        },
        
        // Pity proc chance calculation
        BASE_PITY_CHANCE: 0.0,      // Base chance at 0 pulls
        MAX_PITY_CHANCE: 100.0,     // 100% chance at 1500 pulls
        
        // Pity resets on mythical/divine
        RESET_RARITIES: ['mythical', 'divine'],
        
        // Scaling power
        SCALING_POWER: 3.0          // Exponential scaling
    },

    // UPDATED Display Rates
    RARITY_DROP_RATES: {
        common: '45%',
        uncommon: '30%', 
        rare: '15%',
        epic: '7%',
        legendary: '2.5%',
        mythical: '0.45%',
        divine: '0.05%'
    },
    
    // Enhanced PvP Battle System Constants
    BATTLE_CONSTANTS: {
        MAX_TURNS: 20,         
        TURN_TIME: 45,         
        BASE_HP: 200,          
        HP_PER_LEVEL: 15,      
        CP_TO_HP_RATIO: 0.5,   
        
        // Type advantages for PvP
        TYPE_ADVANTAGES: {
            'Paramecia': { strong: ['Zoan'], weak: ['Logia'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Logia': { strong: ['Paramecia'], weak: ['Zoan'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Zoan': { strong: ['Logia'], weak: ['Paramecia'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Ancient Zoan': { strong: ['Paramecia', 'Logia'], weak: ['Mythical Zoan'], neutral: ['Zoan'] },
            'Mythical Zoan': { strong: ['Ancient Zoan', 'Zoan'], weak: ['Divine'], neutral: ['Paramecia', 'Logia'] },
            'Carnivorous Zoan': { strong: ['Zoan', 'Ancient Zoan'], weak: ['Mythical Zoan'], neutral: ['Paramecia', 'Logia'] },
            'Special Paramecia': { strong: ['Paramecia', 'Zoan'], weak: ['Logia'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Artificial Zoan': { strong: ['None'], weak: ['All'], neutral: ['Artificial Zoan'] }
        },
        
        // Enhanced battle mechanics
        CRIT_CHANCE: 0.15,       
        CRIT_MULTIPLIER: 1.8,    
        DODGE_CHANCE: 0.08,      
        BLOCK_CHANCE: 0.12,      
        COUNTER_CHANCE: 0.05,    
        
        // Status effect durations
        MAX_STATUS_DURATION: 5,
        STATUS_STACK_LIMIT: 3
    },
    
    // NEW CP Multipliers by rarity (based on actual fruit data)
    CP_MULTIPLIERS: {
        common: { min: 1.0, max: 1.2 },
        uncommon: { min: 1.2, max: 1.4 },
        rare: { min: 1.4, max: 1.7 },
        epic: { min: 1.7, max: 2.1 },
        legendary: { min: 1.95, max: 2.6 },
        mythical: { min: 2.6, max: 3.2 },
        divine: { min: 3.7, max: 4.0 }    
    },

    // PvP Skill Categories
    SKILL_CATEGORIES: {
        ATTACK: 'attack',
        DEFENSE: 'defense', 
        SUPPORT: 'support',
        ULTIMATE: 'ultimate',
        PASSIVE: 'passive'
    },

    // Status Effects for PvP
    STATUS_EFFECTS: {
        // Damage over time
        POISON: { type: 'dot', icon: '☠️' },
        BURN: { type: 'dot', icon: '🔥' },
        BLEED: { type: 'dot', icon: '🩸' },
        FREEZE: { type: 'dot', icon: '❄️' },
        
        // Debuffs
        SLOW: { type: 'debuff', icon: '🐌' },
        WEAK: { type: 'debuff', icon: '😵' },
        BLIND: { type: 'debuff', icon: '🙈' },
        SILENCE: { type: 'debuff', icon: '🤐' },
        
        // Buffs
        STRENGTH: { type: 'buff', icon: '💪' },
        SPEED: { type: 'buff', icon: '💨' },
        DEFENSE: { type: 'buff', icon: '🛡️' },
        REGENERATION: { type: 'buff', icon: '💚' },
        
        // Special
        INVINCIBLE: { type: 'special', icon: '✨' },
        INVISIBLE: { type: 'special', icon: '👻' },
        REFLECT: { type: 'special', icon: '🪞' }
    },

    // Updated Achievements System
    ACHIEVEMENTS: {
        FIRST_PULL: { 
            id: 'first_pull', 
            name: 'First Steps on the Grand Line', 
            description: 'Make your first devil fruit pull',
            reward: 500,
            icon: '🍈'
        },
        UNCOMMON_COLLECTOR: { 
            id: 'uncommon_collector', 
            name: 'Rising Pirate', 
            description: 'Pull an uncommon devil fruit',
            reward: 1000,
            icon: '🟢'
        },
        RARE_HUNTER: { 
            id: 'rare_hunter', 
            name: 'Rare Fruit Hunter', 
            description: 'Pull a rare devil fruit',
            reward: 2500,
            icon: '🔵'
        },
        EPIC_MASTER: {
            id: 'epic_master',
            name: 'Epic Power User',
            description: 'Pull an epic devil fruit',
            reward: 5000,
            icon: '🟣'
        },
        LEGENDARY_HUNTER: { 
            id: 'legendary_hunter', 
            name: 'Legendary Pirate', 
            description: 'Pull a legendary devil fruit',
            reward: 15000,
            icon: '🌟'
        },
        MYTHICAL_MASTER: {
            id: 'mythical_master',
            name: 'Mythical Legend',
            description: 'Pull a mythical devil fruit',
            reward: 50000,
            icon: '🟠'
        },
        DIVINE_ASCENSION: {
            id: 'divine_ascension',
            name: 'Divine Ascension',
            description: 'Pull a divine devil fruit',
            reward: 200000,
            icon: '✨'
        },
        BLACKBEARD_SPECIAL: {
            id: 'blackbeard_special',
            name: 'Dual Devil Fruit User',
            description: 'Pull the Yami Yami + Gura Gura no Mi',
            reward: 500000,
            icon: '⚫'
        },
        GEAR_FIFTH: {
            id: 'gear_fifth',
            name: 'Sun God Awakening',
            description: 'Pull the Gomu Gomu/Nika no Mi',
            reward: 500000,
            icon: '☀️'
        },
        COLLECTOR_10: { 
            id: 'collector_10', 
            name: 'Novice Collector', 
            description: 'Collect 10 unique fruits',
            reward: 3000,
            icon: '📚'
        },
        COLLECTOR_25: {
            id: 'collector_25',
            name: 'Expert Collector',
            description: 'Collect 25 unique fruits', 
            reward: 8000,
            icon: '📖'
        },
        COLLECTOR_50: { 
            id: 'collector_50', 
            name: 'Master Collector', 
            description: 'Collect 50 unique fruits',
            reward: 20000,
            icon: '📜'
        },
        COLLECTOR_100: {
            id: 'collector_100',
            name: 'Legendary Collector',
            description: 'Collect 100 unique fruits',
            reward: 50000,
            icon: '🗞️'
        },
        FULL_COLLECTION: {
            id: 'full_collection',
            name: 'Complete Devil Fruit Encyclopedia',
            description: 'Collect all unique fruits',
            reward: 1000000,
            icon: '📕'
        },
        RICH_PIRATE: { 
            id: 'rich_pirate', 
            name: 'Rich Pirate', 
            description: 'Accumulate 1,000,000 berries',
            reward: 100000,
            icon: '💰'
        },
        MILLIONAIRE: {
            id: 'millionaire',
            name: 'Pirate Millionaire',
            description: 'Accumulate 10,000,000 berries',
            reward: 500000,
            icon: '💎'
        },
        PVP_ROOKIE: {
            id: 'pvp_rookie',
            name: 'Battle Rookie',
            description: 'Win your first PvP battle',
            reward: 5000,
            icon: '⚔️'
        },
        PVP_VETERAN: {
            id: 'pvp_veteran', 
            name: 'Battle Veteran',
            description: 'Win 10 PvP battles',
            reward: 15000,
            icon: '🏆'
        },
        PVP_CHAMPION: {
            id: 'pvp_champion',
            name: 'Battle Champion',
            description: 'Win 50 PvP battles',
            reward: 75000,
            icon: '👑'
        },
        PITY_BREAKER: {
            id: 'pity_breaker',
            name: 'Pity System Master',
            description: 'Trigger the pity system for a guaranteed high-tier fruit',
            reward: 25000,
            icon: '🎯'
        }
    },

    // Error Messages
    ERROR_MESSAGES: {
        INSUFFICIENT_BERRIES: 'You don\'t have enough berries! 💸',
        USER_NOT_FOUND: 'User not found in the database. 👤',
        FRUIT_NOT_FOUND: 'Devil Fruit not found. 🍈',
        COOLDOWN_ACTIVE: 'This action is on cooldown. ⏰',
        PERMISSION_DENIED: 'You don\'t have permission to do this. 🚫',
        DATABASE_ERROR: 'A database error occurred. Please try again. 🗄️',
        NETWORK_ERROR: 'A network error occurred. Please check your connection. 🌐',
        PVP_BATTLE_ACTIVE: 'You are already in a PvP battle! ⚔️',
        INVALID_TARGET: 'Invalid battle target selected. 🎯',
        SKILL_ON_COOLDOWN: 'That skill is still on cooldown! ⏳'
    },

    // Enhanced Command Categories
    COMMAND_CATEGORIES: {
        GACHA: 'gacha',
        ECONOMY: 'economy',
        PVP: 'pvp',
        COLLECTION: 'collection',
        ADMIN: 'admin',
        GENERAL: 'general',
        LEADERBOARD: 'leaderboard',
        INFO: 'info'
    },

    // Embed Limits (Discord limits)
    EMBED_LIMITS: {
        TITLE: 256,
        DESCRIPTION: 4096,
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
        FOOTER: 2048,
        AUTHOR: 256,
        FIELDS_MAX: 25
    },

    // Enhanced Pagination
    PAGINATION: {
        ITEMS_PER_PAGE: 15,  // Increased for better display
        MAX_PAGES: 50,       // Increased for large collections
        TIMEOUT: 300000      
    },

    // Time Constants
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000
    },

    // Enhanced Bot Status Messages
    BOT_ACTIVITIES: [
        { name: 'the Grand Line for Devil Fruits! 🍈', type: 3 }, 
        { name: '/summon to find Devil Fruits!', type: 2 }, 
        { name: 'One Piece adventures!', type: 0 }, 
        { name: 'pirates battling in PvP! ⚔️', type: 3 }, 
        { name: 'the ocean waves 🌊', type: 2 }, 
        { name: 'with devil fruit powers! 💪', type: 0 }, 
        { name: 'legendary battles unfold! 🌟', type: 3 },
        { name: 'for mythical treasures! 🟠', type: 3 },
        { name: 'divine power awakening! ✨', type: 3 }
    ],

    // Enhanced Level System
    LEVEL_SYSTEM: {
        BASE_EXP: 100,
        EXP_MULTIPLIER: 1.4,      
        CP_PER_LEVEL: 15,         // Increased
        MAX_LEVEL: 200,           // Increased
        PRESTIGE_LEVEL: 150,      // Increased
        PRESTIGE_BONUS: 1.5       
    },

    // Navigation Emojis for pagination
    NAVIGATION_EMOJIS: {
        FIRST: '⏮️',
        PREVIOUS: '⬅️',
        NEXT: '➡️',
        LAST: '⏭️',
        SUMMARY: '📊',
        BATTLE: '⚔️',
        COLLECTION: '📚'
    },

    // PvP Queue System
    PVP_QUEUE: {
        MAX_WAIT_TIME: 120000,    
        RANK_DIFFERENCE: 3,       
        CP_DIFFERENCE: 1000,      // Increased for balance
        TIMEOUT_PENALTY: 300000   
    },

    // Berry Emoji
    BERRY_EMOJI: '🍓',
    
    // Devil Fruit Emoji  
    FRUIT_EMOJI: '🍈',

    // Enhanced Battle Emojis
    BATTLE_EMOJIS: {
        ATTACK: '⚔️',
        DEFEND: '🛡️',
        SKILL: '✨',
        CRITICAL: '💥',
        MISS: '💨',
        DODGE: '💫',
        BLOCK: '🚧',
        COUNTER: '🔄',
        WIN: '🏆',
        LOSE: '💀',
        DRAW: '🤝'
    },

    // Maximum values for various systems
    MAX_VALUES: {
        BERRIES: 999999999,       
        CP: 9999999,              // Increased for higher tier fruits
        LEVEL: 200,               // Increased
        COLLECTION_SIZE: 200,     // Based on actual fruit count
        DAILY_PULLS: 200,         // Increased
        PVP_BATTLES_DAILY: 100    // Increased
    },

    // Cooldown periods (in seconds)
    COOLDOWNS: {
        PULL: 3,                  
        INCOME: 60,               
        PVP_BATTLE: 300,          
        PRESTIGE: 86400,          
        DAILY_RESET: 86400        
    },

    // Special Events Configuration
    EVENTS: {
        DOUBLE_RATES: {
            name: 'Double Drop Rates',
            description: 'All rarity rates doubled!',
            multiplier: 2,
            icon: '🎉'
        },
        BERRY_BONUS: {
            name: 'Berry Bonus Weekend',
            description: '50% more berries from income!',
            multiplier: 1.5,
            icon: '💰'
        },
        PVP_TOURNAMENT: {
            name: 'PvP Tournament',
            description: 'Special PvP rewards available!',
            multiplier: 1,
            icon: '🏆'
        },
        MYTHICAL_RATE_UP: {
            name: 'Mythical Rate Up',
            description: 'Increased chances for Mythical and Divine fruits!',
            multiplier: 3,
            icon: '🟠'
        },
        PITY_BOOST: {
            name: 'Pity System Boost',
            description: 'Pity builds up 50% faster!',
            multiplier: 1.5,
            icon: '🎯'
        }
    },

    // New Fruit Categories for filtering
    FRUIT_CATEGORIES: {
        PARAMECIA: 'paramecia',
        LOGIA: 'logia', 
        ZOAN: 'zoan',
        ANCIENT_ZOAN: 'ancient_zoan',
        MYTHICAL_ZOAN: 'mythical_zoan',
        CARNIVOROUS_ZOAN: 'carnivorous_zoan',
        SPECIAL_PARAMECIA: 'special_paramecia',
        ARTIFICIAL_ZOAN: 'artificial_zoan'
    },

    // User Rankings based on collection/power
    USER_RANKS: {
        ROOKIE: { min: 0, max: 10, name: 'Rookie Pirate', icon: '⚪' },
        PIRATE: { min: 11, max: 25, name: 'Pirate', icon: '🟢' },
        CAPTAIN: { min: 26, max: 50, name: 'Pirate Captain', icon: '🔵' },
        SUPERNOVA: { min: 51, max: 100, name: 'Supernova', icon: '🟣' },
        SHICHIBUKAI: { min: 101, max: 150, name: 'Shichibukai', icon: '🌟' },
        YONKO: { min: 151, max: 180, name: 'Yonko', icon: '🟠' },
        PIRATE_KING: { min: 181, max: 999, name: 'Pirate King', icon: '✨' }
    },

    // Featured fruit rotation
    FEATURED_ROTATION_DAYS: 7, // Weekly rotation

    // Collection milestones
    COLLECTION_MILESTONES: [5, 10, 25, 50, 75, 100, 125, 150, 175, 200],

    // Rarity upgrade chances (for future features)
    RARITY_UPGRADE_CHANCES: {
        common_to_uncommon: 0.1,
        uncommon_to_rare: 0.05,
        rare_to_epic: 0.02,
        epic_to_legendary: 0.01,
        legendary_to_mythical: 0.005,
        mythical_to_divine: 0.001
    }
};
