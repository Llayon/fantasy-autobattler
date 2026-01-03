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

### Tier 3: Charge (Cavalry Momentum)

The charge system provides damage bonuses based on distance moved before attacking. Cavalry units build momentum as they move, dealing increased damage on impact. Spearmen with Spear Wall can counter charges.

```typescript
import { createChargeProcessor, DEFAULT_CHARGE_CONFIG } from '@core/mechanics';
import type { ChargeConfig, UnitWithCharge, ChargeEligibility } from '@core/mechanics';

const chargeProcessor = createChargeProcessor({
  momentumPerCell: 0.2,      // +20% damage per cell moved
  maxMomentum: 1.0,          // Maximum +100% damage bonus
  shockResolveDamage: 10,    // Resolve damage on charge impact
  minChargeDistance: 3,      // Minimum cells to qualify for charge
});

// Calculate momentum from distance moved
const momentum = chargeProcessor.calculateMomentum(5, DEFAULT_CHARGE_CONFIG);
// distance=5: momentum = min(1.0, 5 * 0.2) = 1.0 (capped)

// Apply charge bonus to damage
const baseDamage = 20;
const totalDamage = chargeProcessor.applyChargeBonus(baseDamage, momentum);
// totalDamage = floor(20 * (1 + 1.0)) = 40

// Check if unit can charge
const eligibility: ChargeEligibility = chargeProcessor.canCharge(cavalry, 4, DEFAULT_CHARGE_CONFIG);
// eligibility.canCharge: true if cavalry tag and moved >= 3 cells
// eligibility.momentum: 0.8 (4 * 0.2)

// Check for Spear Wall counter
if (chargeProcessor.isCounteredBySpearWall(target)) {
  const counterDamage = chargeProcessor.calculateCounterDamage(target);
  // counterDamage = floor(target.atk * 1.5) - 150% damage to charger
}

// Track movement for momentum calculation
const updatedCavalry = chargeProcessor.trackMovement(cavalry, path, DEFAULT_CHARGE_CONFIG);
// updatedCavalry.momentum: calculated from path length
// updatedCavalry.isCharging: true if momentum > 0

// Execute charge attack
const result = chargeProcessor.executeCharge(cavalry, infantry, state, DEFAULT_CHARGE_CONFIG, seed);
// result.damage: base damage + momentum bonus
// result.shockDamage: resolve damage to target
// result.wasCountered: true if stopped by Spear Wall

// Reset charge state at turn end
const resetUnit = chargeProcessor.resetCharge(cavalry);
```

Momentum formula:
- If distance < minChargeDistance: momentum = 0
- Otherwise: momentum = min(maxMomentum, distance × momentumPerCell)

Charge damage formula:
- totalDamage = floor(baseDamage × (1 + momentum))

Spear Wall counter:
- Spearmen with `spear_wall` tag stop cavalry charges
- Counter damage = floor(spearman.atk × 1.5)

### Tier 3: Overwatch (Ranged Reaction Fire)

The overwatch system allows ranged units to enter a Vigilance state and automatically fire at enemies that move within their range. Requires intercept and ammunition mechanics.

