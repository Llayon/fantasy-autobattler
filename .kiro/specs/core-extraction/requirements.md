# Requirements: Core Library Extraction

## Overview
Extract reusable core modules from the Fantasy Autobattler MVP to enable code reuse across multiple game projects (card games, strategies, PvP games).

## Motivation
- Current MVP has battle simulation, grid system, pathfinding tightly coupled with game-specific logic
- Need to separate generic engine code from game-specific content
- Enable rapid prototyping of new games using proven battle mechanics

## Requirements

### REQ-0: Preparation Phase
**Priority**: Critical

Prepare environment before extraction:
- Create feature branch `feature/core-extraction`
- Run all tests to establish baseline (650+ tests must pass)
- Check for circular dependencies with ESLint `import/no-cycle`
- Document current test count for comparison

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
- `battle.types.ts` - Battle-related interfaces (BattleUnit, BattleResult, FinalUnitState)
- `ability.types.ts` - Ability-related interfaces (Ability, AbilityEffect)
- `grid.types.ts` - Grid-related interfaces (Position, GridCell, PathNode)
- `config.types.ts` - Configuration interfaces (GridConfig, BattleConfig)
- `event.types.ts` - Event interfaces (BattleEvent, MoveEvent, AttackEvent, AbilityEvent)

#### REQ-1.5: Core Constants (`core/constants/`)
Extract generic constants from `config/game.constants.ts`:
- `grid.constants.ts` - PATHFINDING_CONSTANTS
- `battle.constants.ts` - BATTLE_LIMITS, COMBAT_CONSTANTS
- `ability.constants.ts` - ABILITY_CONSTANTS (generic parts only)

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

#### REQ-2.1: Config Validation
Add runtime validation for configurations:

```typescript
// core/types/config.validators.ts
export function validateGridConfig(config: GridConfig): void {
  if (config.width <= 0 || config.height <= 0) {
    throw new Error('Grid dimensions must be positive');
  }
  if (config.playerRows.some(r => r < 0 || r >= config.height)) {
    throw new Error('Player rows must be within grid bounds');
  }
}

export function validateBattleConfig(config: BattleConfig): void {
  if (config.maxRounds <= 0) {
    throw new Error('Max rounds must be positive');
  }
  if (config.dodgeCapPercent < 0 || config.dodgeCapPercent > 100) {
    throw new Error('Dodge cap must be between 0 and 100');
  }
}
```

#### REQ-2.2: Factory Functions
Create factory functions for engine instantiation:

```typescript
// core/battle/factory.ts
export function createBattleEngine(config: BattleConfig): BattleEngine {
  validateBattleConfig(config);
  return new BattleEngine(config);
}

export function createGridSystem(config: GridConfig): GridSystem {
  validateGridConfig(config);
  return new GridSystem(config);
}
```

### REQ-3: Game-Specific Module Structure
**Priority**: High

Keep game-specific code in `backend/src/game/`:

#### REQ-3.1: Game Data (`game/units/`, `game/abilities/`)
- `units/unit.data.ts` - Unit definitions (15 units)
- `abilities/ability.data.ts` - Ability definitions

#### REQ-3.2: Game Logic (`game/battle/`)
- `battle/synergies.ts` - Synergy system
- `battle/ai.decision.ts` - AI decision logic
- `battle/bot-generator.ts` - Bot team generation
- `battle/passive.abilities.ts` - Passive ability triggers

#### REQ-3.3: Game Config (`game/config/`, `game/constants/`)
- `config/game.config.ts` - Game-specific configuration (8×10 grid, 30 budget)
- `constants/game.constants.ts` - Game-specific constants (TEAM_LIMITS, UNIT_ROLES, MATCHMAKING_CONSTANTS, UNIT_STAT_RANGES)

### REQ-4: Frontend Core (Minimal Scope)
**Priority**: Medium

Create `frontend/src/core/` with types and hooks only (components deferred to future):

#### REQ-4.1: Core Types (`core/types/`)
- `index.ts` - Shared TypeScript interfaces (Position, GridConfig, BattleUnit)
- Re-export backend core types for frontend use

#### REQ-4.2: Core Hooks (`core/hooks/`)
- `useGridNavigation.ts` - Generic grid interaction logic

> **Note**: `useBattleReplay.ts` отложен — сильно завязан на game-specific события. Извлечь после roguelike mode.

#### REQ-4.3: Core Components (DEFERRED)
**Status**: Future work - components have too much game-specific logic

**Why components are NOT extracted now:**

1. **Hardcoded dimensions**: `BattleGrid.tsx` has `GRID_WIDTH = 8`, `GRID_HEIGHT = 10`
2. **Hardcoded zones**: `PLAYER_ROWS = [0, 1]`, `ENEMY_ROWS = [8, 9]`
3. **Game-specific imports**: Uses `UNIT_INFO`, `UnitId` from `@/types/game`
4. **Game-specific styling**: Team colors hardcoded (`'player'` → blue, `'bot'` → red)
5. **Game-specific modes**: `'team-builder' | 'battle' | 'replay'`
6. **Tight coupling**: `UnitCard.tsx` uses role colors, ability icons, synergy indicators

