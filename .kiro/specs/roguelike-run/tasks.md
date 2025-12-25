# Tasks: Roguelike Run Mode

## Overview

Roguelike-run использует переиспользуемые системы из `core-progression` и опционально боевые механики из `core-mechanics-2.0`.

| Phase | Description | Tasks | Est. Hours |
|-------|-------------|-------|------------|
| 1 | Backend: Game Data | 1-4 | 4h |
| 2 | Backend: Game Services | 5-8 | 4h |
| 3 | Frontend: Components | 9-14 | 6h |
| 4 | Integration & Testing | 15-18 | 3h |
| **Total** | | **18 tasks** | **~17h** |

**Optional Phase 5**: После завершения `core-mechanics-2.0` — подключение боевых механик (~4h)

---

## Prerequisites

- [x] Core extraction spec completed (PR 5)
- [x] `core-progression` spec completed (deck, draft, economy, run, snapshot systems)
  - ✅ Deck System: createDeck, shuffleDeck, drawCards, addCard, removeCard
  - ✅ Hand System: createHand, addToHand, removeFromHand, isHandFull
  - ✅ Draft System: createDraft, pickCard, banCard, rerollOptions, skipDraft
  - ✅ Upgrade System: upgradeCard, getUpgradeCost, getStatMultiplier, getTierName
  - ✅ Economy System: createWallet, addCurrency, spendCurrency, getReward
  - ✅ Run System: createRun, recordWin, recordLoss, advancePhase, isRunComplete
  - ✅ Snapshot System: createSnapshot, findOpponent, generateBot
  - ✅ Presets: ROGUELIKE_RUN_CONFIG, ROGUELIKE_ECONOMY_CONFIG, INITIAL_DRAFT_CONFIG, etc.
- [x] Grid system supports configurable dimensions (8×10 battle grid, 8×2 deployment)

---

## Phase 1: Backend Game Data (Tasks 1-4)

### Task 1: Create Faction Data
**Estimate**: 30 min | **Requirement**: REQ-1

- [ ] 1.1 Create `backend/src/roguelike/types/faction.types.ts`
- [ ] 1.2 Create `backend/src/roguelike/data/factions.data.ts` (Humans, Undead)
- [ ] 1.3 Add faction bonus types (+10% HP, +15% ATK)
- [ ] 1.4 **VERIFY**: `npm test -- --testPathPattern=faction`

### Task 2: Create Leader Data
**Estimate**: 30 min | **Requirement**: REQ-2

- [ ] 2.1 Create `backend/src/roguelike/types/leader.types.ts`
- [ ] 2.2 Create `backend/src/roguelike/data/leaders.data.ts`
  - Commander Aldric (Humans): Formation passive, Holy Light + Rally spells
  - Lich King Malachar (Undead): Life Drain passive, Death Coil + Raise Dead spells
- [ ] 2.3 **VERIFY**: `npm test -- --testPathPattern=leader`

### Task 3: Create Unit Data
**Estimate**: 60 min | **Requirement**: REQ-1.2

- [ ] 3.1 Create `backend/src/roguelike/types/unit.types.ts` (extends BaseCard from core)
- [ ] 3.2 Create `backend/src/roguelike/data/humans.units.ts` (12 T1 + T2/T3 upgrades)
- [ ] 3.3 Create `backend/src/roguelike/data/undead.units.ts` (12 T1 + T2/T3 upgrades)
- [ ] 3.4 Add starter deck compositions
- [ ] 3.5 **VERIFY**: `npm test -- --testPathPattern=unit`

### Task 4: Create Spell Data
**Estimate**: 45 min | **Requirement**: REQ-3

- [ ] 4.1 Create `backend/src/roguelike/types/spell.types.ts`
- [ ] 4.2 Create `backend/src/roguelike/data/spells.data.ts`
  - Holy Light, Rally (Humans)
  - Death Coil, Raise Dead (Undead)
