# Проверка механики Рипоста в Roguelike режиме

## Дата проверки
9 января 2026

## Конфигурация

### ROGUELIKE_PRESET - Рипост
```typescript
riposte: {
  initiativeBased: true,        // ✅ Шанс зависит от инициативы
  chargesPerRound: 'attackCount', // ✅ Заряды = количество атак юнита
  baseChance: 0.5,               // ✅ Базовый шанс 50%
  guaranteedThreshold: 10,       // ✅ Гарантированный рипост при +10 инициативы
}
```

## Механика Рипоста

### Основные правила
1. **Направление атаки**: Рипост возможен ТОЛЬКО при атаке с фронта
   - ✅ Front arc → Рипост возможен
   - ❌ Flank arc → Рипост заблокирован
   - ❌ Rear arc → Рипост заблокирован

2. **Заряды**: Ограниченное количество рипостов за раунд
   - По умолчанию: `chargesPerRound = 'attackCount'`
   - Юнит с `attackCount = 1` → 1 рипост за раунд
   - Юнит с `attackCount = 2` → 2 рипоста за раунд
   - Заряды восстанавливаются в начале каждого раунда

3. **Шанс рипоста** (Initiative-based):
   ```
   initDiff = defender.initiative - attacker.initiative
   
   Если initDiff >= 10:  chance = 100% (гарантированный)
   Если initDiff <= -10: chance = 0% (невозможный)
   Иначе: chance = 0.5 + (initDiff / 10) * 0.5
   
   Примеры:
   - initDiff = 0:   50% шанс
   - initDiff = +5:  75% шанс
   - initDiff = -5:  25% шанс
   - initDiff = +10: 100% шанс
   - initDiff = -10: 0% шанс
   ```

4. **Урон рипоста**: 50% от обычной атаки защитника
   ```
   riposteDamage = floor(defender.atk * 0.5)
   ```

5. **Расход заряда**: Каждый успешный рипост тратит 1 заряд

## Интеграция с другими механиками

### Взаимодействие с Flanking (Tier 1)
- **Зависимость**: Рипост требует Flanking для определения дуги атаки
- **Правило**: Flanking атаки (flank/rear) **отключают** рипост
- **Реализация**: 
  ```typescript
  // В riposte.processor.ts
  canRiposte(defender, attacker, arc) {
    if (arc !== 'front') {
      return false; // Фланговые атаки блокируют рипост
    }
    // ...
  }
  ```

### Взаимодействие с Facing (Tier 0)
- **Зависимость**: Рипост требует Facing для определения направления
- **Использование**: `facingProcessor.getAttackArc(attacker, defender)`
- **Реализация**:
  ```typescript
  // В riposte.processor.ts apply()
  const facingProcessor = createFacingProcessor();
  const arc = facingProcessor.getAttackArc(attacker, defender);
  ```

## Фазы обработки

### Phase: 'attack'
**Когда**: После того как атакующий нанес урон
**Действия**:
1. Получить защитника из state (актуальное HP)
2. Получить атакующего из state
3. Вычислить дугу атаки через facing
4. Проверить `canRiposte(defender, attacker, arc)`
5. Если возможен → вычислить шанс
6. Бросить кубик (seededRandom)
7. Если успех → выполнить рипост
8. Сгенерировать событие для лога

### Phase: 'turn_start'
**Когда**: В начале хода юнита
**Действия**:
1. Проверить `currentRound > lastChargeResetRound`
2. Если да → восстановить заряды
3. Обновить `lastChargeResetRound = currentRound`

**Важно**: Заряды восстанавливаются **один раз за раунд**, а не за каждый ход!

## Тестовое покрытие

### Unit Tests (riposte.spec.ts)
✅ **canRiposte()** - 752+ строк тестов
- Arc check (front/flank/rear)
- Charge check (remaining/depleted)
- Alive check (dead/alive/0 HP)
- Combined conditions

✅ **getRiposteChance()** - Initiative-based calculation
- Equal initiative → 50%
- Defender faster → higher chance
- Attacker faster → lower chance
- Guaranteed threshold (+10)
- Impossible threshold (-10)
- Linear interpolation
- Non-initiative mode
- Custom config
- Edge cases

✅ **executeRiposte()** - Damage and state updates
- 50% damage calculation
- Floor rounding
- HP reduction
- Alive status update
- Charge consumption
- State updates

### Integration Tests

✅ **roguelike-preset.integration.spec.ts**
- ROGUELIKE_PRESET configuration
- All 14 mechanics enabled
- Riposte config verification
- Battle determinism
- Phase processing

✅ **battle.processor.spec.ts**
- Property-based tests
- ROGUELIKE_PRESET usage
- Config consistency

## Проверка в Roguelike режиме

### Создание процессора
```typescript
// В roguelike/battle/battle.service.ts
private createRoguelikeProcessor(): MechanicsProcessor {
  this.logger.log('Creating MechanicsProcessor with ROGUELIKE_PRESET', {
    preset: 'ROGUELIKE_PRESET',
    mechanicsCount: 14,
    tiers: ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
  });
  
  const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
  
  // Логирование конфигурации
  this.logger.debug('MechanicsProcessor created successfully', {
    config: {
      facing: processor.config.facing,
      flanking: processor.config.flanking,
      riposte: processor.config.riposte,
      // ...
    },
  });
  
  return processor;
}
```