**Effort to extract**: Would require significant refactoring:
- Parameterize all dimensions via `GridConfig` prop
- Remove `UNIT_INFO` dependency, use generic unit interface
- Make all styling configurable via props
- Extract game-specific rendering to render props pattern

**Recommendation**: Extract components AFTER roguelike mode is implemented, when we have a second use case to validate the generic API.

For now, keep components in `frontend/src/components/` and focus on backend core extraction.

### REQ-5: Test Organization
**Priority**: High

Organize tests alongside core modules:

#### REQ-5.1: Backend Core Tests
- Move (not copy) test files to `core/` modules
- `core/grid/grid.spec.ts` - Grid utility tests
- `core/grid/pathfinding.spec.ts` - A* algorithm tests
- `core/battle/damage.spec.ts` - Damage formula tests
- `core/battle/turn-order.spec.ts` - Turn queue tests
- `core/battle/targeting.spec.ts` - Target selection tests
- `core/abilities/executor.spec.ts` - Ability execution tests
- `core/abilities/effects.spec.ts` - Status effect tests
- Delete original test files after migration (they become re-exports)

#### REQ-5.2: Test Independence
- Core tests must not depend on game-specific data
- Use mock/fixture data for testing
- Tests should work with any `GridConfig`/`BattleConfig`

#### REQ-5.3: Integration Tests
- Add integration test for full battle flow with mock config
- Verify core works without game-specific imports
- Test config validation edge cases

#### REQ-5.4: Continuous Verification
- Run `npm test` after each extraction task
- All 650+ tests must pass at every checkpoint
- No test count regression allowed

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

### REQ-9: Seeded Random in Core
**Priority**: High

Consolidate existing seeded PRNG implementations to core:
- `core/utils/random.ts` - Unified seeded random number generator

**Current duplication** (3 copies to consolidate):
1. `damage.ts` — `seededRandom()` function (Mulberry32 algorithm)
2. `bot-generator.ts` — `SeededRandom` class (LCG algorithm)
3. `ability.executor.ts` — `seededRandom()` function (different hash algorithm)

**Target implementation**:
- Use Mulberry32 algorithm (best distribution)
- Single `seededRandom(seed: number): number` function
- Single `SeededRandom` class for stateful sequences
- Ensure deterministic behavior for replay and testing

### REQ-10: Event System in Core
**Priority**: High

Extract and enhance event system for battle logging:

#### REQ-10.1: Core Event Types
Move existing event types to core:
```typescript
// core/types/event.types.ts
export type BattleEventType = 
  | 'move' 
  | 'attack' 
  | 'damage'
  | 'death'
  | 'ability'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'round_start'
  | 'round_end'
  | 'battle_start'
  | 'battle_end';

export interface BattleEvent {
  round: number;
  type: BattleEventType;
  actorId: string;
  targetId?: string;
  // ... other fields
}

export interface MoveEvent extends BattleEvent { type: 'move'; from: Position; to: Position; }
export interface AttackEvent extends BattleEvent { type: 'attack'; damage: number; dodged: boolean; }
export interface AbilityEvent extends BattleEvent { type: 'ability'; abilityId: string; }
```

#### REQ-10.2: Event Emitter (Optional Enhancement)
Add pub/sub pattern for future live replay:
```typescript
// core/events/emitter.ts
export interface BattleEventEmitter<T extends BattleEvent> {
  emit(event: T): void;
  subscribe(handler: (event: T) => void): () => void;
  getEvents(): T[];
  clear(): void;
}
```
- Enable real-time event streaming
- Support custom event types per game
- Backward compatible with array-based approach

### REQ-11: TypeScript Path Aliases
**Priority**: Medium

Add path aliases for cleaner imports:
```json
// tsconfig.json
"paths": {
  "@core/*": ["src/core/*"],
  "@game/*": ["src/game/*"]
}
```

### REQ-12: Core Import Verification
**Priority**: High

Automated check that core has no game-specific imports:
- Add script to verify `core/` doesn't import from `game/`
- Run in CI pipeline
- Fail build if violation detected

### REQ-13: Circular Dependency Prevention
**Priority**: High

Prevent and detect circular imports:
- Add ESLint rule `import/no-cycle` to backend/.eslintrc.js
- Run circular dependency check after each phase
- Types must be in separate files from implementations
- Strict dependency ordering: types → utils → modules

### REQ-14: Roguelike Compatibility
**Priority**: Medium

Core extraction enables roguelike mode:
- GridConfig supports variable grid sizes (8×2 for roguelike battles)
- BattleConfig supports different max rounds
- Unit types are generic (T1/T2/T3 upgrades possible)
- Seeded random enables deterministic draft

**Dependency**: roguelike-run spec depends on core-extraction completion

## Success Criteria
1. `npm run build` passes in both backend and frontend
2. All existing tests pass without modification
3. Core modules have zero game-specific imports
4. Clear separation between `core/` and `game/` folders
5. Grid/Battle configs are parameterized
6. Core tests run independently
7. No circular dependencies detected
8. Config validation catches invalid inputs
9. Seeded random extracted to core
10. Integration tests pass with multiple grid configs (8×10, 8×2, 4×4)

## Out of Scope
- Actual roguelike progression implementation
- New game modes
- Database schema changes
- Publishing to npm (just preparation)
