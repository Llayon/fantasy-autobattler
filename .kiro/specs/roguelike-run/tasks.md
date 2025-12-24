# Tasks: Roguelike Run Mode

## Prerequisites

- [ ] Core extraction spec must be completed first
- [ ] Grid system must support configurable dimensions
- [ ] Battle simulator must be parameterized

---

## Phase 1: Database & Entities

### Task 1: Create Faction Entities
**Estimate**: 30 min | **Requirement**: REQ-1

- [ ] 1.1 Create `backend/src/faction/faction.entity.ts`
- [ ] 1.2 Create `backend/src/faction/faction.module.ts`
- [ ] 1.3 Create `backend/src/faction/faction.service.ts`
- [ ] 1.4 Create `backend/src/faction/faction.data.ts` with 6 factions
- [ ] 1.5 **VERIFY**: Run `npm test`

### Task 2: Create Leader Entities
**Estimate**: 45 min | **Requirement**: REQ-2

- [ ] 2.1 Create `backend/src/leader/leader.entity.ts`
- [ ] 2.2 Create `backend/src/leader/leader.module.ts`
- [ ] 2.3 Create `backend/src/leader/leader.service.ts`
- [ ] 2.4 Create `backend/src/leader/leader.data.ts` with 18 leaders (3 per faction)
- [ ] 2.5 Define passive abilities for each leader
- [ ] 2.6 **VERIFY**: Run `npm test`

### Task 3: Create Spell System
**Estimate**: 60 min | **Requirement**: REQ-3

- [ ] 3.1 Create `backend/src/spell/spell.types.ts`
- [ ] 3.2 Create `backend/src/spell/spell.entity.ts`
- [ ] 3.3 Create `backend/src/spell/spell.service.ts`
- [ ] 3.4 Create `backend/src/spell/spell.executor.ts`
- [ ] 3.5 Create `backend/src/spell/spell.data.ts` with spell definitions
- [ ] 3.6 Add spell tests
- [ ] 3.7 **VERIFY**: Run `npm test`

### Task 4: Create Run Entity
**Estimate**: 45 min | **Requirement**: REQ-4

- [ ] 4.1 Create `backend/src/run/run.entity.ts`
- [ ] 4.2 Create `backend/src/run/run.module.ts`
- [ ] 4.3 Create `backend/src/run/run.service.ts`
- [ ] 4.4 Create `backend/src/run/run.controller.ts`
- [ ] 4.5 Create DTOs for run operations
- [ ] 4.6 Add run tests
- [ ] 4.7 **VERIFY**: Run `npm test`

### Task 5: Create Snapshot Entity
**Estimate**: 30 min | **Requirement**: REQ-10

- [ ] 5.1 Create `backend/src/snapshot/snapshot.entity.ts`
- [ ] 5.2 Create `backend/src/snapshot/snapshot.service.ts`
- [ ] 5.3 Create `backend/src/snapshot/snapshot.module.ts`
- [ ] 5.4 **VERIFY**: Run `npm test`

---

## Phase 2: Backend Logic

### Task 6: Implement Draft System
**Estimate**: 60 min | **Requirement**: REQ-5

- [ ] 6.1 Create `backend/src/draft/draft.service.ts`
- [ ] 6.2 Implement initial draft (5 cards, pick 3)
- [ ] 6.3 Implement post-battle draft (3 cards, pick 1)
- [ ] 6.4 Create `backend/src/draft/draft.controller.ts`
- [ ] 6.5 Add draft tests
- [ ] 6.6 **VERIFY**: Run `npm test`

### Task 7: Implement Upgrade System
**Estimate**: 45 min | **Requirement**: REQ-6

- [ ] 7.1 Create `backend/src/upgrade/upgrade.service.ts`
- [ ] 7.2 Implement tier upgrade logic (T1→T2→T3)
- [ ] 7.3 Implement gold cost calculation
- [ ] 7.4 Create `backend/src/upgrade/upgrade.controller.ts`
- [ ] 7.5 Add upgrade tests
- [ ] 7.6 **VERIFY**: Run `npm test`

### Task 8: Implement Budget Progression
**Estimate**: 20 min | **Requirement**: REQ-7

