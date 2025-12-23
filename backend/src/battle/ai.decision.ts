/**
 * AI Decision Making System for Fantasy Autobattler.
 * Determines optimal actions for units during battle based on role and situation.
 * 
 * @fileoverview Pure functions for AI decision making during battle.
 * All functions are deterministic for consistent replay behavior.
 * Uses unit ID for tiebreaking when priorities are equal.
 */

import { BattleUnit, Position } from '../types/game.types';
import { Ability, isActiveAbility, ActiveAbility } from '../types/ability.types';
import { BattleState } from './actions';
import { BattleUnitWithAbilities } from './ability.executor';
import { canUseAbility, getValidTargets } from './ability.executor';
import { getUnitAbility } from '../abilities/ability.data';
import { manhattanDistance } from './grid';

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Type of action a unit can take during their turn.
 */
export type ActionType = 'attack' | 'ability' | 'move';

/**
 * Represents a decision made by the AI for a unit's turn.
 * Contains all information needed to execute the action.
 */
export interface UnitAction {
  /** Type of action to perform */
  type: ActionType;
  /** Target unit for attack/ability (if applicable) */
  target?: BattleUnit;
  /** Target position for movement/AoE (if applicable) */
  targetPosition?: Position;
  /** Ability ID to use (for ability actions) */
  abilityId?: string;
  /** Priority score for this action (higher = better) */
  priority: number;
  /** Reason for choosing this action (for debugging) */
  reason: string;
}

/**
 * Context for evaluating potential actions.
 * Contains pre-computed information about the battlefield.
 */
interface DecisionContext {
  /** All living allied units */
  allies: BattleUnit[];
  /** All living enemy units */
  enemies: BattleUnit[];
  /** Allies with HP below 50% */
  woundedAllies: BattleUnit[];
  /** Enemies within attack range */
  enemiesInRange: BattleUnit[];
  /** Unit's available ability (if any) */
  ability: Ability | undefined;
  /** Whether ability is ready to use */
  abilityReady: boolean;
}


// =============================================================================
// PRIORITY CONSTANTS
// =============================================================================

/**
 * Priority values for different action types.
 * Higher values indicate more important actions.
 */
const ACTION_PRIORITIES = {
  /** Emergency healing for critically wounded ally */
  CRITICAL_HEAL: 100,
  /** Using taunt when allies are threatened */
  DEFENSIVE_TAUNT: 90,
  /** AoE ability hitting multiple enemies */
  AOE_MULTI_TARGET: 85,
  /** Execute ability on low HP target */
  EXECUTE_FINISH: 80,
  /** Standard healing for wounded ally */
  STANDARD_HEAL: 75,
  /** Buff ability on allies */
  BUFF_ALLIES: 70,
  /** Damage ability on enemy */
  DAMAGE_ABILITY: 65,
  /** Stun/CC ability on enemy */
  CONTROL_ABILITY: 60,
  /** Basic attack on enemy */
  BASIC_ATTACK: 50,
  /** Movement towards enemy */
  MOVE_TO_ENEMY: 30,
  /** No valid action available */
  NO_ACTION: 0,
} as const;

/**
 * HP threshold percentages for decision making.
 */
const HP_THRESHOLDS = {
  /** Critical HP - needs immediate healing */
  CRITICAL: 0.25,
  /** Wounded - should be healed when possible */
  WOUNDED: 0.5,
  /** Low HP for execute abilities */
  EXECUTE_TARGET: 0.3,
} as const;

/**
 * Minimum enemies for AoE to be worthwhile.
 */
const AOE_MIN_TARGETS = 2;

// =============================================================================
// CONTEXT BUILDING
// =============================================================================

/**
 * Build decision context with pre-computed battlefield information.
 * 
 * @param unit - Unit making the decision
 * @param state - Current battle state
 * @returns Decision context with computed values
 */
