/**
 * Turn order system for Fantasy Autobattler battles.
 * Manages initiative-based turn queue with deterministic sorting and unit lifecycle.
 * 
 * @fileoverview Turn order implementation following GDD section 5.3 specifications.
 * Provides deterministic turn ordering based on initiative, speed, and ID tiebreaking.
 */

import { BattleUnit } from '../types/game.types';

// =============================================================================
// TURN QUEUE MANAGEMENT
// =============================================================================

/**
 * Build turn queue from units with deterministic sorting.
 * Follows GDD section 5.3 sorting rules:
 * 1. Initiative (descending) - higher initiative goes first
 * 2. Speed (descending) - higher speed breaks initiative ties
 * 3. ID (ascending) - alphabetical order for complete determinism
 * 
 * @param units - Array of battle units to sort
 * @returns Sorted array of units in turn order
 * @example
 * const units = [
 *   { id: 'rogue', stats: { initiative: 9, speed: 4 } },
 *   { id: 'knight', stats: { initiative: 4, speed: 2 } },
 *   { id: 'mage', stats: { initiative: 6, speed: 2 } }
 * ];
 * const queue = buildTurnQueue(units);
 * // Returns: [rogue, mage, knight] (9>6>4 initiative)
 */
export function buildTurnQueue(units: BattleUnit[]): BattleUnit[] {
  return units
    .filter(unit => unit.alive) // Only include living units
    .sort((a, b) => {
      // 1. Primary sort: Initiative (descending - higher goes first)
      if (b.stats.initiative !== a.stats.initiative) {
        return b.stats.initiative - a.stats.initiative;
      }
      
      // 2. Secondary sort: Speed (descending - faster breaks ties)
      if (b.stats.speed !== a.stats.speed) {
        return b.stats.speed - a.stats.speed;
      }
      
      // 3. Tertiary sort: ID (ascending - alphabetical for determinism)
      return a.id.localeCompare(b.id);
    });
}

/**
 * Get the next unit to act from the turn queue.
 * Returns the first living unit in the queue, or null if none available.
 * 
 * @param queue - Turn queue array of units
 * @returns Next unit to act, or null if no living units
 * @example
 * const queue = [aliveUnit, deadUnit, anotherAliveUnit];
 * const next = getNextUnit(queue);
 * // Returns: aliveUnit (first living unit)
 */
export function getNextUnit(queue: BattleUnit[]): BattleUnit | null {
  // Find first living unit in queue
  for (const unit of queue) {
    if (unit.alive) {
      return unit;
    }
  }
  
  // No living units found
  return null;
}

/**
 * Remove dead units from the turn queue.
 * Creates a new array with only living units, preserving order.
 * 
 * @param queue - Current turn queue
 * @returns New queue with only living units
 * @example
 * const queue = [aliveUnit, deadUnit, anotherAliveUnit];
 * const cleaned = removeDeadUnits(queue);
 * // Returns: [aliveUnit, anotherAliveUnit]
 */
export function removeDeadUnits(queue: BattleUnit[]): BattleUnit[] {
  return queue.filter(unit => unit.alive);
}

// =============================================================================
// TURN QUEUE UTILITIES
// =============================================================================

/**
 * Check if any units remain alive in the queue.
 * Useful for determining if battle should continue.
 * 
 * @param queue - Turn queue to check
 * @returns True if at least one unit is alive
 * @example
 * const hasLiving = hasLivingUnits(queue);
 * if (!hasLiving) {
 *   // Battle is over
 * }
 */
export function hasLivingUnits(queue: BattleUnit[]): boolean {
  return queue.some(unit => unit.alive);
}

/**
 * Get all living units from a specific team.
 * Filters queue by team and alive status.
 * 
 * @param queue - Turn queue to filter
 * @param team - Team to filter for ('player' or 'bot')
 * @returns Array of living units from the specified team
 * @example
 * const playerUnits = getLivingUnitsByTeam(queue, 'player');
 * const enemyUnits = getLivingUnitsByTeam(queue, 'enemy');
 */
export function getLivingUnitsByTeam(queue: BattleUnit[], team: 'player' | 'bot'): BattleUnit[] {
  return queue.filter(unit => unit.alive && unit.team === team);
}

/**
 * Count living units by team.
 * Returns count of alive units for each team.
 * 
 * @param queue - Turn queue to analyze
 * @returns Object with player and bot unit counts
 * @example
 * const counts = countLivingUnitsByTeam(queue);
 * // Returns: { player: 3, bot: 2 }
 */
export function countLivingUnitsByTeam(queue: BattleUnit[]): { player: number; bot: number } {
  let playerCount = 0;
  let botCount = 0;
  
  for (const unit of queue) {
    if (unit.alive) {
      if (unit.team === 'player') {
        playerCount++;
      } else if (unit.team === 'bot') {
        botCount++;
      }
    }
  }
  
  return { player: playerCount, bot: botCount };
}

/**
 * Find unit in queue by instance ID.
 * Searches for a unit with the specified instance ID.
 * 
 * @param queue - Turn queue to search
 * @param instanceId - Unique instance ID to find
 * @returns Found unit or null if not found
 * @example
 * const unit = findUnitById(queue, 'warrior_1');
 * if (unit) {
 *   // Unit found in queue
 * }
 */
