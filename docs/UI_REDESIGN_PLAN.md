# 🎨 План переработки интерфейса «Конструктор команды»

> Анализ UX/UI и детальный план редизайна Team Builder для мобильного автобаттлера

---

## 1. Анализ текущего интерфейса

### 1.1 Сильные стороны

| Элемент | Оценка |
|---------|--------|
| **Бюджет-индикатор** | Отлично — визуально чёткий, цветовая индикация (зелёный), показывает Used/Remaining |
| **Цветовая кодировка карточек** | Хорошо — разные цвета рамок по ролям (жёлтый, фиолетовый, красный, синий) |
| **Фильтры** | Функционально — есть поиск, роль, стоимость, сортировка |
| **Зонирование поля** | Понятно — Player Zone (0-1) синяя, Enemy Zone (8-9) красная |
| **Подсказки** | Присутствуют — три текстовые подсказки под полем |

### 1.2 Критические проблемы

#### UX-проблемы

| Проблема | Severity | Описание |
|----------|----------|----------|
| **Перегруженность экрана** | 🔴 Critical | Слишком много элементов одновременно: фильтры + карточки + поле + matchmaking |
| **Мелкие карточки юнитов** | 🔴 Critical | На мобильном 6 статов нечитаемы, иконки ~20px |
| **Drag-and-drop на touch** | 🔴 Critical | Перетаскивание неудобно на маленьких экранах |
| **Нет feedback при действиях** | 🟡 Major | Непонятно, что происходит при клике на юнита в списке vs на поле |
| **Скрытая информация** | 🟡 Major | Особенности юнитов (abilities) не видны без hover |
| **Matchmaking внизу** | 🟡 Major | Занимает место, хотя используется только после сборки команды |

#### Визуальные проблемы

| Проблема | Описание |
|----------|----------|
| **Низкий контраст текста** | Белый текст на цветных карточках плохо читается |
| **Иконки ролей неочевидны** | Сердце = поддержка? Меч = ближний бой? Нужна легенда |
| **Бейджи стоимости** | Маленькие кружки с цифрами (3, 4, 5, 6, 7) сливаются |
| **Сетка поля** | 8×10 клеток слишком мелкие, особенно на мобильном |

### 1.3 Отсутствующие функции

- Превью способностей юнита
- Предпросмотр синергий команды
- Quick-select сохранённых команд
- Undo/Redo размещения
- Zoom поля боя
- Статистика команды (суммарный DPS, HP, средняя инициатива)

---

## 2. План переработки (по приоритетам)


### ✅ Приоритет 1: Mobile-First редизайн

#### 2.1.1 Новая компоновка (вертикальная)

```
┌─────────────────────────────────┐
│  Header: Budget + Actions       │  ← Фиксированный
├─────────────────────────────────┤
│  Grid (8×2 player zone)         │  ← Полное поле с h-scroll/zoom
├─────────────────────────────────┤
│  Unit List (scrollable)         │  ← Основная область
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Unit │ │Unit │ │Unit │       │
│  └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────┤
│  Bottom Sheet: Filters/Actions  │  ← Выдвижная панель
└─────────────────────────────────┘
```

#### 2.1.2 Замена Drag-and-Drop на Tap-to-Place

```typescript
// Новый flow взаимодействия
1. Tap на юнита в списке → юнит "выбран" (подсветка)
2. Tap на клетку поля → юнит размещается
3. Tap на размещённого юнита → меню (удалить/переместить)
```

#### 2.1.3 Адаптивные breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Вертикальный, mini-grid сверху |
| 640-1024px (tablet) | Горизонтальный, поле справа |
| > 1024px (desktop) | Текущий layout с улучшениями |

### ✅ Приоритет 2: Визуальная иерархия

#### 2.2.1 Новая цветовая схема ролей

| Роль | Цвет | Hex | Иконка |
|------|------|-----|--------|
| Tank | Синий | `#3B82F6` | 🛡️ Shield |
| Melee DPS | Красный | `#EF4444` | ⚔️ Swords |
| Ranged DPS | Зелёный | `#22C55E` | 🏹 Bow |
| Mage | Фиолетовый | `#A855F7` | ✨ Sparkles |
| Support | Жёлтый | `#EAB308` | 💚 Heart |
| Control | Бирюзовый | `#06B6D4` | 🔮 Crystal |

#### 2.2.2 Редизайн карточки юнита

```
┌──────────────────────────────┐
│ [5] 🛡️ Knight               │  ← Cost badge + Role icon + Name
├──────────────────────────────┤
│  ❤️ 150   ⚔️ 12   🏃 2      │  ← HP, ATK, Speed (крупно)
│  🎯 1     🛡️ 8              │  ← #ATK, Armor (мелко)
├──────────────────────────────┤
│  "Taunt: enemies attack me"  │  ← Ability preview (1 строка)
└──────────────────────────────┘
```

#### 2.2.3 Улучшение Budget Bar

```
┌─────────────────────────────────────┐
│  💰 10/30  ████████░░░░░░░░░░░░░░  │
│       Used        Remaining: 20     │
└─────────────────────────────────────┘
```

- Анимация при изменении
- Цвет меняется: зелёный (0-50%) → жёлтый (50-80%) → красный (80-100%)
- Shake-эффект при превышении бюджета


### ✅ Приоритет 3: Новые функции

#### 2.3.1 Unit Detail Modal

```
┌─────────────────────────────────────┐
│  [X]                    Knight  [5] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  🛡️ TANK                           │
│                                     │
│  Stats                              │
│  ❤️ HP: 150    ⚔️ ATK: 12          │
│  🏃 Speed: 2   🎯 #ATK: 1          │
│  🛡️ Armor: 8   ⚡ Init: 3          │
│                                     │
│  Ability: Taunt                     │
│  "Forces nearby enemies to attack   │
│   this unit for 2 turns"            │
│                                     │
│  [ Add to Team ]  [ Cancel ]        │
└─────────────────────────────────────┘
```

#### 2.3.2 Team Stats Summary

