# Tasks: Roguelike Run Mode

## Overview

Roguelike-run использует переиспользуемые системы из `core-progression` и опционально боевые механики из `core-mechanics-2.0`.

| Phase | Description | Tasks | Est. Hours |
|-------|-------------|-------|------------|
| 0 | Setup & Prerequisites | 0 | 0.5h |
| 1 | Backend: Game Data | 1-4 | 4h |
| 2 | Backend: Entities & Services | 5-9 | 6h |
| 3 | Frontend: Stores & Components | 10-15 | 6h |
| 4 | Integration & Testing | 16-18 | 3.5h |
| **Total** | | **19 tasks** | **~20h** |

> **Note**: Оценки включают 25% buffer для непредвиденных задач.

**Optional Phase 5**: После завершения `core-mechanics-2.0` — подключение боевых механик (~4h)

---

## Quality Standards (ОБЯЗАТЕЛЬНО для всех задач)

Каждая задача ДОЛЖНА соответствовать стандартам проекта:

| Standard | Requirement |
|----------|-------------|
| **JSDoc** | Все public функции с @param, @returns, @example |
| **Jest** | Unit тесты для всех сервисов и pure functions |
| **Swagger** | @ApiTags, @ApiOperation, @ApiResponse для контроллеров |
| **TypeORM** | Entities с валидацией, миграции с rollback |
| **Logger** | NestJS Logger с context (runId, playerId) |
| **DTOs** | class-validator декораторы для всех DTO |
| **Error Handling** | Кастомные exceptions, proper HTTP codes |
| **ESLint** | Без `any`, без `!`, без `console.log`, без floating promises |
| **Prettier** | Single quotes, trailing commas, 100 char width |
| **Husky** | Pre-commit: typecheck + lint (backend + frontend) |
| **a11y** | aria-labels, keyboard nav, focus management, screen reader text |

---

## Prerequisites

- [x] Core extraction spec completed (PR 5)
- [x] `core-progression` spec completed (deck, draft, economy, run, snapshot systems)
  - ✅ Deck, Hand, Draft, Upgrade, Economy, Run, Snapshot systems
  - ✅ Presets: ROGUELIKE_RUN_CONFIG, ROGUELIKE_ECONOMY_CONFIG, etc.
- [x] Grid system supports configurable dimensions (8×10 battle grid, 8×2 deployment)

---

## Phase 0: Setup (Task 0)

### Task 0: Create Module Structure & Database Setup
**Estimate**: 30 min | **Requirement**: All

- [ ] 0.1 Create `backend/src/roguelike/` directory structure:
  - `types/` — TypeScript interfaces
  - `data/` — Static game data (factions, units, spells)
  - `entities/` — TypeORM entities
  - `dto/` — Request/Response DTOs with validation
  - `run/` — Run service & controller
  - `draft/` — Draft service & controller
  - `upgrade/` — Upgrade service & controller
  - `economy/` — Economy service
  - `matchmaking/` — Matchmaking service
  - `exceptions/` — Custom exceptions
- [ ] 0.2 Create `backend/src/roguelike/roguelike.module.ts`
- [ ] 0.3 Register RoguelikeModule in AppModule
- [ ] 0.4 Create empty migration file for rollback safety
- [ ] 0.5 **VERIFY**: `npm run build` passes

**CHECKPOINT 0**: Module structure ready.

---

## Phase 1: Backend Game Data (Tasks 1-4)

### Task 1: Create Faction & Leader Types
**Estimate**: 30 min | **Requirement**: REQ-1, REQ-2

- [ ] 1.1 Create `backend/src/roguelike/types/faction.types.ts`
  - `Faction` type: 'humans' | 'undead'
  - `FactionBonus` interface: { stat, value }
  - `FactionData` interface: { id, name, description, bonus, icon }
  - **JSDoc**: All interfaces documented
- [ ] 1.2 Create `backend/src/roguelike/types/leader.types.ts`
  - `Leader` interface: { id, name, faction, passive, spells, portrait }
  - `PassiveAbility` interface: { id, name, effect }
  - **JSDoc**: All interfaces documented
