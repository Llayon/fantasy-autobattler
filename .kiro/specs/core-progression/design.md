# Design: Core Progression Systems

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE PROGRESSION (3.0)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Deck   │  │  Hand   │  │  Draft  │  │ Upgrade │            │
│  │ System  │  │ System  │  │ System  │  │ System  │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                   │
│       └────────────┴─────┬──────┴────────────┘                   │
│                          │                                       │
│                    ┌─────▼─────┐                                 │
│                    │    Run    │                                 │
│                    │  System   │                                 │
│                    └─────┬─────┘                                 │
│                          │                                       │
│       ┌──────────────────┼──────────────────┐                   │
│       │                  │                  │                   │
│  ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐              │
│  │ Economy │       │Matchmaking│      │ Rating  │              │
│  │ System  │       │  System   │      │ System  │              │
│  └─────────┘       └───────────┘      └─────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Generic Card Interface

```typescript
/**
 * Base interface for any card type.
 * Games extend this with their specific properties.
 */
interface BaseCard {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Base cost (for economy) */
  baseCost: number;
  
  /** Current tier (for upgrades) */
  tier: number;
}

// Example: Unit card for autobattler
interface UnitCard extends BaseCard {
  hp: number;
  atk: number;
  armor: number;
  role: string;
  ability?: string;
}

// Example: Spell card for card game
interface SpellCard extends BaseCard {
  manaCost: number;
  effect: string;
  targetType: 'single' | 'aoe' | 'self';
}
```

---

## Deck System

```typescript
// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DeckConfig<TCard extends BaseCard> {
  maxDeckSize: number;
  minDeckSize: number;
  allowDuplicates: boolean;
  maxCopies: number;
  validateCard?: (card: TCard) => boolean;
}

interface Deck<TCard extends BaseCard> {
  cards: TCard[];
  config: DeckConfig<TCard>;
}

interface DeckValidationResult {
  valid: boolean;
  errors: string[];
}

// ═══════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a new deck with the given cards and configuration.
 * 
 * @param cards - Initial cards in the deck
 * @param config - Deck configuration
 * @returns New deck instance
 * @throws Error if initial cards violate config
 */
function createDeck<TCard extends BaseCard>(
  cards: TCard[],
  config: DeckConfig<TCard>
): Deck<TCard> {
  const deck: Deck<TCard> = { cards: [...cards], config };
  const validation = validateDeck(deck);
  
  if (!validation.valid) {
    throw new Error(`Invalid deck: ${validation.errors.join(', ')}`);
  }
  
  return deck;
}

/**
 * Adds a card to the deck.
 * 
 * @param deck - Target deck
 * @param card - Card to add
 * @returns Updated deck (immutable)
 * @throws Error if deck is full or card invalid
 */
function addCard<TCard extends BaseCard>(
  deck: Deck<TCard>,
  card: TCard
): Deck<TCard> {
  if (deck.cards.length >= deck.config.maxDeckSize) {
    throw new Error('Deck is full');
  }
  
  if (deck.config.validateCard && !deck.config.validateCard(card)) {
    throw new Error('Card failed validation');
  }
  
  if (!deck.config.allowDuplicates) {
    const existing = deck.cards.find(c => c.id === card.id);
    if (existing) {
      throw new Error('Duplicates not allowed');
    }
  } else if (deck.config.maxCopies > 0) {
    const copies = deck.cards.filter(c => c.id === card.id).length;
    if (copies >= deck.config.maxCopies) {
      throw new Error(`Max ${deck.config.maxCopies} copies allowed`);
    }
  }
  
  return {
    ...deck,
    cards: [...deck.cards, card],
  };
}

/**
 * Shuffles the deck using seeded random for determinism.
 * Uses Fisher-Yates algorithm.
 * 
 * @param deck - Deck to shuffle
 * @param seed - Random seed
 * @returns Shuffled deck (immutable)
 */
function shuffleDeck<TCard extends BaseCard>(
  deck: Deck<TCard>,
  seed: number
): Deck<TCard> {
  const cards = [...deck.cards];
  const random = new SeededRandom(seed);
  
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  return { ...deck, cards };
}

/**
 * Draws cards from the top of the deck.
 * 
 * @param deck - Source deck
 * @param count - Number of cards to draw
 * @returns Tuple of [drawn cards, remaining deck]
 */
function drawCards<TCard extends BaseCard>(
  deck: Deck<TCard>,
  count: number
): [TCard[], Deck<TCard>] {
  const drawn = deck.cards.slice(0, count);
  const remaining = {
    ...deck,
    cards: deck.cards.slice(count),
  };
  
  return [drawn, remaining];
}

/**
 * Validates deck against its configuration.
 */
function validateDeck<TCard extends BaseCard>(
  deck: Deck<TCard>
): DeckValidationResult {
  const errors: string[] = [];
  
  if (deck.cards.length < deck.config.minDeckSize) {
    errors.push(`Deck has ${deck.cards.length} cards, minimum is ${deck.config.minDeckSize}`);
  }
  
  if (deck.cards.length > deck.config.maxDeckSize) {
    errors.push(`Deck has ${deck.cards.length} cards, maximum is ${deck.config.maxDeckSize}`);
  }
  
  if (!deck.config.allowDuplicates) {
    const ids = deck.cards.map(c => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      errors.push(`Duplicate cards found: ${[...new Set(duplicates)].join(', ')}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Hand System

