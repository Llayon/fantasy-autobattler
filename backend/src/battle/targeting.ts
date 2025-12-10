/**
 * Target selection system for Fantasy Autobattler AI.
 * Provides various targeting strategies with deterministic tiebreaking for consistent AI behavior.
 * 
 * @fileoverview Target selection implementation with distance-based, health-based,
 * and threat-based targeting strategies. All functions use deterministic tiebreaking.
 */

import { BattleUnit } from '../types/game.types';
import { manhattanDistance } from './grid';

// =============================================================================
// TARGET SELECTION TYPES
// =============================================================================

/**
 * Available targeting strategies for AI units.
 */
export type TargetStrategy = 'nearest' | 'weakest' | 'highest_threat';

/**
 * Target selection result with metadata.
 */
export interface TargetSelectionResult {
  /** Selected target unit, null if no valid target */
  target: BattleUnit | null;
  /** Strategy used for selection */
  strategy: TargetStrategy;
  /** Distance to target (for nearest strategy) */
  distance: number | undefined;
  /** Reason for selection or failure */
  reason: string;
}

// =============================================================================
// CORE TARGETING FUNCTIONS
// =============================================================================

/**
 * Find the nearest enemy unit using Manhattan distance.
 * Uses deterministic tiebreaking by ID when distances are equal.
 * 
 * @param unit - The unit looking for a target
 * @param enemies - Array of potential enemy targets
 * @returns Nearest living enemy or null if none available
 * @example
 * const attacker = { position: { x: 2, y: 3 } };
 * const enemies = [enemy1, enemy2, enemy3];
 * const nearest = findNearestEnemy(attacker, enemies);
 * if (nearest) {
 *   console.log(`Targeting nearest enemy: ${nearest.id}`);
 * }
 */
export function findNearestEnemy(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  const livingEnemies = enemies.filter(enemy => enemy.alive);
  
  if (livingEnemies.length === 0) {
    return null;
  }
  
  let nearestEnemy: BattleUnit | null = null;
  let shortestDistance = Infinity;
  
  for (const enemy of livingEnemies) {
    const distance = manhattanDistance(unit.position, enemy.position);
    
    // Check if this enemy is closer, or same distance but better ID (deterministic tiebreaker)
    if (distance < shortestDistance || 
        (distance === shortestDistance && 
         (!nearestEnemy || enemy.id.localeCompare(nearestEnemy.id) < 0))) {
      nearestEnemy = enemy;
      shortestDistance = distance;
    }
  }
  
  return nearestEnemy;
}

/**
 * Find the enemy with the lowest current HP.
 * Uses deterministic tiebreaking by ID when HP values are equal.
 * 
 * @param enemies - Array of potential enemy targets
 * @returns Enemy with lowest HP or null if none available
 * @example
 * const enemies = [
 *   { currentHp: 25, id: 'warrior' },
 *   { currentHp: 10, id: 'mage' },
 *   { currentHp: 50, id: 'archer' }
 * ];
 * const weakest = findWeakestEnemy(enemies);
 * // Returns: mage (lowest HP: 10)
 */
export function findWeakestEnemy(enemies: BattleUnit[]): BattleUnit | null {
  const livingEnemies = enemies.filter(enemy => enemy.alive);
  
  if (livingEnemies.length === 0) {
    return null;
  }
  
  let weakestEnemy: BattleUnit | null = null;
  let lowestHp = Infinity;
  
  for (const enemy of livingEnemies) {
    // Check if this enemy has lower HP, or same HP but better ID (deterministic tiebreaker)
    if (enemy.currentHp < lowestHp || 
        (enemy.currentHp === lowestHp && 
         (!weakestEnemy || enemy.id.localeCompare(weakestEnemy.id) < 0))) {
      weakestEnemy = enemy;
      lowestHp = enemy.currentHp;
    }
  }
  
  return weakestEnemy;
}