```
┌─────────────────────────────────────┐
│  Team Summary (3 units)             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Total HP: 280   Avg Init: 4.2      │
│  Total DPS: ~45  Roles: 🛡️1 ⚔️1 💚1 │
└─────────────────────────────────────┘
```

#### 2.3.3 Quick Team Selector

```
┌─────────────────────────────────────┐
│  📁 My Teams                   [+]  │
├─────────────────────────────────────┤
│  ⭐ "Rush Comp"     25/30  [Load]   │
│     🛡️🛡️⚔️⚔️⚔️                    │
├─────────────────────────────────────┤
│  "Tank Meta"        28/30  [Load]   │
│     🛡️🛡️🛡️💚💚                    │
└─────────────────────────────────────┘
```

---

## 3. Wireframe нового интерфейса

### 3.1 Mobile Layout (< 640px)

```
┌─────────────────────────────────────┐
│ ☰  Team Builder    💰 10/30  [⚔️]  │  48px header
├─────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐
│ │  [Жрец][    ][    ][Дуэл][    ][    ][    ][  ]│ │  Full 8×2 grid
│ │  [    ][    ][    ][    ][    ][    ][    ][  ]│ │  с горизонтальным
│ └─────────────────────────────────────────────────┘   скроллом или zoom
│         ← swipe для навигации →                 │  100-120px height
├─────────────────────────────────────┤
│ 🔍 Search...        [Filter ▼]      │  40px
├─────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐      │
│ │ 🛡️ 5  │ │ ⚔️ 4  │ │ 🏹 3  │      │  Unit cards
│ │Knight │ │Rogue  │ │Archer │      │  (2 columns)
│ │HP:150 │ │HP:80  │ │HP:65  │      │
│ │ATK:12 │ │ATK:22 │ │ATK:18 │      │
│ └───────┘ └───────┘ └───────┘      │
│ ┌───────┐ ┌───────┐ ┌───────┐      │
│ │ ...   │ │ ...   │ │ ...   │      │
│ └───────┘ └───────┘ └───────┘      │
│           (scrollable)              │
├─────────────────────────────────────┤
│ [Clear] [My Teams] [Save] [Battle!] │  56px footer
└─────────────────────────────────────┘
```


### 3.2 Desktop Layout (> 1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  🎮 Team Builder    [Команда] [Бой] [История] [Профиль]    💰 10/30  │
├────────────────────┬─────────────────────────────────────────────────┤
│  🔍 Search...      │                                                 │
│  ──────────────    │     ┌───┬───┬───┬───┬───┬───┬───┬───┐          │
│  Role: [All ▼]     │     │   │ 💚│   │ ⚔️│   │   │   │   │  Row 0   │
│  Cost: [All ▼]     │     ├───┼───┼───┼───┼───┼───┼───┼───┤          │
│  ──────────────    │     │   │   │   │   │   │   │   │   │  Row 1   │
│  Sort: [Name ▼]    │     └───┴───┴───┴───┴───┴───┴───┴───┘          │
│  ──────────────    │                                                 │
│                    │     Team: 2 units | HP: 135 | DPS: ~28          │
│  ┌──────────────┐  │                                                 │
│  │ 🛡️ Knight [5]│  │─────────────────────────────────────────────────│
│  │ HP:150 ATK:12│  │                                                 │
│  │ Taunt ability│  │     ┌───┬───┬───┬───┬───┬───┬───┬───┐          │
│  └──────────────┘  │     │   │   │   │   │   │   │   │   │  Row 8   │
│  ┌──────────────┐  │     ├───┼───┼───┼───┼───┼───┼───┼───┤          │
│  │ ⚔️ Rogue  [4]│  │     │   │   │   │   │   │   │   │   │  Row 9   │
│  │ HP:80  ATK:22│  │     └───┴───┴───┴───┴───┴───┴───┴───┘          │
│  │ Backstab    │  │                                                 │
│  └──────────────┘  │     Enemy Zone (preview)                       │
│  ...               │                                                 │
├────────────────────┴─────────────────────────────────────────────────┤
│  [🗑️ Clear]  [📁 My Teams]  [💾 Save]           [⚔️ Find Match!]    │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Спецификация элементов

| Элемент | Desktop | Mobile | Font |
|---------|---------|--------|------|
| Header | 64px | 48px | 18px semi-bold |
| Unit Card | 180×120px | 140×100px | 14px / 12px |
| Grid Cell | 60×60px | 40×40px | — |
| Button Primary | 120×40px | 100% width, 48px | 16px bold |
| Budget Bar | 200×32px | 100% width, 24px | 14px |

### 3.4 Анимации

| Действие | Анимация | Duration |
|----------|----------|----------|
| Unit select | Scale 1.05 + glow | 150ms ease-out |
| Unit place | Slide + fade in | 200ms ease-out |
| Unit remove | Scale 0.8 + fade out | 150ms ease-in |
| Budget change | Number counter + bar fill | 300ms ease-out |
| Invalid action | Shake + red flash | 300ms |
| Drag preview | Ghost opacity 0.7 | — |

---

## 4. Техническое задание для разработчиков

### 4.1 Компоненты для создания/рефакторинга


#### 4.1.1 `UnitCard` (рефакторинг)

```typescript
interface UnitCardProps {
  unit: Unit;
  variant: 'list' | 'grid' | 'compact';
  isSelected?: boolean;
  isInTeam?: boolean;
  onSelect?: (unit: Unit) => void;
  onLongPress?: (unit: Unit) => void; // для mobile detail
}

// Размеры по variant:
// list: 180×120px (desktop), 140×100px (mobile)
// grid: 60×60px (на поле боя)
// compact: 100×80px (в saved teams preview)
```

#### 4.1.2 `UnitDetailModal` (новый)

```typescript
interface UnitDetailModalProps {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
  onAddToTeam?: (unit: Unit) => void;
  canAdd: boolean; // false если бюджет превышен
}
```

#### 4.1.3 `BattleGrid` (рефакторинг)

