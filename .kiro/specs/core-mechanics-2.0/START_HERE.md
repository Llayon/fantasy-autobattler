# START HERE: Core Mechanics 2.0

**Status**: ✅ Design Analysis Complete  
**Next Step**: Phase 1 - Foundation  
**Date**: December 30, 2025

---

## What Is This?

Core Mechanics 2.0 is a modular system of 14 battle mechanics that extends Core 1.0. All mechanics are optional and can be enabled/disabled independently through feature flags.

### The Question We Answered

**"Won't Core 2.0 mechanics and MVP abilities duplicate each other?"**

**Answer**: **NO, they won't duplicate.**

**Why**: They work on different abstraction levels:
- **Core 2.0**: System-wide rules for ALL units (Flanking, Resolve, etc.)
- **MVP**: Unit-specific abilities for specific units (Shield Wall, Fireball, etc.)
- **Core 1.0**: Foundation layer (damage calculation, grid, turn order)

---

## Quick Overview

### Three Layers

```
LAYER 3: MVP ABILITIES (Unit-specific)
├─ Knight: Shield Wall
├─ Mage: Fireball
├─ Priest: Heal
└─ 15 total abilities

LAYER 2: CORE 2.0 MECHANICS (System-wide)
├─ Facing (direction)
├─ Resolve (morale)
├─ Flanking (flank attacks)
├─ Engagement (zone of control)
├─ Charge (cavalry momentum)
├─ Phalanx (formations)
├─ Contagion (effect spreading)
└─ 14 total mechanics

LAYER 1: CORE 1.0 FOUNDATION (Base calculations)
├─ Grid (8×10)
├─ Pathfinding (A*)
├─ Damage calculation
├─ Turn order
└─ Targeting
```

### Why No Duplication

| Aspect | Core 1.0 | Core 2.0 | MVP |
|--------|----------|----------|-----|
| **What** | Base calculations | System rules | Specific abilities |
| **Applies to** | All units | All units | Specific unit |
| **When** | Always | Specific phases | On activation |

---

## Documents to Read

### 1. Start with Overview (5 min)
- **This file** — Quick overview
- `README.md` — Specification overview

### 2. Understand Architecture (15 min)
- `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md` — Full explanation
- `docs/FAQ_ARCHITECTURE.md` — Q&A

### 3. Review Design (30 min)
- `.kiro/specs/core-mechanics-2.0/design.md` — Full design
- `.kiro/specs/core-mechanics-2.0/DESIGN_REVIEW.md` — Design validation

### 4. Plan Implementation (15 min)
- `.kiro/specs/core-mechanics-2.0/requirements.md` — Requirements
- `.kiro/specs/core-mechanics-2.0/tasks.md` — 48 tasks

---

## 14 Mechanics at a Glance

### Tier 0: Foundation (Independent)
1. **Facing** — Direction (N/S/E/W)
2. **ArmorShred** — Reduce armor

### Tier 1: Core Combat
3. **Resolve** — Morale system
4. **Engagement** — Zone of Control
5. **Flanking** — Attack arcs

### Tier 2: Advanced
6. **Riposte** — Counter-attacks
7. **Intercept** — Movement blocking
8. **Aura** — Territorial effects

### Tier 3: Specialized
9. **Charge** — Cavalry momentum
10. **Overwatch** — Reaction fire
11. **Phalanx** — Formation bonuses
12. **LineOfSight** — Firing arcs
13. **Ammunition** — Resource management

### Tier 4: Counter-Mechanics
14. **Contagion** — Effect spreading

---

## Implementation Plan

### Phase 1: Foundation (8 hours)
- [ ] Create module structure
- [ ] Define types and configurations
- [ ] Implement dependency resolution
- [ ] Create presets

### Phase 2: Tier 0-1 Mechanics (10 hours)
- [ ] Implement Facing, Resolve, Engagement, Flanking
- [ ] Write tests

### Phase 3: Tier 2 Mechanics (8 hours)
- [ ] Implement Riposte, Intercept, Aura
- [ ] Write tests

### Phase 4: Tier 3 Mechanics (12 hours)
- [ ] Implement Charge, Overwatch, Phalanx, LoS, Ammunition
- [ ] Write tests

### Phase 5: Tier 4 Mechanics (6 hours)
- [ ] Implement Contagion, ArmorShred
- [ ] Write tests

### Phase 6: Integration (8 hours)
- [ ] Integrate MechanicsProcessor into battle simulator
- [ ] Ensure backward compatibility
- [ ] Write integration tests

