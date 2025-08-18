// src/features/admin/commands/admin-setup.js - Complete admin setup helper
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-admin')
        .setDescription('🔧 Get setup instructions for admin commands')
        .addBooleanOption(option =>
            option.setName('show_server_users')
                .setDescription('Show user IDs for this server (for setting up multiple admins)')
                .setRequired(false)
        ),
    
    category: 'admin',
    cooldown: 10,

    async execute(interaction) {
        try {
            const showServerUsers = interaction.options.getBoolean('show_server_users') || false;
            const currentAdmins = process.env.ADMIN_USERS || '';
            const isCurrentlyAdmin = currentAdmins.includes(interaction.user.id);
            
            const embed = new EmbedBuilder()
                .setColor(isCurrentlyAdmin ? '#00FF00' : '#FF6B6B')
                .setTitle('🔧 Admin Setup Guide')
                .setDescription('Follow these steps to set up admin access for the bot.')
                .addFields([
                    {
                        name: '👤 Your Discord User ID',
                        value: `\`${interaction.user.id}\``,
                        inline: false
                    },
                    {
                        name: isCurrentlyAdmin ? '✅ Current Admin Status' : '❌ Current Admin Status',
                        value: isCurrentlyAdmin ? 
                            'You are already configured as an admin!' : 
                            'You are **not** configured as an admin yet.',
                        inline: false
                    },
                    {
                        name: '⚙️ Current Admin Configuration',
                        value: currentAdmins ? 
                            `\`\`\`${currentAdmins}\`\`\`` : 
                            '```\nNo admins configured\n```',
                        inline: false
                    }
                ])
                .setFooter({ text: 'Copy your User ID and follow the setup steps below' })
                .setTimestamp();

            // Add setup instructions
            embed.addFields({
                name: '📝 Setup Steps for Railway',
                value: [
                    '**1.** Go to your Railway project dashboard',
                    '**2.** Click on your bot service',
                    '**3.** Navigate to the **"Variables"** tab',
                    '**4.** Add/Edit the environment variable:',
                    '   • **Name:** `ADMIN_USERS`',
                    `   • **Value:** \`${interaction.user.id}\``,
                    '**5.** Click **"Save"** or **"Update"**',
                    '**6.** Your bot will automatically redeploy',
                    '**7.** Wait for deployment to complete',
                    '**8.** Test with `/admin-gacha` command'
                ].join('\n'),
                inline: false
            });

            // Add multiple admins info
            embed.addFields({
                name: '👥 Setting Up Multiple Admins',
                value: [
                    'To add multiple admin users, use comma-separated values:',
                    '```',
                    'ADMIN_USERS=123456789012345678,987654321098765432,555666777888999000',
                    '```',
                    '**Format:** `user1_id,user2_id,user3_id`',
                    '**Note:** No spaces between commas and IDs'
                ].join('\n'),
                inline: false
            });

            // Add troubleshooting
            embed.addFields({
                name: '🔧 Troubleshooting',
                value: [
                    '• **Command not working?** Check that your User ID is in ADMIN_USERS',
                    '• **Bot not responding?** Make sure the bot redeployed after variable change',
                    '• **Still issues?** Try removing and re-adding the environment variable',
                    '• **Multiple admins?** Ensure no spaces in the comma-separated list'
                ].join('\n'),
                inline: false
            });

            // Show server users if requested
            if (showServerUsers && interaction.guild) {
                try {
                    // Get some members from the guild (limited to prevent spam)
                    const members = interaction.guild.members.cache
                        .filter(member => !member.user.bot && member.user.id !== interaction.user.id)
                        .first(8) // Show max 8 additional users
                        .map(member => `**${member.user.username}:** \`${member.user.id}\``);

                    if (members.length > 0) {
                        embed.addFields({
                            name: '👥 Other Server Users (Non-Bots)',
                            value: members.join('\n'),
                            inline: false
                        });
                    }
                } catch (error) {
                    // Silently fail if we can't get members
                }
            }

            // Add available admin commands preview
            embed.addFields({
                name: '🎮 Available Admin Commands',
                value: [
                    '`/admin-gacha add_berries` - Give berries to users',
                    '`/admin-gacha remove_berries` - Remove berries from users', 
                    '`/admin-gacha set_berries` - Set exact berry amount',
                    '`/admin-gacha user_info` - Get detailed user information',
                    '`/admin-gacha server_stats` - View server statistics',
                    '`/admin-gacha reset_user` - Reset a user\'s data (destructive)',
                    '`/admin-gacha wipe_database` - Wipe all data (very destructive)'
                ].join('\n'),
                inline: false
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Setup admin command error:', error);
            
            // Fallback response if embed fails
            const fallbackMessage = [
                '🔧 **Admin Setup Information**',
                '',
                `**Your User ID:** \`${interaction.user.id}\``,
                '',
                '**Setup Steps:**',
                '1. Go to Railway project dashboard',
                '2. Click your bot service → Variables tab',
                '3. Add ADMIN_USERS variable',
                `4. Set value to: \`${interaction.user.id}\``,
                '5. Save and wait for redeploy',
                '6. Test with `/admin-gacha` command',
                '',
                '**Multiple admins:** Use comma-separated values',
                '**Example:** `123,456,789`'
            ].join('\n');

            await interaction.reply({
                content: fallbackMessage,
                ephemeral: true
            });
        }
    }
};
