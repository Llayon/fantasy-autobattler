# Tasks: Core Progression Systems

## Overview

| Phase | Description | Tasks | Est. Hours |
|-------|-------------|-------|------------|
| 0 | Prerequisites | 0 | 0.5h |
| 1 | Foundation & Types | 1-3 | 3h |
| 2 | Deck & Hand | 4-7 | 4h |
| 3 | Draft System | 8-11 | 4h |
| 4 | Upgrade & Economy | 12-15 | 4h |
| 5 | Run System | 16-19 | 4h |
| 6 | Snapshot & Matchmaking | 20-22 | 3h |
| 7 | Integration & Docs | 23-25 | 3h |
| **Total** | | **26 tasks** | **~25.5h** |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `- [ ]` | Required task |
| `- [ ]?` | Optional/stretch goal |
| `**VERIFY**` | Mandatory verification step |
| `**CHECKPOINT**` | Phase completion gate |
| `Property N` | Property-based test (uses fast-check) |

---

## Phase 0: Prerequisites (Task 0)

### Task 0: Verify Prerequisites
**Estimate**: 15 min

- [ ] 0.1 Verify SeededRandom exists in `core/utils/random.ts`
- [ ] 0.2 If missing, complete from core-extraction PR
- [ ] 0.3 Install fast-check: `npm install --save-dev fast-check`
- [ ] 0.4 **VERIFY**: `import { SeededRandom } from '../utils/random'` works

**CHECKPOINT 0**: Prerequisites verified.

---

## Prerequisites

- [x] Core extraction spec completed (PR 5)
- [x] SeededRandom available in core/utils (verified in Task 0)






---

## Phase 1: Foundation & Types (Tasks 1-3)

### Task 1: Create module structure
**Estimate**: 30 min

- [ ] 1.1 Create `backend/src/core/progression/` directory
- [ ] 1.2 Create subdirectories: `deck/`, `hand/`, `draft/`, `upgrade/`, `economy/`, `run/`, `snapshot/`
- [ ] 1.3 Create `types.ts` with BaseCard interface
- [ ] 1.4 Create placeholder `index.ts`
- [ ] 1.5 **VERIFY**: Directory structure exists

### Task 2: Define base types
**Estimate**: 45 min

- [ ] 2.1 Create `types.ts` with BaseCard interface
- [ ] 2.2 Add generic type constraints documentation
- [ ] 2.3 Add JSDoc for all types
- [ ] 2.4 **VERIFY**: Types compile without errors

### Task 3: Set up test infrastructure
**Estimate**: 45 min

- [ ] 3.1 Create test fixtures with mock cards
- [ ] 3.2 Create test helpers for common operations
- [ ] 3.3 Verify fast-check installed (from Task 0.3)
- [ ] 3.4 Create `progression/test-generators.ts`:
  - `arbitraryBaseCard()` — random BaseCard
  - `arbitraryDeck(config)` — valid deck for config
  - `arbitraryHand(config)` — valid hand for config
  - `arbitraryWallet(config)` — wallet with random amount
  - `arbitraryRun(config)` — run with random win/loss history
  - `arbitrarySnapshot(config)` — snapshot with random state
- [ ] 3.5 **VERIFY**: `npm test -- --testPathPattern=progression`

**CHECKPOINT 1**: Foundation complete.

---

## Phase 2: Deck & Hand Systems (Tasks 4-7)

### Task 4: Implement Deck types
**Estimate**: 30 min

- [ ] 4.1 Create `deck/deck.types.ts`
- [ ] 4.2 Define DeckConfig interface
- [ ] 4.3 Define Deck interface
- [ ] 4.4 Define DeckValidationResult interface
- [ ] 4.5 **VERIFY**: Types compile

### Task 5: Implement Deck operations
**Estimate**: 60 min

- [ ] 5.1 Create `deck/deck.ts`
- [ ] 5.2 Implement `createDeck()`
- [ ] 5.3 Implement `addCard()`
- [ ] 5.4 Implement `removeCard()`
- [ ] 5.5 Implement `shuffleDeck()` with seeded random
- [ ] 5.6 Implement `drawCards()`
- [ ] 5.7 Implement `validateDeck()`
- [ ] 5.8 Add JSDoc to all functions
- [ ] 5.9 **VERIFY**: `npm test -- --testPathPattern=deck`


### Task 6: Implement Hand types and operations
**Estimate**: 45 min

