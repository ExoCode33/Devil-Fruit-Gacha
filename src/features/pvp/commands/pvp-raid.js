// src/commands/slash/pvp/pvp-raid.js - FIXED: NaN Values and HP Calculations
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const SkillEffectService = require('../../../services/SkillEffectService');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// FIXED: Enhanced raid configuration with proper damage balance
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes
    MIN_CP_REQUIRED: 500,
    BERRY_STEAL_PERCENTAGE: 0.15,
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    
    // FIXED: Better balanced damage system with NaN protection
    MAX_BATTLE_TURNS: 30,
    TURN_TIMEOUT: 300000,
    HP_BAR_LENGTH: 20,
    TEAM_SIZE: 5,
    FRUITS_PER_PAGE: 12,
    INTERACTION_TIMEOUT: 900000,
    
    // FIXED: More balanced damage calculations with safeguards
    BASIC_MIN_DAMAGE_PERCENT: 0.08,   // Basic attacks: 8-12% of target's max HP
    BASIC_MAX_DAMAGE_PERCENT: 0.12,   
    SKILL_MIN_DAMAGE_PERCENT: 0.12,   // Skills: 12-20% of target's max HP  
    SKILL_MAX_DAMAGE_PERCENT: 0.20,   
    BASE_DAMAGE_MULTIPLIER: 1.2,      
    CP_SCALING_FACTOR: 0.4,           
    RARITY_BASIC_SCALING: 0.7,        
    
    // FIXED: Better critical and dodge rates
    BASE_CRIT_CHANCE: 0.20,       // 20% base critical chance
    CRIT_DAMAGE_MULTIPLIER: 2.0,  // 100% more damage on crit
    BASE_DODGE_CHANCE: 0.06,      // 6% base dodge chance
    
    // AI settings
    AI_SKILL_USE_CHANCE: 0.30,       // FIXED: Reduced to 30% chance to use skills
    AI_AGGRESSION: 0.9,              
    AI_DAMAGE_NERF: 0.80             // FIXED: AI does 20% less damage
};

// Active raids and cooldowns
const raidCooldowns = new Map();
const activeRaids = new Map();
const fruitSelections = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Raid another pirate with enhanced combat system!')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The pirate you want to raid')
                .setRequired(true)
        ),
    
    category: 'pvp',
    cooldown: 5,
    
    async execute(interaction) {
        const attacker = interaction.user;
        const target = interaction.options.getUser('target');
        
        try {
            updateBotStatus(interaction.client, 'raid_start', {
                attacker: attacker.username,
                target: target.username
            });
            
            const validation = await validateRaid(attacker.id, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [createErrorEmbed(validation.reason)],
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            
        // Cinematic panel
        await ensureCinematicMessage(interaction, raidState);const attackerFruits = await getUserFruitsForSelection(attacker.id);
            
            if (attackerFruits.length < RAID_CONFIG.TEAM_SIZE) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(`You need at least ${RAID_CONFIG.TEAM_SIZE} Devil Fruits to raid!`)]
                });
            }
            
            await startFruitSelection(interaction, attacker, target, attackerFruits);
            
        } catch (error) {
            interaction.client.logger.error('PvP Raid error:', error);
            
            const errorResponse = {
                embeds: [createErrorEmbed('An error occurred during the raid!')],
                ephemeral: true
            };
            
            if (interaction.deferred) {
                await interaction.editReply(errorResponse);
            } else {
                await interaction.reply(errorResponse);
            }
        }
    }
};

// ===== FIXED DAMAGE CALCULATION SYSTEM WITH NaN PROTECTION =====

/**
 * FIXED: Calculate damage with NaN protection and proper bounds
 */
function calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers = {}, isBasicAttack = false) {
    // FIXED: Ensure we have valid maxHP
    const targetMaxHP = defendingFruit.maxHP || defendingFruit.currentHP || 1000;
    
    // FIXED: Protect against NaN and undefined values
    const safeBaseDamage = isNaN(baseDamage) ? 100 : baseDamage;
    const attackerCP = attackingFruit.totalCP || 1000;
    const defenderCP = defendingFruit.totalCP || 1000;
    
    // FIXED: Higher damage ranges for more exciting battles
    let minPercent, maxPercent;
    
    if (isBasicAttack) {
        minPercent = RAID_CONFIG.BASIC_MIN_DAMAGE_PERCENT;
        maxPercent = RAID_CONFIG.BASIC_MAX_DAMAGE_PERCENT;
        
        // FIXED: Better rarity scaling for basic attacks
        const rarityMultiplier = getRarityBasicAttackBonus(attackingFruit.rarity);
        maxPercent *= rarityMultiplier;
    } else {
        minPercent = RAID_CONFIG.SKILL_MIN_DAMAGE_PERCENT;
        maxPercent = RAID_CONFIG.SKILL_MAX_DAMAGE_PERCENT;
    }
    
    // Random damage within range
    const damagePercent = minPercent + (Math.random() * (maxPercent - minPercent));
    let damage = Math.floor(targetMaxHP * damagePercent);
    
    // FIXED: Better CP scaling with NaN protection
    const cpRatio = attackerCP / Math.max(defenderCP, 1);
    const cpMultiplier = 0.7 + (cpRatio * RAID_CONFIG.CP_SCALING_FACTOR);
    damage = Math.floor(damage * Math.min(cpMultiplier, 1.8)); // Cap at 1.8x
    
    // Apply rarity bonus
    if (!isBasicAttack) {
        const rarityBonus = getRarityDamageBonus(attackingFruit.rarity);
        damage = Math.floor(damage * rarityBonus);
    }
    
    // Apply attacker modifiers with NaN protection
    if (attackerModifiers.damageModifier && !isNaN(attackerModifiers.damageModifier)) {
        damage = Math.floor(damage * attackerModifiers.damageModifier);
    }
    
    // FIXED: Better damage bounds - minimum 5% of max HP, protect against NaN
    const minDamage = Math.floor(targetMaxHP * (isBasicAttack ? 0.05 : 0.08)); // 5% for basic, 8% for skills
    const maxDamage = Math.floor(targetMaxHP * (isBasicAttack ? 0.18 : 0.30)); // 18% for basic, 30% for skills
    
    const finalDamage = Math.max(minDamage, Math.min(damage, maxDamage));
    
    // FIXED: Final NaN check
    return isNaN(finalDamage) ? minDamage : finalDamage;
}

/**
 * FIXED: Calculate fruit HP with NaN protection and better scaling
 */
function calculateFruitHP(fruit) {
    // FIXED: Base HP values by rarity with proper defaults
    const baseHP = {
        'common': 300, 'uncommon': 400, 'rare': 500, 'epic': 650,
        'legendary': 800, 'mythical': 1000, 'divine': 1300
    };
    
    // FIXED: Protect against undefined/NaN values
    const rarity = fruit.rarity || 'common';
    const totalCP = fruit.totalCP || fruit.total_cp || 1000;
    
    const rarityHP = baseHP[rarity] || 300;
    const cpBonus = Math.floor(totalCP / 40); // Better CP scaling for HP
    
    const finalHP = rarityHP + cpBonus;
    
    // FIXED: Ensure minimum HP and no NaN
    return isNaN(finalHP) ? 500 : Math.max(finalHP, 200);
}

/**
 * FIXED: Enhanced battle execution with proper NaN protection
 */
