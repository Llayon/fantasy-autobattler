/**
 * Test Generators for Property-Based Testing
 * 
 * Provides fast-check arbitraries for generating random test data.
 * Used for property-based testing of progression systems.
 * 
 * @module core/progression/test-generators
 */

import * as fc from 'fast-check';
import { BaseCard } from './types';
import { DeckConfig, Deck } from './deck/deck.types';
import { HandConfig, Hand } from './hand/hand.types';
import { EconomyConfig, Wallet } from './economy/economy.types';
import { RunConfig, Run, RunPhase, RunStatus } from './run/run.types';
import { SnapshotConfig, Snapshot } from './snapshot/snapshot.types';

// ═══════════════════════════════════════════════════════════════
// BASE CARD GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a random BaseCard.
 * 
 * @example
 * fc.assert(fc.property(arbitraryBaseCard(), (card) => {
 *   expect(card.tier).toBeGreaterThanOrEqual(1);
 * }));
 */
export function arbitraryBaseCard(): fc.Arbitrary<BaseCard> {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    baseCost: fc.integer({ min: 1, max: 100 }),
    tier: fc.integer({ min: 1, max: 5 }),
  });
}

/**
 * Generates an array of unique BaseCards.
 * 
 * @param minLength - Minimum array length
 * @param maxLength - Maximum array length
 */
export function arbitraryBaseCards(
  minLength = 0,
  maxLength = 20
): fc.Arbitrary<BaseCard[]> {
  return fc.array(arbitraryBaseCard(), { minLength, maxLength })
    .map(cards => {
      // Ensure unique IDs
      const seen = new Set<string>();
      return cards.filter(card => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });
    });
}

// ═══════════════════════════════════════════════════════════════
// DECK GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a valid DeckConfig.
 */
export function arbitraryDeckConfig(): fc.Arbitrary<DeckConfig<BaseCard>> {
  return fc.record({
    maxDeckSize: fc.integer({ min: 1, max: 30 }),
    minDeckSize: fc.integer({ min: 0, max: 10 }),
    allowDuplicates: fc.boolean(),
    maxCopies: fc.integer({ min: 1, max: 4 }),
  }).filter(config => config.minDeckSize <= config.maxDeckSize);
}

/**
 * Generates a valid Deck with cards matching config constraints.
 * 
 * @param config - Optional deck configuration
 */
export function arbitraryDeck(
  config?: DeckConfig<BaseCard>
): fc.Arbitrary<Deck<BaseCard>> {
  if (config) {
    return arbitraryBaseCards(config.minDeckSize, config.maxDeckSize)
      .map(cards => ({ cards, config }));
  }
  
  return arbitraryDeckConfig().chain(cfg =>
    arbitraryBaseCards(cfg.minDeckSize, cfg.maxDeckSize)
      .map(cards => ({ cards, config: cfg }))
  );
}

// ═══════════════════════════════════════════════════════════════
// HAND GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a valid HandConfig.
 */
export function arbitraryHandConfig(): fc.Arbitrary<HandConfig> {
  return fc.record({
    maxHandSize: fc.integer({ min: 1, max: 10 }),
    startingHandSize: fc.integer({ min: 0, max: 5 }),
    autoDiscard: fc.boolean(),
  }).filter(config => config.startingHandSize <= config.maxHandSize);
}

/**
 * Generates a valid Hand with cards.
 * 
 * @param config - Optional hand configuration
 */
export function arbitraryHand(
  config?: HandConfig
): fc.Arbitrary<Hand<BaseCard>> {
  if (config) {
    return arbitraryBaseCards(0, config.maxHandSize)
      .map(cards => ({ cards, config }));
  }
  
  return arbitraryHandConfig().chain(cfg =>
    arbitraryBaseCards(0, cfg.maxHandSize)
      .map(cards => ({ cards, config: cfg }))
  );
}

// ═══════════════════════════════════════════════════════════════
// ECONOMY GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a valid EconomyConfig.
 */
export function arbitraryEconomyConfig(): fc.Arbitrary<EconomyConfig> {
  return fc.record({
    startingAmount: fc.integer({ min: 0, max: 100 }),
    currencyName: fc.constantFrom('Gold', 'Coins', 'Credits'),
    maxAmount: fc.integer({ min: 0, max: 1000 }),
    winReward: fc.constant((streak: number) => 5 + streak),
    loseReward: fc.constant((streak: number) => 3 + streak),
    interestRate: fc.double({ min: 0, max: 0.2, noNaN: true }),
    interestCap: fc.integer({ min: 0, max: 10 }),
  });
}

/**
 * Generates a valid Wallet.
 * 
 * @param config - Optional economy configuration
 */
