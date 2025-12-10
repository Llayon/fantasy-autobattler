/**
 * Unit action execution system for Fantasy Autobattler battles.
 * Handles movement, attacks, and complete turn execution for battle units.
 * 
 * @fileoverview Implements the core action system that drives battle simulation.
 * All functions are pure and deterministic for consistent replay behavior.
 */

import { BattleUnit, BattleEvent, Position, TeamType } from '../types/game.types';
import { findPath } from './pathfinding';
import { resolvePhysicalAttack, resolveMagicAttack } from './damage';
import { selectTarget, canTarget } from './targeting';
import { manhattanDistance, createEmptyGrid } from './grid';
import { BATTLE_LIMITS } from '../config/game.constants';

// =============================================================================
// BATTLE STATE INTERFACE
// =============================================================================

/**
 * Complete battle state containing all units and battlefield information.
 * Immutable structure that represents the current state of an ongoing battle.
 */
export interface BattleState {
  /** All units currently in the battle */
  units: BattleUnit[];
  /** Current battle round (1-based) */
  currentRound: number;
  /** Grid occupancy map for pathfinding */
  occupiedPositions: Set<string>;
  /** Battle metadata */
  metadata: {
    /** Random seed for deterministic behavior */
    seed: number;
    /** Battle start timestamp */
    startTime: number;
  };
}

// =============================================================================
// ACTION EVENT TYPES
// =============================================================================

/**
 * Movement action event.
 * Records unit movement from one position to another.
 */
export interface MoveEvent extends BattleEvent {
  type: 'move';
  /** Starting position */
  fromPosition: Position;
  /** Ending position */
  toPosition: Position;
  /** Path taken (for animation) */
  path?: Position[];
}

/**
 * Attack action event.
 * Records combat between two units with damage resolution.
 */
