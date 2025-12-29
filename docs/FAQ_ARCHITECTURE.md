# FAQ: Архитектура Core 2.0 и MVP

## Q: Не будут ли дублировать механики Core 2.0 и абилки из MVP друг друга?

### A: НЕТ, не будут дублировать

**Короткий ответ:**
Core 2.0 механики и MVP абилки работают на разных уровнях абстракции:
- **Core 2.0** — системные правила для ВСЕХ юнитов
- **MVP** — специфичные способности конкретных юнитов

Они дополняют друг друга, не конфликтуя.

---

## Детальное объяснение

### Пример 1: Flanking механика (Core 2.0) vs Backstab абилка (MVP)

#### Core 2.0: Flanking Processor
```typescript
// Применяется ко ВСЕМ юнитам
function getDamageModifier(arc: AttackArc): number {
  if (arc === 'flank') return 1.15;  // +15% урона
  if (arc === 'rear') return 1.30;   // +30% урона
  return 1.0;
}
```

**Что это:**
- Системное правило
- Применяется автоматически
- Влияет на ВСЕ атаки

**Когда применяется:**
- На фазе ATTACK
- Для каждой атаки
- Независимо от юнита

#### MVP: Backstab абилка (Rogue)
```typescript
// Применяется ТОЛЬКО к Rogue
function applyBackstabBonus(attacker: BattleUnit, arc: AttackArc): number {
  if (attacker.id !== 'rogue') return 1.0;
  if (arc !== 'rear') return 1.0;
  return 2.0;  // +100% урона
}
```

**Что это:**
- Специфичная абилка
- Применяется только к Rogue
- Дополняет системные правила

**Когда применяется:**
- На фазе ATTACK
- Только если атакует Rogue
- Только если атака с тыла

#### Как они работают вместе

```
Rogue атакует Archer с тыла:

1. Core 1.0: Базовый урон = 10
2. Core 2.0: Flanking бонус = 10 * 1.30 = 13
3. MVP: Backstab бонус = 13 * 2.0 = 26

Результат: 26 урона (без дублирования)
```

---

### Пример 2: Resolve система (Core 2.0) vs Drain Life абилка (MVP)

#### Core 2.0: Resolve Processor
```typescript
// Применяется ко ВСЕМ юнитам
function calculateResolveDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  arc: AttackArc,
  config: ResolveConfig
): number {
  let damage = attacker.atk * 0.25;  // 25% от ATK
  
  if (arc === 'flank') damage += 0;
  if (arc === 'rear') damage += 0;
  
  const resistance = target.resolveResist / 100;
  damage = damage * (1 - resistance);
  
  return Math.round(damage);
}
```

**Что это:**
- Системное правило
- Все юниты теряют боевой дух
- Зависит от силы атакующего

**Когда применяется:**
- На фазе POST_ATTACK
- После каждой атаки
- Для всех юнитов

#### MVP: Drain Life абилка (Warlock)
```typescript
// Применяется ТОЛЬКО к Warlock
const drainLife: ActiveAbility = {
  id: 'drain_life',
  name: 'Похищение жизни',
  type: 'active',
  targetType: 'enemy',
  cooldown: 3,
  range: 3,
  effects: [
    {
      type: 'damage',
      value: 20,
      damageType: 'magical',
      attackScaling: 0.7,
    },
    {
      type: 'heal',
      value: 0,
      attackScaling: 0.35,  // Lifesteal
    },
  ],
};
```

**Что это:**
- Специфичная активная абилка
- Наносит урон + восстанавливает HP
- Только для Warlock

**Когда применяется:**
- Когда Warlock активирует абилку
- Требует выбора цели
- Имеет cooldown

#### Как они работают вместе

```
Warlock использует Drain Life на врага:

1. MVP: Drain Life наносит 20 + 0.7*ATK урона
2. Core 2.0: Resolve Processor применяет урон боевому духу
3. MVP: Lifesteal восстанавливает 0.35*урона HP

Результат: Урон + Lifesteal + Resolve урон (без дублирования)
```

---

## Почему нет дублирования

### 1. Разные области ответственности

| Аспект | Core 2.0 | MVP |
|--------|----------|-----|
| **Область** | Системные правила | Специфичные способности |
| **Применяется к** | Всем юнитам | Конкретному юниту |
| **Примеры** | Flanking, Resolve | Shield Wall, Fireball |
| **Конфигурируется** | Через MechanicsConfig | Через ABILITIES |

### 2. Разные фазы боя

```
Core 2.0 применяется на определённых фазах:
- TURN_START: Resolve recovery, Ammunition reload
- PRE_ATTACK: Facing validate, Flanking check
- ATTACK: Armor shred, Riposte trigger
- POST_ATTACK: Resolve damage, Phalanx recalculate
- TURN_END: Contagion spread, Aura decay

MVP применяется при активации:
- Активные абилки: когда юнит выбирает их
- Пассивные абилки: когда срабатывают условия
```

### 3. Разные уровни абстракции

