# Tasks: Simulator Refactor

## Overview

| Phase | Description | Tasks | Est. Hours |
|-------|-------------|-------|------------|
| 1 | Repository Setup | 1-3 | 4h |
| 2 | Core Types & Utilities | 4-8 | 8h |
| 3 | Simulator Core | 9-16 | 12h |
| 4 | Mechanics Integration | 17-24 | 12h |
| 5 | API Layer | 25-30 | 8h |
| 6 | Database & Persistence | 31-35 | 6h |
| 7 | Testing | 36-42 | 10h |
| 8 | Migration & Cleanup | 43-47 | 6h |
| **Total** | | **47 tasks** | **~66h** |

---

## Phase 1: Repository Setup

- [-] 1. Create new repository








  - [x] 1.1 Create new GitHub repository (fantasy-roguelike or similar)


  - [x] 1.2 Initialize with NestJS project structure


  - [x] 1.3 Configure TypeScript, ESLint, Prettier


  - [x] 1.4 Set up Jest for testing


  - [x] 1.5 Create initial folder structure (src/core, src/simulator, src/roguelike, src/api)









  - _Requirements: 5.1, 5.2_

- [x] 2. Copy core modules from old repository





  - [x] 2.1 Copy `backend/src/core/grid/` (grid utilities, pathfinding)



  - [x] 2.2    т 1Copy `backend/src/core/battle/` (damage, turn-order, targeting)


  - [x] 2.3 Copy `backend/src/core/mechanics/` (all tier0-tier4 processors)


  - [x] 2.4 Copy `backend/src/core/progression/` (deck, draft, run, snapshot)



  - [x] 2.5 Copy `backend/src/core/utils/` (seeded random)
  - [x] 2.6 Verify all copied modules compile without errors

  - _Requirements: 5.2, 5.3_

- [x] 3. Copy game content
  - [x] 3.1 Copy `backend/src/game/units/` (unit definitions)
  - [x] 3.2 Copy `backend/src/game/abilities/` (ability data)
  - [x] 3.3 Create `src/game/factions/` with faction definitions
  - [x] 3.4 Update imports to use new paths
  - _Requirements: 5.2_

- [x] 3.5 Checkpoint - Phase 1 Complete
  - Ensure TypeScript compiles without errors
  - Ensure all copied modules have correct imports
  - Ask user if questions arise

---

## Phase 2: Core Types & Utilities

- [x] 4. Create unified BattleUnit type





  - [x] 4.1 Create `src/core/types/battle-unit.ts`


  - [x] 4.2 Define BattleUnit interface with all Core 2.0 properties

  - [x] 4.3 Add JSDoc documentation for each property

  - [x] 4.4 Export from `src/core/types/index.ts`


  - _Requirements: 1.1, 1.6, 9.1, 9.3_

- [x] 4.5 Write property test: BattleUnit facing is always valid (N, S, E, W)






  - **Property 5: Facing Validity**
  - **Validates: Requirements 6.4**

- [x] 5. Create BattleState type











  - [x] 5.1 Create `src/core/types/battle-state.ts`





  - [x] 5.2 Define immutable BattleState interface











  - [x] 5.3 Define PhaseContext interface



  - [ ] 5.4 Define Phase type union








  - [x] 5.5 Add JSDoc documentation




  - _Requirements: 1.6, 3.1, 9.1_



- [x] 6. Create BattleEvent types



  - [x] 6.1 Create `src/core/types/events.ts`



  - [x] 6.2 Define base BattleEvent interface


  - [x] 6.3 Define all mechanic-specific event types


  - [x] 6.4 Create event factory functions

  - _Requirements: 2.7, 9.1_

- [x] 7. Create state update helpers



  - [x] 7.1 Create `src/core/utils/state-helpers.ts`





  - [x] 7.2 Implement `updateUnit()` for immutable unit updates
  - [x] 7.3 Implement `updateUnits()` for batch updates


  - [x] 7.4 Implement `findUnit()` helper
  - [x] 7.5 Add unit tests for helpers



  - _Requirements: 3.1, 3.2_