```typescript
interface HandConfig {
  maxHandSize: number;
  startingHandSize: number;
  autoDiscard: boolean;
}

interface Hand<TCard extends BaseCard> {
  cards: TCard[];
  config: HandConfig;
}

/**
 * Creates a new empty hand.
 */
function createHand<TCard extends BaseCard>(
  config: HandConfig
): Hand<TCard> {
  return { cards: [], config };
}

/**
 * Adds cards to hand, respecting max size.
 * 
 * @param hand - Target hand
 * @param cards - Cards to add
 * @returns Updated hand and any discarded cards
 */
function addToHand<TCard extends BaseCard>(
  hand: Hand<TCard>,
  cards: TCard[]
): { hand: Hand<TCard>; discarded: TCard[] } {
  const newCards = [...hand.cards, ...cards];
  
  if (newCards.length <= hand.config.maxHandSize) {
    return {
      hand: { ...hand, cards: newCards },
      discarded: [],
    };
  }
  
  if (hand.config.autoDiscard) {
    const kept = newCards.slice(0, hand.config.maxHandSize);
    const discarded = newCards.slice(hand.config.maxHandSize);
    return {
      hand: { ...hand, cards: kept },
      discarded,
    };
  }
  
  throw new Error('Hand is full and autoDiscard is disabled');
}

/**
 * Removes a card from hand by ID.
 */
function removeFromHand<TCard extends BaseCard>(
  hand: Hand<TCard>,
  cardId: string
): Hand<TCard> {
  const index = hand.cards.findIndex(c => c.id === cardId);
  if (index === -1) {
    throw new Error(`Card ${cardId} not in hand`);
  }
  
  return {
    ...hand,
    cards: [...hand.cards.slice(0, index), ...hand.cards.slice(index + 1)],
  };
}
```

---

## Draft System

```typescript
interface DraftConfig {
  optionsCount: number;
  picksCount: number;
  type: 'pick' | 'ban' | 'pick-and-ban';
  allowSkip: boolean;
  rerollsAllowed: number;
}

interface Draft<TCard extends BaseCard> {
  pool: TCard[];
  options: TCard[];
  picked: TCard[];
  banned: TCard[];
  config: DraftConfig;
  rerollsUsed: number;
  seed: number;
}

interface DraftResult<TCard extends BaseCard> {
  picked: TCard[];
  banned: TCard[];
  skipped: boolean;
}

/**
 * Creates a new draft from a card pool.
 * 
 * @param pool - Available cards to draft from
 * @param config - Draft configuration
 * @param seed - Random seed for determinism
 */
function createDraft<TCard extends BaseCard>(
  pool: TCard[],
  config: DraftConfig,
  seed: number
): Draft<TCard> {
  const random = new SeededRandom(seed);
  const shuffled = [...pool].sort(() => random.next() - 0.5);
  const options = shuffled.slice(0, config.optionsCount);
  
  return {
    pool: shuffled.slice(config.optionsCount),
    options,
    picked: [],
    banned: [],
    config,
    rerollsUsed: 0,
    seed,
  };
}

/**
 * Picks a card from draft options.
 */
function pickCard<TCard extends BaseCard>(
  draft: Draft<TCard>,
  cardId: string
): Draft<TCard> {
  const card = draft.options.find(c => c.id === cardId);
  if (!card) {
    throw new Error(`Card ${cardId} not in options`);
  }
  
  if (draft.picked.length >= draft.config.picksCount) {
    throw new Error('Already picked maximum cards');
  }
  
  return {
    ...draft,
    options: draft.options.filter(c => c.id !== cardId),
    picked: [...draft.picked, card],
  };
}

/**
 * Bans a card from draft options.
 */
function banCard<TCard extends BaseCard>(
  draft: Draft<TCard>,
  cardId: string
): Draft<TCard> {
  if (draft.config.type === 'pick') {
    throw new Error('Banning not allowed in pick-only draft');
  }
  
  const card = draft.options.find(c => c.id === cardId);
  if (!card) {
    throw new Error(`Card ${cardId} not in options`);
  }
  
  return {
    ...draft,
    options: draft.options.filter(c => c.id !== cardId),
    banned: [...draft.banned, card],
  };
}

/**
 * Rerolls draft options (if allowed).
 */
function rerollOptions<TCard extends BaseCard>(
  draft: Draft<TCard>,
  newSeed: number
): Draft<TCard> {
  if (draft.rerollsUsed >= draft.config.rerollsAllowed) {
    throw new Error('No rerolls remaining');
  }
  
  const random = new SeededRandom(newSeed);
  const allAvailable = [...draft.pool, ...draft.options];
  const shuffled = allAvailable.sort(() => random.next() - 0.5);
  const newOptions = shuffled.slice(0, draft.config.optionsCount);
  
  return {
    ...draft,
    pool: shuffled.slice(draft.config.optionsCount),
    options: newOptions,
    rerollsUsed: draft.rerollsUsed + 1,
    seed: newSeed,
  };
}

/**
 * Checks if draft is complete.
 */
function isDraftComplete<TCard extends BaseCard>(
  draft: Draft<TCard>
): boolean {
  return draft.picked.length >= draft.config.picksCount;
}

/**
 * Gets draft result.
 */
function getDraftResult<TCard extends BaseCard>(
  draft: Draft<TCard>
): DraftResult<TCard> {
  return {
    picked: draft.picked,
    banned: draft.banned,
    skipped: draft.picked.length === 0 && draft.config.allowSkip,
  };
}
```

