# Поток выполнения Рипоста в Симуляторе Битвы

## Дата: 9 января 2026

## Общая схема

```
simulateBattle()
    ↓
createMechanicsProcessor(ROGUELIKE_PRESET)  ← Создание процессора с рипостом
    ↓
executeUnitTurn()  ← Выполнение хода юнита
    ↓
[Атака юнита]
    ↓
processPhase(processor, 'attack', state, context)  ← ЗДЕСЬ ПРОИСХОДИТ РИПОСТ
    ↓
processor.process('attack', coreState, context)
    ↓
riposteProcessor.apply('attack', state, context)  ← Обработка рипоста
    ↓
[Генерация события mechanic_riposte]
    ↓
[Обновление HP атакующего]
    ↓
[Расход заряда рипоста]
```

## Детальный поток в симуляторе

### 1. Инициализация (simulateBattle)

**Файл:** `backend/src/battle/battle.simulator.ts`

```typescript
export function simulateBattle(
  playerTeam: TeamSetup,
  enemyTeam: TeamSetup,
  seed: number,
  processor?: MechanicsProcessor  // ← Процессор с рипостом передается сюда
): BattleResult {
  // ...
  
  // Если processor не передан, создается MVP_PRESET (без механик)
  // Если передан ROGUELIKE_PRESET, все механики включены
  
  // Основной цикл боя
  while (currentRound <= MAX_ROUNDS && !battleEnded) {
    // Для каждого юнита в порядке инициативы
    for (const unit of turnOrder) {
      const turnResult = executeUnitTurn(
        unit,
        currentState,
        currentSeed,
        processor  // ← Процессор передается в ход юнита
      );
      // ...
    }
  }
}
```

### 2. Выполнение хода юнита (executeUnitTurn)

**Файл:** `backend/src/battle/battle.simulator.ts` (строки 1140-1800)

```typescript
function executeUnitTurn(
  unit: BattleUnit,
  state: BattleStateWithAbilities,
  seed: number,
  processor?: MechanicsProcessor  // ← Процессор доступен в ходе
): { events: BattleEvent[]; state: BattleStateWithAbilities } {
  
  // TURN_START phase
  const turnStartResult = processPhase(processor, 'turn_start', currentState, {
    activeUnit: unit,
    seed: currentSeed++,
  });
  // ← Здесь восстанавливаются заряды рипоста (раз в раунд)
  
  // AI принимает решение
  const action = selectAction(unit, currentState, currentSeed++);
  
  switch (action.type) {
    case 'attack': {
      // ... атака происходит ...
      
      // Юнит наносит урон цели
      const damage = calculateDamage(unit, target);
      target.currentHp -= damage;
      
      // ═══════════════════════════════════════════════════════════
      // ATTACK PHASE - ЗДЕСЬ ПРОИСХОДИТ РИПОСТ!
      // ═══════════════════════════════════════════════════════════
      if (currentTarget) {
        const attackResult = processPhase(processor, 'attack', currentState, {
          activeUnit: unit,        // ← Атакующий (получит урон от рипоста)
          target: currentTarget,   // ← Защитник (может рипостнуть)
          action: { type: 'attack', targetId: currentTarget.instanceId },
          seed: currentSeed++,
        });
        
        currentState = attackResult.state;  // ← Обновленное состояние (HP изменены)
        events.push(...attackResult.events); // ← События рипоста добавлены
      }
      // ═══════════════════════════════════════════════════════════
      
      // POST_ATTACK phase
      const postAttackResult = processPhase(processor, 'post_attack', currentState, {
        activeUnit: unit,
        target: currentTarget,
        seed: currentSeed++,
      });
      
      break;
    }
  }
  
  // TURN_END phase
  const turnEndResult = processPhase(processor, 'turn_end', currentState, {
    activeUnit: unit,
    seed: currentSeed++,
  });
  
  return { events, state: currentState };
}
```

### 3. Обработка фазы (processPhase)

**Файл:** `backend/src/battle/battle.simulator.ts` (строки 1057-1130)