```typescript
import { createOverwatchProcessor } from '@core/mechanics';
import type { UnitWithOverwatch, OverwatchCheckResult, OverwatchShotResult } from '@core/mechanics';

const overwatchProcessor = createOverwatchProcessor({
  damageModifier: 0.75,      // 75% of normal damage
  maxShots: 1,               // Shots per round
  accuracyPenalty: 0.2,      // 20% accuracy penalty
});

// Check if unit can enter vigilance
if (overwatchProcessor.canEnterVigilance(archer)) {
  // Enter vigilance state (skips attack action)
  const result = overwatchProcessor.enterVigilance(archer, state);
  // result.unit.vigilance: 'active'
  // result.unit.overwatchShotsRemaining: 1
}

// Check if unit is in vigilance
const isVigilant = overwatchProcessor.isVigilant(archer);

// Check for overwatch triggers along enemy movement path
const check: OverwatchCheckResult = overwatchProcessor.checkOverwatch(enemy, path, state);
// check.hasOverwatch: true if any vigilant enemies can fire
// check.opportunities: array of overwatch opportunities
// check.totalShots: number of shots that will be fired

// Execute overwatch shot
const shot: OverwatchShotResult = overwatchProcessor.executeOverwatchShot(
  archer,
  enemy,
  state,
  seed,
);
// shot.hit: true if shot hit (based on accuracy roll)
// shot.damage: floor(archer.atk * 0.75)
// shot.ammoConsumed: 1
// shot.watcherShotsRemaining: 0

// Toggle vigilance state
const toggle = overwatchProcessor.toggleVigilance(archer, state);
// toggle.action: 'entered' or 'exited'

// Reset overwatch at turn end
const resetUnit = overwatchProcessor.resetOverwatch(archer);
```

Overwatch damage formula:
- damage = floor(watcher.atk × damageModifier)

Hit chance formula:
- hitChance = 1.0 - accuracyPenalty - targetDodge
- Roll < hitChance = hit

Vigilance states:
- `inactive`: Not in overwatch
- `active`: Ready to fire
- `triggered`: Has fired this round
- `exhausted`: Out of shots

### Tier 3: Phalanx (Formation Bonuses)

The phalanx system provides defensive bonuses to units in tight formations. Units gain armor and resolve bonuses based on adjacent allies facing the same direction. Requires facing mechanic.

```typescript
import { createPhalanxProcessor, DEFAULT_PHALANX_CONFIG } from '@core/mechanics';
import type { PhalanxConfig, UnitWithPhalanx, FormationDetectionResult } from '@core/mechanics';

const phalanxProcessor = createPhalanxProcessor({
  maxArmorBonus: 5,          // Maximum armor bonus
  maxResolveBonus: 25,       // Maximum resolve bonus
  armorPerAlly: 1,           // Armor per adjacent ally
  resolvePerAlly: 5,         // Resolve per adjacent ally
});

// Check if unit can join phalanx
const eligibility = phalanxProcessor.canJoinPhalanx(spearman);
// eligibility.canJoinPhalanx: true if has 'phalanx' tag and facing set

// Detect formation (adjacent allies facing same direction)
const detection: FormationDetectionResult = phalanxProcessor.detectFormation(spearman, state);
// detection.adjacentAllies: all adjacent allies
// detection.alignedAllies: allies facing same direction
// detection.alignedCount: number of aligned allies
// detection.canFormPhalanx: true if alignedCount > 0

// Calculate bonuses based on adjacent allies
const bonuses = phalanxProcessor.calculateBonuses(3, DEFAULT_PHALANX_CONFIG);
// bonuses.armorBonus: 3 (3 × 1)
// bonuses.resolveBonus: 15 (3 × 5)
// bonuses.formationState: 'partial' | 'full' | 'none'

// Get effective armor/resolve including phalanx bonus
const effectiveArmor = phalanxProcessor.getEffectiveArmor(spearman);
const effectiveResolve = phalanxProcessor.getEffectiveResolve(spearman);

// Update phalanx state for a unit
const updatedUnit = phalanxProcessor.updateUnitPhalanx(spearman, state, DEFAULT_PHALANX_CONFIG);
// updatedUnit.inPhalanx: true
// updatedUnit.phalanxArmorBonus: calculated bonus
// updatedUnit.phalanxResolveBonus: calculated bonus

// Recalculate all formations after casualties
const result = phalanxProcessor.recalculate(state, 'unit_death');
// result.unitsUpdated: IDs of units with changed bonuses
// result.formationsChanged: number of formation changes

// Check if unit is in phalanx
const inPhalanx = phalanxProcessor.isInPhalanx(spearman);

// Clear phalanx state when unit leaves formation
const clearedUnit = phalanxProcessor.clearPhalanx(spearman);
```