async function executeAttack(raidState, skillChoice, targetFruitIndex) {
    const [skillType, attackerFruitIndex] = skillChoice.split('_');
    const attackingFruit = raidState.attacker.team[parseInt(attackerFruitIndex)];
    const defendingFruit = raidState.defender.team[targetFruitIndex];
    
    // Check if attacker is dead or disabled
    if (attackingFruit.currentHP <= 0) {
        raidState.battleLog.push({
            type: 'error',
            message: `💀 ${attackingFruit.name} cannot attack - already defeated!`,
            turn: raidState.turn
        });
        return 0;
    }
    
    if (isDisabled(attackingFruit)) {
        raidState.battleLog.push({
            type: 'disable',
            message: `😵 ${attackingFruit.name} is disabled and cannot act!`,
            turn: raidState.turn
        });
        return 0;
    }
    
    if (defendingFruit.currentHP <= 0) {
        raidState.battleLog.push({
            type: 'error',
            message: `💀 Cannot target ${defendingFruit.name} - already defeated!`,
            turn: raidState.turn
        });
        return 0;
    }
    
    // Get skill data with fallback
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: 120,
        cooldown: 2,
        effect: null,
        description: 'A basic devil fruit ability',
        type: 'attack',
        range: 'single'
    };
    
    const isSkillAttack = skillType === 'skill';
    const skillName = isSkillAttack ? skillData.name : 'Basic Attack';
    
    // FIXED: Better action announcement
    raidState.battleLog.push({
        type: 'action_start',
        message: `⚔️ **${raidState.attacker.username}'s ${attackingFruit.name}** uses **${skillName}** against **${defendingFruit.name}**!`,
        turn: raidState.turn,
        attacker: attackingFruit.name,
        defender: defendingFruit.name,
        skill: skillName
    });
    
    // Calculate damage modifiers
    const attackerModifiers = calculateDamageModifiers(attackingFruit);
    const defenderModifiers = calculateDamageModifiers(defendingFruit);
    
    // FIXED: Dodge calculation with NaN protection
    const dodgeChance = calculateDodgeChance(attackingFruit, defendingFruit, defenderModifiers);
    if (Math.random() < dodgeChance) {
        raidState.battleLog.push({
            type: 'dodge',
            message: `💨 **${defendingFruit.name}** dodged the attack!`,
            turn: raidState.turn
        });
        if (isSkillAttack) {
            attackingFruit.cooldown = skillData.cooldown || 2;
        }
        return 0;
    }
    
    // FIXED: Calculate damage based on attack type with NaN protection
    const isBasicAttack = skillType === 'basic';
    const baseDamage = isBasicAttack ? 100 : (skillData.damage || 150);
    
    let damage = calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers, isBasicAttack);
    
    // FIXED: Critical hit calculation with NaN protection
    const criticalChance = calculateCriticalChance(attackingFruit, attackerModifiers, skillData);
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
        damage = Math.floor(damage * RAID_CONFIG.CRIT_DAMAGE_MULTIPLIER);
        raidState.battleLog.push({
            type: 'critical',
            message: `💥 **CRITICAL HIT!** Damage amplified!`,
            turn: raidState.turn
        });
    }
    
    // Apply skill effects
    let effectResults = null;
    if (isSkillAttack && skillData.effect) {
        effectResults = applyEnhancedSkillEffect(attackingFruit, defendingFruit, skillData, damage);
        
        if (effectResults && effectResults.messages && effectResults.messages.length > 0) {
            effectResults.messages.forEach(msg => {
                raidState.battleLog.push({
                    type: 'effect',
                    message: msg,
                    turn: raidState.turn
                });
            });
        }
        
        if (effectResults && effectResults.damageMultiplier && !isNaN(effectResults.damageMultiplier)) {
            damage = Math.floor(damage * effectResults.damageMultiplier);
        }
    }
    
    // FIXED: Apply final damage with clear messaging and NaN protection
    const originalHP = defendingFruit.currentHP || 0;
    const safeDamage = isNaN(damage) ? 50 : Math.max(damage, 1);
    
    defendingFruit.currentHP = Math.max(0, originalHP - safeDamage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // FIXED: Clear damage report
    const damageType = isCritical ? 'critical_damage' : 'normal_damage';
    raidState.battleLog.push({
        type: damageType,
        message: `💥 **${skillName}** deals **${actualDamage}** damage to **${defendingFruit.name}**`,
        turn: raidState.turn,
        damage: actualDamage,
        isCritical
    });
    
    // FIXED: HP status update with NaN protection
    const maxHP = defendingFruit.maxHP || 1000;
    const currentHP = defendingFruit.currentHP || 0;
    const hpPercent = Math.round((currentHP / maxHP) * 100);
    const hpStatus = currentHP > 0 ? 
        `🩸 **${defendingFruit.name}**: ${currentHP}/${maxHP} HP (${hpPercent}%)` :
        `💀 **${defendingFruit.name}** has been defeated!`;
    
    raidState.battleLog.push({
        type: 'hp_update',
        message: hpStatus,
        turn: raidState.turn,
        target: defendingFruit.name,
        hp: currentHP,
        maxHP: maxHP,
        defeated: currentHP === 0
    });
    
    // Handle AOE effects with clear messaging
    if (skillData.range === 'area' || skillData.range === 'all') {
        const aoeDamage = Math.floor(actualDamage * 0.3); // Reduced from 0.4 to 0.3
        let aoeTargets = 0;
        
        raidState.defender.team.forEach((fruit, index) => {
            if (index !== targetFruitIndex && fruit.currentHP > 0) {
                const aoeActualDamage = Math.min(fruit.currentHP, aoeDamage);
                fruit.currentHP = Math.max(0, fruit.currentHP - aoeDamage);
                if (aoeActualDamage > 0) {
                    aoeTargets++;
                }
            }
        });
        
        if (aoeTargets > 0) {
            raidState.battleLog.push({
                type: 'aoe_damage',
                message: `🌊 **Area Effect** hits **${aoeTargets}** additional targets for **${aoeDamage}** damage each!`,
                turn: raidState.turn,
                aoeDamage,
                targets: aoeTargets
            });
        }
    }
    
    // FIXED: Reduced recoil damage
    const recoilDamage = Math.floor(actualDamage * 0.01); // Only 1% recoil
    if (recoilDamage > 0) {
        attackingFruit.currentHP = Math.max(0, attackingFruit.currentHP - recoilDamage);
        raidState.battleLog.push({
            type: 'recoil',
            message: `🩸 **${attackingFruit.name}** takes **${recoilDamage}** recoil damage`,
            turn: raidState.turn
        });
    }
    
    // Set cooldown for skills
    if (isSkillAttack) {
        attackingFruit.cooldown = skillData.cooldown || 2;
    }
    
    // Handle defeated fruits
    if (attackingFruit.currentHP === 0) {
        raidState.battleLog.push({
            type: 'defeat',
            message: `💀 **${attackingFruit.name}** was defeated by recoil damage!`,
            turn: raidState.turn
        });
        attackingFruit.statusEffects = [];
    }
    
    if (defendingFruit.currentHP === 0) {
        raidState.battleLog.push({
            type: 'defeat',
            message: `💀 **${defendingFruit.name}** was defeated!`,
            turn: raidState.turn
        });
        defendingFruit.statusEffects = [];
    }
    
    return actualDamage;
}

// ===== FIXED UI SYSTEM WITH NaN PROTECTION =====

/**
 * FIXED: Create enhanced battle embed with better formatting and NaN protection
 */
function createEnhancedBattleEmbed(raidState, selectedSkill = null) {
    const { attacker, defender, turn } = raidState;
    
    const embed = 
// ===== Cinematic UI (non-invasive) =====
const RAID_ANIM = { enabled: true, delayMs: 900 };

function _hpBar(unit, size = 22) {
  const cur = unit.currentHP || 0;
  const max = unit.maxHP || 1;
  const ratio = Math.max(0, Math.min(1, cur / max));
  const filled = Math.round(ratio * size);
  return "█".repeat(filled) + "░".repeat(size - filled);
}
function _fmtPct(v){ return (v>=0?"+":"") + Math.round(v*100) + "%"; }
function _effectListFor(unit) {
  const list = (unit?.statusEffects||[]);
  if (!list.length) return "—";
  return list.map(e => {
    const dur = (e.duration !== undefined) ? `${e.duration}t` : "";
    const stack = (e.maxStacks > 1 && e.stacks > 1) ? ` x${e.stacks}` : "";
    const parts = [];
    if (e.atkPct) parts.push(`ATK ${_fmtPct(e.atkPct)}`);
    if (e.defPct) parts.push(`DEF ${_fmtPct(e.defPct)}`);
    if (e.dmgDealtPct) parts.push(`DMG Dealt ${_fmtPct(e.dmgDealtPct)}`);
    if (e.dmgTakenPct) parts.push(`DMG Taken ${_fmtPct(e.dmgTakenPct)}`);
    if (e.shield) parts.push(`Shield ${e.shield}`);
    if (e.type === 'dot' && e.damage) parts.push(`DOT ${e.damage}/t`);
    if (e.type === 'hot' && e.damage) parts.push(`HOT ${e.damage}/t`);
    const desc = parts.length ? ` — ${parts.join(', ')}` : "";
    return `${e.icon || '⭐'} ${e.name}${stack}${dur?` (${dur})`:""}${desc}`;
  }).join("\n");
}
function _frontliner(team) {
  return (team||[]).find(u => (u.currentHP||0) > 0) || (team&&team[0]) || { name: "—", currentHP: 0, maxHP: 1, statusEffects: [] };
}
function buildCinematicEmbed(raidState, title = "Battle") {
  try {
    const leftU = _frontliner(raidState.attacker?.team || raidState.left || raidState.playerTeam || []);
    const rightU = _frontliner(raidState.defender?.team || raidState.right || raidState.aiTeam || []);
    const e = new EmbedBuilder()
      .setTitle(`🎮 ${title}`)
      .setDescription(`Turn ${raidState.turn || 1}`)
      .addFields(
        { name: `🜁 YOUR Team`, value: `${leftU.emoji||''} **${leftU.name}**\n\`${_hpBar(leftU)}\` **${Math.round((leftU.currentHP||0)/(leftU.maxHP||1)*100)}%** (${leftU.currentHP||0}/${leftU.maxHP||1})\n**Effects**\n${_effectListFor(leftU)}`, inline: true },
        { name: `🜂 AI Team`, value: `${rightU.emoji||''} **${rightU.name}**\n\`${_hpBar(rightU)}\` **${Math.round((rightU.currentHP||0)/(rightU.maxHP||1)*100)}%** (${rightU.currentHP||0}/${rightU.maxHP||1})\n**Effects**\n${_effectListFor(rightU)}`, inline: true },
        { name: "Log", value: (raidState.battleLog || []).slice(-8).map(x => x.message || x).join("\n") || "—" }
      )
      .setColor(0x2b2d31);
    return e;
  } catch (e) {
    return new EmbedBuilder().setTitle("Battle").setDescription("Cinematic view error");
  }
}
async function ensureCinematicMessage(interaction, raidState) {
  try {
    if (!RAID_ANIM.enabled) return null;
    if (!raidState._cinMsgId) {
      const sent = await interaction.followUp({ embeds: [buildCinematicEmbed(raidState, "Ready")], ephemeral: false });
      raidState._cinMsgId = sent.id;
      raidState._cinChId = sent.channelId;
      return sent;
    }
    return null;
  } catch (e) { return null; }
}
async function updateCinematicFrame(interaction, raidState, title = "Battle") {
  try {
    if (!RAID_ANIM.enabled || !raidState._cinMsgId) return;
    const channel = interaction.channel;
    if (!channel) return;
    const msg = await channel.messages.fetch(raidState._cinMsgId).catch(()=>null);
    if (!msg) return;
    await msg.edit({ embeds: [buildCinematicEmbed(raidState, title)] });
    await new Promise(res => setTimeout(res, RAID_ANIM.delayMs));
  } catch (e) {}
}
new EmbedBuilder()
        .setTitle('⚔️ Devil Fruit Battle Arena')
        .setDescription(`**Turn ${turn}** | ${attacker.username} (YOU) vs ${defender.username} (AI)`)
        .setColor(RARITY_COLORS.legendary)
        .setTimestamp();
    
    // FIXED: Clean team display with NaN protection
    const attackerTeamText = attacker.team.map((fruit, index) => {
        const currentHP = fruit.currentHP || 0;
        const maxHP = fruit.maxHP || 1000;
        const hpBar = createPerfectHPBar(currentHP, maxHP);
        const hpPercent = Math.round((currentHP / maxHP) * 100);
        const cooldownText = fruit.cooldown > 0 ? ` ⏱️${fruit.cooldown}` : '';
        
        let statusEffectsText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effectIcons = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}`)
                .join('');
            statusEffectsText = ` ${effectIcons}`;
        }
        
        return `${fruit.emoji} **${fruit.name}**${cooldownText}${statusEffectsText}\n${hpBar} **${hpPercent}%** (${currentHP}/${maxHP})`;
    }).join('\n\n');
    
    embed.addFields({
        name: `⚔️ YOUR Team (${attacker.username})`,
        value: attackerTeamText || 'No fruits remaining',
        inline: false
    });
    
    // FIXED: AI team display with same clean format and NaN protection
    const defenderTeamText = defender.team.map((fruit, index) => {
        const currentHP = fruit.currentHP || 0;
        const maxHP = fruit.maxHP || 1000;
        const hpBar = createPerfectHPBar(currentHP, maxHP);
        const hpPercent = Math.round((currentHP / maxHP) * 100);
        
        let statusEffectsText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effectIcons = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}`)
                .join('');
            statusEffectsText = ` ${effectIcons}`;
        }
        
        return `${fruit.emoji} **${fruit.name}**${statusEffectsText}\n${hpBar} **${hpPercent}%** (${currentHP}/${maxHP})`;
    }).join('\n\n');
    
    embed.addFields({
        name: `🤖 AI Team (${defender.username})`,
        value: defenderTeamText || 'No fruits remaining',
        inline: false
    });
    
    // FIXED: Better battle log formatting (last 8 actions)
    if (raidState.battleLog.length > 0) {
        const recentActions = raidState.battleLog
            .slice(-8) // Show last 8 actions instead of 6
            .map(entry => {
                // Format based on action type
                switch (entry.type) {
                    case 'action_start':
                        return `⚔️ ${entry.message}`;
                    case 'critical':
                        return `💥 ${entry.message}`;
                    case 'normal_damage':
                    case 'critical_damage':
                        return `💢 ${entry.message}`;
                    case 'hp_update':
                        return `🩸 ${entry.message}`;
                    case 'dodge':
                        return `💨 ${entry.message}`;
                    case 'defeat':
                        return `💀 ${entry.message}`;
                    case 'effect':
                        return `✨ ${entry.message}`;
                    case 'aoe_damage':
                        return `🌊 ${entry.message}`;
                    case 'recoil':
                        return `🔄 ${entry.message}`;
                    default:
                        return entry.message;
                }
            })
            .join('\n');
        
        embed.addFields({
            name: '📜 Recent Battle Actions',
            value: recentActions.length > 1024 ? recentActions.substring(0, 1021) + '...' : recentActions,
            inline: false
        });
    }
    
    // FIXED: Clear turn instructions
    const instructionText = selectedSkill ? 
        `✅ **${selectedSkill.split('_')[0].toUpperCase()} Selected!** Choose your target from the AI team.` :
        `🎯 **Your Turn!** Select an attack/skill, then choose your target.`;
    
    embed.addFields({
        name: '⏰ Turn Instructions',
        value: instructionText,
        inline: false
    });
    
    return embed;
}