/**
 * Find enemy with Taunt ability that forces targeting.
 * Taunt forces all enemies to target the taunting unit if possible.
 * Uses deterministic tiebreaking by ID when multiple units have Taunt.
 * 
 * @param unit - The unit looking for a target (unused but kept for API consistency)
 * @param enemies - Array of potential enemy targets
 * @returns Enemy with Taunt ability or null if none have Taunt
 * @example
 * const enemies = [
 *   { abilities: [{ id: 'taunt' }], id: 'guardian' },
 *   { abilities: [], id: 'mage' }
 * ];
 * const taunter = findTauntTarget(attacker, enemies);
 * // Returns: guardian (has Taunt ability)
 */
export function findTauntTarget(_unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  const livingEnemies = enemies.filter(enemy => enemy.alive);
  
  // Find all enemies with Taunt ability
  const tauntingEnemies = livingEnemies.filter(enemy => 
    enemy.abilities.includes('taunt')
  );
  
  if (tauntingEnemies.length === 0) {
    return null;
  }
  
  // If multiple enemies have Taunt, use deterministic tiebreaker (alphabetical ID)
  return tauntingEnemies.reduce((best, current) => 
    current.id.localeCompare(best.id) < 0 ? current : best
  );
}

/**
 * Calculate threat level of an enemy unit.
 * Threat is based on damage potential, survivability, and positioning.
 * 
 * @param enemy - Enemy unit to evaluate
 * @param attacker - Unit evaluating the threat (for distance calculation)
 * @returns Numerical threat score (higher = more threatening)
 * @example
 * const threat = calculateThreatLevel(enemy, attacker);
 * // Higher values indicate more dangerous enemies
 */
export function calculateThreatLevel(enemy: BattleUnit, attacker: BattleUnit): number {
  if (!enemy.alive) {
    return 0;
  }
  
  // Base threat from damage potential
  const damageScore = enemy.stats.atk * enemy.stats.atkCount;
  
  // Survivability factor (lower HP = higher threat priority for finishing off)
  const hpRatio = enemy.currentHp / enemy.maxHp;
  const survivabilityScore = (1 - hpRatio) * 50; // Bonus for low HP enemies
  
  // Distance factor (closer enemies are more threatening)
  const distance = manhattanDistance(attacker.position, enemy.position);
  const proximityScore = Math.max(0, 10 - distance); // Closer = higher score
  
  // Role-based threat modifiers
  let roleModifier = 1.0;
  switch (enemy.role) {
    case 'mage':
      roleModifier = 1.3; // Mages are high priority (magic damage ignores armor)
      break;
    case 'support':
      roleModifier = 1.2; // Support units enable others
      break;
    case 'ranged_dps':
      roleModifier = 1.1; // Ranged DPS can attack from safety
      break;
    case 'tank':
      roleModifier = 0.8; // Tanks are lower priority (high HP, low damage)
      break;
    default:
      roleModifier = 1.0;
  }
  
  return (damageScore + survivabilityScore + proximityScore) * roleModifier;
}

/**
 * Find the enemy with the highest threat level.
 * Uses deterministic tiebreaking by ID when threat levels are equal.
 * 
 * @param unit - The unit evaluating threats
 * @param enemies - Array of potential enemy targets
 * @returns Enemy with highest threat or null if none available
 * @example
 * const enemies = [lowThreatTank, highThreatMage, mediumThreatArcher];
 * const target = findHighestThreatEnemy(attacker, enemies);
 * // Returns: highThreatMage (highest calculated threat)
 */
export function findHighestThreatEnemy(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  const livingEnemies = enemies.filter(enemy => enemy.alive);
  
  if (livingEnemies.length === 0) {
    return null;
  }
  
  let highestThreatEnemy: BattleUnit | null = null;
  let highestThreat = -1;
  
  for (const enemy of livingEnemies) {
    const threat = calculateThreatLevel(enemy, unit);
    
    // Check if this enemy has higher threat, or same threat but better ID (deterministic tiebreaker)
    if (threat > highestThreat || 
        (threat === highestThreat && 
         (!highestThreatEnemy || enemy.id.localeCompare(highestThreatEnemy.id) < 0))) {
      highestThreatEnemy = enemy;
      highestThreat = threat;
    }
  }
  
  return highestThreatEnemy;
}