Phalanx bonus formulas:
- armorBonus = min(maxArmorBonus, adjacentCount × armorPerAlly)
- resolveBonus = min(maxResolveBonus, adjacentCount × resolvePerAlly)

Formation states:
- `none`: No adjacent aligned allies
- `partial`: 1-3 adjacent aligned allies
- `full`: 4 adjacent aligned allies (maximum)

Note: Phalanx formations are vulnerable to contagion (Tier 4) - dense formations spread effects faster.

### Tier 3: Line of Sight (Ranged Attack Validation)

The Line of Sight system controls ranged attack validation. It determines whether a ranged unit can target an enemy based on obstacles and firing mode. Requires facing mechanic.

```typescript
import { createLoSProcessor, DEFAULT_LOS_CONFIG } from '@core/mechanics';
import type { LoSConfig, UnitWithLoS, LoSCheckResult, LoSValidationResult } from '@core/mechanics';

const losProcessor = createLoSProcessor({
  directFire: true,          // Enable direct fire (blocked by units)
  arcFire: true,             // Enable arc fire (ignores obstacles)
  arcFirePenalty: 0.2,       // 20% accuracy penalty for arc fire
});

// Calculate line of sight path using Bresenham's algorithm
const line = losProcessor.getLineOfSight(archer.position, enemy.position);
// line.cells: all cells along the line
// line.length: number of cells

// Check if position is blocked by obstacle
const obstacle = losProcessor.isBlocked(position, state, excludeUnitId);
// obstacle.type: 'unit' | 'terrain'
// obstacle.unitId: blocking unit ID (if unit)

// Check firing arc (based on unit facing)
const arcCheck = losProcessor.checkFiringArc(archer, enemy);
// arcCheck.inArc: true if target is within firing arc
// arcCheck.angle: angle to target in degrees
// arcCheck.arcLimit: half of unit's firing arc
// arcCheck.relativeDirection: 'front' | 'side' | 'rear'

// Full LoS check (range, arc, obstacles)
const losCheck: LoSCheckResult = losProcessor.checkLoS(archer, enemy, state);
// losCheck.hasLoS: true if can attack (direct or arc)
// losCheck.directLoS: true if unobstructed line
// losCheck.arcLoS: true if can use arc fire
// losCheck.obstacles: array of blocking obstacles
// losCheck.recommendedMode: 'direct' | 'arc' | 'blocked'
// losCheck.distance: Manhattan distance to target

// Validate ranged attack with accuracy modifier
const validation: LoSValidationResult = losProcessor.validateRangedAttack(
  archer,
  enemy,
  state,
  DEFAULT_LOS_CONFIG,
);
// validation.valid: true if attack is allowed
// validation.fireMode: 'direct' | 'arc' | 'blocked'
// validation.accuracyModifier: 1.0 for direct, 0.8 for arc

// Get accuracy modifier for fire mode
const accuracy = losProcessor.getAccuracyModifier('arc', DEFAULT_LOS_CONFIG);
// direct: 1.0, arc: 0.8, blocked: 0.0

// Find all valid targets within range and LoS
const targets = losProcessor.findValidTargets(archer, state, DEFAULT_LOS_CONFIG);
// Array of { target, losCheck } for each valid target
```

Fire modes:
- Direct Fire: Straight-line attacks, blocked by units/obstacles, 100% accuracy
- Arc Fire: Lobbed attacks (catapults, mages), ignores obstacles, reduced accuracy

Firing arc calculation:
- Default firing arc: 90° (45° each side of facing)
- Target must be within arc to be attacked

### Tier 3: Ammunition (Resource Management)

The ammunition system tracks resource consumption for ranged units and ability cooldowns for mages. Independent mechanic but required by overwatch.

