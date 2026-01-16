# Requirements Document

## Introduction

Рефакторинг backend для roguelike режима: объединение Core 1.0 и Core 2.0 механик, создание чистого симулятора, удаление legacy кода. Фронтенд рефакторинг будет в отдельной спецификации.

Текущий `battle.simulator.ts` содержит 2400+ строк с дублирующейся логикой и сложной конверсией состояний. LLM-агенты путаются при работе с этим кодом, а механики Core 2.0 не работают корректно.

Основная стратегия: создать новый репозиторий с чистым кодом, объединить Core 1.0 + Core 2.0, написать компактный симулятор (<500 строк).

## Glossary

- **Battle_Simulator**: Модуль, выполняющий пошаговую симуляцию боя между двумя командами
- **Core_1.0**: Базовые боевые механики (damage calculation, turn-order, targeting, grid, A* pathfinding)
- **Core_2.0**: Продвинутые боевые механики (facing, resolve, riposte, ammunition, charge, phalanx, contagion, armor shred)
- **Unified_Core**: Объединённая библиотека Core 1.0 + Core 2.0 с единым API
- **MechanicsProcessor**: Процессор для применения всех механик в фазах боя
- **BattleState**: Состояние боя, включающее юнитов, раунд и события
- **Phase_Hook**: Точка интеграции механик в цикл боя (turn_start, movement, pre_attack, attack, post_attack, turn_end)
- **Roguelike_Mode**: Единственный режим игры с прогрессией, драфтом и всеми механиками
- **Snapshot_PvP**: Асинхронный PvP через сохранённые состояния команд других игроков

## Requirements

### Requirement 1

**User Story:** As a developer, I want a unified Core library with strict API contract, so that all battle mechanics work together predictably.

#### Acceptance Criteria

1. WHEN the Core library is structured THEN the system SHALL combine Core 1.0 (damage, turn-order, targeting, grid, pathfinding) with Core 2.0 (facing, resolve, riposte, ammunition, charge, phalanx)
2. WHEN a battle is simulated THEN the system SHALL apply all mechanics through a unified MechanicsProcessor
3. WHEN phase hooks are called THEN the system SHALL follow strict order: turn_start → movement → pre_attack → attack → post_attack → turn_end
4. WHEN multiple mechanics apply to same phase THEN the system SHALL use defined priority order (facing before flanking, flanking before riposte)
5. WHEN damage is calculated THEN the system SHALL use Core 1.0 formulas with Core 2.0 modifiers (flanking, armor shred)
6. WHEN API contract is defined THEN the system SHALL export TypeScript interfaces for BattleState, BattleUnit, MechanicsProcessor, and PhaseContext

### Requirement 2

**User Story:** As a developer, I want the simulator to be modular with clear phase flow, so that each component can be verified independently.

#### Acceptance Criteria

1. WHEN the simulator module is structured THEN the system SHALL separate concerns into distinct files (turn execution, damage resolution, AI decisions)
2. WHEN a single turn is executed THEN the system SHALL follow phase order: turn_start → ai_decision → movement → pre_attack → attack → post_attack → turn_end
3. WHEN turn_start phase runs THEN the system SHALL apply resolve regeneration, reset riposte charges, check routing status
4. WHEN movement phase runs THEN the system SHALL check intercept triggers, update engagement status, calculate charge momentum
5. WHEN attack phase runs THEN the system SHALL apply facing rotation, calculate flanking bonus, trigger riposte if applicable
6. WHEN nested mechanics trigger (riposte → kill → resolve damage) THEN the system SHALL process them in stack order (LIFO)
7. WHEN mechanics are applied THEN the system SHALL emit events for each trigger (facing_rotated, riposte_triggered, ammo_consumed)
8. WHEN unit tests are written THEN the system SHALL allow testing individual phases without full battle simulation

### Requirement 3

**User Story:** As a developer, I want clear state management, so that unit properties are not lost or corrupted during battle.

#### Acceptance Criteria

1. WHEN battle state is updated THEN the system SHALL use immutable updates to prevent accidental mutations
2. WHEN a unit takes damage THEN the system SHALL preserve all mechanic-specific properties (facing, resolve, ammo, riposteCharges)
3. WHEN a unit dies THEN the system SHALL mark it as dead and exclude from future turn order
4. WHEN round ends THEN the system SHALL correctly reset per-round state (riposte charges, overwatch triggers)

