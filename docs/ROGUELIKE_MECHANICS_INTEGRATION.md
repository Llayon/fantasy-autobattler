# Roguelike Mechanics Integration Guide

## Overview

Roguelike Run Mode использует **Core Mechanics 2.0** — модульную систему боевых механик, которая добавляет стратегическую глубину к боям.

Этот документ объясняет, как две системы интегрируются:
- **docs/ROGUELIKE_DESIGN.md** — Система прогрессии (фракции, лидеры, драфт, экономика)
- **.kiro/specs/core-mechanics-2.0/design.md** — Система боевых механик (14 механик в 5 тиерах)

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROGUELIKE RUN MODE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         PROGRESSION SYSTEM (ROGUELIKE_DESIGN.md)         │   │
│  │                                                          │   │
│  │  Фракции → Лидеры → Драфт → Экономика → Апгрейды      │   │
│  │  (Как строить колоду)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      BATTLE MECHANICS SYSTEM (CORE MECHANICS 2.0)        │   │
│  │                                                          │   │
│  │  Facing → Resolve → Flanking → Riposte → Charge → ...  │   │
│  │  (Как боевые механики работают)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CORE 1.0 (Grid, Pathfinding, etc.)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Как они работают вместе

### 1. Построение колоды (Progression System)

Игрок выбирает:
- **Фракцию** (Humans или Undead в Phase 1)
- **Лидера** (3 варианта на фракцию)
- **Юнитов** через драфт (начальный + после каждого боя)
- **Апгрейды** юнитов (T1 → T2 → T3)

Результат: Колода из 12 юнитов + 2 заклинания лидера

### 2. Подготовка к бою

Игрок:
- Размещает юнитов на сетке 8×2
- Выбирает тайминг заклинаний (Early/Mid/Late)
- Нажимает "В бой"

### 3. Боевая симуляция (Battle Mechanics System)

Боевой симулятор применяет **Core Mechanics 2.0**:

```typescript
// Псевдокод
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(battleState, seed, processor);
```

Каждый раунд боя проходит через фазы:
- **TURN_START** — Восстановление Resolve, боеприпасов, обновление Phalanx
- **MOVEMENT** — Проверка Engagement, Intercept, Overwatch
- **PRE_ATTACK** — Проверка Facing, Flanking, LoS
- **ATTACK** — Применение Armor Shred, Riposte, Contagion
- **POST_ATTACK** — Проверка Resolve, обновление Phalanx
- **TURN_END** — Распространение Contagion, очистка состояния

### 4. Результат боя

Боевой симулятор возвращает:
- Победителя
- Количество раундов
- События боя (для реплея)

Результат используется для:
- Обновления прогрессии (wins/losses)
- Расчёта награды (золото)
- Сохранения снапшота для матчмейкинга

---

## Phase 1: Включённые механики

### Tier 0: Базовые
- **Facing** — Направление юнитов (N/S/E/W)

### Tier 1: Основной боевой слой
- **Resolve** — Боевой дух, отступление/рассыпание при 0
- **Engagement** — Зона контроля, штраф лучникам
- **Flanking** — Фланговые атаки наносят больше урона

### Tier 2: Продвинутые
- **Riposte** — Контратаки при фронтальной атаке
- **Intercept** — Перехват движущихся врагов
- **Aura** — Пассивные эффекты от лидеров

### Tier 3: Специализированные
- **Charge** — Кавалерия получает бонус за расстояние
- **Overwatch** — Лучники стреляют при движении врагов
- **Phalanx** — Формирования дают бонусы
- **Line of Sight** — Лучники должны видеть цель
- **Ammunition** — Боеприпасы и перезарядка

### Tier 4: Контр-механики
- **Contagion** — Эффекты распространяются на соседей
- **Armor Shred** — Физические атаки ослабляют броню

---

## Стратегические последствия

### Позиционирование

**Facing + Flanking** делают позиционирование критичным:
- Фланговые атаки: +15% урона + 12 урона Resolve
- Тыловые атаки: +30% урона + 20 урона Resolve

