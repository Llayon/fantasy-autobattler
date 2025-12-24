/**
 * Re-export AI decision from game module for backward compatibility.
 * @fileoverview All AI decision logic has been moved to game/battle/ai.decision.ts
 */

export {
  ActionType,
  UnitAction,
  decideAction,
  selectBestAction,
  shouldUseAbility,
  getActionPriority,
} from '../game/battle/ai.decision';
