# Core Library - Game-Agnostic Battle Engine

A reusable battle engine for grid-based games. Provides deterministic combat simulation, pathfinding, and targeting systems.

## Features

- **Grid System**: Configurable grid with pathfinding (A* algorithm)
- **Damage System**: Physical/magic damage with armor and dodge mechanics
- **Turn Order**: Initiative-based deterministic turn queue
- **Targeting**: Multiple strategies (nearest, weakest, highest threat)
- **Seeded Random**: Reproducible randomness for replays
- **Event System**: Framework-agnostic event emitter

## Installation

The core library is part of the backend package. Import from `@core/*`:

```typescript
import { createEmptyGrid, findPath, calculatePhysicalDamage } from '@core/grid';
import { buildTurnQueue, selectTarget } from '@core/battle';
import { SeededRandom } from '@core/utils';
```

## Quick Start

```typescript
import {
  createEmptyGrid,
  findPath,
  calculatePhysicalDamage,
  buildTurnQueue,
  selectTarget,
  SeededRandom,
} from '../core';

// 1. Create a grid
const grid = createEmptyGrid({ width: 8, height: 10, playerRows: [0, 1], enemyRows: [8, 9] });

// 2. Find path between positions
const path = findPath({ x: 0, y: 0 }, { x: 3, y: 3 }, grid, units, movingUnit);

// 3. Calculate damage
const damage = calculatePhysicalDamage(attacker, target);

// 4. Build turn queue
const queue = buildTurnQueue(allUnits);

// 5. Select target
const target = selectTarget(attacker, enemies, 'nearest');
```

## Modules

### Grid (`@core/grid`)

Grid creation and spatial calculations.

| Function | Description |
|----------|-------------|
| `createEmptyGrid(config?)` | Create empty grid with given dimensions |
| `createGridWithUnits(units, config?)` | Create grid with units placed |
| `isValidPosition(pos, config?)` | Check if position is within bounds |
| `isWalkable(pos, grid, config?)` | Check if position can be moved to |
| `manhattanDistance(a, b)` | Calculate Manhattan distance |
| `getUnitsInRange(center, range, units)` | Get units within range |
| `getAoEPositions(center, radius, config?)` | Get positions in area of effect |

#### Pathfinding

| Function | Description |
|----------|-------------|
| `findPath(start, goal, grid, units, movingUnit?, config?)` | A* pathfinding |
| `findPathWithMaxLength(start, goal, maxLength, ...)` | Path with length limit |
| `findClosestReachablePosition(start, target, maxRange, ...)` | Find nearest reachable position |
| `hasPath(start, goal, ...)` | Check if path exists |

### Battle (`@core/battle`)

Combat calculations and turn management.

#### Damage

| Function | Description |
|----------|-------------|
| `calculatePhysicalDamage(attacker, target, config?)` | Physical damage (reduced by armor) |
| `calculateMagicDamage(attacker, target)` | Magic damage (ignores armor) |
| `rollDodge(target, seed)` | Deterministic dodge roll |
| `applyDamage(target, damage)` | Calculate new HP after damage |
| `applyHealing(target, healAmount)` | Calculate new HP after healing |
| `resolvePhysicalAttack(attacker, target, seed, config?)` | Full physical attack resolution |
| `resolveMagicAttack(attacker, target)` | Full magic attack resolution |

#### Turn Order

| Function | Description |
|----------|-------------|
| `buildTurnQueue(units)` | Sort units by initiative > speed > ID |
| `getNextUnit(queue)` | Get next unit to act |
| `removeDeadUnits(queue)` | Filter out dead units |
| `getLivingUnitsByTeam(queue, team)` | Get living units by team |
| `advanceToNextTurn(queue, allUnits)` | Move to next turn |

#### Targeting

| Function | Description |
|----------|-------------|
| `findNearestEnemy(unit, enemies)` | Find closest enemy |
| `findWeakestEnemy(enemies)` | Find enemy with lowest HP |
| `findHighestThreatEnemy(unit, enemies)` | Find most threatening enemy |
| `selectTarget(unit, enemies, strategy)` | Select target with strategy |
| `canTarget(attacker, target)` | Check if target is in range |
| `getEnemiesInRange(unit, enemies)` | Get all enemies in attack range |

### Utils (`@core/utils`)