```typescript
function processPhase(
  processor: MechanicsProcessor | undefined,
  phase: 'attack',  // ← Фаза атаки для рипоста
  state: BattleStateWithAbilities,
  context: PhaseContext
): { state: BattleStateWithAbilities; events: BattleEvent[] } {
  
  // Если нет процессора, возвращаем неизмененное состояние
  if (!processor) {
    return { state, events: [] };
  }
  
  try {
    // 1. Конвертируем состояние игры в core state
    const coreState = toCoreBattleState(state);
    
    // 2. Вызываем процессор механик
    // ═══════════════════════════════════════════════════════════
    // ЗДЕСЬ ВЫЗЫВАЕТСЯ РИПОСТ!
    // ═══════════════════════════════════════════════════════════
    const result: ProcessResult = processor.process(phase, coreState, context);
    //                             ↑
    //                             Это вызывает riposteProcessor.apply()
    // ═══════════════════════════════════════════════════════════
    
    // 3. Конвертируем core state обратно в game state
    const updatedState = fromCoreBattleState(state, result.state);
    
    // 4. Добавляем номер раунда к событиям
    const eventsWithRound = result.events.map(event => ({
      ...event,
      round: state.currentRound,
    }));
    
    // 5. Возвращаем обновленное состояние и события
    return {
      state: updatedState,  // ← HP атакующего может быть уменьшен
      events: eventsWithRound,  // ← Событие mechanic_riposte добавлено
    };
    
  } catch (error) {
    console.error(`[Mechanics] Phase ${phase} failed:`, error);
    return { state, events: [] };
  }
}
```

### 4. Процессор механик (MechanicsProcessor)

**Файл:** `backend/src/core/mechanics/processor.ts`

```typescript
export function createMechanicsProcessor(
  config: Partial<MechanicsConfig>
): MechanicsProcessor {
  const resolved = resolveDependencies(config);
  const processors = buildProcessors(resolved);
  
  return {
    config: resolved,
    processors,  // ← Содержит riposteProcessor
    
    process: (phase, state, context) => {
      // Применяем все механики для данной фазы
      return applyMechanics(phase, state, context, resolved, processors);
    },
  };
}

export function applyMechanics(
  phase: BattlePhase,
  state: BattleState,
  context: PhaseContext,
  config: MechanicsConfig,
  processors: MechanicProcessorMap
): ProcessResult {
  let result = state;
  const collectedEvents: BattleEvent[] = [];
  
  // Получаем механики для данной фазы
  const mechanicsForPhase = PHASE_MECHANICS[phase];
  // Для 'attack': ['armorShred', 'riposte', 'contagion']
  
  for (const mechanic of mechanicsForPhase) {
    const processor = processors[mechanic];
    
    if (processor) {
      // ═══════════════════════════════════════════════════════════
      // ВЫЗОВ РИПОСТА ЗДЕСЬ!
      // ═══════════════════════════════════════════════════════════
      const mechanicResult = processor.apply(phase, result, context);
      //                      ↑
      //                      Для рипоста это riposteProcessor.apply()
      // ═══════════════════════════════════════════════════════════
      
      if (isMechanicResult(mechanicResult)) {
        result = mechanicResult.state;
        if (mechanicResult.events) {
          collectedEvents.push(...mechanicResult.events);
        }
      } else {
        result = mechanicResult;
      }
    }
  }
  
  return {
    state: result,
    events: collectedEvents,
  };
}
```

### 5. Процессор рипоста (RiposteProcessor)

**Файл:** `backend/src/core/mechanics/tier2/riposte/riposte.processor.ts`

