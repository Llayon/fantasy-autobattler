/**
 * Core Progression Systems
 *
 * Reusable progression systems for roguelike/deckbuilder games.
 * Includes: deck, hand, draft, upgrade, economy, run, and snapshot systems.
 *
 * All systems are:
 * - Generic (work with any card type extending BaseCard)
 * - Deterministic (use seeded random for reproducibility)
 * - Immutable (all operations return new state)
 * - Configurable (presets for different game types)
 *
 * @module core/progression
 */

// Base types
export * from './types';

// Deck system
export * from './deck';

// Hand system
export * from './hand';

// Draft system
export * from './draft';

// Upgrade system
export * from './upgrade';

// Economy system
export * from './economy';

// Run system
export * from './run';

// Snapshot system (TODO: Phase 6)
// export * from './snapshot';