```typescript
import { createAmmunitionProcessor, DEFAULT_AMMO_CONFIG } from '@core/mechanics';
import type { AmmoConfig, UnitWithAmmunition, AmmoCheckResult, CooldownCheckResult } from '@core/mechanics';

const ammoProcessor = createAmmunitionProcessor({
  enabled: true,
  mageCooldowns: true,       // Mages use cooldowns instead of ammo
  defaultAmmo: 6,            // Default ammo for ranged units
  defaultCooldown: 3,        // Default cooldown for mage abilities
});

// Determine resource type for a unit
const resourceType = ammoProcessor.getResourceType(archer);
// 'ammo' for ranged, 'cooldown' for mages, 'none' for melee

// Check if ranged unit can attack
const ammoCheck: AmmoCheckResult = ammoProcessor.checkAmmo(archer);
// ammoCheck.canAttack: true if has ammo
// ammoCheck.ammoRemaining: current ammo count
// ammoCheck.ammoState: 'full' | 'partial' | 'empty' | 'reloading'

// Check if mage ability is ready
const cooldownCheck: CooldownCheckResult = ammoProcessor.checkCooldown(mage, 'fireball');
// cooldownCheck.canUse: true if off cooldown
// cooldownCheck.turnsRemaining: turns until ready
// cooldownCheck.cooldownState: 'ready' | 'cooling' | 'reduced'

// Consume ammunition on ranged attack
const consumeResult = ammoProcessor.consumeAmmo(archer, state, 1);
// consumeResult.success: true if had ammo
// consumeResult.ammoConsumed: 1
// consumeResult.ammoRemaining: new ammo count

// Trigger cooldown after ability use
const triggerResult = ammoProcessor.triggerCooldown(mage, 'fireball', state, 3);
// triggerResult.cooldownDuration: 3 turns
// triggerResult.unit: updated mage with cooldown

// Reload ammunition (at turn start or via ability)
const reloadResult = ammoProcessor.reload(archer, state);
// reloadResult.ammoRestored: amount restored
// reloadResult.newAmmo: new ammo count

// Tick cooldowns at turn start (reduces by 1)
const tickResult = ammoProcessor.tickCooldowns(mage);
// tickResult.abilitiesReady: abilities now off cooldown
// tickResult.cooldownsReduced: new cooldown values

// Get current ammo/cooldown state
const ammoState = ammoProcessor.getAmmoState(archer);
const cooldownState = ammoProcessor.getCooldownState(mage, 'fireball');

// Initialize unit with resource state at battle start
const initializedUnit = ammoProcessor.initializeUnit(archer, DEFAULT_AMMO_CONFIG);
// Sets ammo to maxAmmo, initializes cooldowns
```

Resource types:
- Ammo: Ranged units (archers, crossbowmen) - consumed per attack
- Cooldown: Mages - abilities have cooldown after use
- None: Melee units - no resource tracking

Special tags:
- `unlimited_ammo`: Unit never runs out of ammo
- `quick_cooldown`: Cooldowns tick by 2 instead of 1

### Combining Tier 3 Mechanics

Example of using charge, overwatch, phalanx, LoS, and ammunition together:

