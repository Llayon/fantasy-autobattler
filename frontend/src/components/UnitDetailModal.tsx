'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { UnitTemplate, UnitId, Position, UnitStats } from '@/types/game';
import { UNIT_INFO } from '@/types/game';
import { getRoleColor, getRoleIcon, getRoleName } from '@/lib/roleColors';
import { getUnitAbility, getAbilityIcon } from '@/lib/abilityData';
import { 
  AbilityPreviewData, 
  AbilityTargetingPreview, 
  AbilityTargetingLegend,
  PreviewUnit 
} from '@/components/AbilityTargetingPreview';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Mini grid dimensions for ability preview */
const MINI_GRID_WIDTH = 8;
const MINI_GRID_HEIGHT = 6;
const MINI_CELL_SIZE = 28;

/** Default caster position for preview */
const DEFAULT_CASTER_POSITION: Position = { x: 3, y: 1 };

/** Mock enemy positions for preview */
const MOCK_ENEMY_POSITIONS: Position[] = [
  { x: 2, y: 4 },
  { x: 3, y: 5 },
  { x: 4, y: 4 },
  { x: 5, y: 5 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get effect type display name.
 * 
 * @param type - Effect type
 * @returns Localized effect name
 */
function getEffectTypeName(type: string): string {
  const names: Record<string, string> = {
    damage: 'Урон',
    heal: 'Лечение',
    buff: 'Усиление',
    debuff: 'Ослабление',
    stun: 'Оглушение',
    taunt: 'Провокация',
  };
  return names[type] || type;
}

/**
 * Get target type display name.
 * 
 * @param targetType - Target type
 * @returns Localized target type name
 */
function getTargetTypeName(targetType: string): string {
  const names: Record<string, string> = {
    self: 'На себя',
    enemy: 'Враг',
    ally: 'Союзник',
    area: 'Область',
    lowest_hp_enemy: 'Враг с мин. HP',
    lowest_hp_ally: 'Союзник с мин. HP',
  };
  return names[targetType] || targetType;
}

/**
 * Create mock enemy units for preview.
 * 
 * @param stats - Base stats for enemies
 * @returns Array of preview units
 */
function createMockEnemies(stats: UnitStats): PreviewUnit[] {
  return MOCK_ENEMY_POSITIONS.map((position, index) => ({
    id: `enemy-${index}`,
    position,
    stats: { ...stats, armor: 5 + index },
    team: 'enemy' as const,
    currentHp: 80 + index * 10,
    maxHp: 100,
  }));
}

// =============================================================================
// MINI GRID COMPONENT
// =============================================================================

/**
 * MiniGridCell component props.
 */
interface MiniGridCellProps {
  position: Position;
  isCaster: boolean;
  hasEnemy: boolean;
  isPlayerZone: boolean;
  isEnemyZone: boolean;
  isHovered: boolean;
  onHover: (pos: Position | null) => void;
}

/**
 * Mini grid cell for ability preview.
 */
function MiniGridCell({ 
  position, 
  isCaster, 
  hasEnemy, 
  isPlayerZone, 
  isEnemyZone,
  isHovered,
  onHover 
}: MiniGridCellProps): JSX.Element {
  return (
    <div
      className={`
        relative border border-gray-600/50 transition-all duration-100
        ${isPlayerZone ? 'bg-blue-900/30' : isEnemyZone ? 'bg-red-900/30' : 'bg-gray-800/30'}
        ${isHovered ? 'ring-1 ring-yellow-400' : ''}
        cursor-crosshair
      `}
      style={{ width: MINI_CELL_SIZE, height: MINI_CELL_SIZE }}
      onMouseEnter={() => onHover(position)}
      onMouseLeave={() => onHover(null)}
    >
      {isCaster && (
        <div className="absolute inset-0.5 bg-purple-600 rounded flex items-center justify-center text-xs">
          🧙
        </div>
      )}
      {hasEnemy && !isCaster && (
        <div className="absolute inset-0.5 bg-red-600 rounded flex items-center justify-center text-xs">
          👹
        </div>
      )}
    </div>
  );
}

/**
 * AbilityPreviewGrid component props.
 */
interface AbilityPreviewGridProps {
  ability: AbilityPreviewData;
  unit: UnitTemplate;
}

/**
 * Mini grid showing ability targeting preview.
 * Displays range, AoE area, and affected enemies.
 */
function AbilityPreviewGrid({ ability, unit }: AbilityPreviewGridProps): JSX.Element {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const casterPosition = DEFAULT_CASTER_POSITION;
  
  // Create mock units for preview
  const previewUnits = useMemo(() => {
    const casterUnit: PreviewUnit = {
      id: 'caster',
      position: casterPosition,
      stats: unit.stats,
      team: 'player',
      currentHp: unit.stats.hp,
      maxHp: unit.stats.hp,
    };
    const enemies = createMockEnemies(unit.stats);
    return [casterUnit, ...enemies];
  }, [casterPosition, unit.stats]);
  
  // Generate grid cells
  const gridCells = useMemo(() => {
    const cells: JSX.Element[] = [];
    
    for (let y = 0; y < MINI_GRID_HEIGHT; y++) {
      for (let x = 0; x < MINI_GRID_WIDTH; x++) {
        const position = { x, y };
        const isCaster = x === casterPosition.x && y === casterPosition.y;
        const hasEnemy = MOCK_ENEMY_POSITIONS.some(p => p.x === x && p.y === y);
        const isPlayerZone = y <= 1;
        const isEnemyZone = y >= 4;
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        
        cells.push(
          <MiniGridCell
            key={`${x}-${y}`}
            position={position}
            isCaster={isCaster}
            hasEnemy={hasEnemy}
            isPlayerZone={isPlayerZone}
            isEnemyZone={isEnemyZone}
            isHovered={isHovered}
            onHover={setHoveredCell}
          />
        );
      }
    }
    
    return cells;
  }, [casterPosition, hoveredCell]);
  
  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
        <span>🎯</span>
        <span>Превью зоны действия (наведите на клетку):</span>
      </div>
      
      <div className="relative inline-block">
        {/* Grid */}
        <div 
          className="grid gap-px bg-gray-700/50 rounded overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${MINI_GRID_WIDTH}, ${MINI_CELL_SIZE}px)` }}
        >
          {gridCells}
        </div>
        
        {/* Targeting Preview Overlay */}
        <AbilityTargetingPreview
          ability={ability}
          casterUnit={unit}
          casterPosition={casterPosition}
          units={previewUnits}
          gridWidth={MINI_GRID_WIDTH}
          gridHeight={MINI_GRID_HEIGHT}
          cellSize={MINI_CELL_SIZE}
          hoveredCell={hoveredCell}
          onCellHover={setHoveredCell}
          isActive={true}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-2">
        <AbilityTargetingLegend />
      </div>
      
      {/* Damage estimation info */}
      <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Расчётный урон:</span>
          <span className="text-red-400 font-medium">
            ~{calculateEstimatedDamage(ability, unit.stats)}
          </span>
        </div>
        {ability.areaSize && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-gray-400">Макс. целей в AoE:</span>
            <span className="text-orange-400 font-medium">
              {MOCK_ENEMY_POSITIONS.length}
            </span>
          </div>
        )}
      </div>
      
      {/* Hover info */}
      <div className="mt-2 text-xs text-gray-500">
        {hoveredCell ? (
          <span>Позиция: ({hoveredCell.x}, {hoveredCell.y})</span>
        ) : (
          <span>Наведите на клетку для просмотра области поражения</span>
        )}
      </div>
    </div>
  );
}