/**
 * FIXED: Perfect HP bar with NaN protection
 */
function createPerfectHPBar(currentHP, maxHP) {
    const barLength = 12; // Consistent bar length
    
    // FIXED: Protect against NaN and invalid values
    const safeCurrentHP = isNaN(currentHP) || currentHP < 0 ? 0 : currentHP;
    const safeMaxHP = isNaN(maxHP) || maxHP <= 0 ? 1000 : maxHP;
    
    const percentage = Math.max(0, Math.min(1, safeCurrentHP / safeMaxHP));
    const filledBars = Math.floor(percentage * barLength);
    const emptyBars = barLength - filledBars;
    
    if (percentage <= 0) {
        return '⚪'.repeat(barLength); // WHITE circles when dead
    }
    
    let hpEmoji = '🟢'; // Green for healthy
    if (percentage < 0.25) {
        hpEmoji = '🔴'; // Red for critical
    } else if (percentage < 0.5) {
        hpEmoji = '🟡'; // Yellow for wounded
    }
    
    return hpEmoji.repeat(filledBars) + '⚫'.repeat(emptyBars);
}

// ===== FIXED AI SYSTEM =====

/**
 * FIXED: Enhanced AI turn processing with proper message categorization
 */
async function processAITurn(raidState) {
    const availableAIFruits = raidState.defender.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => 
            fruit.currentHP > 0 && 
            fruit.cooldown === 0 && 
            !isDisabled(fruit)
        );
    
    if (availableAIFruits.length === 0) {
        raidState.battleLog.push({
            type: 'ai_skip',
            message: `⏭️ **AI ${raidState.defender.username}** has no available fruits - turn skipped!`,
            turn: raidState.turn
        });
        return;
    }
    
    // Target PLAYER team
    const availablePlayerTargets = raidState.attacker.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => fruit.currentHP > 0);
    
    if (availablePlayerTargets.length === 0) {
        raidState.battleLog.push({
            type: 'ai_no_targets',
            message: `⏭️ **AI ${raidState.defender.username}** has no valid targets!`,
            turn: raidState.turn
        });
        return;
    }
    
    // Smart AI fruit and target selection
    const selectedAI = selectBestAIFruit(availableAIFruits, availablePlayerTargets);
    const selectedTarget = selectBestAITarget(availablePlayerTargets, selectedAI.fruit);
    
    // Enhanced AI skill decision
    const skillData = getSkillData(selectedAI.fruit.id, selectedAI.fruit.rarity);
    const shouldUseSkill = decideAISkillUsage(selectedAI.fruit, selectedTarget.fruit, skillData, raidState);
    
    const skillChoice = shouldUseSkill ? `skill_${selectedAI.index}` : `basic_${selectedAI.index}`;
    
    // FIXED: Better AI action announcement with proper categorization
    const actionType = shouldUseSkill ? skillData?.name || 'Special Skill' : 'Basic Attack';
    
    raidState.battleLog.push({
        type: 'ai_action',
        message: `🤖 **AI ${selectedAI.fruit.name}** prepares **${actionType}** against **YOUR ${selectedTarget.fruit.name}**!`,
        turn: raidState.turn
    });
    
    // Execute AI attack against PLAYER target
    const actualDamage = await executeAIAttack(raidState, selectedAI, selectedTarget, shouldUseSkill, skillData);
    
    // FIXED: Ensure AI does meaningful damage
    if (actualDamage === 0 && shouldUseSkill) {
        raidState.battleLog.push({
            type: 'ai_miss',
            message: `⚠️ **AI attack missed** - applying backup damage`,
            turn: raidState.turn
        });
        const backupDamage = Math.max(Math.floor(selectedTarget.fruit.maxHP * 0.05), 15); // At least 5% or 15 damage
        selectedTarget.fruit.currentHP = Math.max(0, selectedTarget.fruit.currentHP - backupDamage);
        
        raidState.battleLog.push({
            type: 'ai_backup_damage',
            message: `💥 **AI** deals **${backupDamage}** backup damage to **YOUR ${selectedTarget.fruit.name}**`,
            turn: raidState.turn
        });
        
        const hpPercent = Math.round((selectedTarget.fruit.currentHP / selectedTarget.fruit.maxHP) * 100);
        raidState.battleLog.push({
            type: 'ai_hp_update',
            message: `🩸 **YOUR ${selectedTarget.fruit.name}**: ${selectedTarget.fruit.currentHP}/${selectedTarget.fruit.maxHP} HP (${hpPercent}%)`,
            turn: raidState.turn
        });
    }
}

/**
 * FIXED: Execute AI attack with guaranteed meaningful damage and NaN protection
 */
