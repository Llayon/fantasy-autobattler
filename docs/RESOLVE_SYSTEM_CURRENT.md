# Текущая реализация системы морали (Resolve)

## Статус

**Resolve система ОПРЕДЕЛЕНА в спецификации, но НЕ РЕАЛИЗОВАНА в боевой системе.**

Текущее состояние:
- ✅ Типы данных определены (`ResolveStats`, `ResolveTrait`)
- ✅ Данные юнитов содержат resolve значения
- ✅ Спецификация написана (Core Mechanics 2.0)
- ❌ Боевая логика НЕ реализована
- ❌ Восстановление морали НЕ реализовано
- ❌ Потеря морали от фланговых атак НЕ реализована

---

## Текущие данные морали

### Humans (Люди)

| Юнит | Resolve | ResistResolve | Trait |
|------|---------|---------------|-------|
| Footman | 80 | 0 | — |
| Knight | 85 | 0 | — |
| Paladin | 90 | 0 | — |
| Rogue | 60 | 0 | — |
| Duelist | 75 | 0 | — |
| Assassin | 80 | 0 | — |
| Archer | 55 | 0 | — |
| Crossbowman | 65 | 0 | — |
| Hunter | 70 | 0 | — |
| Mage | 50 | 0 | — |
| Warlock | 65 | 0 | — |
| Priest | 70 | 0 | inspiring | +8 resolve/turn соседям |

### Undead (Нежить)

| Юнит | Resolve | ResistResolve | Trait |
|------|---------|---------------|-------|
| Skeleton | 100 | 0 | — |
| Zombie | 100 | 0 | — |
| Ghoul | 100 | 0 | — |
| Skeleton Warrior | 100 | 0 | — |
| Ghoul Ravager | 100 | 0 | — |
| Death Knight | 100 | 0 | — |
| Skeleton Archer | 100 | 0 | — |
| Wailing Spirit | 100 | 0 | — |
| Lich | 100 | 0 | — |
| Dark Mage | 100 | 0 | inspiring | +8 resolve/turn соседям |
| Warlock | 100 | 0 | — |
| Undead Noble | 100 | 0 | inspiring | +8 resolve/turn соседям |

---

## Апгрейды морали

### T1 → T2 (Humans)
- Resolve: +15
- ResistResolve: +10

### T1 → T3 (Humans)
- Resolve: +30 (всего)
- ResistResolve: +20 (всего)

### T1 → T2 (Undead)
- Resolve: +0 (всегда 100)
- ResistResolve: +0

### T1 → T3 (Undead)
- Resolve: +0 (всегда 100)
- ResistResolve: +0

---

## Спецификация (Core Mechanics 2.0)

### Resolve Config

```typescript
interface ResolveConfig {
  maxResolve: 100;              // Максимум морали
  baseRegeneration: 5;          // Восстановление за ход
  humanRetreat: true;           // Люди отступают при 0
  undeadCrumble: true;          // Нежить рассыпается при 0
  flankingResolveDamage: 12;    // Урон от фланга
  rearResolveDamage: 20;        // Урон от тыла
}
```

### Как должно работать

#### TURN_START фаза
```
Для каждого юнита:
  resolve = min(maxResolve, resolve + baseRegeneration)
  // resolve += 5 за ход
```

#### POST_ATTACK фаза (после атаки)
```
Если атака была фланговой:
  targetResolve -= flankingResolveDamage (12)
  targetResolve -= targetResistResolve% (сопротивление)
  
Если атака была с тыла:
  targetResolve -= rearResolveDamage (20)
  targetResolve -= targetResistResolve% (сопротивление)
  
Если атака была спереди:
  targetResolve -= 0 (без урона)
```

#### POST_ATTACK фаза (проверка состояния)
```
Если targetResolve <= 0:
  Если faction == 'humans':
    unit.state = 'routing' (отступает)
  Если faction == 'undead':
    unit.state = 'crumbled' (рассыпается)
```

---

## Traits (Особенности морали)

### Определённые traits

| Trait | Эффект |
|-------|--------|
| steadfast | +20% сопротивление урону морали |
| stubborn | Не может упасть ниже 10 морали |
| cold_blooded | Иммунитет к эффектам страха |
| fearless | +50% морали, нет состояния "сломлен" |
| inspiring | Соседи получают +5 морали/ход |

### Текущее использование

Только `inspiring` используется:
- Priest (Humans)
- Dark Mage (Undead)
- Undead Noble (Undead)

Остальные traits НЕ используются.

---

## Как это должно рассчитываться

### Пример 1: Фланговая атака

