# Core Mechanics 2.0 - Quick Reference

## Что это?

**Core Mechanics 2.0** — модульная система боевых механик для roguelike режима. 14 механик организованы в 5 тиеров с автоматическим разрешением зависимостей.

## Быстрый старт

### Включить все механики (Roguelike режим)
```typescript
import { createMechanicsProcessor, ROGUELIKE_PRESET } from '@core/mechanics';

const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

### Отключить все механики (MVP режим)
```typescript
import { createMechanicsProcessor, MVP_PRESET } from '@core/mechanics';

const processor = createMechanicsProcessor(MVP_PRESET);
const result = simulateBattle(state, seed, processor);
// Результат идентичен Core 1.0
```

### Включить только некоторые механики
```typescript
const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  riposte: { initiativeBased: true },
  // Зависимости разрешаются автоматически
});
```

## 14 Механик

### Tier 0: Базовые (1)
| Механика | Описание | Зависит от |
|----------|---------|-----------|
| **Facing** | Направление юнитов (N/S/E/W) | — |

### Tier 1: Основной боевой слой (3)
| Механика | Описание | Зависит от |
|----------|---------|-----------|
| **Resolve** | Боевой дух, отступление/рассыпание | — |
| **Engagement** | Зона контроля, штраф лучникам | — |
| **Flanking** | Фланговые атаки +15% урона | Facing |

### Tier 2: Продвинутые (3)
| Механика | Описание | Зависит от |
|----------|---------|-----------|
| **Riposte** | Контратаки при фронтальной атаке | Flanking |
| **Intercept** | Перехват движущихся врагов | Engagement |
| **Aura** | Пассивные эффекты | — |

### Tier 3: Специализированные (5)
| Механика | Описание | Зависит от |
|----------|---------|-----------|
| **Charge** | Кавалерия +20% урона за клетку | Intercept |
| **Overwatch** | Лучники стреляют при движении | Intercept, Ammunition |
| **Phalanx** | Формирования +1 броня за соседа | Facing |
| **Line of Sight** | Лучники должны видеть цель | Facing |
| **Ammunition** | Боеприпасы и перезарядка | — |

### Tier 4: Контр-механики (2)
| Механика | Описание | Зависит от |
|----------|---------|-----------|
| **Contagion** | Эффекты распространяются на соседей | — |
| **Armor Shred** | Физические атаки ослабляют броню | — |

## Граф зависимостей

```
Tier 4:  contagion  armor_shred
         (независимые)

Tier 3:  phalanx ─── facing
         los ─────── facing
         charge ──── intercept ──── engagement
         overwatch ─ intercept, ammunition
         
Tier 2:  riposte ─── flanking ──── facing
         intercept ─ engagement
         aura (независимая)
         
Tier 1:  resolve (независимая)
         engagement (независимая)
         flanking ─ facing
         
Tier 0:  facing (независимая)
```

## Фазы боя

Каждый раунд проходит через 6 фаз:

```
TURN_START
├── resolve.recovery()      → Восстановление боевого духа
├── ammunition.reload()     → Перезарядка боеприпасов
├── aura.pulse()            → Применение пульсирующих аур
└── phalanx.recalculate()   → Обновление формирований

MOVEMENT
├── engagement.check()      → Проверка зоны контроля
├── intercept.trigger()     → Перехват движущихся врагов
├── overwatch.trigger()     → Стрельба при движении
└── charge.accumulate()     → Накопление импульса

PRE_ATTACK
├── facing.validate()       → Проверка направления
├── flanking.check()        → Определение угла атаки
├── charge.validate()       → Применение бонуса импульса
├── lineOfSight.check()     → Проверка видимости
└── ammunition.consume()    → Расход боеприпасов

ATTACK
├── armorShred.apply()      → Ослабление брони
├── riposte.trigger()       → Контратака
└── contagion.apply()       → Применение эффектов

POST_ATTACK
├── resolve.damage()        → Урон боевому духу
├── phalanx.recalculate()   → Обновление после потерь
└── resolve.stateCheck()    → Проверка отступления/рассыпания

TURN_END
├── contagion.spread()      → Распространение эффектов
├── aura.decay()            → Затухание временных аур
└── overwatch.reset()       → Очистка дозора
```

## Примеры использования

### Пример 1: Фланговая атака

```
Юнит A атакует Юнита B с фланга:

PRE_ATTACK:
  facing.validate() → Юнит B развёрнут на юг, атака с востока
  flanking.check() → Определено: FLANK

ATTACK:
  Базовый урон: 20
  flanking.getDamageModifier('flank') → 1.15
  Итоговый урон: 20 * 1.15 = 23

POST_ATTACK:
  resolve.damage() → Юнит B теряет 12 боевого духа
```

### Пример 2: Контратака

```
Юнит A атакует Юнита B спереди:

PRE_ATTACK:
  flanking.check() → Определено: FRONT

ATTACK:
  riposte.canRiposte() → true (фронтальная атака, есть заряды)
  riposte.getRiposteChance() → 60% (инициатива Юнита B выше)
  roll = 0.45 < 0.60 → Контратака срабатывает!
  riposte.executeRiposte() → Юнит B наносит 50% урона в ответ