async function executeAIAttack(raidState, selectedAI, selectedTarget, shouldUseSkill, skillData) {
    const attackingFruit = selectedAI.fruit;
    const defendingFruit = selectedTarget.fruit;
    
    const skillName = shouldUseSkill ? (skillData?.name || 'Special Skill') : 'Basic Attack';
    
    // Calculate damage modifiers
    const attackerModifiers = calculateDamageModifiers(attackingFruit);
    const defenderModifiers = calculateDamageModifiers(defendingFruit);
    
    // FIXED: Much lower dodge chance for AI attacks
    const dodgeChance = calculateDodgeChance(attackingFruit, defendingFruit, defenderModifiers) * 0.3; // AI has much better accuracy
    if (Math.random() < dodgeChance) {
        raidState.battleLog.push({
            type: 'ai_dodge',
            message: `💨 **YOUR ${defendingFruit.name}** dodged the AI attack!`,
            turn: raidState.turn
        });
        if (shouldUseSkill) {
            attackingFruit.cooldown = skillData?.cooldown || 2;
        }
        return 0;
    }
    
    // FIXED: Calculate higher AI damage with NaN protection
    const isBasicAttack = !shouldUseSkill;
    const baseDamage = isBasicAttack ? 120 : (skillData?.damage || 180); // Higher AI base damage
    
    let damage = calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers, isBasicAttack);
    
    // FIXED: AI gets damage reduction (nerf) to make player stronger
    damage = Math.floor(damage * RAID_CONFIG.AI_DAMAGE_NERF); // Reduce AI damage by 20%
    
    // Critical hit calculation
    const criticalChance = calculateCriticalChance(attackingFruit, attackerModifiers, skillData) * 0.7; // Reduce AI crit chance
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
        damage = Math.floor(damage * RAID_CONFIG.CRIT_DAMAGE_MULTIPLIER);
        raidState.battleLog.push({
            type: 'ai_critical',
            message: `💥 **AI scores a CRITICAL HIT!**`,
            turn: raidState.turn
        });
    }
    
    // Apply skill effects if using skill
    if (shouldUseSkill && skillData?.effect) {
        const effectResults = applyEnhancedSkillEffect(attackingFruit, defendingFruit, skillData, damage);
        
        if (effectResults && effectResults.messages && effectResults.messages.length > 0) {
            effectResults.messages.forEach(msg => {
                raidState.battleLog.push({
                    type: 'ai_effect',
                    message: msg,
                    turn: raidState.turn
                });
            });
        }
        
        if (effectResults && effectResults.damageMultiplier && !isNaN(effectResults.damageMultiplier)) {
            damage = Math.floor(damage * effectResults.damageMultiplier);
        }
    }
    
    // FIXED: Apply final damage to PLAYER fruit with better messaging and NaN protection
    const originalHP = defendingFruit.currentHP || 0;
    const safeDamage = isNaN(damage) ? 50 : Math.max(damage, 1);
    
    defendingFruit.currentHP = Math.max(0, originalHP - safeDamage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // FIXED: Ensure minimum damage from AI
    if (actualDamage === 0 && damage > 0) {
        const minDamage = Math.max(Math.floor((defendingFruit.maxHP || 1000) * 0.04), 12); // At least 4% or 12 damage
        defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - minDamage);
        const forcedDamage = originalHP - defendingFruit.currentHP;
        
        raidState.battleLog.push({
            type: 'ai_damage',
            message: `💥 **AI ${skillName}** deals **${forcedDamage}** damage to **YOUR ${defendingFruit.name}**`,
            turn: raidState.turn,
            damage: forcedDamage,
            isCritical
        });
        
        const maxHP = defendingFruit.maxHP || 1000;
        const hpPercent = Math.round((defendingFruit.currentHP / maxHP) * 100);
        raidState.battleLog.push({
            type: 'hp_update',
            message: `🩸 **YOUR ${defendingFruit.name}**: ${defendingFruit.currentHP}/${maxHP} HP (${hpPercent}%)`,
            turn: raidState.turn
        });
        
        return forcedDamage;
    }
    
    // Set AI cooldown
    if (shouldUseSkill) {
        attackingFruit.cooldown = skillData?.cooldown || 2;
    }
    
    // FIXED: Enhanced battle log for AI actions with proper categorization
    const damageType = isCritical ? 'ai_critical_damage' : 'ai_damage';
    raidState.battleLog.push({
        type: damageType,
        message: `💥 **🤖 AI ${skillName}** deals **${actualDamage}** damage to **YOUR ${defendingFruit.name}**`,
        turn: raidState.turn,
        damage: actualDamage,
        isCritical
    });
    
    const maxHP = defendingFruit.maxHP || 1000;
    const currentHP = defendingFruit.currentHP || 0;
    const hpPercent = Math.round((currentHP / maxHP) * 100);
    const hpStatus = currentHP > 0 ? 
        `🩸 **YOUR ${defendingFruit.name}**: ${currentHP}/${maxHP} HP (${hpPercent}%)` :
        `💀 **YOUR ${defendingFruit.name}** has been defeated by AI!`;
    
    raidState.battleLog.push({
        type: 'ai_hp_update',
        message: hpStatus,
        turn: raidState.turn,
        target: defendingFruit.name,
        hp: currentHP,
        maxHP: maxHP,
        defeated: currentHP === 0
    });
    
    // Handle defeated player fruits
    if (currentHP === 0) {
        raidState.battleLog.push({
            type: 'defeat',
            message: `💀 **YOUR ${defendingFruit.name}** was defeated by AI!`,
            turn: raidState.turn
        });
        defendingFruit.statusEffects = [];
    }
    
    return actualDamage;
}

/**
 * FIXED: Enhanced AI skill usage decision - MUCH less aggressive
 */
function decideAISkillUsage(attackingFruit, targetFruit, skillData, raidState) {
    if (!skillData || attackingFruit.cooldown > 0) {
        return false;
    }
    
    const targetHpPercent = (targetFruit.currentHP || 0) / (targetFruit.maxHP || 1000);
    
    // PRIORITY 1: Use skills for finishing blows only if very likely to kill
    if (targetHpPercent < 0.25 && skillData.damage > (targetFruit.currentHP * 1.2)) {
        return true;
    }
    
    // PRIORITY 2: AOE skills only if 3+ targets and low player HP
    const livingTargets = raidState.attacker.team.filter(f => f.currentHP > 0).length;
    const averagePlayerHP = raidState.attacker.team.reduce((sum, f) => sum + ((f.currentHP || 0)/(f.maxHP || 1000)), 0) / raidState.attacker.team.length;
    if ((skillData.range === 'area' || skillData.range === 'all') && livingTargets > 3 && averagePlayerHP < 0.5) {
        return Math.random() < 0.7; // 70% chance
    }
    
    // PRIORITY 3: Effect skills less often
    if (skillData.effect) {
        return Math.random() < 0.6; // 60% chance for effect skills
    }
    
    // PRIORITY 4: High damage skills only against healthy targets
    if (targetHpPercent > 0.8 && skillData.damage > 150) {
        return Math.random() < 0.5; // 50% chance
    }
    
    // PRIORITY 5: Use skills less often early in battle
    if (raidState.turn <= 5) {
        return Math.random() < 0.4; // Only 40% in first 5 turns
    }
    
    // PRIORITY 6: Much lower general skill preference
    return Math.random() < RAID_CONFIG.AI_SKILL_USE_CHANCE; // Only 30% base chance
}

// ===== HELPER FUNCTIONS =====

/**
 * Calculate critical hit chance with MUCH stronger rarity scaling
 */
function calculateCriticalChance(attacker, attackerModifiers, skillData) {
    let critChance = RAID_CONFIG.BASE_CRIT_CHANCE;
    
    // FIXED: Much stronger rarity bonus for crits
    const rarityBonus = {
        'common': 0.05, 'uncommon': 0.10, 'rare': 0.15, 'epic': 0.20,
        'legendary': 0.30, 'mythical': 0.40, 'divine': 0.50  // DIVINE gets 50% bonus crit!
    };
    critChance += (rarityBonus[attacker.rarity] || 0.05);
    
    // Skill bonus
    if (skillData && skillData.type === 'attack') {
        critChance += 0.15; // Increased skill crit bonus
    }
    
    // Status effect modifiers with NaN protection
    if (attackerModifiers.criticalModifier && !isNaN(attackerModifiers.criticalModifier)) {
        critChance += attackerModifiers.criticalModifier;
    }
    
    return Math.max(0, Math.min(0.95, critChance));
}

/**
 * Calculate dodge chance with diminishing returns and NaN protection
 */
function calculateDodgeChance(attacker, defender, defenderModifiers) {
    let dodgeChance = RAID_CONFIG.BASE_DODGE_CHANCE;
    
    // Speed difference factor with NaN protection
    const attackerCP = attacker.totalCP || 1000;
    const defenderCP = defender.totalCP || 1000;
    const speedDiff = (defenderCP - attackerCP) / 15000;
    dodgeChance += Math.max(-0.03, Math.min(0.08, speedDiff));
    
    // Status effect modifiers with NaN protection
    if (defenderModifiers.speedModifier && !isNaN(defenderModifiers.speedModifier)) {
        const speedBonus = (defenderModifiers.speedModifier - 1) * 0.15;
        dodgeChance += speedBonus;
    }
    
    return Math.max(0.01, Math.min(0.20, dodgeChance));
}

function calculateDamageModifiers(fruit) {
    let damageModifier = 1;
    let criticalModifier = 0;
    let speedModifier = 1;
    
    if (fruit.statusEffects) {
        fruit.statusEffects.forEach(effect => {
            if (effect.type === 'buff') {
                switch (effect.effect) {
                    case 'damage':
                        damageModifier *= (1 + (effect.modifier || 0.2));
                        break;
                    case 'critical':
                        criticalModifier += (effect.modifier || 0.2);
                        break;
                    case 'speed':
                        speedModifier *= (1 + (effect.modifier || 0.2));
                        break;
                }
            } else if (effect.type === 'debuff') {
                switch (effect.effect) {
                    case 'damage':
                        damageModifier *= (1 + (effect.modifier || -0.2));
                        break;
                    case 'speed':
                        speedModifier *= (1 + (effect.modifier || -0.2));
                        break;
                }
            }
        });
    }
    
    return { 
        damageModifier: Math.max(0.1, damageModifier), 
        criticalModifier: Math.max(0, Math.min(0.8, criticalModifier)), 
        speedModifier: Math.max(0.1, speedModifier) 
    };
}

