/**
 * Roguelike Preset - All mechanics enabled
 *
 * This preset enables all 14 Core 2.0 mechanics with default configurations.
 * Use this for the full roguelike experience with all tactical depth.
 *
 * Includes:
 * - Tier 0: Facing, ArmorShred
 * - Tier 1: Resolve, Engagement, Flanking
 * - Tier 2: Riposte, Intercept, Aura
 * - Tier 3: Charge, Overwatch, Phalanx, LineOfSight, Ammunition
 * - Tier 4: Contagion
 */

import { MechanicsConfig } from '../mechanics.types';

/**
 * Roguelike preset configuration
 *
 * All mechanics enabled with default configurations
 */
export const ROGUELIKE_PRESET: MechanicsConfig = {
  // Tier 0
  facing: true,
  armorShred: true,

  // Tier 1
  resolve: true,
  engagement: true,
  flanking: true,

  // Tier 2
  riposte: true,
  intercept: true,
  aura: true,

  // Tier 3
  charge: true,
  overwatch: true,
  phalanx: true,
  lineOfSight: true,
  ammunition: true,

  // Tier 4
  contagion: true,
};
