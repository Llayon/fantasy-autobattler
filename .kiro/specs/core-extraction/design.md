# Design: Core Library Extraction

## Architecture Overview

```
backend/src/
├── core/                    # Reusable engine (game-agnostic)
│   ├── grid/
│   │   ├── grid.ts          # Grid utilities
│   │   ├── pathfinding.ts   # A* algorithm
│   │   ├── config.ts        # GridConfig defaults
│   │   ├── grid.spec.ts     # Grid tests
│   │   ├── pathfinding.spec.ts
│   │   └── index.ts         # Barrel export
│   ├── battle/
│   │   ├── damage.ts        # Damage formulas (configurable)
│   │   ├── turn-order.ts    # Turn queue
│   │   ├── targeting.ts     # Target selection
│   │   ├── actions.ts       # Action framework
│   │   ├── config.ts        # BattleConfig defaults
│   │   ├── factory.ts       # Factory functions
│   │   ├── *.spec.ts        # Tests
│   │   └── index.ts
│   ├── abilities/
│   │   ├── executor.ts      # Ability execution
│   │   ├── effects.ts       # Status effects
│   │   ├── *.spec.ts        # Tests
│   │   └── index.ts
│   ├── utils/
│   │   ├── random.ts        # Seeded PRNG (extracted from damage.ts)
│   │   ├── random.spec.ts   # Random tests
│   │   └── index.ts
│   ├── events/
│   │   ├── types.ts         # Event interfaces
│   │   ├── emitter.ts       # Event emitter implementation
│   │   └── index.ts
│   ├── types/
│   │   ├── battle.types.ts  # Core battle types
│   │   ├── ability.types.ts # Ability types
│   │   ├── grid.types.ts    # Grid types
│   │   ├── config.types.ts  # Configuration interfaces
│   │   ├── config.validators.ts # Runtime validation
│   │   └── index.ts
│   ├── README.md            # Documentation
│   └── index.ts             # Main barrel export
│
├── game/                    # Game-specific (Fantasy Autobattler)
│   ├── units/
│   │   └── unit.data.ts     # 15 unit definitions
│   ├── abilities/
│   │   ├── ability.data.ts  # Ability definitions
│   │   └── passive.ts       # Passive triggers
│   ├── battle/
│   │   ├── synergies.ts     # Synergy bonuses
│   │   ├── ai.decision.ts   # AI logic
│   │   ├── bot-generator.ts # Bot teams
│   │   └── simulator.ts     # Game-specific simulator
│   ├── config/
│   │   └── game.config.ts   # 8×10 grid, 30 budget, etc.
│   └── index.ts
│
├── battle/                  # Re-exports for compatibility
│   ├── grid.ts              # → core/grid
│   ├── pathfinding.ts       # → core/grid
│   ├── damage.ts            # → core/battle
│   └── ...
│
frontend/src/
├── core/                    # Reusable UI components
│   ├── components/
│   │   ├── BattleGrid.tsx   # Generic grid (accepts GridConfig)
│   │   ├── UnitCard.tsx     # Unit display
│   │   ├── BattleReplay.tsx # Replay player
│   │   ├── StatusEffects.tsx
│   │   ├── HealthBar.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useBattleReplay.ts
│   │   ├── useGridNavigation.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── README.md
│   └── index.ts
│
├── components/              # Re-exports for compatibility
│   ├── BattleGrid.tsx       # → core/components
│   └── ...
```

## Seeded Random System

Extract existing seeded PRNG to core for reuse:

```typescript
// core/utils/random.ts

/**
 * Mulberry32 - a fast, high-quality 32-bit PRNG.
 * Produces well-distributed pseudo-random numbers from a seed.
 * 
 * Use seededRandom() for single values (e.g., dodge chance in damage.ts).
 * Use SeededRandom class for sequences (e.g., shuffling deck in bot-generator.ts).
 */
export function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Seeded random number generator class for stateful random sequences.
 * Uses Linear Congruential Generator (LCG) algorithm.
 * 
 * Use this class when you need multiple random values in sequence
 * (e.g., shuffling arrays, generating bot teams).
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
```

