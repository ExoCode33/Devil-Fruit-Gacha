// src/utils/GachaRevealUtils.js - FIXED: Complete Enhanced Gacha Reveal System
// src/utils/GachaRevealUtils.js - FIXED: Complete Enhanced Gacha Reveal System
const { EmbedBuilder } = require('discord.js');
const { skillsManager } = require('../data/DevilFruitSkills');
const { DEVIL_FRUITS } = require('../data/DevilFruits');
const { RARITY_EMOJIS, RARITY_COLORS } = require('../data/Constants');

/**
 * DEBUGGING: Safe charAt function with full error tracking
 */
function safeCharAt(str, index, context = 'unknown') {
    try {
        if (str === null || str === undefined) {
            console.error(`SAFE_CHARAT: String is null/undefined in context: ${context}`, { str, index, type: typeof str });
            return '';
        }
        if (typeof str !== 'string') {
            console.error(`SAFE_CHARAT: Not a string in context: ${context}`, { str, index, type: typeof str });
            return '';
        }
        if (str.length === 0) {
            console.error(`SAFE_CHARAT: Empty string in context: ${context}`, { str, index });
            return '';
        }
        if (index >= str.length || index < 0) {
            console.error(`SAFE_CHARAT: Index out of bounds in context: ${context}`, { str, index, length: str.length });
            return '';
        }
        return str.charAt(index);
    } catch (error) {
        console.error(`SAFE_CHARAT: Unexpected error in context: ${context}`, { str, index, error: error.message });
        return '';
    }
}

/**
 * DEBUGGING: Safe rarity name formatter
 */
function formatRarityName(rarity, context = 'unknown') {
    try {
        if (!rarity) {
            console.warn(`FORMAT_RARITY: No rarity provided in context: ${context}`, { rarity, type: typeof rarity });
            return 'Common';
        }
        
        if (typeof rarity !== 'string') {
            console.warn(`FORMAT_RARITY: Rarity is not a string in context: ${context}`, { rarity, type: typeof rarity });
            return 'Common';
        }
        
        if (rarity.length === 0) {
            console.warn(`FORMAT_RARITY: Empty rarity string in context: ${context}`, { rarity });
            return 'Common';
        }
        
        const firstChar = safeCharAt(rarity, 0, `formatRarityName-${context}`);
        if (!firstChar) {
            console.warn(`FORMAT_RARITY: Failed to get first character in context: ${context}`, { rarity });
            return 'Common';
        }
        
        return firstChar.toUpperCase() + rarity.slice(1);
        
    } catch (error) {
        console.error(`FORMAT_RARITY: Unexpected error in context: ${context}`, { rarity, error: error.message, stack: error.stack });
        return 'Common';
    }
}

/**
 * FIXED: Create enhanced gacha reveal embed with comprehensive safety checks
 */