Utility functions for deterministic behavior.

| Export | Description |
|--------|-------------|
| `seededRandom(seed)` | Single random value from seed |
| `SeededRandom` | Class for random sequences |

```typescript
// Single value
const roll = seededRandom(12345); // 0.423...

// Sequence
const rng = new SeededRandom(12345);
rng.next();           // Random 0-1
rng.nextInt(1, 6);    // Random integer 1-6
rng.shuffle(array);   // Shuffle array
rng.pick(array);      // Pick random element
rng.chance(0.25);     // 25% chance of true
```

### Events (`@core/events`)

Framework-agnostic event system.

```typescript
import { createEventEmitter, createEventCollector } from '@core/events';

// Create emitter
const emitter = createEventEmitter();

// Subscribe to events
const unsubscribe = emitter.on('attack', (event) => {
  console.log(`${event.actorId} attacked ${event.targetId}`);
});

// Emit events
emitter.emit({ type: 'attack', round: 1, actorId: 'unit_1', targetId: 'unit_2', ... });

// Collect all events
const { emitter, events } = createEventCollector();
// ... run simulation ...
console.log(events); // All emitted events
```

### Types (`@core/types`)

Type definitions for all core modules.

| Type | Description |
|------|-------------|
| `Position` | `{ x: number, y: number }` |
| `GridCell` | Cell with position, type, unitId |
| `Grid` | `GridCell[][]` |
| `GridConfig` | Grid dimensions and deployment zones |
| `BattleConfig` | Battle parameters (maxRounds, minDamage) |
| `BattleEvent` | Union of all event types |

## Configuration

### GridConfig

```typescript
interface GridConfig {
  width: number;      // Grid width (default: 8)
  height: number;     // Grid height (default: 10)
  playerRows: number[]; // Player deployment rows (default: [0, 1])
  enemyRows: number[];  // Enemy deployment rows (default: [8, 9])
}
```

### BattleConfig

```typescript
interface BattleConfig {
  maxRounds: number;      // Maximum battle rounds (default: 100)
  minDamage: number;      // Minimum damage per hit (default: 1)
  dodgeCapPercent: number; // Maximum dodge chance (default: 50)
}
```

## Unit Interfaces

Core modules use minimal unit interfaces. Game-specific units should extend these.

### GridUnit (for grid operations)

```typescript
interface GridUnit {
  instanceId: string;
  position: Position;
  alive: boolean;
}
```

### DamageUnit (for damage calculations)

```typescript
interface DamageUnit {
  stats: { atk: number; atkCount: number; armor: number; dodge: number };
  currentHp: number;
  maxHp: number;
}
```

### TurnOrderUnit (for turn management)

```typescript
interface TurnOrderUnit {
  id: string;
  instanceId: string;
  alive: boolean;
  currentHp: number;
  stats: { initiative: number; speed: number };
  team: 'player' | 'bot';
}
```

### TargetingUnit (for target selection)

```typescript
interface TargetingUnit {
  id: string;
  instanceId: string;
  alive: boolean;
  position: Position;
  currentHp: number;
  maxHp: number;
  range: number;
  role: string;
  stats: { atk: number; atkCount: number };
  abilities: string[];
}
```

## Determinism

All core functions are deterministic:

1. **Same inputs = same outputs** (pure functions)
2. **Seeded randomness** for dodge, effects, etc.
3. **ID-based tiebreaking** for consistent ordering

This enables:
- Battle replays
- Server-side simulation with client playback
- Debugging and testing

## Testing

```bash
# Run core tests
npm test -- --testPathPattern=core/

# Run integration test
npm test -- core/integration.spec.ts
```

## Architecture

```
core/
├── grid/           # Grid utilities, pathfinding
├── battle/         # Damage, turn order, targeting
├── abilities/      # (types only, implementation in game/)
├── types/          # Type definitions
├── constants/      # Default values
├── utils/          # Seeded random
├── events/         # Event emitter
└── index.ts        # Barrel export
```

Core modules have **zero dependencies** on game-specific code (`game/`, `unit/`, `abilities/`).

## See Also

- [Game Module](../game/README.md) - Game-specific implementations
- [Architecture](../../../docs/ARCHITECTURE.md) - System architecture
- [Engineering Guide](../../../docs/ENGINEERING_GUIDE.md) - Coding standards