function applyEnhancedSkillEffect(attacker, defender, skillData, skillDamage) {
    const result = {
        effectName: skillData.effect,
        messages: [],
        damageMultiplier: null
    };

    const attackerFruitName = attacker.name;
    const defenderFruitName = defender.name;

    const effectMapping = {
        'burn_damage': () => {
            const dotDamage = Math.floor(skillDamage * 0.25);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Burning',
                duration: 3,
                damage: dotDamage,
                icon: '🔥',
                source: attackerFruitName
            });
            result.messages.push(`🔥 **${defenderFruitName}** is set ablaze! (${dotDamage} damage/turn for 3 turns)`);
        },
        
        'freeze_effect': () => {
            const dotDamage = Math.floor(skillDamage * 0.18);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Frostbite',
                duration: 2,
                damage: dotDamage,
                icon: '❄️',
                source: attackerFruitName
            });
            result.messages.push(`❄️ **${defenderFruitName}** is frozen! (${dotDamage} frostbite/turn for 2 turns)`);
        },
        
        'lightning_strike': () => {
            const dotDamage = Math.floor(skillDamage * 0.15);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Electrocution',
                duration: 2,
                damage: dotDamage,
                icon: '⚡',
                source: attackerFruitName
            });
            result.messages.push(`⚡ **${defenderFruitName}** is electrocuted! (${dotDamage} shock/turn for 2 turns)`);
        },
        
        'default': () => {
            const dotDamage = Math.floor(skillDamage * 0.20);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Devil Fruit Effect',
                duration: 2,
                damage: dotDamage,
                icon: '🍈',
                source: attackerFruitName
            });
            result.messages.push(`🍈 **${defenderFruitName}** suffers from devil fruit power! (${dotDamage} damage/turn for 2 turns)`);
        }
    };

    const effectFunction = effectMapping[skillData.effect] || effectMapping['default'];
    effectFunction();

    return result;
}

function addStatusEffect(fruit, effect) {
    if (!fruit.statusEffects) {
        fruit.statusEffects = [];
    }

    const existingEffect = fruit.statusEffects.find(e => e.name === effect.name);
    
    if (existingEffect) {
        existingEffect.duration = Math.max(existingEffect.duration, effect.duration);
        if (effect.damage && existingEffect.damage) {
            existingEffect.damage = Math.max(existingEffect.damage, effect.damage);
        }
    } else {
        fruit.statusEffects.push(effect);
    }
}

function isDisabled(fruit) {
    if (!fruit.statusEffects) return false;
    return fruit.statusEffects.some(effect => 
        effect.type === 'disable' && (effect.name === 'Stunned' || effect.name === 'Frozen')
    );
}

function areSkillsDisabled(fruit) {
    if (!fruit.statusEffects) return false;
    return fruit.statusEffects.some(effect => 
        effect.type === 'disable' && effect.name === 'Skill Locked'
    );
}

/**
 * FIXED: Better rarity bonus for basic attacks
 */
function getRarityBasicAttackBonus(rarity) {
    const bonuses = {
        'common': 1.0, 'uncommon': 1.2, 'rare': 1.4, 'epic': 1.7,
        'legendary': 2.0, 'mythical': 2.5, 'divine': 3.0  // DIVINE is 3x stronger!
    };
    return bonuses[rarity] || 1.0;
}

/**
 * FIXED: Better rarity damage bonus for skills
 */
function getRarityDamageBonus(rarity) {
    const bonuses = {
        'common': 1.0, 'uncommon': 1.15, 'rare': 1.3, 'epic': 1.5,
        'legendary': 1.8, 'mythical': 2.2, 'divine': 2.8  // DIVINE is 2.8x stronger!
    };
    return bonuses[rarity] || 1.0;
}

// ===== BATTLE INTERFACE SYSTEM =====

/**
 * FIXED: Enhanced battle interface with better status processing
 */
async async function showBattleInterface(interaction, raidState) {
    // Create/ensure cinematic message
    await ensureCinematicMessage(interaction, raidState);
    // FIXED: Process status effects with clear messaging
    if (raidState.battleLog.length === 0 || !raidState.battleLog.some(entry => entry.turn === raidState.turn)) {
        raidState.battleLog.push({
            type: 'turn_start',
            message: `\n⏰ **=== TURN ${raidState.turn} START ===**`,
            turn: raidState.turn
        });
    }
    
    processAllStatusEffects(raidState);
        await updateCinematicFrame(interaction, raidState, 'Battle');
    
    // Check if battle ended due to status effects
    const battleResult = checkBattleEnd(raidState);
    if (battleResult.ended) {
        await endBattle(interaction, raidState, battleResult);
        return;
    }
    
    const availableFruits = raidState.attacker.team
        .filter(fruit => fruit.currentHP > 0 && fruit.cooldown === 0 && !isDisabled(fruit));
    
    if (availableFruits.length === 0) {
        raidState.battleLog.push({
            type: 'player_skip',
            message: `⏭️ **${raidState.attacker.username}** has no available fruits - turn skipped!`,
            turn: raidState.turn
        });
        
        await processAITurn(raidState);
        
        processAllStatusEffects(raidState);
        
        const battleResult2 = checkBattleEnd(raidState);
        if (battleResult2.ended) {
            await endBattle(interaction, raidState, battleResult2);
            return;
        }
        
        reduceCooldowns(raidState.attacker);
        reduceCooldowns(raidState.defender);
        raidState.turn++;
        raidState.currentPlayer = 'attacker';
        await updateCinematicFrame(interaction, raidState, 'Battle');
        
        return showBattleInterface(interaction, raidState);
    }
    
    const embed = createEnhancedBattleEmbed(raidState);
    const components = createEnhancedBattleComponents(raidState);
    
    try {
        await interaction.editReply({
            embeds: [embed],
            components
        });
        
        setupEnhancedBattleCollector(interaction, raidState);
    } catch (error) {
        console.error('Failed to show battle interface:', error);
        await endBattle(interaction, raidState, { 
            ended: true, 
            winner: raidState.defender.userId, 
            reason: 'interface_error' 
        });
    }
}

/**
 * FIXED: Process all status effects with better team identification
 */
function processAllStatusEffects(raidState) {
    // Process attacker team status effects
    raidState.attacker.team.forEach(fruit => {
        if (fruit.currentHP > 0) {
            processStatusEffects(fruit, raidState.battleLog, raidState.turn, 'YOUR');
        }
    });
    
    // Process defender team status effects
    raidState.defender.team.forEach(fruit => {
        if (fruit.currentHP > 0) {
            processStatusEffects(fruit, raidState.battleLog, raidState.turn, 'AI');
        }
    });
}

/**
 * FIXED: Process individual fruit status effects with better formatting
 */
function processStatusEffects(fruit, battleLog, turn, teamPrefix = '') {
    if (!fruit.statusEffects || fruit.statusEffects.length === 0) return;

    fruit.statusEffects = fruit.statusEffects.filter(effect => {
        let shouldKeepEffect = true;
        
        switch (effect.type) {
            case 'dot':
                const dotDamage = effect.damage || Math.floor((fruit.maxHP || 1000) * 0.1);
                const actualDotDamage = Math.min(fruit.currentHP || 0, dotDamage);
                
                if (actualDotDamage > 0) {
                    fruit.currentHP = Math.max(0, fruit.currentHP - actualDotDamage);
                    battleLog.push({
                        type: 'status_damage',
                        message: `${effect.icon || '☠️'} **${teamPrefix} ${fruit.name}** takes **${actualDotDamage}** ${effect.name} damage`,
                        turn: turn
                    });
                    
                    if (fruit.currentHP === 0) {
                        battleLog.push({
                            type: 'status_defeat',
                            message: `💀 **${teamPrefix} ${fruit.name}** was defeated by ${effect.name}!`,
                            turn: turn
                        });
                    }
                }
                break;
                
            case 'heal':
                const healAmount = effect.value || Math.floor((fruit.maxHP || 1000) * 0.1);
                const actualHeal = Math.min(healAmount, (fruit.maxHP || 1000) - fruit.currentHP);
                
                if (actualHeal > 0) {
                    fruit.currentHP = Math.min(fruit.maxHP || 1000, fruit.currentHP + actualHeal);
                    battleLog.push({
                        type: 'status_heal',
                        message: `${effect.icon || '💚'} **${teamPrefix} ${fruit.name}** recovers **${actualHeal}** HP from ${effect.name}`,
                        turn: turn
                    });
                }
                break;
        }
        
        if (effect.duration > 0) {
            effect.duration--;
            
            if (effect.duration === 0) {
                battleLog.push({
                    type: 'status_expire',
                    message: `⏰ **${effect.name}** expired on **${teamPrefix} ${fruit.name}**`,
                    turn: turn
                });
                shouldKeepEffect = false;
            }
        }
        
        return shouldKeepEffect;
    });
}

/**
 * FIXED: Enhanced battle components with better skill info
 */
