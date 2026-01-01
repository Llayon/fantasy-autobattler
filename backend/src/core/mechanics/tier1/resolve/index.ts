/**
 * Tier 1: Resolve (Morale) Module
 *
 * Exports all resolve-related types and the processor factory.
 * The resolve system tracks unit morale and determines behavior
 * when morale breaks (routing for humans, crumbling for undead).
 *
 * @module core/mechanics/tier1/resolve
 */

export { createResolveProcessor } from './resolve.processor';
export type {
  ResolveProcessor,
  MechanicsResolveState,
  ResolveState,
  ResolveFaction,
  UnitWithResolve,
  ResolveDamageSource,
  ResolveDamageEvent,
  ResolveBreakEvent,
  ResolveRegenEvent,
  ResolveBreakResult,
  ResolveDamageOptions,
} from './resolve.types';
