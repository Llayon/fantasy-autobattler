/**
 * MVP Preset - All mechanics disabled
 *
 * Produces identical results to Core 1.0.
 * Use this preset for backward compatibility.
 *
 * @module core/mechanics/config/presets
 */

import type { MechanicsConfig } from '../mechanics.types';

/**
 * MVP Preset: All mechanics disabled.
 * Produces identical results to core 1.0.
 *
 * @example
 * import { createMechanicsProcessor, MVP_PRESET } from '@core/mechanics';
 * const processor = createMechanicsProcessor(MVP_PRESET);
 * // Battle simulation identical to Core 1.0
 */
export const MVP_PRESET: MechanicsConfig = {
  facing: false,
  resolve: false,
  engagement: false,
  flanking: false,
  riposte: false,
  intercept: false,
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};
