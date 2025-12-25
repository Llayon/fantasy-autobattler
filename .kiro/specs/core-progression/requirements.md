# Requirements: Core Progression Systems

## Overview

Переиспользуемые системы прогрессии для roguelike/deckbuilder игр. Включает: колоду, руку, драфт, апгрейды, экономику, run-based прогрессию, снапшоты и матчмейкинг. Все системы модульные и конфигурируемые.

## Relationship to Existing Specs

| Spec | Relationship |
|------|--------------|
| `core-extraction` (1.0) | Базовая библиотека (grid, battle) |
| `core-mechanics-2.0` | Боевые механики (опционально) |
| `roguelike-run` | Потребитель (использует эти системы) |

## Version Strategy

```
core 1.0 (extraction)     → Grid, Battle, Targeting, Turn-order
core 2.0 (mechanics)      → Combat mechanics (Resolve, Flanking, etc.)
core 3.0 (progression)    → Deck, Draft, Upgrade, Economy, Run, Snapshot
```

---

## Requirements

### REQ-1: Deck System
**Priority**: Critical

#### REQ-1.1: DeckConfig Interface
```typescript
interface DeckConfig<TCard> {
  /** Maximum cards in deck */
  maxDeckSize: number;
  
  /** Minimum cards in deck */
  minDeckSize: number;
  
  /** Allow duplicate cards */
  allowDuplicates: boolean;
  
  /** Max copies of same card (if duplicates allowed) */
  maxCopies: number;
  
  /** Card validator function */
  validateCard?: (card: TCard) => boolean;
}
```

#### REQ-1.2: Deck Operations
- `createDeck<TCard>(cards, config)` — создание колоды
- `addCard(deck, card)` — добавление карты
- `removeCard(deck, cardId)` — удаление карты
- `shuffleDeck(deck, seed)` — перемешивание (детерминистичное)
- `drawCards(deck, count)` — взятие карт сверху
- `getDeckSize(deck)` — размер колоды
- `validateDeck(deck, config)` — валидация колоды


### REQ-2: Hand System
**Priority**: Critical

#### REQ-2.1: HandConfig Interface
```typescript
interface HandConfig {
  /** Maximum cards in hand */
  maxHandSize: number;
  
  /** Starting hand size */
  startingHandSize: number;
  
  /** Auto-discard excess cards */
  autoDiscard: boolean;
}
```

#### REQ-2.2: Hand Operations
- `createHand<TCard>(config)` — создание руки
- `addToHand(hand, cards)` — добавление карт в руку
- `removeFromHand(hand, cardId)` — удаление карты из руки
- `getHandSize(hand)` — размер руки
- `isHandFull(hand)` — проверка заполненности
- `discardExcess(hand)` — сброс лишних карт

---

### REQ-3: Draft System
**Priority**: Critical

#### REQ-3.1: DraftConfig Interface
```typescript
interface DraftConfig {
  /** Cards shown per draft */
  optionsCount: number;
  
  /** Cards to pick per draft */
  picksCount: number;
  
  /** Draft type */
  type: 'pick' | 'ban' | 'pick-and-ban';
  
  /** Allow skipping draft */
  allowSkip: boolean;
  
  /** Reroll options (if any) */
  rerollsAllowed: number;
}
```

#### REQ-3.2: Draft Operations
- `createDraft<TCard>(pool, config, seed)` — создание драфта
- `getDraftOptions(draft)` — получение опций
- `pickCard(draft, cardId)` — выбор карты
- `banCard(draft, cardId)` — бан карты
- `rerollOptions(draft, seed)` — перебросить опции
- `skipDraft(draft)` — пропустить драфт
- `isDraftComplete(draft)` — проверка завершения
- `getDraftResult(draft)` — результат драфта

