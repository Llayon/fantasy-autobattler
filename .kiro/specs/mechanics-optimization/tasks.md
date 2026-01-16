# Implementation Plan

## Фаза 1 - Quick Win (Включение механик в Roguelike)

- [x] 1. Добавить ROGUELIKE_PRESET в RoguelikeBattleService






  - [x] 1.1 Создать метод createRoguelikeProcessor() в roguelike/battle/battle.service.ts

    - Импортировать createMechanicsProcessor и ROGUELIKE_PRESET из core/mechanics
    - Создать приватный метод возвращающий MechanicsProcessor
    - _Requirements: 1.1_

  - [x] 1.2 Передать processor в simulateBattle

    - Найти вызов simulateBattle в методе simulateAndSaveBattle
    - Добавить processor как 4-й аргумент
    - _Requirements: 1.2_

  - [x] 1.3 Написать property test для roguelike processor config





    - **Property 1: Roguelike battles use ROGUELIKE_PRESET**
    - **Validates: Requirements 1.1**

- [x] 2. Checkpoint - Проверить что механики работают





  - Ensure all tests pass, ask the user if questions arise.

## Фаза 2 - Рефакторинг (Удаление дублирования)

- [x] 3. Создать helper функции для конвертации состояния







  - [x] 3.1 Создать toCoreBattleState() в battle.simulator.ts


    - Конвертировать BattleStateWithAbilities в CoreBattleState
    - Сохранить все свойства юнитов (HP, position, alive, facing, resolve)
    - _Requirements: 5.4_


  - [x] 3.2 Создать fromCoreBattleState() в battle.simulator.ts

    - Конвертировать CoreBattleState обратно в BattleStateWithAbilities
    - Применить изменения из core state к game state


    - _Requirements: 5.4_
  - [x] 3.3 Написать property test для state preservation


    - **Property 6: State preservation in conversion**
    - **Validates: Requirements 5.4**

- [x] 4. Рефакторинг executeUnitTurnWithAbilities





  - [x] 4.1 Создать processPhase helper


    - Вызывать processor.process() для каждой фазы
    - Собирать события в массив
    - Обновлять состояние
    - _Requirements: 5.2_
  - [x] 4.2 Удалить inline resolve логику


    - Удалить ~100 строк inline кода resolve damage
    - Делегировать ResolveProcessor через processPhase
    - _Requirements: 2.3, 3.1_
  - [x] 4.3 Удалить inline flanking логику


    - Удалить ~80 строк inline кода flanking
    - Делегировать FlankingProcessor через processPhase
    - _Requirements: 2.4, 3.2_
  - [x] 4.4 Удалить inline facing логику


    - Удалить ~50 строк inline кода facing
    - Делегировать FacingProcessor через processPhase
    - _Requirements: 2.5, 3.3_
  - [x] 4.5 Написать property test для MVP equivalence


    - **Property 3: MVP behavior without processor**
    - **Validates: Requirements 2.2**

- [x] 5. Checkpoint - Проверить рефакторинг





  - Ensure all tests pass, ask the user if questions arise.

## Фаза 3 - Полная интеграция механик

- [x] 6. Интегрировать Tier 1 механики












  - [x] 6.1 Интегрировать Engagement (ZoC, Attack of Opportunity)


    - Добавить вызов processPhase('movement') при движении юнита
    - Обработать события engagement_zoc и engagement_aoo
    - _Requirements: 4.1_
  - [x] 6.2 Написать unit test для engagement интеграции



    - Проверить что ZoC применяется при движении рядом с врагом
    - _Requirements: 4.1_

- [x] 7. Интегрировать Tier 2 механики




  - [x] 7.1 Интегрировать Intercept (hard/soft intercept)


    - Добавить проверку intercept при движении
    - Обработать события intercept_hard и intercept_soft
    - _Requirements: 4.2_
  - [x] 7.2 Интегрировать Aura (area effects)


    - Добавить вызов processPhase('turn_start') для aura
    - Обработать события aura_applied
    - _Requirements: 4.8 (implicit)_
  - [x] 7.3 Написать unit tests для tier 2 механик


    - Проверить intercept и aura интеграцию
    - _Requirements: 4.2_

