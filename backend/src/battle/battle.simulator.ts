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
 * 
 * Core 2.0 Integration:
 * - Optional MechanicsProcessor for advanced combat mechanics
 * - Phase hooks for mechanics integration (turn_start, movement, pre_attack, attack, post_attack, turn_end)
 * - Backward compatible: no processor = MVP behavior (identical to Core 1.0)
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
import { isActiveAbility } from '../types/ability.types';

// Core 2.0 Mechanics imports
import type { MechanicsProcessor, PhaseContext, BattleAction, ProcessResult } from '../core/mechanics';
import type { BattleState as CoreBattleState, BattleUnit as CoreBattleUnit } from '../core/types';
import { calculateCombatModifiers } from './mechanics-integration';
import { executeAttack } from './actions';
import { manhattanDistance } from './grid';
import { canTarget } from './targeting';
import type { FacingDirection } from '../core/mechanics/tier0/facing/facing.types';

// =============================================================================
// RESOLVE DAMAGE CONSTANTS (per design doc)
// =============================================================================

/**
 * Resolve damage values per design document.
 * These values represent psychological impact on unit morale.
 */
const RESOLVE_DAMAGE = {
  /** Resolve damage when adjacent ally (within 1 cell) dies */
  ALLY_DEATH_ADJACENT: 15,
  /** Resolve damage when nearby ally (within 3 cells) dies */
  ALLY_DEATH_NEARBY: 8,
  /** Resolve damage when surrounded by 3+ enemies at turn start */
  SURROUNDED: 20,
  /** Minimum enemies adjacent to trigger surrounded penalty */
  SURROUNDED_MIN_ENEMIES: 3,
  /** Range for "nearby" ally death */
  ALLY_DEATH_NEARBY_RANGE: 3,
} as const;

/**
 * Routing/Rally constants for resolve system.
 */
const ROUTING_CONFIG = {
  /** Resolve threshold to rally (stop routing) */
  RALLY_THRESHOLD: 25,
  /** Movement cells toward own edge when routing */
  RETREAT_DISTANCE: 2,
  /** Player team retreat row (toward row 0) */
  PLAYER_RETREAT_ROW: 0,
  /** Bot team retreat row (toward row 9) */
  BOT_RETREAT_ROW: 9,
} as const;


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

/**
 * Convert game-specific BattleState to core BattleState for mechanics processor.
 * The mechanics processor expects the core BattleState interface.
 * 
 * This function creates a deep copy of unit data to prevent mutations from
 * affecting the original game state. All unit properties are preserved:
 * - HP (currentHp, maxHp)
 * - Position (x, y coordinates)
 * - Alive status
 * - Facing direction (N, S, E, W)
 * - Resolve (morale value)
 * - All other Core 2.0 mechanics fields
 * 
 * @param state - Game-specific battle state
 * @returns Core battle state compatible with mechanics processor
 * 
 * @example
 * const coreState = toCoreBattleState(gameState);
 * const result = processor.process('attack', coreState, context);
 */
export function toCoreBattleState(state: BattleStateWithAbilities): CoreBattleState<CoreBattleUnit> {
  // Map game units to core units, preserving all relevant properties
  const coreUnits: CoreBattleUnit[] = state.units.map(gameUnit => {
    // Extract Core 2.0 mechanics fields from game unit
    const unitWithMechanics = gameUnit as BattleUnitWithAbilities & {
      facing?: FacingDirection;
      resolve?: number;
      maxResolve?: number;
      riposteCharges?: number;
      ammunition?: number;
      maxAmmunition?: number;
      tags?: string[];
      armorShred?: number;
      isEngaged?: boolean;
      engagedBy?: string[];
      chargeMomentum?: number;
      isInOverwatch?: boolean;
      isInPhalanx?: boolean;
      isRouting?: boolean;
      hasCrumbled?: boolean;
      faction?: string;
    };

    return {
      // Base unit properties
      id: gameUnit.id,
      name: gameUnit.name,
      role: gameUnit.role,
      cost: gameUnit.cost,
      stats: { ...gameUnit.stats },
      range: gameUnit.range,
      abilities: [...gameUnit.abilities],
      
      // Battle state properties (CRITICAL: must be preserved)
      position: { ...gameUnit.position },
      currentHp: gameUnit.currentHp,
      maxHp: gameUnit.maxHp,
      team: gameUnit.team,
      alive: gameUnit.alive,
      instanceId: gameUnit.instanceId,
      
      // Core 2.0 Mechanics fields (Tier 0-4)
      facing: unitWithMechanics.facing,
      resolve: unitWithMechanics.resolve,
      faction: unitWithMechanics.faction,
      engaged: unitWithMechanics.isEngaged,
      riposteCharges: unitWithMechanics.riposteCharges,
      tags: unitWithMechanics.tags ? [...unitWithMechanics.tags] : undefined,
      momentum: unitWithMechanics.chargeMomentum,
      inPhalanx: unitWithMechanics.isInPhalanx,
      ammo: unitWithMechanics.ammunition,
      armorShred: unitWithMechanics.armorShred,
    } as CoreBattleUnit;
  });

  return {
    units: coreUnits,
    round: state.currentRound,
    events: [...state.events],
  };
}

/**
 * Apply core battle state changes back to game-specific state.
 * Merges unit changes from mechanics processor back into game state.
 * 
 * CRITICAL: This function preserves HP and alive status from gameState to prevent
 * the mechanics processor from "undoing" damage or reviving dead units.
 * 
 * Property preservation rules:
 * 
 * HP preservation:
 * - Uses Math.min(gameState.currentHp, coreState.currentHp) to ensure damage is never undone
 * - If coreState doesn't have HP info, uses gameState HP
 * 
 * Alive status:
 * - Unit is dead if gameState marks it dead (gameUnit.alive === false)
 * - Unit is dead if coreState marks it dead (coreUnit.alive === false)
 * - Unit is dead if effective HP <= 0
 * - All three conditions must be true for unit to be alive
 * 
 * Position:
 * - Uses coreState position if available (mechanics may move units)
 * - Falls back to gameState position if not set
 * 
 * Facing:
 * - Uses coreState facing if available (facing processor may rotate units)
 * - Falls back to gameState facing if not set
 * 
 * Resolve:
 * - Uses coreState resolve if available (resolve processor may modify)
 * - Falls back to gameState resolve if not set
 * 
 * @param gameState - Original game-specific state with current HP and alive status
 * @param coreState - Updated core state from mechanics processor (may have stale HP/alive)
 * @returns Updated game-specific state with preserved HP and alive status
 * 
 * @example
 * // After mechanics phase, merge state back
 * const result = processor.process('attack', coreState, context);
 * const updatedState = fromCoreBattleState(gameState, result.state);
 * // updatedState preserves HP reductions and death status from gameState
 */