- [ ] 6.1 Create `hand/hand.types.ts`
- [ ] 6.2 Define HandConfig interface
- [ ] 6.3 Define Hand interface
- [ ] 6.4 Create `hand/hand.ts`
- [ ] 6.5 Implement `createHand()`
- [ ] 6.6 Implement `addToHand()` with overflow handling
- [ ] 6.7 Implement `removeFromHand()`
- [ ] 6.8 Implement `isHandFull()`
- [ ] 6.9 Add JSDoc to all functions
- [ ] 6.10 **VERIFY**: `npm test -- --testPathPattern=hand`

### Task 7: Deck & Hand unit tests
**Estimate**: 45 min

- [ ] 7.1 Create `deck/deck.spec.ts`
- [ ] 7.2 Test createDeck with valid/invalid configs
- [ ] 7.3 Test addCard with duplicates/max copies
- [ ] 7.4 Test shuffleDeck determinism (same seed = same result)
- [ ] 7.5 Test drawCards edge cases
- [ ] 7.6 Create `hand/hand.spec.ts`
- [ ] 7.7 Test addToHand with overflow
- [ ] 7.8 Test autoDiscard behavior
- [ ] 7.9 Write property test for deck size invariant (Property 1)
  - **Property 1: Deck size invariant after add**
  - **Validates: Requirements 1.2**
- [ ] 7.10 Write property test for shuffle determinism (Property 2)
  - **Property 2: Shuffle determinism**
  - **Validates: Requirements 1.2**
- [ ] 7.11 Write property test for draw preservation (Property 3)
  - **Property 3: Draw preserves total cards**
  - **Validates: Requirements 1.2**
- [ ] 7.12 Write property test for hand max size (Property 5)
  - **Property 5: Hand respects max size**
  - **Validates: Requirements 2.2**
- [ ] 7.13 **VERIFY**: All tests pass

**CHECKPOINT 2**: Deck & Hand systems complete.

---

## Phase 3: Draft System (Tasks 8-11)

### Task 8: Implement Draft types
**Estimate**: 30 min

- [ ] 8.1 Create `draft/draft.types.ts`
- [ ] 8.2 Define DraftConfig interface
- [ ] 8.3 Define Draft interface
- [ ] 8.4 Define DraftResult interface
- [ ] 8.5 **VERIFY**: Types compile

### Task 9: Implement Draft operations
**Estimate**: 60 min

- [ ] 9.1 Create `draft/draft.ts`
- [ ] 9.2 Implement `createDraft()` with seeded random
- [ ] 9.3 Implement `getDraftOptions()`
- [ ] 9.4 Implement `pickCard()`
- [ ] 9.5 Implement `banCard()`
- [ ] 9.6 Implement `rerollOptions()`
- [ ] 9.7 Implement `skipDraft()`
- [ ] 9.8 Implement `isDraftComplete()`
- [ ] 9.9 Implement `getDraftResult()`
- [ ] 9.10 Add JSDoc to all functions
- [ ] 9.11 **VERIFY**: `npm test -- --testPathPattern=draft`

### Task 10: Create Draft presets
**Estimate**: 30 min

- [ ] 10.1 Create `draft/draft.presets.ts`
- [ ] 10.2 Define INITIAL_DRAFT_CONFIG (5 options, pick 3)
- [ ] 10.3 Define POST_BATTLE_DRAFT_CONFIG (3 options, pick 1)
- [ ] 10.4 Define ARENA_DRAFT_CONFIG (pick-and-ban)
- [ ] 10.5 **VERIFY**: Presets export correctly

### Task 11: Draft unit tests
**Estimate**: 45 min

- [ ] 11.1 Create `draft/draft.spec.ts`
- [ ] 11.2 Test createDraft determinism
- [ ] 11.3 Test pickCard validation
- [ ] 11.4 Test banCard in different modes
- [ ] 11.5 Test rerollOptions limit
- [ ] 11.6 Test skipDraft when allowed/disallowed
- [ ] 11.7 Test isDraftComplete logic
- [ ] 11.8 Write property test for draft options count (Property 7)
  - **Property 7: Draft options count**
  - **Validates: Requirements 3.2**
- [ ] 11.9 Write property test for draft determinism (Property 8)
  - **Property 8: Draft determinism**
  - **Validates: Requirements 3.2**
- [ ] 11.10 Write property test for pick removes from options (Property 9)
  - **Property 9: Pick removes from options**
  - **Validates: Requirements 3.2**