- [ ] 4.3 Add HP-based timing logic (early/mid/late)
- [ ] 4.4 **VERIFY**: `npm test -- --testPathPattern=spell`

**CHECKPOINT 1**: Game data complete. Run `npm test`.

---


## Phase 2: Backend Game Services (Tasks 5-8)

### Task 5: Create Run Entity & Service
**Estimate**: 60 min | **Requirement**: REQ-4

- [ ] 5.1 Create `backend/src/roguelike/entities/run.entity.ts`
- [ ] 5.2 Create `backend/src/roguelike/run/run.module.ts`
- [ ] 5.3 Create `backend/src/roguelike/run/run.service.ts`
  - Uses `createRun()`, `recordWin()`, `recordLoss()` from `@core/progression` ✅
  - Uses `ROGUELIKE_RUN_CONFIG` preset from `@core/progression` ✅
- [ ] 5.4 Create `backend/src/roguelike/run/run.controller.ts`
- [ ] 5.5 Create DTOs: CreateRunDto, RunResponseDto
- [ ] 5.6 **VERIFY**: `npm test -- --testPathPattern=run`

### Task 6: Create Draft & Upgrade Services
**Estimate**: 45 min | **Requirement**: REQ-5, REQ-6

- [ ] 6.1 Create `backend/src/roguelike/draft/draft.service.ts`
  - Uses `createDraft()`, `pickCard()` from `@core/progression` ✅
  - Uses `INITIAL_DRAFT_CONFIG`, `POST_BATTLE_DRAFT_CONFIG` presets ✅
- [ ] 6.2 Create `backend/src/roguelike/upgrade/upgrade.service.ts`
  - Uses `upgradeCard()`, `getUpgradeCost()` from `@core/progression` ✅
  - Uses `ROGUELIKE_TIERS` preset ✅
- [ ] 6.3 Create controllers for draft and upgrade
- [ ] 6.4 **VERIFY**: `npm test -- --testPathPattern=draft|upgrade`

### Task 7: Create Economy & Matchmaking Services
**Estimate**: 45 min | **Requirement**: REQ-7, REQ-9

- [ ] 7.1 Create `backend/src/roguelike/economy/economy.service.ts`
  - Uses `createWallet()`, `addCurrency()`, `spendCurrency()` from `@core/progression` ✅
  - Uses `ROGUELIKE_ECONOMY_CONFIG` preset ✅
- [ ] 7.2 Create `backend/src/roguelike/matchmaking/matchmaking.service.ts`
  - Uses `createSnapshot()`, `findOpponent()`, `generateBot()` from `@core/progression` ✅
  - Uses `ROGUELIKE_SNAPSHOT_CONFIG`, `ROGUELIKE_MATCHMAKING_CONFIG`, `ROGUELIKE_BOT_CONFIG` ✅
- [ ] 7.3 Create `backend/src/roguelike/entities/snapshot.entity.ts`
- [ ] 7.4 Implement bot fallback generation (uses `generateBot()` from core)
- [ ] 7.5 **VERIFY**: `npm test -- --testPathPattern=economy|matchmaking`

### Task 8: Integrate with Battle Simulator
**Estimate**: 45 min | **Requirement**: REQ-3

- [ ] 8.1 Update battle simulator to accept spell timings
- [ ] 8.2 Implement HP-based spell trigger logic
- [ ] 8.3 Add spell execution to battle events
- [ ] 8.4 Add integration tests
- [ ] 8.5 **VERIFY**: `npm test -- --testPathPattern=battle`

**CHECKPOINT 2**: Backend services complete. All backend tests pass.

---

## Phase 3: Frontend Components (Tasks 9-14)

### Task 9: Create Stores
**Estimate**: 45 min | **Requirement**: REQ-4, REQ-5

- [ ] 9.1 Create `frontend/src/store/runStore.ts`
- [ ] 9.2 Create `frontend/src/store/draftStore.ts`
- [ ] 9.3 Implement createRun, loadRun, loadActiveRun actions
- [ ] 9.4 Implement loadDraft, selectCard, submitDraft actions
- [ ] 9.5 **VERIFY**: `npm run build`

