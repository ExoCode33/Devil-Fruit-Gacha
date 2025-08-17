// src/events/client/pvpChallengeHandler.js - FIXED: Syntax Error Corrected
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../database/DatabaseManager');
const { getSkillData } = require('../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../data/Constants');

// Import the active selections and battles from the command
let activeSelections = new Map();
let activeBattles = new Map();

// Challenge configuration
const CHALLENGE_CONFIG = {
    TEAM_SIZE: 5,
    BANS_PER_SIDE: 2,
    TURN_TIMEOUT: 120000,
    FRUITS_PER_PAGE: 20,
    MAX_BATTLE_TURNS: 30
};

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        
        const customId = interaction.customId;
        
        // Handle PvP Challenge interactions
        if (customId.includes('select_') || customId.includes('ban_') || customId.includes('battle_')) {
            await handlePvPChallengeInteraction(interaction);
        }
    }
};

/**
 * Handle all PvP Challenge related interactions
 */
async function handlePvPChallengeInteraction(interaction) {
    const customId = interaction.customId;
    
    try {
        // Selection phase interactions
        if (customId.startsWith('select_prev_') || customId.startsWith('select_next_')) {
            await handlePageNavigation(interaction);
        } else if (customId.startsWith('select_fruit_')) {
            await handleFruitSelection(interaction);
        } else if (customId.startsWith('clear_selection_')) {
            await handleClearSelection(interaction);
        } else if (customId.startsWith('confirm_team_')) {
            await handleTeamConfirmation(interaction);
        }
        // Banning phase interactions
        else if (customId.startsWith('ban_fruit_')) {
            await handleFruitBanning(interaction);
        } else if (customId.startsWith('confirm_bans_')) {
            await handleBanConfirmation(interaction);
        }
        // Battle phase interactions
        else if (customId.startsWith('battle_attack_') || customId.startsWith('battle_skill_') || customId.startsWith('battle_defend_')) {
            await handleBattleAction(interaction);
        }
        
    } catch (error) {
        console.error('PvP Challenge interaction error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Interaction Error')
            .setDescription('An error occurred processing your action. Please try again.')
            .setTimestamp();
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

/**
 * Handle page navigation for fruit selection
 */
async function handlePageNavigation(interaction) {
    const parts = interaction.customId.split('_');
    const direction = parts[1]; // 'prev' or 'next'
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    const totalPages = Math.ceil(userData.fruits.length / CHALLENGE_CONFIG.FRUITS_PER_PAGE);
    
    if (direction === 'prev' && userData.currentPage > 0) {
        userData.currentPage--;
    } else if (direction === 'next' && userData.currentPage < totalPages - 1) {
        userData.currentPage++;
    }
    
    // Update the interface
    const embed = createSelectionEmbed(userData, role);
    const components = createSelectionComponents(selectionId, userData, role);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle fruit selection from dropdown
 */
async function handleFruitSelection(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    const selectedValues = interaction.values;
    
    // Process selections
    selectedValues.forEach(value => {
        const fruitIndex = parseInt(value.split('_')[1]);
        const fruit = userData.fruits[fruitIndex];
        
        if (fruit && !userData.selectedTeam.some(s => s.id === fruit.id)) {
            if (userData.selectedTeam.length < CHALLENGE_CONFIG.TEAM_SIZE) {
                userData.selectedTeam.push(fruit);
            }
        }
    });
    
    // Update the interface
    const embed = createSelectionEmbed(userData, role);
    const components = createSelectionComponents(selectionId, userData, role);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle clear selection
 */
async function handleClearSelection(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    userData.selectedTeam = [];
    
    // Update the interface
    const embed = createSelectionEmbed(userData, role);
    const components = createSelectionComponents(selectionId, userData, role);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle team confirmation
 */
async function handleTeamConfirmation(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    
    if (userData.selectedTeam.length !== CHALLENGE_CONFIG.TEAM_SIZE) {
        return interaction.reply({ 
            content: `❌ You must select exactly ${CHALLENGE_CONFIG.TEAM_SIZE} fruits!`, 
            ephemeral: true 
        });
    }
    
    userData.selectionComplete = true;
    
    const confirmEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS.epic)
        .setTitle('✅ Team Confirmed!')
        .setDescription('Your team has been locked in. Waiting for opponent...')
        .addFields({
            name: '🏴‍☠️ Your Team',
            value: userData.selectedTeam
                .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
                .join('\n'),
            inline: false
        })
        .setTimestamp();
    
    await interaction.update({ embeds: [confirmEmbed], components: [] });
    
    // Check if both teams are ready
    if (selection.challenger.selectionComplete && selection.opponent.selectionComplete) {
        setTimeout(() => startBanningPhase(interaction, selectionId), 2000);
    }
}

/**
 * Start the banning phase
 */
async function startBanningPhase(interaction, selectionId) {
    const selection = activeSelections.get(selectionId);
    if (!selection) return;
    
    selection.phase = 'banning';
    selection.challenger.bannedFruits = [];
    selection.opponent.bannedFruits = [];
    selection.challenger.bansComplete = false;
    selection.opponent.bansComplete = false;
    
    // Send banning interfaces
    await sendBanningInterface(interaction, selectionId, selection.challenger.userId, 'challenger', selection.opponent.selectedTeam);
    await sendBanningInterface(interaction, selectionId, selection.opponent.userId, 'opponent', selection.challenger.selectedTeam);
}

/**
 * Send banning interface to user
 */
async function sendBanningInterface(interaction, selectionId, userId, role, opponentTeam) {
    const selection = activeSelections.get(selectionId);
    const userData = selection[role];
    
    try {
        const user = await interaction.client.users.fetch(userId);
        
        const embed = new EmbedBuilder()
            .setColor(RARITY_COLORS.rare)
            .setTitle(`🚫 Ban Phase (${userData.bannedFruits?.length || 0}/${CHALLENGE_CONFIG.BANS_PER_SIDE})`)
            .setDescription(`Choose ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits to ban from your opponent's team!`)
            .setFooter({ text: 'Select fruits to prevent your opponent from using them' })
            .setTimestamp();
        
        // Show opponent's team
        const teamText = opponentTeam
            .map((fruit, index) => {
                const isBanned = userData.bannedFruits?.some(b => b.id === fruit.id);
                const status = isBanned ? '🚫' : `${index + 1}.`;
                return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`;
            })
            .join('\n');
        
        embed.addFields({
            name: '⚔️ Opponent\'s Team',
            value: teamText,
            inline: false
        });
        
        // Create ban selection dropdown
        const availableForBan = opponentTeam.filter(fruit => 
            !userData.bannedFruits?.some(b => b.id === fruit.id)
        );
        
        const components = [];
        
        if (availableForBan.length > 0 && (userData.bannedFruits?.length || 0) < CHALLENGE_CONFIG.BANS_PER_SIDE) {
            const options = availableForBan.map((fruit, index) => ({
                label: `${fruit.name}`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.totalCP} CP`.substring(0, 100),
                value: `ban_${fruit.id}`,
                emoji: fruit.emoji
            }));
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`ban_fruit_${selectionId}_${role}`)
                .setPlaceholder('Select fruits to ban...')
                .setMinValues(0)
                .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.BANS_PER_SIDE - (userData.bannedFruits?.length || 0)))
                .addOptions(options);
            
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }
        
        // Add confirmation button if bans are complete
        if ((userData.bannedFruits?.length || 0) === CHALLENGE_CONFIG.BANS_PER_SIDE) {
            const confirmButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_bans_${selectionId}_${role}`)
                        .setLabel('✅ Confirm Bans')
                        .setStyle(ButtonStyle.Success)
                );
            components.push(confirmButton);
        }
        
        if (userData.bannedFruits?.length > 0) {
            const bannedText = userData.bannedFruits
                .map(fruit => `🚫 ${fruit.emoji} **${fruit.name}**`)
                .join('\n');
            
            embed.addFields({
                name: '🚫 Your Bans',
                value: bannedText,
                inline: false
            });
        }
        
        await user.send({ embeds: [embed], components });
        
    } catch (error) {
        console.error('Failed to send ban interface:', error);
    }
}

/**
 * Handle fruit banning
 */
async function handleFruitBanning(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your banning interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    const selectedValues = interaction.values;
    const opponentTeam = role === 'challenger' ? selection.opponent.selectedTeam : selection.challenger.selectedTeam;
    
    if (!userData.bannedFruits) userData.bannedFruits = [];
    
    // Process ban selections
    selectedValues.forEach(value => {
        const fruitId = value.split('_')[1];
        const fruit = opponentTeam.find(f => f.id === fruitId);
        
        if (fruit && !userData.bannedFruits.some(b => b.id === fruit.id)) {
            if (userData.bannedFruits.length < CHALLENGE_CONFIG.BANS_PER_SIDE) {
                userData.bannedFruits.push(fruit);
            }
        }
    });
    
    // Update the interface
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.rare)
        .setTitle(`🚫 Ban Phase (${userData.bannedFruits.length}/${CHALLENGE_CONFIG.BANS_PER_SIDE})`)
        .setDescription(`Choose ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits to ban from your opponent's team!`)
        .setFooter({ text: 'Select fruits to prevent your opponent from using them' })
        .setTimestamp();
    
    // Show opponent's team with bans marked
    const teamText = opponentTeam
        .map((fruit, index) => {
            const isBanned = userData.bannedFruits.some(b => b.id === fruit.id);
            const status = isBanned ? '🚫' : `${index + 1}.`;
            return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`;
        })
        .join('\n');
    
    embed.addFields({
        name: '⚔️ Opponent\'s Team',
        value: teamText,
        inline: false
    });
    
    if (userData.bannedFruits.length > 0) {
        const bannedText = userData.bannedFruits
            .map(fruit => `🚫 ${fruit.emoji} **${fruit.name}**`)
            .join('\n');
        
        embed.addFields({
            name: '🚫 Your Bans',
            value: bannedText,
            inline: false
        });
    }
    
    // Create updated components
    const components = [];
    const availableForBan = opponentTeam.filter(fruit => 
        !userData.bannedFruits.some(b => b.id === fruit.id)
    );
    
    if (availableForBan.length > 0 && userData.bannedFruits.length < CHALLENGE_CONFIG.BANS_PER_SIDE) {
        const options = availableForBan.map(fruit => ({
            label: `${fruit.name}`.substring(0, 100),
            description: `${fruit.rarity} • ${fruit.totalCP} CP`.substring(0, 100),
            value: `ban_${fruit.id}`,
            emoji: fruit.emoji
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`ban_fruit_${selectionId}_${role}`)
            .setPlaceholder('Select more fruits to ban...')
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.BANS_PER_SIDE - userData.bannedFruits.length))
            .addOptions(options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    
    if (userData.bannedFruits.length === CHALLENGE_CONFIG.BANS_PER_SIDE) {
        const confirmButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_bans_${selectionId}_${role}`)
                    .setLabel('✅ Confirm Bans')
                    .setStyle(ButtonStyle.Success)
            );
        components.push(confirmButton);
    }
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle ban confirmation
 */
async function handleBanConfirmation(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your banning interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    
    if (userData.bannedFruits.length !== CHALLENGE_CONFIG.BANS_PER_SIDE) {
        return interaction.reply({ 
            content: `❌ You must ban exactly ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits!`, 
            ephemeral: true 
        });
    }
    
    userData.bansComplete = true;
    
    const confirmEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS.epic)
        .setTitle('✅ Bans Confirmed!')
        .setDescription('Your bans have been locked in. Waiting for opponent...')
        .addFields({
            name: '🚫 Your Bans',
            value: userData.bannedFruits
                .map(fruit => `🚫 ${fruit.emoji} **${fruit.name}**`)
                .join('\n'),
            inline: false
        })
        .setTimestamp();
    
    await interaction.update({ embeds: [confirmEmbed], components: [] });
    
    // Check if both players have completed bans
    if (selection.challenger.bansComplete && selection.opponent.bansComplete) {
        setTimeout(() => startBattle(interaction, selectionId), 2000);
    }
}

