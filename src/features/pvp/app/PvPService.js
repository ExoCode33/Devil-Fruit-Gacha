// src/features/pvp/app/PvPService.js - CLEAN: PvP Service
const Logger = require('../../../shared/utils/Logger');
const DatabaseManager = require('../../../shared/db/DatabaseManager');

class PvPService {
    constructor() {
        this.logger = new Logger('PVP');
        this.activeRaids = new Map();
    }

    /**
     * Create a PvP raid challenge
     */
    async createRaid(challengerId, targetId, guildId) {
        try {
            // Basic validation
            if (challengerId === targetId) {
                throw new Error('Cannot challenge yourself');
            }

            // Ensure both users exist
            await DatabaseManager.ensureUser(challengerId, 'Challenger', guildId);
            await DatabaseManager.ensureUser(targetId, 'Target', guildId);

            // Create raid in database
            const raidId = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await DatabaseManager.query(`
                INSERT INTO raids (id, challenger_id, target_id, guild_id, status, created_at)
                VALUES ($1, $2, $3, $4, 'pending', NOW())
            `, [raidId, challengerId, targetId, guildId]);

            this.logger.info(`Raid created: ${raidId} (${challengerId} vs ${targetId})`);

            return {
                success: true,
                raidId,
                challengerId,
                targetId,
                status: 'pending'
            };

        } catch (error) {
            this.logger.error('Failed to create raid:', error);
            throw error;
        }
    }

    /**
     * Get raid information
     */
    async getRaid(raidId) {
        try {
            const result = await DatabaseManager.query(
                'SELECT * FROM raids WHERE id = $1',
                [raidId]
            );

            return result.rows[0] || null;
        } catch (error) {
            this.logger.error(`Failed to get raid ${raidId}:`, error);
            return null;
        }
    }

    /**
     * Update raid status
     */
    async updateRaidStatus(raidId, status, additionalData = {}) {
        try {
            const updates = ['status = $2'];
            const values = [raidId, status];
            let paramIndex = 3;

            // Add additional update fields
            Object.entries(additionalData).forEach(([key, value]) => {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            });

            const query = `
                UPDATE raids 
                SET ${updates.join(', ')}, updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await DatabaseManager.query(query, values);
            return result.rows[0];

        } catch (error) {
            this.logger.error(`Failed to update raid ${raidId}:`, error);
            throw error;
        }
    }

    /**
     * Get user's raid history
     */
    async getUserRaidHistory(userId, limit = 10) {
        try {
            const result = await DatabaseManager.query(`
                SELECT * FROM raids 
                WHERE challenger_id = $1 OR target_id = $1 OR defender_id = $1
                ORDER BY created_at DESC 
                LIMIT $2
            `, [userId, limit]);

            return result.rows;
        } catch (error) {
            this.logger.error(`Failed to get raid history for ${userId}:`, error);
            return [];
        }
    }

    /**
     * Get active raids for a guild
     */
    async getActiveRaids(guildId, limit = 20) {
        try {
            const result = await DatabaseManager.query(`
                SELECT * FROM raids 
                WHERE guild_id = $1 AND status IN ('pending', 'accepted', 'active')
                ORDER BY created_at DESC 
                LIMIT $2
            `, [guildId, limit]);

            return result.rows;
        } catch (error) {
            this.logger.error(`Failed to get active raids for guild ${guildId}:`, error);
            return [];
        }
    }

    /**
     * Check if user can participate in PvP
     */
    async canParticipate(userId) {
        try {
            // Check if user has any devil fruits
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            if (!fruits || fruits.length === 0) {
                return { canParticipate: false, reason: 'No Devil Fruits found' };
            }

            // Check if user has minimum CP
            const user = await DatabaseManager.getUser(userId);
            if (!user || user.total_cp < 100) {
                return { canParticipate: false, reason: 'Insufficient Combat Power' };
            }

            return { canParticipate: true };

        } catch (error) {
            this.logger.error(`Failed to check participation for ${userId}:`, error);
            return { canParticipate: false, reason: 'Error checking eligibility' };
        }
    }

    /**
     * Get PvP statistics
     */
    async getPvPStats(userId = null) {
        try {
            if (userId) {
                // User-specific stats
                const result = await DatabaseManager.query(`
                    SELECT 
                        COUNT(*) as total_raids,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_raids,
                        COUNT(CASE WHEN (challenger_id = $1 OR defender_id = $1) AND winner_id = $1 THEN 1 END) as wins,
                        COUNT(CASE WHEN (challenger_id = $1 OR defender_id = $1) AND winner_id != $1 AND status = 'completed' THEN 1 END) as losses
                    FROM raids 
                    WHERE challenger_id = $1 OR target_id = $1 OR defender_id = $1
                `, [userId]);

                return result.rows[0];
            } else {
                // Global stats
                const result = await DatabaseManager.query(`
                    SELECT 
                        COUNT(*) as total_raids,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_raids,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_raids,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_raids
                    FROM raids
                `);

                return result.rows[0];
            }
        } catch (error) {
            this.logger.error('Failed to get PvP stats:', error);
            return {};
        }
    }
}

module.exports = new PvPService();
