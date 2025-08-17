// src/events/client/ready.js - Ready Event Handler
const Logger = require('../../utils/Logger');
const { BOT_ACTIVITIES } = require('../../data/Constants');

module.exports = {
    name: 'ready',
    once: true,
    
    async execute(client) {
        const logger = new Logger('READY');
        
        logger.success(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🏴‍☠️  ONE PIECE DEVIL FRUIT GACHA BOT v4.0  🏴‍☠️      ║
║                                                           ║
║     Bot: ${client.user.tag.padEnd(38)}║
║     Guilds: ${client.guilds.cache.size.toString().padEnd(35)}║
║     Users: ${client.users.cache.size.toString().padEnd(36)}║
║     Commands: ${client.commands.size.toString().padEnd(33)}║
║                                                           ║
║     Status: ONLINE ✅                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
        
        // Update presence
        updatePresence(client);
        
        // Start presence rotation every 5 minutes
        setInterval(() => updatePresence(client), 300000);
        
        // Log additional startup info
        logger.info('📊 System Information:');
        logger.info(`   • Node.js: ${process.version}`);
        logger.info(`   • Discord.js: v${require('discord.js').version}`);
        logger.info(`   • Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
        logger.info(`   • Environment: ${process.env.NODE_ENV || 'production'}`);
        
        // Run startup tasks
        await runStartupTasks(client, logger);
    }
};

/**
 * Update bot presence with random activity
 */
function updatePresence(client) {
    const activity = BOT_ACTIVITIES[Math.floor(Math.random() * BOT_ACTIVITIES.length)];
    client.user.setActivity(activity.name, { type: activity.type });
}

/**
 * Run startup tasks
 */
async function runStartupTasks(client, logger) {
    try {
        // Test database connection
        const dbHealth = await client.db.healthCheck();
        if (dbHealth.status === 'healthy') {
            logger.success(`✅ Database connection healthy (${dbHealth.latency}ms)`);
        } else {
            logger.error('❌ Database connection unhealthy:', dbHealth.error);
        }
        
        // Get server stats
        const stats = await client.db.getServerStats();
        logger.info('📈 Server Statistics:');
        logger.info(`   • Total Users: ${stats.totalUsers}`);
        logger.info(`   • Total Fruits: ${stats.totalFruits}`);
        logger.info(`   • Total Berries: ${stats.totalBerries.toLocaleString()}`);
        
        // Log command categories
        const categories = {};
        client.commands.forEach(command => {
            const category = command.category || 'unknown';
            categories[category] = (categories[category] || 0) + 1;
        });
        
        logger.info('🎮 Commands by Category:');
        Object.entries(categories).forEach(([category, count]) => {
            logger.info(`   • ${category}: ${count} commands`);
        });
        
    } catch (error) {
        logger.error('Failed to run startup tasks:', error);
    }
}
