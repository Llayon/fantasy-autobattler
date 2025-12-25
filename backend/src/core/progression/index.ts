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

// Deck system (TODO: Phase 2)
// export * from './deck';

// Hand system (TODO: Phase 2)
// export * from './hand';

// Draft system (TODO: Phase 3)
// export * from './draft';

// Upgrade system (TODO: Phase 4)
// export * from './upgrade';

// Economy system (TODO: Phase 4)
// export * from './economy';

// Run system (TODO: Phase 5)
// export * from './run';

// Snapshot system (TODO: Phase 6)
// export * from './snapshot';