- [ ] 8.1 Create `backend/src/run/budget.utils.ts`
- [ ] 8.2 Implement getBudget(battleNumber) function
- [ ] 8.3 Add budget tests
- [ ] 8.4 **VERIFY**: Run `npm test`

### Task 9: Implement Gold Economy
**Estimate**: 30 min | **Requirement**: REQ-8

- [ ] 9.1 Create `backend/src/run/gold.utils.ts`
- [ ] 9.2 Implement getGoldReward(won, streak) function
- [ ] 9.3 Implement getUpgradeCost(tier) function
- [ ] 9.4 Add gold tests
- [ ] 9.5 **VERIFY**: Run `npm test`

### Task 10: Implement Async Matchmaking
**Estimate**: 60 min | **Requirement**: REQ-10

- [ ] 10.1 Create `backend/src/run/matchmaking.service.ts`
- [ ] 10.2 Implement findOpponent(run) with snapshot matching
- [ ] 10.3 Implement bot fallback generation
- [ ] 10.4 Add matchmaking tests
- [ ] 10.5 **VERIFY**: Run `npm test`

### Task 11: Implement Rating System
**Estimate**: 30 min | **Requirement**: REQ-11

- [ ] 11.1 Create `backend/src/run/rating.utils.ts`
- [ ] 11.2 Implement ELO calculation
- [ ] 11.3 Implement league determination
- [ ] 11.4 Add rating tests
- [ ] 11.5 **VERIFY**: Run `npm test`

### Task 12: Integrate Spells with Battle Simulator
**Estimate**: 60 min | **Requirement**: REQ-3

- [ ] 12.1 Update battle simulator to accept spell timings
- [ ] 12.2 Implement spell trigger logic (early/mid/late)
- [ ] 12.3 Add spell execution to battle events
- [ ] 12.4 Add integration tests
- [ ] 12.5 **VERIFY**: Run `npm test`

### Task 13: Integrate Leader Passives
**Estimate**: 45 min | **Requirement**: REQ-2

- [ ] 13.1 Update battle simulator to apply leader passive
- [ ] 13.2 Implement passive bonus application
- [ ] 13.3 Add leader passive tests
- [ ] 13.4 **VERIFY**: Run `npm test`

---

## Phase 3: Frontend - Core Components

### Task 14: Create Run Store
**Estimate**: 45 min | **Requirement**: REQ-4

- [ ] 14.1 Create `frontend/src/store/runStore.ts`
- [ ] 14.2 Implement createRun, loadRun, loadActiveRun actions
- [ ] 14.3 Add run state management
- [ ] 14.4 **VERIFY**: Run `npm run build`

### Task 15: Create Draft Store
**Estimate**: 30 min | **Requirement**: REQ-5

- [ ] 15.1 Create `frontend/src/store/draftStore.ts`
- [ ] 15.2 Implement loadDraft, selectCard, submitDraft actions
- [ ] 15.3 **VERIFY**: Run `npm run build`

### Task 16: Create Faction Select Components
**Estimate**: 60 min | **Requirement**: REQ-13.2

- [ ] 16.1 Create `frontend/src/components/roguelike/FactionSelect.tsx`
- [ ] 16.2 Create `frontend/src/components/roguelike/FactionCard.tsx`
- [ ] 16.3 Add faction icons and descriptions
- [ ] 16.4 **VERIFY**: Run `npm run build`

### Task 17: Create Leader Select Components
**Estimate**: 45 min | **Requirement**: REQ-13.2

- [ ] 17.1 Create `frontend/src/components/roguelike/LeaderSelect.tsx`
- [ ] 17.2 Create `frontend/src/components/roguelike/LeaderCard.tsx`
- [ ] 17.3 Create `frontend/src/components/roguelike/LeaderPortrait.tsx`
- [ ] 17.4 **VERIFY**: Run `npm run build`

### Task 18: Create Draft Screen Components
**Estimate**: 60 min | **Requirement**: REQ-13.3

- [ ] 18.1 Create `frontend/src/components/roguelike/DraftScreen.tsx`
- [ ] 18.2 Create `frontend/src/components/roguelike/DraftCard.tsx`
- [ ] 18.3 Add pick animation
- [ ] 18.4 **VERIFY**: Run `npm run build`

