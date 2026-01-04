/**
 * Tactical Preset - Tier 0-2 mechanics only
 *
 * Simpler combat without specialized mechanics.
 * Good for learning the system or lighter gameplay.
 *
 * @module core/mechanics/config/presets
 */

import type { MechanicsConfig } from '../mechanics.types';

/**
 * Tactical Preset: Tier 0-2 mechanics only.
 * Simpler combat without specialized mechanics.
 *
 * Enabled mechanics:
 * - Tier 0: facing
 * - Tier 1: resolve, engagement, flanking
 * - Tier 2: riposte, intercept
 *
 * Disabled mechanics:
 * - Tier 2: aura
 * - Tier 3: charge, overwatch, phalanx, lineOfSight, ammunition
 * - Tier 4: contagion, armorShred
 *
 * @example
 * import { createMechanicsProcessor, TACTICAL_PRESET } from '@core/mechanics';
 * const processor = createMechanicsProcessor(TACTICAL_PRESET);
 * // Simpler tactical combat
 */
export const TACTICAL_PRESET: MechanicsConfig = {
  facing: true,
  resolve: {
    maxResolve: 100,
    baseRegeneration: 5,
    humanRetreat: true,
    undeadCrumble: false,
    flankingResolveDamage: 12,
    rearResolveDamage: 20,
  },
  engagement: {
    attackOfOpportunity: true,
    archerPenalty: false,
    archerPenaltyPercent: 0,
  },
  flanking: true,
  riposte: {
    initiativeBased: true,
    chargesPerRound: 1,
    baseChance: 0.5,
    guaranteedThreshold: 10,
  },
  intercept: {
    hardIntercept: false,
    softIntercept: true,
    disengageCost: 1,
  },
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};
