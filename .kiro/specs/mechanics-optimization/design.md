# Design Document: Mechanics Optimization

## Overview

Оптимизация интеграции Core 2.0 механик в battle simulator. Реализация разбита на 3 фазы:

1. **Фаза 1 (Quick Win)**: Добавить ROGUELIKE_PRESET в roguelike battle service
2. **Фаза 2 (Рефакторинг)**: Удалить дублирование логики, делегировать процессорам
3. **Фаза 3 (Полная интеграция)**: Интегрировать все 14 механик

## Architecture

### Текущая архитектура (проблемы)

```
┌─────────────────────────────────────────────────────────────┐
│                    battle.simulator.ts                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Inline resolve logic (~100 lines)                   │    │
│  │  Inline flanking logic (~80 lines)                   │    │
│  │  Inline facing logic (~50 lines)                     │    │
│  │  Inline routing logic (~100 lines)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  MechanicsProcessor (частично используется)          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              roguelike/battle/battle.service.ts              │
│                                                              │
│  simulateBattle(playerTeam, opponentTeam, seed)  ← БЕЗ      │
│                                                   processor! │
└─────────────────────────────────────────────────────────────┘
```

### Целевая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    battle.simulator.ts                       │
│                                                              │
│  executeUnitTurn() {                                         │
│    processor.process('turn_start', state, context)          │
│    processor.process('pre_attack', state, context)          │
│    // execute action                                         │
│    processor.process('attack', state, context)              │
│    processor.process('post_attack', state, context)         │
│    processor.process('turn_end', state, context)            │
│  }                                                           │
│                                                              │
│  // NO inline mechanic logic!                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   MechanicsProcessor                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Facing   │ │ Flanking │ │ Resolve  │ │ Riposte  │ ...   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              roguelike/battle/battle.service.ts              │
│                                                              │
│  const processor = createMechanicsProcessor(ROGUELIKE_PRESET)│
│  simulateBattle(playerTeam, opponentTeam, seed, processor)  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Фаза 1: RoguelikeBattleService изменения

```typescript
// roguelike/battle/battle.service.ts

import { 
  createMechanicsProcessor, 
  ROGUELIKE_PRESET,
  MechanicsProcessor 
} from '../../core/mechanics';

@Injectable()
export class RoguelikeBattleService {
  /**
   * Creates mechanics processor for roguelike battles.
   * Uses ROGUELIKE_PRESET with all 14 mechanics enabled.
   */
  private createRoguelikeProcessor(): MechanicsProcessor {
    return createMechanicsProcessor(ROGUELIKE_PRESET);
  }

  async simulateAndSaveBattle(...): Promise<RoguelikeBattleResult> {
    // ... existing code ...
    
    // Create processor for roguelike mechanics
    const processor = this.createRoguelikeProcessor();
    
    // Pass processor to simulateBattle
    battleResult = simulateBattle(
      playerTeamSetup, 
      opponentTeamSetup, 
      seed,
      processor  // NEW: 4th argument
    );
    
    // ... rest of existing code ...
  }
}
```

### Фаза 2: Battle Simulator рефакторинг

```typescript
// battle/battle.simulator.ts

/**
 * Execute unit turn with mechanics integration.
 * All mechanic logic delegated to processor.
 */
function executeUnitTurnWithAbilities(
  unit: BattleUnitWithAbilities,
  state: BattleStateWithAbilities,
  seed: number,
  processor?: MechanicsProcessor
): { events: BattleEvent[]; state: BattleStateWithAbilities } {
  const events: BattleEvent[] = [];
  let currentState = state;
  
  // Helper to process phase and collect events
  const processPhase = (phase: BattlePhase, context: PhaseContext) => {
    if (!processor) return;
    const result = processor.process(phase, toCoreBattleState(currentState), context);
    currentState = fromCoreBattleState(currentState, result.state);
    events.push(...result.events);
  };
  
  // TURN_START phase
  processPhase('turn_start', { activeUnit: unit, seed });
  
  // Get AI decision
  const action = decideAction(unit, currentState);
  
  // Execute action based on type
  switch (action.type) {
    case 'attack':
      processPhase('pre_attack', { activeUnit: unit, target: action.target, seed });
      // Execute attack (damage calculation uses processor modifiers)
      processPhase('attack', { activeUnit: unit, target: action.target, seed });
      processPhase('post_attack', { activeUnit: unit, target: action.target, seed });
      break;
    // ... other action types
  }
  
  // TURN_END phase
  processPhase('turn_end', { activeUnit: unit, seed });
  
  return { events, state: currentState };
}
```