- [x] 7.6 Write property test: state updates are immutable






  - **Property 7: Immutable State Updates**
  - **Validates: Requirements 3.1**

- [x] 8. Create logging utilities





  - [x] 8.1 Create `src/core/utils/logger.ts`






  - [x] 8.2 Implement structured JSON logging
  - [x] 8.3 Add log levels (debug, info, warn, error)
  - [x] 8.4 Add battle context to all logs (battleId, round, turn, phase)
  - [x] 8.5 Configure production mode filtering
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 8.6 Create error handling utilities


  - [x] 8.6.1 Define custom error types (BattleError, ValidationError, MechanicError)






  - [x] 8.6.2 Implement error boundary for simulator
  - [x] 8.6.3 Add error recovery strategies
  - [x] 8.6.4 Create error logging with full context

  - _Requirements: 10.1_

- [x] 8.7 Checkpoint - Phase 2 Complete


  - Ensure all types compile without errors
  - Ensure all unit tests pass
  - Ask user if questions arise

---

## Phase 3: Simulator Core

- [x] 9. Create main simulator function



  - [x] 9.1 Create `src/simulator/simulator.ts`







  - [x] 9.2 Implement `simulateBattle()` function signature
  - [x] 9.3 Implement battle initialization (create units, set positions)
  - [x] 9.4 Implement main simulation loop
  - [x] 9.5 Implement battle end detection
  - [x] 9.6 Keep under 200 lines

  - _Requirements: 1.2, 4.1, 4.4_

- [x] 9.7 Write property test: battle always terminates






  - **Property 6: Battle Termination**
  - **Validates: Requirements 6.5**

- [x] 10. Implement turn execution






  - [x] 10.1 Create `src/simulator/turn.ts`


  - [x] 10.2 Implement `executeTurn()` function


  - [x] 10.3 Call phase handlers in correct order


  - [x] 10.4 Collect and return events from all phases


  - [x] 10.5 Handle unit death during turn

  - _Requirements: 2.2, 2.6_

- [x] 10.6 Write property test: phase order is correct






  - **Property 1: Phase Order Invariant**
  - **Validates: Requirements 1.3, 2.2**

- [x] 11. Implement turn_start phase handler


  - [x] 11.1 Create `src/simulator/phases/turn-start.ts`
  - [x] 11.2 Implement resolve regeneration
  - [x] 11.3 Implement riposte charge reset
  - [x] 11.4 Implement routing/rally check
  - [x] 11.5 Implement aura pulse effects
  - _Requirements: 2.3_

- [x] 11.6 Write property test: riposte charges reset at turn start






  - **Property 9: Riposte Charge Reset**
  - **Validates: Requirements 2.3, 3.4**

- [x] 12. Implement movement phase handler




  - [x] 12.1 Create `src/simulator/phases/movement.ts`
  - [x] 12.2 Implement pathfinding to target




  - [x] 12.3 Implement intercept checks (hard and soft)
  - [x] 12.4 Implement engagement updates
  - [x] 12.5 Implement charge momentum calculation
  - _Requirements: 2.4_

- [x] 13. Implement attack phase handler






  - [x] 13.1 Create `src/simulator/phases/attack.ts`







  - [x] 13.2 Implement facing rotation toward target






  - [x] 13.3 Implement flanking arc calculation
  - [x] 13.4 Implement damage calculation with modifiers
  - [x] 13.5 Implement dodge roll
  - [x] 13.6 Implement riposte trigger
  - [x] 13.7 Implement ammunition consumption
  - _Requirements: 2.5_

- [x] 13.8 Write property test: facing rotates toward target on attack
  - **Property 10: Facing Rotation on Attack**
  - **Validates: Requirements 2.5**

- [x] 14. Implement turn_end phase handler
  - [x] 14.1 Create `src/simulator/phases/turn-end.ts`
  - [x] 14.2 Implement contagion spread
  - [x] 14.3 Implement armor shred decay
  - [x] 14.4 Implement cooldown ticks

  - _Requirements: 2.2_