---

## Upgrade System

```typescript
interface UpgradeConfig<TCard extends BaseCard> {
  maxTier: number;
  tierNames: string[];
  calculateCost: (card: TCard, targetTier: number) => number;
  statMultiplier: (tier: number) => number;
  canUpgrade?: (card: TCard) => boolean;
}

/**
 * Gets the cost to upgrade a card to the next tier.
 */
function getUpgradeCost<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>
): number {
  if (card.tier >= config.maxTier) {
    return Infinity;
  }
  
  return config.calculateCost(card, card.tier + 1);
}

/**
 * Checks if a card can be upgraded.
 */
function canUpgrade<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>
): boolean {
  if (card.tier >= config.maxTier) {
    return false;
  }
  
  if (config.canUpgrade && !config.canUpgrade(card)) {
    return false;
  }
  
  return true;
}

/**
 * Upgrades a card to the next tier.
 * Returns new card with updated tier (immutable).
 */
function upgradeCard<TCard extends BaseCard>(
  card: TCard,
  config: UpgradeConfig<TCard>
): TCard {
  if (!canUpgrade(card, config)) {
    throw new Error('Card cannot be upgraded');
  }
  
  return {
    ...card,
    tier: card.tier + 1,
  };
}

/**
 * Gets stat multiplier for a tier.
 */
function getStatMultiplier<TCard extends BaseCard>(
  tier: number,
  config: UpgradeConfig<TCard>
): number {
  return config.statMultiplier(tier);
}

/**
 * Gets display name for a tier.
 */
function getTierName<TCard extends BaseCard>(
  tier: number,
  config: UpgradeConfig<TCard>
): string {
  return config.tierNames[tier - 1] ?? `Tier ${tier}`;
}
```

---

## Economy System

```typescript
interface EconomyConfig {
  startingAmount: number;
  currencyName: string;
  maxAmount: number;
  winReward: (streak: number, context?: unknown) => number;
  loseReward: (streak: number, context?: unknown) => number;
  interestRate: number;
  interestCap: number;
}

interface Wallet {
  amount: number;
  config: EconomyConfig;
}

/**
 * Creates a new wallet with starting amount.
 */
function createWallet(config: EconomyConfig): Wallet {
  return {
    amount: config.startingAmount,
    config,
  };
}

/**
 * Adds currency to wallet.
 */
function addCurrency(wallet: Wallet, amount: number): Wallet {
  let newAmount = wallet.amount + amount;
  
  if (wallet.config.maxAmount > 0) {
    newAmount = Math.min(newAmount, wallet.config.maxAmount);
  }
  
  return { ...wallet, amount: newAmount };
}

/**
 * Spends currency from wallet.
 * 
 * @throws Error if insufficient funds
 */
function spendCurrency(wallet: Wallet, amount: number): Wallet {
  if (wallet.amount < amount) {
    throw new Error(`Insufficient ${wallet.config.currencyName}: have ${wallet.amount}, need ${amount}`);
  }
  
  return { ...wallet, amount: wallet.amount - amount };
}

/**
 * Checks if wallet can afford an amount.
 */
function canAfford(wallet: Wallet, amount: number): boolean {
  return wallet.amount >= amount;
}

/**
 * Applies interest to wallet (for auto-battler style games).
 */
function applyInterest(wallet: Wallet): Wallet {
  if (wallet.config.interestRate === 0) {
    return wallet;
  }
  
  const interest = Math.min(
    Math.floor(wallet.amount * wallet.config.interestRate),
    wallet.config.interestCap
  );
  
  return addCurrency(wallet, interest);
}

/**
 * Calculates reward for win/loss.
 */
function getReward(
  won: boolean,
  streak: number,
  config: EconomyConfig,
  context?: unknown
): number {
  return won
    ? config.winReward(streak, context)
    : config.loseReward(streak, context);
}
```

