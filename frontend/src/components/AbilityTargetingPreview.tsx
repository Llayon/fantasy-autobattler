/**
 * AbilityTargetingPreview Component for Fantasy Autobattler.
 * Displays ability range and area of effect preview on the battlefield grid.
 * 
 * @fileoverview Shows targeting preview when hovering over abilities in Team Builder.
 * Highlights range, AoE area, potential targets, and estimated damage.
 */

'use client';

import React, { useMemo } from 'react';
import { Position, UnitTemplate, UnitStats } from '@/types/game';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Ability targeting type classification.
 */
export type AbilityTargetType =
  | 'self'           // Targets the caster
  | 'enemy'          // Single enemy target
  | 'ally'           // Single ally target
  | 'area'           // Area of effect
  | 'lowest_hp_enemy' // Lowest HP enemy
  | 'lowest_hp_ally'; // Lowest HP ally

/**
 * Damage type for abilities.
 */
export type DamageType = 'physical' | 'magical';

/**
 * Ability effect definition for preview calculations.
 */
export interface AbilityEffectPreview {
  /** Effect type */
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'stun' | 'taunt';
  /** Base value */
  value?: number;
  /** Damage type */
  damageType?: DamageType;
  /** Attack scaling percentage */
  attackScaling?: number;
  /** Stat affected */
  stat?: string;
  /** Percentage modifier */
  percentage?: number;
  /** Effect duration */
  duration?: number;
}

/**
 * Ability data for targeting preview.
 */
export interface AbilityPreviewData {
  /** Ability identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Ability type */
  type: 'active' | 'passive';
  /** Target type */
  targetType: AbilityTargetType;
  /** Cooldown in turns */
  cooldown?: number;
  /** Range in cells */
  range: number;
  /** Area size for AoE */
  areaSize?: number;
  /** Ability effects */
  effects: AbilityEffectPreview[];
  /** Icon identifier */
  icon: string;
}

/**
 * Unit position on the preview grid.
 */
export interface PreviewUnit {
  /** Unit instance ID */
  id: string;
  /** Unit position */
  position: Position;
  /** Unit stats */
  stats: UnitStats;
  /** Team affiliation */
  team: 'player' | 'enemy';
  /** Current HP */
  currentHp: number;
  /** Max HP */
  maxHp: number;
}

/**
 * AbilityTargetingPreview component props.
 */