- [x] 15. Implement AI decision making
  - [x] 15.1 Create `src/simulator/ai/decision.ts`
  - [x] 15.2 Implement target selection by role (Tank, Melee DPS, Ranged DPS, Support - see design.md)
  - [x] 15.3 Implement action selection (attack/move/ability)
  - [x] 15.4 Implement routing behavior (retreat movement toward deployment edge)
  - [x] 15.5 Ensure deterministic decisions with seeded random (same seed = same decision)

  - _Requirements: 2.2_

- [x] 16. Implement death handling





  - [x] 16.1 Create `src/simulator/death.ts`



  - [x] 16.2 Implement unit death marking

  - [x] 16.3 Implement resolve damage to nearby allies
  - [x] 16.4 Implement phalanx recalculation on death

  - [x] 16.5 Remove dead units from turn queue

  - _Requirements: 3.3_

- [x] 16.6 Write property test: dead units never act






  - **Property 2: Dead Units Never Act**
  - **Validates: Requirements 3.3, 6.1**

- [x] 16.7 Checkpoint - Phase 3 Complete


  - Ensure all tests pass
  - Ensure simulator main file is under 200 lines
  - Ask user if questions arise

---

## Phase 4: Mechanics Integration

- [x] 17. Integrate Facing processor





  - [x] 17.1 Import FacingProcessor from core/mechanics



  - [x] 17.2 Call `faceTarget()` in pre_attack phase


  - [x] 17.3 Emit `facing_rotated` events


  - [x] 17.4 Verify facing updates persist in state

  - _Requirements: 1.3_

- [x] 18. Integrate Flanking processor









  - [x] 18.1 Import FlankingProcessor from core/mechanics


  - [x] 18.2 Call `getAttackArc()` after facing rotation


  - [x] 18.3 Call `getDamageModifier()` for damage calculation


  - [x] 18.4 Emit `flanking_applied` events

  - _Requirements: 1.4_

- [x] 19. Integrate Riposte processor

  - [x] 19.1 Import RiposteProcessor from core/mechanics

  - [x] 19.2 Call `canRiposte()` after attack damage

  - [x] 19.3 Call `getRiposteChance()` and roll

  - [x] 19.4 Call `executeRiposte()` on success
  - [x] 19.5 Emit `riposte_triggered` events

  - _Requirements: 1.4_

- [x] 20. Integrate Ammunition processor





  - [x] 20.1 Import AmmunitionProcessor from core/mechanics



  - [x] 20.2 Call `canAttack()` before attack




  - [x] 20.3 Implement melee fallback when ammo = 0
  - [x] 20.4 Call `consume()` after attack
  - [x] 20.5 Emit `ammo_consumed` events
  - _Requirements: 1.5_

- [x] 20.6 Write property test: ammunition never goes negative











  - **Property 4: Ammunition Non-Negative**
  - **Validates: Requirements 6.3**

- [x] 21. Integrate Charge processor
  - [x] 21.1 Import ChargeProcessor from core/mechanics
  - [x] 21.2 Call `calculateMomentum()` during movement
  - [x] 21.3 Call `getChargeBonus()` for damage calculation
  - [x] 21.4 Call `isCounteredBySpearWall()` check
  - [x] 21.5 Emit `charge_impact` events
  - _Requirements: 1.6_

- [x] 22. Integrate Resolve processor





  - [x] 22.1 Import ResolveProcessor from core/mechanics



  - [x] 22.2 Call `regenerate()` at turn_start


  - [x] 22.3 Call `applyAllyDeathDamage()` on unit death


  - [x] 22.4 Call `checkRoutingStatus()` and handle routing


  - [x] 22.5 Emit `resolve_changed`, `routing_started`, `unit_rallied` events

  - _Requirements: 2.3_