/**
 * Start the battle phase
 */
async function startBattle(interaction, selectionId) {
    const selection = activeSelections.get(selectionId);
    if (!selection) return;
    
    // Create battle state
    const battleId = generateBattleId();
    const battle = {
        id: battleId,
        challengerId: selection.challenger.userId,
        opponentId: selection.opponent.userId,
        currentTurn: selection.challenger.userId, // Challenger goes first
        turn: 1,
        
        // Filter out banned fruits and add battle stats
        challenger: {
            userId: selection.challenger.userId,
            team: selection.challenger.selectedTeam.filter(fruit => 
                !selection.opponent.bannedFruits.some(ban => ban.id === fruit.id)
            ).map(fruit => addBattleStats(fruit)),
            activeFruit: 0, // Index of current active fruit
            bannedFruits: selection.challenger.bannedFruits
        },
        
        opponent: {
            userId: selection.opponent.userId,
            team: selection.opponent.selectedTeam.filter(fruit => 
                !selection.challenger.bannedFruits.some(ban => ban.id === fruit.id)
            ).map(fruit => addBattleStats(fruit)),
            activeFruit: 0,
            bannedFruits: selection.opponent.bannedFruits
        },
        
        battleLog: [],
        status: 'active',
        createdAt: Date.now()
    };
    
    // Store battle
    activeBattles.set(battleId, battle);
    
    // Clean up selection data
    activeSelections.delete(selectionId);
    
    // Send battle start notification
    const startEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle('⚔️ Battle Begins!')
        .setDescription('The strategic Devil Fruit battle is starting!\n\n**Battle System Coming Soon** - Full turn-based combat with skills, attacks, and fruit switching will be implemented.')
        .addFields(
            {
                name: '🏴‍☠️ Challenger Team',
                value: battle.challenger.team.map(f => `${f.emoji} ${f.name}`).join('\n') || 'No fruits remaining',
                inline: true
            },
            {
                name: '⚔️ Opponent Team',
                value: battle.opponent.team.map(f => `${f.emoji} ${f.name}`).join('\n') || 'No fruits remaining',
                inline: true
            }
        )
        .setTimestamp();
    
    try {
        const challenger = await interaction.client.users.fetch(battle.challengerId);
        const opponent = await interaction.client.users.fetch(battle.opponentId);
        
        await challenger.send({ embeds: [startEmbed] });
        await opponent.send({ embeds: [startEmbed] });
    } catch (error) {
        console.error('Failed to send battle start notification:', error);
    }
    
    // Add initial battle log entry
    battle.battleLog.push({
        turn: 0,
        action: 'battle_start',
        message: '⚔️ **Battle Begins!** May the strongest pirate win!',
        timestamp: Date.now()
    });
    
    // Clean up battle after 1 hour
    setTimeout(() => {
        activeBattles.delete(battleId);
    }, 3600000);
}