export interface AbilityTargetingPreviewProps {
  /** Ability to preview */
  ability: AbilityPreviewData | null;
  /** Caster unit */
  casterUnit: UnitTemplate | null;
  /** Caster position on grid */
  casterPosition: Position | null;
  /** All units on the grid for targeting */
  units?: PreviewUnit[];
  /** Grid width */
  gridWidth?: number;
  /** Grid height */
  gridHeight?: number;
  /** Cell size in pixels for rendering */
  cellSize?: number;
  /** Hovered cell position for AoE preview */
  hoveredCell?: Position | null;
  /** Callback when cell is hovered */
  onCellHover?: (position: Position | null) => void;
  /** Whether preview is active */
  isActive?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Grid dimensions */
const DEFAULT_GRID_WIDTH = 8;
const DEFAULT_GRID_HEIGHT = 10;

/** Default cell size for rendering */
const DEFAULT_CELL_SIZE = 48;

/** Color scheme for different highlight types */
const HIGHLIGHT_COLORS = {
  /** Range indicator - blue */
  range: 'rgba(59, 130, 246, 0.3)',
  rangeBorder: 'rgba(59, 130, 246, 0.6)',
  /** AoE area - orange */
  aoe: 'rgba(249, 115, 22, 0.4)',
  aoeBorder: 'rgba(249, 115, 22, 0.8)',
  /** Affected enemy - red */
  affectedEnemy: 'rgba(239, 68, 68, 0.5)',
  affectedEnemyBorder: 'rgba(239, 68, 68, 0.9)',
  /** Affected ally - green */
  affectedAlly: 'rgba(34, 197, 94, 0.5)',
  affectedAllyBorder: 'rgba(34, 197, 94, 0.9)',
  /** Caster position - purple */
  caster: 'rgba(168, 85, 247, 0.4)',
  casterBorder: 'rgba(168, 85, 247, 0.8)',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate Manhattan distance between two positions.
 * 
 * @param a - First position
 * @param b - Second position
 * @returns Manhattan distance
 */
function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Get all cells within range of a position.
 * 
 * @param center - Center position
 * @param range - Range in cells
 * @param gridWidth - Grid width
 * @param gridHeight - Grid height
 * @returns Array of positions within range
 */
function getCellsInRange(
  center: Position,
  range: number,
  gridWidth: number,
  gridHeight: number
): Position[] {
  const cells: Position[] = [];

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const distance = manhattanDistance(center, { x, y });
      if (distance <= range && distance > 0) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

/**
 * Get all cells in AoE area around a target.
 * 
 * @param center - Center of AoE
 * @param areaSize - Radius of AoE
 * @param gridWidth - Grid width
 * @param gridHeight - Grid height
 * @returns Array of positions in AoE
 */
function getCellsInAoE(
  center: Position,
  areaSize: number,
  gridWidth: number,
  gridHeight: number
): Position[] {
  const cells: Position[] = [];

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const distance = manhattanDistance(center, { x, y });
      if (distance <= areaSize) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

/**
 * Calculate estimated damage for an ability.
 * 
 * @param ability - Ability data
 * @param casterStats - Caster's stats
 * @param targetArmor - Target's armor (for physical damage)
 * @returns Estimated damage value
 */
function calculateEstimatedDamage(
  ability: AbilityPreviewData,
  casterStats: UnitStats,
  targetArmor: number = 0
): number {
  let totalDamage = 0;

  for (const effect of ability.effects) {
    if (effect.type === 'damage') {
      let damage = effect.value ?? 0;

      // Add attack scaling
      if (effect.attackScaling) {
        damage += casterStats.atk * effect.attackScaling;
      }

      // Apply armor reduction for physical damage
      if (effect.damageType === 'physical') {
        damage = Math.max(1, damage - targetArmor);
      }

      totalDamage += damage;
    }
  }

  return Math.round(totalDamage);
}

/**
 * Calculate estimated healing for an ability.
 * 
 * @param ability - Ability data
 * @param casterStats - Caster's stats
 * @returns Estimated healing value
 */
function calculateEstimatedHealing(
  ability: AbilityPreviewData,
  casterStats: UnitStats
): number {
  let totalHealing = 0;

  for (const effect of ability.effects) {
    if (effect.type === 'heal') {
      let healing = effect.value ?? 0;

      if (effect.attackScaling) {
        healing += casterStats.atk * effect.attackScaling;
      }

      totalHealing += healing;
    }
  }

  return Math.round(totalHealing);
}

/**
 * Get effect description for tooltip.
 * 
 * @param ability - Ability data
 * @returns Effect description string
 */
function getEffectDescription(ability: AbilityPreviewData): string {
  const descriptions: string[] = [];

  for (const effect of ability.effects) {
    switch (effect.type) {
      case 'damage':
        descriptions.push(`${effect.damageType === 'magical' ? 'Магический' : 'Физический'} урон`);
        break;
      case 'heal':
        descriptions.push('Лечение');
        break;
      case 'buff':
        descriptions.push(`Усиление ${effect.stat}`);
        break;
      case 'debuff':
        descriptions.push(`Ослабление ${effect.stat}`);
        break;
      case 'stun':
        descriptions.push(`Оглушение на ${effect.duration} ход(а)`);
        break;
      case 'taunt':
        descriptions.push(`Провокация на ${effect.duration} ход(а)`);
        break;
    }
  }

  return descriptions.join(', ');
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Grid cell highlight overlay props.
 */
interface CellHighlightProps {
  /** Cell position on grid */
  position: Position;
  /** Highlight type for styling */
  type: 'range' | 'aoe' | 'affectedEnemy' | 'affectedAlly' | 'caster';
  /** Cell size in pixels */
  cellSize: number;
  /** Damage value to display */
  damage?: number;
  /** Healing value to display */
  healing?: number;
}

/**
 * Grid cell highlight overlay component.
 * Renders colored overlay on grid cells to show ability targeting.
 * 
 * @param props - Component props
 * @returns JSX element for cell highlight
 */
function CellHighlight({ position, type, cellSize, damage, healing }: CellHighlightProps): JSX.Element {
  const bgColor = HIGHLIGHT_COLORS[type];
  const borderColor = HIGHLIGHT_COLORS[`${type}Border` as keyof typeof HIGHLIGHT_COLORS] || bgColor;

  // Determine if we should show damage/healing text based on cell size
  const showText = cellSize >= 32;

  return (
    <div
      className="absolute pointer-events-none transition-all duration-200"
      style={{
        left: position.x * cellSize,
        top: position.y * cellSize,
        width: cellSize,
        height: cellSize,
        backgroundColor: bgColor,
        border: `${cellSize >= 32 ? 2 : 1}px solid ${borderColor}`,
        borderRadius: cellSize >= 32 ? '4px' : '2px',
        zIndex: type === 'aoe' ? 15 : type === 'caster' ? 20 : 10,
      }}
    >
      {/* Damage/Healing indicator - only show if cell is large enough */}
      {showText && (damage !== undefined && damage > 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-red-200 bg-red-900/80 px-1 rounded">
            -{damage}
          </span>
        </div>
      )}
      {showText && (healing !== undefined && healing > 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-green-200 bg-green-900/80 px-1 rounded">
            +{healing}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Ability info tooltip.
 */
interface AbilityTooltipProps {
  ability: AbilityPreviewData;
  estimatedDamage?: number;
  estimatedHealing?: number;
  affectedCount: number;
}

function AbilityTooltip({
  ability,
  estimatedDamage,
  estimatedHealing,
  affectedCount
}: AbilityTooltipProps): JSX.Element {
  return (
    <div className="absolute top-2 right-2 bg-gray-900/95 border border-gray-600 rounded-lg p-3 shadow-xl z-50 max-w-xs">
      <div className="text-sm">
        <div className="font-bold text-white mb-1">{ability.name}</div>
        <div className="text-gray-300 text-xs mb-2">{ability.description}</div>

        <div className="space-y-1 text-xs">
          {ability.type === 'active' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Дальность:</span>
                <span className="text-blue-400">{ability.range} клеток</span>
              </div>
              {ability.areaSize && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Радиус AoE:</span>
                  <span className="text-orange-400">{ability.areaSize} клеток</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Перезарядка:</span>
                <span className="text-yellow-400">{ability.cooldown} ходов</span>
              </div>
            </>
          )}

          {estimatedDamage !== undefined && estimatedDamage > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Урон:</span>
              <span className="text-red-400">~{estimatedDamage}</span>
            </div>
          )}

          {estimatedHealing !== undefined && estimatedHealing > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Лечение:</span>
              <span className="text-green-400">~{estimatedHealing}</span>
            </div>
          )}

          {affectedCount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Целей:</span>
              <span className="text-purple-400">{affectedCount}</span>
            </div>
          )}

          <div className="pt-1 border-t border-gray-700 mt-1">
            <span className="text-gray-500">{getEffectDescription(ability)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AbilityTargetingPreview component.
 * Displays ability range and area of effect preview on the battlefield grid.
 * 
 * @param props - Component props
 * @returns JSX element or null if not active
 * @example
 * <AbilityTargetingPreview
 *   ability={selectedAbility}
 *   casterUnit={selectedUnit}
 *   casterPosition={{ x: 2, y: 1 }}
 *   units={allUnits}
 *   hoveredCell={hoveredPosition}
 *   isActive={true}
 * />
 */
export function AbilityTargetingPreview({
  ability,
  casterUnit,
  casterPosition,
  units = [],
  gridWidth = DEFAULT_GRID_WIDTH,
  gridHeight = DEFAULT_GRID_HEIGHT,
  cellSize = DEFAULT_CELL_SIZE,
  hoveredCell,
  onCellHover: _onCellHover,
  isActive = true,
}: AbilityTargetingPreviewProps): JSX.Element | null {
  // Note: _onCellHover is available for parent components that need callback
  // but this overlay component doesn't handle mouse events directly
  void _onCellHover;

  // All hooks must be called unconditionally (before any early returns)
  // Calculate range cells
  const rangeCells = useMemo(() => {
    if (!ability || !casterPosition || ability.type === 'passive' || ability.targetType === 'self') {
      return [];
    }
    return getCellsInRange(casterPosition, ability.range, gridWidth, gridHeight);
  }, [ability, casterPosition, gridWidth, gridHeight]);

  // Calculate AoE cells based on hovered position
  const aoeCells = useMemo(() => {
    if (!ability || !casterPosition || !ability.areaSize || !hoveredCell) {
      return [];
    }
    // Check if hovered cell is within range
    const distance = manhattanDistance(casterPosition, hoveredCell);
    if (distance > ability.range) {
      return [];
    }
    return getCellsInAoE(hoveredCell, ability.areaSize, gridWidth, gridHeight);
  }, [ability, casterPosition, hoveredCell, gridWidth, gridHeight]);

  // Find affected units
  const affectedUnits = useMemo(() => {
    if (!ability || !casterPosition) {
      return [];
    }
    const targetCells = aoeCells.length > 0 ? aoeCells :
      (hoveredCell && manhattanDistance(casterPosition, hoveredCell) <= ability.range)
        ? [hoveredCell]
        : [];

    return units.filter(unit => {
      // Check if unit is in target cells
      const inTargetArea = targetCells.some(
        cell => cell.x === unit.position.x && cell.y === unit.position.y
      );

      if (!inTargetArea) return false;

      // Filter by target type
      switch (ability.targetType) {
        case 'enemy':
        case 'area':
        case 'lowest_hp_enemy':
          return unit.team === 'enemy';
        case 'ally':
        case 'lowest_hp_ally':
          return unit.team === 'player';
        default:
          return false;
      }
    });
  }, [ability, aoeCells, hoveredCell, casterPosition, units]);

  // Calculate estimated damage/healing
  const estimatedDamage = useMemo(() => {
    if (!ability || !casterUnit) {
      return 0;
    }
    const avgArmor = affectedUnits.length > 0
      ? affectedUnits.reduce((sum, u) => sum + u.stats.armor, 0) / affectedUnits.length
      : 5;
    return calculateEstimatedDamage(ability, casterUnit.stats, avgArmor);
  }, [ability, casterUnit, affectedUnits]);

  const estimatedHealing = useMemo(() => {
    if (!ability || !casterUnit) {
      return 0;
    }
    return calculateEstimatedHealing(ability, casterUnit.stats);
  }, [ability, casterUnit]);

  // Don't render if not active or missing required data
  if (!isActive || !ability || !casterUnit || !casterPosition) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      {/* Caster position highlight */}
      <CellHighlight position={casterPosition} type="caster" cellSize={cellSize} />

      {/* Range cells */}
      {rangeCells.map((cell, index) => (
        <CellHighlight
          key={`range-${index}`}
          position={cell}
          type="range"
          cellSize={cellSize}
        />
      ))}

      {/* AoE cells */}
      {aoeCells.map((cell, index) => (
        <CellHighlight
          key={`aoe-${index}`}
          position={cell}
          type="aoe"
          cellSize={cellSize}
        />
      ))}

      {/* Affected units */}
      {affectedUnits.map((unit, index) => (
        <CellHighlight
          key={`affected-${index}`}
          position={unit.position}
          type={unit.team === 'enemy' ? 'affectedEnemy' : 'affectedAlly'}
          cellSize={cellSize}
          damage={unit.team === 'enemy' ? estimatedDamage : undefined}
          healing={unit.team === 'player' ? estimatedHealing : undefined}
        />
      ))}

      {/* Ability info tooltip - only show for larger grids */}
      {cellSize >= 40 && (
        <AbilityTooltip
          ability={ability}
          estimatedDamage={estimatedDamage}
          estimatedHealing={estimatedHealing}
          affectedCount={affectedUnits.length}
        />
      )}
    </div>
  );
}

// =============================================================================
// LEGEND COMPONENT
// =============================================================================

/**
 * Legend explaining the targeting preview colors.
 */
export function AbilityTargetingLegend(): JSX.Element {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
      <div className="flex items-center gap-1">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: HIGHLIGHT_COLORS.caster, border: `1px solid ${HIGHLIGHT_COLORS.casterBorder}` }}
        />
        <span>Позиция юнита</span>
      </div>
      <div className="flex items-center gap-1">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: HIGHLIGHT_COLORS.range, border: `1px solid ${HIGHLIGHT_COLORS.rangeBorder}` }}
        />
        <span>Дальность</span>
      </div>
      <div className="flex items-center gap-1">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: HIGHLIGHT_COLORS.aoe, border: `1px solid ${HIGHLIGHT_COLORS.aoeBorder}` }}
        />
        <span>Область AoE</span>
      </div>
      <div className="flex items-center gap-1">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: HIGHLIGHT_COLORS.affectedEnemy, border: `1px solid ${HIGHLIGHT_COLORS.affectedEnemyBorder}` }}
        />
        <span>Враг под ударом</span>
      </div>
    </div>
  );
}

export default AbilityTargetingPreview;
