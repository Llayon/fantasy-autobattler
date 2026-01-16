# Requirements Document

## Introduction

Оптимизация интеграции Core 2.0 механик в battle simulator. Текущая реализация имеет критические проблемы:

**Критическая проблема:** Roguelike режим вызывает `simulateBattle` без processor в `roguelike/battle/battle.service.ts:137`, поэтому все 14 механик Core 2.0 НЕ работают в roguelike!

**Другие проблемы:**
1. Дублирование логики механик в battle.simulator.ts (~400 строк) вместо использования процессоров
2. Неполная интеграция многих механик (engagement, intercept, overwatch, phalanx, LoS, ammunition, contagion)
3. Сложный и трудночитаемый код с множеством условных проверок `if (processor?.config.resolve)`

**Стратегия оптимизации (поэтапная):**

**Фаза 1 - Quick Win (1-2 часа):**
- Добавить ROGUELIKE_PRESET в roguelike battle service
- Это сразу включит работающие механики (facing, flanking, resolve)

**Фаза 2 - Рефакторинг (4-6 часов):**
- Удалить дублирование логики из battle.simulator.ts
- Делегировать всю логику процессорам

**Фаза 3 - Полная интеграция (8-12 часов):**
- Интегрировать оставшиеся механики (engagement, intercept, overwatch, phalanx, LoS, ammunition, contagion)
- Добавить тесты

**MVP_PRESET остается** для PvP режима - это не мешает развитию, просто "все механики выключены".

## Glossary

- **MechanicsProcessor**: Центральный процессор для применения боевых механик по фазам
- **BattlePhase**: Фаза боя (turn_start, movement, pre_attack, attack, post_attack, turn_end)
- **PhaseContext**: Контекст фазы с активным юнитом, целью и действием
- **MVP_PRESET**: Пресет без механик (Core 1.0 поведение)
- **ROGUELIKE_PRESET**: Пресет со всеми 14 механиками
- **TACTICAL_PRESET**: Пресет с механиками Tier 0-2

## Requirements

### Requirement 1 (Фаза 1 - Quick Win)

**User Story:** As a player, I want roguelike battles to use Core 2.0 mechanics, so that combat is tactical and interesting.

#### Acceptance Criteria

1. WHEN a roguelike battle is started THEN the system SHALL create a MechanicsProcessor with ROGUELIKE_PRESET
2. WHEN simulateBattle is called in roguelike mode THEN the system SHALL pass the processor as the 4th argument
3. WHEN a battle uses ROGUELIKE_PRESET THEN the system SHALL generate mechanic events (flanking, resolve, facing)
4. WHEN a PvP battle is started THEN the system SHALL continue using MVP behavior (no processor)

### Requirement 2 (Фаза 2 - Рефакторинг)

**User Story:** As a developer, I want mechanics to be applied through MechanicsProcessor consistently, so that the code is maintainable.

#### Acceptance Criteria

1. WHEN a battle is simulated with a MechanicsProcessor THEN the system SHALL apply all enabled mechanics through the processor's phase hooks
2. WHEN a battle is simulated without a MechanicsProcessor THEN the system SHALL behave identically to Core 1.0 (MVP behavior)
3. WHEN resolve damage is calculated THEN the system SHALL use the ResolveProcessor instead of inline calculations
4. WHEN flanking modifiers are applied THEN the system SHALL use the FlankingProcessor instead of inline calculations
5. WHEN facing is updated THEN the system SHALL use the FacingProcessor instead of inline calculations

### Requirement 3 (Фаза 2 - Рефакторинг)

**User Story:** As a developer, I want to remove duplicate mechanic logic from battle.simulator.ts, so that mechanics are implemented in one place.

#### Acceptance Criteria

1. WHEN the battle simulator applies resolve damage THEN the system SHALL delegate to the resolve processor
2. WHEN the battle simulator calculates flanking bonuses THEN the system SHALL delegate to the flanking processor
3. WHEN the battle simulator updates unit facing THEN the system SHALL delegate to the facing processor
4. WHEN the battle simulator checks routing state THEN the system SHALL delegate to the resolve processor

### Requirement 4 (Фаза 3 - Полная интеграция)

**User Story:** As a developer, I want all 14 mechanics to be properly integrated, so that ROGUELIKE_PRESET works as designed.

#### Acceptance Criteria

1. WHEN engagement mechanic is enabled THEN the system SHALL apply Zone of Control and Attack of Opportunity
2. WHEN intercept mechanic is enabled THEN the system SHALL check for hard/soft intercepts during movement
3. WHEN overwatch mechanic is enabled THEN the system SHALL allow units to enter vigilance and trigger shots
4. WHEN phalanx mechanic is enabled THEN the system SHALL calculate formation bonuses for adjacent allies
5. WHEN lineOfSight mechanic is enabled THEN the system SHALL check direct/arc fire for ranged attacks
6. WHEN ammunition mechanic is enabled THEN the system SHALL track and consume ammo for ranged units
7. WHEN contagion mechanic is enabled THEN the system SHALL spread status effects to adjacent units
8. WHEN armorShred mechanic is enabled THEN the system SHALL reduce target armor on physical attacks

### Requirement 5 (Фаза 2 - Рефакторинг)

**User Story:** As a developer, I want the battle simulator code to be clean and readable, so that it's easy to maintain and debug.

#### Acceptance Criteria

1. WHEN executing a unit's turn THEN the system SHALL use a clear phase-based flow (turn_start → action → turn_end)
2. WHEN applying mechanics THEN the system SHALL use the processor.process() method for each phase
3. WHEN handling mechanic events THEN the system SHALL collect and return them in the battle result
4. WHEN converting between game state and core state THEN the system SHALL preserve all unit properties correctly

### Requirement 6 (Все фазы)

**User Story:** As a developer, I want deterministic battle results, so that replays work correctly.

#### Acceptance Criteria

1. WHEN a battle is simulated with the same seed THEN the system SHALL produce identical results
2. WHEN mechanics generate random values THEN the system SHALL use the seeded random from context
3. WHEN multiple mechanics are applied in a phase THEN the system SHALL apply them in consistent tier order

### Requirement 7 (Фаза 3 - Полная интеграция)

**User Story:** As a developer, I want comprehensive tests for mechanics integration, so that I can verify correctness.

#### Acceptance Criteria

1. WHEN running integration tests with ROGUELIKE_PRESET THEN the system SHALL verify all mechanics are applied
2. WHEN running integration tests with TACTICAL_PRESET THEN the system SHALL verify only Tier 0-2 mechanics are applied
3. WHEN running integration tests with MVP_PRESET THEN the system SHALL verify no mechanics are applied
4. WHEN comparing MVP vs ROGUELIKE results THEN the system SHALL show different event counts due to mechanic events
