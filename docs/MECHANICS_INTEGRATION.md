# Интеграция механик 2.0

## Обзор

Механики 2.0 — это модульная система боевых механик, которая расширяет базовый симулятор боя (Core 1.0). Каждая механика может быть включена или выключена независимо через настройки в профиле игрока.

## Как использовать

### Настройка в UI

1. Перейдите в **Профиль** → **Настройки**
2. Найдите секцию **"Механики боя 2.0"**
3. Выберите один из пресетов:
   - **MVP (Классика)** — все механики отключены, поведение Core 1.0
   - **Тактический** — Tier 0-2 механики (направление, фланги, рипост)
   - **Roguelike** — все 14 механик включены
   - **Пользовательский** — настройте каждую механику вручную

4. Нажмите "Детальные настройки" для тонкой настройки отдельных механик

### Пресеты

| Пресет | Механики | Описание |
|--------|----------|----------|
| MVP | 0/14 | Базовый бой без дополнительных систем |
| Tactical | 7/14 | Facing, Resolve, Engagement, Flanking, Riposte, Intercept, Aura |
| Roguelike | 14/14 | Все механики для максимальной тактической глубины |
| Custom | N/14 | Любая комбинация механик |

## Статус интеграции механик

### ✅ Полностью интегрированы в симулятор боя

| Механика | Tier | Описание | Интеграция |
|----------|------|----------|------------|
| **Facing** | 0 | Направление юнита | ✅ Инициализируется при создании юнита (N для игрока, S для бота) |
| **Resolve** | 1 | Мораль/боевой дух | ✅ Инициализируется из шаблона, урон от фланговых атак |
| **Engagement** | 1 | Зона контроля | ✅ Через phase hooks |
| **Flanking** | 1 | Бонус за атаку с фланга/тыла | ✅ +15% flank, +30% rear, resolve damage |
| **Riposte** | 2 | Контратака | ✅ Через phase hooks, блокируется фланговыми атаками |
| **Intercept** | 2 | Перехват кавалерии | ✅ Через phase hooks |
| **Aura** | 2 | Ауры поддержки | ✅ Через phase hooks |
| **Charge** | 3 | Атака с разбега | ✅ Momentum bonus к урону |
| **Overwatch** | 3 | Режим наблюдения | ✅ Через phase hooks |
| **Phalanx** | 3 | Формация фаланги | ✅ Через phase hooks |
| **Line of Sight** | 3 | Линия видимости | ✅ Через phase hooks |
| **Ammunition** | 3 | Боеприпасы | ✅ Инициализируется из шаблона, через phase hooks |
| **Contagion** | 4 | Распространение эффектов | ✅ Через phase hooks |
| **Armor Shred** | 4 | Пробитие брони | ✅ Через phase hooks, учитывается в расчёте урона |

### Инициализация юнитов (Core 2.0)

При создании юнита в `createBattleUnits()` инициализируются следующие поля:

```typescript
{
  // Базовые поля
  facing: 'N' | 'S',           // N для игрока, S для бота
  resolve: number,              // Из шаблона или 100
  maxResolve: number,           // Из шаблона или 100
  riposteCharges: number,       // Из шаблона или 0
  ammunition: number | undefined, // Из шаблона (для ranged)
  maxAmmunition: number | undefined,
  tags: string[],               // Из шаблона
  
  // Состояние боя
  armorShred: 0,
  isEngaged: false,
  engagedBy: [],
  chargeMomentum: 0,
  isInOverwatch: false,
  isInPhalanx: false,
}
```

### Теги юнитов по ролям

| Роль | Юниты | Теги |
|------|-------|------|
| **Tank** | Knight | `melee`, `heavy`, `phalanx` |
| | Guardian | `melee`, `heavy`, `phalanx`, `spear_wall` |
| | Berserker | `melee`, `charge` |
| **Melee DPS** | Rogue | `melee`, `light`, `flanker` |
| | Duelist | `melee`, `duelist` |
| | Assassin | `melee`, `light`, `flanker`, `assassin` |
| **Ranged DPS** | Archer | `ranged`, `light` |
| | Crossbowman | `ranged`, `heavy`, `armor_piercing` |
| | Hunter | `ranged`, `light`, `overwatch` |
| **Mage** | Mage | `mage`, `fire`, `aoe` |
| | Warlock | `mage`, `curse`, `lifesteal` |
| | Elementalist | `mage`, `frost`, `lightning`, `aoe` |
| **Support** | Priest | `support`, `healer`, `aura` |
| | Bard | `support`, `buffer`, `aura`, `light` |
| **Control** | Enchanter | `mage`, `control`, `debuffer`, `aura` |

### Параметры механик по юнитам