- [-] 23. Integrate remaining Tier 2-4 processors








  - [x] 23.1 Integrate Engagement processor (ZoC, AoO)


  - [x] 23.2 Integrate Intercept processor (hard/soft)



  - [x] 23.3 Integrate Phalanx processor (formation bonuses)


















  - [x] 23.4 Integrate Contagion processor (status spread)





  - [x] 23.5 Integrate ArmorShred processor (shred/decay)
  - [x] 23.6 Integrate LoS processor (ranged blocking)





  - [x] 23.7 Integrate Overwatch processor (vigilance)





  - _Requirements: 1.2_



- [-] 24. Verify all mechanics work together

  - [x] 24.1 Create integration test with all mechanics enabled



  - [x] 24.2 Test complex scenario: charge → intercept → riposte

  - [x] 24.3 Test phalanx + contagion interaction

  - [x] 24.4 Test routing + rally cycle

  - [x] 24.5 Verify event sequence is correct






  - _Requirements: 1.2, 1.3_

- [x] 24.6 Checkpoint - Phase 4 Complete





  - Ensure all mechanics integration tests pass
  - Ensure all property tests pass
  - Ask user if questions arise

---

## Phase 5: API Layer

- [ ] 25. Create Run controller and service
  - [ ] 25.1 Create `src/api/run/run.controller.ts`
  - [ ] 25.2 Create `src/api/run/run.service.ts`
  - [ ] 25.3 Implement POST /api/run/start
  - [ ] 25.4 Implement GET /api/run/:runId
  - [ ] 25.5 Implement POST /api/run/:runId/abandon
  - [ ] 25.6 Add JSDoc and validation
  - _Requirements: 7.1, 7.4, 9.1_

- [ ] 26. Create Battle controller and service
  - [ ] 26.1 Create `src/api/battle/battle.controller.ts`
  - [ ] 26.2 Create `src/api/battle/battle.service.ts`
  - [ ] 26.3 Implement POST /api/battle/start
  - [ ] 26.4 Implement POST /api/battle/:battleId/simulate
  - [ ] 26.5 Implement GET /api/battle/:battleId/replay
  - [ ] 26.6 Return Core 2.0 mechanic events in response
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 27. Create Draft controller and service
  - [ ] 27.1 Create `src/api/draft/draft.controller.ts`
  - [ ] 27.2 Create `src/api/draft/draft.service.ts`
  - [ ] 27.3 Implement GET /api/draft/:runId/options
  - [ ] 27.4 Implement POST /api/draft/:runId/pick
  - [ ] 27.5 Implement POST /api/draft/:runId/reroll
  - _Requirements: 7.1_

- [ ] 28. Create Upgrade controller and service
  - [ ] 28.1 Create `src/api/upgrade/upgrade.controller.ts`
  - [ ] 28.2 Create `src/api/upgrade/upgrade.service.ts`
  - [ ] 28.3 Implement GET /api/upgrade/:runId/available
  - [ ] 28.4 Implement POST /api/upgrade/:runId/upgrade
  - _Requirements: 7.1_

- [ ] 29. Implement matchmaking service
  - [ ] 29.1 Create `src/roguelike/matchmaking/matchmaking.service.ts`
  - [ ] 29.2 Implement snapshot-based opponent finding
  - [ ] 29.3 Implement bot team generation fallback
  - [ ] 29.4 Scale bot difficulty by run progress
  - _Requirements: 5.4, 8.1, 8.2_

- [ ]* 29.5 Write property test: matchmaking always returns opponent
  - **Property 12: Matchmaking Always Returns Opponent**
  - **Validates: Requirements 5.4, 8.1**

- [ ] 30. Implement bot team generator
  - [ ] 30.1 Create `src/roguelike/bot/bot-generator.ts`
  - [ ] 30.2 Implement budget-constrained team generation
  - [ ] 30.3 Implement difficulty scaling
  - [ ] 30.4 Ensure valid unit compositions
  - _Requirements: 8.2, 8.3, 8.4_

- [ ]* 30.5 Write property test: bot team respects budget
  - **Property 11: Bot Team Budget Constraint**
  - **Validates: Requirements 8.3**