---

## Run System

```typescript
type RunPhase = 'draft' | 'battle' | 'shop' | 'event' | 'boss' | 'rest';
type RunStatus = 'active' | 'won' | 'lost';

interface RunConfig {
  winsToComplete: number;
  maxLosses: number;
  phases: RunPhase[];
  trackStreaks: boolean;
  enableRating: boolean;
}

interface Run<TState> {
  id: string;
  config: RunConfig;
  wins: number;
  losses: number;
  currentPhaseIndex: number;
  winStreak: number;
  loseStreak: number;
  status: RunStatus;
  state: TState;
  history: RunEvent[];
}

interface RunEvent {
  type: 'win' | 'loss' | 'phase_change' | 'draft' | 'shop';
  timestamp: number;
  data?: unknown;
}

/**
 * Creates a new run.
 */
function createRun<TState>(
  config: RunConfig,
  initialState: TState
): Run<TState> {
  return {
    id: generateId(),
    config,
    wins: 0,
    losses: 0,
    currentPhaseIndex: 0,
    winStreak: 0,
    loseStreak: 0,
    status: 'active',
    state: initialState,
    history: [],
  };
}

/**
 * Records a win and updates streaks.
 */
function recordWin<TState>(run: Run<TState>): Run<TState> {
  const newWins = run.wins + 1;
  const newWinStreak = run.winStreak + 1;
  
  const status: RunStatus = newWins >= run.config.winsToComplete ? 'won' : 'active';
  
  return {
    ...run,
    wins: newWins,
    winStreak: newWinStreak,
    loseStreak: 0,
    status,
    history: [...run.history, { type: 'win', timestamp: Date.now() }],
  };
}

/**
 * Records a loss and updates streaks.
 */
function recordLoss<TState>(run: Run<TState>): Run<TState> {
  const newLosses = run.losses + 1;
  const newLoseStreak = run.loseStreak + 1;
  
  const status: RunStatus = newLosses >= run.config.maxLosses ? 'lost' : 'active';
  
  return {
    ...run,
    losses: newLosses,
    loseStreak: newLoseStreak,
    winStreak: 0,
    status,
    history: [...run.history, { type: 'loss', timestamp: Date.now() }],
  };
}

/**
 * Advances to the next phase.
 */
function advancePhase<TState>(run: Run<TState>): Run<TState> {
  const nextIndex = (run.currentPhaseIndex + 1) % run.config.phases.length;
  
  return {
    ...run,
    currentPhaseIndex: nextIndex,
    history: [...run.history, { 
      type: 'phase_change', 
      timestamp: Date.now(),
      data: { phase: run.config.phases[nextIndex] },
    }],
  };
}

/**
 * Gets current phase.
 */
function getCurrentPhase<TState>(run: Run<TState>): RunPhase {
  return run.config.phases[run.currentPhaseIndex];
}

/**
 * Checks if run is complete.
 */
function isRunComplete<TState>(run: Run<TState>): boolean {
  return run.status !== 'active';
}

/**
 * Gets run statistics.
 */
function getRunStats<TState>(run: Run<TState>): {
  wins: number;
  losses: number;
  winRate: number;
  longestWinStreak: number;
} {
  const totalGames = run.wins + run.losses;
  
  // Calculate longest win streak from history
  let longestStreak = 0;
  let currentStreak = 0;
  for (const event of run.history) {
    if (event.type === 'win') {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (event.type === 'loss') {
      currentStreak = 0;
    }
  }
  
  return {
    wins: run.wins,
    losses: run.losses,
    winRate: totalGames > 0 ? run.wins / totalGames : 0,
    longestWinStreak: longestStreak,
  };
}
```

---

## Presets

