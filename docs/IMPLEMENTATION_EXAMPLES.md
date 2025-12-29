# Примеры реализации: Core 2.0 + MVP

## Пример 1: Resolve система (Core 2.0)

### Что это:
Системная механика, применяемая ко ВСЕМ юнитам. Юниты теряют боевой дух от фланговых атак.

### Реализация:

```typescript
// backend/src/core/mechanics/tier1/resolve/resolve.processor.ts

/**
 * Вычисляет урон боевому духу.
 * Применяется ко ВСЕМ юнитам, независимо от их абилок.
 */
function calculateResolveDamage(
  attacker: BattleUnit,
  target: BattleUnit,
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
  
  // Округлить
  return Math.round(damage);
}

/**
 * Применяет урон боевому духу к юниту.
 */
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

/**
 * Проверяет состояние боевого духа.
 */
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

### Использование в боевом симуляторе:

```typescript
// backend/src/battle/battle.simulator.ts

// ФАЗА: POST_ATTACK
const arc = facingProcessor.getAttackArc(attacker, target);
const resolveDamage = calculateResolveDamage(attacker, target, arc, config);
target = applyResolveDamage(target, resolveDamage, config);

// Проверить состояние
const state = checkResolveState(target, config);
if (state === 'routing') {
  target.state = 'routing';  // Юнит отступает
}
```

---

## Пример 2: Backstab абилка (MVP)

### Что это:
Специфичная пассивная абилка Rogue. Наносит +100% урона при атаке сзади.

### Реализация:

```typescript
// backend/src/battle/passive.abilities.ts

/**
 * Rogue's Backstab: Пассивный бонус +100% урона сзади.
 * Применяется ТОЛЬКО к Rogue.
 */
function applyBackstabBonus(
  attacker: BattleUnit,
  arc: AttackArc
): number {
  // Проверить, что это Rogue
  if (attacker.id !== 'rogue') {
    return 1.0;  // Нет бонуса
  }
  
  // Проверить, что атака с тыла
  if (arc !== 'rear') {
    return 1.0;  // Нет бонуса
  }
  
  // Применить бонус
  return 2.0;  // +100% урона
}

/**
 * Вычислить эффективный урон с Backstab.
 */
function calculateBackstabDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  arc: AttackArc
): number {
  // Базовый урон
  let damage = calculatePhysicalDamage(attacker, target);
  
  // Применить Backstab бонус
  damage *= applyBackstabBonus(attacker, arc);
  
  return damage;
}
```

### Использование в боевом симуляторе:

```typescript
// backend/src/battle/battle.simulator.ts

// ФАЗА: ATTACK
const arc = facingProcessor.getAttackArc(attacker, target);
let damage = calculatePhysicalDamage(attacker, target);

// Применить MVP абилку (Backstab)
damage *= applyBackstabBonus(attacker, arc);

// Применить урон
target.currentHp -= damage;
```

---

## Пример 3: Flanking механика (Core 2.0)

### Что это:
Системная механика, применяемая ко ВСЕМ юнитам. Атаки с фланга наносят +15% урона.

### Реализация:

```typescript
// backend/src/core/mechanics/tier1/flanking/flanking.processor.ts

/**
 * Вычисляет модификатор урона в зависимости от угла атаки.
 * Применяется ко ВСЕМ юнитам.
 */
function getDamageModifier(arc: AttackArc): number {
  switch (arc) {
    case 'front':
      return 1.0;   // Нет модификатора
    case 'flank':
      return 1.15;  // +15% урона
    case 'rear':
      return 1.30;  // +30% урона
  }
}

/**
 * Применяет модификатор урона за фланг.
 */
function applyFlankingDamageBonus(
  baseDamage: number,
  arc: AttackArc
): number {
  const modifier = getDamageModifier(arc);
  return Math.floor(baseDamage * modifier);
}
```

### Использование в боевом симуляторе:

```typescript
// backend/src/battle/battle.simulator.ts

// ФАЗА: PRE_ATTACK
const arc = facingProcessor.getAttackArc(attacker, target);

// ФАЗА: ATTACK
let damage = calculatePhysicalDamage(attacker, target);

// Применить Core 2.0 механику (Flanking)
damage = applyFlankingDamageBonus(damage, arc);

// Применить MVP абилку (Backstab)
damage *= applyBackstabBonus(attacker, arc);

// Применить урон
target.currentHp -= damage;
```

---

## Пример 4: Полный цикл атаки

### Сценарий: Rogue атакует Archer с тыла

```typescript
// backend/src/battle/battle.simulator.ts

