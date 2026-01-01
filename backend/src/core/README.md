# Core Library - Game-Agnostic Battle Engine

A reusable battle engine for grid-based games. Provides deterministic combat simulation, pathfinding, and targeting systems.

## Features

- **Grid System**: Configurable grid with pathfinding (A* algorithm)
- **Damage System**: Physical/magic damage with armor and dodge mechanics
- **Turn Order**: Initiative-based deterministic turn queue
- **Targeting**: Multiple strategies (nearest, weakest, highest threat)
- **Seeded Random**: Reproducible randomness for replays
- **Event System**: Framework-agnostic event emitter
- **Mechanics 2.0**: Modular battle mechanics with feature flags (facing, resolve, engagement, flanking, and more)

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
├── mechanics/      # Modular battle mechanics (2.0)
│   ├── config/     # Types, defaults, presets, validation
│   ├── tier0/      # Base mechanics (facing)
│   ├── tier1/      # Core combat (resolve, engagement, flanking)
│   ├── tier2/      # Advanced (riposte, intercept, aura)
│   ├── tier3/      # Specialized (charge, overwatch, phalanx, los, ammo)
│   └── tier4/      # Counter-mechanics (contagion, armor-shred)
├── abilities/      # (types only, implementation in game/)
├── types/          # Type definitions
├── constants/      # Default values
├── utils/          # Seeded random
├── events/         # Event emitter
└── index.ts        # Barrel export
```

Core modules have **zero dependencies** on game-specific code (`game/`, `unit/`, `abilities/`).

## Mechanics 2.0 (`@core/mechanics`)

Modular battle mechanics with feature flags. All mechanics are optional and can be enabled/disabled independently. Maintains full backward compatibility with Core 1.0.

### Quick Start

```typescript
import {
  createMechanicsProcessor,
  MVP_PRESET,
  ROGUELIKE_PRESET,
  TACTICAL_PRESET,
} from '@core/mechanics';

// MVP mode (all mechanics disabled, identical to Core 1.0)
const mvpProcessor = createMechanicsProcessor(MVP_PRESET);

// Roguelike mode (all mechanics enabled)
const roguelikeProcessor = createMechanicsProcessor(ROGUELIKE_PRESET);

// Custom configuration (dependencies auto-resolved)
const customProcessor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  resolve: { maxResolve: 100, baseRegeneration: 5 },
});
```

### Presets

| Preset | Description | Mechanics Enabled |
|--------|-------------|-------------------|
| `MVP_PRESET` | All mechanics disabled | None (Core 1.0 behavior) |
| `TACTICAL_PRESET` | Tier 0-2 mechanics | facing, flanking, resolve, engagement, riposte, intercept |
| `ROGUELIKE_PRESET` | All mechanics enabled | All 14 mechanics |

### Tier 0: Facing

The facing system adds directional combat. Units have a facing direction (N/S/E/W) and attacks from different angles have different effects.

```typescript
import { createFacingProcessor } from '@core/mechanics';
import type { FacingDirection, AttackArc } from '@core/mechanics';

const facingProcessor = createFacingProcessor();

// Get unit's current facing (defaults to 'S' if not set)
const facing: FacingDirection = facingProcessor.getFacing(unit);
// Returns: 'N' | 'S' | 'E' | 'W'

// Rotate unit to face a target position
const rotatedUnit = facingProcessor.faceTarget(unit, enemy.position);
// rotatedUnit.facing is now pointing toward enemy

// Determine attack arc for damage calculation
const arc: AttackArc = facingProcessor.getAttackArc(attacker, target);
// Returns: 'front' | 'flank' | 'rear'

// Apply facing logic during battle phase
const newState = facingProcessor.apply('pre_attack', state, {
  activeUnit: attacker,
  target: defender,
  seed: 12345,
});
```

Attack arc thresholds:
- Front: 0°-45° from target's facing direction
- Flank: 45°-135° from target's facing direction  
- Rear: 135°-180° from target's facing direction

### Tier 1: Resolve (Morale)

The resolve system tracks unit morale. When resolve reaches 0, units either retreat (humans) or crumble (undead).

```typescript
import { createResolveProcessor, DEFAULT_RESOLVE_CONFIG } from '@core/mechanics';
import type { MechanicsResolveState } from '@core/mechanics';