```typescript
// ═══════════════════════════════════════════════════════════════
// DECK PRESETS
// ═══════════════════════════════════════════════════════════════

export const ROGUELIKE_DECK_CONFIG: DeckConfig<BaseCard> = {
  maxDeckSize: 12,
  minDeckSize: 12,
  allowDuplicates: false,
  maxCopies: 1,
};

export const CCG_DECK_CONFIG: DeckConfig<BaseCard> = {
  maxDeckSize: 30,
  minDeckSize: 30,
  allowDuplicates: true,
  maxCopies: 2,
};

// ═══════════════════════════════════════════════════════════════
// DRAFT PRESETS
// ═══════════════════════════════════════════════════════════════

export const INITIAL_DRAFT_CONFIG: DraftConfig = {
  optionsCount: 5,
  picksCount: 3,
  type: 'pick',
  allowSkip: false,
  rerollsAllowed: 0,
};

export const POST_BATTLE_DRAFT_CONFIG: DraftConfig = {
  optionsCount: 3,
  picksCount: 1,
  type: 'pick',
  allowSkip: true,
  rerollsAllowed: 1,
};

// ═══════════════════════════════════════════════════════════════
// ECONOMY PRESETS
// ═══════════════════════════════════════════════════════════════

export const ROGUELIKE_ECONOMY_CONFIG: EconomyConfig = {
  startingAmount: 10,
  currencyName: 'Gold',
  maxAmount: 0,
  winReward: (streak) => 7 + (streak >= 3 ? (streak - 2) * 2 : 0),
  loseReward: () => 9,
  interestRate: 0,
  interestCap: 0,
};

// ═══════════════════════════════════════════════════════════════
// RUN PRESETS
// ═══════════════════════════════════════════════════════════════

export const ROGUELIKE_RUN_CONFIG: RunConfig = {
  winsToComplete: 9,
  maxLosses: 4,
  phases: ['draft', 'battle', 'shop'],
  trackStreaks: true,
  enableRating: true,
};
```

---

## Snapshot System

```typescript
interface SnapshotConfig {
  /** Snapshot expiry time in milliseconds */
  expiryMs: number;
  
  /** Maximum snapshots per player */
  maxSnapshotsPerPlayer: number;
  
  /** Include full state or summary only */
  includeFullState: boolean;
  
  /** Maximum total snapshots in pool (0 = unlimited) */
  maxTotalSnapshots: number;
  
  /** Cleanup strategy when limit reached */
  cleanupStrategy: 'oldest' | 'lowest-rating' | 'random';
}

interface Snapshot<TState> {
  id: string;
  playerId: string;
  runId: string;
  wins: number;
  losses: number;
  rating: number;
  state: TState;
  createdAt: number;
  sizeBytes?: number;
}

interface MatchmakingConfig {
  /** Rating range for matching */
  ratingRange: number;
  
  /** Wins range for matching */
  winsRange: number;
  
  /** Enable bot fallback */
  botFallback: boolean;
  
  /** Bot difficulty scaling */
  botDifficultyScale: (wins: number) => number;
}

interface SnapshotPoolStats {
  totalCount: number;
  totalSizeBytes: number;
  oldestTimestamp: number;
  byWins: Map<number, number>;  // wins -> count
}

/**
 * Creates a snapshot of current run state.
 * Automatically enforces per-player limits.
 */
function createSnapshot<TState>(
  run: Run<TState>,
  playerId: string,
  config: SnapshotConfig
): Snapshot<TState> {
  return {
    id: generateId(),
    playerId,
    runId: run.id,
    wins: run.wins,
    losses: run.losses,
    rating: 1000, // From run state
    state: config.includeFullState ? run.state : {} as TState,
    createdAt: Date.now(),
  };
}

/**
 * Enforces snapshot limits by removing excess snapshots.
 * 
 * @param snapshots - Current snapshot pool
 * @param newSnapshot - Snapshot being added
 * @param config - Snapshot configuration
 * @returns Filtered snapshots with limits enforced
 */
function enforceSnapshotLimits<TState>(
  snapshots: Snapshot<TState>[],
  newSnapshot: Snapshot<TState>,
  config: SnapshotConfig
): Snapshot<TState>[] {
  let result = [...snapshots];
  
  // 1. Remove expired snapshots
  result = filterExpiredSnapshots(result, config);
  
  // 2. Enforce per-player limit
  const playerSnapshots = result.filter(s => s.playerId === newSnapshot.playerId);
  if (playerSnapshots.length >= config.maxSnapshotsPerPlayer) {
    const oldest = playerSnapshots.sort((a, b) => a.createdAt - b.createdAt)[0];
    result = result.filter(s => s.id !== oldest.id);
  }
  
  // 3. Enforce total limit
  if (config.maxTotalSnapshots > 0 && result.length >= config.maxTotalSnapshots) {
    result = applyCleanupStrategy(result, config);
  }
  
  return result;
}

/**
 * Applies cleanup strategy to reduce snapshot count.
 */
function applyCleanupStrategy<TState>(
  snapshots: Snapshot<TState>[],
  config: SnapshotConfig
): Snapshot<TState>[] {
  const toRemove = Math.ceil(snapshots.length * 0.1); // Remove 10%
  
  switch (config.cleanupStrategy) {
    case 'oldest':
      return snapshots
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, -toRemove);
    
    case 'lowest-rating':
      return snapshots
        .sort((a, b) => b.rating - a.rating)
        .slice(0, -toRemove);
    
    case 'random':
      const shuffled = [...snapshots].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, -toRemove);
    
    default:
      return snapshots;
  }
}

/**
 * Gets statistics about the snapshot pool.
 */
function getSnapshotPoolStats<TState>(
  snapshots: Snapshot<TState>[]
): SnapshotPoolStats {
  const byWins = new Map<number, number>();
  let totalSize = 0;
  let oldest = Date.now();
  
  for (const s of snapshots) {
    byWins.set(s.wins, (byWins.get(s.wins) ?? 0) + 1);
    totalSize += s.sizeBytes ?? 0;
    oldest = Math.min(oldest, s.createdAt);
  }
  
  return {
    totalCount: snapshots.length,
    totalSizeBytes: totalSize,
    oldestTimestamp: oldest,
    byWins,
  };
}

/**
 * Finds a matching opponent from snapshot pool.
 * 
 * @param run - Current run
 * @param snapshots - Available opponent snapshots
 * @param config - Matchmaking configuration
 * @returns Matching snapshot or null if no match found
 */
function findOpponent<TState>(
  run: Run<TState>,
  snapshots: Snapshot<TState>[],
  config: MatchmakingConfig
): Snapshot<TState> | null {
  // Filter by wins range
  const byWins = snapshots.filter(s => 
    Math.abs(s.wins - run.wins) <= config.winsRange
  );
  
  // Filter by rating range
  const byRating = byWins.filter(s => 
    Math.abs(s.rating - 1000) <= config.ratingRange
  );
  
  if (byRating.length === 0) {
    return null;
  }
  
  // Random selection from filtered
  return byRating[Math.floor(Math.random() * byRating.length)];
}

/**
 * Checks if snapshot is expired.
 */
function isSnapshotExpired<TState>(
  snapshot: Snapshot<TState>,
  config: SnapshotConfig
): boolean {
  return Date.now() - snapshot.createdAt > config.expiryMs;
}

/**
 * Filters out expired snapshots.
 */
function filterExpiredSnapshots<TState>(
  snapshots: Snapshot<TState>[],
  config: SnapshotConfig
): Snapshot<TState>[] {
  return snapshots.filter(s => !isSnapshotExpired(s, config));
}
```

