// src/events/client/interactionCreate.js - FIXED: Discord.js v14 Compatible Event Handler
const { MessageFlags } = require('discord.js');
const Logger = require('../../utils/Logger');
const ErrorHandler = require('../../utils/ErrorHandler');
const InteractionHandler = require('../../utils/InteractionHandler');

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction) {
        const logger = new Logger('INTERACTION');
        
        try {
            // CRITICAL: Check if interaction is valid before processing
            if (!InteractionHandler.isInteractionValid(interaction)) {
                logger.debug('Ignoring invalid or expired interaction', {
                    interactionId: interaction.id,
                    age: Date.now() - interaction.createdTimestamp,
                    type: interaction.type
                });
                return;
            }
            
            // CRITICAL: Ensure user exists BEFORE any command processing
            await ensureUserExists(interaction);
            
            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction, logger);
            }
            
            // Handle button interactions
            else if (interaction.isButton()) {
                await handleButtonInteraction(interaction, logger);
            }
            
            // Handle select menu interactions
            else if (interaction.isAnySelectMenu()) {
                await handleSelectMenuInteraction(interaction, logger);
            }
            
        } catch (error) {
            logger.error('Interaction handler error:', error);
            
            // Use safe error handling with fixed flags
            await handleInteractionError(interaction, error);
        }
    }
};

/**
 * Handle slash command interactions with safe response handling
 */
async function handleSlashCommand(interaction, logger) {
    const command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        await InteractionHandler.safeReply(interaction, {
            content: '❌ Unknown command!',
            flags: MessageFlags.Ephemeral // FIXED: Use flags instead of ephemeral
        });
        return;
    }
    
    try {
        // Use CommandManager to execute command (which has its own error handling)
        const commandManager = interaction.client.commandManager;
        if (commandManager) {
            await commandManager.executeCommand(interaction);
        } else {
            // Fallback to direct execution
            await command.execute(interaction);
        }
        
    } catch (error) {
        logger.error(`Command ${interaction.commandName} failed:`, error);
        await handleInteractionError(interaction, error);
    }
}

/**
 * Handle button interactions with improved routing
 */
async function handleButtonInteraction(interaction, logger) {
    const customId = interaction.customId;
    
    // PvP Challenge invitation responses
    if (customId.startsWith('accept_') || customId.startsWith('decline_')) {
        // These are handled by the command's own collector
        logger.debug(`PvP invitation response: ${customId}`);
        return;
    }
    
    // PvP Raid rematch buttons
    if (customId.startsWith('rematch_')) {
        // These are handled by the raid command's collector
        logger.debug(`PvP raid rematch: ${customId}`);
        return;
    }
    
    // PvP Challenge selection/battle buttons
    if (customId.includes('select_') || customId.includes('battle_') || 
        customId.includes('ban_') || customId.includes('confirm_') ||
        customId.includes('fruit_')) {
        
        // Check if this is handled by existing collectors
        logger.debug(`PvP component interaction: ${customId}`);
        return;
    }
    
    // Gacha animation buttons (from existing system)
    if (customId.startsWith('summon_')) {
        // These are handled by summon command collectors
        logger.debug(`Gacha button: ${customId}`);
        return;
    }
    
    // Collection navigation buttons
    if (['collection_first', 'collection_prev', 'collection_next', 'collection_last']
        .some(btn => customId.startsWith(btn))) {
        logger.debug(`Collection navigation: ${customId}`);
        return;
    }
    
    // Batch navigation buttons
    if (['batch_first', 'batch_prev', 'batch_summary', 'batch_next', 'batch_last', 'back_to_batches']
        .includes(customId)) {
        logger.debug(`Batch navigation: ${customId}`);
        return;
    }
    
    // History navigation buttons
    if (customId.startsWith('history_')) {
        logger.debug(`History navigation: ${customId}`);
        return;
    }
    
    // If button not handled by collectors, log it
    logger.debug(`Unhandled button interaction: ${customId}`, {
        userId: interaction.user.id,
        guildId: interaction.guildId
    });
}

/**
 * Handle select menu interactions with improved routing
 */
