# HP Bar Visibility Improvements

## Introduction

Улучшение видимости HP-баров юнитов на странице реплея боя для лучшего понимания состояния здоровья юнитов во время просмотра боя.

## Glossary

- **HP Bar**: Визуальный индикатор здоровья юнита, отображающий текущее HP относительно максимального
- **Battle Replay**: Компонент воспроизведения записанного боя
- **Turn Order Bar**: Панель порядка ходов, показывающая живых юнитов отсортированных по инициативе
- **Grid Cell**: Ячейка игрового поля 8×10, где отображаются юниты
- **Health Percentage**: Процент текущего HP от максимального HP юнита

## Requirements

### Requirement 1: Увеличение высоты HP-бара

**User Story:** As a player watching a battle replay, I want HP bars to be clearly visible, so that I can quickly assess unit health status.

#### Acceptance Criteria

1. WHEN the Battle Replay displays a unit on the grid THEN the HP Bar height SHALL be at least 3 pixels
2. WHEN the Turn Order Bar displays a unit THEN the HP Bar height SHALL be at least 4 pixels
3. WHEN the HP Bar is rendered THEN the HP Bar SHALL have sufficient contrast against the unit background

---

### Requirement 2: Цветовая индикация уровня здоровья

**User Story:** As a player watching a battle replay, I want HP bars to change color based on health percentage, so that I can instantly understand how close units are to dying.

#### Acceptance Criteria

1. WHEN a unit has more than 50% HP THEN the HP Bar color SHALL be green (#22c55e)
2. WHEN a unit has between 25% and 50% HP THEN the HP Bar color SHALL be yellow (#eab308)
3. WHEN a unit has 25% or less HP THEN the HP Bar color SHALL be red (#ef4444)
4. WHEN the HP changes THEN the HP Bar color transition SHALL animate smoothly over 300 milliseconds

---

### Requirement 3: Консистентность HP-баров

**User Story:** As a player watching a battle replay, I want HP bars to look consistent across all UI elements, so that I can easily compare unit health.

#### Acceptance Criteria

1. WHEN HP Bars are displayed on the grid and Turn Order Bar THEN the HP Bars SHALL use the same color scheme
2. WHEN HP Bars are displayed THEN the HP Bars SHALL have rounded corners for visual consistency
3. WHEN HP Bars are displayed THEN the HP Bar background SHALL be visible to show missing health

---

## Technical Notes

### Files to Modify
- `frontend/src/components/BattleReplay.tsx` - Main replay component with grid and turn order bar

### Current Implementation Issues
- Grid HP bar: `h-1` (4px) - needs increase to `h-[3px]` minimum
- Turn Order HP bar: `h-1` (4px) - comment says "4px height" but actual is 4px, needs verification
- Grid HP bar uses gradient, Turn Order uses conditional colors - inconsistent

### Dependencies
- None (pure frontend CSS changes)

## Priority
- **High** - Directly impacts battle readability

