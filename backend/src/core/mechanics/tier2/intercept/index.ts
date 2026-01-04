/**
 * Tier 2: Intercept Module
 *
 * Exports the intercept processor and related types.
 *
 * @module core/mechanics/tier2/intercept
 */

export { createInterceptProcessor } from './intercept.processor';
export type {
  // Processor interface
  InterceptProcessor,
  // Type definitions
  InterceptType,
  InterceptResult,
  // Unit extensions
  UnitWithIntercept,
  // Check types
  InterceptOpportunity,
  InterceptBlockReason,
  InterceptCheckResult,
  // Execution types
  InterceptExecutionResult,
  DisengageResult,
  DisengageFailReason,
  // Event types
  HardInterceptEvent,
  SoftInterceptEvent,
  InterceptBlockedEvent,
  DisengageEvent,
  InterceptChargesResetEvent,
  InterceptEvent,
  // Helper types
  InterceptProcessorOptions,
  InterceptContext,
  InterceptFullResult,
} from './intercept.types';
export {
  // Constants
  HARD_INTERCEPT_DAMAGE_MULTIPLIER,
  DEFAULT_DISENGAGE_COST,
  HARD_INTERCEPT_TAG,
  CAVALRY_TAG,
} from './intercept.types';
