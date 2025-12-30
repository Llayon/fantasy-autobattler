# Tasks: Core Mechanics 2.0

## Overview

| Phase | Description | Tasks | Est. Hours |
|-------|-------------|-------|------------|
| 1 | Foundation | 1-6 | 8h |
| 2 | Tier 0-1 Mechanics | 7-14 | 10h |
| 3 | Tier 2 Mechanics | 15-20 | 8h |
| 4 | Tier 3 Mechanics | 21-30 | 12h |
| 5 | Tier 4 Mechanics | 31-36 | 6h |
| 6 | Integration | 37-42 | 8h |
| 7 | Testing & Docs | 43-48 | 8h |
| **Total** | | **48 tasks** | **~60h** |

---

## Phase 1: Foundation (Tasks 1-6)

### Task 1: Create mechanics module structure
- [ ] Create `backend/src/core/mechanics/` directory
- [ ] Create subdirectories: `config/`, `tier0/`, `tier1/`, `tier2/`, `tier3/`, `tier4/`
- [ ] Create `config/presets/` subdirectory
- [ ] Create placeholder `index.ts` files

### Task 2: Define MechanicsConfig types
- [ ] Create `config/mechanics.types.ts`
- [ ] Define `MechanicsConfig` interface
- [ ] Define all sub-config interfaces (ResolveConfig, RiposteConfig, etc.)
- [ ] Add JSDoc documentation for all types

### Task 3: Implement default configurations
- [ ] Create `config/defaults.ts`
- [ ] Define `DEFAULT_RESOLVE_CONFIG`
- [ ] Define `DEFAULT_ENGAGEMENT_CONFIG`
- [ ] Define `DEFAULT_RIPOSTE_CONFIG`
- [ ] Define `DEFAULT_INTERCEPT_CONFIG`
- [ ] Define `DEFAULT_CHARGE_CONFIG`
- [ ] Define `DEFAULT_PHALANX_CONFIG`
- [ ] Define `DEFAULT_LOS_CONFIG`
- [ ] Define `DEFAULT_AMMO_CONFIG`
- [ ] Define `DEFAULT_CONTAGION_CONFIG`
- [ ] Define `DEFAULT_SHRED_CONFIG`


### Task 4: Implement dependency resolution
- [ ] Create `config/dependencies.ts`
- [ ] Define `MECHANIC_DEPENDENCIES` constant
- [ ] Implement `resolveDependencies()` function
- [ ] Implement `getDefaultConfig()` helper
- [ ] Add unit tests for dependency resolution

### Task 5: Create presets
- [ ] Create `config/presets/mvp.ts` with `MVP_PRESET`
- [ ] Create `config/presets/roguelike.ts` with `ROGUELIKE_PRESET`
- [ ] Create `config/presets/tactical.ts` with `TACTICAL_PRESET`
- [ ] Create `config/presets/index.ts` re-exports
- [ ] Add tests verifying preset structure

### Task 6: Implement config validator
- [ ] Create `config/validator.ts`
- [ ] Implement `validateMechanicsConfig()` function
- [ ] Validate config values are within bounds
- [ ] Validate dependency consistency
- [ ] Add unit tests for validation

---

## Phase 2: Tier 0-1 Mechanics (Tasks 7-14)

### Task 7: Implement Facing processor (Tier 0)
- [ ] Create `tier0/facing/facing.types.ts`
- [ ] Create `tier0/facing/facing.processor.ts`
- [ ] Implement `getFacing()`, `faceTarget()`, `getAttackArc()`
- [ ] Implement `apply()` for phase integration
- [ ] Create `tier0/facing/facing.spec.ts` with unit tests

### Task 8: Implement Resolve processor (Tier 1)
- [ ] Create `tier1/resolve/resolve.types.ts`
- [ ] Create `tier1/resolve/resolve.processor.ts`
- [ ] Implement `regenerate()`, `applyDamage()`, `checkState()`
- [ ] Implement faction-specific behavior (human retreat, undead crumble)
- [ ] Create `tier1/resolve/resolve.spec.ts` with unit tests

### Task 9: Implement Engagement processor (Tier 1)
- [ ] Create `tier1/engagement/engagement.types.ts`
- [ ] Create `tier1/engagement/engagement.processor.ts`
- [ ] Implement Zone of Control detection
- [ ] Implement Attack of Opportunity
- [ ] Implement archer penalty when engaged
- [ ] Create `tier1/engagement/engagement.spec.ts` with unit tests