const resolveProcessor = createResolveProcessor({
  maxResolve: 100,
  baseRegeneration: 5,
  humanRetreat: true,
  undeadCrumble: true,
  flankingResolveDamage: 12,
  rearResolveDamage: 20,
});

// Regenerate resolve at turn start (capped at maxResolve)
const regenUnit = resolveProcessor.regenerate(unit, DEFAULT_RESOLVE_CONFIG);
// unit.resolve: 80 → 85 (with baseRegeneration: 5)

// Apply resolve damage from flanking attack
const damagedUnit = resolveProcessor.applyDamage(unit, 12);
// unit.resolve: 50 → 38

// Check if unit should rout/crumble
const state: MechanicsResolveState = resolveProcessor.checkState(unit, DEFAULT_RESOLVE_CONFIG);
// Returns: 'active' | 'routing' | 'crumbled'

// Apply resolve logic during battle phase
const newState = resolveProcessor.apply('turn_start', state, {
  activeUnit: unit,
  seed: 12345,
});
```

Faction-specific behavior:
- Human units with `resolve === 0` and `humanRetreat: true` → routing (flee)
- Undead units with `resolve === 0` and `undeadCrumble: true` → crumbled (destroyed)

### Tier 1: Engagement (Zone of Control)

The engagement system controls how units interact in close proximity. Melee units project a Zone of Control (ZoC) to adjacent cells.

```typescript
import { createEngagementProcessor, DEFAULT_ENGAGEMENT_CONFIG } from '@core/mechanics';
import type { EngagementStatus, ZoCCheckResult, AoOTrigger } from '@core/mechanics';

const engagementProcessor = createEngagementProcessor({
  attackOfOpportunity: true,
  archerPenalty: true,
  archerPenaltyPercent: 0.5,
});

// Check engagement status
const status: EngagementStatus = engagementProcessor.getEngagementStatus(unit, state);
// Returns: 'free' | 'engaged' | 'pinned' (engaged by 2+ enemies)

// Get Zone of Control for a unit
const zoc = engagementProcessor.getZoneOfControl(unit);
// zoc.cells: adjacent positions controlled by unit
// zoc.active: true if unit is alive and has ZoC

// Check if position is in any unit's ZoC
const check: ZoCCheckResult = engagementProcessor.checkZoneOfControl(position, state);
// check.inZoC: true if position is controlled
// check.controllingUnits: IDs of units controlling this position
// check.triggersAoO: true if moving here triggers Attack of Opportunity

// Check for Attack of Opportunity triggers during movement
const triggers: AoOTrigger[] = engagementProcessor.checkAttackOfOpportunity(
  unit,
  fromPosition,
  toPosition,
  state,
);

// Execute Attack of Opportunity
for (const trigger of triggers) {
  const result = engagementProcessor.executeAttackOfOpportunity(trigger, state, seed);
  // result.hit: true if AoO hit
  // result.damage: damage dealt (50% of normal attack)
  // result.state: updated battle state
}

// Get archer penalty when engaged
const penalty = engagementProcessor.getArcherPenalty(archer, state, DEFAULT_ENGAGEMENT_CONFIG);
// Returns: 1.0 (no penalty) or 0.5 (50% damage when engaged)

// Update all unit engagements after movement
const newState = engagementProcessor.updateEngagements(state);
```

### Tier 1: Flanking

The flanking system provides damage bonuses based on attack angle. Requires facing mechanic to be enabled.

```typescript
import { createFlankingProcessor, createFacingProcessor } from '@core/mechanics';
import type { AttackArc, FlankingResult } from '@core/mechanics';

const facingProcessor = createFacingProcessor();
const flankingProcessor = createFlankingProcessor();

// First, determine attack arc using facing processor
const arc: AttackArc = facingProcessor.getAttackArc(attacker, target);

// Get damage modifier based on attack arc
const modifier = flankingProcessor.getDamageModifier(arc);
// front: 1.0 (no bonus)
// flank: 1.15 (+15% damage)
// rear: 1.3 (+30% damage)

// Calculate resolve damage for flanking attacks
const resolveDamage = flankingProcessor.getResolveDamage(arc, resolveConfig);
// front: 0
// flank: 12 (from config.flankingResolveDamage)
// rear: 20 (from config.rearResolveDamage)