// =============================================================================
// MAIN TARGET SELECTION FUNCTION
// =============================================================================

/**
 * Select target using specified strategy with fallback logic.
 * Implements priority system: Taunt > Strategy > Fallback to nearest.
 * 
 * @param unit - The unit selecting a target
 * @param enemies - Array of potential enemy targets
 * @param strategy - Targeting strategy to use
 * @returns Selected target or null if no valid targets
 * @example
 * const target = selectTarget(warrior, enemies, 'weakest');
 * if (target) {
 *   // Attack the selected target
 *   performAttack(warrior, target);
 * }
 */
export function selectTarget(
  unit: BattleUnit, 
  enemies: BattleUnit[], 
  strategy: TargetStrategy
): BattleUnit | null {
  // Priority 1: Check for Taunt (overrides all other strategies)
  const tauntTarget = findTauntTarget(unit, enemies);
  if (tauntTarget) {
    return tauntTarget;
  }
  
  // Priority 2: Use specified strategy
  let target: BattleUnit | null = null;
  
  switch (strategy) {
    case 'nearest':
      target = findNearestEnemy(unit, enemies);
      break;
    case 'weakest':
      target = findWeakestEnemy(enemies);
      break;
    case 'highest_threat':
      target = findHighestThreatEnemy(unit, enemies);
      break;
    default:
      // Fallback to nearest if unknown strategy
      target = findNearestEnemy(unit, enemies);
  }
  
  // Priority 3: Fallback to nearest if strategy failed
  if (!target) {
    target = findNearestEnemy(unit, enemies);
  }
  
  return target;
}

/**
 * Select target with detailed result information.
 * Provides comprehensive information about target selection process.
 * 
 * @param unit - The unit selecting a target
 * @param enemies - Array of potential enemy targets
 * @param strategy - Targeting strategy to use
 * @returns Detailed target selection result
 * @example
 * const result = selectTargetWithDetails(warrior, enemies, 'weakest');
 * console.log(`Selected ${result.target?.id} using ${result.strategy}: ${result.reason}`);
 */
export function selectTargetWithDetails(
  unit: BattleUnit, 
  enemies: BattleUnit[], 
  strategy: TargetStrategy
): TargetSelectionResult {
  const livingEnemies = enemies.filter(enemy => enemy.alive);
  
  if (livingEnemies.length === 0) {
    return {
      target: null,
      strategy,
      distance: undefined,
      reason: 'No living enemies available',
    };
  }
  
  // Check for Taunt first
  const tauntTarget = findTauntTarget(unit, enemies);
  if (tauntTarget) {
    return {
      target: tauntTarget,
      strategy: 'nearest', // Taunt overrides strategy
      distance: manhattanDistance(unit.position, tauntTarget.position),
      reason: `Forced to target ${tauntTarget.id} due to Taunt ability`,
    };
  }
  
  // Use specified strategy
  let target: BattleUnit | null = null;
  let reason = '';
  
  switch (strategy) {
    case 'nearest':
      target = findNearestEnemy(unit, enemies);
      reason = target ? `Nearest enemy at distance ${manhattanDistance(unit.position, target.position)}` : 'No reachable enemies';
      break;
    case 'weakest':
      target = findWeakestEnemy(enemies);
      reason = target ? `Weakest enemy with ${target.currentHp} HP` : 'No valid weak targets';
      break;
    case 'highest_threat':
      target = findHighestThreatEnemy(unit, enemies);
      reason = target ? `Highest threat enemy (${calculateThreatLevel(target, unit).toFixed(1)} threat)` : 'No threatening enemies';
      break;
  }
  
  // Fallback to nearest if strategy failed
  if (!target) {
    target = findNearestEnemy(unit, enemies);
    reason = target ? `Fallback to nearest enemy` : 'No valid targets found';
  }
  
  return {
    target,
    strategy,
    distance: target ? manhattanDistance(unit.position, target.position) : undefined,
    reason,
  };
}