```typescript
interface BattleGridProps {
  variant: 'full' | 'mini' | 'preview';
  placedUnits: PlacedUnit[];
  selectedUnit?: Unit | null;
  onCellClick: (row: number, col: number) => void;
  onUnitClick: (unit: PlacedUnit) => void;
  isInteractive: boolean;
}

// Размеры:
// full: 8×10, cell 60px (desktop)
// mini: 8×2, cell 40px (mobile, только player zone)
// preview: 8×10, cell 30px (в saved teams)
```

#### 4.1.4 `BudgetIndicator` (рефакторинг)

```typescript
interface BudgetIndicatorProps {
  used: number;
  total: number;
  variant: 'bar' | 'compact';
  showAnimation?: boolean;
}

// Цвета:
// 0-50%: green (#22C55E)
// 50-80%: yellow (#EAB308)
// 80-100%: red (#EF4444)
// >100%: red + shake animation
```

#### 4.1.5 `UnitFilters` (рефакторинг)

```typescript
interface UnitFiltersProps {
  variant: 'sidebar' | 'bottomsheet' | 'inline';
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  role: UnitRole | 'all';
  costRange: [number, number] | 'all';
  sortBy: 'name' | 'cost' | 'hp' | 'atk' | 'role';
  sortOrder: 'asc' | 'desc';
}
```

#### 4.1.6 `SavedTeamsPanel` (новый)

```typescript
interface SavedTeamsPanelProps {
  teams: SavedTeam[];
  onLoad: (team: SavedTeam) => void;
  onDelete: (teamId: string) => void;
  onRename: (teamId: string, newName: string) => void;
  variant: 'modal' | 'sidebar';
}

interface SavedTeam {
  id: string;
  name: string;
  units: PlacedUnit[];
  totalCost: number;
  createdAt: Date;
  isFavorite: boolean;
}
```

#### 4.1.7 `TeamSummary` (новый)

```typescript
interface TeamSummaryProps {
  units: PlacedUnit[];
  variant: 'full' | 'compact';
}

// Показывает:
// - Total HP, Total DPS estimate
// - Role distribution (icons)
// - Average initiative
// - Synergy warnings (e.g., "No healer!")
```

#### 4.1.8 `MatchmakingPanel` (рефакторинг)

```typescript
interface MatchmakingPanelProps {
  isReady: boolean; // true если команда валидна
  onFindMatch: (type: 'pvp' | 'bot', difficulty?: BotDifficulty) => void;
  variant: 'expanded' | 'collapsed';
}

// На mobile: collapsed по умолчанию, expand по tap
// На desktop: всегда expanded внизу
```


### 4.2 Логика взаимодействия

#### 4.2.1 Tap-to-Place Flow (Mobile)

```typescript
// gameStore.ts
interface TeamBuilderState {
  selectedUnit: Unit | null;
  placedUnits: PlacedUnit[];
  interactionMode: 'select' | 'place' | 'remove';
}

// Actions:
selectUnit(unit: Unit): void
// 1. Если unit уже selected → deselect
// 2. Если unit в команде → переключить в режим 'remove'
// 3. Иначе → select, переключить в режим 'place'

placeUnit(row: number, col: number): void
// 1. Проверить: row in [0,1], col in [0,7]
// 2. Проверить: клетка свободна
// 3. Проверить: бюджет позволяет
// 4. Если всё ок → добавить unit, deselect
// 5. Если нет → показать toast с ошибкой

removeUnit(unitId: string): void
// 1. Удалить из placedUnits
// 2. Обновить бюджет
// 3. Показать toast "Unit removed"
```

#### 4.2.2 Drag-and-Drop Flow (Desktop)

```typescript
// Используем @dnd-kit/core

onDragStart(event: DragStartEvent): void
// 1. Установить draggingUnit
// 2. Показать ghost preview

onDragOver(event: DragOverEvent): void
// 1. Подсветить valid drop zones
// 2. Показать preview позиции

onDragEnd(event: DragEndEvent): void
// 1. Если drop на valid cell → placeUnit()
// 2. Если drop вне поля → cancel
// 3. Очистить draggingUnit
```

#### 4.2.3 Сохранение команд

```typescript
// teamStore.ts

saveTeam(name: string): Promise<SavedTeam>
// 1. Валидировать: минимум 1 юнит
// 2. Создать SavedTeam object
// 3. POST /api/teams
// 4. Добавить в локальный список
// 5. Показать toast "Team saved!"

loadTeam(teamId: string): void
// 1. Очистить текущую команду
// 2. Загрузить units из saved team
// 3. Разместить на поле
// 4. Показать toast "Team loaded"

// Автосохранение в localStorage:
// - При каждом изменении → debounce 1s → save to localStorage
// - При загрузке страницы → restore from localStorage
```

### 4.3 Responsive Breakpoints

```typescript
// tailwind.config.ts
theme: {
  screens: {
    'sm': '640px',   // Mobile landscape / small tablet
    'md': '768px',   // Tablet portrait
    'lg': '1024px',  // Tablet landscape / small desktop
    'xl': '1280px',  // Desktop
    '2xl': '1536px', // Large desktop
  }
}

// Layout switching:
// < 640px: Mobile vertical layout
// 640-1023px: Tablet hybrid layout
// >= 1024px: Desktop horizontal layout
```

### 4.4 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through units, Enter to select, Arrow keys on grid |
| Screen reader | aria-labels на всех интерактивных элементах |
| Color contrast | WCAG AA minimum (4.5:1 для текста) |
| Touch targets | Minimum 44×44px на mobile |
| Focus indicators | Visible focus ring на всех interactive elements |
| Reduced motion | Respect `prefers-reduced-motion` |

### 4.5 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Unit list render (15 units) | < 16ms |
| Grid re-render | < 8ms |
| Drag preview FPS | 60fps |


---

## 5. Приоритизированный план реализации с промптами

### Условные обозначения

- 🔧 **CREATE** — промпт для создания/имплементации
- 🔍 **REVIEW** — промпт для проверки и улучшения
- ⏱️ **Time** — примерное время выполнения

---

### Phase 1: Mobile UX (1-2 недели)

#### Step 1.1: BattleGrid variant='mini'
⏱️ 30 min | 🔴 High