```typescript
import {
  createMechanicsProcessor,
  createChargeProcessor,
  createOverwatchProcessor,
  createPhalanxProcessor,
  createLoSProcessor,
  createAmmunitionProcessor,
  DEFAULT_CHARGE_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_LOS_CONFIG,
  DEFAULT_AMMO_CONFIG,
} from '@core/mechanics';

// Create unified processor with all Tier 3 mechanics
const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  engagement: true,
  intercept: true,
  charge: DEFAULT_CHARGE_CONFIG,
  overwatch: true,
  phalanx: DEFAULT_PHALANX_CONFIG,
  lineOfSight: DEFAULT_LOS_CONFIG,
  ammunition: DEFAULT_AMMO_CONFIG,
});

// Example: Process cavalry charge with all mechanics
function processCavalryCharge(
  cavalry: BattleUnit & UnitWithCharge,
  target: BattleUnit,
  state: BattleState,
  seed: number,
): BattleState {
  const chargeProcessor = createChargeProcessor(DEFAULT_CHARGE_CONFIG);
  const overwatchProcessor = createOverwatchProcessor();
  const phalanxProcessor = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

  // 1. Check for overwatch triggers during movement
  const path = findPath(cavalry.position, target.position, state);
  const overwatchCheck = overwatchProcessor.checkOverwatch(cavalry, path, state);

  let currentState = state;
  let currentSeed = seed;

  // 2. Execute overwatch shots (may damage/kill cavalry)
  for (const opportunity of overwatchCheck.opportunities) {
    if (opportunity.canFire) {
      const shot = overwatchProcessor.executeOverwatchShot(
        opportunity.watcher,
        cavalry,
        currentState,
        currentSeed++,
      );
      currentState = shot.state;

      // If cavalry died, abort charge
      if (shot.targetNewHp <= 0) {
        return currentState;
      }
    }
  }

  // 3. Track movement and calculate momentum
  const movedCavalry = chargeProcessor.trackMovement(cavalry, path, DEFAULT_CHARGE_CONFIG);

  // 4. Check for Spear Wall counter
  if (chargeProcessor.isCounteredBySpearWall(target)) {
    const counterDamage = chargeProcessor.calculateCounterDamage(target);
    // Apply counter damage to cavalry, stop charge
    return applyDamage(currentState, cavalry.id, counterDamage);
  }

  // 5. Execute charge attack
  const chargeResult = chargeProcessor.executeCharge(
    movedCavalry,
    target,
    currentState,
    DEFAULT_CHARGE_CONFIG,
    currentSeed,
  );

  // 6. Recalculate phalanx formations after casualties
  if (chargeResult.targetNewHp <= 0) {
    const phalanxResult = phalanxProcessor.recalculate(chargeResult.state, 'unit_death');
    return phalanxResult.state;
  }

  return chargeResult.state;
}

// Example: Ranged attack with LoS and ammunition
function processRangedAttack(
  archer: BattleUnit & UnitWithLoS & UnitWithAmmunition,
  target: BattleUnit,
  state: BattleState,
  seed: number,
): BattleState {
  const losProcessor = createLoSProcessor(DEFAULT_LOS_CONFIG);
  const ammoProcessor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

  // 1. Check ammunition
  const ammoCheck = ammoProcessor.checkAmmo(archer);
  if (!ammoCheck.canAttack) {
    return state; // No ammo, cannot attack
  }

  // 2. Validate LoS
  const validation = losProcessor.validateRangedAttack(archer, target, state, DEFAULT_LOS_CONFIG);
  if (!validation.valid) {
    return state; // No LoS, cannot attack
  }

  // 3. Consume ammunition
  const consumeResult = ammoProcessor.consumeAmmo(archer, state);
  let currentState = updateUnit(consumeResult.state ?? state, consumeResult.unit);

  // 4. Calculate damage with accuracy modifier
  const baseDamage = archer.stats.atk;
  const accuracyRoll = seededRandom(seed);
  const hitChance = validation.accuracyModifier;

  if (accuracyRoll < hitChance) {
    // Hit - apply damage
    currentState = applyDamage(currentState, target.id, baseDamage);
  }

  return currentState;
}
```

### Tier 4: Contagion (Effect Spreading)

The contagion system allows status effects to spread from infected units to adjacent units. Contagion is designed as a counter-mechanic to phalanx formations - dense formations have increased spread risk.