| Юнит | Resolve | Riposte | Ammo | Faction |
|------|---------|---------|------|---------|
| Knight | 100 | 1 | - | human |
| Guardian | 120 | 1 | - | human |
| Berserker | 60 | 2 | - | human |
| Rogue | 70 | 2 | - | human |
| Duelist | 90 | 3 | - | human |
| Assassin | 60 | 1 | - | human |
| Archer | 70 | 0 | 8 | human |
| Crossbowman | 80 | 0 | 6 | human |
| Hunter | 85 | 1 | 10 | human |
| Mage | 65 | 0 | - | human |
| Warlock | 80 | 0 | - | human |
| Elementalist | 60 | 0 | - | human |
| Priest | 100 | 0 | - | human |
| Bard | 90 | 1 | - | human |
| Enchanter | 75 | 0 | - | human |

## Рекомендации по тестированию

### Что можно протестировать

1. **MVP Preset (все механики выключены)**
   - Базовый бой без дополнительных систем
   - Идентичен поведению Core 1.0

2. **Tactical Preset (Tier 0-2)**
   - Facing: юниты поворачиваются к целям
   - Flanking: атаки с флангов/тыла наносят больше урона
   - Resolve: мораль влияет на поведение юнитов
   - Riposte: melee юниты контратакуют при атаке спереди
   - Engagement: зона контроля ограничивает движение

3. **Roguelike Preset (все 14 механик)**
   - Charge: Berserker получает бонус при атаке с разбега
   - Phalanx: Knight и Guardian получают бонус в формации
   - Ammunition: Archer, Crossbowman, Hunter расходуют стрелы
   - Armor Shred: броня снижается с каждой атакой
   - Contagion: эффекты магов распространяются на соседей

### Примеры тактических комбинаций

1. **Фаланга танков**
   - Knight + Guardian рядом = бонус брони и морали
   - Используйте `tags: ['phalanx']` для активации

2. **Фланговая атака**
   - Rogue и Assassin с `tags: ['flanker']`
   - Атакуйте с тыла для +100% урона (backstab)

3. **Контроль кавалерии**
   - Guardian с `tags: ['spear_wall']`
   - Перехватывает charge атаки Berserker

4. **Поддержка аурами**
   - Priest и Bard с `tags: ['aura']`
   - Бафают союзников в радиусе

## Архитектура

### Поток данных

```
Frontend (uiStore)          Backend (battle.service)
       │                            │
       │ mechanicsPreset            │
       │ mechanicsToggles           │
       ▼                            ▼
   API Request ──────────────► createMechanicsProcessor()
                                    │
                                    ▼
                              MechanicsProcessor
                                    │
                                    ▼
                              simulateBattle()
                                    │
                                    ▼
                              Phase Hooks:
                              - turn_start
                              - movement
                              - pre_attack
                              - attack
                              - post_attack
                              - turn_end
```

### Файлы интеграции

| Файл | Назначение |
|------|------------|
| `frontend/src/store/uiStore.ts` | Хранение настроек механик |
| `frontend/src/app/profile/ProfilePageContent.tsx` | UI для настройки |
| `frontend/src/lib/api.ts` | Передача настроек в API |
| `backend/src/battle/dto/battle.dto.ts` | DTO с полями механик |
| `backend/src/battle/battle.service.ts` | Создание MechanicsProcessor |
| `backend/src/battle/battle.simulator.ts` | Интеграция с симулятором |
| `backend/src/core/mechanics/` | Реализация механик |

## Следующие шаги

1. ~~**Расширить данные юнитов**~~ ✅ — добавлены поля механик 2.0 в `unit.data.ts`
2. ~~**Добавить теги юнитам**~~ ✅ — cavalry, ranged, mage, phalanx, spear_wall
3. **Создать ауры** — для Support юнитов (Priest, Bard)
4. **Тестирование** — проверить каждую механику отдельно
5. **Балансировка** — настроить конфиги механик под игровой баланс

## Исправленные проблемы

### Исправление идентификации юнитов (январь 2026)

**Проблема**: Механики не применялись корректно в бою, потому что функции `updateUnit` и `updateUnits` в `helpers.ts` использовали `unit.id` (тип юнита, например "knight") вместо `unit.instanceId` (уникальный идентификатор экземпляра, например "player_knight_0").

**Решение**: Обновлены функции в `backend/src/core/mechanics/helpers.ts`:
- `updateUnit()` — теперь сначала ищет по `instanceId`, затем по `id` для обратной совместимости
- `updateUnits()` — аналогично, приоритет `instanceId`
- `findUnit()` — поиск сначала по `instanceId`, затем по `id`

**Затронутые механики**: Все механики, использующие `updateUnit`/`updateUnits`:
- Armor Shred (Tier 4)
- Contagion (Tier 4)
- Phalanx (Tier 3)
- Charge (Tier 3)
- Overwatch (Tier 3)
- И другие

## См. также

- [Core Library Documentation](./CORE_LIBRARY.md)
- [Mechanics README](../backend/src/core/mechanics/README.md)
- [Game Design Document](./GAME_DESIGN_DOCUMENT.md)