🔧 **CREATE:**
```
Рефакторинг frontend/src/components/BattleGrid.tsx:
1. Добавь prop variant: 'full' | 'mini' | 'preview'
2. variant='mini' показывает только player zone (8×2 клетки, rows 0-1)
3. На mobile (<640px) используй клетки 40×40px с горизонтальным скроллом
4. Добавь pinch-to-zoom для mobile (используй существующий ZoomableGrid или react-zoom-pan-pinch)
5. Сохрани обратную совместимость — variant='full' по умолчанию

Следуй паттернам из docs/ENGINEERING_GUIDE.md, используй Tailwind.
```

🔍 **REVIEW:**
```
Проверь BattleGrid с variant='mini':
1. Показывает только 8×2 клетки (rows 0-1)
2. Горизонтальный скролл работает на mobile
3. Zoom работает (pinch gesture)
4. variant='full' не сломан (проверь BattleReplay)
5. Нет TypeScript ошибок, нет any
6. Touch targets >= 44px
Протестируй в Chrome DevTools mobile emulator.
```

---

#### Step 1.2: UnitDetailModal
⏱️ 35 min | 🔴 High

🔧 **CREATE:**
```
Создай frontend/src/components/UnitDetailModal.tsx:
1. Modal с полной информацией о юните (все статы, способность, описание)
2. Props: unit, isOpen, onClose, onAddToTeam, canAdd
3. Кнопки: "Add to Team" (disabled если canAdd=false), "Close"
4. Показывай причину если canAdd=false (бюджет превышен, юнит уже в команде)
5. Анимация появления (fade + scale)
6. Закрытие по клику вне modal и по Escape

Используй Tailwind, следуй паттерну из SavedTeamsModal.tsx.
Добавь aria-labels для accessibility.
```

🔍 **REVIEW:**
```
Проверь UnitDetailModal:
1. Все статы юнита отображаются корректно
2. Способность и описание видны
3. canAdd=false показывает причину
4. Закрытие работает (клик вне, Escape, кнопка)
5. Анимация плавная
6. Accessible (aria-modal, aria-labelledby, focus trap)
7. Responsive на mobile
```

---

#### Step 1.3: Tap-to-Place Flow
⏱️ 45 min | 🔴 High

🔧 **CREATE:**
```
Реализуй Tap-to-Place в frontend/src/store/teamStore.ts и TeamBuilder.tsx:

1. Добавь в store:
   - selectedUnit: Unit | null
   - interactionMode: 'select' | 'place' | 'remove'
   - selectUnit(unit): void
   - deselectUnit(): void

2. Flow:
   - Tap на юнита в UnitList → selectUnit() → подсветка юнита
   - Tap на пустую клетку в BattleGrid → placeUnit() → юнит размещается
   - Tap на размещённого юнита → показать context menu (удалить/переместить)

3. Visual feedback:
   - Выбранный юнит: ring-2 ring-blue-500
   - Valid drop zones: подсветка зелёным
   - Invalid zones: подсветка красным при попытке

4. На desktop сохрани drag-and-drop как альтернативу.
```

🔍 **REVIEW:**
```
Проверь Tap-to-Place:
1. Tap на юнита выделяет его
2. Tap на клетку размещает выбранного юнита
3. Нельзя разместить вне rows 0-1
4. Нельзя разместить если бюджет превышен
5. Toast показывается при ошибке
6. Drag-and-drop всё ещё работает на desktop
7. Нет race conditions в store
```

---

#### Step 1.4: Адаптивный Layout
⏱️ 40 min | 🔴 High

🔧 **CREATE:**
```
Рефакторинг frontend/src/components/TeamBuilder.tsx для responsive layout:

Mobile (<640px):
- Вертикальный layout
- Header: Budget + Actions (sticky)
- BattleGrid variant='mini' с h-scroll
- UnitList в 2 колонки
- Footer: Clear, My Teams, Save, Battle (sticky)

Tablet (640-1024px):
- Горизонтальный layout
- UnitList слева (1/3)
- BattleGrid справа (2/3)

Desktop (>1024px):
- Текущий layout с улучшениями

Используй Tailwind responsive prefixes: sm:, md:, lg:
Добавь CSS Grid или Flexbox для layout switching.
```

🔍 **REVIEW:**
```
Проверь responsive layout:
1. Mobile: вертикальный, grid сверху, список снизу
2. Tablet: горизонтальный split
3. Desktop: полный layout
4. Нет горизонтального overflow на mobile
5. Sticky header/footer работают
6. Переходы между breakpoints плавные
Тестируй на 320px, 640px, 1024px, 1440px.
```

---

#### Step 1.5: Mobile Testing
⏱️ 25 min | 🟡 Medium

🔧 **CREATE:**
```
Создай чеклист и протестируй на реальных устройствах:

1. Устройства для теста:
   - iPhone SE (375px) — маленький экран
   - iPhone 14 (390px) — средний
   - iPad (768px) — tablet
   - Android (360px) — типичный Android

2. Проверь:
   - Touch targets >= 44px
   - Tap-to-place работает
   - Scroll не конфликтует с drag
   - Zoom работает
   - Нет случайных кликов
   - Клавиатура не перекрывает input

3. Исправь найденные проблемы.
```

🔍 **REVIEW:**
```
Проверь результаты mobile testing:
1. Все критичные баги исправлены
2. Touch experience плавный
3. Нет accessibility issues
4. Performance приемлемый (нет лагов)
5. Документируй известные ограничения
```

---

### Phase 2: Visual Polish (1 неделя)

#### Step 2.1: Цветовая схема ролей
⏱️ 20 min | 🟡 Medium

🔧 **CREATE:**
```
Создай frontend/src/lib/roleColors.ts:

export const ROLE_COLORS = {
  tank: { bg: '#3B82F6', text: '#FFFFFF', icon: '🛡️' },
  melee_dps: { bg: '#EF4444', text: '#FFFFFF', icon: '⚔️' },
  ranged_dps: { bg: '#22C55E', text: '#FFFFFF', icon: '🏹' },
  mage: { bg: '#A855F7', text: '#FFFFFF', icon: '✨' },
  support: { bg: '#EAB308', text: '#000000', icon: '💚' },
  control: { bg: '#06B6D4', text: '#FFFFFF', icon: '🔮' },
};

export function getRoleColor(role: UnitRole): RoleColor;
export function getRoleIcon(role: UnitRole): string;

Обнови UnitCard.tsx чтобы использовать эти цвета.
Проверь контраст текста (WCAG AA).
```

