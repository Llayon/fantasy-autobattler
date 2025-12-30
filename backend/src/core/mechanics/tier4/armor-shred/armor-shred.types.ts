/**
 * Armor Shred mechanic types
 *
 * Defines types for armor degradation system.
 * - Physical attacks reduce target's effective armor
 * - Shred accumulates up to a cap
 * - Optional decay at turn end
 */

/**
 * Unit with armor shred information
 */
export interface ArmorShredUnit {
  id: string;
  armor: number;
  armorShred?: number;
}

/**
 * Result of armor shred application
 */
export interface ShredResult {
  targetId: string;
  shredApplied: number;
  totalShred: number;
  effectiveArmor: number;
  wasCapped: boolean;
}

/**
 * Result of armor shred decay
 */
export interface DecayResult {
  unitId: string;
  previousShred: number;
  newShred: number;
  decayAmount: number;
}

/**
 * Default armor shred configuration values
 */
export const DEFAULT_SHRED_VALUES = {
  shredPerHit: 1,        // Armor shred per physical hit
  maxShred: 10,          // Maximum shred accumulation
  decayPerTurn: 0,       // Shred decay per turn (0 = no decay)
  percentBased: false,   // If true, shred is % of base armor
};