export interface AttackEvent extends BattleEvent {
  type: 'attack';
  /** Target unit ID */
  targetId: string;
  /** Damage dealt */
  damage: number;
  /** Whether attack was dodged */
  dodged: boolean;
  /** Whether target was killed */
  killed: boolean;
  /** Attack type (physical/magic) */
  attackType: 'physical' | 'magic';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a position key for Set operations.
 * Converts position to string for efficient lookups.
 * 
 * @param position - Position to convert
 * @returns String key representation
 * @example
 * const key = positionToKey({ x: 3, y: 5 }); // "3,5"
 */
function positionToKey(position: Position): string {
  return `${position.x},${position.y}`;
}

/**
 * Update battle state with new unit positions and states.
 * Creates a new immutable state object with updated units.
 * 
 * @param state - Current battle state
 * @param updatedUnits - Units with updated state
 * @returns New battle state with updates applied
 * @example
 * const newState = updateBattleState(state, [movedUnit, damagedUnit]);
 */
function updateBattleState(state: BattleState, updatedUnits: BattleUnit[]): BattleState {
  const unitMap = new Map(updatedUnits.map(unit => [unit.instanceId, unit]));
  
  const newUnits = state.units.map(unit => 
    unitMap.get(unit.instanceId) || unit
  );
  
  // Rebuild occupied positions set
  const occupiedPositions = new Set<string>();
  newUnits.forEach(unit => {
    if (unit.alive) {
      occupiedPositions.add(positionToKey(unit.position));
    }
  });
  
  return {
    ...state,
    units: newUnits,
    occupiedPositions,
  };
}

/**
 * Get all living enemy units for a given team.
 * Filters units by team and alive status.
 * 
 * @param state - Current battle state
 * @param team - Team to find enemies for
 * @returns Array of living enemy units
 * @example
 * const enemies = getEnemyUnits(state, 'player');
 */
function getEnemyUnits(state: BattleState, team: TeamType): BattleUnit[] {
  const enemyTeam = team === 'player' ? 'bot' : 'player';
  return state.units.filter(unit => unit.team === enemyTeam && unit.alive);
}



// =============================================================================
// CORE ACTION FUNCTIONS
// =============================================================================

/**
 * Execute unit movement along a specified path.
 * Moves unit up to maxSteps along the path, updating position.
 * 
 * @param unit - Unit to move
 * @param path - Path to follow (including start position)
 * @param maxSteps - Maximum movement distance
 * @returns Movement event with new position
 * @example
 * const path = [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }];
 * const moveEvent = executeMove(warrior, path, 2);
 */
export function executeMove(
  unit: BattleUnit, 
  path: Position[], 
  maxSteps: number
): MoveEvent {
  if (path.length === 0) {
    throw new Error(`Cannot execute move: empty path for unit ${unit.instanceId}`);
  }
  
  if (maxSteps <= 0) {
    throw new Error(`Cannot execute move: invalid maxSteps ${maxSteps} for unit ${unit.instanceId}`);
  }
  
  const startPosition = unit.position;
  
  // Skip the first position if it's the current position
  const firstPos = path[0];
  const movePath = firstPos && firstPos.x === startPosition.x && firstPos.y === startPosition.y 
    ? path.slice(1) 
    : path;
  
  // Limit movement to maxSteps
  const actualSteps = Math.min(maxSteps, movePath.length);
  const endPosition = actualSteps > 0 ? movePath[actualSteps - 1] : startPosition;
  
  if (!endPosition) {
    throw new Error(`Cannot execute move: invalid end position for unit ${unit.instanceId}`);
  }
  
  return {
    round: 0, // Will be set by caller
    type: 'move',
    actorId: unit.instanceId,
    fromPosition: startPosition,
    toPosition: endPosition,
    path: [startPosition, ...movePath.slice(0, actualSteps)],
  };
}

/**
 * Execute attack between attacker and target.
 * Resolves damage, dodge, and death based on unit stats and seed.
 * 
 * @param attacker - Unit performing the attack
 * @param target - Unit being attacked
 * @param seed - Random seed for deterministic results
 * @returns Attack event with damage resolution
 * @example
 * const attackEvent = executeAttack(warrior, enemy, 12345);
 */
export function executeAttack(
  attacker: BattleUnit, 
  target: BattleUnit, 
  seed: number
): AttackEvent {
  if (!attacker.alive) {
    throw new Error(`Cannot execute attack: attacker ${attacker.instanceId} is dead`);
  }
  
  if (!target.alive) {
    throw new Error(`Cannot execute attack: target ${target.instanceId} is dead`);
  }
  
  // Determine attack type based on attacker role
  const isPhysicalAttack = attacker.role !== 'mage';
  
  // Resolve attack based on type
  const attackResult = isPhysicalAttack 
    ? resolvePhysicalAttack(attacker, target, seed)
    : resolveMagicAttack(attacker, target);
  
  return {
    round: 0, // Will be set by caller
    type: 'attack',
    actorId: attacker.instanceId,
    targetId: target.instanceId,
    damage: attackResult.damage,
    dodged: isPhysicalAttack ? (attackResult as any).dodged || false : false,
    killed: attackResult.newHp <= 0,
    attackType: isPhysicalAttack ? 'physical' : 'magic',
  };
}

/**
 * Execute a complete unit turn including movement and combat.
 * Implements AI decision making: find target, move if needed, attack if possible.
 * 
 * @param unit - Unit taking the turn
 * @param state - Current battle state
 * @param seed - Random seed for deterministic behavior
 * @returns Array of events generated during the turn
 * @example
 * const events = executeTurn(warrior, battleState, 54321);
 * // Returns: [moveEvent?, attackEvent?, damageEvent?, deathEvent?]
 */
export function executeTurn(
  unit: BattleUnit, 
  state: BattleState, 
  seed: number
): BattleEvent[] {
  if (!unit.alive) {
    return []; // Dead units cannot act
  }
  
  const events: BattleEvent[] = [];
  const enemies = getEnemyUnits(state, unit.team);
  
  if (enemies.length === 0) {
    return []; // No enemies to fight
  }
  
  // Step 1: Find target using role-appropriate strategy
  let targetingStrategy: 'nearest' | 'weakest' | 'highest_threat' = 'nearest';
  
  switch (unit.role) {
    case 'mage':
    case 'ranged_dps':
      targetingStrategy = 'highest_threat';
      break;
    case 'melee_dps':
      targetingStrategy = 'weakest';
      break;
    case 'tank':
    case 'support':
    default:
      targetingStrategy = 'nearest';
      break;
  }
  
  const target = selectTarget(unit, enemies, targetingStrategy);
  if (!target) {
    return []; // No valid target found
  }
  
  let currentUnit = { ...unit };
  let currentState = state;
  
  // Step 2: Check if target is in range
  const distance = manhattanDistance(currentUnit.position, target.position);
  const inRange = distance <= currentUnit.range;
  
  if (!inRange) {
    // Step 3: Move towards target if not in range
    // Find the closest position adjacent to target where we can attack from
    const adjacentPositions = [
      { x: target.position.x - 1, y: target.position.y },
      { x: target.position.x + 1, y: target.position.y },
      { x: target.position.x, y: target.position.y - 1 },
      { x: target.position.x, y: target.position.y + 1 },
    ];
    
    const grid = createEmptyGrid();
    const otherUnits = currentState.units.filter(u => u.alive && u.instanceId !== currentUnit.instanceId);
    
    let bestPath: Position[] = [];
    let shortestDistance = Infinity;
    
    // Try to find path to each adjacent position
    for (const adjPos of adjacentPositions) {
      const pathToAdjacent = findPath(
        currentUnit.position,
        adjPos,
        grid,
        otherUnits,
        currentUnit
      );
      
      if (pathToAdjacent.length > 0) {
        const pathDistance = pathToAdjacent.length;
        if (pathDistance < shortestDistance) {
          shortestDistance = pathDistance;
          bestPath = pathToAdjacent;
        }
      }
    }
    
    if (bestPath.length > 1) {
      // Execute movement
      const moveEvent = executeMove(currentUnit, bestPath, currentUnit.stats.speed);
      moveEvent.round = currentState.currentRound;
      events.push(moveEvent);
      
      // Update unit position
      currentUnit = {
        ...currentUnit,
        position: moveEvent.toPosition,
      };
      
      // Update battle state with new position
      currentState = updateBattleState(currentState, [currentUnit]);
    }
  }
  
  // Step 4: Attack if target is now in range
  const newDistance = manhattanDistance(currentUnit.position, target.position);
  const nowInRange = newDistance <= currentUnit.range;
  
  if (nowInRange && canTarget(currentUnit, target)) {
    // Execute attack
    const attackEvent = executeAttack(currentUnit, target, seed);
    attackEvent.round = currentState.currentRound;
    events.push(attackEvent);
    
    // Create damage event
    const damageEvent: BattleEvent = {
      round: currentState.currentRound,
      type: 'damage',
      actorId: currentUnit.instanceId,
      targetId: target.instanceId,
      damage: attackEvent.damage,
    };
    events.push(damageEvent);
    
    // Check if target was killed
    if (attackEvent.killed) {
      const deathEvent: BattleEvent = {
        round: currentState.currentRound,
        type: 'death',
        actorId: target.instanceId,
        killedUnits: [target.instanceId],
      };
      events.push(deathEvent);
    }
  }
  
  return events;
}

// =============================================================================
// BATTLE STATE MANAGEMENT
// =============================================================================

/**
 * Create initial battle state from unit arrays.
 * Sets up the battlefield with units in their starting positions.
 * 
 * @param playerUnits - Player team units
 * @param botUnits - Bot team units
 * @param seed - Random seed for battle
 * @returns Initial battle state
 * @example
 * const state = createBattleState(playerTeam, botTeam, 12345);
 */
export function createBattleState(
  playerUnits: BattleUnit[], 
  botUnits: BattleUnit[], 
  seed: number
): BattleState {
  const allUnits = [...playerUnits, ...botUnits];
  
  // Build occupied positions set
  const occupiedPositions = new Set<string>();
  allUnits.forEach(unit => {
    if (unit.alive) {
      occupiedPositions.add(positionToKey(unit.position));
    }
  });
  
  return {
    units: allUnits,
    currentRound: 1,
    occupiedPositions,
    metadata: {
      seed,
      startTime: Date.now(),
    },
  };
}

/**
 * Apply battle events to update battle state.
 * Processes events and returns new state with all changes applied.
 * 
 * @param state - Current battle state
 * @param events - Events to apply
 * @returns Updated battle state
 * @example
 * const newState = applyBattleEvents(state, turnEvents);
 */
export function applyBattleEvents(state: BattleState, events: BattleEvent[]): BattleState {
  let currentState = state;
  const updatedUnits = new Map<string, BattleUnit>();
  
  // Initialize updated units map with current units
  currentState.units.forEach(unit => {
    updatedUnits.set(unit.instanceId, { ...unit });
  });
  
  // Process each event
  for (const event of events) {
    switch (event.type) {
      case 'move':
        if (event.toPosition) {
          const unit = updatedUnits.get(event.actorId);
          if (unit) {
            updatedUnits.set(event.actorId, {
              ...unit,
              position: event.toPosition,
            });
          }
        }
        break;
        
      case 'damage':
        if (event.targetId && event.damage !== undefined) {
          const target = updatedUnits.get(event.targetId);
          if (target) {
            const newHp = Math.max(0, target.currentHp - event.damage);
            updatedUnits.set(event.targetId, {
              ...target,
              currentHp: newHp,
              alive: newHp > 0,
            });
          }
        }
        break;
        
      case 'death':
        if (event.killedUnits) {
          event.killedUnits.forEach(unitId => {
            const unit = updatedUnits.get(unitId);
            if (unit) {
              updatedUnits.set(unitId, {
                ...unit,
                alive: false,
                currentHp: 0,
              });
            }
          });
        }
        break;
    }
  }
  
  // Return updated state
  return updateBattleState(currentState, Array.from(updatedUnits.values()));
}

/**
 * Check if battle should end based on current state.
 * Battle ends when one team has no living units or max rounds reached.
 * 
 * @param state - Current battle state
 * @returns Battle end status and winner
 * @example
 * const { shouldEnd, winner } = checkBattleEnd(state);
 */
export function checkBattleEnd(state: BattleState): { 
  shouldEnd: boolean; 
  winner: 'player' | 'bot' | 'draw' 
} {
  const livingPlayerUnits = state.units.filter(u => u.team === 'player' && u.alive);
  const livingBotUnits = state.units.filter(u => u.team === 'bot' && u.alive);
  
  // Check max rounds
  if (state.currentRound >= BATTLE_LIMITS.MAX_ROUNDS) {
    return { shouldEnd: true, winner: 'draw' };
  }
  
  // Check team elimination
  if (livingPlayerUnits.length === 0 && livingBotUnits.length === 0) {
    return { shouldEnd: true, winner: 'draw' };
  }
  
  if (livingPlayerUnits.length === 0) {
    return { shouldEnd: true, winner: 'bot' };
  }
  
  if (livingBotUnits.length === 0) {
    return { shouldEnd: true, winner: 'player' };
  }
  
  return { shouldEnd: false, winner: 'draw' };
}

/**
 * Advance battle state to next round.
 * Increments round counter and performs any round-based updates.
 * 
 * @param state - Current battle state
 * @returns State advanced to next round
 * @example
 * const nextRoundState = advanceToNextRound(state);
 */
export function advanceToNextRound(state: BattleState): BattleState {
  return {
    ...state,
    currentRound: state.currentRound + 1,
  };
}