- [ ] 11.11 **VERIFY**: All tests pass

**CHECKPOINT 3**: Draft system complete.

---

## Phase 4: Upgrade & Economy Systems (Tasks 12-15)

### Task 12: Implement Upgrade system
**Estimate**: 45 min

- [ ] 12.1 Create `upgrade/upgrade.types.ts`
- [ ] 12.2 Define UpgradeConfig interface
- [ ] 12.3 Create `upgrade/upgrade.ts`
- [ ] 12.4 Implement `getUpgradeCost()`
- [ ] 12.5 Implement `canUpgrade()`
- [ ] 12.6 Implement `upgradeCard()`
- [ ] 12.7 Implement `getStatMultiplier()`
- [ ] 12.8 Implement `getTierName()`
- [ ] 12.9 Add JSDoc to all functions
- [ ] 12.10 **VERIFY**: `npm test -- --testPathPattern=upgrade`

### Task 13: Create Upgrade presets
**Estimate**: 30 min

- [ ] 13.1 Create `upgrade/upgrade.presets.ts`
- [ ] 13.2 Define STANDARD_TIERS (T1/T2/T3, 100%/150%/200%)
- [ ] 13.3 Define SIMPLE_TIERS (+0 to +4)
- [ ] 13.4 Define LEGENDARY_TIERS (Common/Rare/Epic/Legendary)
- [ ] 13.5 **VERIFY**: Presets export correctly

### Task 14: Implement Economy system
**Estimate**: 45 min

- [ ] 14.1 Create `economy/economy.types.ts`
- [ ] 14.2 Define EconomyConfig interface
- [ ] 14.3 Define Wallet interface
- [ ] 14.4 Create `economy/economy.ts`
- [ ] 14.5 Implement `createWallet()`
- [ ] 14.6 Implement `addCurrency()`
- [ ] 14.7 Implement `spendCurrency()`
- [ ] 14.8 Implement `canAfford()`
- [ ] 14.9 Implement `applyInterest()`
- [ ] 14.10 Implement `getReward()`
- [ ] 14.11 Add JSDoc to all functions
- [ ] 14.12 **VERIFY**: `npm test -- --testPathPattern=economy`

### Task 15: Create Economy presets and tests
**Estimate**: 45 min

- [ ] 15.1 Create `economy/economy.presets.ts`
- [ ] 15.2 Define ROGUELIKE_ECONOMY_CONFIG
- [ ] 15.3 Define AUTOBATTLER_ECONOMY_CONFIG (with interest)
- [ ] 15.4 Create `upgrade/upgrade.spec.ts`
- [ ] 15.5 Create `economy/economy.spec.ts`
- [ ] 15.6 Test upgrade cost calculations
- [ ] 15.7 Test economy with max amount cap
- [ ] 15.8 Test interest calculation
- [ ] 15.9 Write property test for upgrade tier increment (Property 11)
  - **Property 11: Upgrade increases tier**
  - **Validates: Requirements 4.2**
- [ ] 15.10 Write property test for currency cap (Property 13)
  - **Property 13: Currency cap enforcement**
  - **Validates: Requirements 5.2**
- [ ] 15.11 Write property test for interest calculation (Property 15)
  - **Property 15: Interest calculation**
  - **Validates: Requirements 5.2**
- [ ] 15.12 **VERIFY**: All tests pass

**CHECKPOINT 4**: Upgrade & Economy systems complete.

---

## Phase 5: Run System (Tasks 16-19)

### Task 16: Implement Run types
**Estimate**: 30 min

- [ ] 16.1 Create `run/run.types.ts`
- [ ] 16.2 Define RunConfig interface
- [ ] 16.3 Define Run interface (generic TState)
- [ ] 16.4 Define RunPhase type
- [ ] 16.5 Define RunStatus type
- [ ] 16.6 Define RunEvent interface
- [ ] 16.7 **VERIFY**: Types compile

### Task 17: Implement Run operations
**Estimate**: 60 min

- [ ] 17.1 Create `run/run.ts`
- [ ] 17.2 Implement `createRun()`
- [ ] 17.3 Implement `recordWin()` with streak tracking
- [ ] 17.4 Implement `recordLoss()` with streak tracking
- [ ] 17.5 Implement `advancePhase()`
- [ ] 17.6 Implement `getCurrentPhase()`
- [ ] 17.7 Implement `isRunComplete()`
- [ ] 17.8 Implement `getRunResult()`
- [ ] 17.9 Implement `getRunStats()`
- [ ] 17.10 Add JSDoc to all functions
- [ ] 17.11 **VERIFY**: `npm test -- --testPathPattern=run`