export function findUnitById(queue: BattleUnit[], instanceId: string): BattleUnit | null {
  return queue.find(unit => unit.instanceId === instanceId) || null;
}

/**
 * Get turn order preview for UI display.
 * Returns array of unit IDs in turn order for the next few turns.
 * 
 * @param queue - Current turn queue
 * @param maxTurns - Maximum number of turns to preview (default: 5)
 * @returns Array of unit instance IDs in turn order
 * @example
 * const preview = getTurnOrderPreview(queue, 3);
 * // Returns: ['rogue_1', 'mage_1', 'knight_1']
 */
export function getTurnOrderPreview(queue: BattleUnit[], maxTurns: number = 5): string[] {
  const livingUnits = removeDeadUnits(queue);
  const preview: string[] = [];
  
  for (let i = 0; i < maxTurns && livingUnits.length > 0; i++) {
    const unitIndex = i % livingUnits.length;
    const unit = livingUnits[unitIndex];
    if (unit) {
      preview.push(unit.instanceId);
    }
  }
  
  return preview;
}

// =============================================================================
// TURN QUEUE VALIDATION
// =============================================================================

/**
 * Validate turn queue integrity.
 * Checks for common issues like duplicate units or invalid states.
 * 
 * @param queue - Turn queue to validate
 * @returns Validation result with success status and any errors
 * @example
 * const validation = validateTurnQueue(queue);
 * if (!validation.valid) {
 *   console.error('Queue validation failed:', validation.errors);
 * }
 */
export function validateTurnQueue(queue: BattleUnit[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  
  // Check for duplicate instance IDs
  for (const unit of queue) {
    if (seenIds.has(unit.instanceId)) {
      errors.push(`Duplicate unit instance ID: ${unit.instanceId}`);
    }
    seenIds.add(unit.instanceId);
  }
  
  // Check for invalid unit states
  for (const unit of queue) {
    if (unit.currentHp < 0) {
      errors.push(`Unit ${unit.instanceId} has negative HP: ${unit.currentHp}`);
    }
    
    if (unit.currentHp === 0 && unit.alive) {
      errors.push(`Unit ${unit.instanceId} has 0 HP but is marked alive`);
    }
    
    if (unit.currentHp > 0 && !unit.alive) {
      errors.push(`Unit ${unit.instanceId} has HP but is marked dead`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if turn queue is properly sorted according to GDD rules.
 * Verifies that the queue follows initiative > speed > ID sorting.
 * 
 * @param queue - Turn queue to check
 * @returns True if queue is properly sorted
 * @example
 * const sorted = isTurnQueueSorted(queue);
 * if (!sorted) {
 *   // Queue needs to be rebuilt
 * }
 */
export function isTurnQueueSorted(queue: BattleUnit[]): boolean {
  const livingUnits = queue.filter(unit => unit.alive);
  
  for (let i = 1; i < livingUnits.length; i++) {
    const prev = livingUnits[i - 1];
    const curr = livingUnits[i];
    
    if (!prev || !curr) continue;
    
    // Check initiative ordering
    if (prev.stats.initiative < curr.stats.initiative) {
      return false;
    }
    
    // Check speed ordering for same initiative
    if (prev.stats.initiative === curr.stats.initiative) {
      if (prev.stats.speed < curr.stats.speed) {
        return false;
      }
      
      // Check ID ordering for same initiative and speed
      if (prev.stats.speed === curr.stats.speed) {
        if (prev.id.localeCompare(curr.id) > 0) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// =============================================================================
// ROUND MANAGEMENT
// =============================================================================

/**
 * Advance to next turn in the queue.
 * Removes the current unit from front and returns updated queue.
 * If queue becomes empty, rebuilds from all living units.
 * 
 * @param queue - Current turn queue
 * @param allUnits - All units in battle (for queue rebuilding)
 * @returns Updated turn queue for next turn
 * @example
 * const newQueue = advanceToNextTurn(currentQueue, allBattleUnits);
 */
export function advanceToNextTurn(queue: BattleUnit[], allUnits: BattleUnit[]): BattleUnit[] {
  // Remove current unit (first in queue)
  const remainingQueue = queue.slice(1);
  
  // If queue is empty or no living units remain, rebuild from all units
  const livingInQueue = remainingQueue.filter(unit => unit.alive);
  if (livingInQueue.length === 0) {
    return buildTurnQueue(allUnits);
  }
  
  return remainingQueue;
}

/**
 * Check if a new round should start.
 * A new round starts when all living units have acted once.
 * 
 * @param queue - Current turn queue
 * @param allUnits - All units in battle
 * @returns True if new round should start
 * @example
 * if (shouldStartNewRound(queue, allUnits)) {
 *   roundNumber++;
 *   queue = buildTurnQueue(allUnits);
 * }
 */
export function shouldStartNewRound(queue: BattleUnit[], allUnits: BattleUnit[]): boolean {
  const livingUnits = allUnits.filter(unit => unit.alive);
  const livingInQueue = queue.filter(unit => unit.alive);
  
  // New round if no living units remain in queue but living units exist
  return livingInQueue.length === 0 && livingUnits.length > 0;
}