🔍 **REVIEW:**
```
Проверь цветовую схему:
1. Все 6 ролей имеют уникальные цвета
2. Контраст текста >= 4.5:1 (используй WebAIM checker)
3. Цвета различимы для дальтоников (проверь в Sim Daltonism)
4. UnitCard использует новые цвета
5. Консистентность во всём приложении
```

---

#### Step 2.2: UnitCard Redesign
⏱️ 35 min | 🟡 Medium

🔧 **CREATE:**
```
Рефакторинг frontend/src/components/UnitCard.tsx:

1. Добавь prop variant: 'list' | 'grid' | 'compact'
2. Новый дизайн карточки:
   - Header: [Cost badge] [Role icon] Name
   - Stats row 1: ❤️ HP, ⚔️ ATK, 🏃 Speed (крупно)
   - Stats row 2: 🎯 #ATK, 🛡️ Armor (мелко)
   - Footer: Ability preview (1 строка, truncate)

3. variant='grid': только иконка роли и HP bar (для поля боя)
4. variant='compact': минимум инфо для saved teams preview

5. Hover state: scale 1.02, shadow
6. Selected state: ring-2, glow effect
7. Disabled state: opacity 0.5, grayscale

Используй roleColors.ts для цветов.
```

🔍 **REVIEW:**
```
Проверь UnitCard:
1. Все 3 варианта работают
2. Статы читаемы на mobile (font-size >= 12px)
3. Ability text truncates корректно
4. Hover/selected/disabled states видны
5. Цвета из roleColors.ts
6. Нет layout shift при hover
7. Performance: нет лишних ре-рендеров
```

---

#### Step 2.3: Анимации
⏱️ 30 min | 🟡 Medium

🔧 **CREATE:**
```
Добавь анимации в frontend/src/app/globals.css и компоненты:

1. CSS animations:
   @keyframes unit-select { scale + glow }
   @keyframes unit-place { slide-in + fade }
   @keyframes unit-remove { scale-out + fade }
   @keyframes shake { horizontal shake }
   @keyframes pulse-glow { pulsing border }

2. Tailwind classes:
   .animate-unit-select
   .animate-unit-place
   .animate-unit-remove
   .animate-shake
   .animate-pulse-glow

3. Применение:
   - UnitCard при select: animate-unit-select
   - Grid cell при place: animate-unit-place
   - Unit при remove: animate-unit-remove
   - Budget при overflow: animate-shake

4. Respect prefers-reduced-motion:
   @media (prefers-reduced-motion: reduce) { ... }
```

🔍 **REVIEW:**
```
Проверь анимации:
1. Все анимации работают
2. Duration комфортный (150-300ms)
3. Нет jank (60fps)
4. prefers-reduced-motion отключает анимации
5. Анимации не блокируют interaction
6. Нет memory leaks (проверь в DevTools)
```

---

#### Step 2.4: BudgetIndicator Upgrade
⏱️ 25 min | 🟡 Medium

🔧 **CREATE:**
```
Рефакторинг frontend/src/components/BudgetIndicator.tsx:

1. Добавь prop variant: 'bar' | 'compact'
2. Цветовая индикация:
   - 0-50%: green (#22C55E)
   - 50-80%: yellow (#EAB308)
   - 80-100%: red (#EF4444)
   - >100%: red + shake animation

3. Анимация при изменении:
   - Number counter (animate from old to new)
   - Progress bar fill animation
   - Shake при превышении

4. variant='compact': только "10/30" без bar (для mobile header)
5. variant='bar': полный progress bar

6. Показывай "Remaining: X" под bar.
```

🔍 **REVIEW:**
```
Проверь BudgetIndicator:
1. Цвета меняются на правильных порогах
2. Анимация counter плавная
3. Shake срабатывает при >100%
4. Оба варианта работают
5. Accessible (aria-valuenow, aria-valuemax)
6. Нет layout shift при анимации
```

---

### Phase 3: New Features (1-2 недели)

#### Step 3.1: SavedTeamsPanel
⏱️ 40 min | 🟡 Medium

🔧 **CREATE:**
```
Рефакторинг frontend/src/components/SavedTeamsModal.tsx → SavedTeamsPanel.tsx:

1. Добавь prop variant: 'modal' | 'sidebar'
2. Для каждой команды показывай:
   - Name (editable inline)
   - Cost (X/30)
   - Role icons preview (🛡️🛡️⚔️💚)
   - Mini grid preview (8×2, variant='preview')
   - Actions: Load, Delete, Favorite

3. Quick actions:
   - Star для favorite (показывается первой)
   - Swipe to delete на mobile
   - Double-click to load

4. Empty state: "No saved teams. Save your first team!"
5. Limit: показывай warning если >= 5 команд

Интегрируй с teamStore.ts.
```

🔍 **REVIEW:**
```
Проверь SavedTeamsPanel:
1. Список команд загружается
2. Load заполняет TeamBuilder
3. Delete удаляет с confirmation
4. Rename работает inline
5. Favorite сортирует наверх
6. Mini preview корректен
7. Empty state показывается
```

---

#### Step 3.2: TeamSummary
⏱️ 25 min | 🟢 Low

🔧 **CREATE:**
```
Создай frontend/src/components/TeamSummary.tsx:

Props: units: PlacedUnit[], variant: 'full' | 'compact'

Показывает:
1. Unit count: "3 units"
2. Total HP: сумма HP всех юнитов
3. Estimated DPS: сумма (ATK * atkCount) всех юнитов
4. Average Initiative: среднее initiative
5. Role distribution: иконки ролей с количеством (🛡️2 ⚔️1 💚1)

variant='compact': только count + HP + roles (одна строка)
variant='full': все метрики в grid

Warnings:
- "No tank!" если нет tank
- "No healer!" если нет support
- "Low damage!" если DPS < 30
```

