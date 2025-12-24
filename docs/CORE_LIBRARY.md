# Core Library Documentation

> **Status:** Placeholder — will be completed after core-extraction spec execution.

## Overview

The core library (`backend/src/core/` and `frontend/src/core/`) will contain game-agnostic modules that can be reused across multiple projects.

## Planned Structure

### Backend Core Modules

```
backend/src/core/
├── grid/           # Grid utilities, A* pathfinding
├── battle/         # Damage, turn order, targeting
├── abilities/      # Ability execution, status effects
├── types/          # Core type definitions
├── utils/          # Seeded random, helpers
└── events/         # Event system for battle logging
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

## See Also

- `.kiro/specs/core-extraction/` — Full extraction specification
- `docs/ARCHITECTURE.md` — System architecture

---

*This document will be updated after core-extraction spec is complete.*