## Event System

Generic event system for battle logging and replay:

```typescript
// core/events/types.ts
export interface BattleEvent {
  type: string;
  timestamp: number;
  data: unknown;
}

// core/events/emitter.ts
export class BattleEventEmitter<T extends BattleEvent = BattleEvent> {
  private events: T[] = [];
  private handlers: ((event: T) => void)[] = [];

  emit(event: T): void {
    this.events.push(event);
    this.handlers.forEach(h => h(event));
  }

  subscribe(handler: (event: T) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  getEvents(): T[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}
```

## TypeScript Path Aliases

Add to `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"],
      "@game/*": ["src/game/*"]
    }
  }
}
```

Add to `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"]
    }
  }
}
```

## Core Import Verification Script

```bash
#!/bin/bash
# scripts/verify-core-imports.sh

echo "Checking core module imports..."

# Check if core imports from game
if grep -r "from.*['\"].*game" backend/src/core/ 2>/dev/null; then
  echo "ERROR: Core module imports from game!"
  exit 1
fi

# Check if core imports from specific game files
if grep -r "from.*unit\.data\|ability\.data\|synergies\|ai\.decision" backend/src/core/ 2>/dev/null; then
  echo "ERROR: Core module imports game-specific files!"
  exit 1
fi

echo "✓ Core module has no game-specific imports"
exit 0
```

## Seeded Random System

### Extract to Core
```typescript
// core/utils/random.ts
/**
 * Mulberry32 - fast, high-quality 32-bit PRNG.
 * Produces well-distributed pseudo-random numbers from a seed.
 * 
 * @param seed - Integer seed value
 * @returns Random number between 0 and 1
 */
export function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Seeded random number generator class for stateful random sequences.
 * Uses Linear Congruential Generator (LCG) algorithm.
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
```

## Event System

### Current Architecture
Events are stored in array `BattleEvent[]` during simulation:
- `BattleEvent` — base interface with round, type, actorId
- `MoveEvent` — extends BattleEvent with from/to positions
- `AttackEvent` — extends BattleEvent with damage, dodged, killed
- `AbilityEvent` — extends BattleEvent with abilityId, targets

### Core Event Types
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
  damage?: number;
  position?: Position;
}

export interface MoveEvent extends BattleEvent {
  type: 'move';
  from: Position;
  to: Position;
}

export interface AttackEvent extends BattleEvent {
  type: 'attack';
  targetId: string;
  damage: number;
  attackType: 'physical' | 'magic';
  dodged: boolean;
  killed: boolean;
}

export interface AbilityEvent extends BattleEvent {
  type: 'ability';
  abilityId: string;
  targets: string[];
  effects?: StatusEffectInstance[];
}
```

### Battle Event Emitter
```typescript
// core/events/emitter.ts
export interface BattleEventEmitter<T extends BattleEvent = BattleEvent> {
  emit(event: T): void;
  subscribe(handler: (event: T) => void): () => void;
  getEvents(): T[];
  clear(): void;
}

export function createEventEmitter<T extends BattleEvent = BattleEvent>(): BattleEventEmitter<T> {
  const events: T[] = [];
  const handlers: ((event: T) => void)[] = [];
  
  return {
    emit(event: T) {
      events.push(event);
      handlers.forEach(h => h(event));
    },
    subscribe(handler) {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    },
    getEvents: () => [...events],
    clear: () => { events.length = 0; },
  };
}
```

### Migration Strategy
1. Create core/types/event.types.ts with all event interfaces
2. Update actions.ts to import from core (keep re-export for compatibility)
3. Update ability.executor.ts to import AbilityEvent from core
4. Existing code continues to work with array approach
5. New code can use EventEmitter for real-time subscriptions

## TypeScript Path Aliases

### Backend tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"],
      "@game/*": ["src/game/*"]
    }
  }
}
```