#### REQ-3.3: Draft Presets
```typescript
// Initial draft (roguelike start)
const INITIAL_DRAFT: DraftConfig = {
  optionsCount: 5,
  picksCount: 3,
  type: 'pick',
  allowSkip: false,
  rerollsAllowed: 0,
};

// Post-battle draft
const POST_BATTLE_DRAFT: DraftConfig = {
  optionsCount: 3,
  picksCount: 1,
  type: 'pick',
  allowSkip: true,
  rerollsAllowed: 1,
};

// Arena draft (pick-ban)
const ARENA_DRAFT: DraftConfig = {
  optionsCount: 3,
  picksCount: 1,
  type: 'pick-and-ban',
  allowSkip: false,
  rerollsAllowed: 0,
};
```

---

### REQ-4: Upgrade System
**Priority**: High

#### REQ-4.1: UpgradeConfig Interface
```typescript
interface UpgradeConfig<TCard> {
  /** Maximum tier */
  maxTier: number;
  
  /** Tier names for display */
  tierNames: string[];
  
  /** Cost calculation function */
  calculateCost: (card: TCard, targetTier: number) => number;
  
  /** Stat multiplier per tier */
  statMultiplier: (tier: number) => number;
  
  /** Upgrade validator */
  canUpgrade?: (card: TCard) => boolean;
}
```

#### REQ-4.2: Upgrade Operations
- `getUpgradeCost(card, targetTier, config)` — стоимость апгрейда
- `canUpgrade(card, config)` — можно ли апгрейдить
- `upgradeCard(card, config)` — выполнить апгрейд
- `getUpgradedStats(card, tier, config)` — получить статы после апгрейда
- `getTierName(tier, config)` — название тира

#### REQ-4.3: Upgrade Presets
```typescript
// Standard tier system (T1 → T2 → T3)
const STANDARD_TIERS: UpgradeConfig = {
  maxTier: 3,
  tierNames: ['Common', 'Rare', 'Epic'],
  calculateCost: (card, tier) => {
    if (tier === 2) return card.baseCost;        // 100%
    if (tier === 3) return card.baseCost * 1.5;  // 150%
    return 0;
  },
  statMultiplier: (tier) => {
    if (tier === 1) return 1.0;   // 100%
    if (tier === 2) return 1.5;   // 150%
    if (tier === 3) return 2.0;   // 200%
    return 1.0;
  },
};

// Simple upgrade (+1 per tier)
const SIMPLE_TIERS: UpgradeConfig = {
  maxTier: 5,
  tierNames: ['+0', '+1', '+2', '+3', '+4'],
  calculateCost: (card, tier) => tier * 10,
  statMultiplier: (tier) => 1 + (tier - 1) * 0.1,
};
```

---

### REQ-5: Economy System
**Priority**: High

#### REQ-5.1: EconomyConfig Interface
```typescript
interface EconomyConfig {
  /** Starting currency */
  startingAmount: number;
  
  /** Currency name */
  currencyName: string;
  
  /** Maximum currency (0 = unlimited) */
  maxAmount: number;
  
  /** Win reward calculation */
  winReward: (streak: number, context?: unknown) => number;
  
  /** Lose reward calculation */
  loseReward: (streak: number, context?: unknown) => number;
  
  /** Interest rate per round (0 = none) */
  interestRate: number;
  
  /** Interest cap */
  interestCap: number;
}
```

#### REQ-5.2: Economy Operations
- `createWallet(config)` — создание кошелька
- `addCurrency(wallet, amount)` — добавление валюты
- `spendCurrency(wallet, amount)` — трата валюты
- `canAfford(wallet, amount)` — проверка достаточности
- `applyInterest(wallet, config)` — начисление процентов
- `getReward(won, streak, config)` — расчёт награды

#### REQ-5.3: Economy Presets
```typescript
// Roguelike economy
const ROGUELIKE_ECONOMY: EconomyConfig = {
  startingAmount: 10,
  currencyName: 'Gold',
  maxAmount: 0,  // Unlimited
  winReward: (streak) => 7 + (streak >= 3 ? (streak - 2) * 2 : 0),
  loseReward: () => 9,  // Catch-up mechanic
  interestRate: 0,
  interestCap: 0,
};

// Auto-battler economy (with interest)
const AUTOBATTLER_ECONOMY: EconomyConfig = {
  startingAmount: 5,
  currencyName: 'Gold',
  maxAmount: 100,
  winReward: (streak) => 3 + Math.min(streak, 5),
  loseReward: (streak) => 3 + Math.min(streak, 5),
  interestRate: 0.1,  // 10% per round
  interestCap: 5,     // Max 5g interest
};
```

