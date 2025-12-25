# Core Progression Systems

> **Version:** Core 3.0  
> **Status:** Complete

Reusable progression systems for roguelike and deckbuilder games. All systems are:

- **Generic** — Work with any card type extending `BaseCard`
- **Deterministic** — Use seeded random for reproducibility
- **Immutable** — All operations return new state
- **Configurable** — Presets for different game types

## Quick Start

```typescript
import {
  // Types
  BaseCard,
  // Deck
  createDeck, shuffleDeck, drawCards,
  // Hand
  createHand, addToHand,
  // Draft
  createDraft, pickCard, getDraftResult,
  // Upgrade
  upgradeCard, getUpgradeCost, STANDARD_TIERS,
  // Economy
  createWallet, addCurrency, spendCurrency, getReward, ROGUELIKE_ECONOMY_CONFIG,
  // Run
  createRun, recordWin, recordLoss, isRunComplete, ROGUELIKE_RUN_CONFIG,
  // Snapshot
  createSnapshot, findOpponent, generateBot, ROGUELIKE_SNAPSHOT_CONFIG,
} from '@core/progression';
```

## Systems Overview

| System | Purpose | Key Functions |
|--------|---------|---------------|
| **Deck** | Card collection management | `createDeck`, `shuffleDeck`, `drawCards` |
| **Hand** | Hand management with overflow | `createHand`, `addToHand`, `isHandFull` |
| **Draft** | Pick/ban card drafting | `createDraft`, `pickCard`, `banCard` |
| **Upgrade** | Tier upgrade system | `upgradeCard`, `getUpgradeCost`, `getStatMultiplier` |
| **Economy** | Currency and rewards | `createWallet`, `addCurrency`, `getReward` |
| **Run** | Run-based progression | `createRun`, `recordWin`, `recordLoss` |
| **Snapshot** | Async matchmaking | `createSnapshot`, `findOpponent`, `generateBot` |

---

## BaseCard Interface

All systems work with cards extending `BaseCard`:

```typescript
interface BaseCard {
  id: string;       // Unique identifier
  name: string;     // Display name
  baseCost: number; // Cost for economy
  tier: number;     // Current tier (1-5)
}

// Example: Unit card for autobattler
interface UnitCard extends BaseCard {
  hp: number;
  atk: number;
  armor: number;
  role: 'tank' | 'dps' | 'support';
}
```

---

## Deck System

Manages card collections with shuffle, draw, and validation.

### Functions

| Function | Description |
|----------|-------------|
| `createDeck(cards, config)` | Create deck with validation |
| `addCard(deck, card)` | Add card (checks duplicates/max) |
| `removeCard(deck, cardId)` | Remove card by ID |
| `shuffleDeck(deck, seed)` | Deterministic shuffle |
| `drawCards(deck, count)` | Draw from top → `[drawn, remaining]` |
| `validateDeck(deck)` | Check deck validity |

### Configuration

```typescript
interface DeckConfig<TCard> {
  maxDeckSize: number;      // Maximum cards allowed
  minDeckSize: number;      // Minimum cards required
  allowDuplicates: boolean; // Allow same card multiple times
  maxCopies: number;        // Max copies per card (if duplicates allowed)
  validateCard?: (card: TCard) => boolean; // Custom validation
}
```

### Example

```typescript
const deck = createDeck(myCards, {
  maxDeckSize: 12,
  minDeckSize: 12,
  allowDuplicates: false,
  maxCopies: 1,
});

const shuffled = shuffleDeck(deck, 12345);
const [hand, remaining] = drawCards(shuffled, 5);
```

---

## Hand System

Manages cards in hand with overflow handling.

### Functions

| Function | Description |
|----------|-------------|
| `createHand(config)` | Create empty hand |
| `addToHand(hand, cards)` | Add cards → `{ hand, discarded }` |
| `removeFromHand(hand, cardId)` | Remove card by ID |
| `isHandFull(hand)` | Check if at max capacity |
| `getHandSpace(hand)` | Get available slots |
| `discardExcess(hand)` | Trim to max size |

