/**
 * MVP Preset - Current behavior (no mechanics)
 *
 * This preset disables all Core 2.0 mechanics, resulting in behavior
 * identical to the current MVP implementation.
 *
 * Use this preset to maintain backward compatibility.
 */

import { MechanicsConfig } from '../mechanics.types';

/**
 * MVP preset configuration
 *
 * All mechanics disabled - identical to Core 1.0 behavior
 */
export const MVP_PRESET: MechanicsConfig = {
  // Tier 0
  facing: false,
  armorShred: false,

  // Tier 1
  resolve: false,
  engagement: false,
  flanking: false,

  // Tier 2
  riposte: false,
  intercept: false,
  aura: false,

  // Tier 3
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,

  // Tier 4
  contagion: false,
};
