// src/features/pvp/commands/pvp-raid.js - FIXED: Clean PvP raid command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../../shared/db/DatabaseManager');
const EconomyService = require('../../economy/app/EconomyService');
const Constants = require('../../../shared/constants/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('🏴‍☠️ Challenge other pirates to battle!')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('The pirate you want to challenge')
                .setRequired(false)
        ),
    
    category: 'pvp',
    cooldown: 10,
    
    async execute(interaction) {
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(
                interaction.user.id, 
                interaction.user.username, 
                interaction.guildId
            );

            const opponent = interaction.options.getUser('opponent');
            
            if (opponent) {
                // Challenge specific user
                await this.handleDirectChallenge(interaction, opponent);
            } else {
                // Show PvP menu
                await this.showPvPMenu(interaction);
            }

        } catch (error) {
            console.error('PvP raid command error:', error);
            await interaction.reply({
                content: '❌ An error occurred with the PvP system.',
                ephemeral: true
            });
        }
    },

    /**
     * Show main PvP menu
     */
    async showPvPMenu(interaction) {
        // Get user's stats
        const user = await DatabaseManager.getUser(interaction.user.id);
        const fruits = await DatabaseManager.getUserDevilFruits(interaction.user.id);
        const balance = await EconomyService.getBalance(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🏴‍☠️ PvP Battle Arena')
            .setDescription('Welcome to the Grand Line Battle Arena! Choose your battle mode:')
            .addFields(
                {
                    name: '⚔️ Your Battle Stats',
                    value: [
                        `💪 **Combat Power:** ${user.total_cp.toLocaleString()} CP`,
                        `🍈 **Devil Fruits:** ${fruits.length}`,
                        `🍓 **Berries:** ${balance.toLocaleString()}`,
                        `📊 **Level:** ${user.level}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 Battle Modes',
                    value: [
                        '🤺 **Quick Match** - Find random opponent',
                        '👥 **Challenge Player** - Battle specific pirate',
                        '🏆 **Ranked Battle** - Compete for rankings',
                        '📊 **Battle History** - View past battles'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎁 Battle Rewards',
                    value: [
                        '🍓 **Berries** based on performance',
                        '⭐ **Experience Points** for leveling',
                        '🏆 **Ranking Points** in ranked mode',
                        '🎖️ **Battle Achievements**'
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: 'Choose your battle strategy wisely!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_quick_${interaction.user.id}`)
                    .setLabel('⚔️ Quick Match')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`pvp_challenge_${interaction.user.id}`)
                    .setLabel('👥 Challenge Player')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`pvp_ranked_${interaction.user.id}`)
                    .setLabel('🏆 Ranked Battle')
                    .setStyle(ButtonStyle.Success)
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_history_${interaction.user.id}`)
                    .setLabel('📊 Battle History')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`pvp_training_${interaction.user.id}`)
                    .setLabel('🎯 Training Mode')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`pvp_cancel_${interaction.user.id}`)
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [actionRow, secondRow] 
        });

        // Setup collector
        await this.setupPvPCollector(interaction);
    },

    /**
     * Handle direct challenge to specific user
     */
    async handleDirectChallenge(interaction, opponent) {
        if (opponent.bot) {
            return await interaction.reply({
                content: '❌ You cannot challenge bots to battle!',
                ephemeral: true
            });
        }

        if (opponent.id === interaction.user.id) {
            return await interaction.reply({
                content: '❌ You cannot challenge yourself to battle!',
                ephemeral: true
            });
        }

        // Ensure opponent exists in database
        await DatabaseManager.ensureUser(opponent.id, opponent.username, interaction.guildId);

        // Get both users' stats
        const challenger = await DatabaseManager.getUser(interaction.user.id);
        const challengedUser = await DatabaseManager.getUser(opponent.id);
        const challengerFruits = await DatabaseManager.getUserDevilFruits(interaction.user.id);
        const opponentFruits = await DatabaseManager.getUserDevilFruits(opponent.id);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('⚔️ Battle Challenge Issued!')
            .setDescription(`${interaction.user.username} has challenged ${opponent.username} to a Devil Fruit battle!`)
            .addFields(
                {
                    name: `🏴‍☠️ ${interaction.user.username} (Challenger)`,
                    value: [
                        `💪 **CP:** ${challenger.total_cp.toLocaleString()}`,
                        `🍈 **Fruits:** ${challengerFruits.length}`,
                        `📊 **Level:** ${challenger.level}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️',
                    value: '**VS**',
                    inline: true
                },
                {
                    name: `🏴‍☠️ ${opponent.username} (Challenged)`,
                    value: [
                        `💪 **CP:** ${challengedUser.total_cp.toLocaleString()}`,
                        `🍈 **Fruits:** ${opponentFruits.length}`,
                        `📊 **Level:** ${challengedUser.level}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎁 Battle Stakes',
                    value: [
                        '🍓 **Winner:** 500-1000 Berries',
                        '⭐ **Both:** Experience Points',
                        '🏆 **Ranking:** Points based on outcome'
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: `${opponent.username} has 60 seconds to respond` })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${interaction.user.id}_${opponent.id}`)
                    .setLabel('✅ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${interaction.user.id}_${opponent.id}`)
                    .setLabel('❌ Decline Challenge')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({ 
            content: `${opponent}, you have been challenged to a battle!`,
            embeds: [embed], 
            components: [actionRow] 
        });

        // Setup challenge response collector
        await this.setupChallengeCollector(interaction, opponent);
    },

    /**
     * Setup PvP menu collector
     */
    async setupPvPCollector(interaction) {
        const message = await interaction.fetchReply();
        const userId = interaction.user.id;
        
        const collector = message.createMessageComponentCollector({ 
            time: 300000, // 5 minutes
            filter: (i) => i.user.id === userId
        });
        
        collector.on('collect', async (i) => {
            try {
                if (i.customId.startsWith('pvp_quick_')) {
                    await this.handleQuickMatch(i);
                } else if (i.customId.startsWith('pvp_challenge_')) {
                    await this.handleChallengeMode(i);
                } else if (i.customId.startsWith('pvp_ranked_')) {
                    await this.handleRankedBattle(i);
                } else if (i.customId.startsWith('pvp_history_')) {
                    await this.handleBattleHistory(i);
                } else if (i.customId.startsWith('pvp_training_')) {
                    await this.handleTrainingMode(i);
                } else if (i.customId.startsWith('pvp_cancel_')) {
                    await this.handleCancel(i);
                    collector.stop();
                }
            } catch (error) {
                console.error('PvP collector error:', error);
                await i.reply({
                    content: '❌ An error occurred processing your selection.',
                    ephemeral: true
                });
            }
        });
        
        collector.on('end', () => {
            // Disable buttons when collector expires
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },

    /**
     * Setup challenge response collector
     */
    async setupChallengeCollector(interaction, opponent) {
        const message = await interaction.fetchReply();
        
        const collector = message.createMessageComponentCollector({ 
            time: 60000, // 1 minute
            filter: (i) => i.user.id === opponent.id
        });
        
        collector.on('collect', async (i) => {
            try {
                if (i.customId.startsWith('pvp_accept_')) {
                    await this.handleChallengeAccepted(i);
                } else if (i.customId.startsWith('pvp_decline_')) {
                    await this.handleChallengeDeclined(i);
                }
                collector.stop();
            } catch (error) {
                console.error('Challenge collector error:', error);
                await i.reply({
                    content: '❌ An error occurred processing the challenge response.',
                    ephemeral: true
                });
            }
        });
        
        collector.on('end', (collected) => {
            if (collected.size === 0) {
                // Challenge expired
                const expiredEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('⏰ Challenge Expired')
                    .setDescription(`${opponent.username} did not respond to the challenge in time.`)
                    .setFooter({ text: 'Challenge automatically declined' });

                interaction.editReply({ 
                    content: '',
                    embeds: [expiredEmbed], 
                    components: [] 
                }).catch(() => {});
            }
        });
    },

    async handleQuickMatch(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('🔍 Finding Opponent...')
            .setDescription('Searching for a worthy opponent on the Grand Line...')
            .setFooter({ text: 'This feature is currently under development!' });

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleChallengeMode(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('👥 Challenge Mode')
            .setDescription('Use `/pvp-raid @user` to challenge a specific pirate to battle!')
            .addFields({
                name: '💡 How to Challenge',
                value: '• Use the slash command with an @mention\n• Wait for them to accept or decline\n• Battle begins once accepted!',
                inline: false
            })
            .setFooter({ text: 'Example: /pvp-raid opponent:@username' });

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleRankedBattle(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Ranked Battle')
            .setDescription('Compete in ranked battles to climb the leaderboards!')
            .setFooter({ text: 'Ranked battles coming soon!' });

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleBattleHistory(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#6A0DAD')
            .setTitle('📊 Battle History')
            .setDescription('View your past battles and statistics!')
            .addFields({
                name: '🚧 Coming Soon',
                value: '• Win/Loss record\n• Battle replays\n• Performance stats\n• Opponent history',
                inline: false
            })
            .setFooter({ text: 'Battle tracking system in development!' });

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleTrainingMode(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00CED1')
            .setTitle('🎯 Training Mode')
            .setDescription('Practice your Devil Fruit abilities against AI opponents!')
            .setFooter({ text: 'Training mode coming soon!' });

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleCancel(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('❌ PvP Menu Closed')
            .setDescription('Return to the battle arena anytime!')
            .setFooter({ text: 'Use /pvp-raid to battle again!' });

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleChallengeAccepted(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Challenge Accepted!')
            .setDescription('The battle will begin soon!')
            .addFields({
                name: '⚔️ Battle System',
                value: '• Turn-based Devil Fruit combat\n• Use your fruits\' unique abilities\n• Strategic timing is key!',
                inline: false
            })
            .setFooter({ text: 'Full battle system coming in the next update!' });

        await interaction.update({ 
            content: 'Battle accepted! Preparing for combat...',
            embeds: [embed], 
            components: [] 
        });
    },

    async handleChallengeDeclined(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Challenge Declined')
            .setDescription(`${interaction.user.username} has declined the battle.`)
            .setFooter({ text: 'Maybe next time!' });

        await interaction.update({ 
            content: '',
            embeds: [embed], 
            components: [] 
        });
    }
};
