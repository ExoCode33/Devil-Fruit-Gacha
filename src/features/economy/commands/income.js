// src/features/economy/commands/income.js - FINAL FIXED: Complete implementation handling wrapped interactions
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const EconomyService = require('../app/EconomyService');
const DatabaseManager = require('../../../shared/db/DatabaseManager');

// FINAL VALIDATION FUNCTIONS - HANDLES WRAPPED INTERACTIONS
function validateInteraction(interactionWrapper) {
    // Level 0: Check if we have a wrapper object
    if (!interactionWrapper) {
        console.error('EMERGENCY: InteractionWrapper is null/undefined');
        return { valid: false, reason: 'null_wrapper', interaction: null };
    }
    
    // Level 1: Extract actual interaction from wrapper
    let interaction = interactionWrapper;
    
    // Check if this is a wrapped interaction (from CommandManager)
    if (interactionWrapper.interaction && typeof interactionWrapper.interaction === 'object') {
        interaction = interactionWrapper.interaction;
        console.log('DETECTED: Wrapped interaction from CommandManager');
    }
    
    // Level 2: Check if interaction exists
    if (!interaction) {
        console.error('EMERGENCY: Interaction is null/undefined after unwrapping');
        return { valid: false, reason: 'null_interaction', interaction: null };
    }
    
    // Level 3: Check if interaction has basic structure
    if (typeof interaction !== 'object') {
        console.error('EMERGENCY: Interaction is not an object', { type: typeof interaction });
        return { valid: false, reason: 'invalid_type', interaction: null };
    }
    
    // Level 4: Check if interaction has reply function
    if (typeof interaction.reply !== 'function') {
        console.error('EMERGENCY: Interaction missing reply function', {
            hasReply: !!interaction.reply,
            hasUser: !!interaction.user,
            hasId: !!interaction.id,
            keys: Object.keys(interaction)
        });
        return { valid: false, reason: 'missing_reply', interaction: null };
    }
    
    // Level 5: Check if interaction has user
    if (!interaction.user) {
        console.error('EMERGENCY: Interaction missing user', {
            id: interaction.id,
            type: interaction.type,
            commandName: interaction.commandName,
            hasUser: !!interaction.user
        });
        return { valid: false, reason: 'missing_user', interaction: null };
    }
    
    // Level 6: Check if user has id
    if (!interaction.user.id) {
        console.error('EMERGENCY: User missing id', {
            user: interaction.user,
            userId: interaction.user.id
        });
        return { valid: false, reason: 'missing_user_id', interaction: null };
    }
    
    return { valid: true, interaction: interaction };
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
        .setName('income')
        .setDescription('💵 Collect your manual income with a bonus multiplier!'),
    
    category: 'economy',
    cooldown: 3,
    
    async execute(interactionWrapper) {
        // FINAL: Complete interaction validation with wrapper handling
        const validation = validateInteraction(interactionWrapper);
        if (!validation.valid) {
            console.error(`EMERGENCY: Invalid interaction - ${validation.reason}`);
            
            // Try to send error response only if we have basic interaction structure
            if (validation.interaction && validation.reason !== 'null_wrapper' && validation.reason !== 'null_interaction') {
                await emergencySafeReply(validation.interaction, '❌ System error: Invalid interaction. Please try again.', true);
            }
            return;
        }
        
        // Extract the actual interaction
        const interaction = validation.interaction;
        
        // Safe user ID extraction (now guaranteed to exist)
        const userId = interaction.user.id;
        const username = interaction.user.username || 'Unknown';
        const guildId = interaction.guildId || interaction.guild?.id || null;
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, guildId);
            
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
                    
                    return interaction.reply({ 
                        embeds: [embed], 
                        flags: MessageFlags.Ephemeral 
                    });
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
                    
                    return interaction.reply({ 
                        embeds: [embed], 
                        flags: MessageFlags.Ephemeral 
                    });
                }
                
                // Other error
                return interaction.reply({
                    content: `❌ Failed to process income: ${manualResult.error || 'Unknown error'}`,
                    flags: MessageFlags.Ephemeral
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
            console.error('Income command error:', error);
            
            const errorMessage = '❌ An error occurred while processing your income.';
            
            try {
                if (error.message === 'Insufficient berries') {
                    await interaction.reply({
                        content: '❌ An unexpected error occurred with your balance.',
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: errorMessage,
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
                await emergencySafeReply(interaction, errorMessage, true);
            }
        }
    }
};
