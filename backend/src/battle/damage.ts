/**
 * Damage calculation system for Fantasy Autobattler.
 * Re-exports from core/battle/damage with game-specific defaults.
 *
 * @fileoverview Pure functions for combat damage calculations following GDD specifications.
 * All functions are deterministic and use seeded randomness for reproducible results.
 *
 * @deprecated Import from '../core/battle' for new code.
 * This file is kept for backward compatibility.
 */

// =============================================================================
// RE-EXPORTS FROM CORE (for backward compatibility)
// =============================================================================

export {
  calculatePhysicalDamage,
  calculateMagicDamage,
  rollDodge,
  applyDamage,
  applyHealing,
  resolvePhysicalAttack,
  resolveMagicAttack,
  calculateArmorReduction,
  canSurviveDamage,
  calculateLethalDamage,
} from '../core/battle';
