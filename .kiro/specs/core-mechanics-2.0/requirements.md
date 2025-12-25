# Requirements: Core Mechanics 2.0

## Overview

Расширение core библиотеки модульными боевыми механиками с feature flags. Все механики опциональны и могут быть включены/выключены независимо. Сохраняется полная обратная совместимость с core 1.0.

## Relationship to Existing Specs

| Spec | Relationship |
|------|--------------|
| `core-extraction` (1.0) | Базовая версия, остаётся неизменной |
| `roguelike-run` | Потребитель механик (использует preset `roguelike`) |
| MVP mode | Использует preset `mvp` (все механики выключены) |

## Version Strategy

```
core 1.0 (current)     → Базовые функции (grid, damage, targeting, turn-order)
core 2.0 (this spec)   → 1.0 + модульные механики с feature flags
```

---

## Requirements

### REQ-1: Mechanics Configuration System
**Priority**: Critical

#### REQ-1.1: MechanicsConfig Interface
```typescript
interface MechanicsConfig {
  // Tier 0: Base
  facing: boolean;
  
  // Tier 1: Core Combat
  resolve: ResolveConfig | false;
  engagement: EngagementConfig | false;
  flanking: boolean;
  
  // Tier 2: Advanced
  riposte: RiposteConfig | false;
  intercept: InterceptConfig | false;
  aura: boolean;
  
  // Tier 3: Specialized
  charge: ChargeConfig | false;
  overwatch: boolean;
  phalanx: PhalanxConfig | false;
  lineOfSight: LoSConfig | false;
  ammunition: AmmoConfig | false;
  
  // Tier 4: Counter-mechanics
  contagion: ContagionConfig | false;
  armorShred: ShredConfig | false;
}
```

#### REQ-1.2: Sub-Configurations
Каждая механика может иметь детальную конфигурацию:

```typescript
interface ResolveConfig {
  maxResolve: number;           // Default: 100
  humanRetreat: boolean;        // Люди отступают при Resolve=0
  undeadCrumble: boolean;       // Нежить рассыпается при Resolve=0
  baseRegeneration: number;     // Default: 5
}

interface ShredConfig {
  shredPerAttack: number;       // Default: 1
  maxShredPercent: number;      // Default: 0.4 (40%)
}
```

#### REQ-1.3: Dependency Resolution
- Включение механики автоматически включает её зависимости
- Пример: `riposte: true` → автоматически `flanking: true` → `facing: true`

### REQ-2: Dependency Graph
**Priority**: Critical

#### REQ-2.1: Tier Structure

| Tier | Mechanics | Dependencies |
|------|-----------|--------------|
| 0 | facing, armorShred | None (fully independent) |
| 1 | resolve, engagement, flanking | facing (for flanking) |
| 2 | riposte, intercept, aura | flanking, engagement |
| 3 | charge, overwatch, phalanx, los, ammunition | Tier 2 mechanics |
| 4 | contagion | counters phalanx |

#### REQ-2.2: Dependency Rules

| Mechanic | Requires | Notes |
|----------|----------|-------|
| facing | - | Base mechanic, enables directional combat |
| armorShred | - | Fully independent, works with any config |
| flanking | facing | Needs direction to determine attack arc |
| riposte | flanking | Counter-attack only from front arc |
| engagement | - | Zone of Control, independent |
| intercept | engagement | Extends ZoC with movement blocking |
| aura | - | Independent territorial effects |
| resolve | - | Independent morale system |
| charge | intercept | Cavalry needs intercept rules |
| overwatch | intercept, ammunition | Ranged reaction fire |
| phalanx | facing | Formation needs facing alignment |
| lineOfSight | facing | Firing arcs need direction |
| ammunition | - | Independent resource system |
| contagion | - | Independent, but counters phalanx |

### REQ-3: Presets
**Priority**: High

#### REQ-3.1: MVP Preset
```typescript
const MVP_PRESET: MechanicsConfig = {
  facing: false,
  resolve: false,
  engagement: false,
  flanking: false,
  riposte: false,
  intercept: false,
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};
```

#### REQ-3.2: Roguelike Preset
```typescript
const ROGUELIKE_PRESET: MechanicsConfig = {
  facing: true,
  resolve: { maxResolve: 100, humanRetreat: true, undeadCrumble: true, baseRegeneration: 5 },
  engagement: { attackOfOpportunity: true, archerPenalty: true },
  flanking: true,
  riposte: { initiativeBased: true, chargesPerRound: 'attackCount' },
  intercept: { hardIntercept: true, softIntercept: true },
  aura: true,
  charge: { momentumPerCell: 0.2, shockResolveDamage: 10 },
  overwatch: true,
  phalanx: { maxArmorBonus: 5, maxResolveBonus: 25 },
  lineOfSight: { directFire: true, arcFire: true },
  ammunition: { enabled: true, mageCooldowns: true },
  contagion: { fireSpread: 0.5, poisonSpread: 0.3, plagueSpread: 0.6 },
  armorShred: { shredPerAttack: 1, maxShredPercent: 0.4 },
};
```

