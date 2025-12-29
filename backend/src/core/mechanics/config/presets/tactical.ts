/**
 * Tactical Preset - Tier 0-2 mechanics only
 *
 * This preset enables mechanics up to Tier 2, providing a middle ground
 * between MVP (no mechanics) and Roguelike (all mechanics).
 *
 * Includes:
 * - Tier 0: Facing, ArmorShred
 * - Tier 1: Resolve, Engagement, Flanking
 * - Tier 2: Riposte, Intercept, Aura
 *
 * Excludes:
 * - Tier 3: Charge, Overwatch, Phalanx, LineOfSight, Ammunition
 * - Tier 4: Contagion
 */

import { MechanicsConfig } from '../mechanics.types';

/**
 * Tactical preset configuration
 *
 * Tier 0-2 mechanics enabled, Tier 3-4 disabled
 */
export const TACTICAL_PRESET: MechanicsConfig = {
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

  // Tier 3 - disabled
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,

  // Tier 4 - disabled
  contagion: false,
};