### Использование в бою
```typescript
// В roguelike/battle/battle.service.ts
async simulateAndSaveBattle(run, playerField, opponent) {
  // ...
  
  // Создать процессор с ROGUELIKE_PRESET
  const processor = this.createRoguelikeProcessor();
  
  // Запустить симуляцию с механиками
  const battleResult = simulateBattle(
    playerTeamSetup, 
    opponentTeamSetup, 
    seed, 
    processor  // ← Процессор с рипостом
  );
  
  // Логировать события механик
  const mechanicEvents = battleResult.events.filter(
    e => e.type.startsWith('mechanic_')
  );
  
  if (mechanicEvents.length > 0) {
    this.logger.debug('Mechanic events generated during battle', {
      runId: run.id,
      totalEvents: battleResult.events.length,
      mechanicEventsCount: mechanicEvents.length,
      mechanicEventTypes: this.countEventTypes(mechanicEvents),
    });
  }
  
  // ...
}
```

## События рипоста

### mechanic_riposte
```typescript
{
  type: 'mechanic_riposte',
  round: 1,
  actorId: 'defender_instance_id',
  targetId: 'attacker_instance_id',
  metadata: {
    damage: 10,           // Урон рипоста
    chance: 75,           // Шанс в процентах
    attackerKilled: false, // Убит ли атакующий
    arc: 'front',         // Дуга атаки
  },
}
```

## Примеры сценариев

### Сценарий 1: Успешный рипост
```
Юниты:
- Defender: Knight (Initiative: 15, ATK: 20, riposteCharges: 1)
- Attacker: Rogue (Initiative: 10, ATK: 25)

Ход атакующего:
1. Rogue атакует Knight с фронта
2. Knight получает урон
3. Проверка рипоста:
   - Arc: front ✅
   - Charges: 1 ✅
   - Alive: true ✅
   - InitDiff: 15 - 10 = +5
   - Chance: 0.5 + (5/10)*0.5 = 0.75 (75%)
4. Roll: 0.42 < 0.75 → Успех!
5. Riposte damage: floor(20 * 0.5) = 10
6. Rogue HP: 100 → 90
7. Knight charges: 1 → 0

Событие:
{
  type: 'mechanic_riposte',
  actorId: 'knight_1',
  targetId: 'rogue_1',
  metadata: { damage: 10, chance: 75, attackerKilled: false, arc: 'front' }
}
```

### Сценарий 2: Рипост заблокирован (фланг)
```
Юниты:
- Defender: Knight (Initiative: 15, ATK: 20, riposteCharges: 1)
- Attacker: Rogue (Initiative: 10, ATK: 25)

Ход атакующего:
1. Rogue атакует Knight с фланга
2. Knight получает урон + бонус фланга (15%)
3. Проверка рипоста:
   - Arc: flank ❌ → Рипост заблокирован
4. Рипост не происходит
5. Knight charges: 1 (не потрачен)

Событие: Нет события рипоста
```

### Сценарий 3: Гарантированный рипост
```
Юниты:
- Defender: Duelist (Initiative: 20, ATK: 18, riposteCharges: 2)
- Attacker: Berserker (Initiative: 5, ATK: 30)

Ход атакующего:
1. Berserker атакует Duelist с фронта
2. Duelist получает урон
3. Проверка рипоста:
   - Arc: front ✅
   - Charges: 2 ✅
   - Alive: true ✅
   - InitDiff: 20 - 5 = +15
   - Chance: 1.0 (100% - гарантированный!)
4. Roll: любой → Успех!
5. Riposte damage: floor(18 * 0.5) = 9
6. Berserker HP: 150 → 141
7. Duelist charges: 2 → 1

Событие:
{
  type: 'mechanic_riposte',
  actorId: 'duelist_1',
  targetId: 'berserker_1',
  metadata: { damage: 9, chance: 100, attackerKilled: false, arc: 'front' }
}
```

## Выводы

### ✅ Механика работает корректно
1. **Конфигурация**: ROGUELIKE_PRESET правильно настроен
2. **Зависимости**: Facing и Flanking корректно интегрированы
3. **Логика**: Все проверки (arc, charges, alive) работают
4. **Формулы**: Шанс и урон вычисляются правильно
5. **Фазы**: Обработка в 'attack' и 'turn_start' корректна
6. **События**: Генерируются правильные события для лога
7. **Тесты**: Полное покрытие unit и integration тестами

### ✅ Интеграция с Roguelike режимом
1. **Процессор**: Создается с ROGUELIKE_PRESET
2. **Симуляция**: Передается в simulateBattle()
3. **Логирование**: События механик логируются
4. **Детерминизм**: Seeded random обеспечивает воспроизводимость

### 🎯 Рекомендации
1. **Мониторинг**: Проверять логи на наличие событий `mechanic_riposte`
2. **Баланс**: Следить за частотой рипостов в боях
3. **UI**: Добавить визуализацию рипоста в replay (если еще нет)
4. **Статистика**: Собирать метрики по рипостам (успешные/заблокированные)

## Статус: ✅ ПРОВЕРЕНО И РАБОТАЕТ

Механика рипоста полностью функциональна в roguelike режиме:
- Конфигурация корректна
- Логика реализована правильно
- Тесты проходят
- Интеграция с другими механиками работает
- События генерируются для battle log