function buildDecisionContext(
  unit: BattleUnitWithAbilities,
  state: BattleState
): DecisionContext {
  const allies = state.units.filter(u => u.alive && u.team === unit.team);
  const enemies = state.units.filter(u => u.alive && u.team !== unit.team);
  
  const woundedAllies = allies.filter(
    ally => ally.currentHp / ally.maxHp < HP_THRESHOLDS.WOUNDED
  );
  
  const enemiesInRange = enemies.filter(
    enemy => manhattanDistance(unit.position, enemy.position) <= unit.range
  );
  
  const ability = getUnitAbility(unit.id);
  
  // Only consider ability ready if it's an ACTIVE ability and can be used
  // Passive abilities trigger automatically and should not be used as actions
  const abilityReady = ability !== undefined && 
    isActiveAbility(ability) && 
    canUseAbility(unit, ability, state);
  
  return {
    allies,
    enemies,
    woundedAllies,
    enemiesInRange,
    ability,
    abilityReady,
  };
}

// =============================================================================
// ROLE-SPECIFIC DECISION FUNCTIONS
// =============================================================================

/**
 * Decide action for support units (Priest, Bard).
 * Priority: heal wounded allies > buff allies > attack.
 * 
 * @param unit - Support unit making decision
 * @param state - Current battle state
 * @param context - Pre-computed decision context
 * @returns Best action for support unit
 */
function decideSupportAction(
  unit: BattleUnitWithAbilities,
  _state: BattleState,
  context: DecisionContext
): UnitAction {
  const { woundedAllies, ability, abilityReady } = context;
  
  // Priority 1: Heal critically wounded allies
  if (abilityReady && ability && hasHealEffect(ability)) {
    const criticalAllies = woundedAllies.filter(
      ally => ally.currentHp / ally.maxHp < HP_THRESHOLDS.CRITICAL
    );
    
    if (criticalAllies.length > 0) {
      const healTarget = selectLowestHpUnit(criticalAllies);
      if (healTarget) {
        return {
          type: 'ability',
          target: healTarget,
          abilityId: ability.id,
          priority: ACTION_PRIORITIES.CRITICAL_HEAL,
          reason: `Critical heal for ${healTarget.id} at ${Math.round((healTarget.currentHp / healTarget.maxHp) * 100)}% HP`,
        };
      }
    }
    
    // Priority 2: Heal wounded allies
    if (woundedAllies.length > 0) {
      const healTarget = selectLowestHpUnit(woundedAllies);
      if (healTarget) {
        return {
          type: 'ability',
          target: healTarget,
          abilityId: ability.id,
          priority: ACTION_PRIORITIES.STANDARD_HEAL,
          reason: `Healing ${healTarget.id} at ${Math.round((healTarget.currentHp / healTarget.maxHp) * 100)}% HP`,
        };
      }
    }
  }
  
  // Priority 3: Buff allies (Bard's Inspire)
  if (abilityReady && ability && hasBuffEffect(ability)) {
    return {
      type: 'ability',
      abilityId: ability.id,
      priority: ACTION_PRIORITIES.BUFF_ALLIES,
      reason: 'Buffing allies with ability',
    };
  }
  
  // Fallback: Basic attack
  return decideBasicAttack(unit, context);
}


/**
 * Decide action for tank units (Knight, Guardian, Berserker).
 * Priority: use taunt > move to enemies > attack.
 * 
 * @param unit - Tank unit making decision
 * @param state - Current battle state
 * @param context - Pre-computed decision context
 * @returns Best action for tank unit
 */
function decideTankAction(
  unit: BattleUnitWithAbilities,
  _state: BattleState,
  context: DecisionContext
): UnitAction {
  const { enemies, ability, abilityReady } = context;
  
  // Priority 1: Use Taunt if available and enemies are threatening allies
  if (abilityReady && ability && hasTauntEffect(ability)) {
    return {
      type: 'ability',
      abilityId: ability.id,
      priority: ACTION_PRIORITIES.DEFENSIVE_TAUNT,
      reason: 'Using Taunt to protect allies',
    };
  }
  
  // Priority 2: Use defensive buff (Shield Wall)
  if (abilityReady && ability && hasBuffEffect(ability) && ability.targetType === 'self') {
    return {
      type: 'ability',
      abilityId: ability.id,
      priority: ACTION_PRIORITIES.BUFF_ALLIES,
      reason: 'Using defensive buff',
    };
  }
  
  // Priority 3: Attack if in range
  const attackAction = decideBasicAttack(unit, context);
  if (attackAction.type === 'attack') {
    return attackAction;
  }
  
  // Priority 4: Move towards nearest enemy
  if (enemies.length > 0) {
    const nearestEnemy = selectNearestUnit(unit, enemies);
    if (nearestEnemy) {
      return {
        type: 'move',
        target: nearestEnemy,
        targetPosition: nearestEnemy.position,
        priority: ACTION_PRIORITIES.MOVE_TO_ENEMY,
        reason: `Moving towards ${nearestEnemy.id}`,
      };
    }
  }
  
  return createNoAction('No valid tank action');
}