---

### REQ-6: Run System
**Priority**: Critical

#### REQ-6.1: RunConfig Interface
```typescript
interface RunConfig {
  /** Wins needed to complete run */
  winsToComplete: number;
  
  /** Losses allowed before run ends */
  maxLosses: number;
  
  /** Run phases */
  phases: RunPhase[];
  
  /** Enable streak tracking */
  trackStreaks: boolean;
  
  /** Enable rating system */
  enableRating: boolean;
}

type RunPhase = 
  | 'draft'
  | 'battle'
  | 'shop'
  | 'event'
  | 'boss'
  | 'rest';
```

#### REQ-6.2: Run Operations
- `createRun<TState>(config, initialState)` — создание рана
- `advancePhase(run)` — переход к следующей фазе
- `recordWin(run)` — записать победу
- `recordLoss(run)` — записать поражение
- `isRunComplete(run)` — проверка завершения
- `getRunResult(run)` — результат рана (win/lose)
- `getRunStats(run)` — статистика рана

#### REQ-6.3: Run Presets
```typescript
// Standard roguelike run
const ROGUELIKE_RUN: RunConfig = {
  winsToComplete: 9,
  maxLosses: 4,
  phases: ['draft', 'battle', 'shop'],
  trackStreaks: true,
  enableRating: true,
};

// Boss rush run
const BOSS_RUSH_RUN: RunConfig = {
  winsToComplete: 5,
  maxLosses: 1,
  phases: ['draft', 'boss'],
  trackStreaks: false,
  enableRating: false,
};

// Endless run
const ENDLESS_RUN: RunConfig = {
  winsToComplete: Infinity,
  maxLosses: 3,
  phases: ['draft', 'battle', 'event', 'shop'],
  trackStreaks: true,
  enableRating: true,
};
```

---

### REQ-7: Snapshot & Matchmaking System
**Priority**: Medium

#### REQ-7.1: SnapshotConfig Interface
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
```

#### REQ-7.2: Snapshot Interface
```typescript
interface Snapshot<TState> {
  id: string;
  playerId: string;
  runId: string;
  wins: number;
  losses: number;
  rating: number;
  state: TState;           // Team composition only, not full battle state
  createdAt: number;
  sizeBytes?: number;      // For monitoring
}
```

#### REQ-7.3: Storage Constraints
- **Per-player limit**: Max 10 snapshots per player (configurable)
- **Total pool limit**: Max 10,000 snapshots globally (configurable)
- **Expiry**: 24 hours default (configurable)
- **State size**: Only team composition stored (~1-2 KB per snapshot)
- **Cleanup**: Automatic on create if limits exceeded

**Estimated storage:**
- 10,000 snapshots × 2 KB = ~20 MB total
- With 1,000 active players × 10 snapshots = 10,000 snapshots max

#### REQ-7.3: MatchmakingConfig Interface
```typescript
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
```

#### REQ-7.4: Snapshot Operations
- `createSnapshot(run, playerId, config)` — создание снапшота из рана
- `isSnapshotExpired(snapshot, config)` — проверка истечения
- `filterExpiredSnapshots(snapshots, config)` — очистка старых снапшотов
- `enforceSnapshotLimits(snapshots, config)` — применение лимитов (per-player, total)
- `getSnapshotPoolStats(snapshots)` — статистика пула (count, size, oldest)

#### REQ-7.5: Matchmaking Operations
- `findOpponent(run, snapshots, config)` — поиск оппонента по wins/rating
- `generateBot(wins, config)` — генерация бота (fallback когда нет снапшотов)

#### REQ-7.6: Bot Generation
```typescript
interface BotConfig {
  /** Base difficulty (0.0 - 1.0) */
  baseDifficulty: number;
  