### Task 10: Implement Flanking processor (Tier 1)
- [ ] Create `tier1/flanking/flanking.types.ts`
- [ ] Create `tier1/flanking/flanking.processor.ts`
- [ ] Implement `getDamageModifier()` for front/flank/rear
- [ ] Implement `getResolveDamage()` for flanking attacks
- [ ] Implement `disablesRiposte()` check
- [ ] Create `tier1/flanking/flanking.spec.ts` with unit tests

### Task 11: Tier 0-1 integration tests
- [ ] Create integration tests for facing + flanking
- [ ] Test resolve damage from flanking attacks
- [ ] Test engagement + archer penalty interaction
- [ ] Verify dependency auto-resolution works

### Task 12: Add BattleUnit extensions for Tier 0-1
- [ ] Extend `BattleUnit` type with `facing?: FacingDirection`
- [ ] Extend `BattleUnit` type with `resolve?: number`
- [ ] Extend `BattleUnit` type with `engaged?: boolean`
- [ ] Extend `BattleUnit` type with `faction?: string`
- [ ] Update type exports

### Task 13: Implement helper functions for Tier 0-1
- [ ] Create `updateUnit()` helper for immutable state updates
- [ ] Create `updateUnits()` helper for batch updates
- [ ] Create `findUnit()` helper
- [ ] Add unit tests for helpers

### Task 14: Document Tier 0-1 mechanics
- [ ] Add JSDoc to all Tier 0-1 processors
- [ ] Add inline comments explaining formulas
- [ ] Update README with Tier 0-1 usage examples

---

## Phase 3: Tier 2 Mechanics (Tasks 15-20)

### Task 15: Implement Riposte processor (Tier 2)
- [ ] Create `tier2/riposte/riposte.types.ts`
- [ ] Create `tier2/riposte/riposte.processor.ts`
- [ ] Implement `canRiposte()` with arc check
- [ ] Implement `getRiposteChance()` with Initiative formula
- [ ] Implement `executeRiposte()` counter-attack
- [ ] Implement charge tracking per round
- [ ] Create `tier2/riposte/riposte.spec.ts` with unit tests

### Task 16: Implement Intercept processor (Tier 2)
- [ ] Create `tier2/intercept/intercept.types.ts`
- [ ] Create `tier2/intercept/intercept.processor.ts`
- [ ] Implement Hard Intercept (spearmen stop cavalry)
- [ ] Implement Soft Intercept (infantry engages)
- [ ] Implement disengage cost calculation
- [ ] Create `tier2/intercept/intercept.spec.ts` with unit tests

### Task 17: Implement Aura processor (Tier 2)
- [ ] Create `tier2/aura/aura.types.ts`
- [ ] Create `tier2/aura/aura.processor.ts`
- [ ] Implement Static aura (always active)
- [ ] Implement Pulse aura (per turn effect)
- [ ] Implement aura range calculation
- [ ] Create `tier2/aura/aura.spec.ts` with unit tests

### Task 18: Add BattleUnit extensions for Tier 2
- [ ] Extend `BattleUnit` type with `riposteCharges?: number`
- [ ] Extend `BattleUnit` type with `tags?: string[]`
- [ ] Extend `BattleUnit` type with `auras?: Aura[]`
- [ ] Update type exports

### Task 19: Tier 2 integration tests
- [ ] Test riposte disabled by flanking
- [ ] Test intercept + engagement interaction
- [ ] Test aura stacking rules
- [ ] Test Initiative-based riposte chance

### Task 20: Document Tier 2 mechanics
- [ ] Add JSDoc to all Tier 2 processors
- [ ] Add inline comments for riposte formula
- [ ] Update README with Tier 2 usage examples

---

## Phase 4: Tier 3 Mechanics (Tasks 21-30)

### Task 21: Implement Charge processor (Tier 3)
- [ ] Create `tier3/charge/charge.types.ts`
- [ ] Create `tier3/charge/charge.processor.ts`
- [ ] Implement `calculateMomentum()` based on distance
- [ ] Implement `applyChargeBonus()` damage modifier
- [ ] Implement Spear Wall counter check
- [ ] Implement shock resolve damage
- [ ] Create `tier3/charge/charge.spec.ts` with unit tests

### Task 22: Implement Overwatch processor (Tier 3)
- [ ] Create `tier3/overwatch/overwatch.types.ts`
- [ ] Create `tier3/overwatch/overwatch.processor.ts`
- [ ] Implement Vigilance state toggle
- [ ] Implement overwatch trigger on enemy movement
- [ ] Implement ammo consumption for overwatch
- [ ] Implement overwatch reset at turn end
- [ ] Create `tier3/overwatch/overwatch.spec.ts` with unit tests