/**
 * Add battle stats to a fruit
 */
function addBattleStats(fruit) {
    const maxHP = Math.floor(fruit.totalCP * 1.5); // HP based on CP
    
    return {
        ...fruit,
        currentHP: maxHP,
        maxHP: maxHP,
        statusEffects: [],
        skillCooldowns: {}
    };
}

/**
 * Handle battle actions (simplified for now)
 */
async function handleBattleAction(interaction) {
    const parts = interaction.customId.split('_');
    const action = parts[1]; // 'attack', 'skill', 'defend', 'switch'
    const battleId = parts[2];
    const role = parts[3];
    
    const battle = activeBattles.get(battleId);
    if (!battle) {
        return interaction.reply({ content: '❌ Battle session expired!', ephemeral: true });
    }
    
    // For now, just acknowledge the action
    await interaction.reply({
        content: `⚔️ Battle action received: ${action}\n\n🚧 **Full battle system coming soon!**\nThis will include turn-based combat, skill usage, and strategic fruit switching.`,
        ephemeral: true
    });
}

/**
 * Create selection embed (shared function)
 */
function createSelectionEmbed(userData, role) {
    const selectedCount = userData.selectedTeam.length;
    const remainingSlots = CHALLENGE_CONFIG.TEAM_SIZE - selectedCount;
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle(`🍈 Select Your Team (${selectedCount}/${CHALLENGE_CONFIG.TEAM_SIZE})`)
        .setDescription(`Choose ${remainingSlots} more Devil Fruit${remainingSlots !== 1 ? 's' : ''} for your team!`)
        .setFooter({ text: `Page ${userData.currentPage + 1} • Use buttons to navigate and select` })
        .setTimestamp();
    
    // Show current selections
    if (userData.selectedTeam.length > 0) {
        const selectedText = userData.selectedTeam
            .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
            .join('\n');
        
        embed.addFields({
            name: '✅ Selected Team',
            value: selectedText,
            inline: false
        });
    }
    
    // Show available fruits for current page
    const startIndex = userData.currentPage * CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = userData.fruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const availableText = pageFruits
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                const isSelected = userData.selectedTeam.some(s => s.id === fruit.id);
                const status = isSelected ? '✅' : `${globalIndex + 1}.`;
                return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.rarity}, ${fruit.totalCP} CP)`;
            })
            .join('\n');
        
        embed.addFields({
            name: '🍈 Available Fruits',
            value: availableText.length > 1000 ? availableText.substring(0, 997) + '...' : availableText,
            inline: false
        });
    }
    
    return embed;
}

/**
 * Create selection components (shared function)
 */
function createSelectionComponents(selectionId, userData, role) {
    const components = [];
    
    // Navigation buttons
    const navRow = new ActionRowBuilder();
    
    if (userData.currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`select_prev_${selectionId}_${role}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    const totalPages = Math.ceil(userData.fruits.length / CHALLENGE_CONFIG.FRUITS_PER_PAGE);
    if (userData.currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`select_next_${selectionId}_${role}`)
                .setLabel('➡️ Next')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (navRow.components.length > 0) {
        components.push(navRow);
    }
    
    // Fruit selection dropdown
    const startIndex = userData.currentPage * CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = userData.fruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const options = pageFruits.map((fruit, index) => {
            const globalIndex = startIndex + index;
            const isSelected = userData.selectedTeam.some(s => s.id === fruit.id);
            
            return {
                label: `${fruit.name} (${fruit.totalCP} CP)`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.type}`.substring(0, 100),
                value: `fruit_${globalIndex}`,
                emoji: fruit.emoji,
                default: isSelected
            };
        });
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_fruit_${selectionId}_${role}`)
            .setPlaceholder('Select a Devil Fruit for your team...')
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.TEAM_SIZE - userData.selectedTeam.length))
            .addOptions(options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    
    // Action buttons
    const actionRow = new ActionRowBuilder();
    
    if (userData.selectedTeam.length > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`clear_selection_${selectionId}_${role}`)
                .setLabel('🗑️ Clear All')
                .setStyle(ButtonStyle.Danger)
        );
    }
    
    if (userData.selectedTeam.length === CHALLENGE_CONFIG.TEAM_SIZE) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_team_${selectionId}_${role}`)
                .setLabel('✅ Confirm Team')
                .setStyle(ButtonStyle.Success)
        );
    }
    
    if (actionRow.components.length > 0) {
        components.push(actionRow);
    }
    
    return components;
}

/**
 * Generate unique battle ID
 */
function generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Export the active maps so the command can access them
module.exports.activeSelections = activeSelections;
module.exports.activeBattles = activeBattles;