  /** Difficulty scaling per win */
  difficultyPerWin: number;
  
  /** Max difficulty cap */
  maxDifficulty: number;
  
  /** Bot name generator */
  nameGenerator?: (wins: number) => string;
}

// Bot difficulty affects:
// - Unit tier distribution (more T2/T3 at higher difficulty)
// - Team composition quality
// - Positioning strategy
```

#### REQ-7.7: Snapshot Presets
```typescript
// Roguelike snapshot config
const ROGUELIKE_SNAPSHOT: SnapshotConfig = {
  expiryMs: 24 * 60 * 60 * 1000,  // 24 hours
  maxSnapshotsPerPlayer: 10,
  includeFullState: false,        // Only team composition
  maxTotalSnapshots: 10000,       // ~20 MB max
  cleanupStrategy: 'oldest',
};

// Roguelike matchmaking config
const ROGUELIKE_MATCHMAKING: MatchmakingConfig = {
  ratingRange: 200,
  winsRange: 1,
  botFallback: true,
  botDifficultyScale: (wins) => 0.5 + wins * 0.1,
};

// Bot config for fallback when no snapshots available
const ROGUELIKE_BOT: BotConfig = {
  baseDifficulty: 0.5,      // 50% at 0 wins
  difficultyPerWin: 0.05,   // +5% per win
  maxDifficulty: 0.95,      // Cap at 95%
  nameGenerator: (wins) => `Bot_${wins}W`,
};
```

#### REQ-7.8: Storage Optimization
- **Minimal state**: Store only unit IDs, positions, tiers (not full stats)
- **Compression**: Optional gzip for state field
- **Indexing**: Index by (wins, rating) for fast matchmaking queries
- **Partitioning**: Consider partitioning by wins count for large pools

---

### REQ-8: File Structure
**Priority**: High

```
backend/src/core/
├── grid/                    # ✅ Core 1.0
├── battle/                  # ✅ Core 1.0
├── mechanics/               # ✅ Core 2.0
│
├── progression/             # 🆕 Core 3.0
│   ├── deck/
│   │   ├── deck.types.ts
│   │   ├── deck.ts
│   │   └── deck.spec.ts
│   │
│   ├── hand/
│   │   ├── hand.types.ts
│   │   ├── hand.ts
│   │   └── hand.spec.ts
│   │
│   ├── draft/
│   │   ├── draft.types.ts
│   │   ├── draft.ts
│   │   ├── draft.presets.ts
│   │   └── draft.spec.ts
│   │
│   ├── upgrade/
│   │   ├── upgrade.types.ts
│   │   ├── upgrade.ts
│   │   ├── upgrade.presets.ts
│   │   └── upgrade.spec.ts
│   │
│   ├── economy/
│   │   ├── economy.types.ts
│   │   ├── economy.ts
│   │   ├── economy.presets.ts
│   │   └── economy.spec.ts
│   │
│   ├── run/
│   │   ├── run.types.ts
│   │   ├── run.ts
│   │   ├── run.presets.ts
│   │   └── run.spec.ts
│   │
│   ├── snapshot/
│   │   ├── snapshot.types.ts
│   │   ├── snapshot.ts
│   │   ├── snapshot.presets.ts
│   │   └── snapshot.spec.ts
│   │
│   └── index.ts
│
└── index.ts                 # Re-exports all
```

---

## Success Criteria

1. ✅ Все системы generic (работают с любым типом карт)
2. ✅ Все операции детерминистичны (seeded random)
3. ✅ Конфигурируемые пресеты для разных игр
4. ✅ 100% покрытие тестами
5. ✅ Нет зависимостей от game-specific кода
6. ✅ JSDoc документация для всех публичных API

---

## Out of Scope

- UI компоненты (остаются в game-specific коде)
- Persistence (БД entities — в game/)
- NestJS интеграция (services — в game/)
- Game-specific данные (юниты, фракции)

---

## Dependencies

- `core-extraction` (1.0) — для seeded random
- Нет зависимости от `core-mechanics-2.0`