export function fromCoreBattleState(
  gameState: BattleStateWithAbilities,
  coreState: CoreBattleState<CoreBattleUnit>
): BattleStateWithAbilities {
  // Merge unit changes from core state back to game state
  const updatedUnits = gameState.units.map(gameUnit => {
    const coreUnit = coreState.units.find(u => u.instanceId === gameUnit.instanceId);
    if (coreUnit) {
      // Extract game-specific mechanics fields
      const gameUnitWithMechanics = gameUnit as BattleUnitWithAbilities & {
        facing?: FacingDirection;
        resolve?: number;
        maxResolve?: number;
        riposteCharges?: number;
        ammunition?: number;
        maxAmmunition?: number;
        tags?: string[];
        armorShred?: number;
        isEngaged?: boolean;
        engagedBy?: string[];
        chargeMomentum?: number;
        isInOverwatch?: boolean;
        isInPhalanx?: boolean;
        isRouting?: boolean;
        hasCrumbled?: boolean;
        faction?: string;
      };

      // CRITICAL: Preserve HP and alive status from gameState - coreState may not have updated death info
      // Use the LOWER HP value between gameState and coreState (damage should never be "undone")
      const effectiveHp = Math.min(
        gameUnit.currentHp,
        coreUnit.currentHp ?? gameUnit.currentHp
      );
      
      // A unit is dead if either gameState or coreState marks it as dead, or if HP <= 0
      const isAlive = gameUnit.alive && 
        (coreUnit.alive ?? true) && 
        effectiveHp > 0;
      
      // Position: use coreState if available (mechanics may move units)
      const position = coreUnit.position ?? gameUnit.position;
      
      // Facing: use coreState if available (facing processor may rotate units)
      const facing = coreUnit.facing ?? gameUnitWithMechanics.facing;
      
      // Resolve: use coreState if available (resolve processor may modify)
      const resolve = coreUnit.resolve ?? gameUnitWithMechanics.resolve;
      
      return {
        ...gameUnit,
        // Preserve game-specific properties that might not be in core
        abilityCooldowns: gameUnit.abilityCooldowns,
        statusEffects: gameUnit.statusEffects,
        isStunned: gameUnit.isStunned,
        hasTaunt: gameUnit.hasTaunt,
        
        // CRITICAL: Explicitly set HP and alive status (don't let coreUnit overwrite incorrectly)
        currentHp: effectiveHp,
        alive: isAlive,
        
        // Position (may be updated by mechanics)
        position: { ...position },
        
        // Core 2.0 Mechanics fields (may be updated by processors)
        facing,
        resolve,
        riposteCharges: coreUnit.riposteCharges ?? gameUnitWithMechanics.riposteCharges,
        isEngaged: coreUnit.engaged ?? gameUnitWithMechanics.isEngaged,
        chargeMomentum: coreUnit.momentum ?? gameUnitWithMechanics.chargeMomentum,
        isInPhalanx: coreUnit.inPhalanx ?? gameUnitWithMechanics.isInPhalanx,
        ammunition: coreUnit.ammo ?? gameUnitWithMechanics.ammunition,
        armorShred: coreUnit.armorShred ?? gameUnitWithMechanics.armorShred,
        
        // Preserve fields not modified by core processors
        maxResolve: gameUnitWithMechanics.maxResolve,
        maxAmmunition: gameUnitWithMechanics.maxAmmunition,
        tags: gameUnitWithMechanics.tags,
        engagedBy: gameUnitWithMechanics.engagedBy,
        isInOverwatch: gameUnitWithMechanics.isInOverwatch,
        isRouting: gameUnitWithMechanics.isRouting,
        hasCrumbled: gameUnitWithMechanics.hasCrumbled,
        faction: gameUnitWithMechanics.faction,
      } as BattleUnitWithAbilities;
    }
    return gameUnit;
  });

  return {
    ...gameState,
    units: updatedUnits,
  };
}

/**
 * Apply resolve damage to allies when a unit dies.
 * Per design doc:
 * - Adjacent allies (within 1 cell): -15 resolve
 * - Nearby allies (within 3 cells): -8 resolve
 * 
 * @param state - Current battle state
 * @param deadUnit - The unit that just died
 * @param round - Current round number for event generation
 * @returns Object with updated state and generated events
 */
function applyAllyDeathResolveDamage(
  state: BattleStateWithAbilities,
  deadUnit: BattleUnitWithAbilities,
  round: number
): { state: BattleStateWithAbilities; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  const updatedUnits = [...state.units];
  
  // Find all living allies of the dead unit
  const allies = state.units.filter(u => 
    u.alive && 
    u.team === deadUnit.team && 
    u.instanceId !== deadUnit.instanceId
  );
  
  for (const ally of allies) {
    const distance = manhattanDistance(ally.position, deadUnit.position);
    let resolveDamage = 0;
    
    if (distance <= 1) {
      // Adjacent ally - higher resolve damage
      resolveDamage = RESOLVE_DAMAGE.ALLY_DEATH_ADJACENT;
    } else if (distance <= RESOLVE_DAMAGE.ALLY_DEATH_NEARBY_RANGE) {
      // Nearby ally - lower resolve damage
      resolveDamage = RESOLVE_DAMAGE.ALLY_DEATH_NEARBY;
    }
    
    if (resolveDamage > 0) {
      const allyWithResolve = ally as BattleUnitWithAbilities & { resolve?: number };
      const currentResolve = allyWithResolve.resolve ?? 100;
      const newResolve = Math.max(0, currentResolve - resolveDamage);
      
      // Update ally's resolve in state
      const allyIndex = updatedUnits.findIndex(u => u.instanceId === ally.instanceId);
      if (allyIndex >= 0) {
        updatedUnits[allyIndex] = {
          ...updatedUnits[allyIndex],
          resolve: newResolve,
        } as BattleUnitWithAbilities;
      }
      
      // Generate resolve event
      const resolveEvent: BattleEvent = {
        type: 'mechanic_resolve',
        round,
        actorId: deadUnit.instanceId,
        targetId: ally.instanceId,
        metadata: {
          resolveDamage,
          previousResolve: currentResolve,
          newResolve,
          source: distance <= 1 ? 'ally_death_adjacent' : 'ally_death_nearby',
          deadAllyId: deadUnit.instanceId,
          distance,
        },
      };
      events.push(resolveEvent);
    }
  }
  
  return {
    state: { ...state, units: updatedUnits },
    events,
  };
}

/**
 * Check if a unit is surrounded and apply resolve damage.
 * Per design doc: -20 resolve if 3+ enemies are adjacent at turn start.
 * 
 * @param state - Current battle state
 * @param unit - The unit to check
 * @param round - Current round number for event generation
 * @returns Object with updated state and generated event (if any)
 */