function createEnhancedBattleComponents(raidState, selectedSkill = null) {
    if (raidState.currentPlayer !== 'attacker') {
        return [];
    }
    
    const components = [];
    
    // STEP 1: Skill Selection Dropdown
    if (!selectedSkill) {
        const availableSkills = [];
        
        raidState.attacker.team.forEach((fruit, index) => {
            if (fruit.currentHP > 0 && !isDisabled(fruit)) {
                const skillData = getSkillData(fruit.id, fruit.rarity) || {
                    name: `${fruit.name} Power`,
                    damage: 120,
                    cooldown: 2
                };
                
                // Basic Attack option with improved damage calculation
                const rarityBasicBonus = getRarityBasicAttackBonus(fruit.rarity);
                const basicDamage = Math.floor(100 * rarityBasicBonus);
                availableSkills.push({
                    label: `${fruit.name} - Basic Attack`,
                    description: `~${basicDamage} base damage • Always ready • ${fruit.rarity}`,
                    value: `basic_${index}`,
                    emoji: fruit.emoji
                });
                
                // Special Skill option (if not on cooldown)
                if (fruit.cooldown === 0 && !areSkillsDisabled(fruit)) {
                    let skillDescription = `~${skillData.damage || 150} base damage`;
                    
                    if (skillData.effect) {
                        skillDescription += ` • Special Effect`;
                    }
                    
                    if (skillData.range && skillData.range !== 'single') {
                        skillDescription += ` • ${skillData.range.toUpperCase()}`;
                    }
                    
                    skillDescription += ` • ${skillData.cooldown || 2} turn CD`;
                    
                    availableSkills.push({
                        label: `${fruit.name} - ${skillData.name}`,
                        description: skillDescription.substring(0, 100),
                        value: `skill_${index}`,
                        emoji: '✨'
                    });
                }
            }
        });
        
        if (availableSkills.length > 0) {
            const skillMenu = new StringSelectMenuBuilder()
                .setCustomId(`skill_select_${raidState.id}`)
                .setPlaceholder('🎯 Step 1: Choose your attack type...')
                .addOptions(availableSkills.slice(0, 25));
            
            components.push(new ActionRowBuilder().addComponents(skillMenu));
        }
    }
    
    // STEP 2: Target Selection Dropdown (only AI team)
    if (selectedSkill) {
        const availableTargets = [];
        
        raidState.defender.team.forEach((fruit, index) => {
            if (fruit.currentHP > 0) {
                const maxHP = fruit.maxHP || 1000;
                const currentHP = fruit.currentHP || 0;
                const hpPercent = Math.round((currentHP / maxHP) * 100);
                
                let effectsText = '';
                if (fruit.statusEffects && fruit.statusEffects.length > 0) {
                    const effects = fruit.statusEffects
                        .map(e => `${e.icon || '⭐'}`)
                        .join('');
                    effectsText = ` ${effects}`;
                }
                
                const description = `AI Target • ${hpPercent}% HP • ${fruit.rarity}${effectsText}`.substring(0, 100);
                
                availableTargets.push({
                    label: `🤖 ${fruit.name}`,
                    description: description,
                    value: index.toString(),
                    emoji: fruit.emoji
                });
            }
        });
        
        if (availableTargets.length > 0) {
            const targetMenu = new StringSelectMenuBuilder()
                .setCustomId(`target_select_${raidState.id}`)
                .setPlaceholder('🎯 Step 2: Choose AI target to attack...')
                .addOptions(availableTargets);
            
            components.push(new ActionRowBuilder().addComponents(targetMenu));
        }
        
        // Add a "Back" button
        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`change_skill_${raidState.id}`)
                    .setLabel('↩️ Change Attack')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        components.push(backButton);
    }
    
    return components;
}

// ===== BATTLE MANAGEMENT FUNCTIONS =====

function checkBattleEnd(raidState) {
    const attackerAlive = raidState.attacker.team.some(fruit => fruit.currentHP > 0);
    const defenderAlive = raidState.defender.team.some(fruit => fruit.currentHP > 0);
    
    if (!attackerAlive) {
        return { ended: true, winner: raidState.defender.userId, reason: 'All attacker fruits defeated' };
    }
    
    if (!defenderAlive) {
        return { ended: true, winner: raidState.attacker.userId, reason: 'All defender fruits defeated' };
    }
    
    if (raidState.turn >= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const attackerHP = raidState.attacker.team.reduce((sum, fruit) => sum + (fruit.currentHP || 0), 0);
        const defenderHP = raidState.defender.team.reduce((sum, fruit) => sum + (fruit.currentHP || 0), 0);
        
        return { 
            ended: true, 
            winner: attackerHP > defenderHP ? raidState.attacker.userId : raidState.defender.userId,
            reason: 'Turn limit reached'
        };
    }
    
    return { ended: false };
}

function reduceCooldowns(player) {
    player.team.forEach(fruit => {
        if (fruit.cooldown > 0) {
            fruit.cooldown--;
        }
    });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Update bot status during raids
 */
function updateBotStatus(client, activityType, data = {}) {
    try {
        const { ActivityType } = require('discord.js');
        
        let statusText = 'the Grand Line for Devil Fruits! 🍈';
        let activityTypeDiscord = ActivityType.Watching;
        
        switch (activityType) {
            case 'raid_start':
                statusText = `⚔️ ${data.attacker} raiding ${data.target}!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
            case 'raid_battle':
                statusText = `⚔️ Enhanced battle in progress!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
            case 'raid_end':
                statusText = `🏆 ${data.winner} wins with enhanced combat!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
        }
        
        client.user.setActivity(statusText, { type: activityTypeDiscord });
        
        setTimeout(() => {
            client.user.setActivity('the Grand Line for Devil Fruits! 🍈', { type: ActivityType.Watching });
        }, 30000);
        
    } catch (error) {
        console.error('Failed to update bot status:', error);
    }
}

/**
 * Create error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Raid Error')
        .setDescription(message)
        .setTimestamp();
}

/**
 * Validate raid requirements
 */
async function validateRaid(attackerId, target) {
    if (!target || target.bot) {
        return { valid: false, reason: 'Cannot raid bots or invalid users!' };
    }
    
    if (attackerId === target.id) {
        return { valid: false, reason: 'Cannot raid yourself!' };
    }
    
    const lastRaid = raidCooldowns.get(attackerId);
    if (lastRaid && Date.now() - lastRaid < RAID_CONFIG.COOLDOWN_TIME) {
        const timeLeft = Math.ceil((RAID_CONFIG.COOLDOWN_TIME - (Date.now() - lastRaid)) / 1000 / 60);
        return { valid: false, reason: `Raid cooldown active! Wait ${timeLeft} more minutes.` };
    }
    
    try {
        const targetUser = await DatabaseManager.getUser(target.id);
        if (!targetUser || targetUser.total_cp < RAID_CONFIG.MIN_CP_REQUIRED) {
            return { valid: false, reason: `Target must have at least ${RAID_CONFIG.MIN_CP_REQUIRED} CP to be raided!` };
        }
    } catch (error) {
        return { valid: false, reason: 'Could not verify target information!' };
    }
    
    return { valid: true };
}

/**
 * Get user fruits for selection
 */
async function getUserFruitsForSelection(userId) {
    const fruits = await DatabaseManager.query(`
        SELECT DISTINCT ON (fruit_id) 
            fruit_id, fruit_name, fruit_type, fruit_rarity, 
            fruit_description, total_cp, base_cp
        FROM user_devil_fruits 
        WHERE user_id = $1 
        ORDER BY fruit_id, total_cp DESC
    `, [userId]);
    
    const fruitGroups = {};
    fruits.rows.forEach(fruit => {
        const key = fruit.fruit_id;
        fruitGroups[key] = {
            id: fruit.fruit_id,
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            description: fruit.fruit_description,
            totalCP: fruit.total_cp || 1000,
            baseCP: fruit.base_cp || 100,
            emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪'
        };
    });
    
    return Object.values(fruitGroups).sort((a, b) => b.totalCP - a.totalCP);
}

/**
 * Get defender's strongest fruits
 */
async function getDefenderStrongestFruits(userId) {
    const fruits = await getUserFruitsForSelection(userId);
    return fruits.slice(0, RAID_CONFIG.TEAM_SIZE);
}

/**
 * Start fruit selection
 */
async function startFruitSelection(interaction, attacker, target, attackerFruits) {
    const selectionId = generateSelectionId();
    
    fruitSelections.set(selectionId, {
        attackerId: attacker.id,
        targetId: target.id,
        attackerFruits,
        selectedFruits: [],
        currentPage: 0,
        createdAt: Date.now()
    });
    
    const embed = createFruitSelectionEmbed(attackerFruits, [], 0);
    const components = createFruitSelectionComponents(selectionId, attackerFruits, [], 0);
    
    await interaction.editReply({
        embeds: [embed],
        components
    });
    
    setupFruitSelectionCollector(interaction, selectionId, target);
}

/**
 * Create fruit selection embed
 */
function createFruitSelectionEmbed(allFruits, selectedFruits, currentPage) {
    const selectedCount = selectedFruits.length;
    const remainingSlots = RAID_CONFIG.TEAM_SIZE - selectedCount;
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle(`🍈 Select Your Raid Team (${selectedCount}/${RAID_CONFIG.TEAM_SIZE})`)
        .setDescription(`Choose ${remainingSlots} more Devil Fruit${remainingSlots !== 1 ? 's' : ''} for your raid team!`)
        .setFooter({ text: `Page ${currentPage + 1} • Use buttons to navigate and select` })
        .setTimestamp();
    
    // Show current selections
    if (selectedFruits.length > 0) {
        const selectedText = selectedFruits
            .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
            .join('\n');
        
        embed.addFields({
            name: '✅ Selected Team',
            value: selectedText,
            inline: false
        });
    }
    
    // Show available fruits for current page
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const availableText = pageFruits
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                const isSelected = selectedFruits.some(s => s.id === fruit.id);
                const status = isSelected ? '✅' : `${globalIndex + 1}.`;
                return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.rarity}, ${fruit.totalCP} CP)`;
            })
            .join('\n');
        
        embed.addFields({
            name: '🍈 Available Fruits',
            value: availableText.length > 1000 ? availableText.substring(0, 997) + '...' : availableText,
            inline: false
        });
    }
    
    return embed;
}

/**
 * Create fruit selection components
 */