// Check if attack disables riposte
const noRiposte = flankingProcessor.disablesRiposte(arc);
// true for flank and rear attacks

// Get all flanking effects at once
const result: FlankingResult = flankingProcessor.calculateFlankingEffects(arc, resolveConfig);
// result.arc: 'rear'
// result.damageModifier: 1.3
// result.resolveDamage: 20
// result.disablesRiposte: true

// Apply flanking to damage calculation
const baseDamage = calculatePhysicalDamage(attacker, target);
const finalDamage = Math.floor(baseDamage * modifier);
```

### Combining Tier 0-1 Mechanics

Example of using facing, flanking, resolve, and engagement together:

```typescript
import {
  createMechanicsProcessor,
  createFacingProcessor,
  createFlankingProcessor,
  createResolveProcessor,
  createEngagementProcessor,
  DEFAULT_RESOLVE_CONFIG,
  DEFAULT_ENGAGEMENT_CONFIG,
} from '@core/mechanics';

// Create individual processors
const facingProcessor = createFacingProcessor();
const flankingProcessor = createFlankingProcessor();
const resolveProcessor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);
const engagementProcessor = createEngagementProcessor(DEFAULT_ENGAGEMENT_CONFIG);

// Or use the unified mechanics processor
const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  resolve: DEFAULT_RESOLVE_CONFIG,
  engagement: DEFAULT_ENGAGEMENT_CONFIG,
});

// Example: Calculate damage with all modifiers
function calculateDamageWithMechanics(
  attacker: BattleUnit,
  target: BattleUnit,
  state: BattleState,
): { damage: number; resolveDamage: number } {
  // 1. Get attack arc
  const arc = facingProcessor.getAttackArc(attacker, target);
  
  // 2. Get flanking damage modifier
  const flankingModifier = flankingProcessor.getDamageModifier(arc);
  
  // 3. Get archer penalty if engaged
  const archerPenalty = engagementProcessor.getArcherPenalty(
    attacker,
    state,
    DEFAULT_ENGAGEMENT_CONFIG,
  );
  
  // 4. Calculate final damage
  const baseDamage = Math.max(1, attacker.stats.atk - target.stats.armor);
  const damage = Math.floor(baseDamage * flankingModifier * archerPenalty);
  
  // 5. Calculate resolve damage
  const resolveDamage = flankingProcessor.getResolveDamage(arc, DEFAULT_RESOLVE_CONFIG);
  
  return { damage, resolveDamage };
}
```

### Helper Utilities

Immutable state update helpers for mechanics processors:

```typescript
import { updateUnit, updateUnits, findUnit } from '@core/mechanics';

// Update a single unit immutably
const damagedUnit = { ...unit, currentHp: unit.currentHp - damage };
const newState = updateUnit(state, damagedUnit);

// Update multiple units at once
const newState = updateUnits(state, [
  { ...attacker, currentHp: attacker.currentHp - counterDamage },
  { ...defender, currentHp: defender.currentHp - attackDamage },
]);

// Find a unit by ID
const target = findUnit(state, targetId);
if (target?.alive) {
  // Process target
}
```

### Dependency Resolution

Mechanics have dependencies that are automatically resolved:

```typescript
import { resolveDependencies, MECHANIC_DEPENDENCIES } from '@core/mechanics';

// View dependency graph
console.log(MECHANIC_DEPENDENCIES);
// {
//   facing: [],
//   flanking: ['facing'],
//   riposte: ['flanking'],
//   engagement: [],
//   intercept: ['engagement'],
//   ...
// }

// Dependencies are auto-resolved when creating processor
const processor = createMechanicsProcessor({
  riposte: true,  // Enables riposte
  // flanking: true (auto-enabled, riposte depends on it)
  // facing: true (auto-enabled, flanking depends on it)
});
```

### Testing Mechanics

```bash
# Run all mechanics tests
npm test -- --testPathPattern=mechanics/

# Run specific tier tests
npm test -- tier0/facing
npm test -- tier1/resolve
npm test -- tier1/engagement
npm test -- tier1/flanking

# Run integration tests
npm test -- tier0-1.integration.spec.ts
```

## See Also

- [Game Module](../game/README.md) - Game-specific implementations
- [Architecture](../../../docs/ARCHITECTURE.md) - System architecture
- [Engineering Guide](../../../docs/ENGINEERING_GUIDE.md) - Coding standards