🔍 **REVIEW:**
```
Проверь TeamSummary:
1. Все метрики считаются корректно
2. Warnings показываются когда нужно
3. Оба варианта работают
4. Обновляется при изменении команды
5. Не блокирует UI при расчётах
```

---

#### Step 3.3: localStorage Autosave
⏱️ 20 min | 🟡 Medium

🔧 **CREATE:**
```
Добавь автосохранение в frontend/src/store/teamStore.ts:

1. При каждом изменении placedUnits:
   - Debounce 1 секунда
   - Сохранить в localStorage key='autobattler_draft_team'

2. При загрузке страницы:
   - Проверить localStorage
   - Если есть draft → показать toast "Restored draft team"
   - Загрузить в placedUnits

3. При успешном сохранении команды на backend:
   - Очистить draft из localStorage

4. Добавь кнопку "Clear Draft" в UI (опционально)

Используй zustand persist middleware или manual implementation.
```

🔍 **REVIEW:**
```
Проверь autosave:
1. Draft сохраняется при изменениях
2. Debounce работает (не спамит localStorage)
3. Restore при загрузке страницы
4. Toast показывается
5. Clear после save на backend
6. Нет конфликтов с другими tabs
```

---

#### Step 3.4: Undo/Redo
⏱️ 30 min | 🟢 Low

🔧 **CREATE:**
```
Добавь undo/redo в frontend/src/store/teamStore.ts:

1. History stack:
   - past: PlacedUnit[][] (max 20 states)
   - future: PlacedUnit[][] (для redo)

2. Actions:
   - undo(): восстановить предыдущее состояние
   - redo(): восстановить следующее состояние
   - canUndo: boolean
   - canRedo: boolean

3. При каждом placeUnit/removeUnit:
   - Push текущее состояние в past
   - Clear future

4. UI:
   - Кнопки Undo/Redo в header
   - Keyboard shortcuts: Ctrl+Z, Ctrl+Shift+Z
   - Disabled state когда нельзя

Используй immer для immutable updates.
```

🔍 **REVIEW:**
```
Проверь undo/redo:
1. Undo восстанавливает предыдущее состояние
2. Redo работает после undo
3. History ограничена 20 states
4. Keyboard shortcuts работают
5. Кнопки disabled когда нельзя
6. Нет memory leaks
```

---

### Phase 4: Polish & Testing (1 неделя)

#### Step 4.1: Accessibility Audit
⏱️ 30 min | 🟡 Medium

🔧 **CREATE:**
```
Проведи accessibility audit:

1. Установи axe-core: npm install @axe-core/react
2. Добавь в development mode для автоматических проверок
3. Проверь вручную:
   - Keyboard navigation (Tab, Enter, Escape, Arrow keys)
   - Screen reader (VoiceOver/NVDA)
   - Color contrast
   - Focus indicators
   - ARIA labels

4. Исправь найденные проблемы:
   - Добавь aria-label на все кнопки с иконками
   - Добавь role="grid" на BattleGrid
   - Добавь aria-selected на выбранные элементы
   - Focus trap в modals

Документируй в ACCESSIBILITY.md.
```

🔍 **REVIEW:**
```
Проверь accessibility:
1. axe-core не находит ошибок
2. Tab navigation логичная
3. Screen reader озвучивает всё важное
4. Контраст >= 4.5:1
5. Focus visible на всех interactive elements
6. Modals имеют focus trap
```

---

#### Step 4.2: Performance Optimization
⏱️ 35 min | 🟡 Medium

🔧 **CREATE:**
```
Оптимизируй performance:

1. React.memo для компонентов:
   - UnitCard (часто ре-рендерится)
   - GridCell
   - BudgetIndicator

2. useMemo/useCallback:
   - Filtered/sorted unit lists
   - Event handlers в loops

3. Виртуализация (если нужно):
   - UnitList если > 20 юнитов
   - Используй react-window

4. Bundle analysis:
   - npm install @next/bundle-analyzer
   - Проверь размер chunks
   - Lazy load тяжёлые компоненты

5. Lighthouse audit:
   - Performance score > 90
   - Исправь найденные issues
```

🔍 **REVIEW:**
```
Проверь performance:
1. Lighthouse Performance > 90
2. FCP < 1.5s
3. TTI < 3s
4. Нет лишних ре-рендеров (React DevTools)
5. Bundle size < 150KB gzipped
6. 60fps при анимациях
```

---

#### Step 4.3: E2E Tests
⏱️ 40 min | 🟡 Medium

🔧 **CREATE:**
```
Создай E2E тесты с Playwright:

frontend/e2e/team-builder.spec.ts:
1. Test: "User can build a team"
   - Open page
   - Select unit from list
   - Place on grid
   - Verify budget updates
   - Save team
   - Verify in saved teams

2. Test: "User cannot exceed budget"
   - Fill team to 30 points
   - Try to add expensive unit
   - Verify error toast

3. Test: "Mobile tap-to-place works"
   - Set mobile viewport
   - Tap unit
   - Tap cell
   - Verify placement

4. Test: "Undo/redo works"
   - Place unit
   - Undo
   - Verify removed
   - Redo
   - Verify restored

Настрой CI для запуска тестов.
```

🔍 **REVIEW:**
```
Проверь E2E тесты:
1. Все тесты проходят локально
2. Тесты проходят в CI
3. Screenshots при падении
4. Время выполнения < 2 минуты
5. Нет flaky тестов
```

---

#### Step 4.4: User Testing
⏱️ 25 min | 🟢 Low

🔧 **CREATE:**
```
Проведи user testing:

1. Найди 3-5 тестеров (друзья, коллеги)
2. Дай задание: "Собери команду из 3 юнитов и начни бой"
3. Наблюдай без подсказок
4. Записывай:
   - Где застряли?
   - Что непонятно?
   - Что раздражает?
   - Что понравилось?

5. Собери feedback в docs/USER_TESTING_RESULTS.md
6. Приоритизируй исправления
7. Исправь критичные проблемы
```