- [x] 8. Интегрировать Tier 3 механики




  - [x] 8.1 Интегрировать Overwatch (vigilance, trigger shots)


    - Добавить состояние vigilance для юнитов
    - Обработать события overwatch_triggered
    - _Requirements: 4.3_
  - [x] 8.2 Интегрировать Phalanx (formation bonuses)


    - Добавить расчет formation bonus при turn_start
    - Обработать события phalanx_bonus
    - _Requirements: 4.4_
  - [x] 8.3 Интегрировать LoS (line of sight)


    - Добавить проверку LoS для ranged атак
    - Обработать события los_blocked
    - _Requirements: 4.5_
  - [x] 8.4 Интегрировать Ammunition (ammo tracking)


    - Добавить поле ammo для ranged юнитов
    - Обработать события ammo_consumed и ammo_reloaded
    - _Requirements: 4.6_
  - [x] 8.5 Написать unit tests для tier 3 механик


    - Проверить overwatch, phalanx, LoS, ammunition интеграцию
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 9. Интегрировать Tier 4 механики




  - [x] 9.1 Интегрировать Contagion (status effect spread)


    - Добавить вызов processPhase('turn_end') для contagion
    - Обработать события contagion_spread
    - _Requirements: 4.7_
  - [x] 9.2 Интегрировать ArmorShred (armor reduction)


    - Добавить применение armor shred при физических атаках
    - Обработать события armor_shred_applied
    - _Requirements: 4.8_
  - [x] 9.3 Написать unit tests для tier 4 механик


    - Проверить contagion и armor shred интеграцию
    - _Requirements: 4.7, 4.8_

- [x] 10. Checkpoint - Проверить все механики





  - Ensure all tests pass, ask the user if questions arise.

## Финальные тесты и валидация

- [x] 11. Написать property-based tests





  - [x] 11.1 Property test для mechanic event generation


    - **Property 2: Mechanic events are generated with ROGUELIKE_PRESET**
    - **Validates: Requirements 1.3**
  - [x] 11.2 Property test для determinism


    - **Property 4: Determinism with mechanics**
    - **Validates: Requirements 6.1**
  - [x] 11.3 Property test для event count difference


    - **Property 5: Event count difference between presets**
    - **Validates: Requirements 7.4**
  - [x] 11.4 Property test для tier order


    - **Property 7: Consistent tier order**
    - **Validates: Requirements 6.3**

- [x] 12. Написать integration tests





  - [x] 12.1 Integration test для ROGUELIKE_PRESET


    - Полный бой с проверкой всех 14 механик
    - _Requirements: 7.1_
  - [x] 12.2 Integration test для TACTICAL_PRESET

    - Полный бой с проверкой Tier 0-2 механик
    - _Requirements: 7.2_
  - [x] 12.3 Integration test для MVP vs ROGUELIKE сравнения

    - Сравнить результаты и количество событий
    - _Requirements: 7.4_

- [x] 13. Final Checkpoint - Все тесты проходят





  - Ensure all tests pass, ask the user if questions arise.

## Документация и качество кода

- [x] 14. Добавить JSDoc документацию






  - [x] 14.1 JSDoc для createRoguelikeProcessor()

    - Добавить @description, @returns, @example
    - Описать что метод создает processor с ROGUELIKE_PRESET
    - _Requirements: 5.1_
  - [x] 14.2 JSDoc для toCoreBattleState() и fromCoreBattleState()


    - Добавить @description, @param, @returns, @example
    - Описать конвертацию между game state и core state
    - _Requirements: 5.4_
  - [x] 14.3 JSDoc для processPhase helper


    - Добавить @description, @param, @returns
    - Описать как helper обрабатывает фазы механик
    - _Requirements: 5.2_
  - [x] 14.4 JSDoc для новых интерфейсов и типов


    - Документировать PhaseContext, MechanicEvent и другие типы
    - _Requirements: 5.3_

- [x] 15. Добавить логирование





  - [x] 15.1 Логирование в RoguelikeBattleService


    - Добавить logger.log при создании processor
    - Добавить logger.debug для mechanic events
    - Добавить logger.error при ошибках processor
    - _Requirements: 5.1_
  - [x] 15.2 Логирование в battle.simulator.ts


    - Добавить logger.debug для каждой фазы механик
    - Логировать количество событий от каждой механики
    - _Requirements: 5.2_
  - [x] 15.3 Логирование ошибок механик

    - Добавить try-catch с logger.error для processor.process()
    - Включить контекст (phase, unitId, battleId)
    - _Requirements: 5.2_

- [x] 16. Обновить Swagger документацию





  - [x] 16.1 Обновить BattleResult DTO


    - Добавить @ApiProperty для mechanicEvents
    - Описать новые поля связанные с механиками
    - _Requirements: 5.3_
  - [x] 16.2 Обновить RoguelikeBattleResult DTO


    - Добавить @ApiProperty для processor config info
    - Описать какой preset использовался
    - _Requirements: 1.1_
  - [x] 16.3 Документировать mechanic event types


    - Добавить enum с описанием всех типов mechanic events
    - Добавить @ApiProperty descriptions
    - _Requirements: 5.3_

- [x] 17. Final Documentation Checkpoint





  - Ensure all new code has JSDoc, logging, and Swagger docs.
