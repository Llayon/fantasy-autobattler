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

### Tier 2: Riposte (Counter-Attack)

The riposte system allows defenders to counter-attack when hit from the front arc. Riposte is disabled when attacked from flank or rear. Requires flanking mechanic (Tier 1).

```typescript
import { createRiposteProcessor, DEFAULT_RIPOSTE_CONFIG } from '@core/mechanics';
import type { RiposteConfig, UnitWithRiposte, AttackArc } from '@core/mechanics';

const riposteProcessor = createRiposteProcessor({
  initiativeBased: true,       // Use Initiative comparison for chance
  chargesPerRound: 'attackCount', // Uses unit's attack count
  baseChance: 0.5,             // 50% base chance
  guaranteedThreshold: 10,     // Initiative diff for guaranteed riposte
});

// Check if defender can riposte (front arc only, has charges)
const arc: AttackArc = 'front';
const canRiposte = riposteProcessor.canRiposte(defender, attacker, arc);
// Returns: true if front arc and has charges remaining

// Calculate riposte chance based on Initiative
const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);
// Formula: baseChance + (initDiff / guaranteedThreshold) * 0.5
// Example: defender.initiative=15, attacker.initiative=10
//   initDiff = 5, chance = 0.5 + (5/10)*0.5 = 0.75 (75%)

// Execute riposte (deals 50% of defender's ATK)
const newState = riposteProcessor.executeRiposte(defender, attacker, state);
// Damage formula: floor(defender.atk * 0.5)
// Consumes one riposte charge

// Apply riposte logic during battle phase
const newState = riposteProcessor.apply('attack', state, {
  activeUnit: attacker,
  target: defender,
  seed: 12345,
});
```

Riposte chance formula (Initiative-based):
- `initDiff >= +10`: 100% chance (guaranteed)
- `initDiff <= -10`: 0% chance (impossible)
- Otherwise: `0.5 + (initDiff / 10) * 0.5` (linear interpolation)

### Tier 2: Intercept (Movement Blocking)

The intercept system allows units to block or engage passing enemies during movement. Requires engagement mechanic (Tier 1).

```typescript
import { createInterceptProcessor, DEFAULT_INTERCEPT_CONFIG } from '@core/mechanics';
import type { InterceptConfig, UnitWithIntercept, InterceptCheckResult } from '@core/mechanics';

const interceptProcessor = createInterceptProcessor({
  hardIntercept: true,   // Spearmen stop cavalry
  softIntercept: true,   // Infantry engages passing units
  disengageCost: 2,      // Movement cost to leave engagement
});

// Check if unit can perform hard intercept (spearmen vs cavalry)
const canHard = interceptProcessor.canHardIntercept(spearman, cavalry, DEFAULT_INTERCEPT_CONFIG);
// Returns: true if spearman has 'spear_wall' tag and target is cavalry

// Check if unit can perform soft intercept (melee engages passing unit)
const canSoft = interceptProcessor.canSoftIntercept(infantry, enemy, DEFAULT_INTERCEPT_CONFIG);
// Returns: true if infantry is melee (range <= 1) and has intercepts remaining

// Check for intercept opportunities along a movement path
const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
const check: InterceptCheckResult = interceptProcessor.checkIntercept(cavalry, path, state, DEFAULT_INTERCEPT_CONFIG);
// check.hasIntercept: true if any intercept opportunity exists
// check.movementBlocked: true if hard intercept stops movement
// check.blockedAt: position where movement was stopped
// check.opportunities: all intercept opportunities along path

// Execute hard intercept (spearmen stop cavalry, deal 150% damage)
const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, seed);
// result.damage: floor(spearman.atk * 1.5)
// result.movementStopped: true
// result.stoppedAt: position where cavalry was stopped

// Execute soft intercept (infantry engages, no damage)
const result = interceptProcessor.executeSoftIntercept(infantry, enemy, state);
// result.damage: 0 (soft intercept doesn't deal damage)
// result.movementStopped: false (target can continue moving)
// Target is now marked as engaged

// Calculate disengage cost
const cost = interceptProcessor.getDisengageCost(unit, state, DEFAULT_INTERCEPT_CONFIG);
// Returns: 2 (default) if unit is engaged, 0 if not engaged

// Attempt to disengage from engagement
const disengageResult = interceptProcessor.attemptDisengage(unit, state, DEFAULT_INTERCEPT_CONFIG, seed);
// disengageResult.success: true if unit had enough movement
// disengageResult.movementCost: 2 (disengage cost)
// disengageResult.triggeredAoO: true (disengaging triggers Attack of Opportunity)
```

Intercept types:
- Hard Intercept: Spearmen (`spear_wall` tag) completely stop cavalry charges, deal 150% damage
- Soft Intercept: Melee infantry engages passing units, triggers Zone of Control

### Tier 2: Aura (Area Effects)

The aura system allows units to project area effects that influence nearby allies or enemies. Aura is an independent mechanic (no dependencies).