### Task 18: Create Run presets
**Estimate**: 30 min

- [ ] 18.1 Create `run/run.presets.ts`
- [ ] 18.2 Define ROGUELIKE_RUN_CONFIG (9 wins, 4 losses)
- [ ] 18.3 Define BOSS_RUSH_RUN_CONFIG (5 wins, 1 loss)
- [ ] 18.4 Define ENDLESS_RUN_CONFIG (infinite wins)
- [ ] 18.5 **VERIFY**: Presets export correctly

### Task 19: Run unit tests
**Estimate**: 45 min

- [ ] 19.1 Create `run/run.spec.ts`
- [ ] 19.2 Test createRun initialization
- [ ] 19.3 Test recordWin/recordLoss streak tracking
- [ ] 19.4 Test run completion conditions
- [ ] 19.5 Test phase advancement cycling
- [ ] 19.6 Test getRunStats calculations
- [ ] 19.7 Test history recording
- [ ] 19.8 Write property test for win completion (Property 16)
  - **Property 16: Win completion**
  - **Validates: Requirements 6.2**
- [ ] 19.9 Write property test for loss elimination (Property 17)
  - **Property 17: Loss elimination**
  - **Validates: Requirements 6.2**
- [ ] 19.10 Write property test for streak tracking (Property 18)
  - **Property 18: Streak tracking**
  - **Validates: Requirements 6.2**
- [ ] 19.11 Write property test for phase cycling (Property 19)
  - **Property 19: Phase cycling**
  - **Validates: Requirements 6.2**
- [ ] 19.12 **VERIFY**: All tests pass

**CHECKPOINT 5**: Run system complete.

---

## Phase 6: Snapshot & Matchmaking (Tasks 20-22)

### Task 20: Implement Snapshot types
**Estimate**: 30 min

- [ ] 20.1 Create `snapshot/snapshot.types.ts`
- [ ] 20.2 Define SnapshotConfig interface
- [ ] 20.3 Define Snapshot interface (generic TState)
- [ ] 20.4 Define MatchmakingConfig interface
- [ ] 20.5 **VERIFY**: Types compile

### Task 21: Implement Snapshot operations
**Estimate**: 60 min

- [ ] 21.1 Create `snapshot/snapshot.ts`
- [ ] 21.2 Implement `createSnapshot()`
- [ ] 21.3 Implement `isSnapshotExpired()`
- [ ] 21.4 Implement `filterExpiredSnapshots()`
- [ ] 21.5 Implement `enforceSnapshotLimits()` with per-player and total limits
- [ ] 21.6 Implement `applyCleanupStrategy()` (oldest, lowest-rating, random)
- [ ] 21.7 Implement `getSnapshotPoolStats()`
- [ ] 21.8 Implement `findOpponent()` with wins/rating filtering
- [ ] 21.9 Implement `generateBot()` for fallback when no snapshots
- [ ] 21.10 Implement `selectBotCards()` with difficulty-based tier weighting
- [ ] 21.11 Add JSDoc to all functions
- [ ] 21.12 **VERIFY**: `npm test -- --testPathPattern=snapshot`

### Task 22: Snapshot presets and tests
**Estimate**: 60 min

- [ ] 22.1 Create `snapshot/snapshot.presets.ts`
- [ ] 22.2 Define ROGUELIKE_SNAPSHOT_CONFIG (24h expiry, 10 per player, 10k total)
- [ ] 22.3 Define ROGUELIKE_MATCHMAKING_CONFIG
- [ ] 22.4 Define ROGUELIKE_BOT_CONFIG (difficulty scaling)
- [ ] 22.5 Create `snapshot/snapshot.spec.ts`
- [ ] 22.6 Test snapshot expiry logic
- [ ] 22.7 Test findOpponent filtering
- [ ] 22.8 Test enforceSnapshotLimits per-player limit
- [ ] 22.9 Test enforceSnapshotLimits total limit
- [ ] 22.10 Test cleanup strategies (oldest, lowest-rating, random)
- [ ] 22.11 Test generateBot difficulty scaling
- [ ] 22.12 Test bot tier distribution at different difficulties
- [ ] 22.13 Write property test for snapshot expiry (Property 21)
  - **Property 21: Snapshot expiry**
  - **Validates: Requirements 7.1**
