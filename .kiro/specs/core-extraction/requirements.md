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
- No game-specific constants hardcoded

#### REQ-1.2: Battle Engine (`core/battle/`)
- `damage.ts` - Damage calculation formulas
- `turn-order.ts` - Initiative-based turn queue
- `targeting.ts` - Target selection algorithms
- `actions.ts` - Action execution framework
- `simulator.ts` - Core battle loop (abstract)

#### REQ-1.3: Ability System (`core/abilities/`)
- `executor.ts` - Ability execution framework
- `effects.ts` - Status effect system

#### REQ-1.4: Core Types (`core/types/`)
- `battle.types.ts` - Battle-related interfaces
- `ability.types.ts` - Ability-related interfaces
- `grid.types.ts` - Grid-related interfaces

### REQ-2: Game-Specific Module Structure
**Priority**: High

Keep game-specific code in `backend/src/game/`:
- `unit/unit.data.ts` - Unit definitions (15 units)
- `abilities/ability.data.ts` - Ability definitions
- `battle/synergies.ts` - Synergy system
- `battle/ai.decision.ts` - AI decision logic
- `battle/bot-generator.ts` - Bot team generation
- `battle/passive.abilities.ts` - Passive ability triggers

### REQ-3: Frontend Core Components
**Priority**: Medium

Create `frontend/src/core/components/`:
- `BattleGrid.tsx` - Generic grid renderer
- `UnitCard.tsx` - Unit display component
- `BattleReplay.tsx` - Replay player
- `StatusEffects.tsx` - Effect indicators

### REQ-4: Backward Compatibility
**Priority**: Critical

- All existing imports must continue working
- Re-export from original locations
- No breaking changes to API
- All 650+ tests must pass

### REQ-5: Documentation
**Priority**: High

- `backend/src/core/README.md` - Core library documentation
- Update `docs/ARCHITECTURE.md` with new structure
- Update `.kiro/steering/project-context.md`

## Success Criteria
1. `npm run build` passes in both backend and frontend
2. All existing tests pass without modification
3. Core modules have zero game-specific imports
4. Clear separation between `core/` and `game/` folders

## Out of Scope
- Actual roguelike progression implementation
- New game modes
- Database schema changes