```typescript
export function createRiposteProcessor(config: RiposteConfig): RiposteProcessor {
  return {
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext
    ): { state: BattleState; events: BattleEvent[] } {
      const events: BattleEvent[] = [];
      
      // ═══════════════════════════════════════════════════════════
      // ОБРАБОТКА ФАЗЫ 'attack' - РИПОСТ!
      // ═══════════════════════════════════════════════════════════
      if (phase === 'attack' && context.target) {
        
        // 1. Получаем защитника из state (актуальное HP после атаки)
        const defender = state.units.find(u => u.id === context.target?.id);
        if (!defender || !defender.alive) {
          return { state, events };
        }
        
        // 2. Получаем атакующего из state
        const attacker = state.units.find(u => u.id === context.activeUnit.id);
        if (!attacker || !attacker.alive) {
          return { state, events };
        }
        
        // 3. Вычисляем дугу атаки через facing
        const facingProcessor = createFacingProcessor();
        const arc = facingProcessor.getAttackArc(attacker, defender);
        
        // 4. Проверяем возможность рипоста
        const defenderWithRiposte = defender as BattleUnit & UnitWithRiposte;
        if (!this.canRiposte(defenderWithRiposte, attacker, arc)) {
          return { state, events };
        }
        
        // 5. Вычисляем шанс рипоста (initiative-based)
        const chance = this.getRiposteChance(defenderWithRiposte, attacker, config);
        
        // 6. Бросаем кубик (seeded random)
        const roll = seededRandom(context.seed);
        
        // 7. Если успех - выполняем рипост!
        if (roll < chance) {
          // Вычисляем урон рипоста
          const defenderAtk = defender.stats?.atk ?? 0;
          const riposteDamage = Math.floor(defenderAtk * 0.5);
          const newAttackerHp = Math.max(0, attacker.currentHp - riposteDamage);
          const attackerKilled = newAttackerHp <= 0;
          
          // Генерируем событие для battle log
          events.push({
            type: 'mechanic_riposte',
            round: state.round ?? 1,
            actorId: defender.instanceId,
            targetId: attacker.instanceId,
            metadata: {
              damage: riposteDamage,
              chance: Math.round(chance * 100),
              attackerKilled,
              arc,
            },
          });
          
          // Выполняем рипост (обновляем HP и заряды)
          const newState = this.executeRiposte(defenderWithRiposte, attacker, state);
          return { state: newState, events };
        }
      }
      
      // ═══════════════════════════════════════════════════════════
      // ОБРАБОТКА ФАЗЫ 'turn_start' - ВОССТАНОВЛЕНИЕ ЗАРЯДОВ
      // ═══════════════════════════════════════════════════════════
      if (phase === 'turn_start') {
        const unit = state.units.find(u => u.id === context.activeUnit.id);
        if (unit) {
          const unitWithRiposte = unit as BattleUnit & UnitWithRiposte;
          const currentRound = state.round ?? 1;
          const lastResetRound = unitWithRiposte.lastChargeResetRound ?? 0;
          
          // Восстанавливаем заряды только раз в раунд
          if (currentRound > lastResetRound) {
            const maxCharges = getMaxRiposteCharges(unitWithRiposte, config);
            
            const updatedUnit: BattleUnit & UnitWithRiposte = {
              ...unitWithRiposte,
              riposteCharges: maxCharges,
              maxRiposteCharges: maxCharges,
              lastChargeResetRound: currentRound,
            };
            
            return { state: updateUnits(state, [updatedUnit]), events };
          }
        }
      }
      
      return { state, events };
    },
  };
}
```

## Временная последовательность

```
Время →

Раунд 1, Ход 1: Knight атакует Rogue
├─ [1] Knight наносит урон Rogue (20 damage)
├─ [2] Rogue HP: 100 → 80
├─ [3] processPhase('attack') вызывается
│   ├─ [4] processor.process('attack') вызывается
│   │   ├─ [5] riposteProcessor.apply('attack') вызывается
│   │   │   ├─ [6] Проверка: arc = 'front' ✅
│   │   │   ├─ [7] Проверка: riposteCharges = 1 ✅
│   │   │   ├─ [8] Проверка: Rogue alive ✅
│   │   │   ├─ [9] Вычисление: initDiff = 10 - 5 = +5
│   │   │   ├─ [10] Вычисление: chance = 0.5 + (5/10)*0.5 = 0.75
│   │   │   ├─ [11] Бросок: roll = 0.42 < 0.75 ✅ УСПЕХ!
│   │   │   ├─ [12] Урон: floor(20 * 0.5) = 10
│   │   │   ├─ [13] Knight HP: 100 → 90
│   │   │   ├─ [14] Rogue charges: 1 → 0
│   │   │   └─ [15] Событие: mechanic_riposte
│   │   └─ [16] Возврат: { state, events: [mechanic_riposte] }
│   └─ [17] Возврат: { state, events }
└─ [18] События добавлены в battle log

Раунд 2, Ход 1: Rogue начинает ход
├─ [1] processPhase('turn_start') вызывается
│   ├─ [2] riposteProcessor.apply('turn_start') вызывается
│   │   ├─ [3] Проверка: currentRound (2) > lastResetRound (1) ✅
│   │   ├─ [4] Восстановление: riposteCharges = 1
│   │   └─ [5] Обновление: lastChargeResetRound = 2
│   └─ [6] Возврат: { state, events }
└─ [7] Rogue может снова рипостнуть в этом раунде
```

