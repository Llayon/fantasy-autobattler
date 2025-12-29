# Архитектура: Итоговый вывод

## Ответ на вопрос: "Не будут ли дублировать механики Core 2.0 и абилки из MVP друг друга?"

### ✅ НЕТ, не будут дублировать

**Причина:** Они работают на разных уровнях абстракции и решают разные задачи.

---

## Три слоя боевой системы

```
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE SIMULATOR                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 3: MVP ABILITIES (Специфичные)                       │
│  ════════════════════════════════════════════════════════   │
│  - Knight: Shield Wall                                      │
│  - Mage: Fireball                                           │
│  - Priest: Heal                                             │
│  - Rogue: Backstab (пассивный бонус)                        │
│  - Warlock: Drain Life (lifesteal)                          │
│  - И т.д. (15 абилок)                                       │
│                                                              │
│  LAYER 2: CORE 2.0 MECHANICS (Системные)                    │
│  ════════════════════════════════════════════════════════   │
│  - Facing (направление)                                     │
│  - Resolve (боевой дух)                                     │
│  - Flanking (фланговые атаки)                               │
│  - Engagement (зона контроля)                               │
│  - Charge (атака с разбега)                                 │
│  - Phalanx (формирования)                                   │
│  - Contagion (распространение эффектов)                     │
│  - И т.д. (14 механик)                                      │
│                                                              │
│  LAYER 1: CORE 1.0 FOUNDATION (Базовые)                     │
│  ════════════════════════════════════════════════════════   │
│  - Grid (сетка 8×10)                                        │
│  - Pathfinding (A* алгоритм)                                │
│  - Damage calculation (расчёт урона)                        │
│  - Turn order (очередь ходов)                               │
│  - Targeting (таргетинг)                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Почему нет дублирования

### 1. Разные области ответственности

| Аспект | Core 1.0 | Core 2.0 | MVP |
|--------|----------|----------|-----|
| **Что делает** | Базовые расчёты | Системные правила | Специфичные способности |
| **Применяется к** | Всем юнитам | Всем юнитам | Конкретному юниту |
| **Когда применяется** | Всегда | На определённых фазах | При активации/условии |
| **Примеры** | Урон, сетка | Flanking, Resolve | Shield Wall, Fireball |

### 2. Разные уровни абстракции

```
MVP (Высокий уровень)
├─ "Knight может использовать Shield Wall"
├─ "Mage может использовать Fireball"
└─ "Rogue получает +100% урона сзади"

Core 2.0 (Средний уровень)
├─ "Все юниты имеют направление (facing)"
├─ "Все юниты теряют боевой дух от фланговых атак"
└─ "Все атаки с фланга наносят +15% урона"

Core 1.0 (Низкий уровень)
├─ "Урон = (ATK - броня) × количество атак"
├─ "Сетка 8×10 с A* pathfinding"
└─ "Очередь ходов по инициативе"
```

### 3. Разные фазы боя

```
TURN_START
├─ Core 2.0: Resolve recovery (+5 за ход)
├─ Core 2.0: Ammunition reload
└─ Core 2.0: Aura pulse

MOVEMENT
├─ Core 2.0: Engagement check
├─ Core 2.0: Intercept trigger
└─ Core 2.0: Charge accumulate

PRE_ATTACK
├─ Core 2.0: Facing validate
├─ Core 2.0: Flanking check
├─ Core 2.0: LoS check
└─ MVP: Ability cooldown check

ATTACK
├─ Core 1.0: Calculate base damage
├─ Core 2.0: Apply flanking bonus
├─ MVP: Apply ability effects
└─ Core 2.0: Armor shred

POST_ATTACK
├─ Core 2.0: Resolve damage
├─ Core 2.0: Phalanx recalculate
└─ MVP: Passive abilities (lifesteal, thorns)

TURN_END
├─ Core 2.0: Contagion spread
├─ Core 2.0: Aura decay
└─ Core 2.0: Overwatch reset
```

---

## Примеры: Как они работают вместе

### Сценарий 1: Rogue атакует Archer с тыла

```
1. Core 1.0: Вычислить базовый урон
   damage = 10 (базовый урон Rogue)

2. Core 2.0: Flanking Processor
   damage *= 1.30  // +30% за тыловую атаку
   damage = 13

3. MVP: Backstab абилка (только для Rogue)
   damage *= 2  // +100% урона сзади
   damage = 26

4. Core 2.0: Resolve Processor
   archer.resolve -= 3  // 25% от ATK Rogue

5. MVP: Passive abilities
   // Если Warlock атакует: lifesteal
   // Если Guardian защищается: thorns
```

### Сценарий 2: Mage использует Fireball

```
1. MVP: Fireball абилка
   - Выбрать целевую позицию
   - Найти всех врагов в AoE (радиус 1)
   - Наносит 30 магического урона

2. Core 2.0: Contagion Processor
   - Проверить, распространяются ли эффекты огня
   - Применить к соседним юнитам

3. Core 2.0: Resolve Processor
   - Применить урон боевому духу (если включено)

