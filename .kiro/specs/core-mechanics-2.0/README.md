# Core Mechanics 2.0 Specification

**Status**: ✅ Design Analysis Complete → Ready for Implementation  
**Phase**: Design Review Complete  
**Date**: December 30, 2025

---

## Overview

Core Mechanics 2.0 — это модульная система боевых механик для расширения Core 1.0. Все механики опциональны и могут быть включены/выключены независимо через feature flags.

### The Critical Question

**"Не будут ли дублировать механики Core 2.0 и абилки из MVP друг друга?"**

**Ответ**: **НЕТ, не будут дублировать.**

**Причина**: Они работают на разных уровнях абстракции:
- **Core 2.0**: Системные правила для ВСЕХ юнитов
- **MVP**: Специфичные способности конкретных юнитов
- **Core 1.0**: Базовые расчёты

---

## Architecture

### Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE SIMULATOR                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 3: MVP ABILITIES (Специфичные)                       │
│  ════════════════════════════════════════════════════════   │
│  Knight: Shield Wall, Mage: Fireball, Priest: Heal, etc.   │
│  15 total abilities                                         │
│                                                              │
│  LAYER 2: CORE 2.0 MECHANICS (Системные)                    │
│  ════════════════════════════════════════════════════════   │
│  Facing, Resolve, Flanking, Engagement, Charge, Phalanx,   │
│  Contagion, Riposte, Intercept, Aura, LoS, Ammunition      │
│  14 total mechanics                                         │
│                                                              │
│  LAYER 1: CORE 1.0 FOUNDATION (Базовые)                     │
│  ════════════════════════════════════════════════════════   │
│  Grid, Pathfinding, Damage, Turn Order, Targeting          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Why No Duplication

| Аспект | Core 1.0 | Core 2.0 | MVP |
|--------|----------|----------|-----|
| **Что делает** | Базовые расчёты | Системные правила | Специфичные способности |
| **Применяется к** | Всем юнитам | Всем юнитам | Конкретному юниту |
| **Когда** | Всегда | На определённых фазах | При активации |
| **Примеры** | Урон, сетка | Flanking, Resolve | Shield Wall, Fireball |

---

## 14 Mechanics

### Tier 0: Foundation (Independent)
1. **Facing** — Direction (N/S/E/W) for all units
2. **ArmorShred** — Reduce target armor on physical attacks

### Tier 1: Core Combat
3. **Resolve** — Morale system (human retreat, undead crumble)
4. **Engagement** — Zone of Control (AoO, archer penalty)
5. **Flanking** — Attack arcs (front/flank/rear) with damage modifiers

### Tier 2: Advanced
6. **Riposte** — Counter-attacks based on Initiative
7. **Intercept** — Movement blocking (hard/soft intercept)
8. **Aura** — Territorial effects (static/pulse/relic)

### Tier 3: Specialized
9. **Charge** — Cavalry momentum damage bonus
10. **Overwatch** — Ranged reaction fire (vigilance state)
11. **Phalanx** — Formation bonuses (armor/resolve)
12. **LineOfSight** — Firing arcs (direct/arc fire)
13. **Ammunition** — Resource management (ammo/cooldowns)

### Tier 4: Counter-Mechanics
14. **Contagion** — Effect spreading (counters phalanx)

---

## Configuration

### MechanicsConfig Interface

```typescript
interface MechanicsConfig {
  // Tier 0
  facing: boolean;
  armorShred: ShredConfig | false;
  
  // Tier 1
  resolve: ResolveConfig | false;
  engagement: EngagementConfig | false;
  flanking: boolean;
  
  // Tier 2
  riposte: RiposteConfig | false;
  intercept: InterceptConfig | false;
  aura: boolean;
  
  // Tier 3
  charge: ChargeConfig | false;
  overwatch: boolean;
  phalanx: PhalanxConfig | false;
  lineOfSight: LoSConfig | false;
  ammunition: AmmoConfig | false;
  
  // Tier 4
  contagion: ContagionConfig | false;
}
```

### Three Presets

```typescript
// MVP mode (current behavior)
const MVP_PRESET: MechanicsConfig = {
  facing: false,
  resolve: false,
  engagement: false,
  flanking: false,
  // ... all mechanics disabled
};

// Roguelike mode (new behavior)
const ROGUELIKE_PRESET: MechanicsConfig = {
  facing: true,
  resolve: { maxResolve: 100, ... },
  engagement: { attackOfOpportunity: true, ... },
  flanking: true,
  // ... all mechanics enabled
};

// Tactical mode (intermediate)
const TACTICAL_PRESET: MechanicsConfig = {
  facing: true,
  resolve: { maxResolve: 100, ... },
  engagement: { attackOfOpportunity: true, ... },
  flanking: true,
  // ... Tier 0-2 only
};
```

---

## Phase Integration

```
TURN_START
├─ resolve.recovery()      → Regenerate resolve
├─ ammunition.reload()     → Reload ranged ammo
├─ aura.pulse()            → Apply pulse aura effects
└─ phalanx.recalculate()   → Update formation bonuses

MOVEMENT
├─ engagement.check()      → Check ZoC entry/exit
├─ intercept.trigger()     → Hard/Soft intercept
├─ overwatch.trigger()     → Ranged overwatch fire
└─ charge.accumulate()     → Build momentum

PRE_ATTACK
├─ facing.validate()       → Check attack arc
├─ flanking.check()        → Determine attack angle
├─ charge.validate()       → Apply charge bonus
├─ lineOfSight.check()     → Validate LoS for ranged
└─ ammunition.consume()    → Spend ammo/cooldown

ATTACK
├─ armorShred.apply()      → Reduce target armor
├─ riposte.trigger()       → Counter-attack check
└─ contagion.apply()       → Apply spreading effects

POST_ATTACK
├─ resolve.damage()        → Apply resolve damage
├─ phalanx.recalculate()   → Update after casualties
└─ resolve.stateCheck()    → Check rout/crumble

TURN_END
├─ contagion.spread()      → Spread effects to adjacent
├─ aura.decay()            → Reduce temporary auras
└─ overwatch.reset()       → Clear vigilance state
```

