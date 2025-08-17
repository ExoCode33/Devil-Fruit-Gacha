// src/commands/slash/gacha/summon.js - UPDATED: Menu-Based Interface
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { PULL_COST, RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');
const { getFruitsByRarity, getRandomFruitByRarity } = require('../../../data/DevilFruits');

// FIXED: Import GachaRevealUtils with error handling
const {
    createEnhancedGachaReveal,
    createSinglePullReveal,
    getSkillDisplay,
    formatSkillForDisplay,
    createSummaryEmbed
} = require('../../../utils/GachaRevealUtils');

// Animation Configuration
const ANIMATION_CONFIG = {
    RAINBOW_FRAMES: 6,
    RAINBOW_DELAY: 1000,
    SPREAD_FRAMES: 12,
    SPREAD_DELAY: 500,
    REVEAL_FRAMES: 8,
    REVEAL_DELAY: 750,
    QUICK_FRAMES: 5,
    QUICK_DELAY: 500
};

const HUNT_DESCRIPTIONS = [
    "🌊 Searching the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes...",
    "🌟 Ancient mysteries awakening from the ocean's heart...",
    "⚔️ The sea itself trembles with anticipation..."
];

class SummonAnimator {
    static getRainbowPattern(frame, length = 20) {
        const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
        const pattern = [];
        
        for (let i = 0; i < length; i++) {
            const colorIndex = (i + frame) % colors.length;
            pattern.push(colors[colorIndex]);
        }
        
        return pattern.join(' ');
    }

    static getRainbowColor(frame) {
        const colors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0xFFFFFF];
        return colors[frame % colors.length];
    }

    static getRaritySquare(rarity) {
        const raritySquares = {
            'common': '⬜',
            'uncommon': '🟩',
            'rare': '🟦',
            'epic': '🟪',
            'mythical': '🟧',
            'legendary': '🟨',
            'divine': '🟥'
        };
        return raritySquares[rarity] || '⬜';
    }

    static createQuickFrame(frame, fruit, summonNumber, totalSummons, currentPity) {
        const pattern = this.getRainbowPattern(frame, 20);
        const color = this.getRainbowColor(frame);
        const loadingDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
        
        // FIXED: Add safety checks for fruit properties
        const safeFruit = {
            name: fruit?.name || 'Unknown Fruit',
            type: fruit?.type || 'Unknown',
            rarity: fruit?.rarity || 'common',
            multiplier: fruit?.multiplier || '1.0',
            description: fruit?.description || 'A mysterious Devil Fruit power',
            skillName: fruit?.skillName || 'Unknown Ability',
            skillDamage: fruit?.skillDamage || 50,
            skillCooldown: fruit?.skillCooldown || 2
        };
        
        const description = `🌊 Scanning the Grand Line...\n\n${pattern}\n\n` +
            `📊 **Status:** ${loadingDots}\n` +
            `🍃 **Name:** ${loadingDots}\n` +
            `🔮 **Type:** ${loadingDots}\n` +
            `⭐ **Rarity:** ${loadingDots}\n` +
            `💪 **CP Multiplier:** ${loadingDots}\n` +
            `🎯 **Description:** ${loadingDots}\n` +
            `⚔️ **Ability:** ${loadingDots}\n\n` +
            `🔥 **Total CP:** ${loadingDots}\n` +
            `💰 **Remaining Berries:** ${loadingDots}\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of ${totalSummons} - Searching... | Pity: ${currentPity}/1500` });
    }

    static createQuickReveal(fruit, result, summonNumber, totalSummons, currentPity) {
        // FIXED: Add comprehensive safety checks for all properties
        const safeFruit = {
            name: fruit?.name || 'Unknown Fruit',
            type: fruit?.type || 'Unknown',
            rarity: fruit?.rarity || 'common',
            multiplier: fruit?.multiplier || '1.0',
            description: fruit?.description || 'A mysterious Devil Fruit power',
            skillName: fruit?.skillName || 'Unknown Ability',
            skillDamage: fruit?.skillDamage || 50,
            skillCooldown: fruit?.skillCooldown || 2
        };

        const raritySquare = this.getRaritySquare(safeFruit.rarity);
        const color = RARITY_COLORS[safeFruit.rarity] || RARITY_COLORS.common;
        const pattern = Array(20).fill(raritySquare).join(' ');
        
        const duplicateCount = result?.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
        
        // FIXED: Get detailed skill information using GachaRevealUtils with error handling
        let skillInfo = `${safeFruit.skillName} (${safeFruit.skillDamage} DMG, ${safeFruit.skillCooldown}s CD)`;
        try {
            const skillData = getSkillDisplay(result?.fruit?.fruit_id || fruit?.id || 'unknown', safeFruit.rarity);
            if (skillData) {
                // Use enhanced formatting to show effects
                skillInfo = formatSkillForDisplay(skillData, true); // Compact mode for animation
            }
        } catch (error) {
            console.warn('Failed to get skill display, using fallback:', error.message);
        }
        
        const description = `✨ **ACQUIRED!**\n\n${pattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** ${safeFruit.name}\n` +
            `🔮 **Type:** ${safeFruit.type}\n` +
            `⭐ **Rarity:** ${raritySquare} ${safeFruit.rarity.charAt(0).toUpperCase() + safeFruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** x${safeFruit.multiplier}` +
            (result?.pityUsed ? ' 🎯 **PITY!**' : '') + `\n` +
            `🎯 **Description:** ${safeFruit.description}\n` +
            `⚔️ **Ability:** ${skillInfo}\n\n` +
            `🔥 **Total CP:** ${result?.fruit?.total_cp?.toLocaleString() || '250'} CP\n` +
            `💰 **Remaining Berries:** Loading...\n\n` +
            `${pattern}`;
        
        let footerText = `Summon ${summonNumber} of ${totalSummons} - ✨ Acquired! | Pity: ${currentPity}/1500`;
        if (result?.pityUsed) {
            footerText = `✨ PITY USED! | ${footerText}`;
        }
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: footerText });
    }

    // FIXED: Enhanced 10x summary with proper error handling
    static create10xSummary(fruits, results, balance, pityInfo, pityUsedInSession, batchNumber = 1, totalBatches = 1) {
        // FIXED: Enhanced error handling and data validation
        try {
            // Validate input data
            if (!fruits || !Array.isArray(fruits) || fruits.length === 0) {
                console.warn('Invalid fruits data for 10x summary, using fallback');
                return this.createOriginal10xSummary([], [], balance, pityInfo, pityUsedInSession, batchNumber, totalBatches);
            }

            // Convert fruits and results to the format expected by GachaRevealUtils with COMPREHENSIVE safety checks
            const enhancedResults = fruits.map((fruit, index) => {
                const result = results?.[index] || {};
                
                // FIXED: Ensure ALL required properties exist with safe defaults and proper mapping
                const safeFruit = {
                    id: fruit?.id || fruit?.fruit_id || `fruit_${index}`,
                    fruit_name: fruit?.name || fruit?.fruit_name || 'Unknown Fruit',
                    fruit_type: fruit?.type || fruit?.fruit_type || 'Unknown',
                    fruit_rarity: fruit?.rarity || fruit?.fruit_rarity || 'common',
                    base_cp: Math.floor((parseFloat(fruit?.multiplier) || 1) * 100),
                    fruit_description: fruit?.description || fruit?.fruit_description || fruit?.fruit_power || 'A mysterious Devil Fruit power',
                    total_cp: Math.floor((parseFloat(fruit?.multiplier) || 1) * 100),
                    count: result.duplicateCount || 1
                };
                
                return {
                    fruit: safeFruit,
                    isNew: (result.duplicateCount || 1) === 1,
                    pityUsed: result.pityUsed || false
                };
            });

            // Use enhanced reveal with comprehensive error handling
            const enhancedEmbed = createEnhancedGachaReveal(enhancedResults, batchNumber, totalBatches);
            
            // Add balance and pity information
            const pityDisplay = GachaService.formatPityDisplay(pityInfo, pityUsedInSession);
            const balanceText = batchNumber === totalBatches ? `\n💰 **Remaining Berries:** ${balance.toLocaleString()}\n` : '';
            
            const currentDescription = enhancedEmbed.data.description || '';
            enhancedEmbed.setDescription(currentDescription + balanceText + pityDisplay);
            
            // Determine highest rarity for color with comprehensive safety checks
            const rarityPriority = {
                'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4,
                'legendary': 5, 'mythical': 6, 'divine': 7
            };
            
            let highestRarity = 'common';
            let highestPriority = 0;
            
            fruits.forEach(fruit => {
                const rarity = fruit?.rarity || fruit?.fruit_rarity || 'common';
                const priority = rarityPriority[rarity] || 1;
                if (priority > highestPriority) {
                    highestPriority = priority;
                    highestRarity = rarity;
                }
            });

            const highestColor = highestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[highestRarity] || RARITY_COLORS.common;
            enhancedEmbed.setColor(highestColor);
            
            let footerText = totalBatches > 1 ? `Batch ${batchNumber} of ${totalBatches}` : '🏴‍☠️ Your legend grows on the Grand Line!';
            if (pityUsedInSession && batchNumber === totalBatches) {
                footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
            }
            enhancedEmbed.setFooter({ text: footerText });

            return { embed: enhancedEmbed, isDivine: highestRarity === 'divine' };
            
        } catch (error) {
            console.warn('Enhanced reveal failed, using fallback:', error.message);
            console.warn('Fruits data sample:', fruits?.slice(0, 2)?.map(f => ({ 
                id: f?.id, 
                name: f?.name, 
                rarity: f?.rarity, 
                type: f?.type,
                hasName: !!f?.name,
                hasRarity: !!f?.rarity,
                rarityType: typeof f?.rarity
            })));
            
            // Fallback to original implementation with error handling
            return this.createOriginal10xSummary(fruits || [], results || [], balance, pityInfo, pityUsedInSession, batchNumber, totalBatches);
        }
    }

    // FIXED: Enhanced mega summary with proper error handling
    static createMegaSummary(allFruits, allResults, balance, pityInfo, pityUsedInSession, totalPulls) {
        try {
            // Validate input data
            if (!allFruits || !Array.isArray(allFruits) || allFruits.length === 0) {
                console.warn('Invalid fruits data for mega summary, using fallback');
                return this.createOriginalMegaSummary([], [], balance, pityInfo, pityUsedInSession, totalPulls);
            }

            // Convert to format expected by GachaRevealUtils with COMPREHENSIVE safety checks
            const userStats = {
                berries: balance || 0,
                totalFruits: allFruits.length,
                uniqueFruits: new Set(allFruits.map(f => f?.name || f?.fruit_name || 'Unknown')).size
            };

            const enhancedResults = allFruits.map((fruit, index) => {
                const result = allResults?.[index] || {};
                
                // FIXED: Ensure ALL required properties exist with safe defaults and proper mapping
                const safeFruit = {
                    id: fruit?.id || fruit?.fruit_id || `fruit_${index}`,
                    fruit_name: fruit?.name || fruit?.fruit_name || 'Unknown Fruit',
                    fruit_type: fruit?.type || fruit?.fruit_type || 'Unknown',
                    fruit_rarity: fruit?.rarity || fruit?.fruit_rarity || 'common',
                    base_cp: Math.floor((parseFloat(fruit?.multiplier) || 1) * 100),
                    fruit_description: fruit?.description || fruit?.fruit_description || fruit?.fruit_power || 'A mysterious Devil Fruit power',
                    total_cp: Math.floor((parseFloat(fruit?.multiplier) || 1) * 100),
                    count: result.duplicateCount || 1
                };
                
                return {
                    fruit: safeFruit,
                    isNew: (result.duplicateCount || 1) === 1,
                    pityUsed: result.pityUsed || false
                };
            });

            const summaryEmbed = createSummaryEmbed(enhancedResults, userStats);
            
            // Add pity information
            const pityDisplay = GachaService.formatPityDisplay(pityInfo, pityUsedInSession);
            const currentDescription = summaryEmbed.data.description || '';
            summaryEmbed.setDescription(currentDescription + '\n\n' + pityDisplay);
            
            // Update title for mega summon
            summaryEmbed.setTitle(`🏆 ${totalPulls}x MEGA SUMMONING RESULTS!`);

            const bestRarity = allFruits.length > 0 ? 
                allFruits.reduce((best, fruit) => {
                    const rarityPriority = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythical': 6, 'divine': 7 };
                    const currentRarity = fruit?.rarity || fruit?.fruit_rarity || 'common';
                    const bestRarity = best || 'common';
                    return (rarityPriority[currentRarity] || 1) > (rarityPriority[bestRarity] || 1) ? currentRarity : bestRarity;
                }, 'common') : 'legendary';
            
            const color = bestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[bestRarity] || RARITY_COLORS.common;
            summaryEmbed.setColor(color);

            let footerText = '🏴‍☠️ Your legend grows on the Grand Line!';
            if (pityUsedInSession) {
                footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
            }
            summaryEmbed.setFooter({ text: footerText });

            return { embed: summaryEmbed, isDivine: bestRarity === 'divine' };
            
        } catch (error) {
            console.warn('Enhanced mega summary failed, using fallback:', error.message);
            console.warn('Fruits data sample:', allFruits?.slice(0, 3)?.map(f => ({ 
                id: f?.id, 
                name: f?.name, 
                rarity: f?.rarity, 
                type: f?.type,
                hasName: !!f?.name,
                hasRarity: !!f?.rarity 
            })));
            
            // Fallback to original implementation
            return this.createOriginalMegaSummary(allFruits || [], allResults || [], balance, pityInfo, pityUsedInSession, totalPulls);
        }
    }

    // Original implementation as fallback
    static createOriginal10xSummary(fruits, results, balance, pityInfo, pityUsedInSession, batchNumber = 1, totalBatches = 1) {
        let detailedResults = '';
        
        if (fruits && fruits.length > 0) {
            fruits.forEach((fruit, index) => {
                const result = results?.[index] || {};
                const safeFruit = {
                    name: fruit?.name || 'Unknown Fruit',
                    rarity: fruit?.rarity || 'common',
                    type: fruit?.type || 'Unknown',
                    multiplier: fruit?.multiplier || '1.0',
                    description: fruit?.description || 'A mysterious Devil Fruit power',
                    skillName: fruit?.skillName || 'Unknown Ability',
                    skillDamage: fruit?.skillDamage || 50,
                    skillCooldown: fruit?.skillCooldown || 2
                };
                
                const raritySquare = this.getRaritySquare(safeFruit.rarity);
                const globalNumber = ((batchNumber - 1) * 10 + index + 1).toString().padStart(2, '0');
                
                const duplicateCount = result.duplicateCount || 1;
                const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
                const pityIndicator = result.pityUsed ? ' 🎯' : '';
                
                detailedResults += `**${globalNumber}.** ${raritySquare} **${safeFruit.name}**${pityIndicator} (${safeFruit.rarity.charAt(0).toUpperCase() + safeFruit.rarity.slice(1)})\n`;
                detailedResults += `      📊 **Status:** ${duplicateText}\n`;
                detailedResults += `      🔮 **Type:** ${safeFruit.type}\n`;
                detailedResults += `      💪 **CP Multiplier:** x${safeFruit.multiplier}\n`;
                detailedResults += `      🎯 **Description:** ${safeFruit.description}\n`;
                detailedResults += `      ⚔️ **Ability:** ${safeFruit.skillName} (${safeFruit.skillDamage} DMG, ${safeFruit.skillCooldown}s CD)\n\n`;
            });
        }

        const rarityPriority = {
            'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4,
            'legendary': 5, 'mythical': 6, 'divine': 7
        };
        
        let highestRarity = 'common';
        let highestPriority = 0;
        
        if (fruits && fruits.length > 0) {
            fruits.forEach(fruit => {
                const rarity = fruit?.rarity || 'common';
                const priority = rarityPriority[rarity] || 0;
                if (priority > highestPriority) {
                    highestPriority = priority;
                    highestRarity = rarity;
                }
            });
        }

        const highestColor = highestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[highestRarity] || RARITY_COLORS.common;

        let title = '🍈 10x Devil Fruit Summoning Complete!';
        if (totalBatches > 1) {
            title = `🍈 Devil Fruit Batch ${batchNumber}/${totalBatches} Complete!`;
        }

        const pityDisplay = batchNumber === totalBatches ? GachaService.formatPityDisplay(pityInfo, pityUsedInSession) : '';
        const balanceText = batchNumber === totalBatches ? `💰 **Remaining Berries:** ${balance?.toLocaleString() || 0}\n\n` : '';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🎉 **Batch ${batchNumber} Results:** 🎉\n\n${detailedResults}${balanceText}${pityDisplay}${batchNumber === totalBatches ? '\n\n✨ All fruits have been added to your collection!' : ''}`)
            .setColor(highestColor)
            .setTimestamp();

        let footerText = totalBatches > 1 ? `Batch ${batchNumber} of ${totalBatches}` : '🏴‍☠️ Your legend grows on the Grand Line!';
        if (pityUsedInSession && batchNumber === totalBatches) {
            footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
        }
        embed.setFooter({ text: footerText });

        return { embed, isDivine: highestRarity === 'divine' };
    }

    // Original mega summary as fallback
    static createOriginalMegaSummary(allFruits, allResults, balance, pityInfo, pityUsedInSession, totalPulls) {
        // Count rarities with safety checks
        const rarityCounts = {};
        const pityUsedCount = allResults?.filter(r => r?.pityUsed)?.length || 0;
        
        if (allFruits && allFruits.length > 0) {
            allFruits.forEach(fruit => {
                const rarity = fruit?.rarity || 'common';
                rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
            });
        }

        // Find best fruits with safety checks
        const rarityPriority = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythical': 6, 'divine': 7 };
        const bestFruits = (allFruits || [])
            .filter(fruit => rarityPriority[fruit?.rarity || 'common'] >= 5) // Legendary+
            .sort((a, b) => rarityPriority[b?.rarity || 'common'] - rarityPriority[a?.rarity || 'common'])
            .slice(0, 10);

        let summaryText = `🎉 **${totalPulls}x MEGA SUMMONING COMPLETE!** 🎉\n\n`;
        
        // Rarity breakdown
        summaryText += `📊 **Rarity Breakdown:**\n`;
        ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'].forEach(rarity => {
            if (rarityCounts[rarity]) {
                const emoji = this.getRaritySquare(rarity);
                summaryText += `${emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: **${rarityCounts[rarity]}**\n`;
            }
        });

        if (bestFruits.length > 0) {
            summaryText += `\n🌟 **Best Pulls:**\n`;
            bestFruits.forEach((fruit, index) => {
                const emoji = this.getRaritySquare(fruit?.rarity || 'common');
                summaryText += `${emoji} **${fruit?.name || 'Unknown Fruit'}** (${fruit?.rarity || 'common'})\n`;
            });
        }

        if (pityUsedCount > 0) {
            summaryText += `\n🎯 **Pity Activations:** ${pityUsedCount} times\n`;
        }

        summaryText += `\n💰 **Remaining Berries:** ${balance?.toLocaleString() || 0}\n\n`;
        summaryText += GachaService.formatPityDisplay(pityInfo, pityUsedInSession);

        const bestRarity = bestFruits.length > 0 ? (bestFruits[0]?.rarity || 'legendary') : 'legendary';
        const color = bestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[bestRarity] || RARITY_COLORS.common;

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${totalPulls}x MEGA SUMMONING RESULTS!`)
            .setDescription(summaryText)
            .setColor(color)
            .setTimestamp();

        let footerText = '🏴‍☠️ Your legend grows on the Grand Line!';
        if (pityUsedInSession) {
            footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
        }
        embed.setFooter({ text: footerText });

        return { embed, isDivine: bestRarity === 'divine' };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summon')
        .setDescription('🍈 Summon Devil Fruits! Opens a menu to choose amount and animation options.'),
    
    category: 'gacha',
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            // Get user's current balance and pity info
            const balance = await EconomyService.getBalance(userId);
            const pityInfo = await GachaService.getPityInfo(userId);
            
            // Create the main summon menu
            const menuEmbed = await this.createSummonMenu(balance, pityInfo);
            const menuComponents = await this.createSummonComponents(userId);
            
            await interaction.reply({ 
                embeds: [menuEmbed], 
                components: menuComponents 
            });
            
            // Setup collector for menu interactions
            await this.setupMenuCollector(interaction);
            
        } catch (error) {
            interaction.client.logger.error('Summon command error:', error);
            
            const errorMessage = {
                content: '❌ An error occurred while opening the summon menu.',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    /**
     * Create the main summon menu embed
     */
    async createSummonMenu(balance, pityInfo) {
        const pityDisplay = GachaService.formatPityDisplay(pityInfo);
        
        // Calculate costs
        const costs = {
            single: PULL_COST,
            ten: PULL_COST * 10,
            hundred: PULL_COST * 100
        };
        
        // Check affordability
        const canAfford = {
            single: balance >= costs.single,
            ten: balance >= costs.ten,
            hundred: balance >= costs.hundred
        };
        
        const embed = new EmbedBuilder()
            .setTitle('🍈 Devil Fruit Summoning Menu')
            .setColor(RARITY_COLORS.legendary)
            .setDescription('Choose how many Devil Fruits you want to summon!')
            .addFields(
                {
                    name: '💰 Your Balance',
                    value: `**${balance.toLocaleString()} Berries** 🍓`,
                    inline: true
                },
                {
                    name: '🎯 Pity Status',
                    value: `${pityInfo.current}/${pityInfo.hardPity} pulls\n${pityInfo.pityActive ? '🔥 Pity Active!' : '💤 Pity Inactive'}`,
                    inline: true
                },
                {
                    name: '🍈 Summon Options',
                    value: [
                        `**1x Pull** - ${costs.single.toLocaleString()} 🍓 ${canAfford.single ? '✅' : '❌'}`,
                        `**10x Multi** - ${costs.ten.toLocaleString()} 🍓 ${canAfford.ten ? '✅' : '❌'}`,
                        `**100x Mega** - ${costs.hundred.toLocaleString()} 🍓 ${canAfford.hundred ? '✅' : '❌'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎬 Animation Options',
                    value: '• **Full Animation** - Complete cinematic experience\n• **Skip Animation** - Quick results only',
                    inline: false
                }
            )
            .setFooter({ text: 'Use the buttons below to make your choice!' })
            .setTimestamp();
        
        return embed;
    },

    /**
     * Create the summon menu components
     */
    async createSummonComponents(userId) {
        const balance = await EconomyService.getBalance(userId);
        
        // Calculate costs
        const costs = {
            single: PULL_COST,
            ten: PULL_COST * 10,
            hundred: PULL_COST * 100
        };
        
        // Check affordability
        const canAfford = {
            single: balance >= costs.single,
            ten: balance >= costs.ten,
            hundred: balance >= costs.hundred
        };
        
        // Amount selection dropdown
        const amountOptions = [];
        
        if (canAfford.single) {
            amountOptions.push({
                label: '1x Single Pull',
                description: `${costs.single.toLocaleString()} Berries - Quick single summon`,
                value: '1',
                emoji: '🍈'
            });
        }
        
        if (canAfford.ten) {
            amountOptions.push({
                label: '10x Multi Pull',
                description: `${costs.ten.toLocaleString()} Berries - Multi summon experience`,
                value: '10',
                emoji: '📦'
            });
        }
        
        if (canAfford.hundred) {
            amountOptions.push({
                label: '100x Mega Pull',
                description: `${costs.hundred.toLocaleString()} Berries - Ultimate summon session`,
                value: '100',
                emoji: '🎁'
            });
        }
        
        const components = [];
        
        // Only show dropdown if user can afford at least one option
        if (amountOptions.length > 0) {
            const amountSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`summon_amount_${userId}`)
                .setPlaceholder('🍈 Choose summon amount...')
                .addOptions(amountOptions);
            
            components.push(new ActionRowBuilder().addComponents(amountSelectMenu));
            
            // Animation toggle dropdown
            const animationSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`summon_animation_${userId}`)
                .setPlaceholder('🎬 Choose animation preference...')
                .addOptions([
                    {
                        label: 'Full Animation',
                        description: 'Complete cinematic summoning experience',
                        value: 'full',
                        emoji: '🎬'
                    },
                    {
                        label: 'Skip Animation',
                        description: 'Show results immediately',
                        value: 'skip',
                        emoji: '⚡'
                    }
                ]);
            
            components.push(new ActionRowBuilder().addComponents(animationSelectMenu));
            
            // Summon button (initially disabled)
            const summonButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`summon_execute_${userId}`)
                        .setLabel('🚀 Start Summoning!')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true), // Disabled until selections are made
                    new ButtonBuilder()
                        .setCustomId(`summon_cancel_${userId}`)
                        .setLabel('❌ Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            components.push(summonButton);
        } else {
            // User can't afford any summons
            const insufficientButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`summon_insufficient_${userId}`)
                        .setLabel('💸 Insufficient Berries')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`income_check_${userId}`)
                        .setLabel('💰 Check Income')
                        .setStyle(ButtonStyle.Success)
                );
            
            components.push(insufficientButton);
        }
        
        return components;
    },

    /**
     * Setup menu collector for interactions
     */
    async setupMenuCollector(interaction) {
        const message = await interaction.fetchReply();
        const userId = interaction.user.id;
        
        // Store user's selections
        const userSelections = new Map();
        
        const collector = message.createMessageComponentCollector({ 
            time: 300000, // 5 minutes
            filter: (i) => i.user.id === userId
        });
        
        collector.on('collect', async (i) => {
            try {
                if (i.customId.startsWith('summon_amount_')) {
                    await this.handleAmountSelection(i, userSelections);
                } else if (i.customId.startsWith('summon_animation_')) {
                    await this.handleAnimationSelection(i, userSelections);
                } else if (i.customId.startsWith('summon_execute_')) {
                    await this.handleSummonExecution(i, userSelections);
                    collector.stop();
                } else if (i.customId.startsWith('summon_cancel_')) {
                    await this.handleSummonCancel(i);
                    collector.stop();
                } else if (i.customId.startsWith('income_check_')) {
                    await this.handleIncomeCheck(i);
                }
            } catch (error) {
                console.error('Menu collector error:', error);
                await i.reply({
                    content: '❌ An error occurred processing your selection.',
                    ephemeral: true
                });
            }
        });
        
        collector.on('end', async () => {
            try {
                // Disable all components when collector expires
                const disabledComponents = await this.createDisabledComponents(userId);
                await interaction.editReply({ 
                    components: disabledComponents 
                }).catch(() => {});
            } catch (error) {
                // Ignore errors when disabling components
            }
        });
    },

    /**
     * Handle amount selection
     */
    async handleAmountSelection(interaction, userSelections) {
        const selectedAmount = parseInt(interaction.values[0]);
        userSelections.set(interaction.user.id, {
            ...userSelections.get(interaction.user.id) || {},
            amount: selectedAmount
        });
        
        const cost = PULL_COST * selectedAmount;
        
        await interaction.update({
            embeds: [await this.createUpdatedEmbed(interaction, userSelections, `Selected: ${selectedAmount}x summon (${cost.toLocaleString()} Berries)`)],
            components: await this.createUpdatedComponents(interaction.user.id, userSelections)
        });
    },

    /**
     * Handle animation selection
     */
    async handleAnimationSelection(interaction, userSelections) {
        const selectedAnimation = interaction.values[0];
        userSelections.set(interaction.user.id, {
            ...userSelections.get(interaction.user.id) || {},
            animation: selectedAnimation
        });
        
        const animationText = selectedAnimation === 'full' ? 'Full Animation' : 'Skip Animation';
        
        await interaction.update({
            embeds: [await this.createUpdatedEmbed(interaction, userSelections, `Animation: ${animationText}`)],
            components: await this.createUpdatedComponents(interaction.user.id, userSelections)
        });
    },

    /**
     * Handle summon execution
     */
    async handleSummonExecution(interaction, userSelections) {
        const userId = interaction.user.id;
        const selections = userSelections.get(userId);
        
        if (!selections || !selections.amount || !selections.animation) {
            await interaction.reply({
                content: '❌ Please make both amount and animation selections first!',
                ephemeral: true
            });
            return;
        }
        
        const amount = selections.amount;
        const skipAnimation = selections.animation === 'skip';
        const cost = PULL_COST * amount;
        
        // Final balance check
        const balance = await EconomyService.getBalance(userId);
        if (balance < cost) {
            await interaction.update({
                content: '❌ Insufficient berries! Your balance may have changed.',
                embeds: [],
                components: []
            });
            return;
        }
        
        // Deduct berries and start summoning
        await EconomyService.deductBerries(userId, cost, 'gacha_summon');
        const newBalance = balance - cost;
        
        // Defer the update for longer operation
        await interaction.deferUpdate();
        
        // Execute the appropriate summon type
        if (amount === 1) {
            await this.runSingleSummon(interaction, newBalance, skipAnimation);
        } else if (amount === 10) {
            await this.run10xSummon(interaction, newBalance, skipAnimation);
        } else if (amount === 100) {
            await this.run100xSummon(interaction, newBalance, skipAnimation);
        }
    },

    /**
     * Handle summon cancel
     */
    async handleSummonCancel(interaction) {
        const cancelEmbed = new EmbedBuilder()
            .setColor(RARITY_COLORS.common)
            .setTitle('❌ Summoning Cancelled')
            .setDescription('Maybe next time, brave pirate! 🏴‍☠️')
            .setFooter({ text: 'Use /summon again when you\'re ready!' })
            .setTimestamp();
        
        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    },

    /**
     * Handle income check
     */
    async handleIncomeCheck(interaction) {
        const incomeEmbed = new EmbedBuilder()
            .setColor(RARITY_COLORS.uncommon)
            .setTitle('💰 Need More Berries?')
            .setDescription('Here are ways to earn berries:')
            .addFields(
                {
                    name: '⚡ Quick Income',
                    value: '• Use `/income` to collect manual income with bonus multiplier\n• Use `/balance` to see accumulated automatic income',
                    inline: false
                },
                {
                    name: '🍈 Income Requirements',
                    value: '• You need Devil Fruits to earn income\n• 5+ Devil Fruits = Maximum income rate (6,250 berries/hour)\n• Less than 5 fruits = Proportional income',
                    inline: false
                },
                {
                    name: '🚀 Getting Started',
                    value: '• New users start with 5,000 berries\n• Use those berries to get your first Devil Fruits\n• Then you can start earning regular income!',
                    inline: false
                }
            )
            .setFooter({ text: 'Close this menu and try /income or /balance!' });
        
        await interaction.reply({
            embeds: [incomeEmbed],
            ephemeral: true
        });
    },

    /**
     * Create updated embed with selections
     */
    async createUpdatedEmbed(interaction, userSelections, statusText) {
        const userId = interaction.user.id;
        const balance = await EconomyService.getBalance(userId);
        const pityInfo = await GachaService.getPityInfo(userId);
        const selections = userSelections.get(userId) || {};
        
        const embed = new EmbedBuilder()
            .setTitle('🍈 Devil Fruit Summoning Menu')
            .setColor(RARITY_COLORS.legendary)
            .setDescription('Choose how many Devil Fruits you want to summon!')
            .addFields(
                {
                    name: '💰 Your Balance',
                    value: `**${balance.toLocaleString()} Berries** 🍓`,
                    inline: true
                },
                {
                    name: '🎯 Pity Status',
                    value: `${pityInfo.current}/${pityInfo.hardPity} pulls\n${pityInfo.pityActive ? '🔥 Pity Active!' : '💤 Pity Inactive'}`,
                    inline: true
                },
                {
                    name: '✨ Current Selection',
                    value: statusText,
                    inline: false
                }
            );
        
        // Show selected options
        if (selections.amount) {
            const cost = PULL_COST * selections.amount;
            embed.addFields({
                name: '🍈 Selected Amount',
                value: `**${selections.amount}x Pull** - ${cost.toLocaleString()} 🍓`,
                inline: true
            });
        }
        
        if (selections.animation) {
            const animationText = selections.animation === 'full' ? 'Full Animation 🎬' : 'Skip Animation ⚡';
            embed.addFields({
                name: '🎬 Animation Mode',
                value: animationText,
                inline: true
            });
        }
        
        embed.setFooter({ text: 'Complete both selections to start summoning!' })
             .setTimestamp();
        
        return embed;
    },

    /**
     * Create updated components based on selections
     */
    async createUpdatedComponents(userId, userSelections) {
        const balance = await EconomyService.getBalance(userId);
        const selections = userSelections.get(userId) || {};
        
        // Calculate costs and affordability
        const costs = {
            single: PULL_COST,
            ten: PULL_COST * 10,
            hundred: PULL_COST * 100
        };
        
        const canAfford = {
            single: balance >= costs.single,
            ten: balance >= costs.ten,
            hundred: balance >= costs.hundred
        };
        
        const components = [];
        
        // Amount selection dropdown
        const amountOptions = [];
        
        if (canAfford.single) {
            amountOptions.push({
                label: '1x Single Pull',
                description: `${costs.single.toLocaleString()} Berries - Quick single summon`,
                value: '1',
                emoji: '🍈',
                default: selections.amount === 1
            });
        }
        
        if (canAfford.ten) {
            amountOptions.push({
                label: '10x Multi Pull',
                description: `${costs.ten.toLocaleString()} Berries - Multi summon experience`,
                value: '10',
                emoji: '📦',
                default: selections.amount === 10
            });
        }
        
        if (canAfford.hundred) {
            amountOptions.push({
                label: '100x Mega Pull',
                description: `${costs.hundred.toLocaleString()} Berries - Ultimate summon session`,
                value: '100',
                emoji: '🎁',
                default: selections.amount === 100
            });
        }
        
        if (amountOptions.length > 0) {
            const amountSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`summon_amount_${userId}`)
                .setPlaceholder(selections.amount ? `Selected: ${selections.amount}x` : '🍈 Choose summon amount...')
                .addOptions(amountOptions);
            
            components.push(new ActionRowBuilder().addComponents(amountSelectMenu));
        }
        
        // Animation selection dropdown
        const animationSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`summon_animation_${userId}`)
            .setPlaceholder(selections.animation ? 
                `Selected: ${selections.animation === 'full' ? 'Full Animation' : 'Skip Animation'}` : 
                '🎬 Choose animation preference...')
            .addOptions([
                {
                    label: 'Full Animation',
                    description: 'Complete cinematic summoning experience',
                    value: 'full',
                    emoji: '🎬',
                    default: selections.animation === 'full'
                },
                {
                    label: 'Skip Animation',
                    description: 'Show results immediately',
                    value: 'skip',
                    emoji: '⚡',
                    default: selections.animation === 'skip'
                }
            ]);
        
        components.push(new ActionRowBuilder().addComponents(animationSelectMenu));
        
        // Action buttons
        const bothSelected = selections.amount && selections.animation;
        const summonButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`summon_execute_${userId}`)
                    .setLabel(bothSelected ? '🚀 Start Summoning!' : '⏳ Make Selections First')
                    .setStyle(bothSelected ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(!bothSelected),
                new ButtonBuilder()
                    .setCustomId(`summon_cancel_${userId}`)
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        components.push(summonButton);
        
        return components;
    },

    /**
     * Create disabled components for timeout
     */
    async createDisabledComponents(userId) {
        const disabledSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`summon_amount_disabled_${userId}`)
            .setPlaceholder('⏰ Menu expired - use /summon again')
            .addOptions([
                {
                    label: 'Expired',
                    description: 'This menu has expired',
                    value: 'expired'
                }
            ])
            .setDisabled(true);
        
        const disabledButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`summon_expired_${userId}`)
                    .setLabel('⏰ Menu Expired')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        return [
            new ActionRowBuilder().addComponents(disabledSelectMenu),
            disabledButton
        ];
    },

    /**
     * Run single summon
     */
    async runSingleSummon(interaction, newBalance, skipAnimation = false) {
        try {
            const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
            
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === fruit.fruit_name || f.id === fruit.fruit_id
            );
            
            // Get detailed skill information
            let skillData = null;
            try {
                skillData = getSkillDisplay(fruit.fruit_id, fruit.fruit_rarity);
            } catch (error) {
                console.warn('Failed to get skill display for fruit:', fruit.fruit_id, error.message);
            }
            
            const displayFruit = {
                id: fruit.fruit_id || fruit.id || 'fruit_1',
                name: fruit.fruit_name || fruit.name || 'Unknown Fruit',
                type: fruit.fruit_type || fruit.type || 'Unknown',
                rarity: fruit.fruit_rarity || fruit.rarity || 'common',
                multiplier: ((parseFloat(fruit.base_cp) || 100) / 100).toFixed(1),
                description: fruit.fruit_description || fruit.description || fruit.fruit_power || 'A mysterious Devil Fruit power',
                skillName: skillData?.name || actualFruit?.skill?.name || 'Unknown Ability',
                skillDamage: skillData?.damage || actualFruit?.skill?.damage || 50,
                skillCooldown: skillData?.cooldown || actualFruit?.skill?.cooldown || 2
            };
            
            if (!skipAnimation) {
                // Run single fruit animation
                await this.runSingleAnimationWithRarityStop(interaction, displayFruit, result, 1, 1);
            }
            
            // Get final pity info
            const pityInfo = await GachaService.getPityInfo(interaction.user.id);
            
            // Show single result
            const resultEmbed = createSinglePullReveal({
                fruit: displayFruit,
                isNew: result.duplicateCount === 1,
                pityUsed: result.pityUsed
            });
            
            // Add balance and pity info
            resultEmbed.addFields(
                {
                    name: '💰 Remaining Balance',
                    value: `${newBalance.toLocaleString()} Berries`,
                    inline: true
                },
                {
                    name: '🎯 Pity Status',
                    value: `${pityInfo.current}/${pityInfo.hardPity}`,
                    inline: true
                }
            );
            
            if (result.pityUsed) {
                resultEmbed.setFooter({ text: '✨ PITY WAS USED! | Your legend grows stronger!' });
            }
            
            await interaction.editReply({ 
                embeds: [resultEmbed], 
                components: [] 
            });
            
        } catch (error) {
            console.error('Single summon error:', error);
            await interaction.editReply({
                content: '❌ An error occurred during your summon.',
                embeds: [],
                components: []
            });
        }
    },

    /**
     * Run single fruit animation with rarity stop
     */
    async runSingleAnimationWithRarityStop(interaction, fruit, result, summonNumber, totalSummons) {
        const currentPity = await GachaService.getPityCount(interaction.user.id);
        
        // First, run the scanning animation with changing rainbow
        for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
            const embed = SummonAnimator.createQuickFrame(frame, fruit, summonNumber, totalSummons, currentPity);
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Show final reveal
        const revealEmbed = SummonAnimator.createQuickReveal(fruit, result, summonNumber, totalSummons, currentPity);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    },

    async run10xSummon(interaction, newBalance, skipAnimation = false) {
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        // Get all fruits data BEFORE performing pulls to track pity changes
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform pulls one by one to track pity in real-time
        const allResults = [];
        const allDisplayFruits = [];
        
        for (let i = 0; i < 10; i++) {
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            allResults.push(result);
            
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === fruit.name || f.id === fruit.id
            );
            
            // FIXED: Get detailed skill information with COMPREHENSIVE safety checks
            let skillData = null;
            try {
                skillData = getSkillDisplay(fruit.id, fruit.rarity);
            } catch (error) {
                console.warn('Failed to get skill display for fruit:', fruit.id, error.message);
            }
            
            const displayFruit = {
                id: fruit.id || fruit.fruit_id || `fruit_${i}`,
                name: fruit.name || fruit.fruit_name || 'Unknown Fruit',
                type: fruit.type || fruit.fruit_type || 'Unknown',
                rarity: fruit.rarity || fruit.fruit_rarity || 'common',
                multiplier: ((parseFloat(fruit.multiplier) || parseFloat(fruit.base_cp) / 100 || 1)).toFixed(1),
                description: fruit.description || fruit.fruit_description || fruit.power || 'A mysterious Devil Fruit power',
                skillName: skillData?.name || actualFruit?.skill?.name || 'Unknown Ability',
                skillDamage: skillData?.damage || actualFruit?.skill?.damage || 50,
                skillCooldown: skillData?.cooldown || actualFruit?.skill?.cooldown || 2
            };
            
            allDisplayFruits.push(displayFruit);
            
            // Check skip animation setting
            if (skipAnimation) {
                // Use simple rainbow animation (like 50x/100x skip) - CONSTANTLY UPDATE
                await this.showSimpleLoadingAnimation(interaction, i + 1, 10);
                await new Promise(resolve => setTimeout(resolve, 100)); // Short delay for constant updates
            } else {
                // Use full individual fruit animation with rarity-stopped rainbow
                await this.runQuickAnimationWithRarityStop(interaction, displayFruit, result, i + 1, 10, currentPity);
                if (i < 9) await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // Show summary
        await this.show10xSummary(interaction, allDisplayFruits, allResults, newBalance, pityInfo, pityUsedInSession);
        await this.setupButtons(interaction);
    },

    async run100xSummon(interaction, newBalance, skipAnimation = false) {
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform ALL 100 pulls one by one
        const allResults = [];
        const allDisplayFruits = [];
        
        for (let i = 0; i < 100; i++) {
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            allResults.push(result);
            
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === fruit.fruit_name || f.id === fruit.fruit_id
            );
            
            // FIXED: Get detailed skill information with COMPREHENSIVE safety checks
            let skillData = null;
            try {
                skillData = getSkillDisplay(fruit.fruit_id, fruit.fruit_rarity);
            } catch (error) {
                console.warn('Failed to get skill display for fruit:', fruit.fruit_id, error.message);
            }
            
            const displayFruit = {
                id: fruit.fruit_id || fruit.id || `fruit_${i}`,
                name: fruit.fruit_name || fruit.name || 'Unknown Fruit',
                type: fruit.fruit_type || fruit.type || 'Unknown',
                rarity: fruit.fruit_rarity || fruit.rarity || 'common', // CRITICAL: Always fallback to 'common'
                multiplier: ((parseFloat(fruit.base_cp) || 100) / 100).toFixed(1),
                description: fruit.fruit_description || fruit.description || fruit.fruit_power || 'A mysterious Devil Fruit power',
                skillName: skillData?.name || actualFruit?.skill?.name || 'Unknown Ability',
                skillDamage: skillData?.damage || actualFruit?.skill?.damage || 50,
                skillCooldown: skillData?.cooldown || actualFruit?.skill?.cooldown || 2
            };
            
            allDisplayFruits.push(displayFruit);
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
            
            // Show animation based on skip_animation setting
            if (skipAnimation) {
                // Use simple rainbow animation - CONSTANTLY UPDATE
                await this.showSimpleLoadingAnimation(interaction, i + 1, 100);
                await new Promise(resolve => setTimeout(resolve, 30)); // Constant updates
            } else {
                // Use full individual fruit animation with rarity-stopped rainbow
                await this.runQuickAnimationWithRarityStop(interaction, displayFruit, result, i + 1, 100, currentPity);
                if (i < 99) await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Adjust delay based on animation preference
            const delay = skipAnimation ? 15 : 120;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // GLOBAL SORT: Sort ALL fruits by rarity first, then distribute to batches
        const allPairs = allDisplayFruits.map((fruit, index) => ({
            fruit,
            result: allResults[index],
            originalIndex: index
        }));
        
        // Sort all fruits globally by rarity (highest first)
        const rarityPriority = {
            'divine': 7, 'mythical': 6, 'legendary': 5, 'epic': 4,
            'rare': 3, 'uncommon': 2, 'common': 1
        };
        
        allPairs.sort((a, b) => {
            const rarityA = rarityPriority[a.fruit.rarity] || 0;
            const rarityB = rarityPriority[b.fruit.rarity] || 0;
            
            if (rarityA !== rarityB) {
                return rarityB - rarityA; // Higher rarity first
            }
            
            return a.fruit.name.localeCompare(b.fruit.name); // Then alphabetical
        });
        
        // Now create sorted arrays
        const sortedFruits = allPairs.map(pair => pair.fruit);
        const sortedResults = allPairs.map(pair => pair.result);
        
        // Create all batch embeds with globally sorted fruits  
        const batchEmbeds = [];
        for (let batch = 0; batch < 10; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = sortedFruits.slice(startIdx, endIdx);
            const batchResults = sortedResults.slice(startIdx, endIdx);
            
            const summaryData = SummonAnimator.create10xSummary(batchFruits, batchResults, newBalance, pityInfo, pityUsedInSession, batch + 1, 10);
            batchEmbeds.push(summaryData.embed);
        }
        
        // Create mega summary with sorted fruits
        const megaSummaryData = SummonAnimator.createMegaSummary(sortedFruits, sortedResults, newBalance, pityInfo, pityUsedInSession, 100);
        
        // Show first batch with navigation
        await this.showBatchNavigation(interaction, batchEmbeds, megaSummaryData.embed, 0);
    },

    async showSimpleLoadingAnimation(interaction, currentPulls, totalPulls) {
        const progressPercent = Math.floor((currentPulls / totalPulls) * 100);
        const currentPity = await GachaService.getPityCount(interaction.user.id);
        
        // Create constantly changing rainbow pattern
        const frame = Math.floor(Date.now() / 300) % 7; // Faster changing every 300ms
        const colors = ['🟧', '🟨', '🟩', '🟦', '🟪', '⬜', '🟥'];
        const pattern = [];
        
        for (let i = 0; i < 20; i++) {
            const colorIndex = (i + frame) % colors.length;
            pattern.push(colors[colorIndex]);
        }
        
        // Join with spaces for proper spacing
        const rainbowPattern = pattern.join(' ');
        
        // Get the leftmost square color for embed color
        const leftmostColorEmoji = colors[frame % colors.length];
        const embedColors = {
            '🟧': 0xFF8000, // Orange
            '🟨': 0xFFFF00, // Yellow
            '🟩': 0x00FF00, // Green
            '🟦': 0x0080FF, // Blue
            '🟪': 0x800080, // Purple
            '⬜': 0xFFFFFF, // White
            '🟥': 0xFF0000  // Red
        };
        const embedColor = embedColors[leftmostColorEmoji] || 0x4A90E2;
        
        const embed = new EmbedBuilder()
            .setTitle(`🍈 ${totalPulls}x Mega Summoning in Progress...`)
            .setDescription(
                `🌊 **Scanning the Grand Line for Devil Fruits...**\n\n` +
                `${rainbowPattern}\n\n` +
                `📊 **Progress:** ${currentPulls}/${totalPulls} (${progressPercent}%)\n` +
                `🎯 **Current Pity:** ${currentPity}/1500\n` +
                `⚡ **Status:** Searching for legendary powers...\n\n` +
                `${rainbowPattern}`
            )
            .setColor(embedColor)
            .setFooter({ text: `Processing... ${currentPulls}/${totalPulls} completed | Pity: ${currentPity}/1500` })
            .setTimestamp();
        
        try {
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            // Ignore rate limit errors during animation
            if (error.code !== 10062 && error.code !== 50013) {
                console.log('Simple loading update error:', error.message);
            }
        }
    },

    async runQuickAnimationWithRarityStop(interaction, fruit, result, summonNumber, totalSummons, currentPity) {
        // Store the current rainbow position when we start this fruit
        const startTime = Date.now();
        
        // First, run the scanning animation with changing rainbow
        for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
            const embed = SummonAnimator.createQuickFrame(frame, fruit, summonNumber, totalSummons, currentPity);
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
        }
        
        // Calculate where the rainbow should be when we reveal
        const rainbowPosition = Math.floor(Date.now() / 300) % 7;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Reveal: First stop rainbow on rarity color
        const rarityStoppedEmbed = this.createRarityStoppedReveal(fruit, result, summonNumber, totalSummons, currentPity, rainbowPosition, 'stopped');
        await interaction.editReply({ embeds: [rarityStoppedEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Then turn whole rainbow to rarity color for dramatic reveal
        const fullRarityEmbed = this.createRarityStoppedReveal(fruit, result, summonNumber, totalSummons, currentPity, rainbowPosition, 'full');
        await interaction.editReply({ embeds: [fullRarityEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Finally continue rainbow from where it stopped
        const continuedEmbed = this.createRarityStoppedReveal(fruit, result, summonNumber, totalSummons, currentPity, rainbowPosition, 'continue');
        await interaction.editReply({ embeds: [continuedEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    createRarityStoppedReveal(fruit, result, summonNumber, totalSummons, currentPity, rainbowPosition, phase) {
        // FIXED: Add comprehensive safety checks
        const safeFruit = {
            name: fruit?.name || 'Unknown Fruit',
            rarity: fruit?.rarity || 'common',
            type: fruit?.type || 'Unknown',
            multiplier: fruit?.multiplier || '1.0',
            description: fruit?.description || 'A mysterious Devil Fruit power',
            skillName: fruit?.skillName || 'Unknown Ability',
            skillDamage: fruit?.skillDamage || 50,
            skillCooldown: fruit?.skillCooldown || 2
        };

        const raritySquare = SummonAnimator.getRaritySquare(safeFruit.rarity);
        const color = RARITY_COLORS[safeFruit.rarity] || RARITY_COLORS.common;
        const colors = ['🟧', '🟨', '🟩', '🟦', '🟪', '⬜', '🟥'];
        
        let pattern = [];
        
        if (phase === 'stopped') {
            // Rainbow stops on the rarity color (leftmost square matches rarity)
            for (let i = 0; i < 20; i++) {
                if (i === 0) {
                    // First square is the rarity color
                    pattern.push(raritySquare);
                } else {
                    // Rest continues the rainbow from where it was
                    const colorIndex = (rainbowPosition + i) % colors.length;
                    pattern.push(colors[colorIndex]);
                }
            }
        } else if (phase === 'full') {
            // Whole rainbow turns to rarity color for dramatic effect
            pattern = Array(20).fill(raritySquare);
        } else if (phase === 'continue') {
            // Rainbow continues from where it stopped, but shifted
            const newPosition = (rainbowPosition + 1) % 7;
            for (let i = 0; i < 20; i++) {
                const colorIndex = (newPosition + i) % colors.length;
                pattern.push(colors[colorIndex]);
            }
        }
        
        const rainbowPattern = pattern.join(' ');
        
        const duplicateCount = result?.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
        
        const description = `✨ **ACQUIRED!**\n\n${rainbowPattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** ${safeFruit.name}\n` +
            `🔮 **Type:** ${safeFruit.type}\n` +
            `⭐ **Rarity:** ${raritySquare} ${safeFruit.rarity.charAt(0).toUpperCase() + safeFruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** x${safeFruit.multiplier}` +
            (result?.pityUsed ? ' 🎯 **PITY!**' : '') + `\n` +
            `🎯 **Description:** ${safeFruit.description}\n` +
            `⚔️ **Ability:** ${safeFruit.skillName} (${safeFruit.skillDamage} DMG, ${safeFruit.skillCooldown}s CD)\n\n` +
            `🔥 **Total CP:** ${result?.fruit?.total_cp?.toLocaleString() || '250'} CP\n` +
            `💰 **Remaining Berries:** Loading...\n\n` +
            `${rainbowPattern}`;
        
        let footerText = `Summon ${summonNumber} of ${totalSummons} - ✨ Acquired! | Pity: ${currentPity}/1500`;
        if (result?.pityUsed) {
            footerText = `✨ PITY USED! | ${footerText}`;
        }
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: footerText });
    },

    async showBatchNavigation(interaction, batchEmbeds, summaryEmbed, currentPage) {
        const totalPages = batchEmbeds.length;
        const hasSummary = summaryEmbed !== null;
        
        const navigationRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('batch_first')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('batch_prev')
                    .setLabel('⬅️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('batch_summary')
                    .setLabel('📊 Summary')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('batch_next')
                    .setLabel('➡️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === totalPages - 1),
                new ButtonBuilder()
                    .setCustomId('batch_last')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === totalPages - 1)
            );
        
        // Show current batch
        const currentEmbed = batchEmbeds[currentPage];
        await interaction.editReply({ 
            embeds: [currentEmbed], 
            components: [navigationRow] 
        });
        
        // Setup collector for navigation
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({ time: 600000 }); // 10 minutes
        
        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({
                    content: '❌ You can only navigate your own summon results!',
                    ephemeral: true
                });
            }
            
            let newPage = currentPage;
            let showSummary = false;
            
            switch (buttonInteraction.customId) {
                case 'batch_first':
                    newPage = 0;
                    break;
                case 'batch_prev':
                    newPage = Math.max(0, currentPage - 1);
                    break;
                case 'batch_summary':
                    showSummary = true;
                    break;
                case 'batch_next':
                    newPage = Math.min(totalPages - 1, currentPage + 1);
                    break;
                case 'batch_last':
                    newPage = totalPages - 1;
                    break;
                case 'back_to_batches':
                    // Return to batch navigation
                    const returnNavigationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('batch_first')
                                .setLabel('⏮️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('batch_prev')
                                .setLabel('⬅️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('batch_summary')
                                .setLabel('📊 Summary')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('batch_next')
                                .setLabel('➡️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === totalPages - 1),
                            new ButtonBuilder()
                                .setCustomId('batch_last')
                                .setLabel('⏭️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === totalPages - 1)
                        );
                    
                    await buttonInteraction.update({ 
                        embeds: [batchEmbeds[currentPage]], 
                        components: [returnNavigationRow] 
                    });
                    return;
            }
            
            if (showSummary && hasSummary) {
                // Show summary with back button
                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('back_to_batches')
                            .setLabel('⬅️ Back to Batches')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                await buttonInteraction.update({ 
                    embeds: [summaryEmbed], 
                    components: [backRow] 
                });
            } else if (newPage !== currentPage) {
                // Update navigation row
                const updatedNavigationRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('batch_first')
                            .setLabel('⏮️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === 0),
                        new ButtonBuilder()
                            .setCustomId('batch_prev')
                            .setLabel('⬅️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === 0),
                        new ButtonBuilder()
                            .setCustomId('batch_summary')
                            .setLabel('📊 Summary')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('batch_next')
                            .setLabel('➡️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('batch_last')
                            .setLabel('⏭️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === totalPages - 1)
                    );
                
                await buttonInteraction.update({ 
                    embeds: [batchEmbeds[newPage]], 
                    components: [updatedNavigationRow] 
                });
                
                currentPage = newPage;
            }
        });
        
        collector.on('end', () => {
            // Disable all buttons when collector expires
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('batch_first_disabled')
                        .setLabel('⏮️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_prev_disabled')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_summary_disabled')
                        .setLabel('📊 Summary')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_next_disabled')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_last_disabled')
                        .setLabel('⏭️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            
            interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    },

    async show10xSummary(interaction, fruits, results, newBalance, pityInfo, pityUsedInSession, batchNumber = 1, totalBatches = 1) {
        const summaryData = SummonAnimator.create10xSummary(fruits, results, newBalance, pityInfo, pityUsedInSession, batchNumber, totalBatches);
        
        // Check if we got a divine fruit for special animation
        if (summaryData.isDivine && totalBatches === 1) {
            await this.showDivineAnimation(interaction, summaryData.embed);
        } else {
            await interaction.editReply({ embeds: [summaryData.embed] });
        }
    },

    async showMegaSummary(interaction, allFruits, allResults, newBalance, pityInfo, pityUsedInSession, totalPulls) {
        const summaryData = SummonAnimator.createMegaSummary(allFruits, allResults, newBalance, pityInfo, pityUsedInSession, totalPulls);
        
        // Check if we got a divine fruit for special animation
        if (summaryData.isDivine) {
            await this.showDivineAnimation(interaction, summaryData.embed);
        } else {
            await interaction.editReply({ embeds: [summaryData.embed] });
        }
    },

    async showDivineAnimation(interaction, baseEmbed) {
        // Divine color animation - fast color changing for 20 seconds
        const divineColors = [
            0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 
            0xFF00FF, 0x00FFFF, 0xFFFFFF, 0xFFD700, 0xFF1493, 0x00FA9A
        ];
        
        const animationDuration = 20000; // 20 seconds
        const frameDelay = 200; // Change color every 200ms
        const totalFrames = animationDuration / frameDelay;
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const colorIndex = frame % divineColors.length;
            const currentColor = divineColors[colorIndex];
            
            const animatedEmbed = new EmbedBuilder()
                .setTitle(baseEmbed.data.title)
                .setDescription(baseEmbed.data.description)
                .setColor(currentColor)
                .setFooter({ text: '✨ DIVINE POWER DETECTED! ✨' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [animatedEmbed] });
            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
        
        // End with final divine red color
        const finalEmbed = new EmbedBuilder()
            .setTitle(baseEmbed.data.title)
            .setDescription(baseEmbed.data.description)
            .setColor(0xFF0000)
            .setFooter({ text: baseEmbed.data.footer.text })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    async setupButtons(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`summon_10x_${interaction.user.id}`)
                    .setLabel('🍈 Summon 10x')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`summon_50x_${interaction.user.id}`)
                    .setLabel('🍈 Summon 50x')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`summon_100x_${interaction.user.id}`)
                    .setLabel('🍈 Summon 100x')
                    .setStyle(ButtonStyle.Danger)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        // Setup collector for new summons
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({ time: 300000 }); // 5 minutes
        
        collector.on('collect', async (buttonInteraction) => {
            const [action, count, userId] = buttonInteraction.customId.split('_');
            
            if (buttonInteraction.user.id !== userId) {
                return buttonInteraction.reply({
                    content: '❌ You can only use your own summon buttons!',
                    ephemeral: true
                });
            }
            
            // Check if user has enough berries
            const cost = PULL_COST * parseInt(count.replace('x', ''));
            const balance = await EconomyService.getBalance(userId);
            
            if (balance < cost) {
                const pityInfo = await GachaService.getPityInfo(userId);
                const pityDisplay = GachaService.formatPityDisplay(pityInfo);
                
                return buttonInteraction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('❌ Insufficient Berries')
                            .setDescription(`You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries\n\n${pityDisplay}`)
                            .setFooter({ text: 'Use /income to earn more berries!' })
                    ],
                    ephemeral: true
                });
            }
            
            // Deduct berries and start new summon
            await EconomyService.deductBerries(userId, cost, 'gacha_summon');
            const newBalance = balance - cost;
            
            // Acknowledge the button press and defer
            await buttonInteraction.deferUpdate();
            
            // Start the appropriate summon
            const summonCount = parseInt(count.replace('x', ''));
            if (summonCount === 10) {
                await this.run10xSummon(buttonInteraction, newBalance);
            } else if (summonCount === 50) {
                await this.run50xSummon(buttonInteraction, newBalance);
            } else if (summonCount === 100) {
                await this.run100xSummon(buttonInteraction, newBalance);
            }
        });
        
        collector.on('end', () => {
            // Disable buttons when collector expires
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('summon_10x_disabled')
                        .setLabel('🍈 Summon 10x')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('summon_50x_disabled')
                        .setLabel('🍈 Summon 50x')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('summon_100x_disabled')
                        .setLabel('🍈 Summon 100x')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );
            
            interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