### Task 10: Create Selection Components
**Estimate**: 45 min | **Requirement**: REQ-13

- [ ] 10.1 Create `frontend/src/components/roguelike/FactionSelect.tsx`
- [ ] 10.2 Create `frontend/src/components/roguelike/LeaderSelect.tsx`
- [ ] 10.3 Create `frontend/src/components/roguelike/LeaderCard.tsx`
- [ ] 10.4 **VERIFY**: `npm run build`

### Task 11: Create Draft & Shop Components
**Estimate**: 60 min | **Requirement**: REQ-13

- [ ] 11.1 Create `frontend/src/components/roguelike/DraftScreen.tsx`
- [ ] 11.2 Create `frontend/src/components/roguelike/DraftCard.tsx`
- [ ] 11.3 Create `frontend/src/components/roguelike/UpgradeShop.tsx`
- [ ] 11.4 Create `frontend/src/components/roguelike/UpgradeCard.tsx`
- [ ] 11.5 Add tier indicators (T1/T2/T3)
- [ ] 11.6 **VERIFY**: `npm run build`

**CHECKPOINT 3**: Core components complete.

---

### Task 12: Create Status & Result Components
**Estimate**: 45 min | **Requirement**: REQ-13

- [ ] 12.1 Create `frontend/src/components/roguelike/RunStatusBar.tsx`
- [ ] 12.2 Display wins/losses (9 slots), gold, leader portrait
- [ ] 12.3 Create `frontend/src/components/roguelike/RunEndScreen.tsx`
- [ ] 12.4 Victory screen (9 wins), Defeat screen (4 losses)
- [ ] 12.5 **VERIFY**: `npm run build`

### Task 13: Create Pages
**Estimate**: 60 min | **Requirement**: REQ-13

- [ ] 13.1 Create `frontend/src/app/run/new/page.tsx` (Faction & Leader select)
- [ ] 13.2 Create `frontend/src/app/run/[id]/draft/page.tsx`
- [ ] 13.3 Create `frontend/src/app/run/[id]/battle/page.tsx`
- [ ] 13.4 Create `frontend/src/app/run/[id]/shop/page.tsx`
- [ ] 13.5 Create `frontend/src/app/run/[id]/result/page.tsx`
- [ ] 13.6 **VERIFY**: `npm run build`

### Task 14: Add i18n & Navigation
**Estimate**: 30 min | **Requirement**: REQ-13

- [ ] 14.1 Add tier prop to UnitCard (border color: bronze/silver/gold)
- [ ] 14.2 Add Russian/English translations for roguelike UI
- [ ] 14.3 Add "Roguelike Run" button to main menu
- [ ] 14.4 **VERIFY**: `npm run build`

**CHECKPOINT 4**: Frontend complete.

---

## Phase 4: Integration & Testing (Tasks 15-18)

### Task 15: Backend Integration Tests
**Estimate**: 45 min | **Requirement**: All

- [ ] 15.1 Create run flow integration test
- [ ] 15.2 Test draft → battle → upgrade cycle
- [ ] 15.3 Test run end conditions (9 wins, 4 losses)
- [ ] 15.4 **VERIFY**: `npm test`

### Task 16: Frontend Component Tests
**Estimate**: 30 min | **Requirement**: All

- [ ] 16.1 Add tests for FactionSelect
- [ ] 16.2 Add tests for DraftScreen
- [ ] 16.3 Add tests for UpgradeShop
- [ ] 16.4 **VERIFY**: `npm test`

### Task 17: E2E Flow Test
**Estimate**: 45 min | **Requirement**: All

- [ ] 17.1 Test complete run flow (start → draft → battle → shop → repeat)
- [ ] 17.2 Test with MVP battle simulator (no mechanics)
- [ ] 17.3 **VERIFY**: Manual testing