export function arbitraryWallet(
  config?: EconomyConfig
): fc.Arbitrary<Wallet> {
  if (config) {
    const maxAmount = config.maxAmount > 0 ? config.maxAmount : 1000;
    return fc.integer({ min: 0, max: maxAmount })
      .map(amount => ({ amount, config }));
  }
  
  return arbitraryEconomyConfig().chain(cfg => {
    const maxAmount = cfg.maxAmount > 0 ? cfg.maxAmount : 1000;
    return fc.integer({ min: 0, max: maxAmount })
      .map(amount => ({ amount, config: cfg }));
  });
}

// ═══════════════════════════════════════════════════════════════
// RUN GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a valid RunConfig.
 */
export function arbitraryRunConfig(): fc.Arbitrary<RunConfig> {
  return fc.record({
    winsToComplete: fc.integer({ min: 1, max: 20 }),
    maxLosses: fc.integer({ min: 1, max: 10 }),
    phases: fc.array(
      fc.constantFrom<RunPhase>('draft', 'battle', 'shop', 'event', 'boss', 'rest'),
      { minLength: 1, maxLength: 5 }
    ),
    trackStreaks: fc.boolean(),
    enableRating: fc.boolean(),
  });
}

/**
 * Generates a valid Run with random win/loss history.
 * 
 * @param config - Optional run configuration
 */
export function arbitraryRun<TState>(
  config?: RunConfig,
  stateArbitrary?: fc.Arbitrary<TState>
): fc.Arbitrary<Run<TState>> {
  const stateArb = stateArbitrary ?? fc.constant({} as TState);
  
  if (config) {
    return fc.record({
      id: fc.uuid(),
      config: fc.constant(config),
      wins: fc.integer({ min: 0, max: config.winsToComplete - 1 }),
      losses: fc.integer({ min: 0, max: config.maxLosses - 1 }),
      currentPhaseIndex: fc.integer({ min: 0, max: config.phases.length - 1 }),
      winStreak: fc.integer({ min: 0, max: 10 }),
      loseStreak: fc.integer({ min: 0, max: 5 }),
      status: fc.constant<RunStatus>('active'),
      state: stateArb,
      history: fc.constant([]),
    });
  }
  
  return arbitraryRunConfig().chain(cfg =>
    fc.record({
      id: fc.uuid(),
      config: fc.constant(cfg),
      wins: fc.integer({ min: 0, max: cfg.winsToComplete - 1 }),
      losses: fc.integer({ min: 0, max: cfg.maxLosses - 1 }),
      currentPhaseIndex: fc.integer({ min: 0, max: Math.max(0, cfg.phases.length - 1) }),
      winStreak: fc.integer({ min: 0, max: 10 }),
      loseStreak: fc.integer({ min: 0, max: 5 }),
      status: fc.constant<RunStatus>('active'),
      state: stateArb,
      history: fc.constant([]),
    })
  );
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a valid SnapshotConfig.
 */
export function arbitrarySnapshotConfig(): fc.Arbitrary<SnapshotConfig> {
  return fc.record({
    expiryMs: fc.integer({ min: 1000, max: 86400000 }), // 1s to 24h
    maxSnapshotsPerPlayer: fc.integer({ min: 1, max: 20 }),
    includeFullState: fc.boolean(),
    maxTotalSnapshots: fc.integer({ min: 0, max: 10000 }),
    cleanupStrategy: fc.constantFrom('oldest', 'lowest-rating', 'random'),
  });
}

/**
 * Generates a valid Snapshot.
 * 
 * @param config - Optional snapshot configuration
 */
export function arbitrarySnapshot<TState>(
  stateArbitrary?: fc.Arbitrary<TState>
): fc.Arbitrary<Snapshot<TState>> {
  const stateArb = stateArbitrary ?? fc.constant({} as TState);
  
  return fc.record({
    id: fc.uuid(),
    playerId: fc.uuid(),
    runId: fc.uuid(),
    wins: fc.integer({ min: 0, max: 20 }),
    losses: fc.integer({ min: 0, max: 10 }),
    rating: fc.integer({ min: 0, max: 3000 }),
    state: stateArb,
    createdAt: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
  }).map(snapshot => ({
    ...snapshot,
    sizeBytes: Math.random() > 0.5 ? Math.floor(Math.random() * 10000) + 100 : undefined,
  }));
}

/**
 * Generates an array of snapshots for testing pool operations.
 * 
 * @param minLength - Minimum array length
 * @param maxLength - Maximum array length
 */
export function arbitrarySnapshots<TState>(
  minLength = 0,
  maxLength = 100,
  stateArbitrary?: fc.Arbitrary<TState>
): fc.Arbitrary<Snapshot<TState>[]> {
  return fc.array(arbitrarySnapshot(stateArbitrary), { minLength, maxLength });
}