```
Attacker: Knight (фланг)
Target: Footman (resolve: 80, resistResolve: 0)

POST_ATTACK:
  Урон морали = 12 (фланг)
  Сопротивление = 0%
  Итого урон = 12
  
  Footman.resolve = 80 - 12 = 68
```

### Пример 2: Атака с тыла

```
Attacker: Rogue (тыл)
Target: Archer (resolve: 55, resistResolve: 0)

POST_ATTACK:
  Урон морали = 20 (тыл)
  Сопротивление = 0%
  Итого урон = 20
  
  Archer.resolve = 55 - 20 = 35
```

### Пример 3: Апгрейдированный юнит с сопротивлением

```
Attacker: Knight (фланг)
Target: Knight T2 (resolve: 100, resistResolve: 10)

POST_ATTACK:
  Урон морали = 12 (фланг)
  Сопротивление = 10%
  Итого урон = 12 * (1 - 0.10) = 10.8 ≈ 11
  
  Knight.resolve = 100 - 11 = 89
```

### Пример 4: Восстановление морали

```
TURN_START:
  Footman.resolve = 68
  
  Footman.resolve = min(80, 68 + 5) = 73
```

### Пример 5: Отступление (Humans)

```
Archer.resolve = 5

POST_ATTACK (фланговая атака):
  Archer.resolve = 5 - 12 = -7 → 0
  
  Archer.state = 'routing' (отступает)
  // Юнит больше не может атаковать, пытается убежать
```

### Пример 6: Рассыпание (Undead)

```
Skeleton.resolve = 100 (всегда)

POST_ATTACK (фланговая атака):
  Skeleton.resolve = 100 - 12 = 88
  
  // Нежить не может упасть ниже 0, но может быть ослаблена
```

---

## Что нужно реализовать

### 1. Боевая логика

**Файл**: `backend/src/core/mechanics/tier1/resolve/resolve.processor.ts`

```typescript
interface ResolveProcessor {
  regenerate(unit: BattleUnit, config: ResolveConfig): BattleUnit;
  applyDamage(unit: BattleUnit, damage: number): BattleUnit;
  checkState(unit: BattleUnit, config: ResolveConfig): 'active' | 'routing' | 'crumbled';
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}
```

### 2. Интеграция в боевой симулятор

**Файл**: `backend/src/roguelike/battle/battle.service.ts`

```typescript
// Использовать MechanicsProcessor с ROGUELIKE_PRESET
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

### 3. Тесты

**Файл**: `backend/src/core/mechanics/tier1/resolve/resolve.spec.ts`

```typescript
describe('ResolveProcessor', () => {
  it('should regenerate resolve at turn start', () => { ... });
  it('should apply resolve damage from flanking', () => { ... });
  it('should trigger rout when resolve = 0', () => { ... });
  it('should apply resistance to resolve damage', () => { ... });
});
```

---

## Текущие проблемы

1. **Resolve система НЕ интегрирована в боевой симулятор**
   - Боевая система использует Core 1.0 (без механик)
   - Нужно переключиться на Core 2.0 с ROGUELIKE_PRESET

2. **Facing система НЕ реализована**
   - Нужна для определения фланговых атак
   - Зависимость для Resolve системы

3. **Flanking система НЕ реализована**
   - Нужна для определения угла атаки
   - Зависимость для Resolve системы

4. **Traits НЕ реализованы**
   - Только `inspiring` используется
   - Остальные traits не имеют эффекта

---

## План реализации

### Phase 1: Базовая Resolve система
1. Реализовать ResolveProcessor
2. Интегрировать в боевой симулятор
3. Написать тесты
4. Валидировать с документацией

### Phase 2: Facing + Flanking
1. Реализовать FacingProcessor
2. Реализовать FlankingProcessor
3. Интегрировать с ResolveProcessor
4. Написать интеграционные тесты

### Phase 3: Traits
1. Реализовать steadfast trait
2. Реализовать stubborn trait
3. Реализовать cold_blooded trait
4. Реализовать fearless trait
5. Улучшить inspiring trait

### Phase 4: Остальные механики
1. Phalanx (формирования)
2. Charge (кавалерия)
3. Contagion (заражение)
4. И т.д.

---

## Ссылки

- **Core Mechanics 2.0 Design**: `.kiro/specs/core-mechanics-2.0/design.md`
- **Core Mechanics 2.0 Requirements**: `.kiro/specs/core-mechanics-2.0/requirements.md`
- **Roguelike Design**: `docs/ROGUELIKE_DESIGN.md`
- **Integration Guide**: `docs/ROGUELIKE_MECHANICS_INTEGRATION.md`
- **Quick Reference**: `docs/MECHANICS_QUICK_REFERENCE.md`
