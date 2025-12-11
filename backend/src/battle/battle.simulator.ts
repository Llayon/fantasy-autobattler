/**
 * Battle Simulator v2 for Fantasy Autobattler.
 * Complete rewrite using the new modular battle system with grid-based combat,
 * pathfinding, targeting, and deterministic turn execution.
 * 
 * @fileoverview Advanced battle simulation with 8×10 grid, A* pathfinding,
 * role-based AI, and comprehensive event logging for replay functionality.
 */

import { 
  BattleUnit, 
  BattleEvent, 
  BattleResult, 
  UnitTemplate, 
  Position, 
  TeamType,
  BattleWinner,
  FinalUnitState 
} from '../types/game.types';
import { buildTurnQueue } from './turn-order';
import { executeTurn, createBattleState, applyBattleEvents, checkBattleEnd, advanceToNextRound } from './actions';
import { isValidPosition } from './grid';
import { BATTLE_LIMITS, DEPLOYMENT_ZONES } from '../config/game.constants';

// =============================================================================
// TEAM SETUP INTERFACE
// =============================================================================

/**
 * Team setup configuration for battle simulation.
 * Contains unit templates and their deployment positions.
 */
export interface TeamSetup {
  /** Array of unit templates to deploy */
  units: UnitTemplate[];
  /** Corresponding positions for each unit on the battlefield */
  positions: Position[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate team setup configuration.
 * Ensures units and positions arrays match and positions are valid.
 * 
 * @param teamSetup - Team configuration to validate
 * @param teamType - Team type for position validation
 * @returns Validation result with error details
 * @example
 * const result = validateTeamSetup(playerTeam, 'player');
 * if (!result.isValid) console.error(result.errors);
 */
function validateTeamSetup(
  teamSetup: TeamSetup, 
  teamType: TeamType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check array lengths match
  if (teamSetup.units.length !== teamSetup.positions.length) {
    errors.push(`Units array length (${teamSetup.units.length}) does not match positions array length (${teamSetup.positions.length})`);
  }
  
  // Validate positions
  const validRows = teamType === 'player' ? DEPLOYMENT_ZONES.PLAYER_ROWS : DEPLOYMENT_ZONES.ENEMY_ROWS;
  
  for (let i = 0; i < teamSetup.positions.length; i++) {
    const pos = teamSetup.positions[i];
    
    if (!pos) {
      errors.push(`Position ${i} is undefined`);
      continue;
    }
    
    if (!isValidPosition(pos)) {
      errors.push(`Position ${i} (${pos.x}, ${pos.y}) is outside grid bounds`);
      continue;
    }
    
    if (!(validRows as readonly number[]).includes(pos.y)) {
      errors.push(`Position ${i} (${pos.x}, ${pos.y}) is not in valid deployment zone for ${teamType} team`);
    }
  }
  
  // Check for duplicate positions
  const positionKeys = teamSetup.positions.map(pos => `${pos.x},${pos.y}`);
  const uniquePositions = new Set(positionKeys);
  if (uniquePositions.size !== positionKeys.length) {
    errors.push('Duplicate positions found in team setup');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create battle unit instances from team setup.
 * Converts unit templates to battle-ready units with positions and state.
 * 
 * @param teamSetup - Team configuration
 * @param teamType - Team identifier
 * @returns Array of battle-ready units
 * @example
 * const battleUnits = createBattleUnits(playerTeam, 'player');
 */
function createBattleUnits(teamSetup: TeamSetup, teamType: TeamType): BattleUnit[] {
  return teamSetup.units.map((unitTemplate, index) => {
    const position = teamSetup.positions[index];
    
    if (!position) {
      throw new Error(`Position ${index} is undefined for unit ${unitTemplate.id}`);
    }
    
    return {
      ...unitTemplate,
      position,
      currentHp: unitTemplate.stats.hp,
      maxHp: unitTemplate.stats.hp,
      team: teamType,
      alive: true,
      instanceId: `${teamType}_${unitTemplate.id}_${index}`,
    };
  });
}

/**
 * Create final unit states for battle result.
 * Captures the end state of all units for result analysis.
 * 
 * @param units - Array of battle units
 * @returns Array of final unit states
 * @example
 * const finalStates = createFinalUnitStates(battleUnits);
 */
function createFinalUnitStates(units: BattleUnit[]): FinalUnitState[] {
  return units.map(unit => ({
    instanceId: unit.instanceId,
    currentHp: unit.currentHp,
    position: unit.position,
    alive: unit.alive,
  }));
}

/**
 * Generate a deterministic seed component from team setup.
 * Creates a hash-like value from team composition for seed generation.
 * 
 * @param teamSetup - Team configuration
 * @returns Numeric hash of team setup
 * @example
 * const hash = hashTeamSetup(playerTeam);
 */
function hashTeamSetup(teamSetup: TeamSetup): number {
  let hash = 0;
  
  // Hash unit IDs and positions
  for (let i = 0; i < teamSetup.units.length; i++) {
    const unit = teamSetup.units[i];
    const pos = teamSetup.positions[i];
    
    if (!unit || !pos) continue;
    
    // Simple string hash for unit ID
    for (let j = 0; j < unit.id.length; j++) {
      hash = ((hash << 5) - hash + unit.id.charCodeAt(j)) & 0xffffffff;
    }
    
    // Include position in hash
    hash = ((hash << 5) - hash + pos.x * 31 + pos.y) & 0xffffffff;
  }
  
  return Math.abs(hash);
}

// =============================================================================
// MAIN SIMULATION FUNCTION
// =============================================================================

/**
 * Simulate a complete battle between two teams.
 * Uses advanced grid-based combat with pathfinding, targeting, and deterministic AI.
 * 
 * @param playerTeam - Player team setup with units and positions
 * @param enemyTeam - Enemy team setup with units and positions
 * @param seed - Random seed for deterministic simulation
 * @returns Complete battle result with events and final states
 * @throws Error if team setups are invalid
 * @example
 * const playerTeam = { units: [warrior, mage], positions: [{ x: 1, y: 0 }, { x: 2, y: 1 }] };
 * const enemyTeam = { units: [orc, goblin], positions: [{ x: 1, y: 9 }, { x: 2, y: 8 }] };
 * const result = simulateBattle(playerTeam, enemyTeam, 12345);
 */
export function simulateBattle(
  playerTeam: TeamSetup,
  enemyTeam: TeamSetup,
  seed: number
): BattleResult {
  const startTime = Date.now();
  
  // Validate team setups
  const playerValidation = validateTeamSetup(playerTeam, 'player');
  if (!playerValidation.isValid) {
    throw new Error(`Invalid player team setup: ${playerValidation.errors.join(', ')}`);
  }
  
  const enemyValidation = validateTeamSetup(enemyTeam, 'bot');
  if (!enemyValidation.isValid) {
    throw new Error(`Invalid enemy team setup: ${enemyValidation.errors.join(', ')}`);
  }
  
  // Create battle units
  const playerUnits = createBattleUnits(playerTeam, 'player');
  const enemyUnits = createBattleUnits(enemyTeam, 'bot');
  
  // Initialize battle state
  let battleState = createBattleState(playerUnits, enemyUnits, seed);
  const allEvents: BattleEvent[] = [];
  
  // Add battle start event
  allEvents.push({
    round: 0,
    type: 'round_start',
    actorId: 'system',
    metadata: {
      message: 'Battle begins',
      playerUnits: playerUnits.length,
      enemyUnits: enemyUnits.length,
    },
  });
  
  // Main battle loop
  while (battleState.currentRound <= BATTLE_LIMITS.MAX_ROUNDS) {
    // Add round start event
    allEvents.push({
      round: battleState.currentRound,
      type: 'round_start',
      actorId: 'system',
      metadata: {
        message: `Round ${battleState.currentRound} begins`,
      },
    });
    
    // Build turn queue for this round
    const livingUnits = battleState.units.filter(unit => unit.alive);
    const turnQueue = buildTurnQueue(livingUnits);
    
    // Execute each unit's turn
    for (const unit of turnQueue) {
      if (!unit.alive) continue; // Skip if unit died during this round
      
      // Generate seed for this turn (deterministic based on battle seed, round, and unit)
      const turnSeed = seed + battleState.currentRound * 1000 + hashTeamSetup({ 
        units: [unit], 
        positions: [unit.position] 
      });
      
      // Execute unit's turn
      const turnEvents = executeTurn(unit, battleState, turnSeed);
      
      // Apply events to battle state
      if (turnEvents.length > 0) {
        battleState = applyBattleEvents(battleState, turnEvents);
        allEvents.push(...turnEvents);
      }
      
      // Check if battle should end after this turn
      const battleEndCheck = checkBattleEnd(battleState);
      if (battleEndCheck.shouldEnd) {
        // Add battle end event
        allEvents.push({
          round: battleState.currentRound,
          type: 'battle_end',
          actorId: 'system',
          metadata: {
            winner: battleEndCheck.winner,
            reason: battleEndCheck.winner === 'draw' ? 'All units eliminated' : 'Team eliminated',
          },
        });
        
        // Create final battle result
        const endTime = Date.now();
        return {
          events: allEvents,
          winner: battleEndCheck.winner,
          finalState: {
            playerUnits: createFinalUnitStates(battleState.units.filter(u => u.team === 'player')),
            botUnits: createFinalUnitStates(battleState.units.filter(u => u.team === 'bot')),
          },
          metadata: {
            totalRounds: battleState.currentRound,
            durationMs: endTime - startTime,
            seed,
          },
        };
      }
    }
    
    // Advance to next round
    battleState = advanceToNextRound(battleState);
  }
  
  // Battle ended due to max rounds (draw)
  allEvents.push({
    round: battleState.currentRound - 1,
    type: 'battle_end',
    actorId: 'system',
    metadata: {
      winner: 'draw' as BattleWinner,
      reason: 'Maximum rounds reached',
    },
  });
  
  const endTime = Date.now();
  return {
    events: allEvents,
    winner: 'draw',
    finalState: {
      playerUnits: createFinalUnitStates(battleState.units.filter(u => u.team === 'player')),
      botUnits: createFinalUnitStates(battleState.units.filter(u => u.team === 'bot')),
    },
    metadata: {
      totalRounds: battleState.currentRound - 1,
      durationMs: endTime - startTime,
      seed,
    },
  };
}

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

/**
 * Legacy battle simulation function for backward compatibility.
 * Converts old unit type arrays to new TeamSetup format.
 * 
 * @deprecated Use simulateBattle with TeamSetup instead
 * @param _playerTypes - Array of player unit type strings (unused)
 * @param _botTypes - Array of bot unit type strings (unused)
 * @returns Battle result in legacy format
 * @example
 * const result = simulateBattleLegacy(['Warrior', 'Mage'], ['Orc', 'Goblin']);
 */
export function simulateBattleLegacy(
  _playerTypes: string[],
  _botTypes: string[]
): {
  playerTeam: unknown[];
  botTeam: unknown[];
  events: unknown[];
  winner: 'player' | 'bot' | 'draw';
} {
  // This is a placeholder for backward compatibility
  // In a real implementation, you would convert the old format to new format
  // and call the new simulateBattle function
  
  throw new Error('Legacy simulation not implemented. Use simulateBattle with TeamSetup format.');
}

// =============================================================================
// BATTLE ANALYSIS UTILITIES
// =============================================================================

/**
 * Analyze battle result for statistics and insights.
 * Provides detailed breakdown of battle performance.
 * 
 * @param result - Battle result to analyze
 * @returns Battle analysis with statistics
 * @example
 * const analysis = analyzeBattleResult(battleResult);
 * console.log(`Battle lasted ${analysis.totalRounds} rounds`);
 */
export function analyzeBattleResult(result: BattleResult): {
  totalRounds: number;
  totalEvents: number;
  eventsByType: Record<string, number>;
  survivingUnits: {
    player: number;
    bot: number;
  };
  damageDealt: {
    player: number;
    bot: number;
  };
} {
  const eventsByType: Record<string, number> = {};
  let playerDamage = 0;
  let botDamage = 0;
  
  // Count events by type and calculate damage
  for (const event of result.events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    
    if (event.type === 'damage' && event.damage) {
      const actorUnit = result.finalState.playerUnits.find(u => u.instanceId === event.actorId) ||
                       result.finalState.botUnits.find(u => u.instanceId === event.actorId);
      
      if (actorUnit) {
        const isPlayerUnit = result.finalState.playerUnits.some(u => u.instanceId === event.actorId);
        if (isPlayerUnit) {
          playerDamage += event.damage;
        } else {
          botDamage += event.damage;
        }
      }
    }
  }
  
  return {
    totalRounds: result.metadata.totalRounds,
    totalEvents: result.events.length,
    eventsByType,
    survivingUnits: {
      player: result.finalState.playerUnits.filter(u => u.alive).length,
      bot: result.finalState.botUnits.filter(u => u.alive).length,
    },
    damageDealt: {
      player: playerDamage,
      bot: botDamage,
    },
  };
}