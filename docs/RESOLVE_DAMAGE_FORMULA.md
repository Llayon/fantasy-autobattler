# Формула урона морали (Resolve Damage)

## Новая формула (25% от ATK)

```
Урон морали = ATK атакующего × 0.25 × (1 - сопротивление% цели)
```

### Компоненты

- **ATK атакующего** — базовая атака юнита
- **0.25** — множитель (25% от атаки)
- **сопротивление% цели** — resolveResist юнита (0-50%)

### Примеры расчётов

#### Пример 1: Базовая атака (фронт)

```
Attacker: Knight (ATK: 12)
Target: Footman (resolve: 80, resistResolve: 0)

Урон морали = 12 × 0.25 × (1 - 0) = 3

Footman.resolve: 80 → 77
```

#### Пример 2: Фланговая атака (без дополнительного бонуса)

```
Attacker: Knight (ATK: 12, фланг)
Target: Archer (resolve: 55, resistResolve: 0)

Урон морали = 12 × 0.25 × (1 - 0) = 3

Archer.resolve: 55 → 52
```

#### Пример 3: Атака с тыла (без дополнительного бонуса)

```
Attacker: Rogue (ATK: 10, тыл)
Target: Archer (resolve: 55, resistResolve: 0)

Урон морали = 10 × 0.25 × (1 - 0) = 2.5 ≈ 2

Archer.resolve: 55 → 53
```

#### Пример 4: Апгрейдированный юнит с сопротивлением

```
Attacker: Knight (ATK: 12)
Target: Knight T2 (resolve: 100, resistResolve: 10)

Урон морали = 12 × 0.25 × (1 - 0.10) = 3 × 0.9 = 2.7 ≈ 3

Knight.resolve: 100 → 97
```

#### Пример 5: Сильный юнит против слабого

```
Attacker: Paladin T3 (ATK: 18)
Target: Rogue (resolve: 60, resistResolve: 0)

Урон морали = 18 × 0.25 × (1 - 0) = 4.5 ≈ 4

Rogue.resolve: 60 → 56
```

#### Пример 6: Слабый юнит против сильного

```
Attacker: Footman (ATK: 8)
Target: Paladin T3 (resolve: 130, resistResolve: 20)

Урон морали = 8 × 0.25 × (1 - 0.20) = 2 × 0.8 = 1.6 ≈ 2

Paladin.resolve: 130 → 128
```

#### Пример 7: Восстановление морали

```
TURN_START:
  Footman.resolve = 77
  
  Footman.resolve = min(80, 77 + 5) = 80
```

#### Пример 8: Отступление (Humans)

```
Archer.resolve = 2

POST_ATTACK (Knight атакует):
  Урон морали = 12 × 0.25 = 3
  Archer.resolve = 2 - 3 = -1 → 0
  
  Archer.state = 'routing' (отступает)
  // Юнит больше не может атаковать, пытается убежать
```

#### Пример 9: Рассыпание (Undead)

```
Skeleton.resolve = 100 (всегда)

POST_ATTACK (Knight атакует):
  Урон морали = 12 × 0.25 = 3
  Skeleton.resolve = 100 - 3 = 97
  
  // Нежить не может упасть ниже 0, но может быть ослаблена
```

---

## Сравнение с предыдущей формулой

### Старая формула (фиксированные значения)
```
Фланг: 12 урона
Тыл: 20 урона
```

### Новая формула (25% от ATK)
```
Зависит от силы атакующего:
- Слабый юнит (ATK: 8): 2 урона
- Средний юнит (ATK: 12): 3 урона
- Сильный юнит (ATK: 18): 4.5 ≈ 4 урона
```

### Преимущества новой формулы

1. **Масштабируемость** — урон морали растёт с силой юнита
2. **Баланс** — слабые юниты не наносят слишком много урона морали
3. **Прогрессия** — апгрейды T2/T3 имеют смысл для урона морали
4. **Сопротивление** — более эффективно против слабых атак

---

## Конфигурация

### ResolveConfig

```typescript
interface ResolveConfig {
  maxResolve: 100;                    // Максимум морали
  baseRegeneration: 5;                // Восстановление за ход
  humanRetreat: true;                 // Люди отступают при 0
  undeadCrumble: true;                // Нежить рассыпается при 0
  resolveDamageMultiplier: 0.25;      // 25% от ATK
  flankingResolveDamageBonus: 0;      // Без дополнительного бонуса
  rearResolveDamageBonus: 0;          // Без дополнительного бонуса
}
```

