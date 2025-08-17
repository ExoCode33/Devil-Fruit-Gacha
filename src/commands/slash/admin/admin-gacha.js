// src/commands/slash/admin/admin-gacha.js - SIMPLE: Direct Environment Variable Check
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-gacha')
        .setDescription('🔧 Admin commands for gacha server management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add_berries')
                .setDescription('💰 Add berries to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to give berries to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of berries to add')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_berries')
                .setDescription('💸 Remove berries from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove berries from')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of berries to remove')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_berries')
                .setDescription('🎯 Set a user\'s berry balance')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to set berries for')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to set berries to')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user_info')
                .setDescription('📊 Get detailed user information')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to get info for')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server_stats')
                .setDescription('📈 Get server statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset_user')
                .setDescription('🔄 Reset a user\'s data')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to reset')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('confirmation')
                        .setDescription('Type "CONFIRM RESET" to proceed')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('wipe_database')
                .setDescription('🗑️ Wipe the entire database (DANGEROUS)')
                .addStringOption(option =>
                    option.setName('confirmation')
                        .setDescription('Type "CONFIRM WIPE" to proceed')
                        .setRequired(true)
                )
        ),
    
    category: 'admin',
    adminOnly: true,
    cooldown: 5,

    async execute(interaction) {
        try {
            // SIMPLE: Just check if user ID is in ADMIN_USERS environment variable
            const adminUsers = process.env.ADMIN_USERS || '';
            const userId = interaction.user.id;
            
            if (!adminUsers.includes(userId)) {
                return await interaction.reply({ 
                    content: `❌ You need Administrator permissions to use this command!\n\nYour ID: \`${userId}\`\nAdmin Users: \`${adminUsers}\``, 
                    ephemeral: true 
                });
            }

            const subcommand = interaction.options.getSubcommand();
            
            // Defer reply for potentially long operations
            await interaction.deferReply();
            
            switch (subcommand) {
                case 'add_berries':
                    await this.handleAddBerries(interaction);
                    break;
                case 'remove_berries':
                    await this.handleRemoveBerries(interaction);
                    break;
                case 'set_berries':
                    await this.handleSetBerries(interaction);
                    break;
                case 'user_info':
                    await this.handleUserInfo(interaction);
                    break;
                case 'server_stats':
                    await this.handleServerStats(interaction);
                    break;
                case 'reset_user':
                    await this.handleResetUser(interaction);
                    break;
                case 'wipe_database':
                    await this.handleWipeDatabase(interaction);
                    break;
                default:
                    await interaction.editReply({ content: '❌ Unknown command!' });
            }
            
        } catch (error) {
            interaction.client.logger.error('Error in admin-gacha command:', error);
            
            const errorMessage = {
                content: '❌ An error occurred while executing the admin command!',
                ephemeral: true
            };
            
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    async handleAddBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (targetUser.bot) {
            return await interaction.editReply({ content: '❌ Cannot give berries to bots!' });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await EconomyService.getBalance(targetUser.id);
            
            // Add berries using EconomyService
            const newBalance = await EconomyService.addBerries(targetUser.id, amount, 'admin_addition');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Berries Added Successfully')
                .setDescription(`Added **${amount.toLocaleString()}** 🍓 berries to ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
                    { name: '💰 Amount Added', value: `${amount.toLocaleString()} 🍓`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()} 🍓`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()} 🍓`, inline: true },
                    { name: '👑 Admin', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '⏰ Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - Add Berries' });
            
            await interaction.editReply({ embeds: [embed] });
            interaction.client.logger.info(`🔧 ADMIN: ${interaction.user.username} added ${amount} berries to ${targetUser.username}`);
            
        } catch (error) {
            interaction.client.logger.error('Error adding berries:', error);
            await interaction.editReply({ content: '❌ Failed to add berries! Check the logs for details.' });
        }
    },

    async handleRemoveBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (targetUser.bot) {
            return await interaction.editReply({ content: '❌ Cannot remove berries from bots!' });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await EconomyService.getBalance(targetUser.id);
            
            if (currentBerries < amount) {
                return await interaction.editReply({ 
                    content: `❌ ${targetUser.username} only has **${currentBerries.toLocaleString()}** 🍓 berries!`
                });
            }
            
            // Remove berries using EconomyService
            const newBalance = await EconomyService.deductBerries(targetUser.id, amount, 'admin_removal');
            
            const embed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle('✅ Berries Removed Successfully')
                .setDescription(`Removed **${amount.toLocaleString()}** 🍓 berries from ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
                    { name: '💸 Amount Removed', value: `${amount.toLocaleString()} 🍓`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()} 🍓`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()} 🍓`, inline: true },
                    { name: '👑 Admin', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '⏰ Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - Remove Berries' });
            
            await interaction.editReply({ embeds: [embed] });
            interaction.client.logger.info(`🔧 ADMIN: ${interaction.user.username} removed ${amount} berries from ${targetUser.username}`);
            
        } catch (error) {
            interaction.client.logger.error('Error removing berries:', error);
            await interaction.editReply({ content: '❌ Failed to remove berries! Check the logs for details.' });
        }
    },

    async handleSetBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (targetUser.bot) {
            return await interaction.editReply({ content: '❌ Cannot set berries for bots!' });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await EconomyService.getBalance(targetUser.id);
            const difference = amount - currentBerries;
            
            // Set berries by calculating difference
            let newBalance;
            if (difference > 0) {
                newBalance = await EconomyService.addBerries(targetUser.id, difference, 'admin_set_balance');
            } else if (difference < 0) {
                newBalance = await EconomyService.deductBerries(targetUser.id, Math.abs(difference), 'admin_set_balance');
            } else {
                newBalance = currentBerries; // No change needed
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0080FF)
                .setTitle('✅ Berry Balance Set Successfully')
                .setDescription(`Set ${targetUser.username}'s berry balance to **${amount.toLocaleString()}** 🍓`)
                .addFields([
                    { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
                    { name: '🎯 Set Amount', value: `${amount.toLocaleString()} 🍓`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()} 🍓`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()} 🍓`, inline: true },
                    { name: '📈 Difference', value: `${difference > 0 ? '+' : ''}${difference.toLocaleString()} 🍓`, inline: true },
                    { name: '👑 Admin', value: `<@${interaction.user.id}>`, inline: true }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - Set Balance' });
            
            await interaction.editReply({ embeds: [embed] });
            interaction.client.logger.info(`🔧 ADMIN: ${interaction.user.username} set ${targetUser.username}'s berries to ${amount}`);
            
        } catch (error) {
            interaction.client.logger.error('Error setting berries:', error);
            await interaction.editReply({ content: '❌ Failed to set berries! Check the logs for details.' });
        }
    },

    async handleUserInfo(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get comprehensive user data
            const user = await DatabaseManager.getUser(targetUser.id);
            const balance = await EconomyService.getBalance(targetUser.id);
            const fruits = await DatabaseManager.getUserDevilFruits(targetUser.id);
            const incomeData = await EconomyService.calculateIncome(targetUser.id);
            
            // Calculate unique fruits
            const uniqueFruits = new Set(fruits.map(f => f.fruit_id)).size;
            
            // Group fruits by rarity
            const rarityCount = {};
            fruits.forEach(fruit => {
                rarityCount[fruit.fruit_rarity] = (rarityCount[fruit.fruit_rarity] || 0) + 1;
            });
            
            const embed = new EmbedBuilder()
                .setColor(0x00FFFF)
                .setTitle(`📊 User Information: ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields([
                    { name: '👤 User ID', value: targetUser.id, inline: true },
                    { name: '🍓 Berry Balance', value: `${balance.toLocaleString()}`, inline: true },
                    { name: '⚡ Total CP', value: `${user.total_cp.toLocaleString()}`, inline: true },
                    { name: '📈 Level', value: `${user.level}`, inline: true },
                    { name: '🍈 Total Fruits', value: `${fruits.length}`, inline: true },
                    { name: '✨ Unique Fruits', value: `${uniqueFruits}`, inline: true },
                    { name: '💰 Total Earned', value: `${user.total_earned.toLocaleString()}`, inline: true },
                    { name: '💸 Total Spent', value: `${user.total_spent.toLocaleString()}`, inline: true },
                    { name: '💵 Income/Hour', value: `${(incomeData.total * 6).toLocaleString()}`, inline: true },
                    { name: '📅 Created', value: `<t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:R>`, inline: true },
                    { name: '🔄 Last Updated', value: `<t:${Math.floor(new Date(user.updated_at).getTime() / 1000)}:R>`, inline: true },
                    { name: '⏰ Last Income', value: `<t:${Math.floor(new Date(user.last_income).getTime() / 1000)}:R>`, inline: true }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - User Info' });
            
            // Add rarity breakdown if user has fruits
            if (Object.keys(rarityCount).length > 0) {
                const rarityBreakdown = Object.entries(rarityCount)
                    .map(([rarity, count]) => `${rarity}: ${count}`)
                    .join('\n');
                
                embed.addFields({ name: '🌟 Fruit Rarities', value: rarityBreakdown, inline: false });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            interaction.client.logger.error('Error getting user info:', error);
            await interaction.editReply({ content: '❌ Failed to get user information! Check the logs for details.' });
        }
    },

    async handleServerStats(interaction) {
        try {
            const stats = await DatabaseManager.getServerStats();
            const economyStats = await EconomyService.getEconomyStats();
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📈 Server Statistics')
                .addFields([
                    { name: '👥 Total Users', value: `${stats.totalUsers.toLocaleString()}`, inline: true },
                    { name: '🍈 Total Fruits', value: `${stats.totalFruits.toLocaleString()}`, inline: true },
                    { name: '🍓 Total Berries', value: `${stats.totalBerries.toLocaleString()}`, inline: true },
                    { name: '💰 Total Earned', value: `${economyStats.totalEarned.toLocaleString()}`, inline: true },
                    { name: '💸 Total Spent', value: `${economyStats.totalSpent.toLocaleString()}`, inline: true },
                    { name: '📊 Average Balance', value: `${economyStats.avgBerries.toLocaleString()}`, inline: true },
                    { name: '💎 Highest Balance', value: `${economyStats.maxBerries.toLocaleString()}`, inline: true },
                    { name: '🏴‍☠️ Bot Guilds', value: `${interaction.client.guilds.cache.size}`, inline: true },
                    { name: '👤 Cached Users', value: `${interaction.client.users.cache.size}`, inline: true }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - Server Stats' });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            interaction.client.logger.error('Error getting server stats:', error);
            await interaction.editReply({ content: '❌ Failed to get server statistics! Check the logs for details.' });
        }
    },

    async handleResetUser(interaction) {
        const targetUser = interaction.options.getUser('user');
        const confirmation = interaction.options.getString('confirmation');
        
        if (confirmation !== 'CONFIRM RESET') {
            return await interaction.editReply({ 
                content: '❌ You must type "CONFIRM RESET" exactly to proceed with user reset!'
            });
        }
        
        if (targetUser.bot) {
            return await interaction.editReply({ content: '❌ Cannot reset bot data!' });
        }
        
        try {
            // Delete all user data
            await DatabaseManager.query('DELETE FROM income_history WHERE user_id = $1', [targetUser.id]);
            await DatabaseManager.query('DELETE FROM user_devil_fruits WHERE user_id = $1', [targetUser.id]);
            await DatabaseManager.query('DELETE FROM user_levels WHERE user_id = $1', [targetUser.id]);
            await DatabaseManager.query('DELETE FROM users WHERE user_id = $1', [targetUser.id]);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF6600)
                .setTitle('🔄 User Reset Successfully')
                .setDescription(`**${targetUser.username}'s data has been completely reset**`)
                .addFields([
                    { name: '👤 Reset User', value: `<@${targetUser.id}>`, inline: true },
                    { name: '🗑️ Data Wiped', value: '• Profile\n• Berries\n• Devil Fruits\n• Income History', inline: true },
                    { name: '👑 Admin', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '⚠️ Warning', value: 'This action cannot be undone!', inline: false }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - Reset User' });
            
            await interaction.editReply({ embeds: [embed] });
            interaction.client.logger.warn(`🚨 ADMIN: ${interaction.user.username} RESET USER ${targetUser.username}`);
            
        } catch (error) {
            interaction.client.logger.error('Error resetting user:', error);
            await interaction.editReply({ content: '❌ Failed to reset user! Check the logs for details.' });
        }
    },

    async handleWipeDatabase(interaction) {
        const confirmation = interaction.options.getString('confirmation');
        
        if (confirmation !== 'CONFIRM WIPE') {
            return await interaction.editReply({ 
                content: '❌ You must type "CONFIRM WIPE" exactly to proceed with database wipe!'
            });
        }
        
        try {
            // Wipe all user data in correct order (respecting foreign keys)
            await DatabaseManager.query('DELETE FROM command_usage');
            await DatabaseManager.query('DELETE FROM income_history');
            await DatabaseManager.query('DELETE FROM user_devil_fruits');
            await DatabaseManager.query('DELETE FROM user_levels');
            await DatabaseManager.query('DELETE FROM users');
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🗑️ Database Wiped Successfully')
                .setDescription('**ALL USER DATA HAS BEEN PERMANENTLY DELETED**')
                .addFields([
                    { name: '🔥 Wiped Tables', value: '• Users\n• Devil Fruits\n• Income History\n• User Levels\n• Command Usage', inline: true },
                    { name: '👑 Admin', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '⚠️ WARNING', value: 'This action cannot be undone!', inline: true },
                    { name: '📊 Result', value: 'Database is now completely clean', inline: false }
                ])
                .setTimestamp()
                .setFooter({ text: 'Admin Command - Database Wipe' });
            
            await interaction.editReply({ embeds: [embed] });
            interaction.client.logger.warn(`🚨 ADMIN: ${interaction.user.username} WIPED THE ENTIRE DATABASE`);
            
        } catch (error) {
            interaction.client.logger.error('Error wiping database:', error);
            await interaction.editReply({ content: '❌ Failed to wipe database! Check the logs for details.' });
        }
    }
};