- [ ] 1.3 Create `backend/src/roguelike/types/index.ts` (re-exports)
- [ ] 1.4 **VERIFY**: Types compile without errors

### Task 2: Create Faction & Leader Data
**Estimate**: 30 min | **Requirement**: REQ-1, REQ-2

- [ ] 2.1 Create `backend/src/roguelike/data/factions.data.ts`
  - Humans: +10% HP bonus
  - Undead: +15% ATK bonus
  - **JSDoc**: @example for each faction
- [ ] 2.2 Create `backend/src/roguelike/data/leaders.data.ts`
  - Commander Aldric (Humans): Formation passive, Holy Light + Rally spells
  - Lich King Malachar (Undead): Life Drain passive, Death Coil + Raise Dead spells
  - **JSDoc**: @example for each leader
- [ ] 2.3 Add helper functions with JSDoc: `getFaction()`, `getLeader()`, `getLeadersByFaction()`
- [ ] 2.4 Create unit tests: `factions.data.spec.ts`, `leaders.data.spec.ts`
- [ ] 2.5 **VERIFY**: `npm test -- --testPathPattern=roguelike`

### Task 3: Create Unit Types & Data
**Estimate**: 60 min | **Requirement**: REQ-1.2

- [ ] 3.1 Create `backend/src/roguelike/types/unit.types.ts`
  - `RoguelikeUnit` interface (extends BaseCard from core)
  - `UnitTier` type: 1 | 2 | 3
  - `StarterDeck` interface
  - **JSDoc**: All interfaces documented
- [ ] 3.2 Create `backend/src/roguelike/data/humans.units.ts`
  - 12 T1 units with stats
  - T2/T3 upgrade definitions (stat multipliers)
- [ ] 3.3 Create `backend/src/roguelike/data/undead.units.ts`
  - 12 T1 units with stats
  - T2/T3 upgrade definitions
- [ ] 3.4 Create `backend/src/roguelike/data/starter-decks.data.ts`
  - Pre-built balanced decks for each faction
- [ ] 3.5 Create unit tests: `units.data.spec.ts`
- [ ] 3.6 **VERIFY**: `npm test -- --testPathPattern=unit`

### Task 4: Create Spell Types & Data
**Estimate**: 45 min | **Requirement**: REQ-3

- [ ] 4.1 Create `backend/src/roguelike/types/spell.types.ts`
  - `Spell` interface: { id, name, effect, faction }
  - `SpellTiming` type: 'early' | 'mid' | 'late'
  - `SpellExecution` interface: { spellId, timing, triggered }
  - **JSDoc**: All interfaces documented
- [ ] 4.2 Create `backend/src/roguelike/data/spells.data.ts`
  - Holy Light, Rally (Humans)
  - Death Coil, Raise Dead (Undead)
- [ ] 4.3 Create `shouldTriggerSpell()` pure function (HP-based timing)
  - **JSDoc**: @param, @returns, @example
- [ ] 4.4 Create unit tests: `spells.data.spec.ts`
- [ ] 4.5 **VERIFY**: `npm test -- --testPathPattern=spell`

**CHECKPOINT 1**: Game data complete. Run `npm test`.

---

## Phase 2: Backend Entities & Services (Tasks 5-9)

### Task 5: Create Database Entities & Migration
**Estimate**: 90 min | **Requirement**: REQ-4

- [ ] 5.1 Create `backend/src/roguelike/entities/run.entity.ts`
  - Fields: id, playerId, faction, leaderId, deck, remainingDeck, hand, spells
  - Fields: wins, losses, consecutiveWins, gold, battleHistory, status, rating
  - **TypeORM**: @Entity, @Column with proper types, @Index for playerId
  - **Validation**: @IsUUID, @IsEnum, @Min, @Max where applicable
- [ ] 5.2 Create `backend/src/roguelike/entities/snapshot.entity.ts`
  - Fields: id, runId, playerId, wins, rating, team, spellTimings, faction, leaderId
  - **TypeORM**: @Index for (wins, rating, createdAt) — composite index for matchmaking
  - **TODO**: Add query limit in findOpponent (max 100 candidates) for scalability
