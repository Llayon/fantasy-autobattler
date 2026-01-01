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
- [x] Create `backend/src/core/mechanics/` directory




- [x] Create subdirectories: `config/`, `tier0/`, `tier1/`, `tier2/`, `tier3/`, `tier4/`





- [x] Create `config/presets/` subdirectory
- [x] Create placeholder `index.ts` files

### Task 2: Define MechanicsConfig types
- [x] Create `config/mechanics.types.ts`
- [x] Define `MechanicsConfig` interface
- [x] Define all sub-config interfaces (ResolveConfig, RiposteConfig, etc.)
- [x] Add JSDoc documentation for all types

### Task 3: Implement default configurations
- [x] Create `config/defaults.ts`
- [x] Define `DEFAULT_RESOLVE_CONFIG`
- [x] Define `DEFAULT_ENGAGEMENT_CONFIG`
- [x] Define `DEFAULT_RIPOSTE_CONFIG`
- [x] Define `DEFAULT_INTERCEPT_CONFIG`
- [x] Define `DEFAULT_CHARGE_CONFIG`
- [x] Define `DEFAULT_PHALANX_CONFIG`
- [x] Define `DEFAULT_LOS_CONFIG`
- [x] Define `DEFAULT_AMMO_CONFIG`
- [x] Define `DEFAULT_CONTAGION_CONFIG`
- [x] Define `DEFAULT_SHRED_CONFIG`


### Task 4: Implement dependency resolution
- [x] Create `config/dependencies.ts`
- [x] Define `MECHANIC_DEPENDENCIES` constant
- [x] Implement `resolveDependencies()` function
- [x] Implement `getDefaultConfig()` helper
- [x] Add unit tests for dependency resolution






### Task 5: Create presets
- [x] Create `config/presets/mvp.ts` with `MVP_PRESET`
- [x] Create `config/presets/roguelike.ts` with `ROGUELIKE_PRESET`
- [x] Create `config/presets/tactical.ts` with `TACTICAL_PRESET`
- [x] Create `config/presets/index.ts` re-exports
- [x] Add tests verifying preset structure






### Task 6: Implement config validator
- [x] Create `config/validator.ts`
- [x] Implement `validateMechanicsConfig()` function
- [x] Validate config values are within bounds
- [x] Validate dependency consistency
- [x] Add unit tests for validation





---

## Phase 2: Tier 0-1 Mechanics (Tasks 7-14)

### Task 7: Implement Facing processor (Tier 0)
- [x] Create `tier0/facing/facing.types.ts`





- [x] Create `tier0/facing/facing.processor.ts`





- [x] Implement `getFacing()`, `faceTarget()`, `getAttackArc()`





- [x] Implement `apply()` for phase integration





- [x] Create `tier0/facing/facing.spec.ts` with unit tests






### Task 8: Implement Resolve processor (Tier 1)
- [x] Create `tier1/resolve/resolve.types.ts`
- [x] Create `tier1/resolve/resolve.processor.ts`
- [x] Implement `regenerate()`, `applyDamage()`, `checkState()`
- [x] Implement faction-specific behavior (human retreat, undead crumble)
- [x] Create `tier1/resolve/resolve.processor.spec.ts` with unit tests (20 tests)

### Task 9: Implement Engagement processor (Tier 1)
- [x] Create `tier1/engagement/engagement.types.ts`





- [x] Create `tier1/engagement/engagement.processor.ts`





- [x] Implement Zone of Control detection





- [x] Implement Attack of Opportunity







- [x] Implement archer penalty when engaged



- [x] Create `tier1/engagement/engagement.spec.ts` with unit tests






### Task 10: Implement Flanking processor (Tier 1)
- [x] Create `tier1/flanking/flanking.types.ts`





- [x] Create `tier1/flanking/flanking.processor.ts`









- [x] Implement `getDamageModifier()` for front/flank/rear






- [x] Implement `getResolveDamage()` for flanking attacks





- [x] Implement `disablesRiposte()` check





- [x] Create `tier1/flanking/flanking.spec.ts` with unit tests





### Task 11: Tier 0-1 integration tests
- [x] Create integration tests for facing + flanking
- [x] Test resolve damage from flanking attacks
- [x] Test engagement + archer penalty interaction
- [x] Verify dependency auto-resolution works

### Task 12: Add BattleUnit extensions for Tier 0-1
- [x] Extend `BattleUnit` type with `facing?: FacingDirection`