### Configuration

```typescript
interface HandConfig {
  maxHandSize: number;      // Maximum cards in hand
  startingHandSize: number; // Initial draw count
  autoDiscard: boolean;     // Auto-discard overflow (newest first)
}
```

### Example

```typescript
const hand = createHand({
  maxHandSize: 7,
  startingHandSize: 5,
  autoDiscard: true,
});

const { hand: newHand, discarded } = addToHand(hand, drawnCards);
if (discarded.length > 0) {
  console.log('Discarded:', discarded.map(c => c.name));
}
```

---

## Draft System

Pick/ban card drafting with reroll support.

### Functions

| Function | Description |
|----------|-------------|
| `createDraft(pool, config, seed)` | Create draft from card pool |
| `getDraftOptions(draft)` | Get current options |
| `pickCard(draft, cardId)` | Pick a card |
| `banCard(draft, cardId)` | Ban a card (pick-and-ban mode) |
| `rerollOptions(draft, newSeed)` | Reroll options (if allowed) |
| `skipDraft(draft)` | Skip without picking |
| `isDraftComplete(draft)` | Check if draft is done |
| `getDraftResult(draft)` | Get picked/banned cards |

### Configuration

```typescript
interface DraftConfig {
  optionsCount: number;     // Cards shown per round
  picksCount: number;       // Cards to pick
  type: 'pick' | 'pick-and-ban';
  allowSkip: boolean;       // Allow skipping
  rerollsAllowed: number;   // Reroll limit
}
```

### Presets

| Preset | Options | Picks | Type | Skip | Rerolls |
|--------|---------|-------|------|------|---------|
| `INITIAL_DRAFT_CONFIG` | 5 | 3 | pick | ❌ | 0 |
| `POST_BATTLE_DRAFT_CONFIG` | 3 | 1 | pick | ✅ | 1 |
| `ARENA_DRAFT_CONFIG` | 5 | 2 | pick-and-ban | ❌ | 0 |

### Example

```typescript
const draft = createDraft(cardPool, POST_BATTLE_DRAFT_CONFIG, seed);

// Show options to player
const options = getDraftOptions(draft);

// Player picks a card
const afterPick = pickCard(draft, selectedCardId);

// Get result
const result = getDraftResult(afterPick);
console.log('Picked:', result.picked);
```

---

## Upgrade System

Tier-based card upgrades with stat scaling.

### Functions

| Function | Description |
|----------|-------------|
| `getUpgradeCost(card, config)` | Get cost to upgrade |
| `canUpgrade(card, config)` | Check if upgradeable |
| `upgradeCard(card, config)` | Upgrade to next tier |
| `getStatMultiplier(tier, config)` | Get stat multiplier |
| `getTierName(tier, config)` | Get display name |
| `isMaxTier(card, config)` | Check if at max |

### Presets

| Preset | Tiers | Names | Multipliers |
|--------|-------|-------|-------------|
| `STANDARD_TIERS` | 3 | T1/T2/T3 | 100%/150%/200% |
| `SIMPLE_TIERS` | 5 | +0 to +4 | +25% per tier |
| `LEGENDARY_TIERS` | 4 | Common/Rare/Epic/Legendary | 100%/130%/170%/250% |
| `ROGUELIKE_TIERS` | 3 | Bronze/Silver/Gold | 100%/150%/200% |

### Example

```typescript
import { upgradeCard, getUpgradeCost, ROGUELIKE_TIERS } from '@core/progression';

const cost = getUpgradeCost(myCard, ROGUELIKE_TIERS);
if (canAfford(wallet, cost)) {
  const newWallet = spendCurrency(wallet, cost);
  const upgradedCard = upgradeCard(myCard, ROGUELIKE_TIERS);
  console.log(`Upgraded to ${getTierName(upgradedCard.tier, ROGUELIKE_TIERS)}`);
}
```