- [ ] 5.3 Create TypeORM migration: `npm run migration:generate -- -n CreateRoguelikeTables`
- [ ] 5.4 Test migration rollback: `npm run migration:revert`
- [ ] 5.5 Create entity unit tests: `run.entity.spec.ts`, `snapshot.entity.spec.ts`
- [ ] 5.6 **VERIFY**: `npm run migration:run` succeeds, `npm run migration:revert` works

### Task 6: Create DTOs & Exceptions
**Estimate**: 45 min | **Requirement**: REQ-4

- [ ] 6.1 Create `backend/src/roguelike/dto/run.dto.ts`
  - `CreateRunDto`: faction, leaderId with @IsEnum, @IsUUID
  - `RunResponseDto`: full run state
  - `UpdateRunDto`: partial update
  - **Swagger**: @ApiProperty for all fields
- [ ] 6.2 Create `backend/src/roguelike/dto/draft.dto.ts`
  - `DraftOptionsDto`, `SubmitDraftDto`, `DraftResultDto`
- [ ] 6.3 Create `backend/src/roguelike/dto/upgrade.dto.ts`
  - `UpgradeUnitDto`, `UpgradeResultDto`
- [ ] 6.4 Create `backend/src/roguelike/exceptions/roguelike.exceptions.ts`
  - `RunNotFoundException`, `InvalidDraftPickException`
  - `InsufficientGoldException`, `RunAlreadyCompletedException`
  - Extend from `HttpException` with proper status codes
- [ ] 6.5 **VERIFY**: DTOs compile, exceptions work

### Task 7: Create Run Service & Controller
**Estimate**: 90 min | **Requirement**: REQ-4

- [ ] 7.1 Create `backend/src/roguelike/run/run.service.ts`
  - Uses `createRun()`, `recordWin()`, `recordLoss()` from `@core/progression`
  - Uses `ROGUELIKE_RUN_CONFIG` preset
  - Methods: createRun(), getActiveRun(), updateRunState(), abandonRun()
  - **Logger**: NestJS Logger with context { runId, playerId }
  - **JSDoc**: All public methods documented
- [ ] 7.2 Create `backend/src/roguelike/run/run.controller.ts`
  - POST /api/runs — create new run
  - GET /api/runs/:id — get run state
  - GET /api/runs/active — get active run for player
  - DELETE /api/runs/:id — abandon run
  - **Swagger**: @ApiTags('roguelike'), @ApiOperation, @ApiResponse
- [ ] 7.3 Create unit tests: `run.service.spec.ts`
- [ ] 7.4 Create controller tests: `run.controller.spec.ts`
- [ ] 7.5 **VERIFY**: `npm test -- --testPathPattern=run`

### Task 8: Create Draft, Upgrade & Economy Services
**Estimate**: 60 min | **Requirement**: REQ-5, REQ-6, REQ-7

- [ ] 8.1 Create `backend/src/roguelike/draft/draft.service.ts`
  - Uses `createDraft()`, `pickCard()` from `@core/progression`
  - Uses `INITIAL_DRAFT_CONFIG`, `POST_BATTLE_DRAFT_CONFIG` presets
  - Methods: getInitialDraft(), getPostBattleDraft(), submitPicks()
  - **Logger**: Log draft events with context
- [ ] 8.2 Create `backend/src/roguelike/upgrade/upgrade.service.ts`
  - Uses `upgradeCard()`, `getUpgradeCost()` from `@core/progression`
  - Uses `ROGUELIKE_TIERS` preset
  - Methods: getUpgradeOptions(), upgradeUnit()
- [ ] 8.3 Create `backend/src/roguelike/economy/economy.service.ts`
  - Uses `createWallet()`, `addCurrency()`, `spendCurrency()` from `@core/progression`
  - Uses `ROGUELIKE_ECONOMY_CONFIG` preset
  - Methods: getGoldReward(), canAffordUpgrade()
- [ ] 8.4 Create controllers with Swagger docs
- [ ] 8.5 Create unit tests for all services
- [ ] 8.6 **VERIFY**: `npm test -- --testPathPattern=draft|upgrade|economy`

### Task 9: Create Matchmaking Service & Battle Integration
**Estimate**: 60 min | **Requirement**: REQ-9, REQ-3