```typescript
import { createContagionProcessor, DEFAULT_CONTAGION_CONFIG } from '@core/mechanics';
import type {
  ContagionConfig,
  ContagionType,
  UnitWithContagion,
  ContagiousEffect,
  SpreadEligibility,
  SpreadPhaseResult,
} from '@core/mechanics';

const contagionProcessor = createContagionProcessor({
  fireSpread: 0.5,           // 50% chance for fire to spread
  poisonSpread: 0.3,         // 30% chance for poison to spread
  curseSpread: 0.25,         // 25% chance for curse to spread
  frostSpread: 0.2,          // 20% chance for frost to spread
  plagueSpread: 0.6,         // 60% chance for plague to spread
  phalanxSpreadBonus: 0.15,  // +15% spread chance if target in phalanx
});

// Get base spread chance for an effect type
const plagueChance = contagionProcessor.getSpreadChance('plague', DEFAULT_CONTAGION_CONFIG);
// Returns: 0.6 (60%)

// Get effective spread chance including phalanx bonus
const effectiveChance = contagionProcessor.getEffectiveSpreadChance(
  'plague',
  targetInPhalanx,
  DEFAULT_CONTAGION_CONFIG,
);
// Returns: 0.75 (60% + 15% phalanx bonus)

// Find adjacent units that can be infected
const targets = contagionProcessor.findSpreadTargets(infectedUnit, state.units);
// Returns: units with Manhattan distance = 1 and HP > 0

// Check if a specific effect can spread to a target
const eligibility: SpreadEligibility = contagionProcessor.canSpreadTo(
  'fire',
  infectedUnit,
  adjacentUnit,
  DEFAULT_CONTAGION_CONFIG,
);
// eligibility.canSpread: true if target can be infected
// eligibility.reason: 'immune' | 'already_infected' | 'dead' | etc.
// eligibility.spreadChance: calculated spread chance
// eligibility.phalanxBonusApplied: true if target in phalanx

// Get all contagious effects from a unit
const effects: ContagiousEffect[] = contagionProcessor.getContagiousEffects(unit);
// Returns effects with type in ['fire', 'poison', 'curse', 'frost', 'plague']

// Apply a contagious effect to a target
const infectedTarget = contagionProcessor.applyEffect(target, plagueEffect, source.id);
// target.statusEffects now includes the plague effect

// Spread all effects at turn end (main spread phase)
const newState = contagionProcessor.spreadEffects(state, seed);

// Spread with detailed results for logging
const result: SpreadPhaseResult = contagionProcessor.spreadEffectsWithDetails(
  state,
  seed,
  DEFAULT_CONTAGION_CONFIG,
);
// result.totalAttempts: number of spread attempts
// result.totalSuccessful: number of successful spreads
// result.allNewlyInfectedIds: IDs of newly infected units
// result.unitResults: detailed results per source unit

// Apply contagion logic during battle phase
const newState = contagionProcessor.apply('turn_end', state, {
  activeUnit: currentUnit,
  seed: 12345,
});
```

Contagion types and default spread chances:
- `plague`: 60% - Disease spreads rapidly in close quarters
- `fire`: 50% - Burns spread quickly through contact
- `poison`: 30% - Toxins spread moderately through contact
- `curse`: 25% - Magical afflictions spread slowly
- `frost`: 20% - Cold effects require sustained exposure

Spread formula:
- `effectiveChance = baseChance + (inPhalanx ? phalanxSpreadBonus : 0)`
- Roll < effectiveChance = spread succeeds

Phalanx counter-synergy:
- Units in phalanx formation gain defensive bonuses but have +15% spread risk
- This creates a strategic trade-off: tight formations are strong but vulnerable to contagion

### Tier 4: Armor Shred (Armor Degradation)

The armor shred system reduces target armor on physical attacks. Armor shred is a fully independent mechanic (no dependencies) that accumulates over multiple attacks.

