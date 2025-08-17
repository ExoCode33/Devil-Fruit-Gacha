// src/commands/slash/collection/collection.js - Devil Fruit Collection Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
const { RARITY_COLORS, RARITY_EMOJIS, PAGINATION } = require('../../../data/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('📚 View your Devil Fruit collection')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View another user\'s collection')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Filter by rarity')
                .setRequired(false)
                .addChoices(
                    { name: 'Common', value: 'common' },
                    { name: 'Uncommon', value: 'uncommon' },
                    { name: 'Rare', value: 'rare' },
                    { name: 'Epic', value: 'epic' },
                    { name: 'Legendary', value: 'legendary' },
                    { name: 'Mythical', value: 'mythical' },
                    { name: 'Divine', value: 'divine' }
                )
        ),
    
    category: 'collection',
    cooldown: 3,
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const rarityFilter = interaction.options.getString('rarity');
        const userId = targetUser.id;
        
        try {
            // Get user's devil fruits
            let fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!fruits || fruits.length === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle(`📚 ${targetUser.username}'s Collection`)
                            .setDescription('No Devil Fruits found! Use `/summon` to start collecting.')
                            .setThumbnail(targetUser.displayAvatarURL())
                    ],
                    ephemeral: true
                });
            }
            
            // Filter by rarity if specified
            if (rarityFilter) {
                fruits = fruits.filter(fruit => fruit.fruit_rarity === rarityFilter);
                
                if (fruits.length === 0) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#FF6B6B')
                                .setTitle(`📚 ${targetUser.username}'s ${rarityFilter.charAt(0).toUpperCase() + rarityFilter.slice(1)} Collection`)
                                .setDescription(`No ${rarityFilter} Devil Fruits found!`)
                                .setThumbnail(targetUser.displayAvatarURL())
                        ],
                        ephemeral: true
                    });
                }
            }
            
            // Group fruits by unique ID and count duplicates
            const fruitGroups = {};
            fruits.forEach(fruit => {
                const key = fruit.fruit_id;
                if (!fruitGroups[key]) {
                    fruitGroups[key] = {
                        ...fruit,
                        count: 0
                    };
                }
                fruitGroups[key].count++;
            });
            
            const uniqueFruits = Object.values(fruitGroups);
            
            // Sort by rarity and name
            const rarityOrder = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
            uniqueFruits.sort((a, b) => {
                const rarityA = rarityOrder.indexOf(a.fruit_rarity);
                const rarityB = rarityOrder.indexOf(b.fruit_rarity);
                
                if (rarityA !== rarityB) {
                    return rarityA - rarityB;
                }
                
                return a.fruit_name.localeCompare(b.fruit_name);
            });
            
            // Pagination
            const itemsPerPage = PAGINATION.ITEMS_PER_PAGE;
            const totalPages = Math.ceil(uniqueFruits.length / itemsPerPage);
            let currentPage = 1;
            
            const generateEmbed = (page) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageFruits = uniqueFruits.slice(start, end);
                
                const embed = new EmbedBuilder()
                    .setColor('#4A90E2')
                    .setTitle(`📚 ${targetUser.username}'s Devil Fruit Collection`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setFooter({ 
                        text: `Page ${page}/${totalPages} • ${uniqueFruits.length} unique fruits • ${fruits.length} total` 
                    })
                    .setTimestamp();
                
                if (rarityFilter) {
                    embed.setTitle(`📚 ${targetUser.username}'s ${rarityFilter.charAt(0).toUpperCase() + rarityFilter.slice(1)} Collection`);
                }
                
                // Add collection summary
                const rarityCounts = {};
                uniqueFruits.forEach(fruit => {
                    rarityCounts[fruit.fruit_rarity] = (rarityCounts[fruit.fruit_rarity] || 0) + 1;
                });
                
                let summaryText = '';
                rarityOrder.forEach(rarity => {
                    if (rarityCounts[rarity]) {
                        const emoji = RARITY_EMOJIS[rarity] || '⚪';
                        summaryText += `${emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${rarityCounts[rarity]}\n`;
                    }
                });
                
                if (summaryText) {
                    embed.addFields({
                        name: '📊 Collection Summary',
                        value: summaryText,
                        inline: true
                    });
                }
                
                // Add fruits for this page
                pageFruits.forEach((fruit, index) => {
                    // Get actual fruit data for skill information
                    const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                        f.name === fruit.fruit_name || f.id === fruit.fruit_id
                    );
                    
                    const rarityEmoji = RARITY_EMOJIS[fruit.fruit_rarity] || '⚪';
                    const multiplier = (fruit.base_cp / 100).toFixed(1);
                    const countText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    // PvP ability info
                    const skillName = actualFruit?.skill?.name || 'Unknown Ability';
                    const skillDamage = actualFruit?.skill?.damage || 50;
                    const skillCooldown = actualFruit?.skill?.cooldown || 2;
                    
                    const fieldValue = 
                        `**Type:** ${fruit.fruit_type}\n` +
                        `**CP Multiplier:** x${multiplier}\n` +
                        `**Description:** ${fruit.fruit_description}\n` +
                        `**Ability:** ${skillName} (${skillDamage} DMG, ${skillCooldown}s CD)\n` +
                        `**Total CP:** ${fruit.total_cp?.toLocaleString() || 'N/A'}`;
                    
                    embed.addFields({
                        name: `${rarityEmoji} ${fruit.fruit_name}${countText}`,
                        value: fieldValue,
                        inline: true
                    });
                });
                
                return embed;
            };
            
            const embed = generateEmbed(currentPage);
            
            // Add navigation buttons if multiple pages
            if (totalPages > 1) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('collection_first')
                            .setLabel('⏮️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('collection_prev')
                            .setLabel('⬅️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('collection_next')
                            .setLabel('➡️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages),
                        new ButtonBuilder()
                            .setCustomId('collection_last')
                            .setLabel('⏭️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages)
                    );
                
                await interaction.reply({ embeds: [embed], components: [row] });
                
                // Setup collector for pagination
                const message = await interaction.fetchReply();
                const collector = message.createMessageComponentCollector({ time: 300000 });
                
                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return buttonInteraction.reply({
                            content: '❌ You can only navigate your own collection view!',
                            ephemeral: true
                        });
                    }
                    
                    switch (buttonInteraction.customId) {
                        case 'collection_first':
                            currentPage = 1;
                            break;
                        case 'collection_prev':
                            currentPage = Math.max(1, currentPage - 1);
                            break;
                        case 'collection_next':
                            currentPage = Math.min(totalPages, currentPage + 1);
                            break;
                        case 'collection_last':
                            currentPage = totalPages;
                            break;
                    }
                    
                    const newEmbed = generateEmbed(currentPage);
                    const newRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('collection_first')
                                .setLabel('⏮️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 1),
                            new ButtonBuilder()
                                .setCustomId('collection_prev')
                                .setLabel('⬅️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 1),
                            new ButtonBuilder()
                                .setCustomId('collection_next')
                                .setLabel('➡️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === totalPages),
                            new ButtonBuilder()
                                .setCustomId('collection_last')
                                .setLabel('⏭️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === totalPages)
                        );
                    
                    await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
                });
                
                collector.on('end', () => {
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('collection_first_disabled')
                                .setLabel('⏮️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_prev_disabled')
                                .setLabel('⬅️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_next_disabled')
                                .setLabel('➡️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_last_disabled')
                                .setLabel('⏭️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                    
                    interaction.editReply({ components: [disabledRow] }).catch(() => {});
                });
                
            } else {
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            interaction.client.logger.error('Collection command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the collection.',
                ephemeral: true
            });
        }
    }
};
