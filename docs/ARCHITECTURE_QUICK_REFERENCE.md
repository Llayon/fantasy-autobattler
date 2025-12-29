# Архитектура: Быстрая справка

## Три слоя боевой системы

```
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE SIMULATOR                          │
│                  (battle.simulator.ts)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  CORE 1.0    │ │  CORE 2.0    │ │  MVP LAYER   │
        │  (Grid/Turn) │ │ (Mechanics)  │ │ (Abilities)  │
        └──────────────┘ └──────────────┘ └──────────────┘
```

---

## CORE 1.0: Базовая боевая система

**Файлы:**
- `backend/src/core/grid/` — Сетка, A* pathfinding
- `backend/src/core/battle/` — Урон, очередь ходов, таргетинг

**Что делает:**
- Управляет сеткой 8×10
- Вычисляет урон (физический, магический)
- Определяет очередь ходов
- Находит цели для атак

**Пример:**
```typescript
const damage = calculatePhysicalDamage(attacker, target);
// Результат: 12 урона (базовый расчёт)
```

---

## CORE 2.0: Модульные механики

**Файлы:**
- `backend/src/core/mechanics/` — 14 механик в 5 тиерах

**Что делает:**
- Применяет системные правила ко ВСЕМ юнитам
- Работает через фазы боя (TURN_START, PRE_ATTACK, POST_ATTACK и т.д.)
- Можно включать/отключать через feature flags

**Механики:**
- **Tier 0:** Facing (направление)
- **Tier 1:** Resolve, Engagement, Flanking
- **Tier 2:** Riposte, Intercept, Aura
- **Tier 3:** Charge, Overwatch, Phalanx, LoS, Ammunition
- **Tier 4:** Contagion, Armor Shred

**Пример:**
```typescript
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
state = processor.process('pre_attack', state, { activeUnit, target });
// Результат: Применены все включённые механики
```

---

## MVP LAYER: Специфичные абилки

**Файлы:**
- `backend/src/battle/ability.executor.ts` — Выполнение абилок
- `backend/src/battle/passive.abilities.ts` — Пассивные абилки
- `backend/src/game/abilities/ability.data.ts` — Данные абилок

**Что делает:**
- Выполняет уникальные способности конкретных юнитов
- Управляет активными и пассивными абилками
- Применяет эффекты (урон, исцеление, баффы, дебаффы)

**Абилки (15 всего):**
- Knight: Shield Wall (баф броне)
- Mage: Fireball (AoE урон)
- Priest: Heal (восстановление HP)
- Rogue: Backstab (пассивный бонус)
- И т.д.

**Пример:**
```typescript
const events = executeAbility(mage, fireballAbility, targetPosition, state, seed);
// Результат: Fireball наносит 30 магического урона в AoE
```

---

## Как они работают вместе

### Сценарий: Knight атакует Archer с фланга

```
1. CORE 1.0: Вычислить базовый урон
   damage = calculatePhysicalDamage(knight, archer)
   // damage = 12

2. CORE 2.0: Применить Flanking механику
   damage *= 1.15  // +15% за фланг
   // damage = 13.8 ≈ 14

3. MVP: Применить Knight's Shield Wall (если активна)
   // Может быть активирована вместо атаки

4. CORE 2.0: Применить Resolve урон
   archer.resolve -= 14 * 0.25  // 25% от ATK
   // archer.resolve -= 3

5. MVP: Применить Rogue's Backstab (если Rogue атакует)
   // Пассивный бонус +100% урона сзади
```

---

## Когда использовать каждый слой

### CORE 1.0 (Всегда)
- Базовые расчёты урона
- Управление сеткой
- Очередь ходов
- Таргетинг

### CORE 2.0 (Для Roguelike режима)
- Включить через `ROGUELIKE_PRESET`
- Применяется ко ВСЕМ юнитам
- Добавляет глубину и стратегичность

### MVP (Всегда)
- Уникальные способности юнитов
- Активные абилки (требуют выбора)
- Пассивные абилки (срабатывают автоматически)