#### REQ-3.3: Tactical Preset (Tier 0-2 only)
```typescript
const TACTICAL_PRESET: MechanicsConfig = {
  facing: true,
  resolve: { maxResolve: 100, humanRetreat: true, undeadCrumble: false },
  engagement: { attackOfOpportunity: true, archerPenalty: false },
  flanking: true,
  riposte: { initiativeBased: true },
  intercept: { hardIntercept: false, softIntercept: true },
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};
```

### REQ-4: Mechanics Processor
**Priority**: Critical

#### REQ-4.1: createMechanicsProcessor()
```typescript
function createMechanicsProcessor(config: MechanicsConfig): MechanicsProcessor {
  const resolved = resolveDependencies(config);
  return {
    config: resolved,
    processors: buildProcessors(resolved),
    process: (state: BattleState) => applyMechanics(state, resolved),
  };
}
```

#### REQ-4.2: Phase Integration
Механики интегрируются в фазы боя:

| Phase | Mechanics Applied |
|-------|-------------------|
| Turn Start | resolve.recovery, ammunition.reload, aura.pulse |
| Movement | engagement.check, intercept.trigger, overwatch.trigger |
| Pre-Attack | flanking.check, charge.validate, los.check |
| Attack | riposte.trigger, armorShred.apply, contagion.apply |
| Post-Attack | resolve.damage, phalanx.recalculate |
| Turn End | contagion.spread, resolve.stateCheck |

### REQ-5: Backward Compatibility
**Priority**: Critical

#### REQ-5.1: Core 1.0 API Unchanged
- Все существующие функции из core 1.0 остаются без изменений
- `calculatePhysicalDamage()`, `findPath()`, `buildTurnQueue()` работают как раньше

#### REQ-5.2: Optional Mechanics Layer
- Механики — это дополнительный слой поверх core 1.0
- Без конфигурации механик симулятор работает как MVP

#### REQ-5.3: Migration Path
```typescript
// MVP mode (current behavior)
const result = simulateBattle(state, seed);

// With mechanics (new)
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

### REQ-6: File Structure
**Priority**: High

```
backend/src/core/
├── grid/                    # ✅ Core 1.0 (unchanged)
├── battle/                  # ✅ Core 1.0 (unchanged)
├── utils/                   # ✅ Core 1.0 (unchanged)
├── events/                  # ✅ Core 1.0 (unchanged)
├── types/                   # ✅ Core 1.0 (unchanged)
│
├── mechanics/               # 🆕 Core 2.0
│   ├── config/
│   │   ├── mechanics.types.ts
│   │   ├── dependencies.ts
│   │   ├── validator.ts
│   │   └── presets/
│   │       ├── mvp.ts
│   │       ├── roguelike.ts
│   │       └── tactical.ts
│   │
│   ├── tier0/
│   │   └── facing/
│   │
│   ├── tier1/
│   │   ├── resolve/
│   │   ├── engagement/
│   │   └── flanking/
│   │
│   ├── tier2/
│   │   ├── riposte/
│   │   ├── intercept/
│   │   └── aura/
│   │
│   ├── tier3/
│   │   ├── charge/
│   │   ├── overwatch/
│   │   ├── phalanx/
│   │   ├── los/
│   │   └── ammunition/
│   │
│   ├── tier4/
│   │   ├── contagion/
│   │   └── armor-shred/
│   │
│   ├── processor.ts         # createMechanicsProcessor()
│   └── index.ts
│
└── index.ts                 # Re-exports core 1.0 + mechanics
```

### REQ-7: Testing Strategy
**Priority**: High

#### REQ-7.1: Isolated Mechanic Tests
- Каждая механика тестируется изолированно
- Тесты с разными конфигурациями

#### REQ-7.2: Integration Tests
- Тесты взаимодействия механик
- Тесты с разными пресетами

#### REQ-7.3: Backward Compatibility Tests
- MVP preset должен давать идентичные результаты с core 1.0
- Регрессионные тесты для существующих боёв

---

## Success Criteria

1. ✅ Все механики из roguelike-run реализованы как модули
2. ✅ Механики можно включать/выключать независимо
3. ✅ Зависимости разрешаются автоматически
4. ✅ MVP preset даёт идентичные результаты с текущим кодом
5. ✅ Roguelike preset включает все 12 механик
6. ✅ Core 1.0 API не изменён
7. ✅ 100% покрытие тестами для каждой механики
8. ✅ Документация для каждой механики

---

## Out of Scope

- Изменение core 1.0 API
- UI компоненты (остаются в roguelike-run spec)
- Game-specific данные (юниты, фракции — в game/)
- NestJS интеграция (остаётся в battle service)

---

## Dependencies

- `core-extraction` spec должен быть завершён (PR 5 merged)
- `roguelike-run` spec содержит детальный дизайн механик