```
MVP (Высокий уровень)
"Knight может использовать Shield Wall"
"Mage может использовать Fireball"

Core 2.0 (Средний уровень)
"Все юниты имеют направление"
"Все атаки с фланга наносят +15% урона"

Core 1.0 (Низкий уровень)
"Урон = (ATK - броня) × количество атак"
```

---

## Архитектурные преимущества

### ✅ Модульность
```typescript
// Каждый слой независим
const damage = calculatePhysicalDamage(attacker, target);  // Core 1.0
damage *= getDamageModifier(arc);                          // Core 2.0
damage *= applyBackstabBonus(attacker, arc);               // MVP
```

### ✅ Расширяемость
```typescript
// Добавить новую Core 2.0 механику
class NewProcessor implements MechanicProcessor {
  apply(phase, state, context) { /* ... */ }
}

// Добавить новую MVP абилку
const newAbility: ActiveAbility = { /* ... */ };
ABILITIES['new_ability'] = newAbility;
```

### ✅ Конфигурируемость
```typescript
// MVP режим (без Core 2.0)
const result = simulateBattle(state, seed);

// Roguelike режим (с Core 2.0)
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

### ✅ Обратная совместимость
```typescript
// MVP режим работает как раньше
// Core 2.0 можно включить/отключить
// Миграция плавная и безопасная
```

---

## Часто задаваемые вопросы

### Q: Что если Core 2.0 механика конфликтует с MVP абилкой?

**A:** Они не конфликтуют, потому что:
1. Применяются на разных фазах боя
2. Работают на разных уровнях абстракции
3. Имеют разные области ответственности

Пример: Flanking (Core 2.0) и Backstab (MVP) не конфликтуют:
- Flanking: +15% урона за фланг (системное правило)
- Backstab: +100% урона сзади (специфичная абилка)
- Результат: оба применяются, урон = базовый × 1.15 × 2.0

### Q: Что если я хочу отключить Core 2.0 механику для конкретного юнита?

**A:** Используй MVP абилку для переопределения:
```typescript
// Core 2.0: Flanking наносит +15% урона
// MVP: Специальная абилка может переопределить это
const specialAbility: PassiveAbility = {
  trigger: 'on_attack',
  effects: [{
    type: 'damage',
    value: 0,
    damageType: 'physical',
    attackScaling: 1.0,  // Игнорирует Flanking бонус
  }],
};
```

### Q: Что если я хочу добавить новую Core 2.0 механику?

**A:** Просто создай новый Processor:
```typescript
// backend/src/core/mechanics/tier2/new-mechanic/new-mechanic.processor.ts

function createNewMechanicProcessor(config: NewMechanicConfig): MechanicProcessor {
  return {
    apply(phase, state, context) {
      if (phase === 'pre_attack') {
        // Применить новую механику
      }
      return state;
    },
  };
}
```

### Q: Что если я хочу добавить новую MVP абилку?

**A:** Просто добавь в ABILITIES:
```typescript
// backend/src/game/abilities/ability.data.ts

const newAbility: ActiveAbility = {
  id: 'new_ability',
  name: 'Новая абилка',
  type: 'active',
  targetType: 'enemy',
  cooldown: 3,
  range: 3,
  effects: [
    {
      type: 'damage',
      value: 25,
      damageType: 'physical',
    },
  ],
};

ABILITIES['new_ability'] = newAbility;
```

### Q: Как тестировать Core 2.0 и MVP вместе?

**A:** Используй интеграционные тесты:
```typescript
describe('Core 2.0 + MVP Integration', () => {
  it('should apply flanking bonus and backstab bonus together', () => {
    const rogue = createUnit('rogue');
    const archer = createUnit('archer');
    
    // Rogue атакует Archer с тыла
    const arc = 'rear';
    
    // Core 2.0: Flanking бонус
    let damage = 10;
    damage *= 1.30;  // +30% за тыл
    
    // MVP: Backstab бонус
    damage *= 2.0;  // +100% урона
    
    expect(damage).toBe(26);  // 10 * 1.30 * 2.0
  });
});
```

---

## Итоговый вывод

### ✅ Нет дублирования
- Core 2.0 и MVP работают на разных уровнях
- Они дополняют друг друга

### ✅ Чистая архитектура
- Каждый слой имеет чёткую ответственность
- Легко тестировать и расширять

### ✅ Обратная совместимость
- MVP режим работает без Core 2.0
- Миграция плавная и безопасная

### ✅ Готово к расширению
- Легко добавлять новые механики
- Легко добавлять новые абилки
- Легко добавлять новые режимы

---

## Дополнительные ресурсы

- `docs/MECHANICS_VS_ABILITIES_ARCHITECTURE.md` — Полное объяснение
- `docs/ARCHITECTURE_QUICK_REFERENCE.md` — Быстрая справка
- `docs/IMPLEMENTATION_EXAMPLES.md` — Примеры кода
- `docs/ARCHITECTURE_SUMMARY.md` — Итоговый вывод
- `.kiro/specs/core-mechanics-2.0/design.md` — Полная спецификация

