// src/features/economy/commands/balance.js - EMERGENCY FIXED: Complete implementation with total interaction validation
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const EconomyService = require('../app/EconomyService');
const DatabaseManager = require('../../../shared/db/DatabaseManager');

// EMERGENCY VALIDATION FUNCTIONS
function validateInteraction(interaction) {
    // Level 1: Check if interaction exists
    if (!interaction) {
        console.error('EMERGENCY: Interaction is null/undefined');
        return { valid: false, reason: 'null_interaction' };
    }
    
    // Level 2: Check if interaction has basic structure
    if (typeof interaction !== 'object') {
        console.error('EMERGENCY: Interaction is not an object', { type: typeof interaction });
        return { valid: false, reason: 'invalid_type' };
    }
    
    // Level 3: Check if interaction has reply function
    if (typeof interaction.reply !== 'function') {
        console.error('EMERGENCY: Interaction missing reply function', {
            hasReply: !!interaction.reply,
            hasUser: !!interaction.user,
            hasId: !!interaction.id,
            keys: Object.keys(interaction)
        });
        return { valid: false, reason: 'missing_reply' };
    }
    
    // Level 4: Check if interaction has user
    if (!interaction.user) {
        console.error('EMERGENCY: Interaction missing user', {
            id: interaction.id,
            type: interaction.type,
            commandName: interaction.commandName,
            hasUser: !!interaction.user
        });
        return { valid: false, reason: 'missing_user' };
    }
    
    // Level 5: Check if user has id
    if (!interaction.user.id) {
        console.error('EMERGENCY: User missing id', {
            user: interaction.user,
            userId: interaction.user.id
        });
        return { valid: false, reason: 'missing_user_id' };
    }
    
    return { valid: true };
}

async function emergencySafeReply(interaction, content, ephemeral = true) {
    try {
        const options = {
            content: content,
            flags: ephemeral ? 64 : undefined // MessageFlags.Ephemeral = 64
        };
        
        // Try multiple reply methods in order of preference
        if (typeof interaction.reply === 'function') {
            await interaction.reply(options);
            return true;
        }
        
        if (typeof interaction.followUp === 'function') {
            await interaction.followUp(options);
            return true;
        }
        
        if (typeof interaction.editReply === 'function') {
            await interaction.editReply({ content: content });
            return true;
        }
        
        console.error('EMERGENCY: No reply method available on interaction');
        return false;
        
    } catch (error) {
        console.error('EMERGENCY: All reply methods failed:', error.message);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('💰 Check your berry balance and income stats')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Check another user\'s balance')
                .setRequired(false)
        ),
    
    category: 'economy',
    cooldown: 3,
    
    async execute(interaction) {
        // EMERGENCY: Complete interaction validation
        const validation = validateInteraction(interaction);
        if (!validation.valid) {
            console.error(`EMERGENCY: Invalid interaction - ${validation.reason}`);
            
            // Try to send error response only if we have basic interaction structure
            if (validation.reason !== 'null_interaction' && validation.reason !== 'invalid_type') {
                await emergencySafeReply(interaction, '❌ System error: Invalid interaction. Please try again.', true);
            }
            return;
        }
        
        // Safe user extraction
        let targetUser;
        try {
            targetUser = interaction.options.getUser('user') || interaction.user;
        } catch (error) {
            console.error('EMERGENCY: Failed to get target user:', error);
            targetUser = interaction.user;
        }
        
        // Additional safety check for targetUser
        if (!targetUser || !targetUser.id) {
            console.error('EMERGENCY: targetUser is invalid', {
                targetUser,
                hasUser: !!interaction.user,
                optionsUser: interaction.options?.getUser ? 'has getUser' : 'no getUser'
            });
            
            await emergencySafeReply(interaction, '❌ Unable to identify the target user. Please try again.', true);
            return;
        }
        
        const userId = targetUser.id;
        const username = targetUser.username || 'Unknown';
        const guildId = interaction.guildId || interaction.guild?.id || null;
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, guildId);
            
            // Get user data
            const user = await DatabaseManager.getUser(userId);
            if (!user) {
                return interaction.reply({
                    content: '❌ User not found! They need to use a command first.',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Get balance and income info
            const balance = await EconomyService.getBalance(userId);
            const incomeDisplayInfo = await EconomyService.getIncomeDisplayInfo(userId);
            const automaticIncome = await EconomyService.processAutomaticIncome(userId);
            
            // Get user's devil fruits count
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            const uniqueFruits = new Set(fruits.map(f => f.fruit_id)).size;
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`💰 ${targetUser.username}'s Pirate Wallet`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: '🍓 Berry Balance',
                        value: `**${balance.toLocaleString()} Berries**`,
                        inline: true
                    },
                    {
                        name: '⚡ Combat Power',
                        value: `**${user.total_cp.toLocaleString()} CP**`,
                        inline: true
                    },
                    {
                        name: '🍈 Devil Fruits',
                        value: `**${fruits.length}** total\n**${uniqueFruits}** unique`,
                        inline: true
                    }
                );

            // Income display based on fruit count
            if (incomeDisplayInfo.fruitCount === 0) {
                embed.addFields({
                    name: '💵 Income Status',
                    value: `❌ **No Income**\nYou need Devil Fruits to earn berries!\n\n📈 **Earning Potential:**\n• 1-4 fruits: Proportional income\n• 5+ fruits: **${incomeDisplayInfo.maxPossible.toLocaleString()} berries/hour**`,
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '💵 Income Per Hour',
                    value: `**${incomeDisplayInfo.hourlyIncome.toLocaleString()} Berries/hour**\n\n${incomeDisplayInfo.statusText}\n\n📊 **Based on:** ${incomeDisplayInfo.fruitCount} Devil Fruit${incomeDisplayInfo.fruitCount !== 1 ? 's' : ''}`,
                    inline: true
                });
            }

            embed.addFields({
                name: '📊 Statistics',
                value: `Total Earned: **${user.total_earned.toLocaleString()}**\n` +
                       `Total Spent: **${user.total_spent.toLocaleString()}**\n` +
                       `Level: **${user.level}**`,
                inline: true
            });
            
            // Add automatic income info if available
            if (automaticIncome && automaticIncome.total > 0) {
                embed.addFields({
                    name: '✨ Automatic Income Collected!',
                    value: `You earned **${automaticIncome.total.toLocaleString()} Berries** ` +
                           `from ${automaticIncome.periods} periods ` +
                           `(${automaticIncome.hoursAccumulated.toFixed(1)} hours)\n` +
                           `📈 **Rate:** ${automaticIncome.hourlyRate.toLocaleString()} berries/hour`,
                    inline: false
                });
            }

            // Footer message
            let footerText = '/income to collect berries • /summon to get Devil Fruits';
            if (incomeDisplayInfo.fruitCount === 0) {
                footerText = '🍈 Get Devil Fruits with /summon to start earning income!';
            } else if (incomeDisplayInfo.fruitCount < 5) {
                const needed = 5 - incomeDisplayInfo.fruitCount;
                footerText = `🍈 Get ${needed} more Devil Fruit${needed > 1 ? 's' : ''} to maximize your income!`;
            }
            
            embed.setFooter({ text: footerText })
                 .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Balance command error:', error);
            
            const errorMessage = '❌ An error occurred while checking the balance.';
            
            try {
                await interaction.reply({
                    content: errorMessage,
                    flags: MessageFlags.Ephemeral
                });
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
                await emergencySafeReply(interaction, errorMessage, true);
            }
        }
    }
};