### Task 23: Implement Phalanx processor (Tier 3)
- [ ] Create `tier3/phalanx/phalanx.types.ts`
- [ ] Create `tier3/phalanx/phalanx.processor.ts`
- [ ] Implement formation detection (adjacent allies)
- [ ] Implement armor bonus calculation
- [ ] Implement resolve bonus calculation
- [ ] Implement `recalculate()` after casualties
- [ ] Create `tier3/phalanx/phalanx.spec.ts` with unit tests

### Task 24: Implement Line of Sight processor (Tier 3)
- [ ] Create `tier3/los/los.types.ts`
- [ ] Create `tier3/los/los.processor.ts`
- [ ] Implement Direct Fire (blocked by units)
- [ ] Implement Arc Fire (ignores obstacles)
- [ ] Implement arc fire accuracy penalty
- [ ] Implement LoS validation for ranged attacks
- [ ] Create `tier3/los/los.spec.ts` with unit tests

### Task 25: Implement Ammunition processor (Tier 3)
- [ ] Create `tier3/ammunition/ammunition.types.ts`
- [ ] Create `tier3/ammunition/ammunition.processor.ts`
- [ ] Implement ammo tracking for ranged units
- [ ] Implement cooldown tracking for mages
- [ ] Implement `consume()` on attack
- [ ] Implement `reload()` at turn start (if applicable)
- [ ] Create `tier3/ammunition/ammunition.spec.ts` with unit tests

### Task 26: Add BattleUnit extensions for Tier 3
- [ ] Extend `BattleUnit` type with `momentum?: number`
- [ ] Extend `BattleUnit` type with `vigilance?: boolean`
- [ ] Extend `BattleUnit` type with `inPhalanx?: boolean`
- [ ] Extend `BattleUnit` type with `ammo?: number`
- [ ] Extend `BattleUnit` type with `cooldowns?: Record<string, number>`
- [ ] Update type exports

### Task 27: Implement Bresenham line algorithm for LoS
- [ ] Create `tier3/los/bresenham.ts`
- [ ] Implement `getLineOfSight()` function
- [ ] Implement `isBlocked()` check
- [ ] Add unit tests for edge cases

### Task 28: Tier 3 integration tests
- [ ] Test charge + intercept interaction
- [ ] Test overwatch + ammunition consumption
- [ ] Test phalanx bonus calculation
- [ ] Test LoS blocking by units

### Task 29: Test charge countered by Spear Wall
- [ ] Create test scenario with cavalry vs spearmen
- [ ] Verify charge is stopped
- [ ] Verify counter damage applied
- [ ] Verify momentum reset

### Task 30: Document Tier 3 mechanics
- [ ] Add JSDoc to all Tier 3 processors
- [ ] Add inline comments for momentum formula
- [ ] Update README with Tier 3 usage examples

---

## Phase 5: Tier 4 Mechanics (Tasks 31-36)

### Task 31: Implement Contagion processor (Tier 4)
- [ ] Create `tier4/contagion/contagion.types.ts`
- [ ] Create `tier4/contagion/contagion.processor.ts`
- [ ] Implement `getSpreadChance()` per effect type
- [ ] Implement `findSpreadTargets()` (adjacent units)
- [ ] Implement `spreadEffects()` at turn end
- [ ] Implement phalanx spread bonus
- [ ] Create `tier4/contagion/contagion.spec.ts` with unit tests

### Task 32: Implement Armor Shred processor (Tier 4)
- [ ] Create `tier4/armor-shred/armor-shred.types.ts`
- [ ] Create `tier4/armor-shred/armor-shred.processor.ts`
- [ ] Implement `applyShred()` on physical attack
- [ ] Implement `getEffectiveArmor()` calculation
- [ ] Implement `decayShred()` at turn end (if configured)
- [ ] Implement max shred cap
- [ ] Create `tier4/armor-shred/armor-shred.spec.ts` with unit tests

### Task 33: Add BattleUnit extensions for Tier 4
- [ ] Extend `BattleUnit` type with `armorShred?: number`
- [ ] Extend `BattleUnit` type with `statusEffects?: StatusEffect[]`
- [ ] Update type exports

### Task 34: Test contagion vs phalanx interaction
- [ ] Create test scenario with phalanx formation
- [ ] Apply fire effect to one unit
- [ ] Verify increased spread chance in phalanx
- [ ] Verify spread to adjacent units