function createEnhancedGachaReveal(results, batchNumber = 1, totalBatches = 1) {
    try {
        // Validate input parameters
        if (!results || !Array.isArray(results) || results.length === 0) {
            console.warn('Invalid results data for enhanced reveal, using fallback');
            throw new Error('Invalid results array');
        }

        const embed = new EmbedBuilder()
            .setTitle(`🍈 Devil Fruit Batch ${batchNumber}/${totalBatches} Complete!`)
            .setColor(RARITY_COLORS.legendary || 0xFFD700)
            .setTimestamp();

        let description = `🎉 **Batch ${batchNumber} Results:** 🎉\n\n`;

        results.forEach((result, index) => {
            try {
                // COMPREHENSIVE safety checks for result structure
                if (!result || typeof result !== 'object') {
                    console.warn(`Invalid result at index ${index}, skipping`);
                    return;
                }

                // Extract fruit data with multiple fallback strategies
                const fruit = result.fruit || result || {};
                
                // CRITICAL: Ensure all required properties exist with safe defaults
                const safeId = fruit.id || fruit.fruit_id || `unknown_${index}`;
                const safeName = fruit.fruit_name || fruit.name || 'Unknown Fruit';
                const safeType = fruit.fruit_type || fruit.type || 'Unknown';
                const safeRarity = fruit.fruit_rarity || fruit.rarity || 'common'; // ALWAYS fallback to 'common'
                const safeDescription = fruit.fruit_description || fruit.description || fruit.power || 'A mysterious Devil Fruit power';
                
                // FIXED: Use the safe rarity formatter
                const rarityName = formatRarityName(safeRarity, `enhancedReveal-fruit-${index}`);

                // Get rarity emoji with fallback
                const rarityEmoji = RARITY_EMOJIS[safeRarity] || '⚪';

                // Status information
                const isNew = result.isNew !== false; // Default to true if not specified
                const statusEmoji = isNew ? '🆕' : '🔄';
                const statusText = isNew ? 'New!' : `Total Owned: ${fruit.count || 1}`;

                // Try to get skill information with enhanced formatting
                let skillInfo = 'Unknown Ability (50 DMG, 2s CD)';
                try {
                    const skillData = getSkillDisplay(safeId, safeRarity);
                    if (skillData && skillData.name) {
                        // Use enhanced formatting for embed display
                        skillInfo = formatSkillForDisplay(skillData, false); // Show full details
                    }
                } catch (skillError) {
                    console.warn(`Failed to get skill for ${safeId}:`, skillError.message);
                }

                // Calculate CP with safety checks
                const baseCP = fruit.base_cp || (parseFloat(fruit.multiplier) || 1) * 100;
                const totalCP = fruit.total_cp || baseCP;

                // Global number for batch display
                const globalNumber = ((batchNumber - 1) * 10 + index + 1).toString().padStart(2, '0');

                // Build the detailed result entry
                description += `**${globalNumber}.** ${rarityEmoji} **${safeName}** (${rarityName})\n`;
                description += `      ${statusEmoji} **Status:** ${statusText}\n`;
                description += `      🔮 **Type:** ${safeType}\n`;
                description += `      💪 **CP:** ${Math.floor(totalCP).toLocaleString()}\n`;
                description += `      🎯 **Description:** ${safeDescription}\n`;
                description += `      ⚔️ **Ability:** ${skillInfo}\n\n`;

            } catch (itemError) {
                console.error(`Error processing result item ${index}:`, itemError.message);
                description += `**${String(index + 1).padStart(2, '0')}.** ⚪ **Unknown Fruit** (Common)\n`;
                description += `      ❌ **Error:** Failed to process this fruit\n\n`;
            }
        });

        // Set the final description
        embed.setDescription(description);

        return embed;

    } catch (error) {
        console.error('Enhanced gacha reveal failed:', error.message);
        throw error; // Re-throw to trigger fallback
    }
}

/**
 * FIXED: Create summary embed with comprehensive error handling
 */