function checkSurroundedResolveDamage(
  state: BattleStateWithAbilities,
  unit: BattleUnitWithAbilities,
  round: number
): { state: BattleStateWithAbilities; event: BattleEvent | null } {
  // Count adjacent enemies
  const adjacentEnemies = state.units.filter(u => 
    u.alive && 
    u.team !== unit.team && 
    manhattanDistance(u.position, unit.position) <= 1
  );
  
  if (adjacentEnemies.length >= RESOLVE_DAMAGE.SURROUNDED_MIN_ENEMIES) {
    const unitWithResolve = unit as BattleUnitWithAbilities & { resolve?: number };
    const currentResolve = unitWithResolve.resolve ?? 100;
    const newResolve = Math.max(0, currentResolve - RESOLVE_DAMAGE.SURROUNDED);
    
    // Update unit's resolve in state
    const updatedUnits = state.units.map(u => 
      u.instanceId === unit.instanceId 
        ? { ...u, resolve: newResolve } as BattleUnitWithAbilities
        : u
    );
    
    const resolveEvent: BattleEvent = {
      type: 'mechanic_resolve',
      round,
      actorId: unit.instanceId,
      targetId: unit.instanceId,
      metadata: {
        resolveDamage: RESOLVE_DAMAGE.SURROUNDED,
        previousResolve: currentResolve,
        newResolve,
        source: 'surrounded',
        adjacentEnemyCount: adjacentEnemies.length,
      },
    };
    
    return {
      state: { ...state, units: updatedUnits },
      event: resolveEvent,
    };
  }
  
  return { state, event: null };
}

// =============================================================================
// ROUTING FUNCTIONS (Core 2.0 Resolve)
// =============================================================================

/**
 * Check if a unit should start routing (resolve = 0) or rally (resolve >= 25).
 * Per design doc:
 * - Human units route when resolve = 0
 * - Routing units rally when resolve >= 25
 * 
 * @param unit - Unit to check
 * @returns 'route' if should start routing, 'rally' if should stop routing, null otherwise
 */
function checkRoutingState(
  unit: BattleUnitWithAbilities & { resolve?: number; isRouting?: boolean; faction?: string }
): 'route' | 'rally' | null {
  const resolve = unit.resolve ?? 100;
  const isRouting = unit.isRouting ?? false;
  const faction = unit.faction ?? 'human';
  
  // Undead don't route, they crumble (handled separately)
  if (faction === 'undead') {
    return null;
  }
  
  // Check if should start routing
  if (!isRouting && resolve <= 0) {
    return 'route';
  }
  
  // Check if should rally
  if (isRouting && resolve >= ROUTING_CONFIG.RALLY_THRESHOLD) {
    return 'rally';
  }
  
  return null;
}

/**
 * Find retreat position for a routing unit.
 * Unit moves toward their deployment edge.
 * 
 * @param unit - Routing unit
 * @param state - Current battle state
 * @returns Best retreat position or null if can't move
 */
function findRetreatPosition(
  unit: BattleUnitWithAbilities,
  state: BattleStateWithAbilities
): Position | null {
  const targetRow = unit.team === 'player' 
    ? ROUTING_CONFIG.PLAYER_RETREAT_ROW 
    : ROUTING_CONFIG.BOT_RETREAT_ROW;
  
  // Already at edge
  if (unit.position.y === targetRow) {
    return null;
  }
  
  // Direction to move
  const direction = targetRow < unit.position.y ? -1 : 1;
  
  // Try to move up to RETREAT_DISTANCE cells toward edge
  for (let dist = ROUTING_CONFIG.RETREAT_DISTANCE; dist >= 1; dist--) {
    const newY = unit.position.y + (direction * dist);
    
    // Check bounds
    if (newY < 0 || newY > 9) continue;
    
    const newPos = { x: unit.position.x, y: newY };
    
    // Check if position is occupied
    const isOccupied = state.units.some(u => 
      u.alive && 
      u.instanceId !== unit.instanceId &&
      u.position.x === newPos.x && 
      u.position.y === newPos.y
    );
    
    if (!isOccupied) {
      return newPos;
    }
  }
  
  // Try adjacent columns if direct path blocked
  for (const xOffset of [-1, 1]) {
    const newX = unit.position.x + xOffset;
    if (newX < 0 || newX > 7) continue;
    
    const newY = unit.position.y + direction;
    if (newY < 0 || newY > 9) continue;
    
    const newPos = { x: newX, y: newY };
    
    const isOccupied = state.units.some(u => 
      u.alive && 
      u.instanceId !== unit.instanceId &&
      u.position.x === newPos.x && 
      u.position.y === newPos.y
    );
    
    if (!isOccupied) {
      return newPos;
    }
  }
  
  return null;
}

/**
 * Execute routing behavior for a unit.
 * Routing units:
 * - Cannot attack or use abilities
 * - Move toward their deployment edge
 * - Generate routing events
 * 
 * @param unit - Routing unit
 * @param state - Current battle state
 * @param round - Current round number
 * @returns Updated state and events
 */
function executeRoutingTurn(
  unit: BattleUnitWithAbilities,
  state: BattleStateWithAbilities,
  round: number
): { state: BattleStateWithAbilities; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  
  // Find retreat position
  const retreatPos = findRetreatPosition(unit, state);
  
  if (retreatPos) {
    // Generate movement event
    const moveEvent: BattleEvent = {
      type: 'move',
      round,
      actorId: unit.instanceId,
      fromPosition: unit.position,
      toPosition: retreatPos,
      metadata: {
        reason: 'routing',
      },
    };
    events.push(moveEvent);
    
    // Update unit position in state
    const updatedUnits = state.units.map(u => 
      u.instanceId === unit.instanceId 
        ? { ...u, position: retreatPos } as BattleUnitWithAbilities
        : u
    );
    
    // Update occupied positions
    const occupiedPositions = new Set<string>();
    updatedUnits.forEach(u => {
      if (u.alive) {
        occupiedPositions.add(`${u.position.x},${u.position.y}`);
      }
    });
    
    state = { ...state, units: updatedUnits, occupiedPositions };
  }
  
  // Generate routing status event
  const routingEvent: BattleEvent = {
    type: 'mechanic_routing',
    round,
    actorId: unit.instanceId,
    metadata: {
      status: 'routing',
      retreatPosition: retreatPos,
      reason: 'resolve_zero',
    },
  };
  events.push(routingEvent);
  
  return { state, events };
}

/**
 * Apply routing state change to a unit.
 * 
 * @param state - Current battle state
 * @param unit - Unit to update
 * @param isRouting - New routing state
 * @param round - Current round number
 * @returns Updated state and event
 */