function executeAttack(
  attacker: BattleUnit,
  target: BattleUnit,
  state: BattleState,
  processor: MechanicsProcessor,
  seed: number
): BattleState {
  // ═══════════════════════════════════════════════════════════
  // ФАЗА 1: PRE_ATTACK
  // ═══════════════════════════════════════════════════════════
  
  // Core 2.0: Facing Processor
  const arc = processor.processors.facing.getAttackArc(attacker, target);
  // arc = 'rear' (Rogue атакует Archer с тыла)
  
  // Core 2.0: Flanking Processor
  const flankingModifier = processor.processors.flanking.getDamageModifier(arc);
  // flankingModifier = 1.30 (+30% за тыловую атаку)
  
  // ═══════════════════════════════════════════════════════════
  // ФАЗА 2: ATTACK
  // ═══════════════════════════════════════════════════════════
  
  // Core 1.0: Вычислить базовый урон
  let damage = calculatePhysicalDamage(attacker, target);
  // damage = 10 (базовый урон Rogue)
  
  // Core 2.0: Применить Flanking бонус
  damage = Math.floor(damage * flankingModifier);
  // damage = 13 (10 * 1.30)
  
  // MVP: Применить Backstab бонус (только для Rogue)
  if (attacker.id === 'rogue' && arc === 'rear') {
    damage *= 2;  // +100% урона
    // damage = 26 (13 * 2)
  }
  
  // Применить урон
  target.currentHp -= damage;
  // Archer.currentHp: 55 → 29
  
  // ═══════════════════════════════════════════════════════════
  // ФАЗА 3: POST_ATTACK
  // ═══════════════════════════════════════════════════════════
  
  // Core 2.0: Resolve Processor
  const resolveDamage = calculateResolveDamage(attacker, target, arc, config);
  // resolveDamage = 3 (10 * 0.25 * 1.30 за тыл)
  
  target.resolve -= resolveDamage;
  // Archer.resolve: 55 → 52
  
  // Проверить состояние
  const resolveState = checkResolveState(target, config);
  // resolveState = 'active' (resolve > 0)
  
  // ═══════════════════════════════════════════════════════════
  // РЕЗУЛЬТАТ
  // ═══════════════════════════════════════════════════════════
  
  // Archer получил:
  // - 26 урона (базовый + фланг + backstab)
  // - 3 урона боевому духу (resolve)
  // - Остался в состоянии 'active'
  
  return {
    ...state,
    units: state.units.map(u => 
      u.instanceId === target.instanceId ? target : u
    ),
  };
}
```

---

## Пример 5: Firewall абилка (MVP)

### Что это:
Специфичная активная абилка Mage. Наносит 30 магического урона в AoE.

### Реализация:

```typescript
// backend/src/game/abilities/ability.data.ts

const fireball: ActiveAbility = {
  id: 'fireball',
  name: 'Огненный шар',
  description: 'Наносит 30 магического урона в радиусе 1 клетки',
  type: 'active',
  targetType: 'area',
  cooldown: 2,
  range: 3,
  areaSize: 1,
  effects: [
    {
      type: 'damage',
      value: 30,
      damageType: 'magical',
      attackScaling: 0.6,
    },
  ],
  icon: 'fireball',
};

// backend/src/battle/ability.executor.ts

/**
 * Выполнить Fireball абилку.
 */
function executeFireball(
  mage: BattleUnit,
  targetPosition: Position,
  state: BattleState,
  seed: number
): AbilityEvent[] {
  const events: AbilityEvent[] = [];
  
  // Найти все враги в AoE
  const targets = getUnitsInAoE(
    targetPosition,
    1,  // areaSize = 1
    state.units,
    'enemy',
    mage.team
  );
  
  // Применить урон каждой цели
  for (const target of targets) {
    // Вычислить урон
    let damage = 30;  // base value
    damage += Math.floor(mage.stats.atk * 0.6);  // attackScaling
    
    // Магический урон игнорирует броню
    // (в отличие от физического)
    
    // Применить урон
    target.currentHp -= damage;
    
    // Создать событие
    events.push({
      round: state.currentRound,
      type: 'ability',
      actorId: mage.instanceId,
      targetId: target.instanceId,
      abilityId: 'fireball',
      totalDamage: damage,
    });
  }
  
  return events;
}
```

### Использование в боевом симуляторе:

```typescript
// backend/src/battle/battle.simulator.ts

// Mage выбирает Fireball
const action = { type: 'ability', abilityId: 'fireball', targetPosition };

// Выполнить абилку
const events = executeFireball(mage, action.targetPosition, state, seed);

// Применить события
state = applyAbilityEvents(state, events, fireballAbility, mage.instanceId);
```

---

## Пример 6: Интеграция всех слоёв

### Полный боевой цикл:

```typescript
// backend/src/battle/battle.simulator.ts

