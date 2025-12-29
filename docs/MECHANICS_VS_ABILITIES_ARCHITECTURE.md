# Архитектура: Core 2.0 Механики vs MVP Абилки

## Проблема: Дублирование?

**Короткий ответ: НЕТ дублирования, если правильно разделить ответственность.**

Core 2.0 механики и MVP абилки работают на **разных уровнях абстракции**:

```
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE SIMULATOR                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CORE 2.0 MECHANICS LAYER (Tier 0-4)                │   │
│  │  ════════════════════════════════════════════════    │   │
│  │  Системные механики, применяемые ко ВСЕМ юнитам     │   │
│  │  - Facing (направление)                             │   │
│  │  - Resolve (боевой дух)                             │   │
│  │  - Flanking (фланговые атаки)                        │   │
│  │  - Engagement (зона контроля)                        │   │
│  │  - Charge (атака с разбега)                          │   │
│  │  - Phalanx (формирования)                            │   │
│  │  - Contagion (распространение эффектов)             │   │
│  │  - И т.д.                                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▲                                   │
│                          │ Применяется ко всем юнитам       │
│                          │                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MVP ABILITIES LAYER (Unit-specific)                │   │
│  │  ════════════════════════════════════════════════    │   │
│  │  Уникальные абилки конкретных юнитов                │   │
│  │  - Knight: Shield Wall (баф броне)                   │   │
│  │  - Mage: Fireball (AoE урон)                         │   │
│  │  - Priest: Heal (восстановление HP)                  │   │
│  │  - Rogue: Backstab (пассивный бонус)                │   │
│  │  - И т.д.                                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Разделение ответственности

### Core 2.0 Механики (Системные)

**Что это:**
- Универсальные правила, применяемые ко ВСЕМ юнитам
- Определяют, КАК работает боевая система
- Не зависят от конкретного юнита

**Примеры:**
- **Facing**: Все юниты имеют направление (N/S/E/W)
- **Resolve**: Все юниты теряют боевой дух от фланговых атак
- **Flanking**: Все атаки с фланга наносят +15% урона
- **Engagement**: Все юниты в ближнем бою не могут свободно двигаться

**Когда применяются:**
- На определённых фазах боя (TURN_START, PRE_ATTACK, POST_ATTACK и т.д.)
- Автоматически для всех юнитов
- Через MechanicsProcessor

### MVP Абилки (Специфичные)

**Что это:**
- Уникальные способности конкретных юнитов
- Определяют, ЧТО может делать конкретный юнит
- Зависят от типа юнита

**Примеры:**
- **Knight**: Shield Wall — увеличивает броню на 50%
- **Mage**: Fireball — наносит 30 магического урона в AoE
- **Priest**: Heal — восстанавливает 25 HP союзнику
- **Rogue**: Backstab — пассивный бонус +100% урона сзади

**Когда применяются:**
- Когда юнит активирует абилку (активные)
- Когда срабатывают условия (пассивные)
- Через AbilityExecutor

---

## Примеры: Как они работают вместе

### Пример 1: Knight атакует Archer с фланга

```
ФАЗА: PRE_ATTACK
├─ Core 2.0: Facing Processor
│  └─ Определяет, что Knight атакует Archer с фланга (не спереди)
│
├─ Core 2.0: Flanking Processor
│  └─ Применяет +15% урона за фланговую атаку
│
└─ MVP: Knight's Shield Wall (если активна)
   └─ Может быть активирована вместо атаки

ФАЗА: ATTACK
├─ Core 2.0: Riposte Processor
│  └─ Проверяет, может ли Archer контратаковать (нет, т.к. фланг)
│
└─ MVP: Archer's Volley (если активна)
   └─ Может быть активирована вместо обычной атаки

ФАЗА: POST_ATTACK
├─ Core 2.0: Resolve Processor
│  └─ Применяет урон боевому духу (25% от ATK Knight)
│
└─ MVP: Rogue's Backstab (если Rogue атакует)
   └─ Пассивный бонус +100% урона сзади
```

### Пример 2: Mage использует Fireball

```
ФАЗА: PRE_ATTACK
├─ Core 2.0: Facing Processor
│  └─ Определяет направление Mage
│
├─ Core 2.0: Line of Sight Processor
│  └─ Проверяет, видит ли Mage цели (если LoS включён)
│
└─ MVP: Mage's Fireball
   └─ Активная абилка, требует выбора цели

ФАЗА: ATTACK
├─ Core 2.0: Contagion Processor
│  └─ Проверяет, распространяются ли эффекты огня
│
└─ MVP: Fireball Effect
   └─ Наносит 30 магического урона в AoE

ФАЗА: POST_ATTACK
├─ Core 2.0: Resolve Processor
│  └─ Применяет урон боевому духу (если есть)
│
└─ MVP: Warlock's Drain Life (если Warlock атакует)
   └─ Пассивный lifesteal от урона