```typescript
import { createAuraProcessor } from '@core/mechanics';
import type { Aura, AuraProcessor, UnitWithAura, AuraStat } from '@core/mechanics';

const auraProcessor = createAuraProcessor();

// Define a leadership aura (+10% ATK to allies within range 2)
const leadershipAura: Aura = {
  id: 'leadership',
  name: 'Leadership',
  type: 'static',           // Always active while unit is alive
  target: 'allies',         // Only affects friendly units
  range: 2,                 // Manhattan distance
  effect: {
    type: 'buff_stat',
    stat: 'atk',
    value: 0.1,             // +10%
    isPercentage: true,
  },
  stackable: false,
};

// Define a healing pulse aura (heal 5 HP per turn to allies)
const healingPulse: Aura = {
  id: 'healing_pulse',
  name: 'Healing Pulse',
  type: 'pulse',            // Applies effect once per turn
  target: 'allies',
  range: 2,
  effect: {
    type: 'heal',
    value: 5,
    isPercentage: false,
  },
  pulseInterval: 1,         // Every turn
};

// Define a fear aura (-15% ATK to enemies)
const fearAura: Aura = {
  id: 'fear',
  name: 'Fear',
  type: 'static',
  target: 'enemies',
  range: 3,
  effect: {
    type: 'debuff_stat',
    stat: 'atk',
    value: 0.15,            // -15%
    isPercentage: true,
  },
  stackable: false,
};

// Find units within aura range
const alliesInRange = auraProcessor.getUnitsInRange(leader, leadershipAura, state);
// Returns: array of allied units within range 2

// Get effective stat after aura modifications
const effectiveAtk = auraProcessor.getEffectiveStat(unit, 'atk', state);
// Returns: base ATK + all aura buff/debuff modifiers

// Apply all static aura effects (call after state changes)
const newState = auraProcessor.applyStaticAuras(state);
// Recalculates all static aura buffs/debuffs

// Trigger pulse auras (call at turn start)
const newState = auraProcessor.triggerPulseAuras(state, seed);
// Applies heal/damage effects from pulse auras

// Handle aura cleanup when unit dies
const newState = auraProcessor.handleUnitDeath(state, deadUnitId);
// Removes all aura effects from the dead unit's auras

// Recalculate auras after movement
const newState = auraProcessor.recalculateAuras(state);
// Updates aura effects based on new positions

// Apply aura logic during battle phase
const newState = auraProcessor.apply('turn_start', state, {
  activeUnit: unit,
  seed: 12345,
});
```

Aura types:
- Static: Always active while unit is alive (e.g., leadership, fear)
- Pulse: Applies effect once per turn (e.g., healing pulse, damage aura)
- Relic: Item-based auras with special properties (future)

Aura targets:
- `allies`: Only affects friendly units (excluding self)
- `enemies`: Only affects enemy units
- `all`: Affects all units in range (excluding self)
- `self`: Only affects the aura source unit

### Combining Tier 2 Mechanics

Example of using riposte, intercept, and aura together:

```typescript
import {
  createMechanicsProcessor,
  createRiposteProcessor,
  createInterceptProcessor,
  createAuraProcessor,
  createFacingProcessor,
  DEFAULT_RIPOSTE_CONFIG,
  DEFAULT_INTERCEPT_CONFIG,
} from '@core/mechanics';

// Create individual processors
const facingProcessor = createFacingProcessor();
const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);
const interceptProcessor = createInterceptProcessor(DEFAULT_INTERCEPT_CONFIG);
const auraProcessor = createAuraProcessor();

// Or use the unified mechanics processor (auto-resolves dependencies)
const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  riposte: DEFAULT_RIPOSTE_CONFIG,
  intercept: DEFAULT_INTERCEPT_CONFIG,
  engagement: true,
  aura: true,
});

// Example: Process cavalry charge with intercept check
function processMovement(
  unit: BattleUnit & UnitWithIntercept,
  path: Position[],
  state: BattleState,
): BattleState {
  // 1. Check for intercept opportunities
  const interceptCheck = interceptProcessor.checkIntercept(
    unit,
    path,
    state,
    DEFAULT_INTERCEPT_CONFIG,
  );

  // 2. If hard intercept, stop movement and apply damage
  if (interceptCheck.movementBlocked && interceptCheck.firstIntercept) {
    const result = interceptProcessor.executeHardIntercept(
      interceptCheck.firstIntercept.interceptor,
      unit,
      state,
      seed,
    );
    return result.state;
  }

  // 3. If soft intercept, mark as engaged but continue
  for (const opportunity of interceptCheck.opportunities) {
    if (opportunity.type === 'soft' && opportunity.canIntercept) {
      state = interceptProcessor.executeSoftIntercept(
        opportunity.interceptor,
        unit,
        state,
      ).state;
    }
  }

  return state;
}

// Example: Process attack with riposte check
function processAttack(
  attacker: BattleUnit,
  defender: BattleUnit & UnitWithRiposte,
  state: BattleState,
  seed: number,
): BattleState {
  // 1. Determine attack arc
  const arc = facingProcessor.getAttackArc(attacker, defender);

  // 2. Apply damage (not shown)
  // ...

  // 3. Check for riposte (only from front arc)
  if (riposteProcessor.canRiposte(defender, attacker, arc)) {
    const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);
    if (seededRandom(seed) < chance) {
      state = riposteProcessor.executeRiposte(defender, attacker, state);
    }
  }

  // 4. Recalculate auras after combat
  state = auraProcessor.recalculateAuras(state);

  return state;
}
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
npm test -- tier2/riposte
npm test -- tier2/intercept
npm test -- tier2/aura

# Run integration tests
npm test -- tier0-1.integration.spec.ts
npm test -- tier2.integration.spec.ts
```

## See Also

- [Game Module](../game/README.md) - Game-specific implementations
- [Architecture](../../../docs/ARCHITECTURE.md) - System architecture
- [Engineering Guide](../../../docs/ENGINEERING_GUIDE.md) - Coding standards
