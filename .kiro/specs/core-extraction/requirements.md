# Requirements: Core Library Extraction

## Overview
Extract reusable core modules from the Fantasy Autobattler MVP to enable code reuse across multiple game projects (card games, strategies, PvP games).

## Motivation
- Current MVP has battle simulation, grid system, pathfinding tightly coupled with game-specific logic
- Need to separate generic engine code from game-specific content
- Enable rapid prototyping of new games using proven battle mechanics

## Requirements

### REQ-1: Backend Core Module Structure
**Priority**: High

Create `backend/src/core/` folder with reusable modules:

#### REQ-1.1: Grid System (`core/grid/`)
- `grid.ts` - Grid utilities (position validation, distance calculations)
- `pathfinding.ts` - A* pathfinding algorithm
- `config.ts` - Grid configuration interface
- **Parameterization**: Accept `GridConfig { width, height }` instead of hardcoded constants

#### REQ-1.2: Battle Engine (`core/battle/`)
- `damage.ts` - Damage calculation formulas (configurable via `DamageConfig`)
- `turn-order.ts` - Initiative-based turn queue
- `targeting.ts` - Target selection algorithms
- `actions.ts` - Action execution framework
- `config.ts` - Battle configuration interface
- **Parameterization**: Accept `BattleConfig { maxRounds, damageFormula }` 

#### REQ-1.3: Ability System (`core/abilities/`)
- `executor.ts` - Ability execution framework
- `effects.ts` - Status effect system
- **Parameterization**: Generic ability interfaces for extension

#### REQ-1.4: Core Types (`core/types/`)
- `battle.types.ts` - Battle-related interfaces
- `ability.types.ts` - Ability-related interfaces
- `grid.types.ts` - Grid-related interfaces
- `config.types.ts` - Configuration interfaces

### REQ-2: Configuration System
**Priority**: High

Create configurable interfaces for game customization:

```typescript
// core/types/config.types.ts
interface GridConfig {
  width: number;
  height: number;
  playerRows: number[];
  enemyRows: number[];
}

interface BattleConfig {
  maxRounds: number;
  minDamage: number;
  dodgeCapPercent: number;
}

interface DamageConfig {
  physicalFormula: (atk: number, armor: number, atkCount: number) => number;
  magicFormula: (atk: number, atkCount: number) => number;
}
```

### REQ-3: Game-Specific Module Structure
**Priority**: High

Keep game-specific code in `backend/src/game/`:
- `units/unit.data.ts` - Unit definitions (15 units)
- `abilities/ability.data.ts` - Ability definitions
- `battle/synergies.ts` - Synergy system
- `battle/ai.decision.ts` - AI decision logic
- `battle/bot-generator.ts` - Bot team generation
- `battle/passive.abilities.ts` - Passive ability triggers
- `config/game.config.ts` - Game-specific configuration (8×10 grid, 30 budget, etc.)

### REQ-4: Frontend Core Components
**Priority**: Medium

Create `frontend/src/core/` with reusable components:

#### REQ-4.1: Core Components (`core/components/`)
- `BattleGrid.tsx` - Generic grid renderer (accepts `GridConfig`)
- `UnitCard.tsx` - Unit display component (generic props)
- `BattleReplay.tsx` - Replay player (event-driven)
- `StatusEffects.tsx` - Effect indicators
- `HealthBar.tsx` - HP visualization

#### REQ-4.2: Core Hooks (`core/hooks/`)
- `useBattleReplay.ts` - Replay state management
- `useGridNavigation.ts` - Grid interaction logic

#### REQ-4.3: Core Types (`core/types/`)
- `index.ts` - Shared TypeScript interfaces

### REQ-5: Test Organization
**Priority**: High

Organize tests alongside core modules:

#### REQ-5.1: Backend Core Tests
- `core/grid/grid.spec.ts` - Grid utility tests
- `core/grid/pathfinding.spec.ts` - A* algorithm tests
- `core/battle/damage.spec.ts` - Damage formula tests
- `core/battle/turn-order.spec.ts` - Turn queue tests
- `core/battle/targeting.spec.ts` - Target selection tests
- `core/abilities/executor.spec.ts` - Ability execution tests
- `core/abilities/effects.spec.ts` - Status effect tests

#### REQ-5.2: Test Independence
- Core tests must not depend on game-specific data
- Use mock/fixture data for testing
- Tests should work with any `GridConfig`/`BattleConfig`

### REQ-6: Backward Compatibility
**Priority**: Critical

- All existing imports must continue working
- Re-export from original locations
- No breaking changes to API
- All 650+ tests must pass
- Deprecation warnings for old import paths (optional)

### REQ-7: Documentation
**Priority**: High

- `backend/src/core/README.md` - Core library documentation
- `frontend/src/core/README.md` - Frontend core documentation
- Update `docs/ARCHITECTURE.md` with new structure
- Update `.kiro/steering/project-context.md`
- Add JSDoc to all public functions

### REQ-8: Future npm Package Preparation (Optional)
**Priority**: Low

Prepare for potential extraction to separate npm package:
- `backend/src/core/package.json` (placeholder)
- Clear dependency boundaries
- No NestJS-specific code in core (pure functions only)

## Success Criteria
1. `npm run build` passes in both backend and frontend
2. All existing tests pass without modification
3. Core modules have zero game-specific imports
4. Clear separation between `core/` and `game/` folders
5. Grid/Battle configs are parameterized
6. Core tests run independently

## Out of Scope
- Actual roguelike progression implementation
- New game modes
- Database schema changes
- Publishing to npm (just preparation)