---

## Economy System

Currency management with rewards and interest.

### Functions

| Function | Description |
|----------|-------------|
| `createWallet(config)` | Create wallet with starting amount |
| `addCurrency(wallet, amount)` | Add currency (respects cap) |
| `spendCurrency(wallet, amount)` | Spend currency |
| `canAfford(wallet, amount)` | Check if affordable |
| `applyInterest(wallet)` | Apply interest (autobattler style) |
| `getReward(won, streak, config)` | Calculate battle reward |
| `getBalance(wallet)` | Get current amount |

### Configuration

```typescript
interface EconomyConfig {
  startingAmount: number;
  currencyName: string;
  maxAmount: number;        // 0 = unlimited
  winReward: (streak: number, context?: unknown) => number;
  loseReward: (streak: number, context?: unknown) => number;
  interestRate: number;     // 0.1 = 10%
  interestCap: number;      // Max interest per round
}
```

### Presets

| Preset | Start | Max | Win | Lose | Interest |
|--------|-------|-----|-----|------|----------|
| `ROGUELIKE_ECONOMY_CONFIG` | 10 | ∞ | 7 + streak | 9 | 0% |
| `AUTOBATTLER_ECONOMY_CONFIG` | 5 | 100 | 1 + streak | 1 + streak | 10% (cap 5) |
| `CARD_GAME_ECONOMY_CONFIG` | 100 | 9999 | 25 | 10 | 0% |
| `ARENA_ECONOMY_CONFIG` | 0 | ∞ | 10 + 5×streak | 0 | 0% |

### Example

```typescript
const wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);

// After battle
const reward = getReward(true, run.winStreak, wallet.config);
const newWallet = addCurrency(wallet, reward);

// Shop purchase
if (canAfford(newWallet, 15)) {
  const afterPurchase = spendCurrency(newWallet, 15);
}
```

---

## Run System

Run-based progression with win/loss tracking and phases.

### Functions

| Function | Description |
|----------|-------------|
| `createRun(config, initialState)` | Create new run |
| `recordWin(run, timestamp?)` | Record win, update streaks |
| `recordLoss(run, timestamp?)` | Record loss, update streaks |
| `advancePhase(run, timestamp?)` | Move to next phase |
| `getCurrentPhase(run)` | Get current phase |
| `isRunComplete(run)` | Check if won/lost |
| `getRunResult(run)` | Get status |
| `getRunStats(run)` | Get statistics |
| `updateRunState(run, newState)` | Update game state |

### Configuration

```typescript
interface RunConfig {
  winsToComplete: number;   // Wins needed to complete
  maxLosses: number;        // Losses before elimination
  phases: RunPhase[];       // Phase cycle (e.g., ['draft', 'battle', 'shop'])
  trackStreaks: boolean;    // Track win/lose streaks
  enableRating: boolean;    // Enable rating changes
}

type RunPhase = 'draft' | 'battle' | 'shop' | 'rest' | 'event' | 'boss';
type RunStatus = 'active' | 'won' | 'lost';
```

### Presets

| Preset | Wins | Losses | Phases |
|--------|------|--------|--------|
| `ROGUELIKE_RUN_CONFIG` | 9 | 4 | draft → battle → shop |
| `BOSS_RUSH_RUN_CONFIG` | 5 | 1 | battle → rest |
| `ENDLESS_RUN_CONFIG` | 999 | 3 | battle → shop → event |
| `ARENA_RUN_CONFIG` | 12 | 3 | draft → battle |
| `TUTORIAL_RUN_CONFIG` | 3 | 5 | battle |

### Example

```typescript
const run = createRun(ROGUELIKE_RUN_CONFIG, { deck: myDeck, gold: 10 });

// Game loop
while (!isRunComplete(run)) {
  const phase = getCurrentPhase(run);
  
  switch (phase) {
    case 'battle':
      const won = await playBattle(run);
      run = won ? recordWin(run) : recordLoss(run);
      break;
    case 'shop':
      run = await handleShop(run);
      break;
  }
  
  run = advancePhase(run);
}

console.log(`Run ${getRunResult(run)}!`, getRunStats(run));
```

