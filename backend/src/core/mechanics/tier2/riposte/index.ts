/**
 * Tier 2: Riposte (Counter-attack) Module
 *
 * Exports the riposte processor and related types.
 *
 * @module core/mechanics/tier2/riposte
 */

export { createRiposteProcessor, default } from './riposte.processor';
export type {
  RiposteProcessor,
  UnitWithRiposte,
  RiposteEligibility,
  RiposteBlockReason,
  RiposteChanceResult,
  RiposteExecutionResult,
  RiposteTriggeredEvent,
  RiposteFailedEvent,
  RiposteBlockedEvent,
  RiposteChargesResetEvent,
  RiposteEvent,
  RiposteProcessorOptions,
  RiposteContext,
  RiposteCheckResult,
  AttackArc,
} from './riposte.types';
export {
  RIPOSTE_DAMAGE_MULTIPLIER,
  MIN_RIPOSTE_CHANCE,
  MAX_RIPOSTE_CHANCE,
} from './riposte.types';