- [ ] 22.14 Write property test for matchmaking wins filter (Property 22)
  - **Property 22: Matchmaking wins filter**
  - **Validates: Requirements 7.5**
- [ ] 22.15 Write property test for matchmaking rating filter (Property 23)
  - **Property 23: Matchmaking rating filter**
  - **Validates: Requirements 7.5**
- [ ] 22.16 Write property test for per-player limit (Property 24)
  - **Property 24: Per-player snapshot limit**
  - **Validates: Requirements 7.3**
- [ ] 22.17 Write property test for total limit (Property 25)
  - **Property 25: Total snapshot limit**
  - **Validates: Requirements 7.3**
- [ ] 22.18 **VERIFY**: All tests pass

**CHECKPOINT 6**: Snapshot & Matchmaking complete.

---

## Phase 7: Integration & Documentation (Tasks 23-25)

### Task 23: Create public API exports
**Estimate**: 30 min

- [x] 23.1 Create `progression/index.ts`
- [x] 23.2 Export all types
- [x] 23.3 Export all functions
- [x] 23.4 Export all presets
- [x] 23.5 Update `core/index.ts` to include progression
- [x] 23.6 **VERIFY**: All exports accessible

### Task 24: Integration tests
**Estimate**: 60 min

- [x] 24.1 Create `progression/integration.spec.ts`
- [x] 24.2 Test full roguelike flow: deck → draft → hand → battle → shop
- [x] 24.3 Test economy integration with upgrades
- [x] 24.4 Test run progression with win/loss tracking
- [x] 24.5 Test snapshot creation and matchmaking
- [x] 24.6 Test determinism (same seed = same results)
- [x] 24.7 **VERIFY**: All integration tests pass

### Task 25: Documentation
**Estimate**: 45 min

- [x] 25.1 Create `progression/README.md`
- [x] 25.2 Document all systems with examples
- [x] 25.3 Document presets and when to use them
- [x] 25.4 Add usage examples for different game types
- [x] 25.5 Update `docs/CORE_LIBRARY.md`
- [x] 25.6 Update `.kiro/steering/project-context.md`
- [x] 25.7 **VERIFY**: Documentation complete

**CHECKPOINT 7**: All systems complete and documented.

---

## Summary

| Phase | Tasks | Time | Content |
|-------|-------|------|---------|
| Phase 1: Foundation | 1-3 | ~3h | Types, structure, test setup |
| Phase 2: Deck & Hand | 4-7 | ~4h | Deck operations, hand management |
| Phase 3: Draft | 8-11 | ~4h | Draft system, presets |
| Phase 4: Upgrade & Economy | 12-15 | ~4h | Tier upgrades, currency |
| Phase 5: Run | 16-19 | ~4h | Run progression, phases |
| Phase 6: Snapshot | 20-22 | ~3h | Snapshots, matchmaking |
| Phase 7: Integration | 23-25 | ~3h | API, tests, docs |
| **Total** | **25 tasks** | **~25h** | |

---

## Checkpoints Summary

| # | After Task | Verification |
|---|------------|--------------|
| 1 | 3 | Foundation complete |
| 2 | 7 | Deck & Hand systems complete |
| 3 | 11 | Draft system complete |
| 4 | 15 | Upgrade & Economy systems complete |
| 5 | 19 | Run system complete |
| 6 | 22 | Snapshot & Matchmaking complete |
| 7 | 25 | All systems complete and documented |

---

## Dependencies

```
Phase 1 (Foundation)
    │
    ▼
Phase 2 (Deck & Hand)
    │
    ▼
Phase 3 (Draft) ←── uses Deck
    │
    ▼
Phase 4 (Upgrade & Economy)
    │
    ▼
Phase 5 (Run) ←── uses all above
    │
    ▼
Phase 6 (Snapshot) ←── uses Run
    │
    ▼
Phase 7 (Integration)
```

---

## Relationship to Other Specs

| Spec | Relationship |
|------|--------------|
| `core-extraction` (1.0) | Uses SeededRandom |
| `core-mechanics-2.0` | Independent (no dependency) |
| `roguelike-run` | Consumer — uses these systems |

---

## Notes

- All functions are pure and immutable
- All randomness uses seeded PRNG for determinism
- Generic types allow use with any card type
- Presets provide ready-to-use configurations
- No game-specific code in core