- [ ] 9.1 Create `backend/src/roguelike/matchmaking/matchmaking.service.ts`
  - Uses `createSnapshot()`, `findOpponent()`, `generateBot()` from `@core/progression`
  - Uses `ROGUELIKE_SNAPSHOT_CONFIG`, `ROGUELIKE_MATCHMAKING_CONFIG`, `ROGUELIKE_BOT_CONFIG`
  - Methods: saveSnapshot(), findOpponent(), generateBotOpponent()
  - **Logger**: Log matchmaking events
- [ ] 9.2 Update battle simulator to accept spell timings parameter
- [ ] 9.3 Implement HP-based spell trigger logic in battle loop
- [ ] 9.4 Add spell execution to battle events
- [ ] 9.5 Create integration tests: `roguelike.integration.spec.ts`
- [ ] 9.6 **VERIFY**: `npm test -- --testPathPattern=matchmaking|battle`

**CHECKPOINT 2**: Backend complete. All backend tests pass.

---

## Phase 3: Frontend Stores & Components (Tasks 10-15)

### Task 10: Create Zustand Stores
**Estimate**: 45 min | **Requirement**: REQ-4, REQ-5

- [ ] 10.1 Create `frontend/src/store/runStore.ts`
  - State: currentRun, isLoading, error
  - Actions: createRun(), loadRun(), loadActiveRun(), abandonRun()
  - **Error handling**: try/catch with proper error messages
- [ ] 10.2 Create `frontend/src/store/draftStore.ts`
  - State: options, selected, isInitial
  - Actions: loadDraft(), selectCard(), submitDraft()
- [ ] 10.3 Add API client methods in `frontend/src/lib/api.ts`
  - Roguelike endpoints with proper error handling
- [ ] 10.4 **VERIFY**: `npm run build`

### Task 11: Create Selection Components
**Estimate**: 45 min | **Requirement**: REQ-13

- [ ] 11.1 Create `frontend/src/components/roguelike/FactionSelect.tsx`
  - Display 2 faction cards with bonuses
  - Handle selection state
  - **Accessibility**: aria-labels, keyboard navigation
- [ ] 11.2 Create `frontend/src/components/roguelike/LeaderSelect.tsx`
  - Display 2 leader cards per faction
  - Show passive ability and spell options
- [ ] 11.3 Create `frontend/src/components/roguelike/LeaderCard.tsx`
  - Portrait, name, passive description, spell icons
- [ ] 11.4 **VERIFY**: `npm run build`

### Task 12: Create Draft & Shop Components
**Estimate**: 60 min | **Requirement**: REQ-13

- [ ] 12.1 Create `frontend/src/components/roguelike/DraftScreen.tsx`
  - Display 3-5 card options
  - Handle multi-select for initial draft (3 picks)
  - Handle single-select for post-battle draft (1 pick)
- [ ] 12.2 Create `frontend/src/components/roguelike/DraftCard.tsx`
  - Unit card with selection state
- [ ] 12.3 Create `frontend/src/components/roguelike/UpgradeShop.tsx`
  - Display hand with upgrade buttons
  - Show upgrade costs and gold balance
- [ ] 12.4 Create `frontend/src/components/roguelike/UpgradeCard.tsx`
  - Unit card with tier indicator and upgrade button
- [ ] 12.5 Add tier indicators to UnitCard (border color: bronze/silver/gold)
- [ ] 12.6 Create `frontend/src/components/roguelike/SpellTimingSelect.tsx`
  - Props: spell, selectedTiming, onChange
  - 3 radio buttons: Early / Mid / Late
  - Tooltip with timing explanation
  - **a11y**: aria-label, keyboard navigation
- [ ] 12.7 Create `frontend/src/components/roguelike/SpellTimingPanel.tsx`
  - Container for 2 spells with SpellTimingSelect
- [ ] 12.8 **VERIFY**: `npm run build`

### Task 13: Create Status & Result Components
**Estimate**: 45 min | **Requirement**: REQ-13