**Стратегия**: Размещайте танков в центре для защиты от фланговых атак.

### Формирования

**Phalanx** награждает плотные группы:
- +1 броня за соседа (макс +5)
- +5 Resolve за соседа (макс +25)

**Стратегия**: Группируйте танков и поддержку вместе.

### Боевой дух

**Resolve** система добавляет новое измерение:
- Люди отступают при Resolve = 0
- Нежить рассыпается при Resolve = 0
- Восстановление: +5 за ход

**Стратегия**: Фланговые атаки могут быть эффективнее прямых.

### Кавалерия

**Charge** делает кавалерию мощной:
- +20% урона за клетку (макс +100%)
- Требует минимум 3 клетки

**Стратегия**: Размещайте кавалерию далеко для разбега.

### Лучники

**Ammunition + Overwatch + Engagement**:
- 6 боеприпасов на бой
- Могут стрелять при движении врагов
- -50% урона в ближнем бою

**Стратегия**: Держите лучников в тылу, защищённых танками.

### Маги

**Cooldowns + Contagion**:
- Перезарядка 3 раунда
- Эффекты распространяются на соседей
- +15% распространение в Phalanx

**Стратегия**: Используйте магов против плотных формирований.

---

## Интеграция с лидерами

Лидеры могут иметь пассивные способности, которые взаимодействуют с механиками:

### Примеры (Phase 1)

#### Humans

| Лидер | Пассивка | Взаимодействие |
|-------|----------|----------------|
| Командор Алдрик | +10% HP всем | Улучшает Resolve базу |
| Леди Элара | +15% исцеление | Восстанавливает HP (противодействует Contagion) |
| Сэр Галахад | Первый юнит получает таунт | Улучшает Engagement |

#### Undead

| Лидер | Пассивка | Взаимодействие |
|-------|----------|----------------|
| Лич-Король Малахар | +15% ATK при HP < 50% | Работает с Resolve системой |
| Леди Сильвана | +10% вампиризм | Восстанавливает HP (противодействует Contagion) |
| Некромант Кел'Тузад | Призывает скелета при смерти | Создаёт новые цели для Contagion |

---

## Файловая структура

### Progression System
```
docs/ROGUELIKE_DESIGN.md          # Фракции, лидеры, драфт, экономика
backend/src/roguelike/            # Реализация прогрессии
├── data/                         # Данные фракций, лидеров, юнитов
├── draft/                        # Система драфта
├── upgrade/                      # Система апгрейдов
├── economy/                      # Система экономики
├── run/                          # Система забегов
└── matchmaking/                  # Асинхронный PvP
```

### Battle Mechanics System
```
.kiro/specs/core-mechanics-2.0/   # Спецификация механик
backend/src/core/mechanics/       # Реализация механик
├── config/                       # Конфигурация, пресеты
├── tier0/                        # Facing
├── tier1/                        # Resolve, Engagement, Flanking
├── tier2/                        # Riposte, Intercept, Aura
├── tier3/                        # Charge, Overwatch, Phalanx, LoS, Ammo
├── tier4/                        # Contagion, Armor Shred
└── processor.ts                  # Главный процессор
```

### Integration
```
docs/ROGUELIKE_MECHANICS_INTEGRATION.md  # Этот документ
backend/src/roguelike/battle/            # Интеграция боевых механик
├── battle.service.ts                    # Использует MechanicsProcessor
└── battle.integration.spec.ts           # Интеграционные тесты
```

---

## Как добавить новую механику

### 1. Добавить в Core Mechanics 2.0

Обновить `.kiro/specs/core-mechanics-2.0/design.md`:
- Определить конфигурацию механики
- Добавить в граф зависимостей
- Описать фазы применения

### 2. Реализовать процессор

Создать `backend/src/core/mechanics/tierX/mechanic-name/`:
- `mechanic-name.processor.ts` — Логика механики
- `mechanic-name.types.ts` — Типы
- `mechanic-name.spec.ts` — Тесты