// =============================================================================
// TARGETING UTILITIES
// =============================================================================

/**
 * Check if a unit can target another unit (within range and line of sight).
 * Considers attack range and potential obstacles.
 * 
 * @param attacker - Unit attempting to attack
 * @param target - Potential target unit
 * @returns True if target is within range and can be attacked
 * @example
 * if (canTarget(archer, enemy)) {
 *   // Perform ranged attack
 * } else {
 *   // Move closer or find different target
 * }
 */
export function canTarget(attacker: BattleUnit, target: BattleUnit): boolean {
  if (!target.alive) {
    return false;
  }
  
  const distance = manhattanDistance(attacker.position, target.position);
  return distance <= attacker.range;
}

/**
 * Get all enemies within attack range of a unit.
 * Filters enemies by range and alive status.
 * 
 * @param unit - Unit checking for targets in range
 * @param enemies - Array of potential enemy targets
 * @returns Array of enemies within attack range
 * @example
 * const inRange = getEnemiesInRange(archer, allEnemies);
 * if (inRange.length > 0) {
 *   const target = selectTarget(archer, inRange, 'weakest');
 * }
 */
export function getEnemiesInRange(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit[] {
  return enemies.filter(enemy => canTarget(unit, enemy));
}

/**
 * Find optimal position to attack a specific target.
 * Calculates positions within movement range that allow attacking the target.
 * 
 * @param unit - Unit that wants to attack
 * @param target - Target to attack
 * @param maxMovement - Maximum movement distance
 * @returns Array of positions from which unit can attack target
 * @example
 * const positions = findAttackPositions(warrior, enemy, warrior.stats.speed);
 * if (positions.length > 0) {
 *   // Move to optimal attack position
 * }
 */
export function findAttackPositions(
  unit: BattleUnit, 
  target: BattleUnit, 
  maxMovement: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  
  // Check all positions within movement range
  for (let dx = -maxMovement; dx <= maxMovement; dx++) {
    for (let dy = -maxMovement; dy <= maxMovement; dy++) {
      // Skip positions outside movement range (Manhattan distance)
      if (Math.abs(dx) + Math.abs(dy) > maxMovement) {
        continue;
      }
      
      const candidatePos = {
        x: unit.position.x + dx,
        y: unit.position.y + dy,
      };
      
      // Check if from this position, unit can attack target
      const distanceToTarget = manhattanDistance(candidatePos, target.position);
      if (distanceToTarget <= unit.range) {
        positions.push(candidatePos);
      }
    }
  }
  
  return positions;
}

/**
 * Evaluate targeting strategy effectiveness for a unit.
 * Analyzes how well different strategies work for the unit's role and situation.
 * 
 * @param unit - Unit to evaluate strategies for
 * @param enemies - Available enemy targets
 * @returns Recommended strategy based on unit role and battlefield state
 * @example
 * const strategy = recommendTargetingStrategy(mage, enemies);
 * const target = selectTarget(mage, enemies, strategy);
 */
export function recommendTargetingStrategy(unit: BattleUnit, enemies: BattleUnit[]): TargetStrategy {
  const livingEnemies = enemies.filter(enemy => enemy.alive);
  
  if (livingEnemies.length === 0) {
    return 'nearest';
  }
  
  // Strategy based on unit role
  switch (unit.role) {
    case 'mage':
    case 'ranged_dps':
      // Ranged units should prioritize high-value targets
      return 'highest_threat';
    
    case 'melee_dps':
      // DPS units should finish off weak enemies
      return 'weakest';
    
    case 'tank':
      // Tanks should engage nearest threats
      return 'nearest';
    
    case 'support':
      // Support units should target threats to allies
      return 'highest_threat';
    
    default:
      return 'nearest';
  }
}