---

## Snapshot System

Asynchronous PvP matchmaking with bot fallback.

### Functions

| Function | Description |
|----------|-------------|
| `createSnapshot(run, playerId, rating, config)` | Create snapshot |
| `isSnapshotExpired(snapshot, config)` | Check expiry |
| `filterExpiredSnapshots(snapshots, config)` | Remove expired |
| `enforceSnapshotLimits(snapshots, newSnapshot, config)` | Apply limits |
| `applyCleanupStrategy(snapshots, config, seed?)` | Cleanup excess |
| `getSnapshotPoolStats(snapshots)` | Get pool statistics |
| `findOpponent(wins, rating, snapshots, config, seed?)` | Find match |
| `generateBot(wins, cards, config, seed)` | Generate bot |
| `selectBotCards(pool, difficulty, seed, maxCards)` | Select bot cards |

### Snapshot Configuration

```typescript
interface SnapshotConfig {
  expiryMs: number;           // Snapshot lifetime
  maxSnapshotsPerPlayer: number;
  includeFullState: boolean;  // Include full game state
  maxTotalSnapshots: number;  // Pool size limit
  cleanupStrategy: 'oldest' | 'lowest-rating' | 'random';
}
```

### Matchmaking Configuration

```typescript
interface MatchmakingConfig {
  ratingRange: number;        // Max rating difference
  winsRange: number;          // Max wins difference
  botFallback: boolean;       // Generate bot if no match
  botDifficultyScale: (wins: number) => number;
}
```

### Bot Configuration

```typescript
interface BotConfig {
  baseDifficulty: number;     // Starting difficulty (0-1)
  difficultyPerWin: number;   // Difficulty increase per win
  maxDifficulty: number;      // Maximum difficulty
  nameGenerator?: (wins: number) => string;
}
```

### Presets

**Snapshot:**
| Preset | Expiry | Per Player | Total | Cleanup |
|--------|--------|------------|-------|---------|
| `ROGUELIKE_SNAPSHOT_CONFIG` | 24h | 10 | 10k | oldest |
| `ARENA_SNAPSHOT_CONFIG` | 12h | 20 | 50k | lowest-rating |
| `CASUAL_SNAPSHOT_CONFIG` | 48h | 5 | 5k | random |

**Matchmaking:**
| Preset | Rating Range | Wins Range |
|--------|--------------|------------|
| `ROGUELIKE_MATCHMAKING_CONFIG` | ±200 | ±1 |
| `ARENA_MATCHMAKING_CONFIG` | ±300 | 0 (exact) |
| `CASUAL_MATCHMAKING_CONFIG` | ±500 | ±3 |

**Bot:**
| Preset | Base | Per Win | Max |
|--------|------|---------|-----|
| `ROGUELIKE_BOT_CONFIG` | 50% | +5% | 95% |
| `EASY_BOT_CONFIG` | 30% | +3% | 70% |
| `HARD_BOT_CONFIG` | 70% | +5% | 99% |

### Example

```typescript
// After battle, save snapshot
const snapshot = createSnapshot(run, playerId, rating, ROGUELIKE_SNAPSHOT_CONFIG);
const pool = enforceSnapshotLimits(existingPool, snapshot, ROGUELIKE_SNAPSHOT_CONFIG);

// Find opponent for next battle
const opponent = findOpponent(
  run.wins,
  rating,
  pool,
  ROGUELIKE_MATCHMAKING_CONFIG,
  seed
);

if (opponent) {
  // Battle against snapshot
  await battle(run, opponent.state);
} else {
  // Generate bot fallback
  const bot = generateBot(run.wins, cardPool, ROGUELIKE_BOT_CONFIG, seed);
  await battle(run, bot);
}
```