async function handleSelectMenuInteraction(interaction, logger) {
    const customId = interaction.customId;
    
    // PvP Challenge fruit selection menus
    if (customId.includes('select_fruit_') || customId.includes('ban_fruit_') || 
        customId.includes('battle_') || customId.includes('fruit_select_')) {
        // These are handled by PvP command collectors
        logger.debug(`PvP select menu: ${customId}`);
        return;
    }
    
    // Battle action select menus
    if (customId.startsWith('battle_attack_')) {
        logger.debug(`Battle action menu: ${customId}`);
        return;
    }
    
    // Summon configuration menus
    if (customId.startsWith('summon_amount_') || customId.startsWith('summon_animation_')) {
        logger.debug(`Summon configuration menu: ${customId}`);
        return;
    }
    
    // If select menu not handled by collectors, log it
    logger.debug(`Unhandled select menu interaction: ${customId}`, {
        values: interaction.values,
        userId: interaction.user.id,
        guildId: interaction.guildId
    });
}

/**
 * CRITICAL: Ensure user exists in database BEFORE any command processing
 * This prevents foreign key constraint violations in command_usage table
 */
async function ensureUserExists(interaction) {
    try {
        const DatabaseManager = require('../../database/DatabaseManager');
        
        // Create user if they don't exist - now with starting berries
        const user = await DatabaseManager.ensureUser(
            interaction.user.id,
            interaction.user.username,
            interaction.guildId
        );
        
        // Check if user needs starting berries (new user with 0 berries and no fruits)
        if (user.berries === 0) {
            const fruits = await DatabaseManager.getUserDevilFruits(interaction.user.id);
            if (fruits.length === 0) {
                // Give starting berries to new users
                const Config = require('../../config/Config');
                const startingBerries = Config.game?.startingBerries || 5000;
                
                await DatabaseManager.updateUserBerries(
                    interaction.user.id, 
                    startingBerries, 
                    'starting_bonus'
                );
                
                const logger = new Logger('USER_CREATION');
                logger.info(`New user ${interaction.user.id} received ${startingBerries} starting berries`);
            }
        }
        
        // Log successful user creation/verification for debugging
        const logger = new Logger('USER_CREATION');
        logger.debug(`User verified/created: ${interaction.user.id} (${interaction.user.username})`);
        
    } catch (error) {
        // Log error but don't fail the interaction completely
        const logger = new Logger('USER_CREATION');
        logger.error('Failed to ensure user exists:', {
            userId: interaction.user.id,
            username: interaction.user.username,
            guildId: interaction.guildId,
            error: error.message,
            stack: error.stack
        });
        
        // Still throw the error to prevent command execution with incomplete user data
        throw new Error(`Failed to create/verify user: ${error.message}`);
    }
}

/**
 * FIXED: Handle interaction errors with safe response methods and proper flags
 */
async function handleInteractionError(interaction, error) {
    const logger = new Logger('INTERACTION_ERROR');
    
    // Don't try to respond to expired interactions
    if (!InteractionHandler.isInteractionValid(interaction)) {
        logger.debug('Skipping error response for invalid interaction');
        return;
    }
    
    const errorId = Date.now().toString(36);
    logger.error(`Interaction Error [${errorId}]:`, {
        command: interaction.commandName,
        user: interaction.user.tag,
        guild: interaction.guild?.name || 'DM',
        customId: interaction.customId,
        error: error.stack,
        interactionAge: Date.now() - interaction.createdTimestamp
    });
    
    // Create safe error message
    const errorMessage = process.env.NODE_ENV === 'development' 
        ? `❌ Error: ${error.message}\n\`Error ID: ${errorId}\``
        : `❌ Something went wrong! Please try again.\n\`Error ID: ${errorId}\``;
    
    // FIXED: Use InteractionHandler with proper flags
    const success = await InteractionHandler.safeReply(interaction, {
        content: errorMessage,
        flags: MessageFlags.Ephemeral // FIXED: Use flags instead of ephemeral
    });
    
    if (!success) {
        logger.warn('Failed to send error response to user');
    }
}

/**
 * FIXED: Create safe interaction context for commands
 */
function createSafeContext(interaction) {
    return InteractionHandler.createContext(interaction);
}

/**
 * FIXED: Safe permission check for interactions
 */
function checkInteractionPermissions(interaction, requiredPermissions) {
    return InteractionHandler.checkPermissions(interaction, requiredPermissions);
}

/**
 * FIXED: Safe component interaction handler
 */
async function handleSafeComponentInteraction(interaction, handler) {
    return await InteractionHandler.handleComponentInteraction(interaction, handler);
}

// Export additional utilities for use in commands
module.exports.createSafeContext = createSafeContext;
module.exports.checkInteractionPermissions = checkInteractionPermissions;
module.exports.handleSafeComponentInteraction = handleSafeComponentInteraction;
module.exports.InteractionHandler = InteractionHandler;