```

### Пример 3: Фаланга

```
Три танка стоят рядом:

TURN_START:
  phalanx.recalculate():
    Танк 1: 2 соседа → +2 броня, +10 боевого духа
    Танк 2: 2 соседа → +2 броня, +10 боевого духа
    Танк 3: 2 соседа → +2 броня, +10 боевого духа
```

### Пример 4: Заражение

```
Маг с огнём стоит рядом с двумя врагами:

TURN_END:
  contagion.spread():
    Враг 1: roll = 0.3 < 0.5 (огонь) → Получает огонь
    Враг 2: roll = 0.6 > 0.5 (огонь) → Не получает огонь
```

## Конфигурация

### Resolve Config
```typescript
{
  maxResolve: 100,              // Максимум боевого духа
  baseRegeneration: 5,          // Восстановление за ход
  humanRetreat: true,           // Люди отступают при 0
  undeadCrumble: true,          // Нежить рассыпается при 0
  flankingResolveDamage: 12,    // Урон от фланга
  rearResolveDamage: 20,        // Урон от тыла
}
```

### Flanking Config
```typescript
// Нет конфигурации, только boolean
// Урон: фронт 1.0x, фланг 1.15x, тыл 1.30x
```

### Riposte Config
```typescript
{
  initiativeBased: true,        // Шанс зависит от инициативы
  chargesPerRound: 'attackCount', // Заряды = количество атак
  baseChance: 0.5,              // Базовый шанс 50%
  guaranteedThreshold: 10,      // Гарантия при разнице инициативы 10+
}
```

### Phalanx Config
```typescript
{
  maxArmorBonus: 5,             // Максимум +5 брони
  maxResolveBonus: 25,          // Максимум +25 боевого духа
  armorPerAlly: 1,              // +1 броня за соседа
  resolvePerAlly: 5,            // +5 боевого духа за соседа
}
```

### Charge Config
```typescript
{
  momentumPerCell: 0.2,         // +20% урона за клетку
  maxMomentum: 1.0,             // Максимум +100% урона
  shockResolveDamage: 10,       // Урон боевому духу при ударе
  minChargeDistance: 3,         // Минимум 3 клетки для активации
}
```

### Contagion Config
```typescript
{
  fireSpread: 0.5,              // 50% шанс распространения огня
  poisonSpread: 0.3,            // 30% шанс распространения яда
  curseSpread: 0.25,            // 25% шанс распространения проклятия
  frostSpread: 0.2,             // 20% шанс распространения мороза
  plagueSpread: 0.6,            // 60% шанс распространения чумы
  phalanxSpreadBonus: 0.15,     // +15% в фаланге
}
```

## Пресеты

### MVP_PRESET
Все механики отключены. Результат идентичен Core 1.0.

### ROGUELIKE_PRESET
Все механики включены с балансированными параметрами.

### TACTICAL_PRESET
Только Tier 0-2 механики (Facing, Resolve, Engagement, Flanking, Riposte, Intercept).

## Тестирование

### Unit Tests
```bash
npm test -- backend/src/core/mechanics/tier1/resolve/resolve.spec.ts
npm test -- backend/src/core/mechanics/tier2/riposte/riposte.spec.ts
```

### Integration Tests
```bash
npm test -- backend/src/roguelike/battle/battle.integration.spec.ts
```

### Regression Tests
```bash
npm test -- backend/src/core/mechanics/processor.spec.ts
```

## Миграция

### Из Core 1.0 в Core 2.0

```typescript
// БЫЛО (Core 1.0)
const result = simulateBattle(state, seed);

// СТАЛО (Core 2.0 - MVP режим, идентичный результат)
const processor = createMechanicsProcessor(MVP_PRESET);
const result = simulateBattle(state, seed, processor);

// СТАЛО (Core 2.0 - Roguelike режим)
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

## Часто задаваемые вопросы

**Q: Почему зависимости разрешаются автоматически?**
A: Чтобы избежать ошибок конфигурации. Если вы включаете Riposte, автоматически включаются Flanking и Facing.

**Q: Можно ли отключить механику, если она требуется?**
A: Нет, зависимости разрешаются автоматически. Если вы хотите отключить Facing, отключите все механики, которые от неё зависят.

**Q: Как добавить новую механику?**
A: Создать новый тиер, определить конфигурацию, добавить в граф зависимостей, реализовать процессор.

**Q: Почему MVP режим нужен?**
A: Для обратной совместимости. Старые боевые логи должны воспроизводиться идентично.

**Q: Как тестировать механики?**
A: Unit тесты для каждой механики, интеграционные тесты для взаимодействия, регрессионные тесты для совместимости.

## Ссылки

- **Полная спецификация**: `.kiro/specs/core-mechanics-2.0/design.md`
- **Требования**: `.kiro/specs/core-mechanics-2.0/requirements.md`
- **Задачи**: `.kiro/specs/core-mechanics-2.0/tasks.md`
- **Интеграция с Roguelike**: `docs/ROGUELIKE_MECHANICS_INTEGRATION.md`
- **Roguelike Design**: `docs/ROGUELIKE_DESIGN.md`