function applyRoutingStateChange(
  state: BattleStateWithAbilities,
  unit: BattleUnitWithAbilities,
  isRouting: boolean,
  round: number
): { state: BattleStateWithAbilities; event: BattleEvent } {
  // Update unit's routing state
  const updatedUnits = state.units.map(u => 
    u.instanceId === unit.instanceId 
      ? { ...u, isRouting } as BattleUnitWithAbilities
      : u
  );
  
  const event: BattleEvent = {
    type: 'mechanic_routing',
    round,
    actorId: unit.instanceId,
    metadata: {
      status: isRouting ? 'started_routing' : 'rallied',
      resolve: (unit as BattleUnitWithAbilities & { resolve?: number }).resolve ?? 0,
    },
  };
  
  return {
    state: { ...state, units: updatedUnits },
    event,
  };
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
 * Initializes Core 2.0 mechanics fields (facing, resolve, riposteCharges, etc.)
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
    
    // Determine initial facing direction based on team
    // Player units face North (toward enemy), Bot units face South (toward player)
    const initialFacing = teamType === 'player' ? 'N' : 'S';
    
    // Get mechanics fields from unit template (Core 2.0)
    const templateWithMechanics = unitTemplate as typeof unitTemplate & {
      resolve?: number;
      riposteCharges?: number;
      ammunition?: number;
      tags?: string[];
      facing?: string;
    };
    
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
      // Core 2.0 Mechanics initialization
      facing: templateWithMechanics.facing ?? initialFacing,
      resolve: templateWithMechanics.resolve ?? 100,
      maxResolve: templateWithMechanics.resolve ?? 100,
      // Initialize riposte charges based on attackCount (default 1)
      // This ensures units can riposte from the start of battle
      riposteCharges: templateWithMechanics.riposteCharges ?? unitTemplate.stats.atkCount ?? 1,
      ammunition: templateWithMechanics.ammunition,
      maxAmmunition: templateWithMechanics.ammunition,
      tags: templateWithMechanics.tags ?? [],
      armorShred: 0,
      isEngaged: false,
      engagedBy: [],
      chargeMomentum: 0,
      isInOverwatch: false,
      isInPhalanx: false,
      // Routing state (Core 2.0 Resolve)
      isRouting: false,
      hasCrumbled: false,
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
 * Validates that target is still alive before execution.
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
  
  // Passive abilities cannot be executed as actions - they trigger automatically
  // This is a safety check in case AI incorrectly decides to use a passive ability
  if (!isActiveAbility(ability)) {
    return [];
  }
  
  // Determine target for ability
  // Get fresh target state from current state to ensure we have up-to-date alive status
  let target: BattleUnitWithAbilities | Position = unit;
  
  if (action.target) {
    // Find the current state of the target unit
    const currentTarget = state.units.find(u => u.instanceId === action.target?.instanceId);
    if (currentTarget && currentTarget.alive) {
      target = currentTarget;
    } else {
      // Target is dead or not found - skip ability execution
      return [];
    }
  } else if (action.targetPosition) {
    target = action.targetPosition;
  }
  
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
 * Apply resolve damage to a target unit from an attack.
 * Calculates total resolve damage (base ATK + flanking bonus) and updates state.
 * 
 * Per design doc: Every attack deals resolve damage = 100% ATK + flanking bonus.
 * 
 * @param state - Current battle state
 * @param attacker - Unit dealing the attack
 * @param target - Unit receiving resolve damage
 * @param combatModifiers - Combat modifiers including flanking resolve damage
 * @param round - Current round number for event generation
 * @returns Updated state and resolve event
 */
function applyAttackResolveDamage(
  state: BattleStateWithAbilities,
  attacker: BattleUnitWithAbilities,
  target: BattleUnitWithAbilities,
  combatModifiers: { resolveDamage: number; attackArc: string },
  round: number
): { state: BattleStateWithAbilities; event: BattleEvent } {
  const targetWithResolve = target as BattleUnitWithAbilities & { resolve?: number };
  const currentResolve = targetWithResolve.resolve ?? 100;
  
  // Base resolve damage = attacker's ATK (armor does NOT reduce resolve damage)
  const baseResolveDamage = attacker.stats.atk;
  // Additional resolve damage from flanking/rear attacks
  const flankingResolveDamage = combatModifiers.resolveDamage;
  // Total resolve damage
  const totalResolveDamage = baseResolveDamage + flankingResolveDamage;
  
  const newResolve = Math.max(0, currentResolve - totalResolveDamage);
  
  // Update target's resolve in state
  const updatedUnits = state.units.map(u => 
    u.instanceId === target.instanceId 
      ? { ...u, resolve: newResolve } as BattleUnitWithAbilities
      : u
  );
  
  // Generate resolve event
  const resolveEvent: BattleEvent = {
    type: 'mechanic_resolve',
    round,
    actorId: attacker.instanceId,
    targetId: target.instanceId,
    metadata: {
      resolveDamage: totalResolveDamage,
      baseResolveDamage,
      flankingResolveDamage,
      previousResolve: currentResolve,
      newResolve,
      source: flankingResolveDamage > 0 ? combatModifiers.attackArc : 'attack',
    },
  };
  
  return {
    state: { ...state, units: updatedUnits },
    event: resolveEvent,
  };
}

/**
 * Process a mechanics phase and collect events.
 * Delegates to the MechanicsProcessor for the specified phase.
 * 
 * This helper function:
 * 1. Converts game state to core state
 * 2. Calls processor.process() for the phase
 * 3. Converts core state back to game state
 * 4. Collects and returns events
 * 
 * @param processor - Mechanics processor (optional)
 * @param phase - Battle phase to process
 * @param state - Current battle state
 * @param context - Phase context with active unit, target, action
 * @returns Updated state and generated events
 * 
 * @example
 * const result = processPhase(processor, 'pre_attack', state, {
 *   activeUnit: attacker,
 *   target: defender,
 *   seed: 12345
 * });
 * state = result.state;
 * events.push(...result.events);
 */
function processPhase(
  processor: MechanicsProcessor | undefined,
  phase: 'turn_start' | 'movement' | 'pre_attack' | 'attack' | 'post_attack' | 'turn_end',
  state: BattleStateWithAbilities,
  context: PhaseContext
): { state: BattleStateWithAbilities; events: BattleEvent[] } {
  // If no processor, return unchanged state with no events
  if (!processor) {
    return { state, events: [] };
  }
  
  try {
    // Log phase processing start
    if (process.env['NODE_ENV'] !== 'production') {
      console.debug(`[Mechanics] Processing phase: ${phase}`, {
        activeUnit: context.activeUnit?.id,
        target: (context as { target?: CoreBattleUnit }).target?.id,
        round: state.currentRound,
      });
    }
    
    // Convert game state to core state for processor
    const coreState = toCoreBattleState(state);
    
    // Process the phase through mechanics processor
    const result: ProcessResult = processor.process(phase, coreState, context);
    
    // Log mechanic events generated
    if (process.env['NODE_ENV'] !== 'production' && result.events && result.events.length > 0) {
      const mechanicEventCounts: Record<string, number> = {};
      for (const event of result.events) {
        mechanicEventCounts[event.type] = (mechanicEventCounts[event.type] || 0) + 1;
      }
      
      console.debug(`[Mechanics] Phase ${phase} generated ${result.events.length} events`, {
        eventTypes: mechanicEventCounts,
        activeUnit: context.activeUnit?.id,
      });
    }
    
    // Convert core state back to game state
    const updatedState = fromCoreBattleState(state, result.state);
    
    // Set round number on all mechanic events (they come with round=0 as placeholder)
    const eventsWithRound = (result.events || []).map(event => ({
      ...event,
      round: state.currentRound,
    }));
    
    // Return updated state and events
    return {
      state: updatedState,
      events: eventsWithRound,
    };
  } catch (error) {
    // Log error with full context for debugging
    console.error(`[Mechanics] Phase ${phase} failed:`, {
      phase,
      activeUnit: context.activeUnit?.id,
      target: (context as { target?: CoreBattleUnit }).target?.id,
      round: state.currentRound,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return unchanged state with no events
    // This ensures partial results are preserved for debugging
    return { state, events: [] };
  }
}

/**
 * Execute a unit's turn with AI decision making and ability support.
 * Flow: check stun → AI decision → execute action
 * 
 * @param unit - Unit taking the turn
 * @param state - Current battle state
 * @param seed - Random seed for deterministic behavior
 * @param processor - Optional mechanics processor for Core 2.0 mechanics
 * @returns Events generated during the turn and updated state
 */
function executeUnitTurnWithAbilities(
  unit: BattleUnitWithAbilities,
  state: BattleStateWithAbilities,
  seed: number,
  processor?: MechanicsProcessor
): { events: BattleEvent[]; state: BattleStateWithAbilities } {
  const events: BattleEvent[] = [];
  let currentState = state;
  let currentSeed = seed;
  
  // Skip turn if unit is stunned
  if (unit.isStunned) {
    return { events: [], state: currentState };
  }
  
  // Skip turn if unit is dead (safety check)
  if (!unit.alive) {
    return { events: [], state: currentState };
  }
  
  // TURN_START phase (Core 2.0)
  const turnStartResult = processPhase(processor, 'turn_start', currentState, {
    activeUnit: unit as unknown as CoreBattleUnit,
    seed: currentSeed++,
  });
  currentState = turnStartResult.state;
  events.push(...turnStartResult.events);
  
  // Check if unit is surrounded at turn start (Core 2.0)
  // Per design doc: -20 resolve if 3+ enemies are adjacent
  if (processor?.config.resolve) {
    const surroundedResult = checkSurroundedResolveDamage(
      currentState,
      unit,
      currentState.currentRound
    );
    if (surroundedResult.event) {
      currentState = surroundedResult.state;
      events.push(surroundedResult.event);
    }
    
    // Get fresh unit state after surrounded damage
    const freshUnit = currentState.units.find(u => u.instanceId === unit.instanceId);
    if (freshUnit) {
      // Check routing state (resolve = 0 starts routing, resolve >= 25 rallies)
      const routingChange = checkRoutingState(freshUnit as BattleUnitWithAbilities & { resolve?: number; isRouting?: boolean });
      
      if (routingChange === 'route') {
        // Unit starts routing
        const routeResult = applyRoutingStateChange(currentState, freshUnit, true, currentState.currentRound);
        currentState = routeResult.state;
        events.push(routeResult.event);
      } else if (routingChange === 'rally') {
        // Unit rallies (stops routing)
        const rallyResult = applyRoutingStateChange(currentState, freshUnit, false, currentState.currentRound);
        currentState = rallyResult.state;
        events.push(rallyResult.event);
      }
      
      // If unit is routing, execute routing turn instead of normal turn
      const unitAfterCheck = currentState.units.find(u => u.instanceId === unit.instanceId);
      if (unitAfterCheck && (unitAfterCheck as BattleUnitWithAbilities & { isRouting?: boolean }).isRouting) {
        const routingTurnResult = executeRoutingTurn(unitAfterCheck, currentState, currentState.currentRound);
        currentState = routingTurnResult.state;
        events.push(...routingTurnResult.events);
        
        // TURN_END phase (Core 2.0)
        const turnEndResult = processPhase(processor, 'turn_end', currentState, {
          activeUnit: unitAfterCheck as unknown as CoreBattleUnit,
          seed: currentSeed++,
        });
        currentState = turnEndResult.state;
        events.push(...turnEndResult.events);
        
        return { events, state: currentState };
      }
    }
  }
  
  // Get AI decision for this unit
  const action = decideAction(unit, currentState);
  
  // Execute based on action type
  switch (action.type) {
    case 'ability': {
      // CRITICAL: Validate target is still alive before using ability
      // Target may have been killed by another unit earlier in this round
      if (action.target) {
        const freshTarget = currentState.units.find(u => u.instanceId === action.target?.instanceId);
        if (!freshTarget || !freshTarget.alive) {
          // Target is dead - skip ability, use legacy turn to find new target or action
          const turnEvents = executeTurn(unit, currentState, seed);
          if (turnEvents.length > 0) {
            currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
            events.push(...turnEvents);
          }
          break;
        }
      }
      
      // PRE_ATTACK phase for abilities (Core 2.0)
      if (action.target) {
        const preAttackResult = processPhase(processor, 'pre_attack', currentState, {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: action.target as unknown as CoreBattleUnit,
          action: convertToBattleAction(action),
          seed: currentSeed++,
        });
        currentState = preAttackResult.state;
        events.push(...preAttackResult.events);
      }
      
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
        
        // Generate death events for units killed by abilities
        // This ensures the frontend can properly display death animations
        for (const abilityEvent of abilityEvents) {
          if (abilityEvent.killedUnits && abilityEvent.killedUnits.length > 0) {
            for (const killedUnitId of abilityEvent.killedUnits) {
              const deathEvent: BattleEvent = {
                round: currentState.currentRound,
                type: 'death',
                actorId: killedUnitId,
                killedUnits: [killedUnitId],
              };
              events.push(deathEvent);
              
              // Apply resolve damage to allies of the dead unit (Core 2.0)
              if (processor?.config.resolve) {
                const deadUnit = currentState.units.find(u => u.instanceId === killedUnitId);
                if (deadUnit) {
                  const allyDeathResult = applyAllyDeathResolveDamage(
                    currentState,
                    deadUnit as BattleUnitWithAbilities,
                    currentState.currentRound
                  );
                  currentState = allyDeathResult.state;
                  events.push(...allyDeathResult.events);
                }
              }
            }
          }
        }
      }
      
      // POST_ATTACK phase for abilities (Core 2.0)
      if (action.target) {
        const postAttackResult = processPhase(processor, 'post_attack', currentState, {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: action.target as unknown as CoreBattleUnit,
          seed: currentSeed++,
        });
        currentState = postAttackResult.state;
        events.push(...postAttackResult.events);
      }
      break;
    }
    
    case 'attack': {
      // Validate target is still alive before attacking
      // Get fresh target state from current state
      let currentTarget = action.target;
      if (action.target) {
        const freshTarget = currentState.units.find(u => u.instanceId === action.target?.instanceId);
        if (!freshTarget || !freshTarget.alive) {
          // Target is dead - skip attack, use legacy turn to find new target
          const turnEvents = executeTurn(unit, currentState, seed);
          if (turnEvents.length > 0) {
            currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
            events.push(...turnEvents);
          }
          break;
        }
        currentTarget = freshTarget as BattleUnitWithAbilities;
      }
      
      // PRE_ATTACK phase (Core 2.0)
      if (currentTarget) {
        const preAttackResult = processPhase(processor, 'pre_attack', currentState, {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: currentTarget as unknown as CoreBattleUnit,
          action: convertToBattleAction(action),
          seed: currentSeed++,
        });
        currentState = preAttackResult.state;
        events.push(...preAttackResult.events);
      }
      
      // Check if any mechanics are actually enabled
      // If not, use legacy turn execution for backward compatibility
      const hasMechanicsEnabled = processor && (
        processor.config.facing ||
        processor.config.flanking ||
        processor.config.charge ||
        processor.config.armorShred ||
        processor.config.resolve ||
        processor.config.riposte ||
        processor.config.engagement
      );
      
      if (hasMechanicsEnabled && currentTarget) {
        // Calculate combat modifiers from enabled mechanics
        // This includes flanking, charge momentum, etc.
        // Note: Facing is already updated by FacingProcessor in pre_attack phase
        const modifiersResult = calculateCombatModifiers(processor, {
          attacker: unit,
          target: currentTarget,
          distanceMoved: 0, // TODO: Track actual distance moved this turn
          round: currentState.currentRound,
          seed: currentSeed++,
        });
        
        const combatModifiers = modifiersResult.modifiers;
        
        // Add mechanic events (flanking, charge, etc.)
        if (modifiersResult.events.length > 0) {
          events.push(...modifiersResult.events);
        }
        
        // Check if target is in range and execute attack with mechanics modifiers
        if (canTarget(unit, currentTarget)) {
          const distance = manhattanDistance(unit.position, currentTarget.position);
          
          if (distance <= unit.range) {
            // Track events generated during this attack for state application
            const attackEvents: BattleEvent[] = [];
            
            // Execute attack with mechanics modifiers
            const attackEvent = executeAttack(unit, currentTarget, currentSeed++, combatModifiers);
            attackEvent.round = currentState.currentRound;
            events.push(attackEvent);
            attackEvents.push(attackEvent);
            
            // Create damage event if attack was not dodged
            if (attackEvent.damage > 0) {
              const damageEvent: BattleEvent = {
                round: currentState.currentRound,
                type: 'damage',
                actorId: unit.instanceId,
                targetId: currentTarget.instanceId,
                damage: attackEvent.damage,
              };
              events.push(damageEvent);
              attackEvents.push(damageEvent);
              
              // Apply resolve damage (Core 2.0)
              if (processor?.config.resolve) {
                const resolveResult = applyAttackResolveDamage(
                  currentState,
                  unit,
                  currentTarget,
                  { resolveDamage: combatModifiers.resolveDamage, attackArc: combatModifiers.attackArc },
                  currentState.currentRound
                );
                currentState = resolveResult.state;
                events.push(resolveResult.event);
                
                // Check if target should start routing (resolve = 0)
                const targetAfterResolve = currentState.units.find(u => u.instanceId === currentTarget?.instanceId);
                if (targetAfterResolve && targetAfterResolve.alive) {
                  const routingChange = checkRoutingState(targetAfterResolve as BattleUnitWithAbilities & { resolve?: number; isRouting?: boolean });
                  if (routingChange === 'route') {
                    const routeResult = applyRoutingStateChange(currentState, targetAfterResolve, true, currentState.currentRound);
                    currentState = routeResult.state;
                    events.push(routeResult.event);
                  }
                }
              }
            }
            
            // Apply attack events to state (damage and death)
            currentState = applyBattleEvents(currentState, attackEvents) as BattleStateWithAbilities;
            
            // Check if target was killed AFTER applying damage to state
            // This ensures we use the actual HP after damage, not the pre-calculated value
            const targetAfterDamage = currentState.units.find(u => u.instanceId === currentTarget?.instanceId);
            if (targetAfterDamage && !targetAfterDamage.alive) {
              // Only add death event if not already added
              const hasDeathEvent = attackEvents.some(e => e.type === 'death' && e.killedUnits?.includes(currentTarget?.instanceId ?? ''));
              if (!hasDeathEvent) {
                const deathEvent: BattleEvent = {
                  round: currentState.currentRound,
                  type: 'death',
                  actorId: currentTarget.instanceId,
                  killedUnits: [currentTarget.instanceId],
                };
                events.push(deathEvent);
                // Apply death event to state
                currentState = applyBattleEvents(currentState, [deathEvent]) as BattleStateWithAbilities;
                
                // Apply resolve damage to allies of the dead unit (Core 2.0)
                if (processor?.config.resolve) {
                  const allyDeathResult = applyAllyDeathResolveDamage(
                    currentState,
                    currentTarget as BattleUnitWithAbilities,
                    currentState.currentRound
                  );
                  currentState = allyDeathResult.state;
                  events.push(...allyDeathResult.events);
                }
              }
            }
          } else {
            // Target not in range, use legacy turn execution for movement + attack
            const turnEvents = executeTurn(unit, currentState, seed);
            
            if (turnEvents.length > 0) {
              // Find attack event to apply mechanics to the actual target
              const attackEvent = turnEvents.find(e => e.type === 'attack');
              if (attackEvent && attackEvent.targetId && hasMechanicsEnabled) {
                const attackTarget = currentState.units.find(u => u.instanceId === attackEvent.targetId);
                if (attackTarget) {
                  // Apply flanking mechanics for legacy turn attacks
                  const legacyModifiers = calculateCombatModifiers(processor, {
                    attacker: unit,
                    target: attackTarget,
                    distanceMoved: 0,
                    round: currentState.currentRound,
                    seed: currentSeed++,
                  });
                  
                  // Add flanking events BEFORE attack event
                  if (legacyModifiers.events.length > 0) {
                    events.push(...legacyModifiers.events);
                  }
                  
                  // Recalculate damage with flanking modifier if applicable
                  if (legacyModifiers.modifiers.flankingModifier > 1.0 && attackEvent.damage && attackEvent.damage > 0) {
                    const originalDamage = attackEvent.damage;
                    const newDamage = Math.floor(originalDamage * legacyModifiers.modifiers.flankingModifier);
                    attackEvent.damage = newDamage;
                    
                    // Also update damage event if present
                    const damageEvent = turnEvents.find(e => e.type === 'damage' && e.targetId === attackEvent.targetId);
                    if (damageEvent && damageEvent.damage) {
                      damageEvent.damage = newDamage;
                    }
                    
                    // Add metadata to attack event
                    attackEvent.metadata = {
                      ...attackEvent.metadata,
                      attackArc: legacyModifiers.modifiers.attackArc,
                      flankingModifier: legacyModifiers.modifiers.flankingModifier,
                      originalDamage,
                    };
                  }
                  
                  // Apply resolve damage for legacy turn attacks (Core 2.0)
                  if (processor?.config.resolve && attackEvent.damage && attackEvent.damage > 0) {
                    const resolveResult = applyAttackResolveDamage(
                      currentState,
                      unit,
                      attackTarget,
                      { resolveDamage: legacyModifiers.modifiers.resolveDamage, attackArc: legacyModifiers.modifiers.attackArc },
                      currentState.currentRound
                    );
                    currentState = resolveResult.state;
                    events.push(resolveResult.event);
                  }
                  
                  // Update currentTarget for post-attack mechanics
                  currentTarget = attackTarget as BattleUnitWithAbilities;
                }
              }
              
              currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
              events.push(...turnEvents);
              
              // Check if target was killed after applying modified damage
              // This handles cases where flanking modifier increases damage enough to kill
              if (attackEvent && attackEvent.targetId) {
                const targetAfterDamage = currentState.units.find(u => u.instanceId === attackEvent.targetId);
                const hasDeathEvent = turnEvents.some(e => e.type === 'death' && e.killedUnits?.includes(attackEvent.targetId ?? ''));
                if (targetAfterDamage && !targetAfterDamage.alive && !hasDeathEvent) {
                  const deathEvent: BattleEvent = {
                    round: currentState.currentRound,
                    type: 'death',
                    actorId: attackEvent.targetId,
                    killedUnits: [attackEvent.targetId],
                  };
                  events.push(deathEvent);
                  
                  // Apply resolve damage to allies of the dead unit (Core 2.0)
                  if (processor?.config.resolve) {
                    const deadUnit = currentState.units.find(u => u.instanceId === attackEvent.targetId);
                    if (deadUnit) {
                      const allyDeathResult = applyAllyDeathResolveDamage(
                        currentState,
                        deadUnit as BattleUnitWithAbilities,
                        currentState.currentRound
                      );
                      currentState = allyDeathResult.state;
                      events.push(...allyDeathResult.events);
                    }
                  }
                }
              }
            }
          }
        } else {
          // No valid target, use legacy turn execution
          const turnEvents = executeTurn(unit, currentState, seed);
          
          if (turnEvents.length > 0) {
            // Find attack event to apply mechanics
            const attackEvent = turnEvents.find(e => e.type === 'attack');
            if (attackEvent && attackEvent.targetId && hasMechanicsEnabled) {
              const attackTarget = currentState.units.find(u => u.instanceId === attackEvent.targetId);
              if (attackTarget) {
                const legacyModifiers = calculateCombatModifiers(processor, {
                  attacker: unit,
                  target: attackTarget,
                  distanceMoved: 0,
                  round: currentState.currentRound,
                  seed: currentSeed++,
                });
                
                // Add flanking events BEFORE attack event
                if (legacyModifiers.events.length > 0) {
                  events.push(...legacyModifiers.events);
                }
                
                // Recalculate damage with flanking modifier if applicable
                if (legacyModifiers.modifiers.flankingModifier > 1.0 && attackEvent.damage && attackEvent.damage > 0) {
                  const originalDamage = attackEvent.damage;
                  const newDamage = Math.floor(originalDamage * legacyModifiers.modifiers.flankingModifier);
                  attackEvent.damage = newDamage;
                  
                  // Also update damage event if present
                  const damageEvent = turnEvents.find(e => e.type === 'damage' && e.targetId === attackEvent.targetId);
                  if (damageEvent && damageEvent.damage) {
                    damageEvent.damage = newDamage;
                  }
                  
                  attackEvent.metadata = {
                    ...attackEvent.metadata,
                    attackArc: legacyModifiers.modifiers.attackArc,
                    flankingModifier: legacyModifiers.modifiers.flankingModifier,
                    originalDamage,
                  };
                }
                
                // Apply resolve damage for legacy turn attacks (Core 2.0)
                if (processor?.config.resolve && attackEvent.damage && attackEvent.damage > 0) {
                  const resolveResult = applyAttackResolveDamage(
                    currentState,
                    unit,
                    attackTarget,
                    { resolveDamage: legacyModifiers.modifiers.resolveDamage, attackArc: legacyModifiers.modifiers.attackArc },
                    currentState.currentRound
                  );
                  currentState = resolveResult.state;
                  events.push(resolveResult.event);
                }
                
                currentTarget = attackTarget as BattleUnitWithAbilities;
              }
            }
            
            currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
            events.push(...turnEvents);
            
            // Check if target was killed after applying modified damage
            // This handles cases where flanking modifier increases damage enough to kill
            if (attackEvent && attackEvent.targetId) {
              const targetAfterDamage = currentState.units.find(u => u.instanceId === attackEvent.targetId);
              const hasDeathEvent = turnEvents.some(e => e.type === 'death' && e.killedUnits?.includes(attackEvent.targetId ?? ''));
              if (targetAfterDamage && !targetAfterDamage.alive && !hasDeathEvent) {
                const deathEvent: BattleEvent = {
                  round: currentState.currentRound,
                  type: 'death',
                  actorId: attackEvent.targetId,
                  killedUnits: [attackEvent.targetId],
                };
                events.push(deathEvent);
                
                // Apply resolve damage to allies of the dead unit (Core 2.0)
                if (processor?.config.resolve) {
                  const deadUnit = currentState.units.find(u => u.instanceId === attackEvent.targetId);
                  if (deadUnit) {
                    const allyDeathResult = applyAllyDeathResolveDamage(
                      currentState,
                      deadUnit as BattleUnitWithAbilities,
                      currentState.currentRound
                    );
                    currentState = allyDeathResult.state;
                    events.push(...allyDeathResult.events);
                  }
                }
              }
            }
          }
        }
      } else {
        // No mechanics enabled - use legacy turn execution for backward compatibility
        const turnEvents = executeTurn(unit, currentState, seed);
        
        if (turnEvents.length > 0) {
          currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
          
          // Add turn events first (attack, damage, etc.)
          events.push(...turnEvents);
          
          // Check if any unit was killed but death event wasn't generated
          // This can happen when damage calculation in executeTurn doesn't account for
          // the actual HP reduction (e.g., target already damaged by previous attacks)
          // Death event must come AFTER attack/damage events for correct replay order
          const attackEvent = turnEvents.find(e => e.type === 'attack');
          if (attackEvent && attackEvent.targetId) {
            const targetAfterDamage = currentState.units.find(u => u.instanceId === attackEvent.targetId);
            const hasDeathEvent = turnEvents.some(e => e.type === 'death' && e.killedUnits?.includes(attackEvent.targetId ?? ''));
            if (targetAfterDamage && !targetAfterDamage.alive && !hasDeathEvent) {
              const deathEvent: BattleEvent = {
                round: currentState.currentRound,
                type: 'death',
                actorId: attackEvent.targetId,
                killedUnits: [attackEvent.targetId],
              };
              events.push(deathEvent);
            }
          }
        }
      }
      
      // ATTACK phase (Core 2.0) - apply armor shred, riposte, etc.
      if (currentTarget) {
        const attackResult = processPhase(processor, 'attack', currentState, {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: currentTarget as unknown as CoreBattleUnit,
          action: convertToBattleAction(action),
          seed: currentSeed++,
        });
        currentState = attackResult.state;
        events.push(...attackResult.events);
      }
      
      // POST_ATTACK phase (Core 2.0)
      if (currentTarget) {
        const postAttackResult = processPhase(processor, 'post_attack', currentState, {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: currentTarget as unknown as CoreBattleUnit,
          seed: currentSeed++,
        });
        currentState = postAttackResult.state;
        events.push(...postAttackResult.events);
      }
      break;
    }
    
    case 'move':
    default: {
      // Calculate movement path for engagement checks (Core 2.0)
      // We need the full path to check for Attack of Opportunity triggers
      let movementPath: Position[] | undefined;
      
      if (action.targetPosition && processor?.config.engagement) {
        // Import pathfinding to calculate the full movement path
        const { findPath } = require('./pathfinding');
        const { createEmptyGrid } = require('./grid');
        
        const grid = createEmptyGrid();
        const otherUnits = currentState.units.filter(
          u => u.alive && u.instanceId !== unit.instanceId
        );
        
        // Calculate full path from current position to target
        const fullPath = findPath(
          unit.position,
          action.targetPosition,
          grid,
          otherUnits,
          unit
        );
        
        if (fullPath.length > 1) {
          // Limit path to unit's speed
          const maxSteps = Math.min(fullPath.length, unit.stats.speed + 1);
          movementPath = fullPath.slice(0, maxSteps);
        }
      }
      
      // MOVEMENT phase (Core 2.0)
      // Pass the full path to engagement processor for AoO checks
      const movementAction: BattleAction = { type: 'move' };
      if (movementPath) {
        movementAction.path = movementPath;
      }
      
      const movementResult = processPhase(processor, 'movement', currentState, {
        activeUnit: unit as unknown as CoreBattleUnit,
        action: movementAction,
        seed: currentSeed++,
      });
      currentState = movementResult.state;
      events.push(...movementResult.events);
      
      // Check if unit died from Attack of Opportunity
      const unitAfterMovement = currentState.units.find(u => u.instanceId === unit.instanceId);
      if (!unitAfterMovement || !unitAfterMovement.alive) {
        // Unit was killed by AoO - skip rest of turn
        break;
      }
      
      // Use legacy turn execution for movement
      const turnEvents = executeTurn(unitAfterMovement, currentState, seed);
      
      if (turnEvents.length > 0) {
        currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
        events.push(...turnEvents);
      }
      break;
    }
  }
  
  // TURN_END phase (Core 2.0)
  const turnEndResult = processPhase(processor, 'turn_end', currentState, {
    activeUnit: unit as unknown as CoreBattleUnit,
    seed: currentSeed++,
  });
  currentState = turnEndResult.state;
  events.push(...turnEndResult.events);
  
  return { events, state: currentState };
}

/**
 * Convert UnitAction to BattleAction for mechanics processor.
 * 
 * @param action - AI decision action
 * @returns BattleAction for mechanics processor
 */
function convertToBattleAction(action: UnitAction): BattleAction {
  switch (action.type) {
    case 'ability': {
      const battleAction: BattleAction = { type: 'ability' };
      if (action.target?.instanceId) {
        battleAction.targetId = action.target.instanceId;
      }
      if (action.abilityId) {
        battleAction.abilityId = action.abilityId;
      }
      return battleAction;
    }
    case 'attack': {
      const battleAction: BattleAction = { type: 'attack' };
      if (action.target?.instanceId) {
        battleAction.targetId = action.target.instanceId;
      }
      return battleAction;
    }
    case 'move': {
      const battleAction: BattleAction = { type: 'move' };
      if (action.targetPosition) {
        battleAction.path = [action.targetPosition];
      }
      return battleAction;
    }
    default:
      return { type: 'wait' };
  }
}

// =============================================================================
// MAIN SIMULATION FUNCTION
// =============================================================================

/**
 * Simulate a complete battle between two teams.
 * Uses advanced grid-based combat with pathfinding, targeting, abilities,
 * status effects, and deterministic AI.
 * 
 * Core 2.0 Integration:
 * - Optional MechanicsProcessor for advanced combat mechanics
 * - Phase hooks: turn_start, movement, pre_attack, attack, post_attack, turn_end
 * - Backward compatible: no processor = MVP behavior (identical to Core 1.0)
 * 
 * Turn flow per unit:
 * 1. Check if stunned (skip if true)
 * 2. [Core 2.0] Apply turn_start mechanics
 * 3. AI decides action (ability/attack/move)
 * 4. [Core 2.0] Apply movement/pre_attack mechanics
 * 5. Execute action
 * 6. [Core 2.0] Apply attack/post_attack mechanics
 * 7. [Core 2.0] Apply turn_end mechanics
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
 * @param processor - Optional mechanics processor for Core 2.0 mechanics
 * @returns Complete battle result with events and final states
 * @throws Error if team setups are invalid
 * @example
 * // MVP mode (Core 1.0 behavior, no mechanics)
 * const result = simulateBattle(playerTeam, enemyTeam, 12345);
 * 
 * @example
 * // With Core 2.0 mechanics (roguelike preset)
 * import { createMechanicsProcessor, ROGUELIKE_PRESET } from '@core/mechanics';
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 * const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);
 */
export function simulateBattle(
  playerTeam: TeamSetup,
  enemyTeam: TeamSetup,
  seed: number,
  processor?: MechanicsProcessor
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
  let currentSeed = seed;
  
  // Add battle start event
  allEvents.push({
    round: 0,
    type: 'round_start',
    actorId: 'system',
    metadata: {
      message: 'Battle begins',
      playerUnits: playerUnits.length,
      enemyUnits: enemyUnits.length,
      mechanicsEnabled: processor ? true : false,
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
      // CRITICAL: Must get fresh state because previous turns may have killed this unit
      const currentUnit = battleState.units.find(u => u.instanceId === unit.instanceId);
      
      // Skip if unit not found or dead (killed by another unit earlier in this round)
      if (!currentUnit) continue;
      if (!currentUnit.alive) continue;
      
      // Double-check HP is positive (defensive check)
      if (currentUnit.currentHp <= 0) continue;
      
      // Generate seed for this turn (deterministic based on battle seed, round, and unit)
      const turnSeed = currentSeed + battleState.currentRound * 1000 + hashTeamSetup({ 
        units: [unit], 
        positions: [unit.position] 
      });
      currentSeed = turnSeed + 1;
      
      // Execute unit's turn with ability support and optional mechanics processor
      const turnResult = executeUnitTurnWithAbilities(
        currentUnit as BattleUnitWithAbilities, 
        battleState, 
        turnSeed,
        processor
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
 * @param processor - Optional mechanics processor for Core 2.0 mechanics
 * @returns Battle result
 */
export function simulateBattleLegacy(
  playerUnits: UnitTemplate[],
  playerPositions: Position[],
  enemyUnits: UnitTemplate[],
  enemyPositions: Position[],
  seed: number,
  processor?: MechanicsProcessor
): BattleResult {
  const playerTeam: TeamSetup = {
    units: playerUnits,
    positions: playerPositions,
  };
  
  const enemyTeam: TeamSetup = {
    units: enemyUnits,
    positions: enemyPositions,
  };
  
  return simulateBattle(playerTeam, enemyTeam, seed, processor);
}