function createFruitSelectionComponents(selectionId, allFruits, selectedFruits, currentPage) {
    const components = [];
    
    // Navigation buttons
    const navRow = new ActionRowBuilder();
    const totalPages = Math.ceil(allFruits.length / RAID_CONFIG.FRUITS_PER_PAGE);
    
    if (currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_prev_${selectionId}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_next_${selectionId}`)
                .setLabel('➡️ Next')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (navRow.components.length > 0) {
        components.push(navRow);
    }
    
    // Fruit selection dropdown
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0 && selectedFruits.length < RAID_CONFIG.TEAM_SIZE) {
        const options = pageFruits.map((fruit, index) => {
            const globalIndex = startIndex + index;
            
            return {
                label: `${fruit.name} (${fruit.totalCP} CP)`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.type}`.substring(0, 100),
                value: `fruit_${globalIndex}`,
                emoji: fruit.emoji
            };
        });
        
        const remainingSlots = RAID_CONFIG.TEAM_SIZE - selectedFruits.length;
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`fruit_select_${selectionId}`)
            .setPlaceholder('Select fruits for your raid team...')
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, remainingSlots))
            .addOptions(options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    
    // Action buttons
    const actionRow = new ActionRowBuilder();
    
    if (selectedFruits.length > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_clear_${selectionId}`)
                .setLabel('🗑️ Clear All')
                .setStyle(ButtonStyle.Danger)
        );
    }
    
    if (selectedFruits.length === RAID_CONFIG.TEAM_SIZE) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_confirm_${selectionId}`)
                .setLabel('⚔️ Start Raid!')
                .setStyle(ButtonStyle.Success)
        );
    }
    
    if (actionRow.components.length > 0) {
        components.push(actionRow);
    }
    
    return components;
}

/**
 * Setup fruit selection collector
 */
function setupFruitSelectionCollector(interaction, selectionId, target) {
    const filter = (i) => i.user.id === interaction.user.id;
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: RAID_CONFIG.INTERACTION_TIMEOUT
    });
    
    collector.on('collect', async (componentInteraction) => {
        try {
            const selection = fruitSelections.get(selectionId);
            if (!selection) {
                return componentInteraction.reply({
                    content: 'Selection session expired!',
                    ephemeral: true
                });
            }
            
            const customId = componentInteraction.customId;
            
            if (customId.startsWith('fruit_prev_')) {
                await handlePageNavigation(componentInteraction, selectionId, 'prev');
            } else if (customId.startsWith('fruit_next_')) {
                await handlePageNavigation(componentInteraction, selectionId, 'next');
            } else if (customId.startsWith('fruit_select_')) {
                await handleFruitSelection(componentInteraction, selectionId);
            } else if (customId.startsWith('fruit_clear_')) {
                await handleClearSelection(componentInteraction, selectionId);
            } else if (customId.startsWith('fruit_confirm_')) {
                await handleConfirmSelection(componentInteraction, selectionId, target);
                collector.stop('confirmed');
            }
        } catch (error) {
            console.error('Fruit selection error:', error);
            try {
                await componentInteraction.reply({
                    content: 'An error occurred. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
            }
        }
    });
    
    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.followUp({
                embeds: [createErrorEmbed('Fruit selection timed out!')],
                ephemeral: true
            }).catch(() => {});
        }
        
        fruitSelections.delete(selectionId);
    });
}

/**
 * Handle page navigation
 */
async function handlePageNavigation(interaction, selectionId, direction) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    const totalPages = Math.ceil(selection.attackerFruits.length / RAID_CONFIG.FRUITS_PER_PAGE);
    
    if (direction === 'prev' && selection.currentPage > 0) {
        selection.currentPage--;
    } else if (direction === 'next' && selection.currentPage < totalPages - 1) {
        selection.currentPage++;
    }
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle fruit selection
 */
async function handleFruitSelection(interaction, selectionId) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    const selectedValues = interaction.values;
    
    // Process selections
    selectedValues.forEach(value => {
        const fruitIndex = parseInt(value.split('_')[1]);
        const fruit = selection.attackerFruits[fruitIndex];
        
        if (fruit && !selection.selectedFruits.some(s => s.id === fruit.id)) {
            if (selection.selectedFruits.length < RAID_CONFIG.TEAM_SIZE) {
                selection.selectedFruits.push(fruit);
            }
        }
    });
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle clear selection
 */
async function handleClearSelection(interaction, selectionId) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    selection.selectedFruits = [];
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle confirm selection
 */
async function handleConfirmSelection(interaction, selectionId, target) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (selection.selectedFruits.length !== RAID_CONFIG.TEAM_SIZE) {
        return interaction.reply({ 
            content: `❌ You must select exactly ${RAID_CONFIG.TEAM_SIZE} fruits!`, 
            ephemeral: true 
        });
    }
    
    await interaction.update({
        embeds: [new EmbedBuilder()
            .setColor(RARITY_COLORS.epic)
            .setTitle('⚔️ Starting Enhanced Raid Battle!')
            .setDescription('Preparing for battle with improved damage system and UI!')
            .setTimestamp()],
        components: []
    });
    
    // Get defender team
    const defenderFruits = await getDefenderStrongestFruits(target.id);
    
    // Start the battle
    await startBattle(interaction, selection.attackerId, selection.targetId, selection.selectedFruits, defenderFruits);
    
    fruitSelections.delete(selectionId);
}

/**
 * Start battle with FIXED fruit initialization
 */
async function startBattle(interaction, attackerId, defenderId, attackerTeam, defenderTeam) {
    const raidId = generateRaidId();
    
    const [attackerUser, defenderUser] = await Promise.all([
        DatabaseManager.getUser(attackerId),
        DatabaseManager.getUser(defenderId)
    ]);
    
    updateBotStatus(interaction.client, 'raid_battle', {
        attacker: attackerUser.username,
        defender: defenderUser.username
    });
    
    // FIXED: Properly initialize fruits with HP and all required properties
    const raidState = {
        id: raidId,
        attacker: {
            userId: attackerId,
            username: attackerUser.username,
            team: attackerTeam.map(fruit => {
                const maxHP = calculateFruitHP(fruit);
                return {
                    ...fruit,
                    currentHP: maxHP,
                    maxHP: maxHP,
                    cooldown: 0,
                    statusEffects: [],
                    // FIXED: Ensure all required properties exist
                    totalCP: fruit.totalCP || 1000,
                    rarity: fruit.rarity || 'common',
                    name: fruit.name || 'Unknown Fruit',
                    emoji: fruit.emoji || '🍈'
                };
            }),
            activeFruitIndex: 0
        },
        defender: {
            userId: defenderId,
            username: defenderUser.username,
            team: defenderTeam.map(fruit => {
                const maxHP = calculateFruitHP(fruit);
                return {
                    ...fruit,
                    currentHP: maxHP,
                    maxHP: maxHP,
                    cooldown: 0,
                    statusEffects: [],
                    // FIXED: Ensure all required properties exist
                    totalCP: fruit.totalCP || 1000,
                    rarity: fruit.rarity || 'common',
                    name: fruit.name || 'Unknown Fruit',
                    emoji: fruit.emoji || '🍈'
                };
            }),
            activeFruitIndex: 0
        },
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now(),
        collector: null
    };
    
    activeRaids.set(raidId, raidState);
    
    await showBattleInterface(interaction, raidState);
}

/**
 * Setup enhanced battle collector
 */