### Task 19: Create Run Status Bar
**Estimate**: 30 min | **Requirement**: REQ-13.1

- [ ] 19.1 Create `frontend/src/components/roguelike/RunStatusBar.tsx`
- [ ] 19.2 Display wins/losses (9 slots)
- [ ] 19.3 Display gold and budget
- [ ] 19.4 Display leader portrait
- [ ] 19.5 **VERIFY**: Run `npm run build`

### Task 20: Create Upgrade Shop Components
**Estimate**: 60 min | **Requirement**: REQ-13.4

- [ ] 20.1 Create `frontend/src/components/roguelike/UpgradeShop.tsx`
- [ ] 20.2 Create `frontend/src/components/roguelike/UpgradeCard.tsx`
- [ ] 20.3 Add tier indicators (T1/T2/T3)
- [ ] 20.4 Add upgrade button with cost
- [ ] 20.5 **VERIFY**: Run `npm run build`

### Task 21: Create Spell Timing Selector
**Estimate**: 30 min | **Requirement**: REQ-3.2

- [ ] 21.1 Create `frontend/src/components/roguelike/SpellTimingSelect.tsx`
- [ ] 21.2 Add Early/Mid/Late options
- [ ] 21.3 **VERIFY**: Run `npm run build`

### Task 22: Create Run End Screen
**Estimate**: 45 min | **Requirement**: REQ-12

- [ ] 22.1 Create `frontend/src/components/roguelike/RunEndScreen.tsx`
- [ ] 22.2 Create victory variant
- [ ] 22.3 Create defeat variant
- [ ] 22.4 Show run statistics
- [ ] 22.5 **VERIFY**: Run `npm run build`

---

## Phase 4: Frontend - Pages

### Task 23: Create Run Start Page
**Estimate**: 45 min | **Requirement**: REQ-13.2

- [ ] 23.1 Create `frontend/src/app/run/new/page.tsx`
- [ ] 23.2 Integrate FactionSelect and LeaderSelect
- [ ] 23.3 Add navigation to draft
- [ ] 23.4 **VERIFY**: Run `npm run build`

### Task 24: Create Draft Page
**Estimate**: 30 min | **Requirement**: REQ-13.3

- [ ] 24.1 Create `frontend/src/app/run/[id]/draft/page.tsx`
- [ ] 24.2 Integrate DraftScreen component
- [ ] 24.3 Handle initial vs post-battle draft
- [ ] 24.4 **VERIFY**: Run `npm run build`

### Task 25: Create Battle Prep Page
**Estimate**: 45 min | **Requirement**: REQ-13.5

- [ ] 25.1 Create `frontend/src/app/run/[id]/battle/page.tsx`
- [ ] 25.2 Integrate 8×2 grid for placement
- [ ] 25.3 Integrate SpellTimingSelect
- [ ] 25.4 Add RunStatusBar
- [ ] 25.5 **VERIFY**: Run `npm run build`

### Task 26: Create Shop Page
**Estimate**: 30 min | **Requirement**: REQ-13.4

- [ ] 26.1 Create `frontend/src/app/run/[id]/shop/page.tsx`
- [ ] 26.2 Integrate UpgradeShop component
- [ ] 26.3 Add navigation to battle
- [ ] 26.4 **VERIFY**: Run `npm run build`

### Task 27: Create Run Result Page
**Estimate**: 30 min | **Requirement**: REQ-12

- [ ] 27.1 Create `frontend/src/app/run/[id]/result/page.tsx`
- [ ] 27.2 Integrate RunEndScreen component
- [ ] 27.3 Add "New Run" and "Main Menu" buttons
- [ ] 27.4 **VERIFY**: Run `npm run build`

---

## Phase 5: Integration & Polish

### Task 28: Update BattleGrid for 8×2
**Estimate**: 30 min | **Requirement**: REQ-9

- [ ] 28.1 Add GridConfig prop to BattleGrid
- [ ] 28.2 Support 8×2 landing zone mode
- [ ] 28.3 **VERIFY**: Run `npm run build`

### Task 29: Update UnitCard for Tiers
**Estimate**: 20 min | **Requirement**: REQ-6

