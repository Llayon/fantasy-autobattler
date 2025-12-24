/**
 * Turn order system for Fantasy Autobattler battles.
 * Re-exports from core/battle/turn-order.
 *
 * @fileoverview Turn order implementation following GDD section 5.3 specifications.
 * Provides deterministic turn ordering based on initiative, speed, and ID tiebreaking.
 *
 * @deprecated Import from '../core/battle' for new code.
 * This file is kept for backward compatibility.
 */

// =============================================================================
// RE-EXPORTS FROM CORE (for backward compatibility)
// =============================================================================

export {
  buildTurnQueue,
  getNextUnit,
  removeDeadUnits,
  hasLivingUnits,
  getLivingUnitsByTeam,
  countLivingUnitsByTeam,
  findUnitById,
  getTurnOrderPreview,
  validateTurnQueue,
  isTurnQueueSorted,
  advanceToNextTurn,
  shouldStartNewRound,
} from '../core/battle';