### Возможные варианты конфигурации

Если позже захочешь добавить бонусы за фланг/тыл:

```typescript
// Вариант 1: Фиксированные бонусы
{
  resolveDamageMultiplier: 0.25,
  flankingResolveDamageBonus: 1,      // +1 к урону морали
  rearResolveDamageBonus: 2,          // +2 к урону морали
}

// Вариант 2: Процентные бонусы
{
  resolveDamageMultiplier: 0.25,
  flankingResolveDamageBonus: 0.1,    // +10% к урону морали
  rearResolveDamageBonus: 0.2,        // +20% к урону морали
}

// Вариант 3: Множители
{
  resolveDamageMultiplier: 0.25,
  flankingResolveDamageMultiplier: 1.5,  // ×1.5 урона морали
  rearResolveDamageMultiplier: 2.0,      // ×2.0 урона морали
}
```

---

## Реализация

### Псевдокод

```typescript
function calculateResolveDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  arc: AttackArc,
  config: ResolveConfig
): number {
  // Базовый урон морали
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
  
  // Округлить
  return Math.round(damage);
}
```

### Применение урона

```typescript
function applyResolveDamage(
  target: BattleUnit,
  damage: number,
  config: ResolveConfig
): BattleUnit {
  const newResolve = Math.max(0, target.resolve - damage);
  
  return {
    ...target,
    resolve: newResolve,
  };
}
```

### Проверка состояния

```typescript
function checkResolveState(
  unit: BattleUnit,
  config: ResolveConfig
): 'active' | 'routing' | 'crumbled' {
  if (unit.resolve > 0) return 'active';
  
  if (unit.faction === 'undead' && config.undeadCrumble) {
    return 'crumbled';
  }
  
  if (unit.faction !== 'undead' && config.humanRetreat) {
    return 'routing';
  }
  
  return 'active';
}
```

---

## Тестовые случаи

```typescript
describe('Resolve Damage Calculation', () => {
  const config: ResolveConfig = {
    maxResolve: 100,
    baseRegeneration: 5,
    humanRetreat: true,
    undeadCrumble: true,
    resolveDamageMultiplier: 0.25,
    flankingResolveDamageBonus: 0,
    rearResolveDamageBonus: 0,
  };
  
  it('should calculate 25% of attacker ATK', () => {
    const attacker = { atk: 12 };
    const target = { resolveResist: 0 };
    
    const damage = calculateResolveDamage(attacker, target, 'front', config);
    expect(damage).toBe(3);  // 12 × 0.25 = 3
  });
  
  it('should apply resistance to resolve damage', () => {
    const attacker = { atk: 12 };
    const target = { resolveResist: 10 };  // 10% resistance
    
    const damage = calculateResolveDamage(attacker, target, 'front', config);
    expect(damage).toBe(3);  // 12 × 0.25 × (1 - 0.10) = 2.7 ≈ 3
  });
  
  it('should reduce resolve by damage amount', () => {
    const unit = { resolve: 80 };
    const updated = applyResolveDamage(unit, 3, config);
    
    expect(updated.resolve).toBe(77);
  });
  
  it('should not go below 0 resolve', () => {
    const unit = { resolve: 2 };
    const updated = applyResolveDamage(unit, 5, config);
    
    expect(updated.resolve).toBe(0);
  });
  
  it('should trigger routing when human resolve = 0', () => {
    const unit = { resolve: 0, faction: 'humans' };
    const state = checkResolveState(unit, config);
    
    expect(state).toBe('routing');
  });
  
  it('should trigger crumble when undead resolve = 0', () => {
    const unit = { resolve: 0, faction: 'undead' };
    const state = checkResolveState(unit, config);
    
    expect(state).toBe('crumbled');
  });
});
```

---

## Ссылки

- **Core Mechanics 2.0 Design**: `.kiro/specs/core-mechanics-2.0/design.md`
- **Roguelike Design**: `docs/ROGUELIKE_DESIGN.md`
- **Resolve System Current**: `docs/RESOLVE_SYSTEM_CURRENT.md`