### Phase 7: Testing & Docs (8 hours)
- [ ] Write backward compatibility tests
- [ ] Write performance benchmarks
- [ ] Update documentation

**Total**: ~60 hours, 48 tasks

---

## Example: How It Works

### Scenario: Rogue Attacks Archer from Behind

```
1. Core 1.0: Base damage = 10
2. Core 2.0: Flanking bonus = 10 × 1.30 = 13
3. MVP: Backstab bonus = 13 × 2.0 = 26
4. Core 2.0: Resolve damage = 3 (25% of ATK)

Result: 26 damage + 3 resolve damage (no duplication)
```

---

## Key Design Decisions

### 1. Tier-Based Dependencies
Enabling a mechanic automatically enables its dependencies:
```
riposte: true → flanking: true → facing: true
```

### 2. Configuration System
Each mechanic can be:
- `false` — disabled
- `true` — enabled with defaults
- `object` — enabled with custom config

### 3. Three Presets
- **MVP_PRESET** — All disabled (current behavior)
- **ROGUELIKE_PRESET** — All enabled (new behavior)
- **TACTICAL_PRESET** — Tier 0-2 only (intermediate)

### 4. Phase Integration
Mechanics apply at different phases:
- **TURN_START**: Resolve recovery, ammo reload
- **PRE_ATTACK**: Facing validation, flanking check
- **ATTACK**: Riposte trigger, armor shred
- **POST_ATTACK**: Resolve damage, phalanx recalculate

### 5. Backward Compatibility
```typescript
// MVP mode (current behavior)
const result = simulateBattle(state, seed);

// With mechanics (new)
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

---

## File Structure

```
backend/src/core/mechanics/
├── config/
│   ├── mechanics.types.ts
│   ├── dependencies.ts
│   ├── defaults.ts
│   ├── validator.ts
│   └── presets/
│       ├── mvp.ts
│       ├── roguelike.ts
│       ├── tactical.ts
│       └── index.ts
│
├── tier0/
│   ├── facing/
│   │   ├── facing.types.ts
│   │   ├── facing.processor.ts
│   │   └── facing.spec.ts
│   └── armor-shred/
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
├── processor.ts
├── index.ts
└── README.md
```

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

### 1. Review Design (1-2 hours)
- Read `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md`
- Read `docs/FAQ_ARCHITECTURE.md`
- Read `.kiro/specs/core-mechanics-2.0/design.md`

### 2. Approve Requirements (30 min)
- Review `.kiro/specs/core-mechanics-2.0/requirements.md`
- Agree with 48 tasks in `tasks.md`

### 3. Start Phase 1 (8 hours)
- Create feature branch: `feature/core-mechanics-2.0`
- Follow tasks in `tasks.md` Phase 1
- Create PR when Phase 1 complete

### 4. Continue Implementation (52 hours)
- Follow tasks in order
- Write tests for each task
- Update documentation as you go

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

## Questions?

### Architecture Questions
- See `docs/FAQ_ARCHITECTURE.md`
- See `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md`

### Implementation Questions
- See `.kiro/specs/core-mechanics-2.0/design.md`
- See `.kiro/specs/core-mechanics-2.0/tasks.md`

### Design Questions
- See `.kiro/specs/core-mechanics-2.0/DESIGN_REVIEW.md`
- See `.kiro/specs/core-mechanics-2.0/CHECKLIST.md`

---

## Recommendation

✅ **READY FOR IMPLEMENTATION**

The design is complete and ready for implementation. All requirements are met, architecture is validated, documentation is comprehensive.

**Proceed to Phase 1 (Foundation) to begin implementation.**

---

## Document Map

```
START_HERE.md (you are here)
    ↓
README.md (specification overview)
    ↓
docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md (full explanation)
    ↓
docs/FAQ_ARCHITECTURE.md (Q&A)
    ↓
design.md (full design)
    ↓
requirements.md (detailed requirements)
    ↓
tasks.md (48 implementation tasks)
    ↓
DESIGN_REVIEW.md (design validation)
    ↓
CHECKLIST.md (review checklist)
```

---

## Ready to Start?

1. **Read** `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md` (15 min)
2. **Review** `.kiro/specs/core-mechanics-2.0/design.md` (30 min)
3. **Approve** `.kiro/specs/core-mechanics-2.0/requirements.md` (15 min)
4. **Start** Phase 1 from `tasks.md` (8 hours)

**Let's build Core Mechanics 2.0! 🚀**