- [ ] 29.1 Add tier prop to UnitCard
- [ ] 29.2 Add tier indicator (border color or badge)
- [ ] 29.3 **VERIFY**: Run `npm run build`

### Task 30: Add Spell Animations
**Estimate**: 45 min | **Requirement**: REQ-3

- [ ] 30.1 Create spell animation components
- [ ] 30.2 Integrate with BattleReplay
- [ ] 30.3 **VERIFY**: Run `npm run build`

### Task 31: Add Navigation Integration
**Estimate**: 20 min | **Requirement**: REQ-13

- [ ] 31.1 Add "Roguelike Run" button to main menu
- [ ] 31.2 Add run status to Navigation component
- [ ] 31.3 **VERIFY**: Run `npm run build`

### Task 32: Add i18n Translations
**Estimate**: 45 min | **Requirement**: REQ-13

- [ ] 32.1 Add Russian translations for roguelike UI
- [ ] 32.2 Add English translations for roguelike UI
- [ ] 32.3 **VERIFY**: Run `npm run build`

---

## Phase 6: Testing & Verification

### Task 33: Backend Integration Tests
**Estimate**: 60 min | **Requirement**: All

- [ ] 33.1 Create run flow integration test
- [ ] 33.2 Test draft → battle → upgrade cycle
- [ ] 33.3 Test run end conditions (9 wins, 4 losses)
- [ ] 33.4 **VERIFY**: Run `npm test`

### Task 34: Frontend Component Tests
**Estimate**: 45 min | **Requirement**: All

- [ ] 34.1 Add tests for FactionSelect
- [ ] 34.2 Add tests for DraftScreen
- [ ] 34.3 Add tests for UpgradeShop
- [ ] 34.4 **VERIFY**: Run `npm test`

### Task 35: E2E Testing
**Estimate**: 60 min | **Requirement**: All

- [ ] 35.1 Create E2E test for complete run flow
- [ ] 35.2 Test faction selection → draft → battle → result
- [ ] 35.3 **VERIFY**: Run E2E tests

### Task 36: Final Verification
**Estimate**: 30 min | **Requirement**: All

- [ ] 36.1 Run full test suite
- [ ] 36.2 Verify MVP mode still works
- [ ] 36.3 Manual testing of complete run flow
- [ ] 36.4 Performance check

---

## Summary

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1: Database & Entities | 1-5 | 3.5 hours |
| Phase 2: Backend Logic | 6-13 | 6 hours |
| Phase 3: Frontend Components | 14-22 | 7 hours |
| Phase 4: Frontend Pages | 23-27 | 3 hours |
| Phase 5: Integration & Polish | 28-32 | 2.5 hours |
| Phase 6: Testing | 33-36 | 3.5 hours |
| **Total** | **36 tasks** | **~25.5 hours** |

---

## Checkpoints

| Checkpoint | After Task | Verification |
|------------|------------|--------------|
| Entities complete | 5 | All entities created, migrations run |
| Backend logic complete | 13 | All services work, tests pass |
| Core components complete | 22 | Components render correctly |
| Pages complete | 27 | Navigation works |
| Integration complete | 32 | Full flow works |
| Final | 36 | All tests pass, MVP works |

---

## Dependencies

```
Prerequisites → All tasks
Task 1 (Factions) → Task 2 (Leaders)
Task 2 (Leaders) → Task 3 (Spells)
Task 4 (Run) → Tasks 6-11 (Logic)
Task 5 (Snapshots) → Task 10 (Matchmaking)
Tasks 1-5 → Tasks 6-13 (Backend logic needs entities)
Tasks 6-13 → Tasks 14-15 (Stores need API)
Tasks 14-15 → Tasks 16-22 (Components need stores)
Tasks 16-22 → Tasks 23-27 (Pages need components)
Tasks 23-27 → Tasks 28-32 (Integration after pages)
Tasks 28-32 → Tasks 33-36 (Testing after integration)
```

---

## Notes

- This spec assumes core-extraction is complete
- Unit data for 150 units (25 per faction) will be created separately
- Leader abilities and spells will be balanced iteratively
- MVP mode remains unchanged throughout implementation