/**
 * Decide action for DPS units (Rogue, Duelist, Assassin, Archer, Crossbowman, Hunter).
 * Priority: execute low HP targets > use damage ability > attack weakest.
 * 
 * @param unit - DPS unit making decision
 * @param state - Current battle state
 * @param context - Pre-computed decision context
 * @returns Best action for DPS unit
 */
function decideDpsAction(
  unit: BattleUnitWithAbilities,
  state: BattleState,
  context: DecisionContext
): UnitAction {
  const { enemies, enemiesInRange, ability, abilityReady } = context;
  
  // Find low HP enemies for execute
  const lowHpEnemies = enemies.filter(
    enemy => enemy.currentHp / enemy.maxHp < HP_THRESHOLDS.EXECUTE_TARGET
  );
  
  // Priority 1: Execute low HP target if ability available
  if (abilityReady && ability && hasDamageEffect(ability) && lowHpEnemies.length > 0) {
    const executeTarget = selectLowestHpUnit(lowHpEnemies);
    if (executeTarget) {
      const validTargets = getValidTargets(unit, ability, state);
      if (validTargets.some(t => t.instanceId === executeTarget.instanceId)) {
        return {
          type: 'ability',
          target: executeTarget,
          abilityId: ability.id,
          priority: ACTION_PRIORITIES.EXECUTE_FINISH,
          reason: `Executing ${executeTarget.id} at ${Math.round((executeTarget.currentHp / executeTarget.maxHp) * 100)}% HP`,
        };
      }
    }
  }
  
  // Priority 2: Use damage ability on any valid target
  if (abilityReady && ability && hasDamageEffect(ability)) {
    const validTargets = getValidTargets(unit, ability, state);
    if (validTargets.length > 0) {
      const target = selectWeakestUnit(validTargets);
      if (target) {
        return {
          type: 'ability',
          target,
          abilityId: ability.id,
          priority: ACTION_PRIORITIES.DAMAGE_ABILITY,
          reason: `Using damage ability on ${target.id}`,
        };
      }
    }
  }
  
  // Priority 3: Attack weakest enemy in range
  if (enemiesInRange.length > 0) {
    const weakestTarget = selectWeakestUnit(enemiesInRange);
    if (weakestTarget) {
      return {
        type: 'attack',
        target: weakestTarget,
        priority: ACTION_PRIORITIES.BASIC_ATTACK,
        reason: `Attacking weakest enemy ${weakestTarget.id}`,
      };
    }
  }
  
  // Priority 4: Move towards weakest enemy
  if (enemies.length > 0) {
    const weakestEnemy = selectWeakestUnit(enemies);
    if (weakestEnemy) {
      return {
        type: 'move',
        target: weakestEnemy,
        targetPosition: weakestEnemy.position,
        priority: ACTION_PRIORITIES.MOVE_TO_ENEMY,
        reason: `Moving towards weakest enemy ${weakestEnemy.id}`,
      };
    }
  }
  
  return createNoAction('No valid DPS action');
}


/**
 * Decide action for mage units (Mage, Warlock, Elementalist).
 * Priority: AoE if 2+ enemies clustered > single target damage > attack.
 * 
 * @param unit - Mage unit making decision
 * @param state - Current battle state
 * @param context - Pre-computed decision context
 * @returns Best action for mage unit
 */