- [ ] 13.1 Create `frontend/src/components/roguelike/RunStatusBar.tsx`
  - Display wins/losses (9 win slots, 4 loss slots)
  - Show gold balance
  - Show leader portrait
- [ ] 13.2 Create `frontend/src/components/roguelike/RunEndScreen.tsx`
  - Victory screen (9 wins): rewards, rating change
  - Defeat screen (4 losses): stats, retry button
- [ ] 13.3 **VERIFY**: `npm run build`

### Task 14: Create Pages
**Estimate**: 90 min | **Requirement**: REQ-13

- [ ] 14.1 Create `frontend/src/app/run/new/page.tsx`
  - Faction selection → Leader selection → Start run
  - **Error handling**: Show error states
- [ ] 14.2 Create `frontend/src/app/run/[id]/draft/page.tsx`
  - Initial draft or post-battle draft
- [ ] 14.3 Create `frontend/src/app/run/[id]/battle/page.tsx`
  - Team placement → Spell timing selection → Battle replay
- [ ] 14.4 Create `frontend/src/app/run/[id]/shop/page.tsx`
  - Upgrade shop after battle
- [ ] 14.5 Create `frontend/src/app/run/[id]/result/page.tsx`
  - Run end screen (victory/defeat)
- [ ] 14.6 **VERIFY**: `npm run build`

### Task 15: Add i18n & Navigation
**Estimate**: 30 min | **Requirement**: REQ-13

- [ ] 15.1 Add translations to `frontend/messages/`:
  - Add roguelike keys to `en.json` and `ru.json`
  - Faction names, leader names, spell names
  - UI labels: "Start Run", "Draft", "Upgrade", etc.
  - Error messages
  - Using existing next-intl setup
- [ ] 15.2 Add "Roguelike Run" button to main menu (Navigation.tsx)
- [ ] 15.3 Add run status indicator to header when run is active
- [ ] 15.4 **VERIFY**: `npm run build`

**CHECKPOINT 3**: Frontend complete.

---

## Phase 4: Integration & Testing (Tasks 16-18)

### Task 16: Backend Integration Tests
**Estimate**: 60 min | **Requirement**: All

- [ ] 16.1 Create `backend/src/roguelike/roguelike.integration.spec.ts`
- [ ] 16.2 Test full run flow: create → draft → battle → upgrade → repeat
- [ ] 16.3 Test run end conditions (9 wins, 4 losses)
- [ ] 16.4 Test matchmaking with snapshots and bot fallback
- [ ] 16.5 Test HTTP error scenarios:
  - 401: Request without auth token
  - 403: Access other player's run
  - 404: Non-existent run ID
  - 409: Action on completed run
  - 422: Invalid faction/leader combination
- [ ] 16.6 Test migration rollback scenario
- [ ] 16.7 **VERIFY**: `npm test`

### Task 17: Frontend Component Tests
**Estimate**: 60 min | **Requirement**: All

- [ ] 17.1 Add tests for FactionSelect component
- [ ] 17.2 Add tests for LeaderSelect component
- [ ] 17.3 Add tests for DraftScreen component
- [ ] 17.4 Add tests for UpgradeShop component
- [ ] 17.5 Add tests for RunStatusBar component
- [ ] 17.6 Add tests for SpellTimingSelect component
- [ ] 17.7 Test loading and error states
- [ ] 17.8 Test keyboard navigation (a11y)
- [ ] 17.9 **VERIFY**: `npm test`

### Task 18: Final Verification
**Estimate**: 30 min | **Requirement**: All

- [ ] 18.1 Run full test suite (backend + frontend)
- [ ] 18.2 Manual E2E test: complete run flow
- [ ] 18.3 Verify MVP mode still works (backward compatibility)
- [ ] 18.4 Verify migration can be rolled back safely
- [ ] 18.5 Update CHANGELOG.md
- [ ] 18.6 **VERIFY**: All tests pass

**CHECKPOINT 4**: All tests pass. MVP backward compatible.

---

## Rollback & Recovery Strategy

### Database Rollback
```bash
# Revert last migration
npm run migration:revert

# Revert to specific migration
npm run migration:revert -- -n CreateRoguelikeTables
```

