// src/features/gacha/commands/summon.js - FIXED: Complete implementation with proper imports
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const GachaService = require('../app/GachaService');
const EconomyService = require('../../economy/app/EconomyService');
const DatabaseManager = require('../../../shared/db/DatabaseManager');
const Constants = require('../../../shared/constants/Constants');

// Use Constants for values
const PULL_COST = Constants.PULL_COST || 1000;
const RARITY_COLORS = Constants.RARITY_COLORS;
const RARITY_EMOJIS = Constants.RARITY_EMOJIS;

// Try to import Devil Fruits data
let DEVIL_FRUITS = {};
try {
    DEVIL_FRUITS = require('../data/DevilFruits');
} catch (error) {
    console.warn('DevilFruits data not found, using fallback system');
}

// Animation Configuration
const ANIMATION_CONFIG = {
    QUICK_FRAMES: 5,
    QUICK_DELAY: 500,
    RAINBOW_DELAY: 300
};

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
        return RARITY_EMOJIS[rarity] || '⚪';
    }

    static createSimpleLoadingFrame(currentPulls, totalPulls) {
        const progressPercent = Math.floor((currentPulls / totalPulls) * 100);
        const frame = Math.floor(Date.now() / ANIMATION_CONFIG.RAINBOW_DELAY) % 7;
        const pattern = this.getRainbowPattern(frame, 20);
        const color = this.getRainbowColor(frame);
        
        const embed = new EmbedBuilder()
            .setTitle(`🍈 ${totalPulls}x Devil Fruit Summoning`)
            .setDescription(
                `🌊 **Searching the Grand Line for Devil Fruits...**\n\n` +
                `${pattern}\n\n` +
                `📊 **Progress:** ${currentPulls}/${totalPulls} (${progressPercent}%)\n` +
                `⚡ **Status:** Scanning for legendary powers...\n\n` +
                `${pattern}`
            )
            .setColor(color)
            .setFooter({ text: `Processing... ${currentPulls}/${totalPulls} completed` })
            .setTimestamp();
        
        return embed;
    }

    static createResultSummary(fruits, results, balance, pityInfo, pityUsedInSession) {
        // Count rarities
        const rarityCounts = {};
        fruits.forEach(fruit => {
            const rarity = fruit.rarity || 'common';
            rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
        });

        // Find highest rarity for color
        const rarityPriority = {
            'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4,
            'legendary': 5, 'mythical': 6, 'divine': 7
        };
        
        let highestRarity = 'common';
        let highestPriority = 0;
        
        fruits.forEach(fruit => {
            const priority = rarityPriority[fruit.rarity] || 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                highestRarity = fruit.rarity;
            }
        });

        // Build description
        let description = `🎉 **Summoning Complete!** 🎉\n\n`;
        
        // Add fruits list
        fruits.forEach((fruit, index) => {
            const result = results[index] || {};
            const rarityEmoji = this.getRaritySquare(fruit.rarity);
            const statusText = result.duplicateCount === 1 ? '✨ New!' : `x${result.duplicateCount}`;
            const pityIndicator = result.pityUsed ? ' 🎯' : '';
            
            description += `**${index + 1}.** ${rarityEmoji} **${fruit.name}**${pityIndicator}\n`;
            description += `      📊 ${statusText} | 🔮 ${fruit.type} | 💪 x${fruit.multiplier.toFixed(1)}\n\n`;
        });

        // Add rarity summary
        description += `📊 **Rarity Summary:**\n`;
        Object.entries(rarityCounts).forEach(([rarity, count]) => {
            const emoji = this.getRaritySquare(rarity);
            const name = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            description += `${emoji} ${name}: ${count}\n`;
        });

        description += `\n💰 **Remaining Berries:** ${balance.toLocaleString()}\n\n`;
        description += GachaService.formatPityDisplay(pityInfo, pityUsedInSession);

        const color = highestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[highestRarity] || RARITY_COLORS.common;

        const embed = new EmbedBuilder()
            .setTitle(`🍈 ${fruits.length}x Devil Fruit Results!`)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        if (pityUsedInSession) {
            embed.setFooter({ text: '✨ PITY ACTIVATED THIS SESSION! | Your legend grows on the Grand Line!' });
        } else {
            embed.setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' });
        }

        return embed;
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
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, interaction.user.username, interaction.guildId);
            
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
        } else if (amount <= 10) {
            await this.runMultiSummon(interaction, newBalance, amount, skipAnimation);
        } else {
            await this.runMegaSummon(interaction, newBalance, amount, skipAnimation);
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
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            // Create display fruit object
            const displayFruit = {
                id: fruit.fruit_id || fruit.id || 'fruit_1',
                name: fruit.fruit_name || fruit.name || 'Unknown Fruit',
                type: fruit.fruit_type || fruit.type || 'Unknown',
                rarity: fruit.fruit_rarity || fruit.rarity || 'common',
                multiplier: ((parseFloat(fruit.base_cp) || 100) / 100),
                description: fruit.fruit_description || fruit.description || 'A mysterious Devil Fruit power'
            };
            
            if (!skipAnimation) {
                // Simple animation for single pull
                for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
                    const loadingEmbed = SummonAnimator.createSimpleLoadingFrame(frame + 1, ANIMATION_CONFIG.QUICK_FRAMES);
                    await interaction.editReply({ embeds: [loadingEmbed] });
                    await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
                }
            }
            
            // Get final pity info
            const pityInfo = await GachaService.getPityInfo(interaction.user.id);
            
            // Create result embed
            const rarityEmoji = SummonAnimator.getRaritySquare(displayFruit.rarity);
            const color = RARITY_COLORS[displayFruit.rarity] || RARITY_COLORS.common;
            const statusText = result.duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${result.duplicateCount}`;
            
            const resultEmbed = new EmbedBuilder()
                .setTitle('🍈 Devil Fruit Summoned!')
                .setColor(color)
                .setDescription(`${rarityEmoji} **${displayFruit.name}** (${displayFruit.rarity.charAt(0).toUpperCase() + displayFruit.rarity.slice(1)})`)
                .addFields(
                    {
                        name: '📊 Fruit Information',
                        value: [
                            `📊 **Status:** ${statusText}`,
                            `🔮 **Type:** ${displayFruit.type}`,
                            `💪 **CP Multiplier:** x${displayFruit.multiplier.toFixed(1)}`,
                            `🎯 **Description:** ${displayFruit.description}`
                        ].join('\n'),
                        inline: false
                    },
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
                )
                .setTimestamp();
            
            if (result.pityUsed) {
                resultEmbed.setFooter({ text: '✨ PITY WAS USED! | Your legend grows stronger!' });
            } else {
                resultEmbed.setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' });
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
     * Run multi summon (2-10 pulls)
     */
    async runMultiSummon(interaction, newBalance, amount, skipAnimation = false) {
        try {
            const allResults = [];
            const allFruits = [];
            
            // Perform pulls one by one to show progress
            for (let i = 0; i < amount; i++) {
                const pullData = await GachaService.performPulls(interaction.user.id, 1);
                const result = pullData.results[0];
                const fruit = result.fruit;
                
                allResults.push(result);
                
                const displayFruit = {
                    id: fruit.fruit_id || fruit.id || `fruit_${i}`,
                    name: fruit.fruit_name || fruit.name || 'Unknown Fruit',
                    type: fruit.fruit_type || fruit.type || 'Unknown',
                    rarity: fruit.fruit_rarity || fruit.rarity || 'common',
                    multiplier: ((parseFloat(fruit.base_cp) || 100) / 100),
                    description: fruit.fruit_description || fruit.description || 'A mysterious Devil Fruit power'
                };
                
                allFruits.push(displayFruit);
                
                if (!skipAnimation) {
                    const loadingEmbed = SummonAnimator.createSimpleLoadingFrame(i + 1, amount);
                    await interaction.editReply({ embeds: [loadingEmbed] });
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            // Get final pity info
            const pityInfo = await GachaService.getPityInfo(interaction.user.id);
            const pityUsedInSession = allResults.some(r => r.pityUsed);
            
            // Show summary
            const summaryEmbed = SummonAnimator.createResultSummary(allFruits, allResults, newBalance, pityInfo, pityUsedInSession);
            await interaction.editReply({ embeds: [summaryEmbed], components: [] });
            
        } catch (error) {
            console.error('Multi summon error:', error);
            await interaction.editReply({
                content: '❌ An error occurred during your summon.',
                embeds: [],
                components: []
            });
        }
    },

    /**
     * Run mega summon (11+ pulls)
     */
    async runMegaSummon(interaction, newBalance, amount, skipAnimation = false) {
        try {
            const allResults = [];
            const allFruits = [];
            
            // For mega summons, perform in batches to avoid timeout
            const batchSize = skipAnimation ? 20 : 5;
            const totalBatches = Math.ceil(amount / batchSize);
            
            for (let batch = 0; batch < totalBatches; batch++) {
                const batchStart = batch * batchSize;
                const batchEnd = Math.min(batchStart + batchSize, amount);
                const batchCount = batchEnd - batchStart;
                
                for (let i = 0; i < batchCount; i++) {
                    const pullData = await GachaService.performPulls(interaction.user.id, 1);
                    const result = pullData.results[0];
                    const fruit = result.fruit;
                    
                    allResults.push(result);
                    
                    const displayFruit = {
                        id: fruit.fruit_id || fruit.id || `fruit_${batchStart + i}`,
                        name: fruit.fruit_name || fruit.name || 'Unknown Fruit',
                        type: fruit.fruit_type || fruit.type || 'Unknown',
                        rarity: fruit.fruit_rarity || fruit.rarity || 'common',
                        multiplier: ((parseFloat(fruit.base_cp) || 100) / 100),
                        description: fruit.fruit_description || fruit.description || 'A mysterious Devil Fruit power'
                    };
                    
                    allFruits.push(displayFruit);
                    
                    if (!skipAnimation) {
                        const loadingEmbed = SummonAnimator.createSimpleLoadingFrame(batchStart + i + 1, amount);
                        await interaction.editReply({ embeds: [loadingEmbed] });
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                // Update progress between batches
                if (!skipAnimation && batch < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Get final pity info
            const pityInfo = await GachaService.getPityInfo(interaction.user.id);
            const pityUsedInSession = allResults.some(r => r.pityUsed);
            
            // Show summary
            const summaryEmbed = SummonAnimator.createResultSummary(allFruits, allResults, newBalance, pityInfo, pityUsedInSession);
            await interaction.editReply({ embeds: [summaryEmbed], components: [] });
            
        } catch (error) {
            console.error('Mega summon error:', error);
            await interaction.editReply({
                content: '❌ An error occurred during your summon.',
                embeds: [],
                components: []
            });
        }
    }
};