### Task 18: Final Verification
**Estimate**: 30 min | **Requirement**: All

- [ ] 18.1 Run full test suite (backend + frontend)
- [ ] 18.2 Verify MVP mode still works
- [ ] 18.3 Update CHANGELOG.md
- [ ] 18.4 **VERIFY**: All tests pass

**CHECKPOINT 5**: All tests pass. MVP backward compatible.

---

## Phase 5: Combat Mechanics Integration (OPTIONAL)

> **Prerequisite**: `core-mechanics-2.0` spec completed

После завершения core-mechanics-2.0, подключаем боевые механики к roguelike mode.

### Task 27: Integrate MechanicsProcessor
**Estimate**: 60 min | **Requirement**: REQ-11 to REQ-24

- [ ] 27.1 Import `createMechanicsProcessor`, `ROGUELIKE_PRESET` from core
- [ ] 27.2 Update roguelike battle service to use processor
- [ ] 27.3 Add mechanics config to run entity (optional override)
- [ ] 27.4 **VERIFY**: `npm test -- --testPathPattern=battle`

### Task 28: Add Combat UI Components
**Estimate**: 90 min | **Requirement**: REQ-11 to REQ-24

- [ ] 28.1 Create `ResolveBar.tsx` (morale indicator)
- [ ] 28.2 Create `EngagementIndicator.tsx` (ZoC visual)
- [ ] 28.3 Create `AmmoCounter.tsx` (ranged ammo)
- [ ] 28.4 Create `VigilanceIndicator.tsx` (overwatch state)
- [ ] 28.5 Create `ContagionEffect.tsx` (status spread visual)
- [ ] 28.6 Create `ArmorShredIndicator.tsx` (armor degradation)
- [ ] 28.7 **VERIFY**: `npm run build`

### Task 29: Add Combat Animations
**Estimate**: 60 min | **Requirement**: REQ-11 to REQ-24

- [ ] 29.1 Riposte counter-attack animation
- [ ] 29.2 Charge momentum animation
- [ ] 29.3 Intercept/Overwatch trigger animation
- [ ] 29.4 Contagion spread animation
- [ ] 29.5 **VERIFY**: `npm run build`

### Task 30: Combat Integration Tests
**Estimate**: 45 min | **Requirement**: All

- [ ] 30.1 Test battle with ROGUELIKE_PRESET
- [ ] 30.2 Test all 14 mechanics work together
- [ ] 30.3 Test faction asymmetry (Humans vs Undead)
- [ ] 30.4 **VERIFY**: `npm test`

**CHECKPOINT 9**: Full roguelike mode with combat mechanics complete.

---

## Summary

| Phase | Tasks | Time | Content |
|-------|-------|------|---------|
| Phase 1: Data & Entities | 1-6 | ~5h | Factions, Leaders, Units, Spells, Run, Snapshot |
| Phase 2: Game Systems | 7-12 | ~5h | Draft, Upgrade, Gold, Matchmaking, Rating |
| Phase 3: Frontend | 13-22 | ~8h | Stores, Components, Pages, i18n |
| Phase 4: Integration | 23-26 | ~3h | Tests, Verification |
| **Subtotal (Core)** | **26 tasks** | **~21h** | **Playable roguelike mode** |
| Phase 5: Combat (Optional) | 27-30 | ~4h | Mechanics integration, UI, Animations |
| **Total (Full)** | **30 tasks** | **~25h** | **With all combat mechanics** |

---

## Checkpoints Summary

| # | After Task | Verification |
|---|------------|--------------|
| 1 | 3 | Faction, Leader, Unit data complete |
| 2 | 6 | Entities complete, DB schema verified |
| 3 | 9 | Core systems (draft, upgrade, gold) complete |
| 4 | 12 | Backend complete |
| 5 | 15 | Stores and selection components complete |
| 6 | 19 | Core components complete |
| 7 | 22 | Frontend complete |
| 8 | 26 | All tests pass, MVP backward compatible |
| 9 | 30 | Full roguelike with combat mechanics (optional) |

