/**
 * Battle Simulator v3 for Fantasy Autobattler.
 * Enhanced with ability system, status effects, and AI decision making.
 * 
 * @fileoverview Advanced battle simulation with 8×10 grid, A* pathfinding,
 * role-based AI, abilities, status effects, and comprehensive event logging.
 * 
 * Turn flow:
 * 1. Tick status effects (duration, DoT/HoT)
 * 2. AI decides action (ability/attack/move)
 * 3. Execute action
 * 4. Tick ability cooldowns
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
import { 
  executeTurn, 
  createBattleState, 
  applyBattleEvents, 
  checkBattleEnd, 
  advanceToNextRound,
  BattleState 
} from './actions';
import { isValidPosition } from './grid';
import { BATTLE_LIMITS, DEPLOYMENT_ZONES } from '../config/game.constants';

// Ability system imports
import { 
  BattleUnitWithAbilities, 
  executeAbility, 
  applyAbilityEvents,
  tickStatusEffects as tickUnitStatusEffects,
  tickAbilityCooldowns,
  AbilityEvent
} from './ability.executor';
import { decideAction, UnitAction } from './ai.decision';
import { getUnitAbility } from '../abilities/ability.data';


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

/**
 * Extended battle state with ability tracking.
 */
interface BattleStateWithAbilities extends BattleState {
  /** Units with ability state */
  units: BattleUnitWithAbilities[];
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
 * Create battle unit instances from team setup with ability state.
 * Converts unit templates to battle-ready units with positions, state, and cooldowns.
 * 
 * @param teamSetup - Team configuration
 * @param teamType - Team identifier
 * @returns Array of battle-ready units with ability tracking
 * @example
 * const battleUnits = createBattleUnits(playerTeam, 'player');
 */
function createBattleUnits(teamSetup: TeamSetup, teamType: TeamType): BattleUnitWithAbilities[] {
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
      // Ability state initialization
      abilityCooldowns: {},
      statusEffects: [],
      isStunned: false,
      hasTaunt: false,
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
// ABILITY EXECUTION HELPERS
// =============================================================================

/**
 * Execute an ability action for a unit.
 * Handles ability execution and event generation.
 * 
 * @param unit - Unit using the ability
 * @param action - AI decision with ability info
 * @param state - Current battle state
 * @param seed - Random seed for deterministic behavior
 * @returns Ability events generated
 */
function executeAbilityAction(
  unit: BattleUnitWithAbilities,
  action: UnitAction,
  state: BattleStateWithAbilities,
  seed: number
): AbilityEvent[] {
  if (!action.abilityId) {
    return [];
  }
  
  const ability = getUnitAbility(unit.id);
  if (!ability) {
    return [];
  }
  
  // Determine target for ability
  const target = action.target ?? action.targetPosition ?? unit;
  
  return executeAbility(unit, ability, target, state, seed);
}

/**
 * Tick status effects for all units at the start of a round.
 * Processes duration, DoT/HoT, and removes expired effects.
 * 
 * @param state - Current battle state
 * @returns Updated battle state with ticked effects
 */
function tickAllStatusEffects(state: BattleStateWithAbilities): BattleStateWithAbilities {
  const updatedUnits = state.units.map(unit => {
    if (!unit.alive) return unit;
    return tickUnitStatusEffects(unit);
  });
  
  // Rebuild occupied positions
  const occupiedPositions = new Set<string>();
  updatedUnits.forEach(unit => {
    if (unit.alive) {
      occupiedPositions.add(`${unit.position.x},${unit.position.y}`);
    }
  });
  
  return {
    ...state,
    units: updatedUnits,
    occupiedPositions,
  };
}

/**
 * Tick ability cooldowns for all units at the end of a round.
 * Decrements all cooldowns by 1.
 * 
 * @param state - Current battle state
 * @returns Updated battle state with ticked cooldowns
 */
function tickAllCooldowns(state: BattleStateWithAbilities): BattleStateWithAbilities {
  const updatedUnits = state.units.map(unit => {
    if (!unit.alive) return unit;
    return tickAbilityCooldowns(unit);
  });
  
  return {
    ...state,
    units: updatedUnits,
  };
}

/**
 * Execute a unit's turn with AI decision making and ability support.
 * Flow: check stun → AI decision → execute action
 * 
 * @param unit - Unit taking the turn
 * @param state - Current battle state
 * @param seed - Random seed for deterministic behavior
 * @returns Events generated during the turn and updated state
 */
function executeUnitTurnWithAbilities(
  unit: BattleUnitWithAbilities,
  state: BattleStateWithAbilities,
  seed: number
): { events: BattleEvent[]; state: BattleStateWithAbilities } {
  const events: BattleEvent[] = [];
  let currentState = state;
  
  // Skip turn if unit is stunned
  if (unit.isStunned) {
    return { events: [], state: currentState };
  }
  
  // Get AI decision for this unit
  const action = decideAction(unit, currentState);
  
  // Execute based on action type
  switch (action.type) {
    case 'ability': {
      // Execute ability
      const abilityEvents = executeAbilityAction(unit, action, currentState, seed);
      
      if (abilityEvents.length > 0) {
        // Apply ability events to state
        const ability = getUnitAbility(unit.id);
        if (ability) {
          currentState = applyAbilityEvents(
            currentState, 
            abilityEvents, 
            ability, 
            unit.instanceId
          ) as BattleStateWithAbilities;
        }
        
        // Add ability events to result
        events.push(...abilityEvents);
      }
      break;
    }
    
    case 'attack':
    case 'move':
    default: {
      // Use legacy turn execution for basic attacks and movement
      const turnEvents = executeTurn(unit, currentState, seed);
      
      if (turnEvents.length > 0) {
        currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
        events.push(...turnEvents);
      }
      break;
    }
  }
  
  return { events, state: currentState };
}

// =============================================================================
// MAIN SIMULATION FUNCTION
// =============================================================================

/**
 * Simulate a complete battle between two teams.
 * Uses advanced grid-based combat with pathfinding, targeting, abilities,
 * status effects, and deterministic AI.
 * 
 * Turn flow per unit:
 * 1. Check if stunned (skip if true)
 * 2. AI decides action (ability/attack/move)
 * 3. Execute action
 * 
 * Round flow:
 * 1. Tick status effects (duration, DoT/HoT)
 * 2. Build turn queue by initiative
 * 3. Execute each unit's turn
 * 4. Tick ability cooldowns
 * 5. Check battle end condition
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
  
  // Create battle units with ability state
  const playerUnits = createBattleUnits(playerTeam, 'player');
  const enemyUnits = createBattleUnits(enemyTeam, 'bot');
  
  // Initialize battle state
  const initialState = createBattleState(playerUnits, enemyUnits, seed);
  let battleState: BattleStateWithAbilities = {
    ...initialState,
    units: [...playerUnits, ...enemyUnits],
  };
  
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
    // Step 1: Tick status effects at round start
    battleState = tickAllStatusEffects(battleState);
    
    // Add round start event
    allEvents.push({
      round: battleState.currentRound,
      type: 'round_start',
      actorId: 'system',
      metadata: {
        message: `Round ${battleState.currentRound} begins`,
      },
    });
    
    // Step 2: Build turn queue for this round
    const livingUnits = battleState.units.filter(unit => unit.alive);
    const turnQueue = buildTurnQueue(livingUnits);
    
    // Step 3: Execute each unit's turn
    for (const unit of turnQueue) {
      // Get current unit state from battle state
      const currentUnit = battleState.units.find(u => u.instanceId === unit.instanceId);
      if (!currentUnit || !currentUnit.alive) continue;
      
      // Generate seed for this turn (deterministic based on battle seed, round, and unit)
      const turnSeed = seed + battleState.currentRound * 1000 + hashTeamSetup({ 
        units: [unit], 
        positions: [unit.position] 
      });
      
      // Execute unit's turn with ability support
      const turnResult = executeUnitTurnWithAbilities(
        currentUnit as BattleUnitWithAbilities, 
        battleState, 
        turnSeed
      );
      
      // Update state and collect events
      battleState = turnResult.state;
      allEvents.push(...turnResult.events);
      
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
    
    // Step 4: Tick ability cooldowns at round end
    battleState = tickAllCooldowns(battleState);
    
    // Advance to next round
    battleState = {
      ...advanceToNextRound(battleState),
      units: battleState.units,
    } as BattleStateWithAbilities;
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
// BATTLE ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Battle analysis result containing statistics and metrics.
 */
export interface BattleAnalysis {
  /** Total rounds in the battle */
  totalRounds: number;
  /** Total number of events generated */
  totalEvents: number;
  /** Count of events by type */
  eventsByType: Record<string, number>;
  /** Surviving units count by team */
  survivingUnits: {
    player: number;
    bot: number;
  };
  /** Total damage dealt by team */
  damageDealt: {
    player: number;
    bot: number;
  };
}

/**
 * Analyze a battle result to extract statistics and metrics.
 * Useful for debugging, balancing, and displaying battle summaries.
 * 
 * @param result - Battle result to analyze
 * @returns Comprehensive battle analysis
 * @example
 * const result = simulateBattle(playerTeam, enemyTeam, 12345);
 * const analysis = analyzeBattleResult(result);
 * console.log(`Battle lasted ${analysis.totalRounds} rounds`);
 */
export function analyzeBattleResult(result: BattleResult): BattleAnalysis {
  // Count events by type
  const eventsByType: Record<string, number> = {};
  for (const event of result.events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
  }
  
  // Count surviving units
  const survivingUnits = {
    player: result.finalState.playerUnits.filter(u => u.alive).length,
    bot: result.finalState.botUnits.filter(u => u.alive).length,
  };
  
  // Calculate damage dealt by team
  const damageDealt = {
    player: 0,
    bot: 0,
  };
  
  for (const event of result.events) {
    if (event.type === 'damage' && event.damage !== undefined && event.actorId) {
      // Determine team from actorId
      if (event.actorId.startsWith('player_')) {
        damageDealt.player += event.damage;
      } else if (event.actorId.startsWith('bot_')) {
        damageDealt.bot += event.damage;
      }
    }
  }
  
  return {
    totalRounds: result.metadata.totalRounds,
    totalEvents: result.events.length,
    eventsByType,
    survivingUnits,
    damageDealt,
  };
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Legacy battle simulation function for backward compatibility.
 * Wraps the new simulateBattle function with the old interface.
 * 
 * @deprecated Use simulateBattle with TeamSetup interface instead
 * @param playerUnits - Array of player unit templates
 * @param playerPositions - Array of player unit positions
 * @param enemyUnits - Array of enemy unit templates
 * @param enemyPositions - Array of enemy unit positions
 * @param seed - Random seed for deterministic simulation
 * @returns Battle result
 */
export function simulateBattleLegacy(
  playerUnits: UnitTemplate[],
  playerPositions: Position[],
  enemyUnits: UnitTemplate[],
  enemyPositions: Position[],
  seed: number
): BattleResult {
  const playerTeam: TeamSetup = {
    units: playerUnits,
    positions: playerPositions,
  };
  
  const enemyTeam: TeamSetup = {
    units: enemyUnits,
    positions: enemyPositions,
  };
  
  return simulateBattle(playerTeam, enemyTeam, seed);
}