### 3. Обновить пресеты

Обновить `backend/src/core/mechanics/config/presets/`:
- `roguelike.ts` — Включить механику для roguelike
- `tactical.ts` — Опционально для других режимов

### 4. Обновить документацию

Обновить `docs/ROGUELIKE_DESIGN.md`:
- Добавить в раздел "Боевые механики"
- Описать стратегические последствия
- Привести примеры взаимодействия с лидерами

---

## Тестирование

### Unit Tests

Каждая механика имеет unit тесты:
```typescript
// backend/src/core/mechanics/tier1/resolve/resolve.spec.ts
describe('ResolveProcessor', () => {
  it('should regenerate resolve at turn start', () => { ... });
  it('should apply resolve damage from flanking', () => { ... });
  it('should trigger rout when resolve = 0', () => { ... });
});
```

### Integration Tests

Интеграционные тесты проверяют взаимодействие механик:
```typescript
// backend/src/roguelike/battle/battle.integration.spec.ts
describe('Roguelike Battle with Mechanics', () => {
  it('should apply resolve damage from flanking attacks', () => { ... });
  it('should trigger phalanx bonuses for adjacent units', () => { ... });
  it('should spread contagion effects to neighbors', () => { ... });
});
```

### Regression Tests

Регрессионные тесты гарантируют, что MVP режим работает идентично:
```typescript
// backend/src/core/mechanics/processor.spec.ts
describe('MVP Preset Backward Compatibility', () => {
  it('should produce identical results to core 1.0', () => {
    const result1 = simulateBattle(state, seed);
    const result2 = simulateBattle(state, seed, mvpProcessor);
    expect(result2).toEqual(result1);
  });
});
```

---

## Миграция с MVP на Roguelike

### Для разработчиков

```typescript
// MVP режим (Core 1.0)
const result = simulateBattle(state, seed);

// Roguelike режим (Core 2.0)
const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);
```

### Для игроков

- MVP режим: Классический боевой симулятор без механик
- Roguelike режим: Расширенный боевой симулятор с 14 механиками

Оба режима используют одинаковый боевой симулятор, но с разными конфигурациями механик.

---

## Часто задаваемые вопросы

### Q: Почему две отдельные системы?

**A**: Разделение позволяет:
- Независимо развивать прогрессию и механики
- Переиспользовать механики в других режимах (MVP, Tactical, Custom)
- Тестировать каждую систему отдельно
- Добавлять новые механики без изменения прогрессии

### Q: Как добавить новую фракцию?

**A**: 
1. Добавить определение фракции в `backend/src/roguelike/data/factions.data.ts`
2. Добавить юнитов в `backend/src/roguelike/data/units.data.ts`
3. Добавить лидеров в `backend/src/roguelike/data/leaders.data.ts`
4. Обновить `docs/ROGUELIKE_DESIGN.md`

### Q: Как добавить новую механику?

**A**: Следовать инструкциям в разделе "Как добавить новую механику" выше.

### Q: Почему Resolve система в обоих документах?

**A**: Resolve — это Tier 1 механика, которая:
- Определена в Core Mechanics 2.0 (как работает)
- Используется в Roguelike Design (как влияет на стратегию)
- Взаимодействует с лидерами (пассивки могут давать бонусы)

Это нормально, что одна система упоминается в обоих документах — они описывают разные аспекты.

---

## Ссылки

- **Roguelike Design**: `docs/ROGUELIKE_DESIGN.md`
- **Core Mechanics 2.0**: `.kiro/specs/core-mechanics-2.0/design.md`
- **Core Mechanics 2.0 Requirements**: `.kiro/specs/core-mechanics-2.0/requirements.md`
- **Core Mechanics 2.0 Tasks**: `.kiro/specs/core-mechanics-2.0/tasks.md`
- **Roguelike Run Spec**: `.kiro/specs/roguelike-run/`
- **Core Library Documentation**: `docs/CORE_LIBRARY.md`