---

## Dependencies

```
Phase 1 (Data & Entities):
Task 1 (Factions) → Task 2 (Leaders) → Task 3 (Units)
Task 3 (Units) → Task 4 (Spells)
Task 4 (Spells) → Task 5 (Run Entity)
Task 5 (Run) → Task 6 (Snapshots)

Phase 2 (Game Systems):
Task 5 (Run) → Tasks 7-9 (Draft, Upgrade, Gold)
Task 6 (Snapshots) → Task 10 (Matchmaking)
Task 9 (Gold) → Task 11 (Rating)
Task 4 (Spells) → Task 12 (Battle Integration)

Phase 3 (Frontend):
Task 5 (Run) → Task 13 (Run Store)
Task 7 (Draft) → Task 14 (Draft Store)
Tasks 13-14 → Tasks 15-19 (Components)
Tasks 15-19 → Tasks 20-22 (Pages, i18n, Navigation)

Phase 4 (Integration):
Tasks 20-22 → Tasks 23-26 (Tests)

Phase 5 (Combat - Optional):
core-mechanics-2.0 completed → Tasks 27-30
```

---

## Relationship to Other Specs

| Spec | Relationship | Status |
|------|--------------|--------|
| `core-extraction` (1.0) | Prerequisite — provides base battle engine | ✅ Complete |
| `core-progression` (3.0) | Prerequisite — provides deck, draft, economy, run, snapshot systems | ✅ Complete |
| `core-mechanics-2.0` | Optional — provides combat mechanics (Phase 5) | ⬜ Ready |
| MVP mode | Unaffected — roguelike is separate game mode | ✅ Stable |

### Core Progression Systems Available

The following systems from `core-progression` are ready to use:

```typescript
import {
  // Deck
  createDeck, shuffleDeck, drawCards, addCard, removeCard,
  // Hand
  createHand, addToHand, removeFromHand, isHandFull,
  // Draft
  createDraft, pickCard, banCard, rerollOptions, skipDraft, getDraftResult,
  INITIAL_DRAFT_CONFIG, POST_BATTLE_DRAFT_CONFIG,
  // Upgrade
  upgradeCard, getUpgradeCost, getStatMultiplier, getTierName,
  ROGUELIKE_TIERS, STANDARD_TIERS,
  // Economy
  createWallet, addCurrency, spendCurrency, canAfford, getReward,
  ROGUELIKE_ECONOMY_CONFIG,
  // Run
  createRun, recordWin, recordLoss, advancePhase, isRunComplete, getRunStats,
  ROGUELIKE_RUN_CONFIG,
  // Snapshot
  createSnapshot, findOpponent, generateBot, enforceSnapshotLimits,
  ROGUELIKE_SNAPSHOT_CONFIG, ROGUELIKE_MATCHMAKING_CONFIG, ROGUELIKE_BOT_CONFIG,
} from '@core/progression';
```

---

## Phase 1 Content Summary

| Category | Count | Details |
|----------|-------|---------|
| Factions | 2 | Humans (+10% HP), Undead (+15% ATK) |
| Leaders | 2 | Commander Aldric, Lich King Malachar |
| Spells | 4 | Holy Light, Rally, Death Coil, Raise Dead |
| T1 Units | 24 | 12 per faction (purchasable) |
| T2/T3 Upgrades | 48 | 24 upgrade lines (not purchasable) |
| Starter Decks | 2 | Pre-built balanced decks |

---

## Notes

- Phase 1-4 создают **играбельный roguelike mode** с MVP боевой системой
- Phase 5 добавляет **продвинутые боевые механики** из core-mechanics-2.0
- Можно релизить после Phase 4 и добавлять механики постепенно
- Каждая механика из core-mechanics-2.0 может быть включена независимо
- Фракции (Order, Chaos, Nature, Shadow, Arcane, Machine) — future work