🔍 **REVIEW:**
```
Проверь результаты user testing:
1. Критичные проблемы исправлены
2. Feedback задокументирован
3. Backlog обновлён
4. Метрики улучшились (time to first team)
```

---

## 6. Анализ дополнительных экранов

### 6.1 Экран «Повтор боя» (Battle Replay)

#### Текущее состояние

| Элемент | Оценка |
|---------|--------|
| **Turn Order Bar** | ✅ Отлично — иконки юнитов показывают порядок хода |
| **Журнал событий** | ✅ Хорошо — детальный лог с типом действия |
| **Контролы воспроизведения** | ✅ Полный набор: ⏮️⏪▶️⏩⏭️, скорость 0.5x-4x |
| **Progress bar** | ✅ Информативный — "Событие 110 из 228" |
| **Числа урона** | ✅ Видны на поле (-25) |

#### Проблемы

| Проблема | Severity | Решение |
|----------|----------|---------|
| UUID игроков вместо имён | 🟡 Major | Показывать nickname |
| Мелкие иконки юнитов в Turn Order | 🟡 Major | Увеличить до 48px, добавить HP bar |
| Журнал событий монотонный | 🟢 Minor | Цветовая кодировка по типу действия |
| Нет информации о юните при клике | 🟡 Major | Popup с текущими статами |
| Координаты вместо имён юнитов | 🟢 Minor | "Enchanter двигается" вместо "(3,8)→(3,6)" |

---

### 6.2 Экран «Профиль» (Profile)

#### Текущее состояние

| Элемент | Оценка |
|---------|--------|
| **Статистика** | ✅ Отлично — Рейтинг, Игры, Победы, Поражения |
| **Win Rate bar** | ✅ Отлично — визуальный прогресс |
| **График последних игр** | ✅ Отлично — bar chart с цветами |
| **Список команд** | ✅ Хорошо — компактный список |
| **Редактирование имени** | ✅ Есть иконка карандаша |

#### Проблемы

| Проблема | Severity | Решение |
|----------|----------|---------|
| Ранг без объяснения | 🟡 Major | Tooltip с диапазонами рангов |
| Нет аватара | 🟢 Minor | Генерация или выбор аватара |
| Нет достижений | 🟢 Minor | Badges (первая победа, 10 побед) |

---

### 6.3 Экран «История боёв» (Battle History)

#### Текущее состояние

| Элемент | Оценка |
|---------|--------|
| **Фильтры** | ✅ Отлично — Все/Победы/Поражения с счётчиками |
| **Карточки боёв** | ✅ Информативные — результат, противник, время |
| **Изменение рейтинга** | ✅ Отлично — "+15" зелёным |
| **Badge непросмотренных** | ✅ "3" на вкладке |

#### Проблемы

| Проблема | Severity | Решение |
|----------|----------|---------|
| "Игрок 2715" вместо имени | 🟡 Major | Показывать nickname |
| Нет превью команд | 🟡 Major | Иконки ролей обеих команд |
| Нет явной кнопки "Смотреть" | 🟡 Major | Добавить кнопку replay |
| Нет пагинации | 🟢 Minor | Infinite scroll или пагинация |

---

### 6.4 Экран «Бой» (Battle/Matchmaking)

#### Текущее состояние

Placeholder "В разработке" с опциями PvP и Бои с ботами.

#### Рекомендуемый дизайн

```
┌─────────────────────────────────────────────────────────────┐
│  ⚔️ Найти бой                                              │
├─────────────────────────────────────────────────────────────┤
│  Ваша команда: "Rush Comp" (30/30)                         │
│  🛡️ Knight  🛡️ Guardian  ⚔️ Rogue  💚 Priest              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎮 PvP Бой                                         │   │
│  │  Рейтинг: ±15-25 очков                              │   │
│  │                              [🔍 Найти противника]  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🤖 Бой с ботом                                     │   │
│  │  [Лёгкий] [Средний] [Сложный]                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Phase 5: Другие экраны (промпты)

### Step 5.1: Battle Replay Improvements
⏱️ 45 min | 🟡 Medium

🔧 **CREATE:**
```
Улучши frontend/src/components/BattleReplay.tsx:

1. Замени UUID игроков на nicknames:
   - Получай имена из battleLog.player1Name, player2Name
   - Fallback: "Игрок 1", "Игрок 2"

2. Улучши Turn Order Bar:
   - Увеличь иконки до 48×48px
   - Добавь HP bar под каждой иконкой (мини, 4px высота)
   - Подсветка текущего юнита (ring-2 ring-yellow-400)
   - При клике на юнита — показать его статы в tooltip

3. Улучши журнал событий:
   - Цветовая кодировка: урон=красный, движение=синий, heal=зелёный
   - Замени координаты на имена: "Knight атакует Archer: -25 HP"
   - Группировка по раундам с разделителями

4. Добавь клик на юнита на поле:
   - Показать popup с текущими статами (HP, buffs, debuffs)
   - Подсветить путь движения если юнит двигался

5. Кнопка "← Назад" для возврата к истории боёв.
```

🔍 **REVIEW:**
```
Проверь Battle Replay:
1. Имена игроков отображаются (не UUID)
2. Turn Order Bar увеличен, HP bars видны
3. Журнал событий цветной и читаемый
4. Клик на юнита показывает статы
5. Кнопка "Назад" работает
6. Mobile layout адаптивен
7. Performance: 60fps при воспроизведении
```

---

### Step 5.2: Profile Page Enhancements
⏱️ 35 min | 🟢 Low

🔧 **CREATE:**
```
Улучши frontend/src/app/profile/page.tsx:

1. Система рангов с tooltip:
   - Бронза: 0-999
   - Серебро: 1000-1499
   - Золото: 1500-1999
   - Платина: 2000-2499
   - Алмаз: 2500+
   - При hover на ранг — показать прогресс до следующего

2. Аватар:
   - Генерация на основе playerId (используй DiceBear или Boring Avatars)
   - Или выбор из 10 preset аватаров

3. Достижения (badges):
   - "Первая победа" — выиграть 1 бой
   - "Ветеран" — сыграть 10 боёв
   - "Победитель" — выиграть 10 боёв
   - "Стратег" — собрать 5 команд
   - Показывать в grid под статистикой