### Фаза 3: Полная интеграция механик

Каждая механика интегрируется через свой процессор:

| Механика | Фаза | Действие |
|----------|------|----------|
| Facing | pre_attack | Поворот к цели |
| Flanking | pre_attack | Расчет модификатора урона |
| Resolve | turn_start, post_attack | Регенерация, урон морали |
| Engagement | movement | ZoC, Attack of Opportunity |
| Riposte | attack | Контратака |
| Intercept | movement | Hard/soft intercept |
| Charge | movement, pre_attack | Momentum bonus |
| Overwatch | turn_start, movement | Vigilance, trigger shots |
| Phalanx | turn_start | Formation bonuses |
| LoS | pre_attack | Direct/arc fire check |
| Ammunition | pre_attack, turn_start | Ammo consumption, reload |
| Contagion | turn_end | Status effect spread |
| ArmorShred | attack | Armor reduction |
| Aura | turn_start | Area effects |

## Data Models

### BattleEvent с механиками

```typescript
interface BattleEvent {
  type: string;  // 'attack' | 'damage' | 'mechanic_flanking' | 'mechanic_resolve' | ...
  round: number;
  actorId: string;
  targetId?: string;
  damage?: number;
  metadata?: {
    // Mechanic-specific data
    attackArc?: 'front' | 'flank' | 'rear';
    flankingModifier?: number;
    resolveDamage?: number;
    // ... etc
  };
}
```

### PhaseContext

```typescript
interface PhaseContext {
  activeUnit: BattleUnit;
  target?: BattleUnit;
  action?: BattleAction;
  seed: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. 
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Roguelike battles use ROGUELIKE_PRESET
*For any* roguelike battle, the MechanicsProcessor config SHALL equal ROGUELIKE_PRESET with all 14 mechanics enabled.
**Validates: Requirements 1.1**

### Property 2: Mechanic events are generated with ROGUELIKE_PRESET
*For any* battle using ROGUELIKE_PRESET where melee units attack from flank/rear, the result SHALL contain mechanic_flanking events.
**Validates: Requirements 1.3**

### Property 3: MVP behavior without processor
*For any* battle simulated without a MechanicsProcessor, the result SHALL be identical to a battle with MVP_PRESET processor.
**Validates: Requirements 2.2**

### Property 4: Determinism with mechanics
*For any* battle with the same seed and processor, running twice SHALL produce identical results (same winner, rounds, events).
**Validates: Requirements 6.1**

### Property 5: Event count difference between presets
*For any* battle scenario, ROGUELIKE_PRESET SHALL generate more events than MVP_PRESET due to mechanic events.
**Validates: Requirements 7.4**

### Property 6: State preservation in conversion
*For any* game state converted to core state and back, all unit properties (HP, position, alive, facing, resolve) SHALL be preserved.
**Validates: Requirements 5.4**

### Property 7: Consistent tier order
*For any* battle with multiple mechanics enabled, mechanic events SHALL be generated in tier order (Tier 0 → Tier 4).
**Validates: Requirements 6.3**

## Error Handling

### Фаза 1
- Если создание processor падает, логировать ошибку и продолжить без механик (fallback to MVP)

### Фаза 2-3
- Если processor.process() падает, логировать ошибку и пропустить фазу
- Сохранять частичные результаты для отладки

```typescript
try {
  const result = processor.process(phase, state, context);
  // apply result
} catch (error) {
  this.logger.error('Mechanics phase failed', { phase, error });
  // continue without this phase's effects
}
```

## Testing Strategy

### Unit Tests
- Тесты для RoguelikeBattleService.createRoguelikeProcessor()
- Тесты для state conversion (toCoreBattleState, fromCoreBattleState)

### Property-Based Tests (fast-check)
- Property 1: Roguelike processor config validation
- Property 2: Mechanic event generation
- Property 3: MVP equivalence
- Property 4: Determinism
- Property 5: Event count comparison
- Property 6: State preservation
- Property 7: Tier order

### Integration Tests
- Полный бой с ROGUELIKE_PRESET
- Полный бой с TACTICAL_PRESET
- Сравнение MVP vs ROGUELIKE результатов
