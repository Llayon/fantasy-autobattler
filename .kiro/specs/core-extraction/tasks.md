# Tasks: Core Library Extraction

## Task 1: Create Core Folder Structure
**Estimate**: 15 min | **Requirement**: REQ-1

- [ ] Create `backend/src/core/` directory
- [ ] Create subdirectories: `grid/`, `battle/`, `abilities/`, `types/`
- [ ] Create empty `index.ts` barrel files in each

## Task 2: Extract Grid Module
**Estimate**: 30 min | **Requirement**: REQ-1.1

- [ ] Copy `battle/grid.ts` → `core/grid/grid.ts`
- [ ] Copy `battle/pathfinding.ts` → `core/grid/pathfinding.ts`
- [ ] Remove hardcoded GRID_SIZE, accept as parameter
- [ ] Create `core/grid/index.ts` with exports
- [ ] Update original files to re-export from core

## Task 3: Extract Battle Module
**Estimate**: 45 min | **Requirement**: REQ-1.2

- [ ] Copy `battle/damage.ts` → `core/battle/damage.ts`
- [ ] Copy `battle/turn-order.ts` → `core/battle/turn-order.ts`
- [ ] Copy `battle/targeting.ts` → `core/battle/targeting.ts`
- [ ] Copy `battle/actions.ts` → `core/battle/actions.ts`
- [ ] Create `core/battle/index.ts` with exports
- [ ] Update original files to re-export from core

## Task 4: Extract Ability Module
**Estimate**: 30 min | **Requirement**: REQ-1.3

- [ ] Copy `battle/ability.executor.ts` → `core/abilities/executor.ts`
- [ ] Copy `battle/status-effects.ts` → `core/abilities/effects.ts`
- [ ] Create `core/abilities/index.ts` with exports
- [ ] Update original files to re-export from core

## Task 5: Extract Core Types
**Estimate**: 30 min | **Requirement**: REQ-1.4

- [ ] Create `core/types/grid.types.ts` (Position, GridConfig)
- [ ] Create `core/types/battle.types.ts` (BattleUnit, BattleEvent, BattleResult)
- [ ] Create `core/types/ability.types.ts` (Ability, StatusEffect)
- [ ] Create `core/types/index.ts` with exports
- [ ] Update `types/game.types.ts` to import from core

## Task 6: Create Game Module Structure
**Estimate**: 20 min | **Requirement**: REQ-2

- [ ] Create `backend/src/game/` directory
- [ ] Move `unit/unit.data.ts` → `game/units/unit.data.ts`
- [ ] Move `abilities/ability.data.ts` → `game/abilities/ability.data.ts`
- [ ] Keep re-exports in original locations

## Task 7: Verify Backend Build & Tests
**Estimate**: 15 min | **Requirement**: REQ-4

- [ ] Run `npm run build` in backend
- [ ] Run `npm test` in backend
- [ ] Fix any import errors
- [ ] Verify all 650+ tests pass

## Task 8: Create Core Documentation
**Estimate**: 20 min | **Requirement**: REQ-5

- [ ] Create `backend/src/core/README.md`
- [ ] Document module structure
- [ ] Add usage examples
- [ ] Document extension points

## Task 9: Update Project Documentation
**Estimate**: 30 min | **Requirement**: REQ-5

- [ ] Update `docs/ARCHITECTURE.md` with new structure
- [ ] Update `.kiro/steering/project-context.md`
- [ ] Update `README.md` with core library info
- [ ] Create `docs/CORE_LIBRARY.md` detailed guide

---

## Summary
| Task | Time | Priority |
|------|------|----------|
| Task 1: Folder Structure | 15 min | High |
| Task 2: Grid Module | 30 min | High |
| Task 3: Battle Module | 45 min | High |
| Task 4: Ability Module | 30 min | High |
| Task 5: Core Types | 30 min | High |
| Task 6: Game Module | 20 min | Medium |
| Task 7: Verify Build | 15 min | Critical |
| Task 8: Core Docs | 20 min | Medium |
| Task 9: Project Docs | 30 min | Medium |
| **Total** | **~4 hours** | |

## Dependencies
- Task 5 (Types) should be done before Tasks 2-4
- Task 7 (Verify) after all code changes
- Tasks 8-9 (Docs) can be done in parallel