```

### Пример 3: Priest использует Heal

```
ФАЗА: PRE_ATTACK
├─ Core 2.0: Engagement Processor
│  └─ Проверяет, может ли Priest двигаться (если в ближнем бою)
│
└─ MVP: Priest's Heal
   └─ Активная абилка, требует выбора союзника

ФАЗА: ATTACK
├─ Core 2.0: Phalanx Processor
│  └─ Проверяет, получает ли Priest бонусы от формирования
│
└─ MVP: Heal Effect
   └─ Восстанавливает 25 HP + 50% от ATK Priest

ФАЗА: POST_ATTACK
├─ Core 2.0: Resolve Processor
│  └─ Восстанавливает боевой дух (если включено)
│
└─ MVP: Priest's Inspiring Trait
   └─ Пассивный бонус +5 боевого духа соседям
```

---

## Как избежать дублирования

### ✅ ПРАВИЛЬНО: Разделение по уровням

```typescript
// CORE 2.0: Системная механика (применяется ко ВСЕМ)
function applyFlankingDamageBonus(
  baseDamage: number,
  arc: AttackArc
): number {
  if (arc === 'flank') return baseDamage * 1.15;  // +15%
  if (arc === 'rear') return baseDamage * 1.30;   // +30%
  return baseDamage;
}

// MVP: Специфичная абилка (только для Knight)
function executeShieldWall(unit: BattleUnit): BattleUnit {
  return {
    ...unit,
    statusEffects: [{
      type: 'buff',
      stat: 'armor',
      value: unit.stats.armor * 0.5,  // +50% броне
      duration: 2,
    }],
  };
}

// Использование в боевом симуляторе:
let damage = calculateBaseDamage(attacker, target);
damage = applyFlankingDamageBonus(damage, arc);  // Core 2.0
damage = applyShieldWallBonus(damage, target);   // MVP (если активна)
```

### ❌ НЕПРАВИЛЬНО: Дублирование логики

```typescript
// ❌ ПЛОХО: Flanking логика в абилке
function executeBackstab(unit: BattleUnit, target: BattleUnit): number {
  let damage = unit.stats.atk;
  
  // Это должно быть в Core 2.0, не в абилке!
  if (isAttackingFromBehind(unit, target)) {
    damage *= 2;  // +100% урона
  }
  
  return damage;
}

// ❌ ПЛОХО: Resolve логика в абилке
function executeFireball(unit: BattleUnit, targets: BattleUnit[]): void {
  for (const target of targets) {
    // Это должно быть в Core 2.0, не в абилке!
    target.resolve -= 10;  // Урон боевому духу
  }
}
```

---

## Интеграция в боевой симулятор

### Текущая архитектура (MVP)

```typescript
// backend/src/battle/battle.simulator.ts
function simulateBattle(state: BattleState, seed: number): BattleResult {
  for (const unit of turnQueue) {
    const action = decideAction(unit, state);
    
    if (action.type === 'attack') {
      // 1. Вычислить базовый урон
      let damage = calculatePhysicalDamage(attacker, target);
      
      // 2. Применить MVP абилки (если активны)
      if (attacker.ability === 'backstab') {
        damage *= 2;  // +100% урона сзади
      }
      
      // 3. Применить урон
      target.currentHp -= damage;
    }
  }
}
```

### Новая архитектура (Core 2.0 + MVP)

```typescript
// backend/src/battle/battle.simulator.ts
function simulateBattle(
  state: BattleState,
  seed: number,
  processor?: MechanicsProcessor  // ← Core 2.0
): BattleResult {
  for (const unit of turnQueue) {
    // TURN_START фаза
    if (processor) {
      state = processor.process('turn_start', state, { activeUnit: unit });
    }
    
    const action = decideAction(unit, state);
    
    if (action.type === 'attack') {
      // PRE_ATTACK фаза (Core 2.0)
      if (processor) {
        state = processor.process('pre_attack', state, {
          activeUnit: unit,
          target,
          action,
        });
      }
      
      // Вычислить базовый урон
      let damage = calculatePhysicalDamage(attacker, target);
      
      // Применить Core 2.0 механики
      const arc = processor?.processors.facing?.getAttackArc(attacker, target);
      damage = processor?.processors.flanking?.getDamageModifier(arc) ?? 1.0 * damage;
      
      // Применить MVP абилки (если активны)
      if (attacker.ability === 'backstab' && isFromBehind(arc)) {
        damage *= 2;  // +100% урона сзади
      }
      
      // ATTACK фаза (Core 2.0)
      if (processor) {
        state = processor.process('attack', state, {
          activeUnit: unit,
          target,
        });
      }
      
      // Применить урон
      target.currentHp -= damage;
      
      // POST_ATTACK фаза (Core 2.0)
      if (processor) {
        state = processor.process('post_attack', state, {
          activeUnit: unit,
          target,
        });
      }
    }
    
    // TURN_END фаза
    if (processor) {
      state = processor.process('turn_end', state, { activeUnit: unit });
    }
  }
}
```

---

## Правила для разработчиков

### ✅ Что должно быть в Core 2.0

- Системные правила, применяемые ко ВСЕМ юнитам
- Механики, которые влияют на боевую систему в целом
- Примеры:
  - Facing (направление)
  - Resolve (боевой дух)
  - Flanking (фланговые атаки)
  - Engagement (зона контроля)
  - Charge (атака с разбега)
  - Phalanx (формирования)
  - Contagion (распространение эффектов)

### ✅ Что должно быть в MVP Абилках

- Уникальные способности конкретных юнитов
- Механики, которые применяются только к определённому юниту
- Примеры:
  - Knight: Shield Wall
  - Mage: Fireball
  - Priest: Heal
  - Rogue: Backstab (пассивный бонус)
  - Warlock: Drain Life (lifesteal)

### ❌ Что НЕ должно быть в обоих

- Дублирование логики
- Жёсткие зависимости между слоями
- Специфичная логика в Core 2.0
- Системная логика в MVP абилках

---

## Пример: Resolve система

### Core 2.0 (Системная)

```typescript
// backend/src/core/mechanics/tier1/resolve/resolve.processor.ts

