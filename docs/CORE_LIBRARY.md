# Core Library Documentation

> **Status:** Active development — Core 1.0, Core 2.0, and Core 3.0 complete.

## Overview

The core library (`backend/src/core/` and `frontend/src/core/`) contains game-agnostic modules that can be reused across multiple projects.

## Version History

| Version | Name | Status | Description |
|---------|------|--------|-------------|
| Core 1.0 | Extraction | ✅ Complete | Grid, Battle, Targeting, Turn-order |
| Core 2.0 | Mechanics | ✅ Complete | Combat mechanics (14 modular systems) |
| Core 3.0 | Progression | ✅ Complete | Deck, Draft, Upgrade, Economy, Run, Snapshot |

## Backend Core Modules

```
backend/src/core/
├── grid/           # Grid utilities, A* pathfinding
├── battle/         # Damage, turn order, targeting
├── mechanics/      # 🆕 Core 2.0 - Modular combat mechanics
│   ├── config/     # Types, defaults, presets, validation
│   ├── tier0/      # Facing (directional combat)
│   ├── tier1/      # Resolve, Engagement, Flanking
│   ├── tier2/      # Riposte, Intercept, Aura
│   ├── tier3/      # Charge, Overwatch, Phalanx, LoS, Ammo
│   └── tier4/      # Contagion, Armor Shred
├── abilities/      # Ability execution, status effects
├── types/          # Core type definitions
├── utils/          # Seeded random, helpers
├── events/         # Event system for battle logging
├── constants/      # Default configuration values
└── progression/    # Core 3.0 - Progression systems
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

## Core 2.0: Mechanics System

Modular battle mechanics with feature flags. All mechanics are optional and can be enabled/disabled independently while maintaining full backward compatibility with Core 1.0.

> **Full documentation:** See `backend/src/core/mechanics/README.md` and `backend/src/core/README.md`

### Presets

| Preset | Description | Mechanics Enabled |
|--------|-------------|-------------------|
| `MVP_PRESET` | All disabled | None (Core 1.0 behavior) |
| `TACTICAL_PRESET` | Tier 0-2 | facing, flanking, resolve, engagement, riposte, intercept |
| `ROGUELIKE_PRESET` | All enabled | All 14 mechanics |

### Mechanics by Tier

| Tier | Mechanics | Description |
|------|-----------|-------------|
| 0 | Facing | Directional combat (N/S/E/W), attack arcs |
| 1 | Resolve, Engagement, Flanking | Morale, ZoC, damage bonuses |
| 2 | Riposte, Intercept, Aura | Counter-attacks, movement blocking, area effects |
| 3 | Charge, Overwatch, Phalanx, LoS, Ammo | Momentum, vigilance, formations, ranged |
| 4 | Contagion, Armor Shred | Status spread, armor degradation |

### Quick Example

```typescript
import {
  createMechanicsProcessor,
  MVP_PRESET,
  ROGUELIKE_PRESET,
} from '@core/mechanics';
import { simulateBattle } from '../battle/battle.simulator';

// MVP mode (identical to Core 1.0)
const mvpProcessor = createMechanicsProcessor(MVP_PRESET);
const result1 = simulateBattle(playerTeam, enemyTeam, seed, mvpProcessor);

// Roguelike mode (all mechanics)
const roguelikeProcessor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result2 = simulateBattle(playerTeam, enemyTeam, seed, roguelikeProcessor);

// Custom configuration (dependencies auto-resolved)
const customProcessor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  resolve: { maxResolve: 100, baseRegeneration: 5 },
});
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