---

## Implementation Plan

### Phase 1: Foundation (8 hours)
- Create module structure
- Define types and configurations
- Implement dependency resolution
- Create presets

### Phase 2: Tier 0-1 Mechanics (10 hours)
- Implement Facing, Resolve, Engagement, Flanking
- Write unit tests
- Write integration tests

### Phase 3: Tier 2 Mechanics (8 hours)
- Implement Riposte, Intercept, Aura
- Write tests

### Phase 4: Tier 3 Mechanics (12 hours)
- Implement Charge, Overwatch, Phalanx, LoS, Ammunition
- Write tests

### Phase 5: Tier 4 Mechanics (6 hours)
- Implement Contagion, ArmorShred
- Write tests

### Phase 6: Integration (8 hours)
- Integrate MechanicsProcessor into battle simulator
- Ensure backward compatibility
- Write integration tests

### Phase 7: Testing & Docs (8 hours)
- Write backward compatibility tests
- Write performance benchmarks
- Update documentation

**Total**: ~60 hours, 48 tasks

---

## File Structure

```
backend/src/core/mechanics/
├── config/
│   ├── mechanics.types.ts          # MechanicsConfig interface
│   ├── dependencies.ts             # Dependency resolution
│   ├── defaults.ts                 # Default configurations
│   ├── validator.ts                # Config validation
│   └── presets/
│       ├── mvp.ts                  # MVP_PRESET
│       ├── roguelike.ts            # ROGUELIKE_PRESET
│       ├── tactical.ts             # TACTICAL_PRESET
│       └── index.ts                # Re-exports
│
├── tier0/
│   ├── facing/
│   │   ├── facing.types.ts
│   │   ├── facing.processor.ts
│   │   └── facing.spec.ts
│   └── armor-shred/
│       ├── armor-shred.types.ts
│       ├── armor-shred.processor.ts
│       └── armor-shred.spec.ts
│
├── tier1/
│   ├── resolve/
│   ├── engagement/
│   └── flanking/
│
├── tier2/
│   ├── riposte/
│   ├── intercept/
│   └── aura/
│
├── tier3/
│   ├── charge/
│   ├── overwatch/
│   ├── phalanx/
│   ├── los/
│   └── ammunition/
│
├── tier4/
│   └── contagion/
│
├── processor.ts                    # MechanicsProcessor factory
├── index.ts                        # Public API
└── README.md                       # Documentation
```

---

## Documents

### Analysis Documents
- `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md` — Full explanation
- `docs/FAQ_ARCHITECTURE.md` — Q&A
- `docs/ARCHITECTURE_QUICK_REFERENCE.md` — Quick reference
- `docs/IMPLEMENTATION_EXAMPLES.md` — Code examples
- `docs/ARCHITECTURE_SUMMARY.md` — Summary

### Specification Documents
- `.kiro/specs/core-mechanics-2.0/design.md` — Full design
- `.kiro/specs/core-mechanics-2.0/requirements.md` — Requirements
- `.kiro/specs/core-mechanics-2.0/tasks.md` — 48 tasks
- `.kiro/specs/core-mechanics-2.0/DESIGN_REVIEW.md` — Design review
- `.kiro/specs/core-mechanics-2.0/ANALYSIS_COMPLETE.md` — Analysis summary
- `.kiro/specs/core-mechanics-2.0/CHECKLIST.md` — Review checklist

---

## Success Criteria

### ✅ Architecture
- [x] No duplication between Core 2.0 and MVP
- [x] Clear separation of concerns
- [x] Dependency graph is acyclic
- [x] Configuration system is flexible
- [x] Backward compatibility guaranteed

### 📋 Implementation (Ready to Start)
- [ ] All 14 mechanics implemented
- [ ] All 48 tasks completed
- [ ] 100% test coverage
- [ ] MVP preset produces identical results to Core 1.0
- [ ] Roguelike preset enables all mechanics

---

## Next Steps

1. **Review Design** — Read `DESIGN_REVIEW.md`
2. **Approve Requirements** — Agree with 48 tasks
3. **Start Phase 1** — Create module structure
4. **Follow Tasks** — Execute tasks in order
5. **Write Tests** — Each task should have tests
6. **Update Docs** — Document as you go

---

## Key Insights

### 1. Layers Don't Compete
- **Core 2.0** answers "How does the system work?"
- **MVP** answers "What can this unit do?"
- They're complementary, not competing

### 2. Phases Prevent Conflicts
- Mechanics apply at different phases
- No interference between layers
- Clear execution order

### 3. Configuration Enables Flexibility
- Three presets for different use cases
- Custom configs possible
- Easy to switch between modes

### 4. Backward Compatibility is Guaranteed
- MVP preset identical to Core 1.0
- No breaking changes
- Smooth migration

### 5. Testing Strategy is Comprehensive
- Unit tests for each mechanic
- Integration tests for interactions
- Backward compatibility tests

---

## Conclusion

Core Mechanics 2.0 design is complete and ready for implementation. The architecture is sound, requirements are clear, and documentation is comprehensive.

**Key Finding**: Core 2.0 mechanics and MVP abilities do NOT duplicate each other because they work on different abstraction levels.

**Recommendation**: Proceed to Phase 1 (Foundation) to begin implementation.

