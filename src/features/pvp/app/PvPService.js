// src/services/PvPService.js - Enhanced PvP Battle System
const DatabaseManager = require('../database/DatabaseManager');
const { DEVIL_FRUITS } = require('../data/DevilFruits');
const { BATTLE_CONSTANTS, STATUS_EFFECTS, RARITY_COLORS } = require('../data/Constants');
const Logger = require('../utils/Logger');

class PvPService {
    constructor() {
        this.logger = new Logger('PVP_SERVICE');
        this.activeBattles = new Map(); // Store active battles
        this.battleQueue = new Map(); // Store players looking for battles
        this.battleHistory = new Map(); // Cache recent battle results
    }

    /**
     * Create a new PvP battle between two users
     */
    async createBattle(player1Id, player2Id, battleType = 'ranked') {
        try {
            const battleId = this.generateBattleId();
            
            // Get player data
            const player1Data = await this.getPlayerBattleData(player1Id);
            const player2Data = await this.getPlayerBattleData(player2Id);
            
            if (!player1Data || !player2Data) {
                throw new Error('Could not load player data for battle');
            }
            
            // Create battle state
            const battle = {
                id: battleId,
                type: battleType,
                status: 'active',
                turn: 1,
                currentPlayer: player1Id,
                startTime: Date.now(),
                players: {
                    [player1Id]: {
                        ...player1Data,
                        hp: this.calculateMaxHP(player1Data),
                        maxHp: this.calculateMaxHP(player1Data),
                        statusEffects: [],
                        skillCooldowns: {},
                        actions: []
                    },
                    [player2Id]: {
                        ...player2Data,
                        hp: this.calculateMaxHP(player2Data),
                        maxHp: this.calculateMaxHP(player2Data),
                        statusEffects: [],
                        skillCooldowns: {},
                        actions: []
                    }
                },
                log: [],
                winner: null
            };
            
            // Store battle
            this.activeBattles.set(battleId, battle);
            
            // Record battle in database
            await this.recordBattleStart(battleId, player1Id, player2Id, battleType);
            
            this.logger.info(`Battle created: ${battleId} between ${player1Id} and ${player2Id}`);
            return battle;
            
        } catch (error) {
            this.logger.error('Error creating battle:', error);
            throw error;
        }
    }

    /**
     * Get player data for battle including devil fruits and skills
     */
    async getPlayerBattleData(userId) {
        try {
            // Get user basic data
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;
            
            // Get user's devil fruits
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            // Get user's selected fruit for battle (for now, use strongest)
            const selectedFruit = this.selectBattleFruit(fruits);
            
            return {
                userId,
                username: user.username,
                level: user.level,
                totalCP: user.total_cp,
                selectedFruit,
                fruits: fruits.length,
                rank: await this.getUserRank(userId)
            };
            
        } catch (error) {
            this.logger.error(`Error getting player data for ${userId}:`, error);
            return null;
        }
    }

    /**
     * Select the best fruit for battle (highest CP)
     */
    selectBattleFruit(userFruits) {
        if (!userFruits || userFruits.length === 0) {
            return {
                fruit_name: 'No Fruit',
                fruit_rarity: 'common',
                base_cp: 100,
                skill: {
                    name: 'Basic Attack',
                    damage: 50,
                    cooldown: 0,
                    effect: null,
                    description: 'A basic attack with no special effects'
                }
            };
        }
        
        // Find fruit with highest total CP
        const bestFruit = userFruits.reduce((best, current) => {
            return (current.total_cp || 0) > (best.total_cp || 0) ? current : best;
        });
        
        // Get fruit data from DEVIL_FRUITS to get skills
        const fruitData = Object.values(DEVIL_FRUITS).find(f => 
            f.name === bestFruit.fruit_name || f.id === bestFruit.fruit_id
        );
        
        return {
            ...bestFruit,
            skill: fruitData?.skill || {
                name: 'Devil Fruit Power',
                damage: 100,
                cooldown: 2,
                effect: null,
                description: 'A mysterious devil fruit ability'
            }
        };
    }