function setupEnhancedBattleCollector(interaction, raidState) {
    const filter = (i) => i.user.id === raidState.attacker.userId;
    
    if (raidState.collector) {
        raidState.collector.stop();
    }
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: RAID_CONFIG.TURN_TIMEOUT
    });
    
    let selectedSkill = null;
    
    collector.on('collect', async (componentInteraction) => {
        try {
            const customId = componentInteraction.customId;
            
            if (customId.startsWith('skill_select_')) {
                selectedSkill = componentInteraction.values[0];
                await componentInteraction.deferUpdate();
                
                const updatedEmbed = createEnhancedBattleEmbed(raidState, selectedSkill);
                const updatedComponents = createEnhancedBattleComponents(raidState, selectedSkill);
                
                await interaction.editReply({
                    embeds: [updatedEmbed],
                    components: updatedComponents
                });
                
            } else if (customId.startsWith('target_select_')) {
                if (!selectedSkill) {
                    return componentInteraction.reply({
                        content: '❌ Please select a skill first!',
                        ephemeral: true
                    });
                }
                
                const selectedTarget = parseInt(componentInteraction.values[0]);
                await componentInteraction.deferUpdate();
                
                // Execute player attack
                await executeAttack(raidState, selectedSkill, selectedTarget);
                
                const battleResult = checkBattleEnd(raidState);
                if (battleResult.ended) {
                    await endBattle(interaction, raidState, battleResult);
                    collector.stop();
                    return;
                }
                
                // Process AI turn
                await processAITurn(raidState);
                
                const battleResult2 = checkBattleEnd(raidState);
                if (battleResult2.ended) {
                    await endBattle(interaction, raidState, battleResult2);
                    collector.stop();
                    return;
                }
                
                // Reduce cooldowns and advance turn
                reduceCooldowns(raidState.attacker);
                reduceCooldowns(raidState.defender);
                raidState.turn++;
                raidState.currentPlayer = 'attacker';
                
                selectedSkill = null;
                
                await showBattleInterface(interaction, raidState);
                collector.stop();
                
            } else if (customId.startsWith('change_skill_')) {
                selectedSkill = null;
                await componentInteraction.deferUpdate();
                
                const updatedEmbed = createEnhancedBattleEmbed(raidState);
                const updatedComponents = createEnhancedBattleComponents(raidState);
                
                await interaction.editReply({
                    embeds: [updatedEmbed],
                    components: updatedComponents
                });
            }
        } catch (error) {
            console.error('Enhanced battle action error:', error);
            try {
                if (!componentInteraction.replied && !componentInteraction.deferred) {
                    await componentInteraction.reply({
                        content: 'An error occurred during battle. Continuing...',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send battle error response:', replyError);
            }
        }
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && activeRaids.has(raidState.id)) {
            await endBattle(interaction, raidState, { 
                ended: true, 
                winner: raidState.defender.userId, 
                reason: 'timeout' 
            });
        }
    });
    
    raidState.collector = collector;
}

/**
 * End battle
 */
async function endBattle(interaction, raidState, battleResult) {
    try {
        if (raidState.collector) {
            raidState.collector.stop();
        }
        
        const winnerUser = battleResult.winner === raidState.attacker.userId ? 
            raidState.attacker.username : raidState.defender.username;
        
        updateBotStatus(interaction.client, 'raid_end', {
            winner: winnerUser
        });
        
        const rewards = await calculateRewards(raidState, battleResult.winner);
        const resultEmbed = createEnhancedBattleResultEmbed(raidState, battleResult, rewards);
        
        await interaction.editReply({
            embeds: [resultEmbed],
            components: []
        });
        
        activeRaids.delete(raidState.id);
        
    } catch (error) {
        console.error('Error ending battle:', error);
        activeRaids.delete(raidState.id);
    }
}

/**
 * Create enhanced battle result embed
 */
function createEnhancedBattleResultEmbed(raidState, battleResult, rewards) {
    const { attacker, defender } = raidState;
    const { winner, reason } = battleResult;
    
    const winnerName = winner === attacker.userId ? attacker.username : defender.username;
    const loserName = winner === attacker.userId ? defender.username : attacker.username;
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Battle Complete!')
        .setDescription(`**${winnerName}** defeats **${loserName}** with devil fruit mastery!`)
        .setColor(winner === attacker.userId ? 0x00FF00 : 0xFF0000)
        .setTimestamp();
    
    // Show final team status
    const attackerStatus = attacker.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        
        return `${fruit.emoji} **${fruit.name}**\n${hpBar} ${hpPercent}% (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    const defenderStatus = defender.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        
        return `${fruit.emoji} **${fruit.name}**\n${hpBar} ${hpPercent}% (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    embed.addFields(
        {
            name: `⚔️ ${attacker.username}'s Final Team`,
            value: attackerStatus,
            inline: false
        },
        {
            name: `🛡️ ${defender.username}'s Final Team`,
            value: defenderStatus,
            inline: false
        },
        {
            name: '📊 Battle Summary',
            value: [
                `**Winner:** ${winnerName}`,
                `**Reason:** ${reason}`,
                `**Total Turns:** ${raidState.turn}`,
                `**Duration:** ${Math.floor((Date.now() - raidState.startTime) / 1000)}s`
            ].join('\n'),
            inline: false
        }
    );
    
    // Show rewards
    if (rewards.berries > 0 || rewards.fruitsStolen.length > 0) {
        let rewardsText = '';
        
        if (rewards.berries > 0) {
            rewardsText += `💰 **Berries Stolen:** ${rewards.berries.toLocaleString()}\n`;
        }
        
        if (rewards.fruitsStolen.length > 0) {
            rewardsText += `🍈 **Fruits Stolen:** ${rewards.fruitsStolen.length}\n`;
            rewards.fruitsStolen.forEach(fruit => {
                rewardsText += `• ${fruit.emoji || '⚪'} ${fruit.name}\n`;
            });
        }
        
        if (rewardsText) {
            embed.addFields({
                name: '🎁 Battle Rewards',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    return embed;
}

/**
 * Calculate rewards
 */
async function calculateRewards(raidState, winnerId) {
    const rewards = {
        berries: 0,
        fruitsStolen: [],
        experience: 0
    };
    
    if (winnerId === raidState.attacker.userId) {
        const defenderUser = await DatabaseManager.getUser(raidState.defender.userId);
        const targetBerries = defenderUser.berries || 0;
        const berriesStolen = Math.floor(targetBerries * RAID_CONFIG.BERRY_STEAL_PERCENTAGE);
        
        if (berriesStolen > 0) {
            rewards.berries = berriesStolen;
            
            try {
                await DatabaseManager.updateUserBerries(raidState.attacker.userId, berriesStolen, 'raid_victory');
                await DatabaseManager.updateUserBerries(raidState.defender.userId, -berriesStolen, 'raid_loss');
            } catch (error) {
                console.error('Error updating berries:', error);
            }
        }
        
        const stolenFruits = await tryStealFruits(raidState.defender.userId, raidState.attacker.userId);
        rewards.fruitsStolen = stolenFruits;
        
        rewards.experience = Math.floor(defenderUser.total_cp / 100);
        
        raidCooldowns.set(raidState.attacker.userId, Date.now());
    }
    
    return rewards;
}

/**
 * Try to steal fruits
 */
async function tryStealFruits(targetId, attackerId) {
    const stolenFruits = [];
    
    try {
        const targetFruits = await DatabaseManager.getUserDevilFruits(targetId);
        
        for (let i = 0; i < RAID_CONFIG.MAX_FRUIT_DROPS && stolenFruits.length < RAID_CONFIG.MAX_FRUIT_DROPS; i++) {
            if (targetFruits.length === 0) break;
            
            const randomFruit = targetFruits[Math.floor(Math.random() * targetFruits.length)];
            const dropChance = RAID_CONFIG.FRUIT_DROP_CHANCES[randomFruit.fruit_rarity] || 0.1;
            
            if (Math.random() < dropChance) {
                await transferFruit(randomFruit, targetId, attackerId);
                stolenFruits.push({
                    name: randomFruit.fruit_name,
                    rarity: randomFruit.fruit_rarity,
                    emoji: RARITY_EMOJIS[randomFruit.fruit_rarity] || '⚪'
                });
                
                const index = targetFruits.indexOf(randomFruit);
                if (index > -1) {
                    targetFruits.splice(index, 1);
                }
            }
        }
    } catch (error) {
        console.error('Error stealing fruits:', error);
    }
    
    return stolenFruits;
}

/**
 * Transfer fruit between users
 */
async function transferFruit(fruit, fromUserId, toUserId) {
    try {
        await DatabaseManager.query(`
            DELETE FROM user_devil_fruits 
            WHERE user_id = $1 AND fruit_id = $2 
            AND id = (
                SELECT id FROM user_devil_fruits 
                WHERE user_id = $1 AND fruit_id = $2 
                LIMIT 1
            )
        `, [fromUserId, fruit.fruit_id]);
        
        await DatabaseManager.addDevilFruit(toUserId, {
            id: fruit.fruit_id,
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            multiplier: (fruit.base_cp / 100).toFixed(1),
            description: fruit.fruit_description
        });
        
        await DatabaseManager.recalculateUserCP(fromUserId);
        await DatabaseManager.recalculateUserCP(toUserId);
        
    } catch (error) {
        console.error('Error transferring fruit:', error);
    }
}

/**
 * Generate unique raid ID
 */
function generateRaidId() {
    return `raid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate unique selection ID
 */
function generateSelectionId() {
    return `selection_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Enhanced AI fruit selection
 */
function selectBestAIFruit(availableAIFruits, playerTargets) {
    let bestScore = -1;
    let bestFruit = availableAIFruits[0];
    
    availableAIFruits.forEach(({ fruit, index }) => {
        let score = 0;
        
        // HP and CP factors
        score += ((fruit.currentHP || 0) / (fruit.maxHP || 1000)) * 30;
        score += ((fruit.totalCP || 1000) / 10000) * 40;
        
        // Skill availability
        const skillData = getSkillData(fruit.id, fruit.rarity);
        if (skillData && fruit.cooldown === 0) {
            score += 25;
            
            if ((skillData.range === 'area' || skillData.range === 'all') && playerTargets.length > 2) {
                score += 15;
            }
            
            if (skillData.damage > 120) {
                score += 10;
            }
        }
        
        // Status considerations
        if (fruit.statusEffects) {
            const debuffs = fruit.statusEffects.filter(e => e.type === 'debuff' || e.type === 'disable');
            score -= debuffs.length * 10;
            
            const buffs = fruit.statusEffects.filter(e => e.type === 'buff');
            score += buffs.length * 5;
        }
        
        score += Math.random() * 5;
        
        if (score > bestScore) {
            bestScore = score;
            bestFruit = { fruit, index };
        }
    });
    
    return bestFruit;
}

/**
 * Enhanced AI target selection
 */
function selectBestAITarget(availablePlayerTargets, attackingFruit) {
    let bestScore = -1;
    let bestTarget = availablePlayerTargets[0];
    
    availablePlayerTargets.forEach(({ fruit, index }) => {
        let score = 0;
        
        // Prioritize low HP targets
        const hpPercent = (fruit.currentHP || 0) / (fruit.maxHP || 1000);
        if (hpPercent < 0.3) {
            score += 60; // High priority for finishing
        } else if (hpPercent < 0.6) {
            score += 30;
        }
        
        // Prioritize high CP threats
        score += ((fruit.totalCP || 1000) / 10000) * 20;
        
        // Avoid heavily defended targets
        const hasDefenses = fruit.statusEffects && 
            fruit.statusEffects.some(e => e.type === 'defense' || e.type === 'immunity');
        
        if (!hasDefenses) {
            score += 15;
        }
        
        score += Math.random() * 10;
        
        if (score > bestScore) {
            bestScore = score;
            bestTarget = { fruit, index };
        }
    });
    
    return bestTarget;
}