### Storage Estimates

| Scenario | Snapshots | Size per Snapshot | Total Size |
|----------|-----------|-------------------|------------|
| Small (100 players) | 1,000 | 2 KB | ~2 MB |
| Medium (1,000 players) | 10,000 | 2 KB | ~20 MB |
| Large (10,000 players) | 100,000 | 2 KB | ~200 MB |

**Mitigation strategies:**
- 24h expiry removes stale snapshots automatically
- Per-player limit (10) prevents spam
- Total limit (10,000) caps storage
- Cleanup removes 10% when limit reached
- `includeFullState: false` stores only team composition (~1-2 KB)
```

### Snapshot Presets

```typescript
export const ROGUELIKE_SNAPSHOT_CONFIG: SnapshotConfig = {
  expiryMs: 24 * 60 * 60 * 1000, // 24 hours
  maxSnapshotsPerPlayer: 10,
  includeFullState: false,       // Only team composition (~2 KB)
  maxTotalSnapshots: 10000,      // ~20 MB max
  cleanupStrategy: 'oldest',
};

export const ROGUELIKE_MATCHMAKING_CONFIG: MatchmakingConfig = {
  ratingRange: 200,
  winsRange: 1,
  botFallback: true,
  botDifficultyScale: (wins) => 0.5 + wins * 0.1, // 50% + 10% per win
};

export const ROGUELIKE_BOT_CONFIG: BotConfig = {
  baseDifficulty: 0.5,
  difficultyPerWin: 0.05,
  maxDifficulty: 0.95,
  nameGenerator: (wins) => `Bot_${wins}W`,
};
```

### Bot Generator

```typescript
interface BotConfig {
  baseDifficulty: number;
  difficultyPerWin: number;
  maxDifficulty: number;
  nameGenerator?: (wins: number) => string;
}

interface BotTeam<TCard extends BaseCard> {
  name: string;
  cards: TCard[];
  difficulty: number;
}

/**
 * Generates a bot opponent when no snapshots are available.
 * Bot difficulty scales with player's current wins.
 * 
 * @param wins - Player's current win count
 * @param availableCards - Pool of cards to build bot team from
 * @param config - Bot configuration
 * @param seed - Random seed for determinism
 */