4. MVP: Passive abilities
   - Если Warlock атакует: lifesteal
   - Если Guardian защищается: thorns
```

### Сценарий 3: Knight использует Shield Wall

```
1. MVP: Shield Wall абилка
   - Активная абилка Knight
   - Увеличивает броню на 50% на 2 хода

2. Core 2.0: Phalanx Processor
   - Проверить, получает ли Knight бонусы от формирования
   - Добавить +броня за каждого соседа

3. Core 2.0: Resolve Processor
   - Восстановить боевой дух (если включено)

4. MVP: Passive abilities
   - Если Guardian рядом: taunt
   - Если Priest рядом: inspiring
```

---

## Архитектурные преимущества

### ✅ Модульность
- Каждый слой независим
- Можно тестировать отдельно
- Легко добавлять новые механики

### ✅ Расширяемость
- Добавить новую Core 2.0 механику: просто создать новый Processor
- Добавить новую MVP абилку: просто добавить в ABILITIES
- Они не конфликтуют

### ✅ Конфигурируемость
- MVP режим: только Core 1.0 + MVP (как раньше)
- Roguelike режим: Core 1.0 + Core 2.0 + MVP (новое)
- Кастомный режим: выбрать нужные механики

### ✅ Обратная совместимость
- MVP режим работает без Core 2.0
- Core 2.0 можно включить/отключить через feature flags
- Миграция плавная и безопасная

### ✅ Тестируемость
- Каждый слой можно тестировать отдельно
- Интеграционные тесты проверяют взаимодействие
- Детерминированные результаты (seeded random)

---

## Файловая структура

```
backend/src/
├── core/
│   ├── grid/                    # Core 1.0: Сетка
│   │   ├── grid.ts
│   │   └── pathfinding.ts
│   ├── battle/                  # Core 1.0: Боевые расчёты
│   │   ├── damage.ts
│   │   ├── turn-order.ts
│   │   └── targeting.ts
│   └── mechanics/               # Core 2.0: Модульные механи��и
│       ├── config/
│       │   ├── mechanics.types.ts
│       │   ├── dependencies.ts
│       │   ├── defaults.ts
│       │   └── presets/
│       ├── tier0/
│       │   └── facing/
│       ├── tier1/
│       │   ├── resolve/
│       │   ├── engagement/
│       │   └── flanking/
│       ├── tier2/
│       │   ├── riposte/
│       │   ├── intercept/
│       │   └── aura/
│       ├── tier3/
│       │   ├── charge/
│       │   ├── overwatch/
│       │   ├── phalanx/
│       │   ├── los/
│       │   └── ammunition/
│       ├── tier4/
│       │   ├── contagion/
│       │   └── armor-shred/
│       ├── processor.ts
│       └── index.ts
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

## Интеграция в боевой симулятор

### Текущий код (MVP)
```typescript
function simulateBattle(state: BattleState, seed: number): BattleResult {
  // Используется только Core 1.0 + MVP
  // Core 2.0 механики отключены
}
```

### Новый код (Core 2.0 + MVP)
```typescript
function simulateBattle(
  state: BattleState,
  seed: number,
  processor?: MechanicsProcessor  // ← Core 2.0 (опционально)
): BattleResult {
  // Используется Core 1.0 + Core 2.0 (если processor) + MVP
  // Полная интеграция всех слоёв
}
```

---

## Миграция плана

### Phase 1: Подготовка (текущая)
- ✅ Документирование Core 2.0 механик
- ✅ Определение архитектуры
- ✅ Создание примеров кода

### Phase 2: Реализация Core 2.0
- Создать структуру папок
- Реализовать Tier 0-1 механики
- Написать тесты
- Интегрировать в боевой симулятор

### Phase 3: Тестирование
- Убедиться, что MVP режим работает как раньше
- Убедиться, что Core 2.0 механики работают правильно
- Убедиться, что вместе они не конфликтуют

### Phase 4: Развёртывание
- Включить Core 2.0 для Roguelike режима
- Оставить MVP режим без изменений
- Мониторить производительность

---

## Ключевые выводы

### 1. Нет дублирования
- Core 2.0 и MVP работают на разных уровнях
- Они дополняют друг друга, не конфликтуя

### 2. Чистая архитектура
- Каждый слой имеет чёткую ответственность
- Легко тестировать и расширять

### 3. Обратная совместимость
- MVP режим работает без Core 2.0
- Миграция плавная и безопасная

### 4. Готово к расширению
- Легко добавлять новые механики
- Легко добавлять новые абилки
- Легко добавлять новые режимы

### 5. Производительность
- Каждый слой оптимизирован
- Можно отключать ненужные механики
- Детерминированные результаты

---

## Документация

Для более подробной информации см.:
- `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md` — Полное объяснение архитектуры
- `docs/ARCHITECTURE_QUICK_REFERENCE.md` — Быстрая справка
- `docs/IMPLEMENTATION_EXAMPLES.md` — Примеры кода
- `.kiro/specs/core-mechanics-2.0/design.md` — Полная спецификация Core 2.0