/**
 * Calculate estimated damage for ability preview.
 * 
 * @param ability - Ability data
 * @param casterStats - Caster unit stats
 * @returns Estimated damage value
 */
function calculateEstimatedDamage(
  ability: AbilityPreviewData,
  casterStats: UnitStats
): number {
  let totalDamage = 0;
  
  for (const effect of ability.effects) {
    if (effect.type === 'damage') {
      let damage = effect.value ?? 0;
      
      // Add attack scaling
      if (effect.attackScaling) {
        damage += casterStats.atk * effect.attackScaling;
      }
      
      totalDamage += damage;
    }
  }
  
  return Math.round(totalDamage);
}

// =============================================================================
// ABILITIES SECTION COMPONENT
// =============================================================================

/**
 * AbilitiesSection component props.
 */
interface AbilitiesSectionProps {
  /** Unit to display abilities for */
  unit: UnitTemplate;
}

/**
 * Displays detailed ability information for a unit.
 * Shows ability name, description, stats, targeting info, and preview grid.
 * 
 * @param props - Component props
 * @returns JSX element
 */
function AbilitiesSection({ unit }: AbilitiesSectionProps): JSX.Element | null {
  const [hoveredAbility, setHoveredAbility] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Get ability data for this unit
  const ability = getUnitAbility(unit.id as UnitId);
  
  if (!ability) {
    return null;
  }
  
  const icon = getAbilityIcon(ability.icon);
  const isPassive = ability.type === 'passive';
  const hasTargetingPreview = !isPassive && ability.range > 0;
  
  return (
    <div className="px-6 pb-4">
      <h3 className="text-lg font-semibold text-white mb-3">Способности</h3>
      
      <div 
        className={`
          p-4 rounded-lg border-2 transition-all duration-200
          ${isPassive 
            ? 'bg-purple-900/30 border-purple-500/50' 
            : 'bg-blue-900/30 border-blue-500/50'}
          ${hoveredAbility === ability.id ? 'ring-2 ring-yellow-400' : ''}
        `}
        onMouseEnter={() => {
          setHoveredAbility(ability.id);
          if (hasTargetingPreview) setShowPreview(true);
        }}
        onMouseLeave={() => {
          setHoveredAbility(null);
        }}
      >
        {/* Ability header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center text-2xl
            ${isPassive ? 'bg-purple-600' : 'bg-blue-600'}
          `}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{ability.name}</span>
              <span className={`
                px-2 py-0.5 text-xs rounded-full
                ${isPassive 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'bg-blue-500/30 text-blue-300'}
              `}>
                {isPassive ? 'Пассивная' : 'Активная'}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{ability.description}</p>
          </div>
        </div>
        
        {/* Ability stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* Target type */}
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <span className="text-gray-400">🎯</span>
            <span className="text-gray-400">Цель:</span>
            <span className="text-white">{getTargetTypeName(ability.targetType)}</span>
          </div>
          
          {/* Range */}
          {ability.range > 0 && (
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
              <span className="text-blue-400">📏</span>
              <span className="text-gray-400">Дальность:</span>
              <span className="text-blue-300">{ability.range} клеток</span>
            </div>
          )}
          
          {/* Cooldown */}
          {!isPassive && ability.cooldown && (
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
              <span className="text-yellow-400">⏱️</span>
              <span className="text-gray-400">Перезарядка:</span>
              <span className="text-yellow-300">{ability.cooldown} ходов</span>
            </div>
          )}
          
          {/* AoE size */}
          {ability.areaSize && (
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
              <span className="text-orange-400">💥</span>
              <span className="text-gray-400">Радиус AoE:</span>
              <span className="text-orange-300">{ability.areaSize} клеток</span>
            </div>
          )}
        </div>
        
        {/* Effects */}
        {ability.effects.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Эффекты:</div>
            <div className="flex flex-wrap gap-2">
              {ability.effects.map((effect, index) => (
                <span 
                  key={index}
                  className={`
                    px-2 py-1 text-xs rounded-full
                    ${effect.type === 'damage' ? 'bg-red-500/30 text-red-300' : ''}
                    ${effect.type === 'heal' ? 'bg-green-500/30 text-green-300' : ''}
                    ${effect.type === 'buff' ? 'bg-yellow-500/30 text-yellow-300' : ''}
                    ${effect.type === 'debuff' ? 'bg-purple-500/30 text-purple-300' : ''}
                    ${effect.type === 'stun' ? 'bg-cyan-500/30 text-cyan-300' : ''}
                    ${effect.type === 'taunt' ? 'bg-orange-500/30 text-orange-300' : ''}
                  `}
                >
                  {getEffectTypeName(effect.type)}
                  {effect.value && ` ${effect.value}`}
                  {effect.duration && effect.duration < 999 && ` (${effect.duration} ход.)`}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Targeting preview toggle for active abilities with range */}
        {hasTargetingPreview && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`
                w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2
                ${showPreview 
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}
              `}
            >
              <span>{showPreview ? '🔽' : '▶️'}</span>
              <span>{showPreview ? 'Скрыть превью зоны' : 'Показать превью зоны действия'}</span>
            </button>
          </div>
        )}
        
        {/* Ability targeting preview grid */}
        {hasTargetingPreview && showPreview && (
          <AbilityPreviewGrid ability={ability} unit={unit} />
        )}
      </div>
    </div>
  );
}

/**
 * Props for the UnitDetailModal component
 */
interface UnitDetailModalProps {
  /** Unit to display details for */
  unit: UnitTemplate | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when unit is added to team */
  onAddToTeam?: (unit: UnitTemplate) => void;
  /** Whether the unit can be added to team */
  canAdd: boolean;
  /** Reason why unit cannot be added (shown when canAdd is false) */
  cannotAddReason?: string;
}

/**
 * Modal component displaying detailed information about a unit
 * Shows all stats, abilities, and provides option to add to team
 */
export default function UnitDetailModal({
  unit,
  isOpen,
  onClose,
  onAddToTeam,
  canAdd,
  cannotAddReason
}: UnitDetailModalProps) {
  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!modalElement) return;

    // Get all focusable elements within modal
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no unit
  if (!isOpen || !unit) {
  
    return null;
  }



  const unitInfo = UNIT_INFO[unit.id];
  const roleColor = getRoleColor(unit.role);

  /**
   * Handle adding unit to team
   */
  const handleAddToTeam = () => {
    if (canAdd && onAddToTeam) {
      onAddToTeam(unit);
      onClose();
    }
  };

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-detail-title"
      aria-describedby="unit-detail-description"
    >
      <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Закрыть модальное окно"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{unitInfo.emoji}</div>
            <div>
              <h2 id="unit-detail-title" className="text-xl font-bold text-white">
                {unit.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{ 
                    backgroundColor: `${roleColor.bg}20`,
                    color: roleColor.bg,
                    border: `1px solid ${roleColor.bg}40`
                  }}
                >
                  {getRoleIcon(unit.role)} {getRoleName(unit.role)}
                </span>
                <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-black rounded-full">
                  {unit.cost} очков
                </span>
              </div>
            </div>
          </div>

          {/* Unit description */}
          <p id="unit-detail-description" className="text-gray-300 text-sm leading-relaxed">
            {unitInfo.description}
          </p>
        </div>

        {/* Stats section */}
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Характеристики</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-red-400">❤️</span>
              <span className="text-sm text-gray-300">HP:</span>
              <span className="font-bold text-white">{unit.stats.hp}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-orange-400">⚔️</span>
              <span className="text-sm text-gray-300">ATK:</span>
              <span className="font-bold text-white">{unit.stats.atk}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-yellow-400">🗡️</span>
              <span className="text-sm text-gray-300">#ATK:</span>
              <span className="font-bold text-white">{unit.stats.atkCount}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-blue-400">🛡️</span>
              <span className="text-sm text-gray-300">BR:</span>
              <span className="font-bold text-white">{unit.stats.armor}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-green-400">💨</span>
              <span className="text-sm text-gray-300">СК:</span>
              <span className="font-bold text-white">{unit.stats.speed}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-purple-400">⚡</span>
              <span className="text-sm text-gray-300">ИН:</span>
              <span className="font-bold text-white">{unit.stats.initiative}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-cyan-400">🌪️</span>
              <span className="text-sm text-gray-300">УК:</span>
              <span className="font-bold text-white">{unit.stats.dodge}%</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-indigo-400">🎯</span>
              <span className="text-sm text-gray-300">Range:</span>
              <span className="font-bold text-white">{unit.range}</span>
            </div>
          </div>
        </div>

        {/* Abilities section with detailed info */}
        <AbilitiesSection unit={unit} />

        {/* Cannot add reason */}
        {!canAdd && cannotAddReason && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-sm text-red-300">{cannotAddReason}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Закрыть
          </button>
          {onAddToTeam && (
            <button
              onClick={handleAddToTeam}
              disabled={!canAdd}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                canAdd
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              aria-label={canAdd ? 'Добавить юнита в команду' : 'Нельзя добавить юнита в команду'}
            >
              Добавить в команду
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