function generateBot<TCard extends BaseCard>(
  wins: number,
  availableCards: TCard[],
  config: BotConfig,
  seed: number
): BotTeam<TCard> {
  const difficulty = Math.min(
    config.baseDifficulty + wins * config.difficultyPerWin,
    config.maxDifficulty
  );
  
  const random = new SeededRandom(seed);
  const name = config.nameGenerator?.(wins) ?? `Bot_${wins}`;
  
  // Higher difficulty = more high-tier cards
  const cards = selectBotCards(availableCards, difficulty, random);
  
  return { name, cards, difficulty };
}

/**
 * Selects cards for bot team based on difficulty.
 * Higher difficulty = more T2/T3 cards, better composition.
 */
function selectBotCards<TCard extends BaseCard>(
  pool: TCard[],
  difficulty: number,
  random: SeededRandom
): TCard[] {
  // Tier distribution based on difficulty
  // difficulty 0.5 = mostly T1
  // difficulty 0.95 = mostly T2/T3
  const tierWeights = {
    1: 1 - difficulty,      // T1 weight decreases with difficulty
    2: difficulty * 0.6,    // T2 weight increases
    3: difficulty * 0.4,    // T3 weight increases slower
  };
  
  // Select cards weighted by tier
  const selected: TCard[] = [];
  const maxCards = 12; // Standard deck size
  
  while (selected.length < maxCards && pool.length > 0) {
    const card = weightedSelect(pool, tierWeights, random);
    if (card) {
      selected.push(card);
      pool = pool.filter(c => c.id !== card.id);
    }
  }
  
  return selected;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Deck System Properties

**Property 1: Deck size invariant after add**
*For any* valid deck and valid card, adding the card should increase deck size by exactly 1.
**Validates: Requirements 1.2**

**Property 2: Shuffle determinism**
*For any* deck and seed, shuffling twice with the same seed should produce identical card orderings.
**Validates: Requirements 1.2**

**Property 3: Draw preserves total cards**
*For any* deck with N cards, drawing K cards (where K ≤ N) should return exactly K cards and leave N-K cards in deck.
**Validates: Requirements 1.2**

**Property 4: Validation catches all violations**
*For any* deck that violates config constraints (size, duplicates, maxCopies), validateDeck should return valid=false with appropriate errors.
**Validates: Requirements 1.2**

### Hand System Properties

**Property 5: Hand respects max size**
*For any* hand with autoDiscard=true, after adding cards the hand size should never exceed maxHandSize.
**Validates: Requirements 2.2**

**Property 6: Remove decreases size**
*For any* hand containing a card, removing that card should decrease hand size by exactly 1.
**Validates: Requirements 2.2**

### Draft System Properties

**Property 7: Draft options count**
*For any* pool and config, createDraft should produce exactly min(optionsCount, pool.length) options.
**Validates: Requirements 3.2**

**Property 8: Draft determinism**
*For any* pool, config, and seed, creating a draft twice with the same inputs should produce identical options.
**Validates: Requirements 3.2**

**Property 9: Pick removes from options**
*For any* draft and valid card pick, the picked card should be removed from options and added to picked array.
**Validates: Requirements 3.2**

**Property 10: Reroll limit enforcement**
*For any* draft, attempting more than rerollsAllowed rerolls should throw an error.
**Validates: Requirements 3.2**

### Upgrade System Properties

**Property 11: Upgrade increases tier**
*For any* upgradeable card, upgrading should increase tier by exactly 1.
**Validates: Requirements 4.2**

**Property 12: Max tier blocks upgrade**
*For any* card at maxTier, canUpgrade should return false and upgradeCard should throw.
**Validates: Requirements 4.2**

### Economy System Properties

**Property 13: Currency cap enforcement**
*For any* wallet with maxAmount > 0, the amount should never exceed maxAmount after any operation.
**Validates: Requirements 5.2**

**Property 14: Spend validation**
*For any* wallet, spending more than available amount should throw an error.
**Validates: Requirements 5.2**

**Property 15: Interest calculation**
*For any* wallet, applyInterest should add min(amount * interestRate, interestCap) to the wallet.
**Validates: Requirements 5.2**

### Run System Properties

**Property 16: Win completion**
*For any* run, when wins reaches winsToComplete, status should become 'won'.
**Validates: Requirements 6.2**

**Property 17: Loss elimination**
*For any* run, when losses reaches maxLosses, status should become 'lost'.
**Validates: Requirements 6.2**

**Property 18: Streak tracking**
*For any* run, consecutive wins should increment winStreak and reset loseStreak (and vice versa).
**Validates: Requirements 6.2**

**Property 19: Phase cycling**
*For any* run with N phases, advancePhase should cycle through phases 0 → 1 → ... → N-1 → 0.
**Validates: Requirements 6.2**

**Property 20: Stats accuracy**
*For any* run, getRunStats should return winRate = wins / (wins + losses) and correct longestWinStreak from history.
**Validates: Requirements 6.2**

### Snapshot System Properties

**Property 21: Snapshot expiry**
*For any* snapshot older than expiryMs, isSnapshotExpired should return true.
**Validates: Requirements 7.1**

**Property 22: Matchmaking wins filter**
*For any* run and snapshot pool, findOpponent should only return snapshots within winsRange of run.wins.
**Validates: Requirements 7.2**

**Property 23: Matchmaking rating filter**
*For any* run and snapshot pool, findOpponent should only return snapshots within ratingRange of run rating.
**Validates: Requirements 7.5**

**Property 24: Per-player snapshot limit**
*For any* player, the number of their snapshots should never exceed maxSnapshotsPerPlayer after enforceSnapshotLimits.
**Validates: Requirements 7.3**

**Property 25: Total snapshot limit**
*For any* snapshot pool, the total count should never exceed maxTotalSnapshots after enforceSnapshotLimits.
**Validates: Requirements 7.3**

**Property 26: Bot difficulty scaling**
*For any* wins count, generateBot should produce a bot with difficulty = min(baseDifficulty + wins * difficultyPerWin, maxDifficulty).
**Validates: Requirements 7.6**

**Property 27: Bot tier distribution**
*For any* bot with difficulty D, the proportion of T2/T3 cards should increase with D.
**Validates: Requirements 7.6**

---

## Public API

```typescript
// core/progression/index.ts

// Deck
export { createDeck, addCard, removeCard, shuffleDeck, drawCards, validateDeck } from './deck/deck';
export type { Deck, DeckConfig, DeckValidationResult } from './deck/deck.types';

// Hand
export { createHand, addToHand, removeFromHand, isHandFull } from './hand/hand';
export type { Hand, HandConfig } from './hand/hand.types';

// Draft
export { createDraft, pickCard, banCard, rerollOptions, isDraftComplete, getDraftResult } from './draft/draft';
export type { Draft, DraftConfig, DraftResult } from './draft/draft.types';
export { INITIAL_DRAFT_CONFIG, POST_BATTLE_DRAFT_CONFIG } from './draft/draft.presets';

// Upgrade
export { getUpgradeCost, canUpgrade, upgradeCard, getStatMultiplier, getTierName } from './upgrade/upgrade';
export type { UpgradeConfig } from './upgrade/upgrade.types';
export { STANDARD_TIERS, SIMPLE_TIERS } from './upgrade/upgrade.presets';

// Economy
export { createWallet, addCurrency, spendCurrency, canAfford, applyInterest, getReward } from './economy/economy';
export type { Wallet, EconomyConfig } from './economy/economy.types';
export { ROGUELIKE_ECONOMY_CONFIG, AUTOBATTLER_ECONOMY_CONFIG } from './economy/economy.presets';

// Run
export { createRun, recordWin, recordLoss, advancePhase, getCurrentPhase, isRunComplete, getRunStats } from './run/run';
export type { Run, RunConfig, RunPhase, RunStatus, RunEvent } from './run/run.types';
export { ROGUELIKE_RUN_CONFIG, BOSS_RUSH_RUN_CONFIG, ENDLESS_RUN_CONFIG } from './run/run.presets';

// Snapshot & Matchmaking
export { createSnapshot, findOpponent, isSnapshotExpired, filterExpiredSnapshots } from './snapshot/snapshot';
export type { Snapshot, SnapshotConfig, MatchmakingConfig } from './snapshot/snapshot.types';
export { ROGUELIKE_SNAPSHOT_CONFIG, ROGUELIKE_MATCHMAKING_CONFIG } from './snapshot/snapshot.presets';

// Base types
export type { BaseCard } from './types';
```

---

## Testing Strategy

### Property-Based Testing

All correctness properties will be tested using **fast-check** library for TypeScript.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with property reference: `**Feature: core-progression, Property N: description**`

**Generators:**
- `arbitraryBaseCard()` — generates random BaseCard instances
- `arbitraryDeck(config)` — generates valid decks for given config
- `arbitraryHand(config)` — generates valid hands for given config
- `arbitraryWallet(config)` — generates wallets with random amounts
- `arbitraryRun(config)` — generates runs with random win/loss history

### Unit Tests

Unit tests cover:
- Edge cases (empty deck, full hand, zero currency)
- Error conditions (invalid operations, constraint violations)
- Preset configurations (ROGUELIKE_DECK_CONFIG, etc.)

### Integration Tests

Integration tests verify:
- Full roguelike flow: deck → draft → hand → battle → shop
- Economy integration with upgrades
- Run progression with win/loss tracking
- Determinism (same seed = same results across all systems)
