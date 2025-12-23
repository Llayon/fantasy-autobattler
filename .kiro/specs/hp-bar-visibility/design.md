# HP Bar Visibility - Design Document

## Overview

Улучшение видимости HP-баров в компоненте BattleReplay для повышения читаемости состояния здоровья юнитов. Изменения затрагивают два места отображения HP-баров:
1. **Grid cells** - ячейки игрового поля с юнитами
2. **Turn Order Bar** - панель порядка ходов

## Architecture

### Current State

```
BattleReplay.tsx
├── ReplayGridCell (HP bar: h-1, gradient colors)
└── TurnOrderBar (HP bar: h-1, conditional colors)
```

Проблемы текущей реализации:
- HP-бар на гриде: `h-1` (4px), использует градиент `from-red-500 via-yellow-500 to-green-500`
- HP-бар в Turn Order: `h-1` (4px), использует условные цвета по hpPercent
- Несогласованность цветовой схемы между компонентами

### Target State

```
BattleReplay.tsx
├── ReplayGridCell (HP bar: h-[3px], conditional colors via getHpBarColor)
├── TurnOrderBar (HP bar: h-1, conditional colors via getHpBarColor)
└── getHpBarColor() - shared utility function
```

## Components and Interfaces

### Utility Function: getHpBarColor

```typescript
/**
 * Determines HP bar color based on health percentage.
 * 
 * @param hpPercent - Current HP as percentage (0-100)
 * @returns Tailwind CSS color class
 * 
 * @example
 * getHpBarColor(75) // returns 'bg-green-500'
 * getHpBarColor(40) // returns 'bg-yellow-500'
 * getHpBarColor(20) // returns 'bg-red-500'
 */
function getHpBarColor(hpPercent: number): string {
  if (hpPercent > 50) return 'bg-green-500';
  if (hpPercent > 25) return 'bg-yellow-500';
  return 'bg-red-500';
}
```

### Component: ReplayGridCell HP Bar

```tsx
{/* HP bar - 3px height with conditional colors */}
<div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-700 rounded-b">
  <div 
    className={`h-full rounded-b transition-all duration-300 ${getHpBarColor(hpPercent)}`}
    style={{ width: `${hpPercent}%` }}
  />
</div>
```

### Component: TurnOrderBar HP Bar

```tsx
{/* HP bar - 4px height */}
<div className="w-12 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
  <div 
    className={`h-full transition-all duration-300 ${getHpBarColor(hpPercent)}`}
    style={{ width: `${hpPercent}%` }}
  />
</div>
```

## Data Models

### HP Percentage Calculation

```typescript
const hpPercent = (unit.currentHp / unit.maxHp) * 100;
```

### Color Thresholds

| HP Range | Color | Tailwind Class |
|----------|-------|----------------|
| > 50% | Green | `bg-green-500` |
| 25-50% | Yellow | `bg-yellow-500` |
| ≤ 25% | Red | `bg-red-500` |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: HP color green for healthy units
*For any* unit with HP percentage greater than 50%, the getHpBarColor function should return 'bg-green-500'
**Validates: Requirements 2.1**

### Property 2: HP color yellow for damaged units
*For any* unit with HP percentage between 25% (exclusive) and 50% (inclusive), the getHpBarColor function should return 'bg-yellow-500'
**Validates: Requirements 2.2**

### Property 3: HP color red for critical units
*For any* unit with HP percentage of 25% or less, the getHpBarColor function should return 'bg-red-500'
**Validates: Requirements 2.3**

### Property 4: Color scheme consistency
*For any* HP percentage value, both ReplayGridCell and TurnOrderBar should produce the same color by using the shared getHpBarColor function
**Validates: Requirements 3.1**

## Error Handling

- **Division by zero**: If `maxHp` is 0, default to 0% HP (red color)
- **Negative HP**: Clamp to 0% minimum
- **HP > maxHp**: Clamp to 100% maximum

```typescript
const hpPercent = Math.max(0, Math.min(100, (unit.currentHp / Math.max(1, unit.maxHp)) * 100));
```

## Testing Strategy

### Unit Tests
- Test `getHpBarColor` function with boundary values (0, 25, 26, 50, 51, 100)
- Test edge cases (negative HP, HP > maxHp, maxHp = 0)

### Property-Based Tests
- Use fast-check library for property-based testing
- Generate random HP percentages and verify color mapping
- Properties 1-4 will be tested with PBT

### Visual Verification
- Manual testing of HP bar appearance in BattleReplay
- Verify animation smoothness on HP changes

