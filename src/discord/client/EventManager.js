// src/events/EventManager.js - Event Management System
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/Logger');

class EventManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger('EVENTS');
        this.eventsPath = path.join(__dirname);
        this.loadedEvents = 0;
    }
    
    async loadEvents() {
        try {
            const eventFolders = ['client', 'process'];
            
            for (const folder of eventFolders) {
                const folderPath = path.join(this.eventsPath, folder);
                
                try {
                    const files = await fs.readdir(folderPath);
                    
                    for (const file of files) {
                        if (!file.endsWith('.js')) continue;
                        
                        await this.loadEvent(path.join(folderPath, file), folder);
                    }
                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        this.logger.warn(`Error reading event folder ${folder}:`, error.message);
                    }
                }
            }
            
            return this.loadedEvents;
            
        } catch (error) {
            this.logger.error('Failed to load events:', error);
            throw error;
        }
    }
    
    async loadEvent(filePath, category) {
        try {
            const event = require(filePath);
            const eventName = path.basename(filePath, '.js');
            
            if (!event.execute) {
                this.logger.warn(`Event ${eventName} missing execute function`);
                return;
            }
            
            // Determine if process or client event
            if (category === 'process') {
                process.on(eventName, (...args) => event.execute(...args, this.client));
            } else {
                if (event.once) {
                    this.client.once(eventName, (...args) => event.execute(...args));
                } else {
                    this.client.on(eventName, (...args) => event.execute(...args));
                }
            }
            
            this.loadedEvents++;
            this.logger.debug(`Loaded event: ${eventName} (${category})`);
            
        } catch (error) {
            this.logger.error(`Failed to load event from ${filePath}:`, error);
        }
    }
}

module.exports = EventManager;