### Frontend tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"]
    }
  }
}
```

## Core Import Verification Script

```bash
#!/bin/bash
# scripts/verify-core-imports.sh
# Ensures core/ has no imports from game/

echo "Checking core imports..."
if grep -r "from.*['\"].*game" backend/src/core/ 2>/dev/null; then
  echo "ERROR: core/ must not import from game/"
  exit 1
fi

if grep -r "from.*['\"].*unit/unit.data" backend/src/core/ 2>/dev/null; then
  echo "ERROR: core/ must not import game-specific data"
  exit 1
fi

echo "✓ Core imports are clean"
exit 0
```

## Configuration System

### Constants Separation

**Core Constants** (`core/constants/`):
```typescript
// core/constants/grid.constants.ts
export const PATHFINDING_CONSTANTS = {
  MAX_ITERATIONS: 1000,
  MOVEMENT_COST: 1,
  DIAGONAL_COST: 1.4,
} as const;

// core/constants/battle.constants.ts
export const BATTLE_LIMITS = {
  MAX_ROUNDS: 100,
  MIN_DAMAGE: 1,
  SIMULATION_TIMEOUT_MS: 5000,
} as const;

export const COMBAT_CONSTANTS = {
  BASE_DODGE_CHANCE: 0,
  MAX_DODGE_CHANCE: 50,
  DODGE_AFFECTS_MAGIC: false,
} as const;
```

**Game Constants** (`game/constants/`):
```typescript
// game/constants/game.constants.ts
export const TEAM_LIMITS = {
  BUDGET: 30,
  MIN_UNIT_COST: 3,
  MAX_UNIT_COST: 8,
  MAX_UNITS: 10,
} as const;

export const UNIT_ROLES = {
  TANK: 'tank',
  MELEE_DPS: 'melee_dps',
  // ...
} as const;

export const MATCHMAKING_CONSTANTS = {
  DEFAULT_ELO: 1200,
  // ...
} as const;
```

### Grid Configuration
```typescript
// core/types/config.types.ts
export interface GridConfig {
  width: number;
  height: number;
  playerRows: number[];
  enemyRows: number[];
}

// core/types/config.validators.ts
export function validateGridConfig(config: GridConfig): void {
  if (config.width <= 0 || config.height <= 0) {
    throw new Error('Grid dimensions must be positive');
  }
  if (config.playerRows.some(r => r < 0 || r >= config.height)) {
    throw new Error('Player rows must be within grid bounds');
  }
  if (config.enemyRows.some(r => r < 0 || r >= config.height)) {
    throw new Error('Enemy rows must be within grid bounds');
  }
}

// core/grid/config.ts
export const DEFAULT_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};

// Usage in grid.ts
export function isValidPosition(pos: Position, config: GridConfig = DEFAULT_GRID_CONFIG): boolean {
  return pos.x >= 0 && pos.x < config.width && pos.y >= 0 && pos.y < config.height;
}
```

### Battle Configuration
```typescript
// core/types/config.types.ts
export interface BattleConfig {
  maxRounds: number;
  minDamage: number;
  dodgeCapPercent: number;
}

export interface DamageConfig {
  physicalFormula: (atk: number, armor: number, atkCount: number) => number;
  magicFormula: (atk: number, atkCount: number) => number;
}

// core/types/config.validators.ts
export function validateBattleConfig(config: BattleConfig): void {
  if (config.maxRounds <= 0) {
    throw new Error('Max rounds must be positive');
  }
  if (config.minDamage < 0) {
    throw new Error('Min damage cannot be negative');
  }
  if (config.dodgeCapPercent < 0 || config.dodgeCapPercent > 100) {
    throw new Error('Dodge cap must be between 0 and 100');
  }
}

// core/battle/config.ts
export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  maxRounds: 100,
  minDamage: 1,
  dodgeCapPercent: 50,
};

