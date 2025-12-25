/**
 * Core Progression Types
 * 
 * Base types for deck, hand, draft, upgrade, economy, run, and snapshot systems.
 * All types are generic to support any card type.
 * 
 * @module core/progression/types
 */

// ═══════════════════════════════════════════════════════════════
// BASE CARD INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Base interface for any card type.
 * Games extend this with their specific properties.
 * 
 * @example
 * // Unit card for autobattler
 * interface UnitCard extends BaseCard {
 *   hp: number;
 *   atk: number;
 *   armor: number;
 *   role: string;
 * }
 * 
 * @example
 * // Spell card for card game
 * interface SpellCard extends BaseCard {
 *   manaCost: number;
 *   effect: string;
 * }
 */
export interface BaseCard {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Base cost (for economy) */
  baseCost: number;
  
  /** Current tier (for upgrades), starts at 1 */
  tier: number;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Result type for operations that can fail.
 * Used for validation and error handling.
 */
export interface Result<T> {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** The result value (if success) */
  value?: T;
  
  /** Error message (if failure) */
  error?: string;
}

/**
 * Generic ID generator function type.
 * Used for creating unique identifiers.
 */
export type IdGenerator = () => string;

/**
 * Default ID generator using crypto.randomUUID or fallback.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