---

## Full Roguelike Flow Example

```typescript
import {
  createDeck, shuffleDeck, drawCards,
  createHand, addToHand,
  createDraft, pickCard, getDraftResult,
  createWallet, addCurrency, spendCurrency, getReward,
  upgradeCard, getUpgradeCost,
  createRun, recordWin, recordLoss, advancePhase, getCurrentPhase, isRunComplete,
  createSnapshot, findOpponent, generateBot,
  ROGUELIKE_RUN_CONFIG, ROGUELIKE_ECONOMY_CONFIG, ROGUELIKE_TIERS,
  INITIAL_DRAFT_CONFIG, POST_BATTLE_DRAFT_CONFIG,
  ROGUELIKE_SNAPSHOT_CONFIG, ROGUELIKE_MATCHMAKING_CONFIG, ROGUELIKE_BOT_CONFIG,
} from '@core/progression';

// 1. Initialize run
let wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
let deck = createDeck([], { maxDeckSize: 12, minDeckSize: 0, allowDuplicates: false, maxCopies: 1 });
let run = createRun(ROGUELIKE_RUN_CONFIG, { deck, wallet });

// 2. Initial draft (pick 3 from 5)
const initialDraft = createDraft(cardPool, INITIAL_DRAFT_CONFIG, seed);
// ... player picks cards ...
const draftResult = getDraftResult(initialDraft);
for (const card of draftResult.picked) {
  deck = addCard(deck, card);
}

// 3. Game loop
while (!isRunComplete(run)) {
  const phase = getCurrentPhase(run);
  
  switch (phase) {
    case 'battle': {
      // Find opponent
      const opponent = findOpponent(run.wins, rating, snapshotPool, ROGUELIKE_MATCHMAKING_CONFIG, seed);
      const enemy = opponent ?? generateBot(run.wins, cardPool, ROGUELIKE_BOT_CONFIG, seed);
      
      // Battle
      const won = await simulateBattle(deck, enemy);
      run = won ? recordWin(run) : recordLoss(run);
      
      // Reward
      const reward = getReward(won, run.winStreak, wallet.config);
      wallet = addCurrency(wallet, reward);
      
      // Save snapshot
      if (won) {
        const snapshot = createSnapshot(run, playerId, rating, ROGUELIKE_SNAPSHOT_CONFIG);
        snapshotPool = enforceSnapshotLimits(snapshotPool, snapshot, ROGUELIKE_SNAPSHOT_CONFIG);
      }
      break;
    }
    
    case 'draft': {
      // Post-battle draft (pick 1 from 3)
      const draft = createDraft(cardPool, POST_BATTLE_DRAFT_CONFIG, seed);
      // ... player picks ...
      break;
    }
    
    case 'shop': {
      // Upgrade cards
      for (const card of deck.cards) {
        const cost = getUpgradeCost(card, ROGUELIKE_TIERS);
        if (canAfford(wallet, cost)) {
          wallet = spendCurrency(wallet, cost);
          const upgraded = upgradeCard(card, ROGUELIKE_TIERS);
          deck = removeCard(deck, card.id);
          deck = addCard(deck, upgraded);
        }
      }
      break;
    }
  }
  
  run = advancePhase(run);
}

console.log(`Run complete: ${run.status}`);
```

---

## Design Principles

1. **Pure Functions** — No side effects, same inputs = same outputs
2. **Immutability** — All operations return new state, never mutate
3. **Determinism** — Seeded random for reproducible results
4. **Generics** — Work with any card type extending `BaseCard`
5. **Presets** — Ready-to-use configurations for common scenarios
6. **No Game Logic** — Core systems are game-agnostic

---

## See Also

- `docs/CORE_LIBRARY.md` — Core library overview
- `.kiro/specs/core-progression/` — Full specification
- `docs/ROGUELIKE_DESIGN.md` — Roguelike mode design document