    /**
     * Calculate max HP based on level, CP, and fruit rarity
     */
    calculateMaxHP(playerData) {
        const baseHP = BATTLE_CONSTANTS.BASE_HP;
        const levelBonus = playerData.level * BATTLE_CONSTANTS.HP_PER_LEVEL;
        const cpBonus = Math.floor(playerData.totalCP * BATTLE_CONSTANTS.CP_TO_HP_RATIO);
        
        // Rarity bonus
        const rarityMultiplier = {
            'common': 1.0,
            'uncommon': 1.1,
            'rare': 1.2,
            'epic': 1.3,
            'legendary': 1.5,
            'mythical': 1.7,
            'divine': 2.0
        };
        
        const rarity = playerData.selectedFruit?.fruit_rarity || 'common';
        const rarityBonus = (rarityMultiplier[rarity] || 1.0) - 1.0;
        
        return Math.floor((baseHP + levelBonus + cpBonus) * (1 + rarityBonus));
    }

    /**
     * Execute a battle action (attack, skill, defend)
     */
    async executeBattleAction(battleId, playerId, action) {
        try {
            const battle = this.activeBattles.get(battleId);
            if (!battle) {
                throw new Error('Battle not found');
            }
            
            if (battle.currentPlayer !== playerId) {
                throw new Error('Not your turn');
            }
            
            if (battle.status !== 'active') {
                throw new Error('Battle is not active');
            }
            
            const attacker = battle.players[playerId];
            const defenderId = Object.keys(battle.players).find(id => id !== playerId);
            const defender = battle.players[defenderId];
            
            let actionResult = {};
            
            switch (action.type) {
                case 'attack':
                    actionResult = await this.executeAttack(attacker, defender, action);
                    break;
                case 'skill':
                    actionResult = await this.executeSkill(attacker, defender, action);
                    break;
                case 'defend':
                    actionResult = await this.executeDefend(attacker, defender, action);
                    break;
                default:
                    throw new Error('Invalid action type');
            }
            
            // Apply action result
            this.applyActionResult(battle, playerId, defenderId, actionResult);
            
            // Process status effects
            this.processStatusEffects(battle);
            
            // Check for battle end
            const battleResult = this.checkBattleEnd(battle);
            if (battleResult.ended) {
                await this.endBattle(battleId, battleResult.winner);
                return { battle, ended: true, winner: battleResult.winner };
            }
            
            // Switch turns
            battle.currentPlayer = defenderId;
            battle.turn++;
            
            // Reduce cooldowns
            this.reduceCooldowns(battle);
            
            // Update battle in storage
            this.activeBattles.set(battleId, battle);
            
            return { battle, ended: false, actionResult };
            
        } catch (error) {
            this.logger.error(`Error executing battle action: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute basic attack
     */
    async executeAttack(attacker, defender, action) {
        const baseDamage = 80;
        const cpMultiplier = Math.min(attacker.totalCP / defender.totalCP, 2.0);
        const levelMultiplier = 1 + (attacker.level / 100);
        
        let damage = Math.floor(baseDamage * cpMultiplier * levelMultiplier);
        
        // Check for critical hit
        const critChance = BATTLE_CONSTANTS.CRIT_CHANCE;
        const isCritical = Math.random() < critChance;
        if (isCritical) {
            damage = Math.floor(damage * BATTLE_CONSTANTS.CRIT_MULTIPLIER);
        }
        
        // Check for dodge
        const dodgeChance = BATTLE_CONSTANTS.DODGE_CHANCE;
        const dodged = Math.random() < dodgeChance;
        if (dodged) {
            damage = 0;
        }
        
        return {
            type: 'attack',
            damage,
            isCritical,
            dodged,
            message: this.generateActionMessage('attack', attacker, defender, { damage, isCritical, dodged })
        };
    }

    /**
     * Execute devil fruit skill
     */
    async executeSkill(attacker, defender, action) {
        const skill = attacker.selectedFruit.skill;
        
        // Check if skill is on cooldown
        const cooldownKey = skill.name;
        const currentCooldown = attacker.skillCooldowns[cooldownKey] || 0;
        if (currentCooldown > 0) {
            throw new Error(`Skill ${skill.name} is on cooldown for ${currentCooldown} more turns`);
        }
        
        // Calculate skill damage
        let damage = skill.damage || 100;
        const cpMultiplier = Math.min(attacker.totalCP / defender.totalCP, 2.5);
        const rarityMultiplier = this.getRarityMultiplier(attacker.selectedFruit.fruit_rarity);
        
        damage = Math.floor(damage * cpMultiplier * rarityMultiplier);
        
        // Check for critical hit (skills have higher crit chance)
        const critChance = BATTLE_CONSTANTS.CRIT_CHANCE * 1.5;
        const isCritical = Math.random() < critChance;
        if (isCritical) {
            damage = Math.floor(damage * BATTLE_CONSTANTS.CRIT_MULTIPLIER);
        }
        
        // Check for dodge (skills are harder to dodge)
        const dodgeChance = BATTLE_CONSTANTS.DODGE_CHANCE * 0.5;
        const dodged = Math.random() < dodgeChance;
        if (dodged) {
            damage = 0;
        }
        
        // Set cooldown
        attacker.skillCooldowns[cooldownKey] = skill.cooldown || 1;
        
        return {
            type: 'skill',
            skillName: skill.name,
            damage,
            isCritical,
            dodged,
            effect: skill.effect,
            message: this.generateActionMessage('skill', attacker, defender, { 
                damage, isCritical, dodged, skillName: skill.name 
            })
        };
    }

    /**
     * Execute defend action
     */
    async executeDefend(attacker, defender, action) {
        // Defending gives damage reduction and slight HP recovery
        const hpRecovery = Math.floor(attacker.maxHp * 0.05); // 5% HP recovery
        
        return {
            type: 'defend',
            hpRecovery,
            damageReduction: 0.5, // 50% damage reduction next turn
            message: this.generateActionMessage('defend', attacker, defender, { hpRecovery })
        };
    }

    /**
     * Apply action result to battle state
     */
    applyActionResult(battle, attackerId, defenderId, result) {
        const attacker = battle.players[attackerId];
        const defender = battle.players[defenderId];
        
        // Apply damage
        if (result.damage > 0) {
            defender.hp = Math.max(0, defender.hp - result.damage);
        }
        
        // Apply healing
        if (result.hpRecovery > 0) {
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + result.hpRecovery);
        }
        
        // Apply status effects
        if (result.effect) {
            this.applyStatusEffect(defender, result.effect);
        }
        
        // Apply damage reduction for defend
        if (result.damageReduction) {
            attacker.statusEffects.push({
                type: 'damage_reduction',
                value: result.damageReduction,
                duration: 1
            });
        }
        
        // Log action
        battle.log.push({
            turn: battle.turn,
            playerId: attackerId,
            action: result.type,
            message: result.message,
            timestamp: Date.now()
        });
    }

    /**
     * Apply status effect to player
     */
    applyStatusEffect(player, effectName) {
        if (!effectName) return;
        
        const effect = STATUS_EFFECTS[effectName];
        if (!effect) return;
        
        // Check if effect already exists
        const existingEffect = player.statusEffects.find(e => e.name === effectName);
        if (existingEffect) {
            // Refresh duration or stack if stackable
            existingEffect.duration = Math.max(existingEffect.duration, effect.duration || 3);
            if (effect.stackable) {
                existingEffect.stacks = Math.min((existingEffect.stacks || 1) + 1, BATTLE_CONSTANTS.STATUS_STACK_LIMIT);
            }
        } else {
            // Add new effect
            player.statusEffects.push({
                name: effectName,
                type: effect.type,
                duration: effect.duration || 3,
                stacks: 1,
                value: effect.value || 0
            });
        }
    }

    /**
     * Process all status effects at end of turn
     */
    processStatusEffects(battle) {
        Object.values(battle.players).forEach(player => {
            player.statusEffects = player.statusEffects.filter(effect => {
                // Apply effect
                switch (effect.type) {
                    case 'dot': // Damage over time
                        const dotDamage = effect.value * (effect.stacks || 1);
                        player.hp = Math.max(0, player.hp - dotDamage);
                        battle.log.push({
                            turn: battle.turn,
                            message: `${player.username} takes ${dotDamage} damage from ${effect.name}`,
                            type: 'status_effect'
                        });
                        break;
                        
                    case 'heal': // Heal over time
                        const healAmount = effect.value * (effect.stacks || 1);
                        player.hp = Math.min(player.maxHp, player.hp + healAmount);
                        battle.log.push({
                            turn: battle.turn,
                            message: `${player.username} recovers ${healAmount} HP from ${effect.name}`,
                            type: 'status_effect'
                        });
                        break;
                }
                
                // Reduce duration
                effect.duration--;
                return effect.duration > 0;
            });
        });
    }

    /**
     * Reduce skill cooldowns
     */
    reduceCooldowns(battle) {
        Object.values(battle.players).forEach(player => {
            Object.keys(player.skillCooldowns).forEach(skill => {
                if (player.skillCooldowns[skill] > 0) {
                    player.skillCooldowns[skill]--;
                }
            });
        });
    }

    /**
     * Check if battle has ended
     */
    checkBattleEnd(battle) {
        // Check for player death
        const alivePlayers = Object.entries(battle.players).filter(([id, player]) => player.hp > 0);
        
        if (alivePlayers.length === 1) {
            return { ended: true, winner: alivePlayers[0][0], reason: 'knockout' };
        }
        
        if (alivePlayers.length === 0) {
            return { ended: true, winner: null, reason: 'draw' };
        }
        
        // Check for turn limit
        if (battle.turn > BATTLE_CONSTANTS.MAX_TURNS) {
            // Winner is player with more HP percentage
            const players = Object.entries(battle.players);
            const [player1Id, player1] = players[0];
            const [player2Id, player2] = players[1];
            
            const player1HpPercent = player1.hp / player1.maxHp;
            const player2HpPercent = player2.hp / player2.maxHp;
            
            if (player1HpPercent > player2HpPercent) {
                return { ended: true, winner: player1Id, reason: 'time_limit' };
            } else if (player2HpPercent > player1HpPercent) {
                return { ended: true, winner: player2Id, reason: 'time_limit' };
            } else {
                return { ended: true, winner: null, reason: 'draw' };
            }
        }
        
        return { ended: false };
    }

    /**
     * End battle and record results
     */
    async endBattle(battleId, winnerId) {
        try {
            const battle = this.activeBattles.get(battleId);
            if (!battle) return;
            
            battle.status = 'ended';
            battle.winner = winnerId;
            battle.endTime = Date.now();
            
            // Update database
            await this.recordBattleEnd(battleId, winnerId, battle.log);
            
            // Update player stats
            if (winnerId) {
                await this.updatePlayerStats(winnerId, 'win');
                const loserId = Object.keys(battle.players).find(id => id !== winnerId);
                if (loserId) {
                    await this.updatePlayerStats(loserId, 'loss');
                }
            }
            
            // Store in history and remove from active
            this.battleHistory.set(battleId, battle);
            this.activeBattles.delete(battleId);
            
            this.logger.info(`Battle ${battleId} ended, winner: ${winnerId || 'draw'}`);
            
        } catch (error) {
            this.logger.error(`Error ending battle ${battleId}:`, error);
        }
    }

    /**
     * Get rarity multiplier for damage calculations
     */
    getRarityMultiplier(rarity) {
        const multipliers = {
            'common': 1.0,
            'uncommon': 1.1,
            'rare': 1.2,
            'epic': 1.4,
            'legendary': 1.7,
            'mythical': 2.0,
            'divine': 2.5
        };
        return multipliers[rarity] || 1.0;
    }

    /**
     * Generate action message for battle log
     */
    generateActionMessage(actionType, attacker, defender, details) {
        switch (actionType) {
            case 'attack':
                if (details.dodged) {
                    return `${defender.username} dodged ${attacker.username}'s attack!`;
                } else if (details.isCritical) {
                    return `${attacker.username} lands a critical hit on ${defender.username} for ${details.damage} damage! 💥`;
                } else {
                    return `${attacker.username} attacks ${defender.username} for ${details.damage} damage!`;
                }
                
            case 'skill':
                if (details.dodged) {
                    return `${defender.username} dodged ${attacker.username}'s ${details.skillName}!`;
                } else if (details.isCritical) {
                    return `${attacker.username} uses ${details.skillName} with a critical hit on ${defender.username} for ${details.damage} damage! ✨💥`;
                } else {
                    return `${attacker.username} uses ${details.skillName} on ${defender.username} for ${details.damage} damage! ✨`;
                }
                
            case 'defend':
                return `${attacker.username} defends and recovers ${details.hpRecovery} HP! 🛡️`;
                
            default:
                return `${attacker.username} performs an action.`;
        }
    }