## Ключевые моменты интеграции

### ✅ 1. Процессор передается через всю цепочку
```
simulateBattle(processor)
  → executeUnitTurn(processor)
    → processPhase(processor, 'attack')
      → processor.process('attack')
        → riposteProcessor.apply('attack')
```

### ✅ 2. Фаза 'attack' вызывается ПОСЛЕ нанесения урона
```typescript
// Сначала атака
target.currentHp -= damage;
events.push(attackEvent);

// ПОТОМ рипост
const attackResult = processPhase(processor, 'attack', currentState, context);
```

### ✅ 3. Состояние конвертируется туда-обратно
```typescript
// Game State → Core State
const coreState = toCoreBattleState(state);

// Обработка механик
const result = processor.process(phase, coreState, context);

// Core State → Game State
const updatedState = fromCoreBattleState(state, result.state);
```

### ✅ 4. События собираются и возвращаются
```typescript
// События из механик
const attackResult = processPhase(processor, 'attack', state, context);

// Добавляются в общий лог
events.push(...attackResult.events);

// Возвращаются в результате боя
return { events, winner, finalState };
```

### ✅ 5. Детерминизм через seeded random
```typescript
// Seed инкрементируется для каждой фазы
const attackResult = processPhase(processor, 'attack', currentState, {
  activeUnit: unit,
  target: currentTarget,
  seed: currentSeed++,  // ← Уникальный seed для рипоста
});
```

## Проверка в логах

### Debug логи (development mode)

```typescript
// В processPhase()
console.debug(`[Mechanics] Processing phase: attack`, {
  activeUnit: 'knight_1',
  target: 'rogue_1',
  round: 1,
});

console.debug(`[Mechanics] Phase attack generated 1 events`, {
  eventTypes: { mechanic_riposte: 1 },
  activeUnit: 'knight_1',
});
```

### События в battle log

```json
{
  "type": "mechanic_riposte",
  "round": 1,
  "actorId": "rogue_1",
  "targetId": "knight_1",
  "metadata": {
    "damage": 10,
    "chance": 75,
    "attackerKilled": false,
    "arc": "front"
  }
}
```

## Выводы

### ✅ Рипост полностью интегрирован в симулятор

1. **Процессор передается:** От `simulateBattle()` до `riposteProcessor.apply()`
2. **Фаза вызывается:** `processPhase('attack')` после каждой атаки
3. **Состояние обновляется:** HP атакующего уменьшается
4. **События генерируются:** `mechanic_riposte` добавляется в лог
5. **Заряды управляются:** Восстановление в `turn_start`
6. **Детерминизм работает:** Seeded random для воспроизводимости

### 🎯 Точки входа для отладки

1. **Строка 1680:** `processPhase(processor, 'attack')` - вызов фазы атаки
2. **Строка 1082:** `processor.process(phase, coreState, context)` - вызов процессора
3. **riposte.processor.ts:apply()** - логика рипоста

### 📊 Статус: ПОЛНОСТЬЮ РАБОТАЕТ

Механика рипоста **корректно интегрирована** в симулятор битвы и работает в roguelike режиме! ✅
