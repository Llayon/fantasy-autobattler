# Unit & Faction Experiments

Этот документ описывает систему экспериментирования с юнитами и фракциями.

## Структура версионирования

```
backend/src/roguelike/data/
├── humans.units.ts          # Оригинальный файл (v1)
├── humans.units.v1.ts       # Явный экспорт v1
├── humans.units.v2.ts       # Экспериментальная версия v2
├── undead.units.ts          # Оригинальный файл (v1)
├── undead.units.v1.ts       # Явный экспорт v1
├── undead.units.v2.ts       # Экспериментальная версия v2
├── units.version-selector.ts # Переключатель версий
└── EXPERIMENTS.md           # Этот файл
```

## Как использовать

### 1. Переключение версий через .env

```bash
# Использовать стабильную версию (по умолчанию)
UNITS_VERSION=v1

# Использовать экспериментальную версию
UNITS_VERSION=v2
```

### 2. Редактирование экспериментальной версии

Отредактируй `backend/src/roguelike/data/humans.units.v2.ts` или `undead.units.v2.ts`:

```typescript
// Пример: увеличить HP Footman на 10%
export const FOOTMAN_T1: RoguelikeUnit = {
  ...FOOTMAN_T1_V1,
  hp: 110, // было 100
};
```

### 3. Тестирование

```bash
# Запустить с v1 (стабильная)
npm run start

# Запустить с v2 (экспериментальная)
UNITS_VERSION=v2 npm run start

# Запустить тесты с v2
UNITS_VERSION=v2 npm test
```

## Откат изменений

### Откат на git

```bash
# Если что-то пошло не так, просто удали ветку
git checkout main
git branch -D experiment/units-factions

# Или вернись к последнему коммиту
git reset --hard HEAD
```

### Откат через env

```bash
# Просто измени UNITS_VERSION обратно на v1
UNITS_VERSION=v1 npm run start
```

## Рекомендуемые эксперименты

### Баланс атаки/защиты
- Увеличить ATK Undead на 5-10%
- Уменьшить HP Humans на 5%
- Проверить win rate в боях

### Стоимость юнитов
- Уменьшить стоимость дорогих юнитов (Champion, Lich)
- Увеличить стоимость дешёвых юнитов (Footman, Zombie)
- Проверить разнообразие команд

### Специальные способности
- Изменить эффект пассивных способностей
- Добавить новые способности T3 юнитам
- Тестировать синергии

## Отслеживание изменений

Каждый эксперимент должен быть задокументирован в начале файла v2:

```typescript
/**
 * Humans Faction Units Data - Version 2 (Experimental)
 *
 * Changes from v1:
 * - Footman HP: 100 → 110 (+10%)
 * - Knight cost: 5 → 4 (-1)
 * - Paladin ATK: 22 → 25 (+3)
 */
```

## Коммиты

Когда экспериментируешь:

```bash
# Коммитить в ветку experiment
git add backend/src/roguelike/data/humans.units.v2.ts
git commit -m "Experiment: increase Footman HP by 10%"

# Если нравится - мержить в main
git checkout main
git merge experiment/units-factions

# Если не нравится - просто удалить ветку
git branch -D experiment/units-factions
```

## Полезные команды

```bash
# Посмотреть текущую версию
grep "UNITS_VERSION" backend/.env

# Запустить с логированием версии
UNITS_VERSION=v2 npm run start 2>&1 | grep "Units version"

# Сравнить v1 и v2
diff backend/src/roguelike/data/humans.units.v1.ts backend/src/roguelike/data/humans.units.v2.ts

# Запустить только тесты юнитов
npm test -- --testPathPattern="units.data"
```

## Когда закончишь эксперименты

### Если результаты хорошие:
```bash
# Обновить основной файл
cp backend/src/roguelike/data/humans.units.v2.ts backend/src/roguelike/data/humans.units.ts

# Удалить v2 файлы
rm backend/src/roguelike/data/humans.units.v2.ts
rm backend/src/roguelike/data/undead.units.v2.ts

# Мержить ветку
git checkout main
git merge experiment/units-factions
```

### Если результаты плохие:
```bash
# Просто удалить ветку
git checkout main
git branch -D experiment/units-factions
```

## Примечания

- Версионирование работает через `UNITS_VERSION` env переменную
- По умолчанию используется v1 (стабильная версия)
- v2 файлы импортируют из v1 как базовую версию
- Все тесты должны проходить для обеих версий
- Не забывай обновлять документацию при добавлении новых экспериментов
