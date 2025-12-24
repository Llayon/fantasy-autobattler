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
│   │   ├── *.spec.ts        # Tests
│   │   └── index.ts
│   ├── abilities/
│   │   ├── executor.ts      # Ability execution
│   │   ├── effects.ts       # Status effects
│   │   ├── *.spec.ts        # Tests
│   │   └── index.ts
│   ├── types/
│   │   ├── battle.types.ts  # Core battle types
│   │   ├── ability.types.ts # Ability types
│   │   ├── grid.types.ts    # Grid types
│   │   ├── config.types.ts  # Configuration interfaces
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

## Configuration System

### Grid Configuration
```typescript
// core/types/config.types.ts
export interface GridConfig {
  width: number;
  height: number;
  playerRows: number[];
  enemyRows: number[];
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

### Phase 1: Create Core Structure & Types
1. Create `core/` folder structure
2. Create configuration interfaces
3. Add barrel exports (`index.ts`)

### Phase 2: Extract & Parameterize Backend
1. Copy files to `core/`
2. Add config parameters with defaults
3. Update internal imports
4. Keep original files as re-exports

### Phase 3: Move Tests to Core
1. Copy test files to `core/` modules
2. Update tests to use mock configs
3. Ensure tests don't depend on game data

### Phase 4: Extract Frontend Core
1. Create `frontend/src/core/` structure
2. Copy components with generic props
3. Add re-exports for compatibility

### Phase 5: Cleanup & Documentation
1. Remove duplicate code
2. Add JSDoc comments
3. Create README files
4. Update project documentation

## File Mapping

| Original Location | Core Location | Changes |
|-------------------|---------------|---------|
| `battle/grid.ts` | `core/grid/grid.ts` | Add `GridConfig` param |
| `battle/grid.spec.ts` | `core/grid/grid.spec.ts` | Use mock config |
| `battle/pathfinding.ts` | `core/grid/pathfinding.ts` | Add `GridConfig` param |
| `battle/pathfinding.spec.ts` | `core/grid/pathfinding.spec.ts` | Use mock config |
| `battle/damage.ts` | `core/battle/damage.ts` | Add `DamageConfig` param |
| `battle/damage.spec.ts` | `core/battle/damage.spec.ts` | Use mock config |
| `battle/turn-order.ts` | `core/battle/turn-order.ts` | No changes needed |
| `battle/turn-order.spec.ts` | `core/battle/turn-order.spec.ts` | Use mock units |
| `battle/targeting.ts` | `core/battle/targeting.ts` | No changes needed |
| `battle/targeting.spec.ts` | `core/battle/targeting.spec.ts` | Use mock units |
| `battle/actions.ts` | `core/battle/actions.ts` | Add config params |
| `battle/actions.spec.ts` | `core/battle/actions.spec.ts` | Use mock config |
| `battle/ability.executor.ts` | `core/abilities/executor.ts` | Generic interfaces |
| `battle/ability.executor.spec.ts` | `core/abilities/executor.spec.ts` | Use mock abilities |
| `battle/status-effects.ts` | `core/abilities/effects.ts` | No changes needed |
| `battle/status-effects.spec.ts` | `core/abilities/effects.spec.ts` | Use mock effects |
| `types/game.types.ts` | `core/types/battle.types.ts` | Core types only |
| `types/ability.types.ts` | `core/types/ability.types.ts` | No changes |

## Frontend Component Parameterization

### BattleGrid
```typescript
// core/components/BattleGrid.tsx
interface BattleGridProps {
  config: GridConfig;
  units: BattleUnit[];
  onCellClick?: (pos: Position) => void;
  highlightedCells?: Position[];
  selectedUnit?: string;
  playerColor?: string;
  enemyColor?: string;
}

export function BattleGrid({ 
  config, 
  units, 
  playerColor = 'blue',
  enemyColor = 'red',
  ...props 
}: BattleGridProps) {
  // Render grid based on config.width × config.height
}
```

### UnitCard
```typescript
// core/components/UnitCard.tsx
interface UnitCardProps<T extends BaseUnit> {
  unit: T;
  size?: 'compact' | 'full';
  onClick?: () => void;
  selected?: boolean;
  renderStats?: (unit: T) => React.ReactNode;
  roleColors?: Record<string, string>;
}
```

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
| Circular imports | Careful dependency ordering, types in separate files |
| Missing exports | Comprehensive barrel files, TypeScript strict mode |
| Test failures | Incremental migration, run tests after each step |
| Type mismatches | Strict TypeScript checks, explicit generics |
| Performance regression | Benchmark before/after, config defaults inline |
| Breaking changes | Re-exports maintain old API, deprecation warnings |
