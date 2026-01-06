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
import { createFacingProcessor } from '../core/mechanics/tier0/facing/facing.processor';
import type { FacingDirection } from '../core/mechanics/tier0/facing/facing.types';


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
 * @param state - Game-specific battle state
 * @returns Core battle state compatible with mechanics processor
 */
function toCoreBattleState(state: BattleStateWithAbilities): CoreBattleState<CoreBattleUnit> {
  return {
    units: state.units as unknown as CoreBattleUnit[],
    round: state.currentRound,
    events: state.events,
  };
}

/**
 * Apply core battle state changes back to game-specific state.
 * Merges unit changes from mechanics processor back into game state.
 * 
 * CRITICAL: This function preserves HP and alive status from gameState to prevent
 * the mechanics processor from "undoing" damage or reviving dead units.
 * 
 * HP preservation logic:
 * - Uses Math.min(gameState.currentHp, coreState.currentHp) to ensure damage is never undone
 * - If coreState doesn't have HP info, uses gameState HP
 * 
 * Alive status logic:
 * - Unit is dead if gameState marks it dead (gameUnit.alive === false)
 * - Unit is dead if coreState marks it dead (coreUnit.alive === false)
 * - Unit is dead if effective HP <= 0
 * - All three conditions must be true for unit to be alive
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
function fromCoreBattleState(
  gameState: BattleStateWithAbilities,
  coreState: CoreBattleState<CoreBattleUnit>
): BattleStateWithAbilities {
  // Merge unit changes from core state back to game state
  const updatedUnits = gameState.units.map(gameUnit => {
    const coreUnit = coreState.units.find(u => u.instanceId === gameUnit.instanceId);
    if (coreUnit) {
      // Merge core unit properties back to game unit
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
      
      return {
        ...gameUnit,
        ...coreUnit,
        // Preserve game-specific properties that might not be in core
        abilityCooldowns: gameUnit.abilityCooldowns,
        statusEffects: gameUnit.statusEffects,
        isStunned: gameUnit.isStunned,
        hasTaunt: gameUnit.hasTaunt,
        // Explicitly preserve HP and alive status (don't let coreUnit overwrite incorrectly)
        currentHp: effectiveHp,
        alive: isAlive,
      } as BattleUnitWithAbilities;
    }
    return gameUnit;
  });

  return {
    ...gameState,
    units: updatedUnits,
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
  
  /**
   * Helper to process mechanics phase and collect events.
   * 
   * @param phase - Battle phase to process
   * @param context - Phase context
   */
  const processMechanicsPhase = (
    phase: 'turn_start' | 'movement' | 'pre_attack' | 'attack' | 'post_attack' | 'turn_end',
    context: PhaseContext
  ): void => {
    if (!processor) return;
    
    const coreState = toCoreBattleState(currentState);
    const result: ProcessResult = processor.process(phase, coreState, context);
    currentState = fromCoreBattleState(currentState, result.state);
    
    // Collect mechanics events
    if (result.events && result.events.length > 0) {
      events.push(...result.events);
    }
  };
  
  // Skip turn if unit is stunned
  if (unit.isStunned) {
    return { events: [], state: currentState };
  }
  
  // Skip turn if unit is dead (safety check)
  if (!unit.alive) {
    return { events: [], state: currentState };
  }
  
  // TURN_START phase (Core 2.0)
  processMechanicsPhase('turn_start', {
    activeUnit: unit as unknown as CoreBattleUnit,
    seed: currentSeed++,
  });
  
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
        processMechanicsPhase('pre_attack', {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: action.target as unknown as CoreBattleUnit,
          action: convertToBattleAction(action),
          seed: currentSeed++,
        });
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
            }
          }
        }
      }
      
      // POST_ATTACK phase for abilities (Core 2.0)
      if (action.target) {
        processMechanicsPhase('post_attack', {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: action.target as unknown as CoreBattleUnit,
          seed: currentSeed++,
        });
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
        processMechanicsPhase('pre_attack', {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: currentTarget as unknown as CoreBattleUnit,
          action: convertToBattleAction(action),
          seed: currentSeed++,
        });
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
        // ─────────────────────────────────────────────────────────────
        // FACING UPDATE: Rotate attacker to face target before attack
        // ─────────────────────────────────────────────────────────────
        if (processor?.config.facing) {
          const facingProcessor = createFacingProcessor();
          const unitWithFacing = unit as BattleUnitWithAbilities & { facing?: FacingDirection };
          const previousFacing = unitWithFacing.facing ?? 'N';
          
          // Calculate new facing direction toward target
          const updatedUnit = facingProcessor.faceTarget(
            { ...unit, facing: previousFacing },
            currentTarget.position
          );
          const newFacing = updatedUnit.facing as FacingDirection;
          
          // Only generate event if facing actually changed
          if (newFacing !== previousFacing) {
            // Update unit's facing in state
            const unitIndex = currentState.units.findIndex(u => u.instanceId === unit.instanceId);
            if (unitIndex >= 0) {
              currentState.units[unitIndex] = {
                ...currentState.units[unitIndex],
                facing: newFacing,
              } as BattleUnitWithAbilities;
              // Also update local unit reference for combat modifiers calculation
              unit = currentState.units[unitIndex];
            }
            
            // Generate facing change event
            const facingEvent: BattleEvent = {
              type: 'mechanic_facing',
              round: currentState.currentRound,
              actorId: unit.instanceId,
              targetId: unit.instanceId,
              metadata: {
                previousFacing,
                newFacing,
                reason: 'attack',
              },
            };
            events.push(facingEvent);
          }
        }
        
        // Calculate combat modifiers from enabled mechanics
        // This includes flanking, charge momentum, etc.
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
              
              // Apply resolve damage from flanking/rear attacks (Core 2.0)
              if (combatModifiers.resolveDamage > 0 && processor?.config.resolve) {
                const targetWithResolve = currentTarget as BattleUnitWithAbilities & { resolve?: number; maxResolve?: number };
                const currentResolve = targetWithResolve.resolve ?? 100;
                const newResolve = Math.max(0, currentResolve - combatModifiers.resolveDamage);
                
                // Update target's resolve in state
                const targetIndex = currentState.units.findIndex(u => u.instanceId === currentTarget?.instanceId);
                if (targetIndex >= 0) {
                  currentState.units[targetIndex] = {
                    ...currentState.units[targetIndex],
                    resolve: newResolve,
                  } as BattleUnitWithAbilities;
                }
                
                // Generate resolve event
                const resolveEvent: BattleEvent = {
                  type: 'mechanic_resolve',
                  round: currentState.currentRound,
                  actorId: unit.instanceId,
                  targetId: currentTarget.instanceId,
                  metadata: {
                    resolveDamage: combatModifiers.resolveDamage,
                    previousResolve: currentResolve,
                    newResolve,
                    source: combatModifiers.attackArc,
                  },
                };
                events.push(resolveEvent);
                // Note: resolve event doesn't need to be in attackEvents as it's already applied above
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
                // State already has alive=false from applyBattleEvents damage handling
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
        processMechanicsPhase('attack', {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: currentTarget as unknown as CoreBattleUnit,
          action: convertToBattleAction(action),
          seed: currentSeed++,
        });
      }
      
      // POST_ATTACK phase (Core 2.0)
      if (currentTarget) {
        processMechanicsPhase('post_attack', {
          activeUnit: unit as unknown as CoreBattleUnit,
          target: currentTarget as unknown as CoreBattleUnit,
          seed: currentSeed++,
        });
      }
      break;
    }
    
    case 'move':
    default: {
      // MOVEMENT phase (Core 2.0)
      processMechanicsPhase('movement', {
        activeUnit: unit as unknown as CoreBattleUnit,
        action: convertToBattleAction(action),
        seed: currentSeed++,
      });
      
      // Use legacy turn execution for movement
      const turnEvents = executeTurn(unit, currentState, seed);
      
      if (turnEvents.length > 0) {
        currentState = applyBattleEvents(currentState, turnEvents) as BattleStateWithAbilities;
        events.push(...turnEvents);
      }
      break;
    }
  }
  
  // TURN_END phase (Core 2.0)
  processMechanicsPhase('turn_end', {
    activeUnit: unit as unknown as CoreBattleUnit,
    seed: currentSeed++,
  });
  
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