export const DEFAULT_DAMAGE_CONFIG: DamageConfig = {
  physicalFormula: (atk, armor, atkCount) => Math.max(1, (atk - armor) * atkCount),
  magicFormula: (atk, atkCount) => atk * atkCount,
};
```

### Factory Functions
```typescript
// core/battle/factory.ts
import { BattleConfig, GridConfig } from '../types';
import { validateBattleConfig, validateGridConfig } from '../types/config.validators';

export function createBattleEngine(config: BattleConfig = DEFAULT_BATTLE_CONFIG): BattleEngine {
  validateBattleConfig(config);
  return {
    config,
    // ... engine methods
  };
}

export function createGridSystem(config: GridConfig = DEFAULT_GRID_CONFIG): GridSystem {
  validateGridConfig(config);
  return {
    config,
    isValidPosition: (pos) => isValidPosition(pos, config),
    findPath: (start, end, obstacles) => findPath(start, end, obstacles, config),
  };
}
```

### Game-Specific Configuration
```typescript
// game/config/game.config.ts
import { GridConfig, BattleConfig } from '../../core/types';

export const FANTASY_AUTOBATTLER_GRID: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};

export const FANTASY_AUTOBATTLER_BATTLE: BattleConfig = {
  maxRounds: 100,
  minDamage: 1,
  dodgeCapPercent: 50,
};

