# Implementation Plan

## 1. Create Unit Mapper Module

- [x] 1.1 Create `backend/src/roguelike/battle/unit-mapper.ts` with `mapRoguelikeUnitToTemplate()` function
  - Convert RoguelikeUnit to UnitTemplate format
  - Apply tier-based stat multipliers (T1: ×1.0, T2: ×1.5, T3: ×2.0)
  - Map roguelike role to legacy role format
  - Include abilities for T3 units
  - _Requirements: 1.2, 5.3, 5.4_

- [ ]* 1.2 Write property test for unit mapping
  - **Property 2: Unit mapping applies tier modifiers correctly**
  - **Validates: Requirements 1.2, 5.3**

- [x] 1.3 Create `mapToTeamSetup()` function
  - Convert array of PlacedUnit to TeamSetup format
  - Accept `team: 'player' | 'opponent'` parameter
  - Map positions: player stays at y: 0-1, opponent maps to y: 8-9
  - Example: opponent unit at (3, 1) → (3, 9) on battle grid
  - _Requirements: 5.1, 5.2_

- [ ]* 1.4 Write property test for team setup generation
  - **Property 7: Opponent team generation produces valid battle format**
  - **Validates: Requirements 5.1, 5.2, 5.4**

## 2. Create RoguelikeBattleService

- [x] 2.1 Create `backend/src/roguelike/battle/battle.service.ts`
  - Inject BattleLog repository and RunService
  - Add logger with context
  - _Requirements: 2.1_

- [x] 2.2 Implement `generateBattleSeed()` method
  - Generate deterministic seed from runId + battleNumber
  - Log seed for debugging
  - _Requirements: 1.3_

- [ ]* 2.3 Write property test for seed determinism
  - **Property 3: Battle simulation is deterministic**
  - **Validates: Requirements 1.3**

- [x] 2.4 Implement `simulateAndSaveBattle()` method
  - Convert player and opponent teams to TeamSetup
  - Call `simulateBattle()` from battle.simulator.ts
  - Handle empty team edge cases (auto-win/loss)
  - Log warning with opponent type (bot/snapshot) when opponent team is empty
  - _Requirements: 1.1, 1.4, 7.1, 7.2, 7.3_

- [ ]* 2.5 Write property test for battle result matching
  - **Property 1: Battle result matches simulation output**
  - **Validates: Requirements 1.1, 1.4**

- [x] 2.6 Implement `saveBattleLogWithRetry()` method
  - Save BattleLog to database with 2 retry attempts
  - Return { saved: boolean, id?: string }
  - _Requirements: 2.1, 4.3_

- [ ]* 2.7 Write unit tests for save retry logic
  - Test successful save
  - Test retry on failure
  - Test max retries exceeded
  - _Requirements: 4.3_

## 3. Checkpoint - Ensure all tests pass
- [x] Ensure all tests pass, ask the user if questions arise.

## 4. Update BattleResultDto

- [x] 4.1 Add `replayAvailable` field to `BattleResultDto`
  - Boolean field indicating if replay is available
  - Update Swagger documentation
  - _Requirements: 4.2_

- [ ]* 4.2 Write property test for API response format
  - **Property 6: API response contains valid battle ID and replay flag**
  - **Validates: Requirements 4.1, 4.2**

## 5. Update BattleController

- [x] 5.1 Inject RoguelikeBattleService into BattleController
  - Add constructor dependency
  - _Requirements: 1.1_

- [x] 5.2 Replace mock battle logic with real simulation
  - Call `roguelikeBattleService.simulateAndSaveBattle()`
  - Return actual battleId and replayAvailable flag
  - _Requirements: 1.1, 4.1_

- [x] 5.3 Update battle history entry structure
  - Store `{ battleId, result, round }` in run.battleHistory
  - _Requirements: 6.1_

- [ ]* 5.4 Write property test for battle history structure
  - **Property 5: Battle history entry has correct structure**
  - **Validates: Requirements 2.4, 6.1**

## 6. Checkpoint - Ensure all tests pass
- [x] Ensure all tests pass, ask the user if questions arise.

## 7. Update Run Entity

- [x] 7.1 Update `BattleHistoryEntry` interface
  - Add `round` field (number)
  - Ensure `battleId` is string (UUID)
  - _Requirements: 6.1_

## 8. Save BattleLog (Reuse Existing Entity)

- [x] 8.1 Use existing `BattleLog` entity from `backend/src/entities/battle-log.entity.ts`
  - Do NOT create new entity — reuse existing one
  - Set player1Id = run.playerId
  - Set player2Id = opponent.playerId (or generate UUID for bot)
  - Set player1TeamSnapshot and player2TeamSnapshot from converted TeamSetup
  - Set events from simulation result
  - Set winner, rounds, seed
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8.2 Verified BattleLog saves correctly with bot opponents
  - Battle logs are saved with random UUID for bot player2Id
  - No foreign key constraint on player2Id (only on player1Id)
  - replayAvailable returns true when save succeeds
  - _Requirements: 2.1, 2.2, 2.3_

## 9. Frontend: Add Watch Replay Button

- [x] 9.1 Update battle result display in `frontend/src/app/run/[id]/battle/page.tsx`
  - Add "Смотреть реплей" button when `replayAvailable` is true
  - Navigate to `/battle/${battleId}` on click
  - _Requirements: 3.1, 3.2_

- [ ] 9.2 Update runStore to store battleId from API response
  - Add `lastBattleId` field to store
  - Update after battle submission
  - _Requirements: 4.1_

## 10. Frontend: Battle History Display

- [ ] 10.1 Add battle history section to run details page
  - Display list of past battles with results and round numbers
  - Add click handler to navigate to replay
  - _Requirements: 6.2, 6.3_

## 11. Checkpoint - Ensure all tests pass
- [x] Ensure all tests pass, ask the user if questions arise.

## 12. Add Roguelike T3 Abilities (Optional)

- [ ]* 12.1 Add new T3 abilities to `game/abilities/ability.data.ts`
  - divine_shield, cleave, whirlwind, zealous_strike, headshot, mass_heal
  - Follow existing ability structure
  - _Requirements: 5.4_

- [ ]* 12.2 Extend UNIT_ABILITY_MAP with roguelike unit mappings
  - Map roguelike T3 unit IDs to ability IDs
  - _Requirements: 5.4_

## 13. Integration Testing

- [x]* 13.1 Write integration test for full battle flow
  - Create run → Place units → Submit battle → Verify result
  - Check BattleLog saved correctly
  - Check battle history updated
  - _Requirements: 1.1, 2.1, 6.1_

- [ ]* 13.2 Write E2E test for replay navigation
  - Submit battle → Click "Watch Replay" → Verify replay page loads
  - _Requirements: 3.2, 3.3_

## 14. Final Checkpoint - Ensure all tests pass
- [x] Battle replay integration verified working
  - API returns `replayAvailable: true` when battle log saves successfully
  - Battle logs are saved to database with correct data
  - Replay endpoint returns full battle data including events
  - Frontend "Смотреть реплей" button navigates to `/battle/${battleId}`