function simulateBattle(
  state: BattleState,
  seed: number,
  processor?: MechanicsProcessor  // Core 2.0
): BattleResult {
  let currentSeed = seed;
  
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const turnQueue = buildTurnQueue(state.units);
    
    for (const unit of turnQueue) {
      if (!unit.alive) continue;
      
      // ═══════════════════════════════════════════════════════════
      // TURN_START
      // ═══════════════════════════════════════════════════════════
      
      // Core 2.0: Resolve Processor
      if (processor) {
        state = processor.process('turn_start', state, {
          activeUnit: unit,
          seed: currentSeed++,
        });
      }
      
      // ═══════════════════════════════════════════════════════════
      // DECIDE ACTION
      // ═══════════════════════════════════════════════════════════
      
      const action = decideAction(unit, state);
      
      if (action.type === 'attack') {
        const target = findUnit(state, action.targetId);
        
        // ═══════════════════════════════════════════════════════════
        // PRE_ATTACK
        // ═══════════════════════════════════════════════════════════
        
        // Core 2.0: Facing, Flanking, Charge, LoS, Ammunition
        if (processor) {
          state = processor.process('pre_attack', state, {
            activeUnit: unit,
            target,
            action,
            seed: currentSeed++,
          });
        }
        
        // ═══════════════════════════════════════════════════════════
        // ATTACK
        // ═══════════════════════════════════════════════════════════
        
        // Core 1.0: Вычислить базовый урон
        let damage = calculatePhysicalDamage(unit, target);
        
        // Core 2.0: Flanking Processor
        const arc = processor?.processors.facing?.getAttackArc(unit, target);
        if (arc) {
          damage = applyFlankingDamageBonus(damage, arc);
        }
        
        // MVP: Backstab абилка
        damage *= applyBackstabBonus(unit, arc);
        
        // Core 2.0: Armor Shred Processor
        if (processor) {
          state = processor.process('attack', state, {
            activeUnit: unit,
            target,
            action,
            seed: currentSeed++,
          });
        }
        
        // Применить урон
        target.currentHp -= damage;
        
        // ═══════════════════════════════════════════════════════════
        // POST_ATTACK
        // ═══════════════════════════════════════════════════════════
        
        // Core 2.0: Resolve Processor
        if (processor && arc) {
          const resolveDamage = calculateResolveDamage(unit, target, arc, config);
          target.resolve -= resolveDamage;
        }
        
        // Core 2.0: Phalanx Processor
        if (processor) {
          state = processor.process('post_attack', state, {
            activeUnit: unit,
            target,
            seed: currentSeed++,
          });
        }
        
        // MVP: Passive abilities (Lifesteal, Thorns)
        const passiveResults = processAttackPassives(unit, target, damage, round, currentSeed++);
        state = applyPassiveResults(state, passiveResults);
      }
      
      if (action.type === 'ability') {
        const ability = getAbility(action.abilityId);
        
        // MVP: Выполнить абилку
        const events = executeAbility(unit, ability, action.target, state, currentSeed++);
        state = applyAbilityEvents(state, events, ability, unit.instanceId);
      }
      
      // ═══════════════════════════════════════════════════════════
      // TURN_END
      // ═══════════════════════════════════════════════════════════
      
      // Core 2.0: Contagion, Aura, Overwatch
      if (processor) {
        state = processor.process('turn_end', state, {
          activeUnit: unit,
          seed: currentSeed++,
        });
      }
      
      // Проверить конец боя
      if (isBattleOver(state)) {
        return buildResult(state, round);
      }
    }
  }
  
  return buildResult(state, MAX_ROUNDS);
}
```

---

## Ключевые моменты

### ✅ Разделение ответственности

```typescript
// Core 1.0: Базовые расчёты
const damage = calculatePhysicalDamage(attacker, target);

// Core 2.0: Системные механики
const modifier = getDamageModifier(arc);
damage *= modifier;

// MVP: Специфичные абилки
damage *= applyBackstabBonus(attacker, arc);
```

### ✅ Фазы боя

```typescript
// Каждая фаза применяет свои механики
processor.process('turn_start', state, context);
processor.process('pre_attack', state, context);
processor.process('attack', state, context);
processor.process('post_attack', state, context);
processor.process('turn_end', state, context);
```

### ✅ Детерминированность

```typescript
// Используется seeded random для воспроизводимости
const roll = seededRandom(seed);
if (roll < chance) {
  // Срабатывает
}
```

### ✅ Конфигурируемость

```typescript
// Core 2.0 можно включить/отключить
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);

// Или без Core 2.0
const result = simulateBattle(state, seed);
```