---

## Интеграция в боевой симулятор

```typescript
// backend/src/battle/battle.simulator.ts

function simulateBattle(
  state: BattleState,
  seed: number,
  processor?: MechanicsProcessor  // ← Core 2.0 (опционально)
): BattleResult {
  for (const unit of turnQueue) {
    // CORE 2.0: TURN_START фаза
    if (processor) {
      state = processor.process('turn_start', state, { activeUnit: unit });
    }
    
    const action = decideAction(unit, state);
    
    if (action.type === 'attack') {
      // CORE 2.0: PRE_ATTACK фаза
      if (processor) {
        state = processor.process('pre_attack', state, {
          activeUnit: unit,
          target,
        });
      }
      
      // CORE 1.0: Вычислить базовый урон
      let damage = calculatePhysicalDamage(unit, target);
      
      // CORE 2.0: Применить Flanking
      const arc = processor?.processors.facing?.getAttackArc(unit, target);
      if (arc === 'flank') damage *= 1.15;
      
      // MVP: Применить абилки
      if (unit.ability === 'backstab' && arc === 'rear') {
        damage *= 2;
      }
      
      // CORE 2.0: ATTACK фаза
      if (processor) {
        state = processor.process('attack', state, {
          activeUnit: unit,
          target,
        });
      }
      
      // Применить урон
      target.currentHp -= damage;
      
      // CORE 2.0: POST_ATTACK фаза
      if (processor) {
        state = processor.process('post_attack', state, {
          activeUnit: unit,
          target,
        });
      }
    }
    
    // CORE 2.0: TURN_END фаза
    if (processor) {
      state = processor.process('turn_end', state, { activeUnit: unit });
    }
  }
}
```

---

## Конфигурация

### MVP режим (текущий)
```typescript
// Используется только CORE 1.0 + MVP
const result = simulateBattle(state, seed);
// Нет processor → Core 2.0 механики отключены
```

### Roguelike режим (новый)
```typescript
// Используется CORE 1.0 + CORE 2.0 + MVP
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
// processor включает все 14 механик
```

### Кастомный режим
```typescript
// Используется CORE 1.0 + выбранные CORE 2.0 + MVP
const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  resolve: { /* config */ },
  // Остальные механики отключены
});
const result = simulateBattle(state, seed, processor);
```

---

## Файловая структура

```
backend/src/
├── core/
│   ├── grid/                    # CORE 1.0: Сетка
│   │   ├── grid.ts
│   │   └── pathfinding.ts
│   ├── battle/                  # CORE 1.0: Боевые расчёты
│   │   ├── damage.ts
│   │   ├── turn-order.ts
│   │   └── targeting.ts
│   └── mechanics/               # CORE 2.0: Модульные механики
│       ├── config/
│       ├── tier0/
│       ├── tier1/
│       ├── tier2/
│       ├── tier3/
│       ├── tier4/
│       └── processor.ts
├── battle/
│   ├── ability.executor.ts      # MVP: Выполнение абилок
│   ├── passive.abilities.ts     # MVP: Пассивные абилки
│   └── battle.simulator.ts      # Интеграция всех слоёв
├── game/
│   └── abilities/
│       └── ability.data.ts      # MVP: Данные абилок
└── ...
```

---

## Ключевые моменты

✅ **Нет дублирования:**
- Core 2.0 работает на системном уровне
- MVP работает на уровне конкретного юнита
- Они дополняют друг друга

✅ **Легко расширяется:**
- Добавить новую Core 2.0 механику: просто создать новый Processor
- Добавить новую MVP абилку: просто добавить в ABILITIES
- Они не конфликтуют

✅ **Обратная совместимость:**
- MVP режим работает без Core 2.0 (как раньше)
- Core 2.0 можно включить/отключить через feature flags
- Миграция плавная и безопасная

✅ **Тестируемо:**
- Каждый слой можно тестировать отдельно
- Интеграционные тесты проверяют взаимодействие
- Детерминированные результаты (seeded random)

