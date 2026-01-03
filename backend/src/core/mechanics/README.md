# Core Mechanics 2.0

Modular battle mechanics system with feature flags. All mechanics are optional and can be enabled/disabled independently while maintaining full backward compatibility with Core 1.0.

## Quick Start

```typescript
import {
  createMechanicsProcessor,
  MVP_PRESET,
  ROGUELIKE_PRESET,
  TACTICAL_PRESET,
} from '@core/mechanics';
import { simulateBattle } from '../battle/battle.simulator';

// MVP mode (all mechanics disabled, identical to Core 1.0)
const mvpProcessor = createMechanicsProcessor(MVP_PRESET);
const result = simulateBattle(playerTeam, enemyTeam, seed, mvpProcessor);

// Roguelike mode (all 14 mechanics enabled)
const roguelikeProcessor = createMechanicsProcessor(ROGUELIKE_PRESET);

// Custom configuration (dependencies auto-resolved)
const customProcessor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  resolve: { maxResolve: 100, baseRegeneration: 5 },
});
```

## Presets

| Preset | Description | Mechanics |
|--------|-------------|-----------|
| `MVP_PRESET` | All disabled | None (Core 1.0 behavior) |
| `TACTICAL_PRESET` | Tier 0-2 | facing, flanking, resolve, engagement, riposte, intercept |
| `ROGUELIKE_PRESET` | All enabled | All 14 mechanics |

## Mechanics by Tier

### Tier 0: Foundation
- **Facing** - Directional combat (N/S/E/W), attack arcs (front/flank/rear)

### Tier 1: Core Combat
- **Resolve** - Morale system, routing/crumbling at 0 resolve
- **Engagement** - Zone of Control, Attack of Opportunity
- **Flanking** - Damage bonuses based on attack angle (+15% flank, +30% rear)

### Tier 2: Advanced
- **Riposte** - Counter-attacks from front arc, Initiative-based chance
- **Intercept** - Movement blocking (hard: spearmen stop cavalry, soft: engage)
- **Aura** - Area effects (static buffs, pulse heals)

### Tier 3: Specialized
- **Charge** - Momentum-based damage bonus for cavalry
- **Overwatch** - Vigilance mode, react to enemy movement
- **Phalanx** - Formation bonuses for adjacent allies
- **Line of Sight** - Direct/arc fire, obstacle blocking
- **Ammunition** - Ammo tracking for ranged, cooldowns for mages

### Tier 4: Counter-Mechanics
- **Contagion** - Status effects spread to adjacent units (counters phalanx)
- **Armor Shred** - Armor degradation on physical attacks

## Dependency Resolution

Mechanics have dependencies that are automatically resolved:

```
facing ← flanking ← riposte
engagement ← intercept
phalanx (independent)
contagion (independent)
armorShred (independent)
```

When you enable a mechanic, its dependencies are auto-enabled:
```typescript
// Enabling riposte auto-enables flanking and facing
const processor = createMechanicsProcessor({ riposte: true });
```

## Integration with Battle Simulator

The `simulateBattle()` function accepts an optional `MechanicsProcessor`:

```typescript
// Without processor (Core 1.0 behavior)
const result1 = simulateBattle(playerTeam, enemyTeam, seed);

// With processor (Core 2.0 mechanics)
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result2 = simulateBattle(playerTeam, enemyTeam, seed, processor);
```

Phase hooks are called during battle:
- `turn_start` - Resolve regeneration, aura pulses
- `movement` - Intercept checks, engagement updates
- `pre_attack` - Facing rotation, flanking calculation
- `attack` - Riposte triggers, damage modifiers
- `post_attack` - Armor shred application
- `turn_end` - Contagion spread, status decay

## Performance

Benchmarks show minimal overhead:
- MVP preset: ~0% overhead (identical to Core 1.0)
- ROGUELIKE preset: <50% overhead with all mechanics
- Processor creation: <1ms

## Migration from Core 1.0

1. No changes required for existing code
2. Pass `undefined` or no processor for Core 1.0 behavior
3. Use `MVP_PRESET` for explicit Core 1.0 compatibility
4. Gradually enable mechanics as needed

## Documentation

For detailed API documentation and examples, see:
- `backend/src/core/README.md` - Full mechanics API with code examples
- Individual processor files in `tier0/`, `tier1/`, `tier2/`, `tier3/`, `tier4/`

## Testing

```bash
# Run all mechanics tests
npm test -- --testPathPattern="mechanics"

# Run specific tier tests
npm test -- --testPathPattern="tier1"

# Run benchmark tests
npm test -- --testPathPattern="benchmark"
```