- [x] Extend `BattleUnit` type with  resolve?: number`







- [x] Extend `BattleUnit` type with `engaged?: boolean`



- [x] Extend `BattleUnit` type with `faction?: string`







- [x] Update type exports









### Task 13: Implement helper functions for Tier 0-1
- [x] Create `updateUnit()` helper for immutable state updates





- [x] Create `updateUnits()` helper for batch updates





- [x] Create `findUnit()` helper




- [x] Add unit tests for helpers






### Task 14: Document Tier 0-1 mechanics
- [x] Add JSDoc to all Tier 0-1 processors












- [x] Add inline comments explaining formulas





- [x] Update README with Tier 0-1 usage examples






---

## Phase 3: Tier 2 Mechanics (Tasks 15-20)

### Task 15: Implement Riposte processor (Tier 2)
- [x] Create `tier2/riposte/riposte.types.ts`





- [x] Create `tier2/riposte/riposte.processor.ts`





- [x] Implement `canRiposte()` with arc check






- [x] Implement `getRiposteChance()` with Initiative formula





- [x] Implement `executeRiposte()` counter-attack





- [x] Implement charge tracking per round





- [x] Create `tier2/riposte/riposte.spec.ts` with unit tests






### Task 16: Implement Intercept processor (Tier 2)
- [x] Create `tier2/intercept/intercept.types.ts`





- [x] Create `tier2/intercept/intercept.processor.ts`





- [x] Implement Hard Intercept (spearmen stop cavalry)






- [x] Implement Soft Intercept (infantry engages)





- [x] Implement disengage cost calculation







- [x] Create `tier2/intercept/intercept.spec.ts` with unit tests

### Task 17: Implement Aura processor (Tier 2)
- [x] Create `tier2/aura/aura.types.ts`





- [x] Create `tier2/aura/aura.processor.ts`





- [x] Implement Static aura (always active)





- [x] Implement Pulse aura (per turn effect)
- [x] Implement aura range calculation
- [x] Create `tier2/aura/aura.spec.ts` with unit tests

### Task 18: Add BattleUnit extensions for Tier 2
- [x] Extend `BattleUnit` type with `riposteCharges?: number`





- [x] Extend `BattleUnit` type with `tags?: string[]`





- [x] Extend `BattleUnit` type with `auras?: Aura[]`





- [x] Update type exports

### Task 19: Tier 2 integration tests
- [x] Test riposte disabled by flanking





- [x] Test intercept + engagement interaction






- [x] Test aura stacking rules





- [x] Test Initiative-based riposte chance





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
- [ ] Create `processor.ts`
- [ ] Implement `createMechanicsProcessor()` factory
- [ ] Implement `buildProcessors()` helper
- [ ] Implement `applyMechanics()` phase dispatcher
- [ ] Define `PHASE_MECHANICS` mapping

### Task 38: Integrate with battle simulator
- [ ] Modify `simulateBattle()` to accept optional processor
- [ ] Add phase hooks for mechanics
- [ ] Ensure backward compatibility (no processor = MVP behavior)
- [ ] Add integration tests

### Task 39: Update damage calculation
- [x] Modify `calculatePhysicalDamage()` to use effective armor





- [x] Add flanking damage modifier support





- [x] Add charge momentum bonus support





- [x] Maintain backward compatibility











### Task 40: Update turn order
- [x] Ensure turn order respects resolve state (routing units skip)





- [x] Add vigilance state consideration





- [ ] Maintain backward compatibility

### Task 41: Create public API exports
- [x] Create `mechanics/index.ts` with all exports



- [x] Update `core/index.ts` to include mechanics







- [x] Verify all types are exported













- [x] Verify all processors are exported






### Task 42: Integration test suite
- [x] Test full battle with MVP preset (identical to core 1.0)






- [x] Test full battle with ROGUELIKE preset




- [x] Test full battle with TACTICAL preset








- [x] Test custom config with partial mechanics













---

## Phase 7: Testing & Documentation (Tasks 43-48)

### Task 43: Backward compatibility tests
- [x] Create snapshot tests for MVP preset





- [x] Compare results with core 1.0 simulator





- [x] Verify event sequence is identical





- [x] Verify final state is identical






### Task 44: Regression test suite
- [x] Create test fixtures for common battle scenarios
- [x] Add snapshot tests for deterministic battles
- [x] Test with multiple seeds
- [x] Test edge cases (empty teams, single unit, etc.)

### Task 45: Performance benchmarks
- [x] Benchmark MVP preset vs core 1.0
- [x] Benchmark ROGUELIKE preset (all mechanics)
- [x] Identify performance bottlenecks
- [x] Optimize if needed (target: <10% overhead)

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

- [x] `core-extraction` spec completed (PR 5 merged)




- [ ] All 650+ existing tests passing
- [x] Feature branch `feature/core-mechanics-2.0` created





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
