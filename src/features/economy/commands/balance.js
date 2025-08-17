// src/features/economy/commands/balance.js - FIXED: Complete implementation with proper safety checks
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const EconomyService = require('../app/EconomyService');
const DatabaseManager = require('../../../shared/db/DatabaseManager');

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
        // CRITICAL: Validate interaction and user first
        if (!interaction) {
            console.error('CRITICAL: Interaction is undefined');
            return;
        }
        
        if (!interaction.user) {
            console.error('CRITICAL: interaction.user is undefined', {
                interactionId: interaction.id,
                type: interaction.type,
                commandName: interaction.commandName
            });
            
            try {
                await interaction.reply({
                    content: '❌ User identification failed. Please try the command again.',
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error('Failed to send error response:', error);
            }
            return;
        }
        
        // Safe user extraction
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Additional safety check for targetUser
        if (!targetUser || !targetUser.id) {
            console.error('CRITICAL: targetUser is invalid', {
                targetUser,
                hasUser: !!interaction.user,
                optionsUser: interaction.options.getUser('user')
            });
            
            try {
                await interaction.reply({
                    content: '❌ Unable to identify the target user. Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error('Failed to send error response:', error);
            }
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
            interaction.client.logger?.error('Balance command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while checking the balance.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
