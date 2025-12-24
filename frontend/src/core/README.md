# Frontend Core Library

Generic types and hooks for grid-based games. Provides reusable building blocks for game UI.

## Features

- **Grid Types**: Position, GridConfig, GridCell
- **Navigation Hook**: Keyboard navigation for grids

## Installation

Import from `@/core`:

```typescript
import { Position, GridConfig, useGridNavigation } from '@/core';
```

## Types

### Position

2D position on a grid.

```typescript
interface Position {
  x: number; // Column (0-indexed)
  y: number; // Row (0-indexed)
}
```

### GridConfig

Grid configuration for customizable dimensions.

```typescript
interface GridConfig {
  width: number;      // Grid width in cells
  height: number;     // Grid height in cells
  playerRows: number[]; // Player deployment rows
  enemyRows: number[];  // Enemy deployment rows
}

// Default: 8×10 autobattler grid
const DEFAULT_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};
```

### GridCell

Cell with position and state.

```typescript
type CellState = 'empty' | 'occupied' | 'blocked' | 'highlighted';

interface GridCell {
  position: Position;
  state: CellState;
  unitId?: string;
}
```

## Hooks

### useGridNavigation

Keyboard navigation for grid-based interfaces.

```typescript
import { useGridNavigation } from '@/core';

function BattleGrid() {
  const { selectedPosition, handlers } = useGridNavigation({
    gridConfig: { width: 8, height: 10, playerRows: [0, 1], enemyRows: [8, 9] },
    initialPosition: { x: 0, y: 0 },
    onSelect: (pos) => console.log('Selected:', pos),
    wrap: true, // Wrap around edges
  });

  return (
    <div {...handlers}>
      {/* Grid cells */}
    </div>
  );
}
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `gridConfig` | `GridConfig` | Grid dimensions |
| `initialPosition` | `Position` | Starting position |
| `onSelect` | `(pos: Position) => void` | Called on Enter/Space |
| `wrap` | `boolean` | Wrap navigation at edges |
| `disabled` | `boolean` | Disable navigation |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `selectedPosition` | `Position` | Current position |
| `setSelectedPosition` | `(pos: Position) => void` | Set position |
| `handlers` | `object` | Event handlers for container |

## Usage Examples

### Custom Grid Size

```typescript
import { DEFAULT_GRID_CONFIG, Position } from '@/core';

// Use default 8×10 grid
const grid = DEFAULT_GRID_CONFIG;

// Or create custom config
const smallGrid: GridConfig = {
  width: 4,
  height: 4,
  playerRows: [0],
  enemyRows: [3],
};
```

### Position Utilities

```typescript
import { Position } from '@/core';

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
```

## Architecture

```
frontend/src/core/
├── types/          # Type definitions
│   └── index.ts    # Position, GridConfig, GridCell
├── hooks/          # React hooks
│   ├── index.ts    # Barrel export
│   └── useGridNavigation.ts
└── index.ts        # Main barrel export
```

## See Also

- [Backend Core](../../../backend/src/core/README.md) - Battle engine
- [Components](../components/) - Game-specific components
