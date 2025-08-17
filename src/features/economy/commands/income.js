// src/commands/slash/economy/income.js - UPDATED: New Fruit-Based Income System
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('income')
        .setDescription('💵 Collect your manual income with a bonus multiplier!'),
    
    category: 'economy',
    cooldown: 3,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            // Ensure user exists (now automatically gives starting berries)
            await DatabaseManager.ensureUser(userId, interaction.user.username, interaction.guildId);
            
            // Process automatic income first
            const automaticIncome = await EconomyService.processAutomaticIncome(userId);
            
            // Try to process manual income
            const manualResult = await EconomyService.processManualIncome(userId);
            
            if (!manualResult.success) {
                // Manual income on cooldown or error
                if (manualResult.cooldown) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF8000')
                        .setTitle('⏰ Manual Income on Cooldown')
                        .setDescription(`You can collect manual income again in **${manualResult.cooldown} seconds**.`)
                        .addFields({
                            name: '💡 Income Tips',
                            value: '• Automatic income is always collecting in the background!\n' +
                                   '• Get more Devil Fruits to increase your income rate\n' +
                                   '• Check your balance with `/balance` to see accumulated income',
                            inline: false
                        })
                        .setFooter({ text: 'Manual income has a higher multiplier but requires waiting!' });
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
                
                // Error - likely no Devil Fruits
                if (manualResult.error) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ No Income Available')
                        .setDescription(manualResult.error)
                        .addFields({
                            name: '🍈 How to Start Earning',
                            value: '1. Use `/summon` to get Devil Fruits\n' +
                                   '2. Each Devil Fruit increases your income\n' +
                                   '3. 5+ Devil Fruits = Maximum income rate (6,250 berries/hour)\n' +
                                   '4. Come back every hour to collect with bonuses!',
                            inline: false
                        })
                        .setFooter({ text: 'Start your pirate journey by summoning Devil Fruits!' });
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
                
                // Other error
                return interaction.reply({
                    content: `❌ Failed to process income: ${manualResult.error || 'Unknown error'}`,
                    ephemeral: true
                });
            }
            
            // Success! Show income collected
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('💰 Income Collected!')
                .setDescription(`You earned **${manualResult.income.toLocaleString()} Berries**!`)
                .addFields(
                    {
                        name: '📈 Manual Income Details',
                        value: `Base Income: **${manualResult.baseIncome.toLocaleString()}** per period\n` +
                               `Multiplier: **x${manualResult.multiplier}**\n` +
                               `Total Earned: **${manualResult.income.toLocaleString()} Berries**`,
                        inline: true
                    },
                    {
                        name: '🍈 Your Devil Fruits',
                        value: `Count: **${manualResult.fruitCount}**\n` +
                               `Hourly Rate: **${manualResult.hourlyRate.toLocaleString()} berries/hour**\n` +
                               `Status: ${manualResult.fruitCount >= 5 ? '✅ Maximum rate!' : `📈 Need ${5 - manualResult.fruitCount} more for max`}`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Come back in 60 seconds for more manual income!' })
                .setTimestamp();
            
            // Add automatic income info if any was collected
            if (automaticIncome && automaticIncome.total > 0) {
                embed.addFields({
                    name: '✨ Bonus: Automatic Income Collected!',
                    value: `You also earned **${automaticIncome.total.toLocaleString()} Berries** ` +
                           `from ${automaticIncome.periods} periods of automatic income!`,
                    inline: false
                });
                
                embed.setDescription(
                    `You earned **${(manualResult.income + automaticIncome.total).toLocaleString()} Berries** total!`
                );
            }
            
            // Add income progression info if not at maximum
            if (manualResult.fruitCount < 5) {
                const needed = 5 - manualResult.fruitCount;
                const maxIncome = 6250; // From config
                
                embed.addFields({
                    name: '🚀 Income Progression',
                    value: `Get **${needed} more Devil Fruit${needed > 1 ? 's' : ''}** to reach maximum income!\n` +
                           `🎯 **Maximum:** ${maxIncome.toLocaleString()} berries/hour\n` +
                           `📊 **Current:** ${manualResult.hourlyRate.toLocaleString()} berries/hour (${Math.round((manualResult.hourlyRate / maxIncome) * 100)}%)`,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '🏆 Maximum Income Achieved!',
                    value: 'You have reached the maximum income rate with 5+ Devil Fruits!\n' +
                           '✨ Keep collecting rare fruits to build your collection!',
                    inline: false
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            interaction.client.logger.error('Income command error:', error);
            
            if (error.message === 'Insufficient berries') {
                await interaction.reply({
                    content: '❌ An unexpected error occurred with your balance.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while processing your income.',
                    ephemeral: true
                });
            }
        }
    }
};