4. Команды с hover preview:
   - При наведении — показать состав (иконки ролей)
   - Клик — редирект на Team Builder с загрузкой команды
```

🔍 **REVIEW:**
```
Проверь Profile:
1. Ранги отображаются с tooltip
2. Аватар генерируется/выбирается
3. Достижения показываются
4. Hover на команду показывает состав
5. Responsive на mobile
6. Данные загружаются корректно
```

---

### Step 5.3: Battle History Improvements
⏱️ 30 min | 🟡 Medium

🔧 **CREATE:**
```
Улучши frontend/src/app/history/page.tsx:

1. Карточка боя — добавь:
   - Nickname противника (не "Игрок 2715")
   - Превью команд: "🛡️🛡️⚔️💚 vs 🏹🏹🔮✨"
   - Явная кнопка "▶️ Смотреть повтор"
   - Иконка типа боя (PvP/Bot)

2. Пагинация:
   - Infinite scroll или "Загрузить ещё"
   - Показывать по 10 боёв

3. Фильтр "Ничьи":
   - Добавить третью вкладку для ничьих
   - Показывать tooltip "100 раундов = ничья"

4. Сортировка:
   - По дате (новые/старые)
   - По изменению рейтинга

5. Empty state:
   - "Нет боёв. Начните свой первый бой!"
   - Кнопка "Найти бой"
```

🔍 **REVIEW:**
```
Проверь Battle History:
1. Nicknames отображаются
2. Превью команд видно
3. Кнопка "Смотреть" работает
4. Пагинация/infinite scroll работает
5. Фильтры работают (включая ничьи)
6. Empty state показывается
7. Mobile layout корректен
```

---

### Step 5.4: Battle/Matchmaking Page
⏱️ 40 min | 🟡 Medium

🔧 **CREATE:**
```
Реализуй frontend/src/app/battle/page.tsx (замени placeholder):

1. Header:
   - Показать активную команду: название, cost, состав (иконки)
   - Если нет активной команды — "Выберите команду" + ссылка

2. PvP секция:
   - Кнопка "Найти противника"
   - При поиске: анимация + таймер + кнопка "Отмена"
   - Показать примерное изменение рейтинга (±15-25)

3. Bot секция:
   - 3 кнопки: Лёгкий, Средний, Сложный
   - Описание каждой сложности
   - "Без изменения рейтинга"

4. После нахождения матча:
   - Redirect на /battle/replay/[id]
   - Или показать результат inline

5. Состояния:
   - Loading: skeleton
   - No team: предупреждение + ссылка на Team Builder
   - Searching: анимация поиска
   - Error: toast + retry
```

🔍 **REVIEW:**
```
Проверь Battle page:
1. Активная команда отображается
2. PvP поиск работает
3. Bot бои запускаются
4. Redirect после матча работает
5. Все состояния обрабатываются
6. Mobile layout корректен
7. Нет команды — показывается предупреждение
```

---

### Step 5.5: Navigation Improvements
⏱️ 20 min | 🟢 Low

🔧 **CREATE:**
```
Улучши frontend/src/components/Navigation.tsx:

1. Mobile bottom tab bar:
   - На <640px — фиксированный внизу
   - 4 иконки: Команда, Бой, История, Профиль
   - Активная вкладка подсвечена
   - Badge на История (непросмотренные бои)

2. Desktop top navigation:
   - Логотип слева (клик → главная)
   - Tabs по центру
   - Профиль справа (аватар + имя)

3. Breadcrumbs для вложенных страниц:
   - История → Повтор боя #123
   - Профиль → Редактирование

4. Keyboard shortcuts:
   - 1-4 для переключения вкладок
   - Показать в tooltip при hover
```

🔍 **REVIEW:**
```
Проверь Navigation:
1. Mobile bottom bar работает
2. Desktop top nav работает
3. Badge обновляется
4. Breadcrumbs показываются
5. Keyboard shortcuts работают
6. Нет layout shift при переключении
7. Active state корректен
```

---

## 8. Сводная таблица приоритетов по экранам

| Экран | Critical | Major | Minor | Приоритет |
|-------|----------|-------|-------|-----------|
| Team Builder | 3 | 3 | 3 | 🔴 Phase 1-2 |
| Battle Replay | 0 | 3 | 3 | 🟡 Phase 5 |
| Saved Teams | 1 | 1 | 4 | 🟡 Phase 3 |
| Profile | 0 | 1 | 5 | 🟢 Phase 5 |
| Battle History | 0 | 3 | 3 | 🟡 Phase 5 |
| Battle/Matchmaking | 0 | 2 | 1 | 🟡 Phase 5 |
| Navigation | 0 | 1 | 2 | 🟢 Phase 5 |

---

### UX Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to build first team | ~3 min | < 1.5 min |
| Mobile usability score | ~60% | > 85% |
| Error rate (invalid placements) | ~15% | < 5% |
| Feature discoverability | ~40% | > 80% |

### Technical Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Performance | ~70 | > 90 |
| Lighthouse Accessibility | ~75 | > 95 |
| Bundle size (JS) | ~180KB | < 150KB |
| FPS during animations | ~45 | 60 |

---

## 10. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Сложность touch drag-and-drop | Высокая | Высокое | Tap-to-place как fallback |
| Производительность на старых устройствах | Средняя | Среднее | Lazy loading, виртуализация |
| Потеря данных при редизайне | Низкая | Высокое | Миграция localStorage |
| Негативный feedback от пользователей | Средняя | Среднее | A/B тестирование, постепенный rollout |

---

## 8. Связанные документы

- [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) — полный GDD
- [AI_DEVELOPMENT_PLAN.md](./AI_DEVELOPMENT_PLAN.md) — 100-step план разработки
- [ARCHITECTURE.md](./ARCHITECTURE.md) — архитектура системы
- [ENGINEERING_GUIDE.md](./ENGINEERING_GUIDE.md) — стандарты кода

---

*Документ создан: Декабрь 2025*
*Версия: 1.0*