function decideMageAction(
  unit: BattleUnitWithAbilities,
  state: BattleState,
  context: DecisionContext
): UnitAction {
  const { enemies, ability, abilityReady } = context;
  
  // Priority 1: Use AoE ability if 2+ enemies are clustered
  if (abilityReady && ability && isActiveAbility(ability) && isAoEAbility(ability)) {
    const aoeTargets = findBestAoETarget(unit, enemies, ability);
    if (aoeTargets.count >= AOE_MIN_TARGETS) {
      return {
        type: 'ability',
        targetPosition: aoeTargets.position,
        abilityId: ability.id,
        priority: ACTION_PRIORITIES.AOE_MULTI_TARGET,
        reason: `AoE ability hitting ${aoeTargets.count} enemies`,
      };
    }
  }
  
  // Priority 2: Use damage ability on single target
  if (abilityReady && ability && hasDamageEffect(ability)) {
    const validTargets = getValidTargets(unit, ability, state);
    if (validTargets.length > 0) {
      // Prefer lowest HP target for finishing
      const target = selectLowestHpUnit(validTargets);
      if (target) {
        return {
          type: 'ability',
          target,
          abilityId: ability.id,
          priority: ACTION_PRIORITIES.DAMAGE_ABILITY,
          reason: `Using magic ability on ${target.id}`,
        };
      }
    }
  }
  
  // Priority 3: Basic attack
  return decideBasicAttack(unit, context);
}

/**
 * Decide action for control units (Enchanter).
 * Priority: stun high-threat target > damage > attack.
 * 
 * @param unit - Control unit making decision
 * @param state - Current battle state
 * @param context - Pre-computed decision context
 * @returns Best action for control unit
 */
