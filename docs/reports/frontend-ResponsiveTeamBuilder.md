# ResponsiveTeamBuilder Component

## 📱 Адаптивный Team Builder для Fantasy Autobattler

### Обзор

ResponsiveTeamBuilder - это полностью адаптивный компонент для создания команд, который автоматически адаптируется под разные размеры экранов, обеспечивая оптимальный UX на всех устройствах.

### 🎯 Поддерживаемые Layout

#### 📱 Mobile Layout (< 768px)
- **Sticky Header**: Компактный бюджет + основная кнопка действия
- **Полноэкранная сетка**: Масштабируемая 8×10 сетка с touch-friendly взаимодействием
- **Bottom Sheet**: Выбор юнитов через выдвижную панель снизу
- **Sticky Footer**: 4 основные кнопки действий (Clear, Teams, Save, Battle)

#### 💻 Tablet Layout (768px - 1023px)
- **Горизонтальный layout**: 1/3 для юнитов, 2/3 для сетки
- **Компактные карточки**: Оптимизированы для планшетов
- **Drag & Drop**: Полная поддержка перетаскивания

#### 🖥️ Desktop Layout (>= 1024px)
- **Sidebar**: Полнофункциональный список юнитов с фильтрами
- **Центральная сетка**: Большая сетка с инструкциями
- **Плавающие элементы**: Matchmaking panel в углу
- **Полные карточки**: Детальная информация о юнитах

### 🎨 Ключевые особенности

#### Адаптивные элементы:
- **BudgetIndicator**: Автоматически переключается в compact режим на мобильных
- **UnitCard**: Разные размеры для разных экранов
- **Grid**: Масштабируемая сетка с touch/mouse поддержкой
- **Navigation**: Скрывается на мобильных, показывается на десктопе

#### Touch-friendly дизайн:
- Минимальный размер кнопок 44×44px
- Оптимизированные жесты (long press, double tap)
- Safe area insets для современных мобильных устройств
- Плавные анимации и переходы

### 🔧 API

```typescript
interface ResponsiveTeamBuilderProps {
  units: UnitTemplate[];
  currentTeam: TeamState;
  selectedUnit: UnitTemplate | null;
  disabledUnits: UnitId[];
  gridUnits: GridUnit[];
  highlightedCells: HighlightedCell[];
  teamActions: TeamActions;
  onUnitSelect: (unit: UnitTemplate) => void;
  onUnitLongPress: (unit: UnitTemplate) => void;
  onGridCellClick: (position: Position) => void;
  isMobileSheetOpen: boolean;
  onMobileSheetToggle: () => void;
}
```

### 📐 Breakpoints

| Размер | Breakpoint | Layout |
|--------|------------|--------|
| Mobile | < 768px | Вертикальный, bottom sheet |
| Tablet | 768px - 1023px | Горизонтальный 1/3 + 2/3 |
| Desktop | >= 1024px | Sidebar + центральная область |

### 🎯 Тестирование

#### Основная страница:
```
http://localhost:3002
```

#### Тестовая страница:
```
http://localhost:3002/test-responsive
```

Тестовая страница включает:
- Индикатор текущего viewport размера
- Mock данные для всех состояний
- Полную функциональность без backend

### 🚀 Использование

```tsx
import { ResponsiveTeamBuilder } from '@/components/ResponsiveTeamBuilder';

// В компоненте
<ResponsiveTeamBuilder
  units={units}
  currentTeam={currentTeam}
  selectedUnit={selectedUnit}
  disabledUnits={disabledUnits}
  gridUnits={gridUnits}
  highlightedCells={highlightedCells}
  teamActions={teamActions}
  onUnitSelect={handleUnitSelect}
  onUnitLongPress={handleUnitDetail}
  onGridCellClick={handleGridCellClick}
  isMobileSheetOpen={isMobileSheetOpen}
  onMobileSheetToggle={toggleMobileSheet}
/>
```

### 🎨 Стилизация

Компонент использует Tailwind CSS с responsive prefixes:
- `sm:` - >= 640px
- `md:` - >= 768px  
- `lg:` - >= 1024px
- `xl:` - >= 1280px

### ♿ Доступность

- Полная keyboard navigation
- ARIA labels и roles
- Screen reader поддержка
- Focus management
- High contrast режим

### 🔄 Анимации

- Плавные переходы между layout
- Hover эффекты
- Touch feedback
- Loading состояния
- Micro-interactions

### 📱 Mobile-first подход

Компонент разработан с mobile-first подходом:
1. Базовые стили для мобильных
2. Progressive enhancement для больших экранов
3. Touch-first взаимодействие
4. Performance оптимизация

### 🎯 Performance

- Lazy loading компонентов
- Мемоизация тяжелых вычислений
- Оптимизированные re-renders
- Efficient event handling
- Minimal DOM manipulations