### Code Rollback
- Каждый checkpoint = git tag для быстрого отката
- `git tag roguelike-checkpoint-1` после Phase 1
- `git tag roguelike-checkpoint-2` после Phase 2
- etc.

### Feature Flag (опционально)
```typescript
// В .env
FEATURE_ROGUELIKE_ENABLED=false

// В коде
if (process.env.FEATURE_ROGUELIKE_ENABLED === 'true') {
  // Enable roguelike routes
}
```

---

## Phase 5: Combat Mechanics Integration (OPTIONAL)

> **Prerequisite**: `core-mechanics-2.0` spec completed

### Task 19-22: Combat Mechanics
(Без изменений — см. предыдущую версию)

---

## Summary

| Phase | Tasks | Time | Content |
|-------|-------|------|---------|
| Phase 0: Setup | 0 | ~0.5h | Module structure, migration setup |
| Phase 1: Game Data | 1-4 | ~4h | Types, Factions, Leaders, Units, Spells |
| Phase 2: Backend | 5-9 | ~6h | Entities, DTOs, Services, Controllers |
| Phase 3: Frontend | 10-15 | ~6h | Stores, Components, Pages |
| Phase 4: Testing | 16-18 | ~3.5h | Integration tests, verification |
| **Subtotal (Core)** | **19 tasks** | **~20h** | **Playable roguelike mode** |
| Phase 5: Combat (Optional) | 19-22 | ~4h | Mechanics integration, UI |
| **Total (Full)** | **23 tasks** | **~24h** | **With all combat mechanics** |

> **Note**: Оценки включают 25% buffer. Реальное время может варьироваться.

---

## Checkpoints Summary

| # | After Task | Verification | Git Tag |
|---|------------|--------------|---------|
| 0 | 0 | Module structure ready | `roguelike-checkpoint-0` |
| 1 | 4 | Game data complete | `roguelike-checkpoint-1` |
| 2 | 9 | Backend complete | `roguelike-checkpoint-2` |
| 3 | 15 | Frontend complete | `roguelike-checkpoint-3` |
| 4 | 18 | All tests pass | `roguelike-checkpoint-4` |
| 5 | 22 | Combat mechanics (optional) | `roguelike-checkpoint-5` |

---

## Dependencies

```
Phase 0 (Setup):
Task 0 (Module Structure + Migration Setup)
    │
    ▼
Phase 1 (Game Data):
Task 1 (Types) → Task 2 (Factions/Leaders)
Task 1 (Types) → Task 3 (Units)
Task 1 (Types) → Task 4 (Spells)
    │
    ▼
Phase 2 (Backend):
Task 4 → Task 5 (Entities + Migration)
Task 5 → Task 6 (DTOs + Exceptions)
Task 6 → Task 7 (Run Service)
Task 7 → Task 8 (Draft/Upgrade/Economy)
Task 7 → Task 9 (Matchmaking + Battle)
    │
    ▼
Phase 3 (Frontend):
Task 7 → Task 10 (Stores)
Task 10 → Task 11-15 (Components + Pages)
    │
    ▼
Phase 4 (Testing):
Tasks 9, 15 → Task 16-18 (Tests + Verification)
```

---

## Relationship to Other Specs

| Spec | Relationship | Status |
|------|--------------|--------|
| `core-extraction` (1.0) | Prerequisite — provides base battle engine | ✅ Complete |
| `core-progression` (3.0) | Prerequisite — provides deck, draft, economy, run, snapshot systems | ✅ Complete |
| `core-mechanics-2.0` | Optional — provides combat mechanics (Phase 5) | ⬜ Ready |
| MVP mode | Unaffected — roguelike is separate game mode | ✅ Stable |

---

## Core Progression Systems Available

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

- Phase 0-4 создают **играбельный roguelike mode** с MVP боевой системой
- Phase 5 добавляет **продвинутые боевые механики** из core-mechanics-2.0
- Можно релизить после Phase 4 и добавлять механики постепенно
- **Rollback**: Каждый checkpoint имеет git tag для быстрого отката
- **Migration**: Все миграции тестируются на rollback перед merge
- Фракции (Order, Chaos, Nature, Shadow, Arcane, Machine) — future work