function decideControlAction(
  unit: BattleUnitWithAbilities,
  state: BattleState,
  context: DecisionContext
): UnitAction {
  const { ability, abilityReady } = context;
  
  // Priority 1: Use stun on highest threat enemy
  if (abilityReady && ability && hasStunEffect(ability)) {
    const validTargets = getValidTargets(unit, ability, state);
    if (validTargets.length > 0) {
      // Target highest ATK enemy (most threatening)
      const highestThreat = selectHighestThreatUnit(validTargets);
      if (highestThreat) {
        return {
          type: 'ability',
          target: highestThreat,
          abilityId: ability.id,
          priority: ACTION_PRIORITIES.CONTROL_ABILITY,
          reason: `Stunning high-threat target ${highestThreat.id}`,
        };
      }
    }
  }
  
  // Fallback: Basic attack
  return decideBasicAttack(unit, context);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Decide basic attack action.
 * 
 * @param unit - Unit making decision
 * @param context - Decision context
 * @returns Attack action or move action
 */
function decideBasicAttack(
  unit: BattleUnitWithAbilities,
  context: DecisionContext
): UnitAction {
  const { enemies, enemiesInRange } = context;
  
  if (enemiesInRange.length > 0) {
    const target = selectNearestUnit(unit, enemiesInRange);
    if (target) {
      return {
        type: 'attack',
        target,
        priority: ACTION_PRIORITIES.BASIC_ATTACK,
        reason: `Basic attack on ${target.id}`,
      };
    }
  }
  
  // Move towards nearest enemy
  if (enemies.length > 0) {
    const nearestEnemy = selectNearestUnit(unit, enemies);
    if (nearestEnemy) {
      return {
        type: 'move',
        target: nearestEnemy,
        targetPosition: nearestEnemy.position,
        priority: ACTION_PRIORITIES.MOVE_TO_ENEMY,
        reason: `Moving towards ${nearestEnemy.id}`,
      };
    }
  }
  
  return createNoAction('No enemies available');
}

/**
 * Create a no-action result.
 * 
 * @param reason - Reason for no action
 * @returns No-action result
 */
function createNoAction(reason: string): UnitAction {
  return {
    type: 'move',
    priority: ACTION_PRIORITIES.NO_ACTION,
    reason,
  };
}


// =============================================================================
// UNIT SELECTION HELPERS (Deterministic)
// =============================================================================

/**
 * Select unit with lowest HP from array.
 * Uses ID for deterministic tiebreaking.
 * 
 * @param units - Units to select from
 * @returns Unit with lowest HP, or undefined if empty
 */
function selectLowestHpUnit(units: BattleUnit[]): BattleUnit | undefined {
  if (units.length === 0) return undefined;
  
  return units.reduce((lowest, current) => {
    const lowestHpPercent = lowest.currentHp / lowest.maxHp;
    const currentHpPercent = current.currentHp / current.maxHp;
    
    // Lower HP wins, ID tiebreaker
    if (currentHpPercent < lowestHpPercent) return current;
    if (currentHpPercent === lowestHpPercent && current.id < lowest.id) return current;
    return lowest;
  });
}

/**
 * Select unit with lowest absolute HP (weakest).
 * Uses ID for deterministic tiebreaking.
 * 
 * @param units - Units to select from
 * @returns Weakest unit, or undefined if empty
 */
function selectWeakestUnit(units: BattleUnit[]): BattleUnit | undefined {
  if (units.length === 0) return undefined;
  
  return units.reduce((weakest, current) => {
    if (current.currentHp < weakest.currentHp) return current;
    if (current.currentHp === weakest.currentHp && current.id < weakest.id) return current;
    return weakest;
  });
}

/**
 * Select nearest unit using Manhattan distance.
 * Uses ID for deterministic tiebreaking.
 * 
 * @param fromUnit - Reference unit for distance calculation
 * @param units - Units to select from
 * @returns Nearest unit, or undefined if empty
 */
function selectNearestUnit(fromUnit: BattleUnit, units: BattleUnit[]): BattleUnit | undefined {
  if (units.length === 0) return undefined;
  
  return units.reduce((nearest, current) => {
    const nearestDist = manhattanDistance(fromUnit.position, nearest.position);
    const currentDist = manhattanDistance(fromUnit.position, current.position);
    
    if (currentDist < nearestDist) return current;
    if (currentDist === nearestDist && current.id < nearest.id) return current;
    return nearest;
  });
}

/**
 * Select unit with highest threat (ATK stat).
 * Uses ID for deterministic tiebreaking.
 * 
 * @param units - Units to select from
 * @returns Highest threat unit, or undefined if empty
 */
function selectHighestThreatUnit(units: BattleUnit[]): BattleUnit | undefined {
  if (units.length === 0) return undefined;
  
  return units.reduce((highest, current) => {
    if (current.stats.atk > highest.stats.atk) return current;
    if (current.stats.atk === highest.stats.atk && current.id < highest.id) return current;
    return highest;
  });
}

// =============================================================================
// ABILITY EFFECT CHECKERS
// =============================================================================

/**
 * Check if ability has heal effect.
 */
function hasHealEffect(ability: Ability): boolean {
  return ability.effects.some(e => e.type === 'heal' || e.type === 'hot');
}

/**
 * Check if ability has buff effect.
 */
function hasBuffEffect(ability: Ability): boolean {
  return ability.effects.some(e => e.type === 'buff');
}

/**
 * Check if ability has damage effect.
 */
function hasDamageEffect(ability: Ability): boolean {
  return ability.effects.some(e => e.type === 'damage' || e.type === 'dot');
}

/**
 * Check if ability has stun effect.
 */
function hasStunEffect(ability: Ability): boolean {
  return ability.effects.some(e => e.type === 'stun');
}

/**
 * Check if ability has taunt effect.
 */
function hasTauntEffect(ability: Ability): boolean {
  return ability.effects.some(e => e.type === 'taunt');
}

/**
 * Check if ability is AoE (area of effect).
 */
function isAoEAbility(ability: ActiveAbility): boolean {
  return ability.targetType === 'area' || 
         ability.targetType === 'all_enemies' ||
         (ability.areaSize !== undefined && ability.areaSize > 0);
}

// =============================================================================
// AOE TARGET FINDING
// =============================================================================

/**
 * Result of AoE target search.
 */
interface AoETargetResult {
  /** Best position to target */
  position: Position;
  /** Number of enemies that would be hit */
  count: number;
}

/**
 * Find best position for AoE ability to hit maximum enemies.
 * 
 * @param caster - Unit casting the ability
 * @param enemies - Potential enemy targets
 * @param ability - AoE ability being used
 * @returns Best target position and enemy count
 */
function findBestAoETarget(
  caster: BattleUnit,
  enemies: BattleUnit[],
  ability: ActiveAbility
): AoETargetResult {
  const areaSize = ability.areaSize ?? 1;
  let bestPosition: Position = { x: 0, y: 0 };
  let maxCount = 0;
  
  // Check each enemy position as potential AoE center
  for (const enemy of enemies) {
    // Check if enemy is within ability range
    if (ability.range !== -1 && manhattanDistance(caster.position, enemy.position) > ability.range) {
      continue;
    }
    
    // Count enemies within AoE radius of this position
    let count = 0;
    for (const target of enemies) {
      if (manhattanDistance(enemy.position, target.position) <= areaSize) {
        count++;
      }
    }
    
    // Update best if more targets, or same targets but lower position (deterministic)
    if (count > maxCount || 
        (count === maxCount && 
         (enemy.position.y < bestPosition.y || 
          (enemy.position.y === bestPosition.y && enemy.position.x < bestPosition.x)))) {
      maxCount = count;
      bestPosition = enemy.position;
    }
  }
  
  return { position: bestPosition, count: maxCount };
}


// =============================================================================
// MAIN DECISION FUNCTION
// =============================================================================

/**
 * Decide the best action for a unit based on role and battlefield state.
 * Uses role-specific logic to determine optimal action.
 * All decisions are deterministic - same inputs produce same outputs.
 * 
 * @param unit - Unit making the decision
 * @param state - Current battle state
 * @returns Best action for the unit to take
 * @example
 * const action = decideAction(priest, battleState);
 * if (action.type === 'ability') {
 *   executeAbility(priest, action.abilityId, action.target);
 * }
 */
export function decideAction(
  unit: BattleUnitWithAbilities,
  state: BattleState
): UnitAction {
  // Dead or stunned units cannot act
  if (!unit.alive) {
    return createNoAction('Unit is dead');
  }
  
  if (unit.isStunned) {
    return createNoAction('Unit is stunned');
  }
  
  // Build decision context
  const context = buildDecisionContext(unit, state);
  
  // No enemies = no action needed
  if (context.enemies.length === 0) {
    return createNoAction('No enemies remaining');
  }
  
  // Route to role-specific decision function
  switch (unit.role) {
    case 'support':
      return decideSupportAction(unit, state, context);
      
    case 'tank':
      return decideTankAction(unit, state, context);
      
    case 'melee_dps':
    case 'ranged_dps':
      return decideDpsAction(unit, state, context);
      
    case 'mage':
      return decideMageAction(unit, state, context);
      
    case 'control':
      return decideControlAction(unit, state, context);
      
    default:
      // Unknown role - use basic attack logic
      return decideBasicAttack(unit, context);
  }
}

/**
 * Evaluate multiple potential actions and return the best one.
 * Useful for comparing different strategies.
 * 
 * @param actions - Array of potential actions
 * @returns Action with highest priority
 * @example
 * const actions = [attackAction, abilityAction, moveAction];
 * const best = selectBestAction(actions);
 */
export function selectBestAction(actions: UnitAction[]): UnitAction {
  if (actions.length === 0) {
    return createNoAction('No actions to evaluate');
  }
  
  return actions.reduce((best, current) => {
    if (current.priority > best.priority) return current;
    // Deterministic tiebreaker: prefer attack > ability > move
    if (current.priority === best.priority) {
      const typeOrder: Record<ActionType, number> = { attack: 3, ability: 2, move: 1 };
      if (typeOrder[current.type] > typeOrder[best.type]) return current;
    }
    return best;
  });
}

/**
 * Check if unit should use ability this turn.
 * Quick check without full decision logic.
 * 
 * @param unit - Unit to check
 * @param state - Current battle state
 * @returns True if unit should prioritize ability use
 * @example
 * if (shouldUseAbility(mage, state)) {
 *   const action = decideAction(mage, state);
 * }
 */
export function shouldUseAbility(
  unit: BattleUnitWithAbilities,
  state: BattleState
): boolean {
  const ability = getUnitAbility(unit.id);
  if (!ability) return false;
  
  return canUseAbility(unit, ability, state);
}

/**
 * Get action priority for a specific action type.
 * Useful for external systems to understand AI priorities.
 * 
 * @param actionType - Type of action
 * @param context - Optional context for priority adjustment
 * @returns Priority value for the action type
 */
export function getActionPriority(
  actionType: keyof typeof ACTION_PRIORITIES
): number {
  return ACTION_PRIORITIES[actionType];
}
