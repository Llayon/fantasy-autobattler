/**
 * Target selection system for Fantasy Autobattler AI.
 * Re-exports from core/battle/targeting.
 *
 * @fileoverview Target selection implementation with distance-based, health-based,
 * and threat-based targeting strategies. All functions use deterministic tiebreaking.
 *
 * @deprecated Import from '../core/battle' for new code.
 * This file is kept for backward compatibility.
 */

// =============================================================================
// RE-EXPORTS FROM CORE (for backward compatibility)
// =============================================================================

export {
  findNearestEnemy,
  findWeakestEnemy,
  findTauntTarget,
  calculateThreatLevel,
  findHighestThreatEnemy,
  selectTarget,
  selectTargetWithDetails,
  canTarget,
  getEnemiesInRange,
  findAttackPositions,
  recommendTargetingStrategy,
} from '../core/battle';

export type { TargetStrategy, TargetSelectionResult } from '../core/battle';
