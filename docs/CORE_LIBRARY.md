# Core Library Documentation

> **Status:** Active development — Core 1.0 and Core 3.0 complete.

## Overview

The core library (`backend/src/core/` and `frontend/src/core/`) contains game-agnostic modules that can be reused across multiple projects.

## Version History

| Version | Name | Status | Description |
|---------|------|--------|-------------|
| Core 1.0 | Extraction | ✅ Complete | Grid, Battle, Targeting, Turn-order |
| Core 2.0 | Mechanics | ⬜ Planned | Combat mechanics (Resolve, Flanking) |
| Core 3.0 | Progression | ✅ Complete | Deck, Draft, Upgrade, Economy, Run, Snapshot |

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

Seven interconnected systems for roguelike/deckbuilder progression. All systems are generic, deterministic, and immutable.

> **Full documentation:** See `backend/src/core/progression/README.md`

### BaseCard Interface

```typescript
interface BaseCard {
  id: string;       // Unique identifier
  name: string;     // Display name
  baseCost: number; // Cost for economy
  tier: number;     // Current tier (1-5)
}
```

### Systems Summary

| System | Purpose | Key Functions |
|--------|---------|---------------|
| **Deck** | Card collection | `createDeck`, `shuffleDeck`, `drawCards` |
| **Hand** | Hand management | `createHand`, `addToHand`, `isHandFull` |
| **Draft** | Pick/ban drafting | `createDraft`, `pickCard`, `banCard` |
| **Upgrade** | Tier upgrades | `upgradeCard`, `getUpgradeCost`, `getStatMultiplier` |
| **Economy** | Currency/rewards | `createWallet`, `addCurrency`, `getReward` |
| **Run** | Run progression | `createRun`, `recordWin`, `recordLoss` |
| **Snapshot** | Async matchmaking | `createSnapshot`, `findOpponent`, `generateBot` |

### Presets

Ready-to-use configurations for different game types:

**Draft:**
- `INITIAL_DRAFT_CONFIG` — 5 options, pick 3 (run start)
- `POST_BATTLE_DRAFT_CONFIG` — 3 options, pick 1, skip allowed
- `ARENA_DRAFT_CONFIG` — Pick-and-ban mode

**Upgrade:**
- `STANDARD_TIERS` — T1/T2/T3 (100%/150%/200%)
- `ROGUELIKE_TIERS` — Bronze/Silver/Gold
- `LEGENDARY_TIERS` — Common/Rare/Epic/Legendary

**Economy:**
- `ROGUELIKE_ECONOMY_CONFIG` — Streak bonuses, no interest
- `AUTOBATTLER_ECONOMY_CONFIG` — 10% interest, capped at 5

**Run:**
- `ROGUELIKE_RUN_CONFIG` — 9 wins, 4 losses
- `ARENA_RUN_CONFIG` — 12 wins, 3 losses
- `ENDLESS_RUN_CONFIG` — Infinite mode

**Snapshot:**
- `ROGUELIKE_SNAPSHOT_CONFIG` — 24h expiry, 10k pool
- `ROGUELIKE_MATCHMAKING_CONFIG` — ±200 rating, ±1 wins
- `ROGUELIKE_BOT_CONFIG` — 50-95% difficulty scaling

### Quick Example

```typescript
import {
  createDeck, shuffleDeck, drawCards,
  createWallet, addCurrency, getReward,
  createRun, recordWin, isRunComplete,
  ROGUELIKE_RUN_CONFIG, ROGUELIKE_ECONOMY_CONFIG,
} from '@core/progression';

// Initialize
let wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
let run = createRun(ROGUELIKE_RUN_CONFIG, { deck: myDeck });

// After battle win
run = recordWin(run);
const reward = getReward(true, run.winStreak, wallet.config);
wallet = addCurrency(wallet, reward);

if (isRunComplete(run)) {
  console.log(`Run ${run.status}!`);
}
```

---

## See Also

- `backend/src/core/progression/README.md` — Full progression documentation
- `.kiro/specs/core-extraction/` — Core extraction specification
- `.kiro/specs/core-progression/` — Progression systems specification
- `docs/ARCHITECTURE.md` — System architecture
- `docs/ROGUELIKE_DESIGN.md` — Roguelike mode design