- [ ] 30.6 Checkpoint - Phase 5 Complete
  - Ensure all API endpoints work
  - Ensure all tests pass
  - Ask user if questions arise

---

## Phase 6: Database & Persistence

- [ ] 31. Create database entities
  - [ ] 31.1 Create `src/entities/run.entity.ts`
  - [ ] 31.2 Create `src/entities/run-deck.entity.ts`
  - [ ] 31.3 Create `src/entities/battle.entity.ts`
  - [ ] 31.4 Create `src/entities/snapshot.entity.ts`
  - [ ] 31.5 Create `src/entities/bot-team.entity.ts`
  - _Requirements: 7.1_

- [ ] 32. Create database migrations
  - [ ] 32.1 Create migration for runs table
  - [ ] 32.2 Create migration for run_deck table
  - [ ] 32.3 Create migration for battles table
  - [ ] 32.4 Create migration for snapshots table
  - [ ] 32.5 Create migration for bot_teams table
  - [ ] 32.6 Add indexes for performance
  - _Requirements: 7.1_

- [ ] 33. Create repositories
  - [ ] 33.1 Create `src/repositories/run.repository.ts`
  - [ ] 33.2 Create `src/repositories/battle.repository.ts`
  - [ ] 33.3 Create `src/repositories/snapshot.repository.ts`
  - [ ] 33.4 Add query methods for matchmaking
  - _Requirements: 7.1_

- [ ] 34. Implement snapshot creation
  - [ ] 34.1 Create snapshot after each battle win
  - [ ] 34.2 Store team composition and positions
  - [ ] 34.3 Index by stage for efficient matchmaking
  - _Requirements: 5.4_

- [ ] 35. Seed bot teams
  - [ ] 35.1 Create seed script for bot teams
  - [ ] 35.2 Generate teams for stages 1-9
  - [ ] 35.3 Generate teams for difficulties 1-10
  - [ ] 35.4 Ensure variety in compositions (minimum 5 unique compositions per stage)
  - [ ] 35.5 Validate all bot teams respect budget constraints
  - _Requirements: 8.1_

- [ ] 35.6 Checkpoint - Phase 6 Complete
  - Ensure database migrations run successfully
  - Ensure all repository tests pass
  - Ask user if questions arise

---

## Phase 7: Testing

- [ ] 36. Create test fixtures
  - [ ] 36.1 Create `src/__tests__/fixtures/units.ts`
  - [ ] 36.2 Create `src/__tests__/fixtures/teams.ts`
  - [ ] 36.3 Create `src/__tests__/fixtures/states.ts`
  - [ ] 36.4 Create helper functions for test setup
  - _Requirements: 2.4_

- [ ] 37. Create property test generators
  - [ ] 37.1 Install fast-check library
  - [ ] 37.2 Create `src/__tests__/generators/unit.generator.ts`
  - [ ] 37.3 Create `src/__tests__/generators/state.generator.ts`
  - [ ] 37.4 Create `src/__tests__/generators/team.generator.ts`
  - _Requirements: 6.1-6.5_

- [ ] 38. Write simulator unit tests
  - [ ] 38.1 Test battle initialization
  - [ ] 38.2 Test turn execution flow
  - [ ] 38.3 Test battle end detection
  - [ ] 38.4 Test determinism (same seed = same result)
  - _Requirements: 2.2_

- [ ] 39. Write phase handler unit tests
  - [ ] 39.1 Test turn_start phase
  - [ ] 39.2 Test movement phase
  - [ ] 39.3 Test attack phase
  - [ ] 39.4 Test turn_end phase
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 40. Write mechanics integration tests
  - [ ] 40.1 Test facing + flanking integration
  - [ ] 40.2 Test riposte trigger conditions
  - [ ] 40.3 Test ammunition depletion and melee fallback
  - [ ] 40.4 Test charge + intercept interaction
  - [ ] 40.5 Test resolve + routing cycle
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 41. Write API integration tests
  - [ ] 41.1 Test run lifecycle (start → battle → draft → upgrade)
  - [ ] 41.2 Test battle simulation endpoint
  - [ ] 41.3 Test matchmaking with snapshots
  - [ ] 41.4 Test matchmaking with bot fallback
  - _Requirements: 7.1, 7.2_