```typescript
import { createShredProcessor, DEFAULT_SHRED_CONFIG } from '@core/mechanics';
import type {
  ShredConfig,
  UnitWithArmorShred,
  ApplyShredResult,
  EffectiveArmorResult,
  DecayShredResult,
} from '@core/mechanics';

const shredProcessor = createShredProcessor({
  shredPerAttack: 1,         // 1 armor shred per physical attack
  maxShredPercent: 0.4,      // Maximum 40% of base armor can be shredded
  decayPerTurn: 0,           // No decay (shred is permanent)
});

// Apply shred on physical attack
const shreddedTarget = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
// target.armorShred increased by shredPerAttack (capped at max)

// Apply shred with detailed results
const result: ApplyShredResult = shredProcessor.applyShredWithDetails(
  target,
  DEFAULT_SHRED_CONFIG,
);
// result.shredApplied: actual shred applied (may be less if capped)
// result.wasCapped: true if shred hit the maximum
// result.newTotalShred: new total shred on target
// result.maxShred: maximum shred for this target

// Get effective armor for damage calculation
const effectiveArmor = shredProcessor.getEffectiveArmor(unit);
// Formula: max(0, baseArmor - armorShred)
// Example: 10 armor - 3 shred = 7 effective armor

// Get detailed effective armor calculation
const details: EffectiveArmorResult = shredProcessor.getEffectiveArmorDetails(
  unit,
  DEFAULT_SHRED_CONFIG,
);
// details.baseArmor: original armor value
// details.currentShred: accumulated shred
// details.effectiveArmor: armor after shred
// details.maxShred: maximum possible shred
// details.shredPercent: percentage of armor shredded

// Calculate maximum shred for a unit
const maxShred = shredProcessor.getMaxShred(unit, DEFAULT_SHRED_CONFIG);
// Formula: floor(baseArmor * maxShredPercent)
// Example: 10 armor * 0.4 = 4 max shred

// Decay shred at turn end (if configured)
const decayedUnit = shredProcessor.decayShred(unit, {
  ...DEFAULT_SHRED_CONFIG,
  decayPerTurn: 1,  // Decay 1 shred per turn
});

// Decay with detailed results
const decayResult: DecayShredResult = shredProcessor.decayShredWithDetails(
  unit,
  { ...DEFAULT_SHRED_CONFIG, decayPerTurn: 1 },
);
// decayResult.decayAmount: shred that decayed
// decayResult.previousShred: shred before decay
// decayResult.newShred: shred after decay

// Check if unit has any shred
const hasShred = shredProcessor.hasShred(unit);
// Returns: true if armorShred > 0

// Check if unit is at maximum shred
const isMaxed = shredProcessor.isAtMaxShred(unit, DEFAULT_SHRED_CONFIG);
// Returns: true if currentShred >= maxShred

// Reset shred (for cleanse effects)
const cleansedUnit = shredProcessor.resetShred(unit);
// unit.armorShred = 0

// Apply shred logic during battle phase
const newState = shredProcessor.apply('attack', state, {
  activeUnit: attacker,
  target: defender,
  action: { type: 'attack', targetId: defender.id },
  seed: 12345,
});
```

Shred formulas:
- Max shred: `floor(baseArmor * maxShredPercent)`
- Effective armor: `max(0, baseArmor - currentShred)`
- Shred per attack: configurable (default: 1)

Example with 10 armor unit and 40% max shred:
- Max shred = floor(10 * 0.4) = 4
- After 1 attack: effective armor = 10 - 1 = 9
- After 4 attacks: effective armor = 10 - 4 = 6 (capped)
- After 5 attacks: still 6 (cannot exceed max shred)

### Combining Tier 4 Mechanics

Example of using contagion and armor shred together with other mechanics:

```typescript
import {
  createMechanicsProcessor,
  createContagionProcessor,
  createShredProcessor,
  createPhalanxProcessor,
  DEFAULT_CONTAGION_CONFIG,
  DEFAULT_SHRED_CONFIG,
  DEFAULT_PHALANX_CONFIG,
} from '@core/mechanics';

// Create unified processor with Tier 4 mechanics
const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  phalanx: DEFAULT_PHALANX_CONFIG,
  contagion: DEFAULT_CONTAGION_CONFIG,
  armorShred: DEFAULT_SHRED_CONFIG,
});

// Example: Process physical attack with armor shred
function processPhysicalAttack(
  attacker: BattleUnit,
  target: BattleUnit & UnitWithArmorShred,
  state: BattleState,
  seed: number,
): BattleState {
  const shredProcessor = createShredProcessor(DEFAULT_SHRED_CONFIG);

  // 1. Get effective armor (reduced by accumulated shred)
  const effectiveArmor = shredProcessor.getEffectiveArmor(target);

  // 2. Calculate damage with reduced armor
  const baseDamage = attacker.stats.atk;
  const damage = Math.max(1, baseDamage - effectiveArmor);

  // 3. Apply damage to target
  let currentState = applyDamage(state, target.id, damage);

  // 4. Apply new shred from this attack
  const shreddedTarget = shredProcessor.applyShred(target, DEFAULT_SHRED_CONFIG);
  currentState = updateUnit(currentState, shreddedTarget);

  return currentState;
}

// Example: Process contagion spread with phalanx interaction
function processContagionPhase(
  state: BattleState,
  seed: number,
): BattleState {
  const contagionProcessor = createContagionProcessor(DEFAULT_CONTAGION_CONFIG);
  const phalanxProcessor = createPhalanxProcessor(DEFAULT_PHALANX_CONFIG);

  // 1. Update phalanx status for all units
  let currentState = state;
  for (const unit of state.units) {
    const updatedUnit = phalanxProcessor.updateUnitPhalanx(
      unit,
      currentState,
      DEFAULT_PHALANX_CONFIG,
    );
    currentState = updateUnit(currentState, updatedUnit);
  }

  // 2. Spread contagious effects (phalanx units have higher spread risk)
  const spreadResult = contagionProcessor.spreadEffectsWithDetails(
    currentState,
    seed,
    DEFAULT_CONTAGION_CONFIG,
  );

  // 3. Log spread results
  if (spreadResult.totalSuccessful > 0) {
    console.log(`${spreadResult.totalSuccessful} effects spread to ${spreadResult.allNewlyInfectedIds.length} units`);
  }

  return spreadResult.state;
}

// Example: Full turn end processing with Tier 4 mechanics
function processTurnEnd(
  state: BattleState,
  seed: number,
): BattleState {
  const contagionProcessor = createContagionProcessor(DEFAULT_CONTAGION_CONFIG);
  const shredProcessor = createShredProcessor({
    ...DEFAULT_SHRED_CONFIG,
    decayPerTurn: 1,  // Enable shred decay
  });

  let currentState = state;
  let currentSeed = seed;

  // 1. Spread contagious effects
  currentState = contagionProcessor.spreadEffects(currentState, currentSeed++);

  // 2. Decay armor shred on all units
  for (const unit of currentState.units) {
    const shredUnit = unit as BattleUnit & UnitWithArmorShred;
    if (shredProcessor.hasShred(shredUnit)) {
      const decayedUnit = shredProcessor.decayShred(shredUnit, {
        ...DEFAULT_SHRED_CONFIG,
        decayPerTurn: 1,
      });
      currentState = updateUnit(currentState, decayedUnit);
    }
  }

  return currentState;
}
```

Strategic considerations:
- Armor shred is most effective against high-armor targets (tanks)
- Contagion counters phalanx formations - spread fire/plague to break formations
- Combine shred with flanking for maximum damage output
- Use contagion immunity on key units to protect against spread

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
npm test -- tier3/charge
npm test -- tier3/overwatch
npm test -- tier3/phalanx
npm test -- tier3/los
npm test -- tier3/ammunition
npm test -- tier4/contagion
npm test -- tier4/armor-shred

# Run integration tests
npm test -- tier0-1.integration.spec.ts
npm test -- tier2.integration.spec.ts
npm test -- tier3.integration.spec.ts
npm test -- tier4.integration.spec.ts
```

## See Also

- [Game Module](../game/README.md) - Game-specific implementations
- [Architecture](../../../docs/ARCHITECTURE.md) - System architecture
- [Engineering Guide](../../../docs/ENGINEERING_GUIDE.md) - Coding standards