/**
 * Применяет урон боевому духу от фланговой атаки.
 * Применяется ко ВСЕМ юнитам, независимо от их абилок.
 */
function applyResolveDamage(
  target: BattleUnit,
  attacker: BattleUnit,
  arc: AttackArc,
  config: ResolveConfig
): number {
  // Базовый урон морали = 25% от ATK атакующего
  let damage = attacker.atk * config.resolveDamageMultiplier;
  
  // Добавить бонус за фланг/тыл (если нужно)
  if (arc === 'flank') {
    damage += config.flankingResolveDamageBonus;
  } else if (arc === 'rear') {
    damage += config.rearResolveDamageBonus;
  }
  
  // Применить сопротивление цели
  const resistance = target.resolveResist / 100;
  damage = damage * (1 - resistance);
  
  return Math.round(damage);
}
```

### MVP (Специфичная)

```typescript
// backend/src/battle/passive.abilities.ts

/**
 * Rogue's Backstab: Пассивный бонус +100% урона сзади.
 * Применяется ТОЛЬКО к Rogue, независимо от Core 2.0.
 */
function applyBackstabBonus(
  attacker: BattleUnit,
  arc: AttackArc
): number {
  if (attacker.id !== 'rogue') return 1.0;
  if (arc !== 'rear') return 1.0;
  
  return 2.0;  // +100% урона
}
```

### Использование в боевом симуляторе

```typescript
// Фаза: POST_ATTACK
const resolveDamage = applyResolveDamage(target, attacker, arc, config);
target.resolve -= resolveDamage;  // Core 2.0

// Фаза: ATTACK (для физического урона)
let damage = calculatePhysicalDamage(attacker, target);
damage *= applyBackstabBonus(attacker, arc);  // MVP
target.currentHp -= damage;
```

---

## Миграция MVP → Core 2.0

### Шаг 1: MVP остаётся как есть

```typescript
// backend/src/battle/ability.executor.ts
// Все текущие абилки работают без изменений
```

### Шаг 2: Добавить Core 2.0 механики

```typescript
// backend/src/core/mechanics/processor.ts
// Новые механики применяются параллельно
```

### Шаг 3: Интегрировать в боевой симулятор

```typescript
// backend/src/battle/battle.simulator.ts
// Использовать MechanicsProcessor для Core 2.0
// Использовать AbilityExecutor для MVP абилок
```

### Шаг 4: Тестирование

```typescript
// Убедиться, что:
// 1. MVP абилки работают как раньше (без Core 2.0)
// 2. Core 2.0 механики работают правильно
// 3. Вместе они не конфликтуют
```

---

## Заключение

**Core 2.0 механики и MVP абилки НЕ дублируют друг друга, потому что:**

1. **Разные уровни абстракции**
   - Core 2.0: Системные правила для ВСЕХ юнитов
   - MVP: Специфичные способности конкретных юнитов

2. **Разные фазы боя**
   - Core 2.0: Применяется на определённых фазах (TURN_START, PRE_ATTACK, POST_ATTACK и т.д.)
   - MVP: Применяется при активации абилки или срабатывании условия

3. **Разные области ответственности**
   - Core 2.0: Как работает боевая система
   - MVP: Что может делать конкретный юнит

4. **Легко расширяется**
   - Добавить новую Core 2.0 механику: просто создать новый Processor
   - Добавить новую MVP абилку: просто добавить в ABILITIES
   - Они не конфликтуют, потому что работают независимо

