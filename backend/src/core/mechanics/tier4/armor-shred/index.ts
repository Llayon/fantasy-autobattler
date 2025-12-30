/**
 * Armor Shred mechanic exports
 *
 * Armor degradation system:
 * - Physical attacks reduce target's effective armor
 * - Shred accumulates up to a cap
 * - Optional decay at turn end
 */

export * from './armor-shred.types';
export * from './armor-shred.processor';