### Requirement 4

**User Story:** As a developer, I want the simulator to be under 500 lines, so that LLM agents can understand and modify it without confusion.

#### Acceptance Criteria

1. WHEN the simulator is implemented THEN the system SHALL contain fewer than 500 lines of code in the main file
2. WHEN helper functions are needed THEN the system SHALL import them from dedicated modules rather than defining inline
3. WHEN type conversions are needed THEN the system SHALL use a single unified type system from Core 2.0
4. WHEN the simulator is read THEN the system SHALL have clear flow from turn start to turn end without nested conditionals exceeding 3 levels

### Requirement 5

**User Story:** As a developer, I want to create a clean roguelike-focused repository, so that legacy code does not interfere with new development.

#### Acceptance Criteria

1. WHEN the new project is created THEN the system SHALL be in a separate repository (fork or new repo)
2. WHEN the new repository is set up THEN the system SHALL contain only roguelike-relevant code from backend/src/core and backend/src/roguelike
3. WHEN legacy code is identified THEN the system SHALL exclude MVP mode, old battle.simulator.ts, and real-time PvP matchmaking queue
4. WHEN async PvP is needed THEN the system SHALL use snapshot-based matchmaking from core/progression/snapshot
5. WHEN the new repository is ready THEN the system SHALL have a clean dependency tree without unused packages

### Requirement 6

**User Story:** As a developer, I want comprehensive property-based tests for the simulator, so that correctness is verified across many inputs.

#### Acceptance Criteria

1. WHEN property tests are written THEN the system SHALL verify that dead units never act
2. WHEN property tests are written THEN the system SHALL verify that HP never exceeds maxHp
3. WHEN property tests are written THEN the system SHALL verify that ammunition never goes negative
4. WHEN property tests are written THEN the system SHALL verify that facing is always valid (N, S, E, W)
5. WHEN property tests are written THEN the system SHALL verify that battle always terminates within MAX_ROUNDS


### Requirement 7

**User Story:** As a developer, I want a clean new API designed for roguelike mode, so that the codebase is simple and focused.

#### Acceptance Criteria

1. WHEN new API is created THEN the system SHALL design endpoints specifically for roguelike flow (run, draft, battle, upgrade)
2. WHEN battle simulation endpoint is called THEN the system SHALL return Core 2.0 mechanic events in response
3. WHEN legacy API endpoints exist THEN the system SHALL remove them from the new repository
4. WHEN API documentation is written THEN the system SHALL describe all endpoints with request/response examples

### Requirement 8

**User Story:** As a player, I want to battle against bot teams when no player snapshots are available, so that I can always progress in my run.

#### Acceptance Criteria

1. WHEN no player snapshots match the current run stage THEN the system SHALL generate a bot team
2. WHEN bot team is generated THEN the system SHALL scale difficulty based on run progress (wins count)
3. WHEN bot team is created THEN the system SHALL use valid unit compositions within budget constraints
4. WHEN bot teams are used THEN the system SHALL apply all Core 2.0 mechanics identically to player battles


### Requirement 9

**User Story:** As a developer, I want comprehensive JSDoc documentation, so that code is self-documenting and IDE-friendly.

#### Acceptance Criteria

1. WHEN public functions are created THEN the system SHALL include JSDoc with @param, @returns, and @example
2. WHEN complex algorithms are implemented THEN the system SHALL include inline comments explaining the logic
3. WHEN types are defined THEN the system SHALL include JSDoc descriptions for each property
4. WHEN mechanics are applied THEN the system SHALL document the formula or rule being used


### Requirement 10

**User Story:** As a developer, I want structured logging, so that errors are easy to debug and LLM agents can parse logs.

#### Acceptance Criteria

1. WHEN errors occur THEN the system SHALL log them with context (battleId, unitId, phase, mechanic)
2. WHEN battle simulation runs THEN the system SHALL log key events at debug level (turn start, damage dealt, mechanic triggered)
3. WHEN logs are formatted THEN the system SHALL use structured JSON format for machine parsing
4. WHEN production mode is active THEN the system SHALL log only warnings and errors to reduce noise
