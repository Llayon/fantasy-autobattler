# Design: Core Library Extraction

## Architecture Overview

```
backend/src/
├── core/                    # Reusable engine (game-agnostic)
│   ├── grid/
│   │   ├── grid.ts          # Grid utilities
│   │   ├── pathfinding.ts   # A* algorithm
│   │   └── index.ts         # Barrel export
│   ├── battle/
│   │   ├── damage.ts        # Damage formulas
│   │   ├── turn-order.ts    # Turn queue
│   │   ├── targeting.ts     # Target selection
│   │   ├── actions.ts       # Action framework
│   │   └── index.ts
│   ├── abilities/
│   │   ├── executor.ts      # Ability execution
│   │   ├── effects.ts       # Status effects
│   │   └── index.ts
│   ├── types/
│   │   ├── battle.types.ts  # Core battle types
│   │   ├── ability.types.ts # Ability types
│   │   ├── grid.types.ts    # Grid types
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
│   └── index.ts
│
├── battle/                  # Re-exports for compatibility
│   ├── grid.ts              # → core/grid
│   ├── pathfinding.ts       # → core/grid
│   ├── damage.ts            # → core/battle
│   └── ...
```

## Migration Strategy

### Phase 1: Create Core Structure
1. Create `core/` folder structure
2. Copy files without modification
3. Add barrel exports (`index.ts`)

### Phase 2: Update Imports
1. Update internal imports to use `core/`
2. Keep original files as re-exports
3. Verify all tests pass

### Phase 3: Cleanup
1. Remove duplicate code from original locations
2. Keep only re-exports for backward compatibility

## File Mapping

| Original Location | Core Location | Notes |
|-------------------|---------------|-------|
| `battle/grid.ts` | `core/grid/grid.ts` | Remove game constants |
| `battle/pathfinding.ts` | `core/grid/pathfinding.ts` | Generic A* |
| `battle/damage.ts` | `core/battle/damage.ts` | Formula only |
| `battle/turn-order.ts` | `core/battle/turn-order.ts` | Initiative queue |
| `battle/targeting.ts` | `core/battle/targeting.ts` | Target algorithms |
| `battle/actions.ts` | `core/battle/actions.ts` | Action framework |
| `battle/ability.executor.ts` | `core/abilities/executor.ts` | Execution logic |
| `battle/status-effects.ts` | `core/abilities/effects.ts` | Effect system |
| `types/game.types.ts` | `core/types/battle.types.ts` | Core types only |
| `types/ability.types.ts` | `core/types/ability.types.ts` | Ability types |

## Type Extraction

### Core Types (game-agnostic)
```typescript
// core/types/grid.types.ts
export interface Position { x: number; y: number; }
export interface GridConfig { width: number; height: number; }

// core/types/battle.types.ts
export interface BattleUnit { ... }
export interface BattleEvent { ... }
export interface BattleResult { ... }

// core/types/ability.types.ts
export interface Ability { ... }
export interface StatusEffect { ... }
```

### Game Types (Fantasy Autobattler specific)
```typescript
// game/types/index.ts
export type UnitRole = 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support' | 'control';
export interface Synergy { ... }
```

## Backward Compatibility

Original files become re-exports:
```typescript
// battle/grid.ts (after migration)
export * from '../core/grid';
```

This ensures:
- All existing imports work unchanged
- Gradual migration possible
- No breaking changes

## Testing Strategy

1. Run full test suite before changes
2. After each file move, run tests
3. Verify no import errors
4. Check build succeeds

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Circular imports | Careful dependency ordering |
| Missing exports | Comprehensive barrel files |
| Test failures | Incremental migration |
| Type mismatches | Strict TypeScript checks |