    /**
     * Record battle start in database
     */
    async recordBattleStart(battleId, player1Id, player2Id, battleType) {
        try {
            await DatabaseManager.query(`
                INSERT INTO pvp_battles (battle_id, player1_id, player2_id, battle_type, started_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [battleId, player1Id, player2Id, battleType]);
        } catch (error) {
            this.logger.error('Error recording battle start:', error);
        }
    }

    /**
     * Record battle end in database
     */
    async recordBattleEnd(battleId, winnerId, battleLog) {
        try {
            await DatabaseManager.query(`
                UPDATE pvp_battles 
                SET winner_id = $2, ended_at = NOW(), battle_data = $3
                WHERE battle_id = $1
            `, [battleId, winnerId, JSON.stringify(battleLog)]);
        } catch (error) {
            this.logger.error('Error recording battle end:', error);
        }
    }

    /**
     * Update player PvP statistics
     */
    async updatePlayerStats(userId, result) {
        try {
            const statType = result === 'win' ? 'pvp_wins' : 'pvp_losses';
            
            await DatabaseManager.query(`
                INSERT INTO user_statistics (user_id, stat_type, value, updated_at)
                VALUES ($1, $2, 1, NOW())
                ON CONFLICT (user_id, stat_type)
                DO UPDATE SET value = user_statistics.value + 1, updated_at = NOW()
            `, [userId, statType]);
            
        } catch (error) {
            this.logger.error(`Error updating player stats for ${userId}:`, error);
        }
    }

    /**
     * Get user's PvP rank based on wins/losses
     */
    async getUserRank(userId) {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    COALESCE(wins.value, 0) as wins,
                    COALESCE(losses.value, 0) as losses
                FROM (SELECT $1 as user_id) u
                LEFT JOIN user_statistics wins ON u.user_id = wins.user_id AND wins.stat_type = 'pvp_wins'
                LEFT JOIN user_statistics losses ON u.user_id = losses.user_id AND losses.stat_type = 'pvp_losses'
            `, [userId]);
            
            const wins = parseInt(result.rows[0]?.wins || 0);
            const losses = parseInt(result.rows[0]?.losses || 0);
            const total = wins + losses;
            
            if (total === 0) return 'Unranked';
            
            const winRate = wins / total;
            
            if (wins >= 100 && winRate >= 0.8) return 'Pirate King';
            if (wins >= 50 && winRate >= 0.7) return 'Yonko';
            if (wins >= 25 && winRate >= 0.6) return 'Shichibukai';
            if (wins >= 10 && winRate >= 0.5) return 'Supernova';
            if (total >= 5) return 'Rookie';
            return 'Unranked';
            
        } catch (error) {
            this.logger.error(`Error getting user rank for ${userId}:`, error);
            return 'Unranked';
        }
    }

    /**
     * Generate unique battle ID
     */
    generateBattleId() {
        return `battle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    /**
     * Get battle by ID
     */
    getBattle(battleId) {
        return this.activeBattles.get(battleId) || this.battleHistory.get(battleId);
    }

    /**
     * Get active battles for user
     */
    getUserActiveBattles(userId) {
        const userBattles = [];
        this.activeBattles.forEach((battle, battleId) => {
            if (battle.players[userId]) {
                userBattles.push(battle);
            }
        });
        return userBattles;
    }

    /**
     * Check if user is in battle
     */
    isUserInBattle(userId) {
        for (const battle of this.activeBattles.values()) {
            if (battle.players[userId] && battle.status === 'active') {
                return true;
            }
        }
        return false;
    }
}

module.exports = new PvPService();
