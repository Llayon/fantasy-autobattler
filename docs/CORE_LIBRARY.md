# Core Library Documentation

> **Status:** Active development — Core 1.0 complete, Core 3.0 (Progression) in progress.

## Overview

The core library (`backend/src/core/` and `frontend/src/core/`) contains game-agnostic modules that can be reused across multiple projects.

## Version History

| Version | Name | Status | Description |
|---------|------|--------|-------------|
| Core 1.0 | Extraction | ✅ Complete | Grid, Battle, Targeting, Turn-order |
| Core 2.0 | Mechanics | ⬜ Planned | Combat mechanics (Resolve, Flanking) |
| Core 3.0 | Progression | 🔄 In Progress | Deck, Draft, Upgrade, Economy, Run, Snapshot |

## Backend Core Modules

```
backend/src/core/
├── grid/           # Grid utilities, A* pathfinding
├── battle/         # Damage, turn order, targeting
├── abilities/      # Ability execution, status effects
├── types/          # Core type definitions
├── utils/          # Seeded random, helpers
├── events/         # Event system for battle logging
├── constants/      # Default configuration values
└── progression/    # 🆕 Core 3.0 - Progression systems
    ├── deck/       # Card collection management
    ├── hand/       # Hand management with overflow
    ├── draft/      # Pick/ban card drafting
    ├── upgrade/    # Tier upgrade system
    ├── economy/    # Currency and rewards
    ├── run/        # Run-based progression
    └── snapshot/   # Async matchmaking snapshots
```

### Frontend Core Components

```
frontend/src/core/
├── components/     # BattleGrid, UnitCard, BattleReplay
├── hooks/          # useBattleReplay, useGridNavigation
└── types/          # Shared interfaces
```

## Configuration Interfaces

### GridConfig

```typescript
interface GridConfig {
  width: number;      // Grid width (default: 8)
  height: number;     // Grid height (default: 10)
  playerRows: number[];  // Player placement rows
  enemyRows: number[];   // Enemy placement rows
}
```

### BattleConfig

```typescript
interface BattleConfig {
  maxRounds: number;      // Maximum battle rounds
  minDamage: number;      // Minimum damage per hit
  dodgeCapPercent: number; // Maximum dodge chance
}
```

## Migration Path

After core extraction, imports will change:

```typescript
// Old (still works via re-exports)
import { isValidPosition } from '../battle/grid';

// New (recommended)
import { isValidPosition } from '@core/grid';
```

---

## Core 3.0: Progression Systems

### BaseCard Interface

All progression systems work with cards extending `BaseCard`:

```typescript
interface BaseCard {
  id: string;       // Unique identifier
  name: string;     // Display name
  baseCost: number; // Cost for economy
  tier: number;     // Current tier (1-5)
}
```

### Deck System

```typescript
import { createDeck, addCard, shuffleDeck, drawCards } from '@core/progression';

const deck = createDeck(cards, {
  maxDeckSize: 12,
  minDeckSize: 12,
  allowDuplicates: false,
  maxCopies: 1,
});

const shuffled = shuffleDeck(deck, seed);
const [drawn, remaining] = drawCards(shuffled, 5);
```

### Hand System

```typescript
import { createHand, addToHand, isHandFull } from '@core/progression';

const hand = createHand({
  maxHandSize: 7,
  startingHandSize: 5,
  autoDiscard: true,
});

const { hand: newHand, discarded } = addToHand(hand, drawnCards);
```

### Draft System

```typescript
import { createDraft, pickCard, getDraftResult } from '@core/progression';

const draft = createDraft(cardPool, {
  optionsCount: 3,
  picksCount: 1,
  type: 'pick',
  allowSkip: true,
  rerollsAllowed: 1,
}, seed);

const afterPick = pickCard(draft, selectedCardId);
const result = getDraftResult(afterPick);
```

### Economy System

```typescript
import { createWallet, addCurrency, spendCurrency, canAfford } from '@core/progression';

const wallet = createWallet({
  startingAmount: 10,
  currencyName: 'Gold',
  maxAmount: 0, // unlimited
  winReward: (streak) => 7 + streak,
  loseReward: () => 9,
  interestRate: 0,
  interestCap: 0,
});

if (canAfford(wallet, 15)) {
  const newWallet = spendCurrency(wallet, 15);
}
```

### Run System

```typescript
import { createRun, recordWin, recordLoss, isRunComplete } from '@core/progression';

const run = createRun({
  winsToComplete: 9,
  maxLosses: 4,
  phases: ['draft', 'battle', 'shop'],
  trackStreaks: true,
  enableRating: true,
}, initialState);

const afterWin = recordWin(run);
if (isRunComplete(afterWin)) {
  console.log('Run finished:', afterWin.status);
}
```

### Snapshot System

```typescript
import { createSnapshot, findOpponent, generateBot } from '@core/progression';

const snapshot = createSnapshot(run, playerId, {
  expiryMs: 24 * 60 * 60 * 1000,
  maxSnapshotsPerPlayer: 10,
  includeFullState: false,
  maxTotalSnapshots: 10000,
  cleanupStrategy: 'oldest',
});

const opponent = findOpponent(run, snapshots, matchmakingConfig);
if (!opponent) {
  const bot = generateBot(run.wins, availableCards, botConfig, seed);
}
```

---

## See Also

- `.kiro/specs/core-extraction/` — Full extraction specification
- `docs/ARCHITECTURE.md` — System architecture

---

*This document will be updated after core-extraction spec is complete.*