- [ ] 42. Run all property tests
  - [ ] 42.1 Run Property 1: Phase Order Invariant
  - [ ] 42.2 Run Property 2: Dead Units Never Act
  - [ ] 42.3 Run Property 3: HP Bounds
  - [ ] 42.4 Run Property 4: Ammunition Non-Negative
  - [ ] 42.5 Run Property 5: Facing Validity
  - [ ] 42.6 Run Property 6: Battle Termination
  - [ ] 42.7 Run Property 7: Immutable State Updates
  - [ ] 42.8 Run Property 8: Mechanic Property Preservation
  - [ ] 42.9 Run Property 9: Riposte Charge Reset
  - [ ] 42.10 Run Property 10: Facing Rotation on Attack
  - [ ] 42.11 Run Property 11: Bot Team Budget Constraint
  - [ ] 42.12 Run Property 12: Matchmaking Always Returns Opponent
  - _Requirements: 6.1-6.5_

- [ ]* 42.13 Write property test: HP never exceeds maxHp
  - **Property 3: HP Bounds**
  - **Validates: Requirements 6.2**

- [ ]* 42.14 Write property test: mechanic properties preserved after damage
  - **Property 8: Mechanic Property Preservation**
  - **Validates: Requirements 3.2**

---

## Phase 8: Migration & Cleanup

- [ ] 43. Document API
  - [ ] 43.1 Create OpenAPI/Swagger documentation
  - [ ] 43.2 Add request/response examples
  - [ ] 43.3 Document error codes
  - _Requirements: 7.4_

- [ ] 44. Create README
  - [ ] 44.1 Write project overview
  - [ ] 44.2 Document setup instructions
  - [ ] 44.3 Document API endpoints
  - [ ] 44.4 Add architecture diagram
  - _Requirements: 9.1_

- [ ] 45. Final verification
  - [ ] 45.1 Run full test suite
  - [ ] 45.2 Verify all property tests pass
  - [ ] 45.3 Verify TypeScript compilation
  - [ ] 45.4 Verify no circular dependencies
  - [ ] 45.5 Check simulator is under 500 lines
  - _Requirements: 4.1_

- [ ] 46. Archive old repository
  - [ ] 46.1 Tag old repository as legacy
  - [ ] 46.2 Update old README with deprecation notice
  - [ ] 46.3 Link to new repository
  - _Requirements: 5.3_

- [ ] 47. Create rollback procedure
  - [ ] 47.1 Document how to revert to old repository
  - [ ] 47.2 Keep old repo functional for 30 days
  - [ ] 47.3 Create feature flag for gradual migration (if needed)
  - [ ] 47.4 Document known differences between old and new simulators
  - _Requirements: 5.3_

---

## Dependencies

```
Phase 1 (Repository Setup)
    │
    ▼
Phase 2 (Core Types) ──────────────────┐
    │                                   │
    ▼                                   │
Phase 3 (Simulator Core) ──────────────┤
    │                                   │
    ▼                                   │
Phase 4 (Mechanics Integration) ───────┤
    │                                   │
    ▼                                   ▼
Phase 5 (API Layer) ◄──────────────────┘
    │
    ▼
Phase 6 (Database)
    │
    ▼
Phase 7 (Testing)
    │
    ▼
Phase 8 (Migration)
```

---

## Success Criteria

- [ ] All 47 tasks completed
- [ ] All 12 property tests passing
- [ ] Simulator main file under 500 lines
- [ ] All Core 2.0 mechanics working correctly
- [ ] API endpoints documented and tested
- [ ] New repository clean and organized
- [ ] Old repository archived with deprecation notice
- [ ] Rollback procedure documented