### Task 35: Tier 4 integration tests
- [ ] Test contagion spread mechanics
- [ ] Test armor shred accumulation
- [ ] Test armor shred cap enforcement
- [ ] Test contagion + phalanx counter-synergy

### Task 36: Document Tier 4 mechanics
- [ ] Add JSDoc to all Tier 4 processors



- [ ] Add inline comments for spread formulas
- [ ] Update README with Tier 4 usage examples

---

## Phase 6: Integration (Tasks 37-42)

### Task 37: Implement MechanicsProcessor
- [x] Create `processor.ts`
- [x] Implement `createMechanicsProcessor()` factory
- [x] Implement `buildProcessors()` helper
- [x] Implement `applyMechanics()` phase dispatcher
- [x] Define `PHASE_MECHANICS` mapping

### Task 38: Integrate with battle simulator
- [x] Modify `simulateBattle()` to accept optional processor
- [x] Add phase hooks for mechanics
- [x] Ensure backward compatibility (no processor = MVP behavior)
- [x] Add integration tests

### Task 39: Update damage calculation
- [ ] Modify `calculatePhysicalDamage()` to use effective armor
- [ ] Add flanking damage modifier support
- [ ] Add charge momentum bonus support
- [ ] Maintain backward compatibility

### Task 40: Update turn order
- [ ] Ensure turn order respects resolve state (routing units skip)
- [ ] Add vigilance state consideration
- [ ] Maintain backward compatibility

### Task 41: Create public API exports
- [ ] Create `mechanics/index.ts` with all exports
- [ ] Update `core/index.ts` to include mechanics
- [ ] Verify all types are exported
- [ ] Verify all processors are exported

### Task 42: Integration test suite
- [ ] Test full battle with MVP preset (identical to core 1.0)
- [ ] Test full battle with ROGUELIKE preset
- [ ] Test full battle with TACTICAL preset
- [ ] Test custom config with partial mechanics

---

## Phase 7: Testing & Documentation (Tasks 43-48)

### Task 43: Backward compatibility tests
- [ ] Create snapshot tests for MVP preset
- [ ] Compare results with core 1.0 simulator
- [ ] Verify event sequence is identical
- [ ] Verify final state is identical

### Task 44: Regression test suite
- [ ] Create test fixtures for common battle scenarios
- [ ] Add snapshot tests for deterministic battles
- [ ] Test with multiple seeds
- [ ] Test edge cases (empty teams, single unit, etc.)

### Task 45: Performance benchmarks
- [ ] Benchmark MVP preset vs core 1.0
- [ ] Benchmark ROGUELIKE preset (all mechanics)
- [ ] Identify performance bottlenecks
- [ ] Optimize if needed (target: <10% overhead)

### Task 46: Create README documentation
- [ ] Create `backend/src/core/mechanics/README.md`
- [ ] Document all mechanics with examples
- [ ] Document presets and when to use them
- [ ] Document migration from core 1.0

### Task 47: Update project documentation
- [ ] Update `docs/CORE_LIBRARY.md` with mechanics section
- [ ] Update `docs/ARCHITECTURE.md` with mechanics layer
- [ ] Update `.kiro/steering/project-context.md`
- [ ] Update `CHANGELOG.md`

### Task 48: Final verification
- [ ] Run full test suite (`npm test`)
- [ ] Verify no circular dependencies
- [ ] Verify all exports work
- [ ] Verify TypeScript compilation
- [ ] Create PR for review

---

## Dependencies

```
Phase 1 (Foundation)
    │
    ▼
Phase 2 (Tier 0-1) ──────────────────┐
    │                                │
    ▼                                │
Phase 3 (Tier 2) ────────────────────┤
    │                                │
    ▼                                │
Phase 4 (Tier 3) ────────────────────┤
    │                                │
    ▼                                │
Phase 5 (Tier 4) ────────────────────┤
    │                                │
    ▼                                ▼
Phase 6 (Integration) ◄──────────────┘
    │
    ▼
Phase 7 (Testing & Docs)
```

---

## Prerequisites

- [ ] `core-extraction` spec completed (PR 5 merged)
- [ ] All 650+ existing tests passing
- [ ] Feature branch `feature/core-mechanics-2.0` created

---

## Success Criteria

- [ ] All 48 tasks completed
- [ ] All tests passing (existing + new)
- [ ] MVP preset produces identical results to core 1.0
- [ ] ROGUELIKE preset enables all 14 mechanics
- [ ] No circular dependencies
- [ ] <10% performance overhead vs core 1.0
- [ ] Full JSDoc documentation
- [ ] README with usage examples