function createSummaryEmbed(allResults, userStats) {
    try {
        // Validate inputs
        if (!allResults || !Array.isArray(allResults)) {
            allResults = [];
        }
        if (!userStats || typeof userStats !== 'object') {
            userStats = { berries: 0, totalFruits: 0, uniqueFruits: 0 };
        }

        const rarityCount = {};
        let totalCP = 0;
        let newFruits = 0;

        // Count rarities and calculate stats with error handling
        allResults.forEach((result, index) => {
            try {
                const fruit = result?.fruit || result || {};
                const rarity = fruit.fruit_rarity || fruit.rarity || 'common';
                
                rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
                
                // Calculate CP
                const baseCP = fruit.base_cp || (parseFloat(fruit.multiplier) || 1) * 100;
                totalCP += Math.floor(baseCP);
                
                if (result.isNew !== false) newFruits++;
            } catch (itemError) {
                console.warn(`Error processing summary item ${index}:`, itemError.message);
                rarityCount['common'] = (rarityCount['common'] || 0) + 1;
            }
        });

        // Build rarity summary with proper sorting
        const raritySummary =         Object.entries(rarityCount)
            .sort(([,a], [,b]) => b - a) // Sort by count descending
            .map(([rarity, count]) => {
                const emoji = RARITY_EMOJIS[rarity] || '⚪';
                // FIXED: Use the safe rarity formatter
                const name = formatRarityName(rarity, `summaryEmbed-rarity-${rarity}`);
                return `${emoji} ${name}: ${count}`;
            })
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📊 Summon Session Summary')
            .setColor(RARITY_COLORS.divine || 0xFF0000)
            .addFields(
                {
                    name: '🎯 Pull Results',
                    value: [
                        `**Total Pulls:** ${allResults.length}`,
                        `**New Fruits:** ${newFruits}`,
                        `**Estimated CP Gained:** ${totalCP.toLocaleString()}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📈 Rarity Breakdown',
                    value: raritySummary || 'No fruits pulled',
                    inline: true
                },
                {
                    name: '💰 Current Stats',
                    value: [
                        `**Berries:** ${(userStats.berries || 0).toLocaleString()}`,
                        `**Total Fruits:** ${userStats.totalFruits || 0}`,
                        `**Collection:** ${userStats.uniqueFruits || 0} unique`
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ text: '🏴‍☠️ Keep sailing the Grand Line for more Devil Fruits!' })
            .setTimestamp();

        return embed;

    } catch (error) {
        console.error('Summary embed creation failed:', error.message);
        
        // Return basic fallback embed
        return new EmbedBuilder()
            .setTitle('📊 Summon Session Summary')
            .setColor(RARITY_COLORS.common || 0x808080)
            .setDescription('✅ Summon completed successfully!')
            .setFooter({ text: '🏴‍☠️ Keep sailing the Grand Line!' })
            .setTimestamp();
    }
}

/**
 * FIXED: Get detailed skill display with effects and special abilities
 */
function getSkillDisplay(fruitId, rarity) {
    try {
        // Validate inputs
        if (!fruitId || typeof fruitId !== 'string') {
            console.warn('Invalid fruitId for skill display');
            return null;
        }
        if (!rarity || typeof rarity !== 'string') {
            rarity = 'common';
        }

        // Try to get skill from skills manager
        if (skillsManager && typeof skillsManager.getSkillData === 'function') {
            const skillData = skillsManager.getSkillData(fruitId, rarity);
            if (skillData && skillData.name) {
                return skillData;
            }
        }

        // Try to get from DEVIL_FRUITS
        if (DEVIL_FRUITS && DEVIL_FRUITS[fruitId]) {
            const fruitData = DEVIL_FRUITS[fruitId];
            if (fruitData.skill) {
                return fruitData.skill;
            }
        }

        // Generate fallback skill
        return generateFallbackSkill(fruitId, rarity);

    } catch (error) {
        console.warn('Error getting skill display:', error.message);
        return generateFallbackSkill(fruitId, rarity);
    }
}

/**
 * ENHANCED: Format skill info with effects for display (with Discord limits)
 */
function formatSkillForDisplay(skillData, compact = false) {
    if (!skillData) {
        return 'Unknown Ability (50 DMG, 2s CD)';
    }

    try {
        // Basic skill info
        const name = skillData.name || 'Unknown Ability';
        const damage = skillData.damage || 50;
        const cooldown = skillData.cooldown || 2;
        const cost = skillData.cost || 0;

        // Build basic info
        let skillInfo = `${name} (${damage} DMG, ${cooldown}s CD`;
        if (cost > 0) {
            skillInfo += ` | ${cost} Energy`;
        }
        skillInfo += ')';

        // Add effects if not compact mode
        if (!compact) {
            const effects = [];

            // Status effect
            if (skillData.effect) {
                const effectName = skillData.effect.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                effects.push(`${effectName}`);
            }

            // Special abilities (limit to 2 most important)
            if (skillData.special && typeof skillData.special === 'object') {
                const specialEntries = Object.entries(skillData.special)
                    .filter(([key, value]) => value === true || (value !== false && value !== null && value !== undefined))
                    .slice(0, 2); // Limit to 2 special abilities

                specialEntries.forEach(([key, value]) => {
                    const specialName = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
                    const capitalizedName = specialName.charAt(0).toUpperCase() + specialName.slice(1);
                    
                    if (value === true) {
                        effects.push(capitalizedName);
                    } else {
                        effects.push(`${capitalizedName}: ${value}`);
                    }
                });
            }

            // Add type if available and not default
            if (skillData.type && skillData.type !== 'attack') {
                effects.push(`${skillData.type.charAt(0).toUpperCase() + skillData.type.slice(1)}`);
            }

            // Append effects with bullet separator (limit total length)
            if (effects.length > 0) {
                const effectsText = effects.join(' • ');
                // Ensure total length doesn't exceed Discord's field value limit (1024 chars)
                if ((skillInfo + ' • ' + effectsText).length <= 900) {
                    skillInfo += ` • ${effectsText}`;
                }
            }
        }

        // Ensure the skill info doesn't exceed reasonable length
        return skillInfo.length > 1000 ? skillInfo.substring(0, 997) + '...' : skillInfo;

    } catch (error) {
        console.warn('Error formatting skill for display:', error.message);
        return `${skillData.name || 'Unknown Ability'} (${skillData.damage || 50} DMG, ${skillData.cooldown || 2}s CD)`;
    }
}

/**
 * FIXED: Generate fallback skill with proper defaults
 */
function generateFallbackSkill(fruitId, rarity) {
    const rarityMultipliers = {
        'common': 1.0,
        'uncommon': 1.2,
        'rare': 1.5,
        'epic': 2.0,
        'legendary': 2.5,
        'mythical': 3.0,
        'divine': 4.0
    };

    const multiplier = rarityMultipliers[rarity] || 1.0;
    const baseDamage = Math.floor(50 * multiplier);

    return {
        name: 'Devil Fruit Power',
        damage: baseDamage,
        cooldown: 2,
        cost: 0,
        type: 'attack',
        description: 'A mysterious Devil Fruit ability'
    };
}

/**
 * FIXED: Create single pull reveal with error handling
 */
function createSinglePullReveal(result) {
    try {
        // Validate input
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid result object');
        }

        const fruit = result.fruit || result;
        const safeName = fruit.fruit_name || fruit.name || 'Unknown Fruit';
        const safeRarity = fruit.fruit_rarity || fruit.rarity || 'common';
        const safeType = fruit.fruit_type || fruit.type || 'Unknown';
        const safeDescription = fruit.fruit_description || fruit.description || 'A mysterious Devil Fruit power';

        // FIXED: Use the safe rarity formatter
        const rarityName = formatRarityName(safeRarity, 'singlePullReveal');

        const rarityEmoji = RARITY_EMOJIS[safeRarity] || '⚪';
        const isNew = result.isNew !== false;
        const statusEmoji = isNew ? '🆕' : '🔄';
        const statusText = isNew ? 'New Addition!' : `Total Owned: ${fruit.count || 1}`;

        // Get skill data with enhanced display
        const skillData = getSkillDisplay(fruit.id || fruit.fruit_id, safeRarity);
        const skillInfo = formatSkillForDisplay(skillData, false); // Show full details

        const embed = new EmbedBuilder()
            .setTitle(`🍈 Devil Fruit Summoned!`)
            .setColor(RARITY_COLORS[safeRarity] || RARITY_COLORS.common)
            .setDescription(`${rarityEmoji} **${safeName}** (${rarityName})`)
            .addFields(
                {
                    name: '📊 Fruit Information',
                    value: [
                        `${statusEmoji} **Status:** ${statusText}`,
                        `🔮 **Type:** ${safeType}`,
                        `⚡ **CP:** ${Math.floor(fruit.total_cp || fruit.base_cp || 100).toLocaleString()}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Combat Ability',
                    value: skillInfo.length > 900 ? skillInfo.substring(0, 897) + '...' : skillInfo,
                    inline: true
                },
                {
                    name: '📝 Description',
                    value: safeDescription.length > 1000 ? safeDescription.substring(0, 997) + '...' : safeDescription,
                    inline: false
                }
            )
            .setFooter({ text: '🏴‍☠️ Your journey on the Grand Line continues!' })
            .setTimestamp();

        return embed;

    } catch (error) {
        console.error('Single pull reveal creation failed:', error.message);
        
        // Return basic fallback
        return new EmbedBuilder()
            .setTitle('🍈 Devil Fruit Summoned!')
            .setColor(RARITY_COLORS.common)
            .setDescription('⚪ **Unknown Fruit** (Common)')
            .addFields({
                name: '📊 Result',
                value: '✅ Fruit added to your collection!',
                inline: false
            })
            .setFooter({ text: '🏴‍☠️ Keep summoning!' })
            .setTimestamp();
    }
}

// Export all functions
module.exports = {
    createEnhancedGachaReveal,
    createSummaryEmbed,
    createSinglePullReveal,
    getSkillDisplay,
    formatSkillForDisplay,
    generateFallbackSkill,
    safeCharAt,
    formatRarityName
};