export const TEAM_BUDGET = 30;
export const UNIT_COST_RANGE = { min: 3, max: 8 };
```

## Migration Strategy

### Phase 0: Preparation
1. Create feature branch `feature/core-extraction`
2. Run all tests, record baseline count
3. Add ESLint `import/no-cycle` rule
4. Check for existing circular dependencies

### Phase 1: Create Core Structure & Types (TYPES FIRST!)
1. Create `core/` folder structure
2. **Create types FIRST** (needed by all other modules)
3. Create configuration interfaces
4. Create config validators
5. Add barrel exports (`index.ts`)

### Phase 2: Extract & Parameterize Backend
1. Copy files to `core/`
2. Add config parameters with defaults
3. Update internal imports
4. Keep original files as re-exports
5. **Run tests after each module extraction**

### Phase 3: Move Tests to Core
1. Copy test files to `core/` modules
2. Update tests to use mock configs
3. Ensure tests don't depend on game data
4. **Verify all tests pass**

### Phase 4: Extract Frontend Core
1. Create `frontend/src/core/` structure
2. Copy components with generic props
3. Add re-exports for compatibility

### Phase 5: Integration Tests & Cleanup
1. Add integration test for core-only battle flow
2. Remove duplicate code
3. Add JSDoc comments
4. Create README files
5. Update project documentation
6. **Final test verification**

## File Mapping

### Core Modules (to `core/`)

| Original Location | Core Location | Changes | Constants Used |
|-------------------|---------------|---------|----------------|
| `battle/grid.ts` | `core/grid/grid.ts` | Add `GridConfig` param | `GRID_DIMENSIONS`, `DEPLOYMENT_ZONES` → parameterize |
| `battle/pathfinding.ts` | `core/grid/pathfinding.ts` | Add `GridConfig` param | `PATHFINDING_CONSTANTS` → move to core |
| `battle/damage.ts` | `core/battle/damage.ts` | Add `DamageConfig` param | `BATTLE_LIMITS` → move to core |
| `battle/turn-order.ts` | `core/battle/turn-order.ts` | No changes needed | None |
| `battle/targeting.ts` | `core/battle/targeting.ts` | No changes needed | None |
| `battle/actions.ts` | `core/battle/actions.ts` | Add config params | `BATTLE_LIMITS` → import from core |
| `battle/ability.executor.ts` | `core/abilities/executor.ts` | Generic interfaces | `BATTLE_LIMITS` → import from core |
| `battle/status-effects.ts` | `core/abilities/effects.ts` | No changes needed | None |
| `types/game.types.ts` | `core/types/*.ts` | Split into grid/battle/ability types | None |
| `types/ability.types.ts` | `core/types/ability.types.ts` | No changes | None |

### Game Modules (stay in `game/` or `battle/`)

| File | Location | Reason |
|------|----------|--------|
| `battle/synergies.ts` | `game/battle/synergies.ts` | Uses `UNIT_ROLES` (game-specific) |
| `battle/ai.decision.ts` | `game/battle/ai.decision.ts` | Game-specific AI logic |
| `battle/bot-generator.ts` | `game/battle/bot-generator.ts` | Uses game-specific unit data |
| `battle/passive.abilities.ts` | `game/battle/passive.abilities.ts` | Game-specific passive triggers |
| `battle/battle.simulator.ts` | `game/battle/simulator.ts` | Orchestrator with game config |
| `battle/battle.service.ts` | `battle/battle.service.ts` | NestJS service (stays) |
| `battle/battle.controller.ts` | `battle/battle.controller.ts` | NestJS controller (stays) |
| `unit/unit.data.ts` | `game/units/unit.data.ts` | Game-specific unit definitions |
| `abilities/ability.data.ts` | `game/abilities/ability.data.ts` | Game-specific ability definitions |

### Files That Stay In Place (NestJS / Game-Specific)

| File/Directory | Reason |
|----------------|--------|
| `team/team.validator.ts` | Uses `TEAM_LIMITS`, `GRID_DIMENSIONS` (game-specific) |
| `team/team.service.ts` | NestJS service |
| `matchmaking/` | Uses `MATCHMAKING_CONSTANTS` (game-specific) |
| `rating/` | NestJS service, no core dependencies |
| `player/` | NestJS service |
| `auth/` | NestJS auth module |
| `health/` | NestJS health checks |
| `entities/` | TypeORM entities |
| `common/` | NestJS filters, interceptors |
| `types/ability.types.ts` | Extends core types with `UnitId` |
| `config/game.constants.ts` | Re-exports from core + game constants |

## Frontend Component Parameterization (DEFERRED)

> **Note**: Frontend component extraction is deferred to a future spec. Components like BattleGrid, UnitCard, and BattleReplay contain significant game-specific logic (synergy indicators, ability targeting, team colors) that would require substantial refactoring.

### Current Scope: Types and Hooks Only

```typescript
// core/types/index.ts
export type { Position, GridConfig, BattleConfig } from '@backend/core/types';

// core/hooks/useGridNavigation.ts
export function useGridNavigation(config: GridConfig) {
  // Generic grid navigation logic
}
```

### Future Work (Separate Spec)
After roguelike mode is implemented, extract:
- BattleGrid with configurable rendering
- UnitCard with generic stats display
- BattleReplay with pluggable event handlers

## Test Strategy

### Core Test Requirements
1. **No game-specific imports** - Tests use mock data only
2. **Configurable** - Tests accept config parameters
3. **Isolated** - Each test file is self-contained
4. **Deterministic** - Same input = same output

### Mock Data Example
```typescript
// core/grid/grid.spec.ts
const TEST_CONFIG: GridConfig = {
  width: 4,
  height: 4,
  playerRows: [0],
  enemyRows: [3],
};

describe('Grid utilities', () => {
  it('validates positions within bounds', () => {
    expect(isValidPosition({ x: 0, y: 0 }, TEST_CONFIG)).toBe(true);
    expect(isValidPosition({ x: 4, y: 0 }, TEST_CONFIG)).toBe(false);
  });
});
```

## Backward Compatibility

Original files become re-exports with game config:
```typescript
// battle/grid.ts (after migration)
import { FANTASY_AUTOBATTLER_GRID } from '../game/config/game.config';
export * from '../core/grid';

// Re-export with default game config for backward compatibility
export { isValidPosition as isValidPositionWithConfig } from '../core/grid';
export const isValidPosition = (pos: Position) => 
  isValidPositionCore(pos, FANTASY_AUTOBATTLER_GRID);
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Circular imports | ESLint `import/no-cycle` rule, types in separate files |
| Missing exports | Comprehensive barrel files, TypeScript strict mode |
| Test failures | Run tests after each task, incremental migration |
| Type mismatches | Strict TypeScript checks, explicit generics |
| Performance regression | Benchmark before/after, config defaults inline |
| Breaking changes | Re-exports maintain old API, deprecation warnings |
| Invalid configs | Runtime validation with clear error messages |

## Circular Dependency Prevention

### ESLint Configuration
```javascript
// backend/.eslintrc.js
module.exports = {
  // ... existing config
  rules: {
    'import/no-cycle': ['error', { maxDepth: 2 }],
  },
};
```

### Dependency Order
```
core/types/           ← No dependencies (define first)
    ↓
core/types/validators ← Depends on types only
    ↓
core/grid/            ← Depends on types
core/battle/          ← Depends on types, grid
core/abilities/       ← Depends on types, battle
    ↓
core/index.ts         ← Re-exports all
```

## Test Verification Checkpoints

| Checkpoint | When | Command | Expected |
|------------|------|---------|----------|
| Baseline | Before start | `npm test` | 650+ pass |
| After Types | Task 2 complete | `npm test` | Same count |
| After Grid | Task 3 complete | `npm test` | Same count |
| After Battle | Task 4 complete | `npm test` | Same count |
| After Abilities | Task 5 complete | `npm test` | Same count |
| After Tests Move | Task 9 complete | `npm test` | Same count |
| After Frontend | Task 14 complete | `npm run build` | Success |
| Final | Task 20 complete | `npm test && npm run build` | All pass |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Seeded Random Determinism (Function)
*For any* seed value, calling `seededRandom(seed)` multiple times with the same seed SHALL return identical results.
**Validates: REQ-9**

### Property 2: SeededRandom Sequence Determinism
*For any* seed and sequence length N, creating two `SeededRandom(seed)` instances and calling `next()` N times SHALL produce identical sequences.
**Validates: REQ-9**

### Property 3: Config Validation Rejects Invalid Grid
*For any* GridConfig with `width <= 0` OR `height <= 0`, `validateGridConfig()` SHALL throw an error.
**Validates: REQ-2.1**

### Property 4: Config Validation Rejects Invalid Rows
*For any* GridConfig where `playerRows` or `enemyRows` contain indices outside `[0, height)`, `validateGridConfig()` SHALL throw an error.
**Validates: REQ-2.1**

### Property 5: Valid Config Passes Validation
*For any* GridConfig with positive dimensions and valid row indices within bounds, `validateGridConfig()` SHALL not throw.
**Validates: REQ-2.1**

### Property 6: Grid Position Validation Consistency
*For any* position `{x, y}` and GridConfig, `isValidPosition(pos, config)` SHALL return `true` if and only if `0 <= x < width` AND `0 <= y < height`.
**Validates: REQ-1.1**

### Property 7: Pathfinding Determinism
*For any* start position, end position, obstacles set, and GridConfig, `findPath()` SHALL return the same path on repeated calls.
**Validates: REQ-1.1**

### Property 8: Damage Calculation Minimum
*For any* attacker and target stats, physical damage SHALL be at least `minDamage` from BattleConfig.
**Validates: REQ-1.2**

## Rollback Strategy

### Per-Task Rollback
Each task creates re-exports in original locations. To rollback a single task:
```bash
# Restore original file from git
git checkout -- backend/src/battle/grid.ts
# Remove core file
rm backend/src/core/grid/grid.ts
```

### Per-PR Rollback
If a PR fails verification after merge:
```bash
git revert <merge-commit-sha>
```

### Full Rollback
If extraction fails completely:
```bash
# Option 1: Reset to main
git checkout main
git branch -D feature/core-extraction

# Option 2: Reset to specific commit
git reset --hard <last-good-commit>
```

### Recovery Checkpoints
Each PR creates a stable checkpoint:
- PR 1 merged → `core-extraction-types` tag
- PR 2 merged → `core-extraction-backend` tag
- PR 3 merged → `core-extraction-tests` tag
- PR 4 merged → `core-extraction-frontend` tag
- PR 5 merged → `core-extraction-complete` tag
