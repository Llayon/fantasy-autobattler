/**
 * BattleReplay component for Fantasy Autobattler.
 * Displays battle replay with step-by-step visualization on 8×10 grid.
 * 
 * @fileoverview Complete battle replay system with animations, controls, and event log.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BattleLog, BattleEvent, Position, UnitTemplate, UNIT_INFO, UnitId } from '@/types/game';
import {
  MoveAnimation,
  AttackAnimation,
  DamageNumber,
  DeathAnimation,
  HealAnimation
} from './BattleAnimations';
import { AbilityAnimation } from './AbilityAnimations';
import { BattleResult } from './BattleResult';
import { getAbilityById, getAbilityIcon } from '@/lib/abilityData';
import { useUIStore } from '@/store/uiStore';
import { getHpBarColor } from '@/lib/hpBarUtils';

// Re-export for backwards compatibility
export { getHpBarColor } from '@/lib/hpBarUtils';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Unit facing direction for Core 2.0 mechanics.
 */
type UnitFacing = 'N' | 'S' | 'E' | 'W';

/**
 * Battle unit state for replay visualization.
 */
interface ReplayUnit {
  /** Unit instance ID */
  instanceId: string;
  /** Unit template data */
  template: UnitTemplate;
  /** Current position */
  position: Position;
  /** Current HP */
  currentHp: number;
  /** Maximum HP */
  maxHp: number;
  /** Team affiliation */
  team: 'player1' | 'player2';
  /** Whether unit is alive */
  alive: boolean;
  /** Animation state */
  animation?: {
    type: 'move' | 'attack' | 'damage' | 'death';
    fromPosition?: Position;
    toPosition?: Position;
    targetId?: string;
    damage?: number;
  };
  // Core 2.0 Mechanics fields
  /** Current resolve/morale (0-100) */
  resolve?: number;
  /** Maximum resolve */
  maxResolve?: number;
  /** Accumulated armor shred */
  armorShred?: number;
  /** Current facing direction */
  facing?: UnitFacing;
  /** Whether unit is in phalanx formation */
  inPhalanx?: boolean;
  /** Phalanx armor bonus */
  phalanxArmorBonus?: number;
  /** Phalanx resolve bonus */
  phalanxResolveBonus?: number;
  /** Number of adjacent allies in phalanx */
  adjacentAlliesCount?: number;
}

/**
 * Replay playback speed options.
 */
type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/**
 * Replay control state.
 */
interface ReplayState {
  /** Current event index */
  currentEventIndex: number;
  /** Whether replay is playing */
  isPlaying: boolean;
  /** Playback speed multiplier */
  speed: PlaybackSpeed;
  /** Current round number */
  currentRound: number;
}

/**
 * BattleReplay component props.
 */
interface BattleReplayProps {
  /** Battle log data for replay */
  battle: BattleLog;
  /** Current player ID for statistics calculation */
  playerId?: string;
  /** Optional callback when user wants to go back/continue */
  onBack?: () => void;
  /** Hide built-in result screen and call onBack instead (for roguelike mode) */
  hideResultScreen?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Grid dimensions */
const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;

/** Base animation duration in milliseconds */
const BASE_ANIMATION_DURATION = 1000;

/** Event type display names */
const EVENT_TYPE_NAMES: Record<string, string> = {
  move: '🚶 Движение',
  attack: '⚔️ Атака',
  damage: '💥 Урон',
  death: '💀 Смерть',
  heal: '💚 Лечение',
  ability: '✨ Способность',
  round_start: '🔄 Начало раунда',
  battle_end: '🏁 Конец боя',
  // Core 2.0 Mechanics events
  mechanic_facing: '🧭 Поворот',
  mechanic_armor_shred: '🛡️ Пробитие брони',
  mechanic_flanking: '🔪 Фланговая атака',
  mechanic_charge: '🐎 Рывок',
  mechanic_riposte: '⚔️ Контратака',
  mechanic_resolve: '💪 Решимость',
  mechanic_phalanx: '🛡️ Фаланга',
  mechanic_overwatch: '👁️ Наблюдение',
  mechanic_contagion: '☠️ Заражение',
  mechanic_ammunition: '🏹 Боеприпасы',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get player display name from battle log.
 * Uses player1Name/player2Name if available, otherwise falls back to generic names.
 * 
 * @param battle - Battle log data
 * @param player - Player identifier ('player1' or 'player2')
 * @returns Display name for the player
 */
function getPlayerName(battle: BattleLog, player: 'player1' | 'player2'): string {
  if (player === 'player1') {
    return (battle as BattleLog & { player1Name?: string }).player1Name || 'Игрок 1';
  } else {
    return (battle as BattleLog & { player2Name?: string }).player2Name || 'Игрок 2';
  }
}



/**
 * Get unit display name from instanceId.
 * Converts instanceId like "player_knight_0" to "Knight".
 * 
 * @param instanceId - Unit instance identifier
 * @param units - Available unit templates
 * @returns Human-readable unit name
 */
function getUnitDisplayName(instanceId: string, units: ReplayUnit[]): string {
  const unit = units.find(u => u.instanceId === instanceId);
  if (unit) {
    return unit.template.name;
  }

  // Fallback: extract unit type from instanceId
  const parts = instanceId.split('_');
  if (parts.length >= 2) {
    const unitId = parts[1] as UnitId;
    const unitInfo = UNIT_INFO[unitId];
    if (unitInfo && unitId) {
      return unitId.charAt(0).toUpperCase() + unitId.slice(1);
    }
  }

  return instanceId;
}

/**
 * Extract initial unit states from battle log.
 * Handles TeamSetup structure from backend with UnitTemplate[] and Position[].
 * 
 * @param battle - Battle log data
 * @returns Array of initial unit states
 */
function extractInitialUnits(battle: BattleLog): ReplayUnit[] {
  const units: ReplayUnit[] = [];

  try {
    // Extract player1 team (TeamSetup structure: { units: UnitTemplate[], positions: Position[] })
    if (battle.player1TeamSnapshot?.units && battle.player1TeamSnapshot?.positions) {
      const team1 = battle.player1TeamSnapshot;

      // Ensure arrays have same length
      const unitCount = Math.min(team1.units.length, team1.positions.length);

      for (let i = 0; i < unitCount; i++) {
        const unitTemplate = team1.units[i];
        const position = team1.positions[i];

        if (unitTemplate?.id && position) {
          // Generate instanceId that matches battle events: ${teamType}_${unitTemplate.id}_${index}
          const instanceId = `player_${unitTemplate.id}_${i}`;

          // Extract Core 2.0 fields from template if available
          const templateWithMechanics = unitTemplate as UnitTemplate & {
            resolve?: number;
            facing?: UnitFacing;
          };

          units.push({
            instanceId,
            template: unitTemplate,
            position: position,
            currentHp: unitTemplate.stats.hp,
            maxHp: unitTemplate.stats.hp,
            team: 'player1',
            alive: true,
            // Core 2.0 fields - player units face North ('N')
            resolve: templateWithMechanics.resolve ?? 100,
            maxResolve: 100,
            armorShred: 0,
            facing: templateWithMechanics.facing ?? 'N',
          });
        }
      }
    }

    // Extract player2 team (TeamSetup structure: { units: UnitTemplate[], positions: Position[] })
    if (battle.player2TeamSnapshot?.units && battle.player2TeamSnapshot?.positions) {
      const team2 = battle.player2TeamSnapshot;

      // Ensure arrays have same length
      const unitCount = Math.min(team2.units.length, team2.positions.length);

      for (let i = 0; i < unitCount; i++) {
        const unitTemplate = team2.units[i];
        const position = team2.positions[i];

        if (unitTemplate?.id && position) {
          // Generate instanceId that matches battle events: ${teamType}_${unitTemplate.id}_${index}
          const instanceId = `bot_${unitTemplate.id}_${i}`;

          // Extract Core 2.0 fields from template if available
          const templateWithMechanics = unitTemplate as UnitTemplate & {
            resolve?: number;
            facing?: UnitFacing;
          };

          units.push({
            instanceId,
            template: unitTemplate,
            position: position,
            currentHp: unitTemplate.stats.hp,
            maxHp: unitTemplate.stats.hp,
            team: 'player2',
            alive: true,
            // Core 2.0 fields - bot units face South ('S')
            resolve: templateWithMechanics.resolve ?? 100,
            maxResolve: 100,
            armorShred: 0,
            facing: templateWithMechanics.facing ?? 'S',
          });
        }
      }
    }
  } catch (error) {
    // Error will be visible in debug panel below
  }

  return units;
}

/**
 * Apply battle event to unit states.
 * 
 * @param units - Current unit states
 * @param event - Battle event to apply
 * @returns Updated unit states
 */
function applyEventToUnits(units: ReplayUnit[], event: BattleEvent): ReplayUnit[] {
  return units.map(unit => {
    const updatedUnit = { ...unit };

    // Clear previous animations
    delete updatedUnit.animation;

    // Apply event effects
    switch (event.type) {
      case 'move':
        if (event.actorId === unit.instanceId && event.toPosition) {
          updatedUnit.animation = {
            type: 'move',
            fromPosition: unit.position,
            toPosition: event.toPosition,
          };
          updatedUnit.position = event.toPosition;
        }
        break;

      case 'attack':
        if (event.actorId === unit.instanceId && event.targetId) {
          updatedUnit.animation = {
            type: 'attack',
            targetId: event.targetId,
          };
        }
        break;

      case 'damage':
        if (event.targetId === unit.instanceId && event.damage) {
          updatedUnit.currentHp = Math.max(0, unit.currentHp - event.damage);
          updatedUnit.animation = {
            type: 'damage',
            damage: event.damage,
          };
          // Mark as dead if HP reaches 0
          if (updatedUnit.currentHp <= 0) {
            updatedUnit.alive = false;
          }
        }
        break;

      case 'heal':
        if (event.targetId === unit.instanceId && event.healing) {
          updatedUnit.currentHp = Math.min(unit.maxHp, unit.currentHp + event.healing);
        }
        break;

      case 'death':
        // Death events use actorId (not targetId) for the dying unit, plus killedUnits array
        if (event.actorId === unit.instanceId ||
          event.targetId === unit.instanceId ||
          event.killedUnits?.includes(unit.instanceId)) {
          updatedUnit.alive = false;
          updatedUnit.currentHp = 0;
          updatedUnit.animation = {
            type: 'death',
          };
        }
        break;

      case 'ability':
        // Handle ability damage and kills
        if (event.targetId === unit.instanceId || event.targetIds?.includes(unit.instanceId)) {
          // Apply damage from ability if this unit is a target
          if (event.totalDamage && event.targetIds) {
            // Distribute damage among targets (simplified - equal distribution)
            const damagePerTarget = Math.floor(event.totalDamage / event.targetIds.length);
            updatedUnit.currentHp = Math.max(0, unit.currentHp - damagePerTarget);
          } else if (event.totalDamage && event.targetId === unit.instanceId) {
            // Single target ability
            updatedUnit.currentHp = Math.max(0, unit.currentHp - event.totalDamage);
          }

          // Apply healing from ability
          if (event.totalHealing && event.targetId === unit.instanceId) {
            updatedUnit.currentHp = Math.min(unit.maxHp, unit.currentHp + event.totalHealing);
          }
        }

        // Check if this unit was killed by the ability
        if (event.killedUnits?.includes(unit.instanceId)) {
          updatedUnit.alive = false;
          updatedUnit.currentHp = 0;
          updatedUnit.animation = {
            type: 'death',
          };
        }
        break;

      // ─────────────────────────────────────────────────────────────
      // Core 2.0 Mechanics Events
      // ─────────────────────────────────────────────────────────────

      case 'mechanic_armor_shred':
        // Apply armor shred to target
        // ArmorShredEvent has shredApplied/totalShred directly on event, not in metadata
        if (event.targetId === unit.instanceId) {
          const shredEvent = event as typeof event & { shredApplied?: number; totalShred?: number };
          const metadata = event.metadata as { shredApplied?: number; totalShred?: number } | undefined;
          // Try direct properties first, then fallback to metadata
          const totalShred = shredEvent.totalShred ?? metadata?.totalShred;
          const shredApplied = shredEvent.shredApplied ?? metadata?.shredApplied;
          if (totalShred !== undefined) {
            updatedUnit.armorShred = totalShred;
          } else if (shredApplied !== undefined) {
            updatedUnit.armorShred = (unit.armorShred ?? 0) + shredApplied;
          }
        }
        break;

      case 'mechanic_resolve':
        // Apply resolve changes
        // ResolveEvent uses resolveDamage, previousResolve, newResolve, source
        if (event.targetId === unit.instanceId) {
          const metadata = event.metadata as { 
            newResolve?: number; 
            resolveDamage?: number;
            // Legacy format
            amount?: number; 
            changeType?: string;
          } | undefined;
          
          // Try newResolve first (new format)
          if (metadata?.newResolve !== undefined) {
            updatedUnit.resolve = metadata.newResolve;
          } else if (metadata?.resolveDamage !== undefined) {
            // Calculate from resolveDamage
            const currentResolve = unit.resolve ?? 100;
            updatedUnit.resolve = Math.max(0, currentResolve - metadata.resolveDamage);
          } else if (metadata?.amount !== undefined) {
            // Legacy format
            const currentResolve = unit.resolve ?? 100;
            if (metadata.changeType === 'damage') {
              updatedUnit.resolve = Math.max(0, currentResolve - metadata.amount);
            } else if (metadata.changeType === 'regen') {
              updatedUnit.resolve = Math.min(unit.maxResolve ?? 100, currentResolve + metadata.amount);
            }
          }
        }
        break;

      case 'mechanic_flanking':
        // Flanking events may include resolve damage
        if (event.targetId === unit.instanceId) {
          const metadata = event.metadata as { resolveDamage?: number } | undefined;
          if (metadata?.resolveDamage && metadata.resolveDamage > 0) {
            const currentResolve = unit.resolve ?? 100;
            updatedUnit.resolve = Math.max(0, currentResolve - metadata.resolveDamage);
          }
        }
        break;

      case 'mechanic_facing':
        // Update unit facing direction
        if (event.targetId === unit.instanceId || event.actorId === unit.instanceId) {
          const metadata = event.metadata as { newFacing?: UnitFacing } | undefined;
          if (metadata?.newFacing) {
            updatedUnit.facing = metadata.newFacing;
          }
        }
        break;

      case 'mechanic_phalanx':
        // Update phalanx state for unit
        if (event.targetId === unit.instanceId || event.actorId === unit.instanceId) {
          const metadata = event.metadata as { 
            armorBonus?: number; 
            resolveBonus?: number; 
            adjacentAllies?: number;
            formationState?: string;
          } | undefined;
          if (metadata) {
            updatedUnit.inPhalanx = (metadata.armorBonus ?? 0) > 0;
            updatedUnit.phalanxArmorBonus = metadata.armorBonus ?? 0;
            updatedUnit.phalanxResolveBonus = metadata.resolveBonus ?? 0;
            updatedUnit.adjacentAlliesCount = metadata.adjacentAllies ?? 0;
          }
        }
        break;
    }

    return updatedUnit;
  });
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Get CSS rotation transform based on unit facing direction.
 * N=0deg (default), E=90deg, S=180deg, W=270deg
 * 
 * @param facing - Unit facing direction
 * @returns CSS transform string
 */
function getFacingRotation(facing?: UnitFacing): string {
  switch (facing) {
    case 'E': return 'rotate(90deg)';
    case 'S': return 'rotate(180deg)';
    case 'W': return 'rotate(270deg)';
    case 'N':
    default: return 'rotate(0deg)';
  }
}

/**
 * Grid cell component for battle replay with unit interaction.
 */
function ReplayGridCell({
  position,
  unit,
  onClick,
  onUnitClick,
  isMovementSource = false,
  isMovementTarget = false,
  movementPath = [],
  showDebugInfo = false,
  isActiveUnit = false,
  isHighlighted = false
}: {
  position: Position;
  unit?: ReplayUnit;
  onClick?: () => void;
  onUnitClick?: (unit: ReplayUnit, event: React.MouseEvent) => void;
  isMovementSource?: boolean;
  isMovementTarget?: boolean;
  movementPath?: Position[];
  showDebugInfo?: boolean;
  isActiveUnit?: boolean;
  isHighlighted?: boolean;
}) {
  const isPlayerZone = position.y <= 1;
  const isEnemyZone = position.y >= 8;
  const isOnMovementPath = movementPath.some(p => p.x === position.x && p.y === position.y);

  const cellClasses = [
    'relative w-12 h-12 border border-gray-600 transition-all duration-300',
    isPlayerZone ? 'bg-blue-900/20' : isEnemyZone ? 'bg-red-900/20' : 'bg-gray-800/50',
    onClick ? 'cursor-pointer hover:bg-white/10' : '',
    isMovementSource ? 'bg-yellow-500/30 border-yellow-400' : '',
    isMovementTarget ? 'bg-green-500/30 border-green-400' : '',
    isOnMovementPath ? 'bg-yellow-400/20 border-yellow-300' : '',
    isHighlighted ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-gray-900' : '',
  ].join(' ');

  /**
   * Handle cell click - prioritize unit click over cell click.
   */
  const handleCellClick = (event: React.MouseEvent) => {
    if (unit && onUnitClick) {
      event.stopPropagation();
      onUnitClick(unit, event);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className={cellClasses} onClick={handleCellClick}>
      {/* Debug coordinates - only shown when debug mode is enabled */}
      {showDebugInfo && (
        <div className="absolute top-0 left-0 text-[8px] text-gray-500 px-0.5">
          {position.x},{position.y}
        </div>
      )}

      {/* Movement indicators */}
      {isMovementSource && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-yellow-400 text-2xl animate-pulse">📍</div>
        </div>
      )}

      {isMovementTarget && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-green-400 text-2xl animate-bounce">🎯</div>
        </div>
      )}

      {/* Unit display - only show alive units, dead units show as gravestones briefly then disappear */}
      {unit && unit.alive && (
        <>
          {/* Active unit indicator - pulsing yellow border outside the unit */}
          {isActiveUnit && (
            <div className="absolute -inset-1 border-2 border-yellow-400 rounded animate-pulse pointer-events-none" />
          )}

          <div className={`
            absolute inset-1 rounded flex items-center justify-center text-lg font-bold cursor-pointer
            ${unit.team === 'player1' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'}
            ${unit.animation?.type === 'damage' ? 'animate-pulse bg-red-400' : ''}
            ${unit.animation?.type === 'move' ? 'ring-2 ring-yellow-400 ring-opacity-75 animate-pulse scale-110' : ''}
            ${unit.animation?.type === 'attack' ? 'animate-ping bg-orange-500' : ''}
            ${isActiveUnit ? 'scale-105' : ''}
            transition-all duration-300 hover:scale-110
          `}
            title={`${unit.template.name} - Click for details`}
          >
            {/* Unit emoji with facing rotation */}
            <span style={{ transform: getFacingRotation(unit.facing), display: 'inline-block' }}>
              {UNIT_INFO[unit.template.id]?.emoji || '❓'}
            </span>

            {/* HP bar - 3px height with conditional colors */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-700 rounded-b">
              <div
                className={`h-full rounded-b transition-all duration-300 ${getHpBarColor((unit.currentHp / unit.maxHp) * 100)}`}
                style={{ width: `${(unit.currentHp / unit.maxHp) * 100}%` }}
              />
            </div>

            {/* Resolve bar - 2px height above HP bar (only show if resolve < 100) */}
            {unit.resolve !== undefined && unit.resolve < (unit.maxResolve ?? 100) && (
              <div className="absolute bottom-[4px] left-0 right-0 h-[2px] bg-gray-700">
                <div
                  className="h-full bg-indigo-400 transition-all duration-300"
                  style={{ width: `${(unit.resolve / (unit.maxResolve ?? 100)) * 100}%` }}
                />
              </div>
            )}

            {/* Damage indicator */}
            {unit.animation?.type === 'damage' && unit.animation.damage && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-red-400 font-bold text-sm animate-bounce bg-black/50 px-1 rounded">
                -{unit.animation.damage}
              </div>
            )}

            {/* Movement indicator */}
            {unit.animation?.type === 'move' && unit.animation.fromPosition && unit.animation.toPosition && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-xs animate-pulse bg-black/50 px-1 rounded">
                ({unit.animation.fromPosition.x},{unit.animation.fromPosition.y}) → ({unit.animation.toPosition.x},{unit.animation.toPosition.y})
              </div>
            )}

            {/* Attack indicator */}
            {unit.animation?.type === 'attack' && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-orange-400 font-bold animate-bounce">
                ⚔️
              </div>
            )}
          </div>
        </>
      )}

      {/* Dead unit gravestone - shows briefly during death animation */}
      {unit && !unit.alive && unit.animation?.type === 'death' && (
        <div className="absolute inset-1 rounded flex items-center justify-center text-lg opacity-50 animate-pulse">
          💀
        </div>
      )}
    </div>
  );
}

/**
 * Turn order bar component with enhanced unit display.
 */
function TurnOrderBar({
  units,
  currentRound,
  currentEventIndex,
  events,
  battle
}: {
  units: ReplayUnit[];
  currentRound: number;
  currentEventIndex: number;
  events: BattleEvent[];
  battle: BattleLog;
}) {
  const [selectedUnit, setSelectedUnit] = useState<ReplayUnit | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const aliveUnits = units.filter(unit => unit.alive);

  // Determine current active unit based on current event
  const currentEvent = events[currentEventIndex];
  const activeUnitId = currentEvent?.actorId;

  /**
   * Handle unit click to show tooltip with stats.
   */
  const handleUnitClick = useCallback((unit: ReplayUnit, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedUnit(unit);
  }, []);

  /**
   * Close tooltip when clicking outside.
   */
  const handleCloseTooltip = useCallback(() => {
    setSelectedUnit(null);
    setTooltipPosition(null);
  }, []);

  // Close tooltip on outside click
  useEffect(() => {
    const handleClickOutside = () => handleCloseTooltip();
    if (selectedUnit) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [selectedUnit, handleCloseTooltip]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Раунд {currentRound}</h3>
        <div className="text-sm text-gray-400">
          Живых юнитов: {aliveUnits.length}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {aliveUnits
          .sort((a, b) => b.template.stats.initiative - a.template.stats.initiative)
          .map(unit => {
            const isActive = unit.instanceId === activeUnitId;
            const hpPercent = (unit.currentHp / unit.maxHp) * 100;

            return (
              <div
                key={unit.instanceId}
                className={`
                  flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 relative
                  ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-75 scale-110' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnitClick(unit, e);
                }}
                title={`${unit.template.name} - Click for stats`}
              >
                {/* Active unit arrow indicator */}
                {isActive && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xl animate-bounce">
                    ▼
                  </div>
                )}

                {/* Unit icon - increased to 48x48px */}
                <div
                  className={`
                    w-12 h-12 rounded-lg border-2 flex items-center justify-center relative
                    ${unit.team === 'player1' ? 'border-blue-400 bg-blue-600/20' : 'border-red-400 bg-red-600/20'}
                    ${isActive ? 'border-yellow-400 bg-yellow-500/20 animate-pulse' : ''}
                  `}
                >
                  <span className="text-xl">{UNIT_INFO[unit.template.id]?.emoji || '❓'}</span>

                  {/* Initiative indicator */}
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unit.template.stats.initiative}
                  </div>
                </div>

                {/* HP bar - 4px height */}
                <div className="w-12 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getHpBarColor(hpPercent)}`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                {/* HP text */}
                <div className="text-xs text-center text-gray-400 mt-1">
                  {unit.currentHp}/{unit.maxHp}
                </div>
              </div>
            );
          })}
      </div>

      {/* Unit stats tooltip */}
      {selectedUnit && tooltipPosition && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-sm">
            <div className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-lg">{UNIT_INFO[selectedUnit.template.id]?.emoji}</span>
              {selectedUnit.template.name}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">HP:</span>
                <span className="text-red-400 font-medium ml-1">
                  {selectedUnit.currentHp}/{selectedUnit.maxHp}
                </span>
              </div>
              <div>
                <span className="text-gray-400">ATK:</span>
                <span className="text-orange-400 font-medium ml-1">
                  {selectedUnit.template.stats.atk}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Armor:</span>
                {/* Show effective armor accounting for shred */}
                {(() => {
                  const baseArmor = selectedUnit.template.stats.armor;
                  const shred = selectedUnit.armorShred ?? 0;
                  const effectiveArmor = Math.max(0, baseArmor - shred);
                  const hasShred = shred > 0;
                  return (
                    <span className={`font-medium ml-1 ${hasShred ? 'text-amber-400' : 'text-blue-400'}`}>
                      {effectiveArmor}
                      {hasShred && (
                        <span className="text-gray-500 text-[10px] ml-1">
                          (-{shred})
                        </span>
                      )}
                    </span>
                  );
                })()}
              </div>
              <div>
                <span className="text-gray-400">Speed:</span>
                <span className="text-green-400 font-medium ml-1">
                  {selectedUnit.template.stats.speed}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Initiative:</span>
                <span className="text-yellow-400 font-medium ml-1">
                  {selectedUnit.template.stats.initiative}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Dodge:</span>
                <span className="text-purple-400 font-medium ml-1">
                  {selectedUnit.template.stats.dodge}%
                </span>
              </div>
              {/* Resolve display (Core 2.0) */}
              {selectedUnit.resolve !== undefined && (
                <div className="col-span-2">
                  <span className="text-gray-400">Мораль:</span>
                  <span className={`font-medium ml-1 ${selectedUnit.resolve > 60
                    ? 'text-indigo-400'
                    : selectedUnit.resolve > 30
                      ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                    {selectedUnit.resolve}/{selectedUnit.maxResolve ?? 100}
                  </span>
                </div>
              )}
              {/* Phalanx bonus display (Core 2.0) */}
              {selectedUnit.inPhalanx && (selectedUnit.phalanxArmorBonus ?? 0) > 0 && (
                <div className="col-span-2 mt-1 p-1 bg-sky-900/30 rounded">
                  <span className="text-sky-400 text-[10px]">🛡️ Фаланга:</span>
                  <span className="text-sky-300 font-medium ml-1 text-[10px]">
                    +{selectedUnit.phalanxArmorBonus} брони, +{selectedUnit.phalanxResolveBonus ?? 0} решимости
                  </span>
                  <span className="text-gray-500 text-[10px] ml-1">
                    ({selectedUnit.adjacentAlliesCount ?? 0} союзн.)
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                Team: <span className={selectedUnit.team === 'player1' ? 'text-blue-400' : 'text-red-400'}>
                  {selectedUnit.team === 'player1' ? getPlayerName(battle, 'player1') : getPlayerName(battle, 'player2')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Event marker for progress bar.
 */
interface EventMarker {
  /** Event index */
  index: number;
  /** Event type */
  type: 'death' | 'ability' | 'round_start';
  /** Marker icon */
  icon: string;
  /** Marker color */
  color: string;
  /** Tooltip description */
  description: string;
}

/**
 * Progress bar with event markers component.
 * Shows clickable markers for key events (deaths, abilities, round starts).
 */
function ProgressBarWithMarkers({
  events,
  currentEventIndex,
  totalEvents,
  onSeek,
  units,
}: {
  events: BattleEvent[];
  currentEventIndex: number;
  totalEvents: number;
  onSeek: (eventIndex: number) => void;
  units: ReplayUnit[];
}) {
  const [hoveredMarker, setHoveredMarker] = useState<EventMarker | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  /**
   * Extract key event markers from events array.
   * 
   * @returns Array of event markers
   */
  const markers = useMemo((): EventMarker[] => {
    const result: EventMarker[] = [];

    events.forEach((event, index) => {
      if (event.type === 'death') {
        const targetName = event.targetId ? getUnitDisplayName(event.targetId, units) : 'Юнит';
        result.push({
          index,
          type: 'death',
          icon: '💀',
          color: 'bg-red-500',
          description: `Смерть: ${targetName}`,
        });
      } else if (event.type === 'ability') {
        const actorName = event.actorId ? getUnitDisplayName(event.actorId, units) : 'Юнит';
        const ability = event.abilityId ? getAbilityById(event.abilityId) : undefined;
        const abilityName = ability?.name || 'способность';
        result.push({
          index,
          type: 'ability',
          icon: '✨',
          color: 'bg-yellow-500',
          description: `${actorName}: ${abilityName}`,
        });
      } else if (event.type === 'round_start') {
        result.push({
          index,
          type: 'round_start',
          icon: '|',
          color: 'bg-gray-400',
          description: `Раунд ${event.round}`,
        });
      }
    });

    return result;
  }, [events, units]);

  /**
   * Handle marker click to seek to event.
   */
  const handleMarkerClick = (marker: EventMarker) => {
    onSeek(marker.index);
  };

  /**
   * Handle marker hover to show tooltip.
   */
  const handleMarkerHover = (marker: EventMarker, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredMarker(marker);
  };

  /**
   * Handle marker leave to hide tooltip.
   */
  const handleMarkerLeave = () => {
    setHoveredMarker(null);
    setTooltipPosition(null);
  };

  const progress = totalEvents > 0 ? (Math.max(0, currentEventIndex + 1) / totalEvents) * 100 : 0;

  return (
    <div className="relative">
      {/* Progress bar container */}
      <div className="w-full bg-gray-700 rounded-full h-6 relative overflow-visible">
        {/* Progress fill */}
        <div
          className="bg-blue-600 h-6 rounded-full transition-all duration-300 relative z-10"
          style={{ width: `${progress}%` }}
        />

        {/* Event markers */}
        {markers.map((marker, idx) => {
          const position = (marker.index / totalEvents) * 100;
          const isRoundStart = marker.type === 'round_start';

          return (
            <div
              key={`${marker.type}-${marker.index}-${idx}`}
              className={`
                absolute top-0 transform -translate-x-1/2 cursor-pointer transition-all duration-200
                ${isRoundStart ? 'h-6 w-0.5' : 'h-6 w-6 rounded-full flex items-center justify-center text-xs'}
                ${marker.color}
                hover:scale-125 hover:z-30
                ${marker.index === currentEventIndex ? 'ring-2 ring-white scale-125 z-20' : 'z-10'}
              `}
              style={{ left: `${position}%` }}
              onClick={() => handleMarkerClick(marker)}
              onMouseEnter={(e) => handleMarkerHover(marker, e)}
              onMouseLeave={handleMarkerLeave}
              title={marker.description}
            >
              {!isRoundStart && marker.icon}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredMarker && tooltipPosition && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 shadow-xl text-sm whitespace-nowrap"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{hoveredMarker.icon}</span>
            <span className="text-white">{hoveredMarker.description}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Replay controls component.
 */
function ReplayControls({
  replayState,
  totalEvents,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onSpeedChange,
  onSeek,
  onSkipToStart,
  onSkipToEnd,
  events,
  units,
  keyMomentsOnly,
  onToggleKeyMoments,
}: {
  replayState: ReplayState;
  totalEvents: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSeek: (eventIndex: number) => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
  events: BattleEvent[];
  units: ReplayUnit[];
  keyMomentsOnly: boolean;
  onToggleKeyMoments: () => void;
}) {
  const progress = totalEvents > 0 ? (Math.max(0, replayState.currentEventIndex + 1) / totalEvents) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {/* Skip to start */}
        <button
          onClick={onSkipToStart}
          disabled={replayState.currentEventIndex <= -1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="В начало (Home)"
        >
          ⏮️
        </button>

        {/* Step back */}
        <button
          onClick={onStepBack}
          disabled={replayState.currentEventIndex <= -1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="Шаг назад (←)"
        >
          ⏪
        </button>

        {/* Play/Pause */}
        <button
          onClick={replayState.isPlaying ? onPause : onPlay}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          title={replayState.isPlaying ? "Пауза (Пробел)" : "Играть (Пробел)"}
        >
          {replayState.isPlaying ? '⏸️ Пауза' : '▶️ Играть'}
        </button>

        {/* Step forward */}
        <button
          onClick={onStep}
          disabled={replayState.currentEventIndex >= totalEvents - 1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="Шаг вперед (→)"
        >
          ⏩
        </button>

        {/* Skip to end */}
        <button
          onClick={onSkipToEnd}
          disabled={replayState.currentEventIndex >= totalEvents - 1}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="В конец (End)"
        >
          ⏭️
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-400">Скорость:</span>
          {[0.5, 1, 2, 4].map((speed, index) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed as PlaybackSpeed)}
              className={`
                px-3 py-1 rounded text-sm transition-colors relative
                ${replayState.speed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
              title={`Скорость ${speed}x (клавиша ${index + 1})`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Key Moments Only toggle */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onToggleKeyMoments}
            className={`
              px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
              ${keyMomentsOnly
                ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
            title="Показывать только ключевые моменты (смерти, способности)"
          >
            {keyMomentsOnly ? '⭐ Ключевые' : '📋 Все'}
          </button>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
            title="Горячие клавиши: Пробел (играть/пауза), ← → (шаги), Home/End (начало/конец), 1-4 (скорость)"
          >
            ⌨️ Клавиши
          </button>
        </div>
      </div>

      {/* Progress bar with markers */}
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Событие {Math.max(0, replayState.currentEventIndex + 1)} из {totalEvents}
            {replayState.currentEventIndex === -1 && (
              <span className="text-blue-400 ml-2">🏁 Начало</span>
            )}
            {replayState.currentEventIndex === totalEvents - 1 && totalEvents > 0 && (
              <span className="text-green-400 ml-2">🏁 Конец</span>
            )}
            {keyMomentsOnly && (
              <span className="text-yellow-400 ml-2">⭐ Только ключевые моменты</span>
            )}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        {/* Enhanced progress bar with event markers */}
        <ProgressBarWithMarkers
          events={events}
          currentEventIndex={replayState.currentEventIndex}
          totalEvents={totalEvents}
          onSeek={onSeek}
          units={units}
        />

        {/* Slider for fine control */}
        <input
          type="range"
          min="-1"
          max={totalEvents - 1}
          value={replayState.currentEventIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full mt-2 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider hover:h-4 transition-all duration-200"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`
          }}
          title={`Событие ${Math.max(0, replayState.currentEventIndex + 1)} из ${totalEvents}`}
        />

        {/* Legend for markers */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span className="text-base">💀</span>
            <span>Смерть</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-base">✨</span>
            <span>Способность</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">|</span>
            <span>Раунд</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced event log component with color coding and readable names.
 */
function EventLog({
  events,
  currentEventIndex,
  units,
  onHighlightUnit
}: {
  events: BattleEvent[];
  currentEventIndex: number;
  units: ReplayUnit[];
  onHighlightUnit?: (unitId: string | null) => void;
}) {
  // Ref for current event to enable auto-scroll
  const currentEventRef = useRef<HTMLDivElement>(null);

  /**
   * Get team affiliation from unit ID.
   * 
   * @param unitId - Unit instance ID
   * @returns Team affiliation ('player1' | 'player2' | null)
   */
  const getTeamFromUnitId = (unitId: string | undefined): 'player1' | 'player2' | null => {
    if (!unitId) return null;
    const unit = units.find(u => u.instanceId === unitId);
    return unit?.team || null;
  };

  /**
   * Get the primary unit ID for team color display based on event type.
   * For most events, use actorId. For resolve/damage events, use targetId.
   * 
   * @param event - Battle event
   * @returns Unit ID to use for team color
   */
  const getPrimaryUnitIdForEvent = (event: BattleEvent): string | undefined => {
    // For events that affect a target, show target's team color
    if (event.type === 'mechanic_resolve' || event.type === 'damage' || event.type === 'heal') {
      return event.targetId || event.actorId;
    }
    // For other events, show actor's team color
    return event.actorId || event.targetId;
  };

  /**
   * Get team color dot classes.
   * 
   * @param team - Team affiliation
   * @returns CSS classes for team color dot
   */
  const getTeamDotColor = (team: 'player1' | 'player2' | null): string => {
    if (team === 'player1') return 'bg-blue-500';
    if (team === 'player2') return 'bg-red-500';
    return 'bg-gray-500';
  };

  /**
   * Auto-scroll to current event when it changes.
   */
  useEffect(() => {
    if (currentEventRef.current) {
      currentEventRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentEventIndex]);
  /**
   * Get event color based on type.
   */
  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case 'damage':
        return 'text-red-400';
      case 'move':
        return 'text-blue-400';
      case 'heal':
        return 'text-green-400';
      case 'attack':
        return 'text-orange-400';
      case 'death':
        return 'text-purple-400';
      case 'ability':
        return 'text-yellow-400';
      case 'round_start':
        return 'text-cyan-400';
      case 'battle_end':
        return 'text-pink-400';
      // Core 2.0 Mechanics events
      case 'mechanic_armor_shred':
        return 'text-amber-400';
      case 'mechanic_flanking':
        return 'text-rose-400';
      case 'mechanic_charge':
        return 'text-emerald-400';
      case 'mechanic_riposte':
        return 'text-orange-300';
      case 'mechanic_resolve':
        return 'text-indigo-400';
      case 'mechanic_phalanx':
        return 'text-sky-400';
      case 'mechanic_overwatch':
        return 'text-violet-400';
      case 'mechanic_contagion':
        return 'text-lime-400';
      case 'mechanic_ammunition':
        return 'text-amber-400';
      default:
        return 'text-gray-400';
    }
  };

  /**
   * Get event border color based on type.
   */
  const getEventBorderColor = (eventType: string): string => {
    switch (eventType) {
      case 'damage':
        return 'border-red-500';
      case 'move':
        return 'border-blue-500';
      case 'heal':
        return 'border-green-500';
      case 'attack':
        return 'border-orange-500';
      case 'death':
        return 'border-purple-500';
      case 'ability':
        return 'border-yellow-500';
      case 'round_start':
        return 'border-cyan-500';
      case 'battle_end':
        return 'border-pink-500';
      // Core 2.0 Mechanics events
      case 'mechanic_armor_shred':
        return 'border-amber-500';
      case 'mechanic_flanking':
        return 'border-rose-500';
      case 'mechanic_charge':
        return 'border-emerald-500';
      case 'mechanic_riposte':
        return 'border-orange-400';
      case 'mechanic_resolve':
        return 'border-indigo-500';
      case 'mechanic_phalanx':
        return 'border-sky-500';
      case 'mechanic_overwatch':
        return 'border-violet-500';
      case 'mechanic_contagion':
        return 'border-lime-500';
      case 'mechanic_ammunition':
        return 'border-amber-500';
      default:
        return 'border-gray-500';
    }
  };

  /**
   * Format event description with unit names instead of IDs.
   * Includes ability names and effect details for ability events.
   * 
   * @param event - Battle event to format
   * @returns Human-readable event description
   */
  const formatEventDescription = (event: BattleEvent): string => {
    const actorName = event.actorId ? getUnitDisplayName(event.actorId, units) : '';
    const targetName = event.targetId ? getUnitDisplayName(event.targetId, units) : '';

    switch (event.type) {
      case 'attack':
        // Show dodge indicator if attack was dodged
        if (event.dodged) {
          return `${actorName} атакует ${targetName} — Уклонение! 💨`;
        }
        return `${actorName} атакует ${targetName}`;
      case 'damage':
        return `${targetName} получает ${event.damage} урона`;
      case 'heal':
        return `${targetName} восстанавливает ${event.healing} HP`;
      case 'move':
        return `${actorName} перемещается`;
      case 'death':
        return `${targetName} погибает`;
      case 'ability': {
        // Get ability name from abilityId
        const abilityId = event.abilityId;
        const ability = abilityId ? getAbilityById(abilityId) : undefined;
        const abilityName = ability?.name || 'способность';
        const abilityIcon = ability?.icon ? getAbilityIcon(ability.icon) : '✨';

        if (targetName && targetName !== actorName) {
          return `${abilityIcon} ${actorName} использует "${abilityName}" на ${targetName}`;
        }
        return `${abilityIcon} ${actorName} использует "${abilityName}"`;
      }
      case 'round_start':
        return `Начинается раунд ${event.round}`;
      case 'battle_end':
        return 'Бой завершен';
      // ─────────────────────────────────────────────────────────────
      // Core 2.0 Mechanics Events
      // ─────────────────────────────────────────────────────────────
      case 'mechanic_flanking': {
        const metadata = event.metadata as { arc?: string; damageModifier?: number } | undefined;
        const arcName = metadata?.arc === 'rear' ? 'в тыл' : 'во фланг';
        const bonus = metadata?.damageModifier ? Math.round((metadata.damageModifier - 1) * 100) : 0;
        return `🔪 ${actorName} атакует ${arcName}${bonus > 0 ? ` (+${bonus}% урона)` : ''}`;
      }
      case 'mechanic_riposte': {
        const metadata = event.metadata as { damage?: number; chance?: number; attackerKilled?: boolean } | undefined;
        const damage = metadata?.damage ?? 0;
        const killed = metadata?.attackerKilled ? ' 💀' : '';
        return `⚔️ ${actorName} контратакует ${targetName} (${damage} урона)${killed}`;
      }
      case 'mechanic_armor_shred': {
        // ArmorShredEvent has shredApplied directly on event, not in metadata
        const shredEvent = event as typeof event & { shredApplied?: number; totalShred?: number };
        const shred = shredEvent.shredApplied ?? (event.metadata as { shredApplied?: number } | undefined)?.shredApplied ?? 0;
        return `🛡️ Броня ${targetName} пробита (-${shred} брони)`;
      }
      case 'mechanic_charge': {
        const metadata = event.metadata as { distanceMoved?: number; momentumBonus?: number } | undefined;
        const bonus = metadata?.momentumBonus ? Math.round(metadata.momentumBonus * 100) : 0;
        return `🐎 ${actorName} совершает рывок (+${bonus}% урона)`;
      }
      case 'mechanic_resolve': {
        // ResolveEvent uses resolveDamage, previousResolve, newResolve, source
        const metadata = event.metadata as { 
          resolveDamage?: number; 
          previousResolve?: number; 
          newResolve?: number; 
          source?: string;
          // Legacy format support
          amount?: number; 
          changeType?: string; 
        } | undefined;
        
        // Try new format first, then legacy
        const resolveDamage = metadata?.resolveDamage ?? metadata?.amount ?? 0;
        const source = metadata?.source;
        const changeType = metadata?.changeType;
        
        if (resolveDamage > 0 || changeType === 'damage') {
          const sourceText = source === 'rear' ? ' (атака в тыл)' : source === 'flank' ? ' (фланговая атака)' : '';
          return `💪 ${targetName} теряет ${resolveDamage} морали${sourceText}`;
        } else if (changeType === 'regen') {
          return `💪 ${targetName} восстанавливает ${metadata?.amount ?? 0} морали`;
        }
        return `💪 Мораль ${targetName} изменилась`;
      }
      case 'mechanic_facing': {
        const metadata = event.metadata as { newFacing?: string } | undefined;
        const facingNames: Record<string, string> = { N: 'на север', S: 'на юг', E: 'на восток', W: 'на запад' };
        const facing = metadata?.newFacing ?? '';
        return `🧭 ${actorName || targetName} поворачивается ${facingNames[facing] || facing}`;
      }
      case 'mechanic_phalanx': {
        const metadata = event.metadata as { armorBonus?: number; resolveBonus?: number; adjacentAllies?: number } | undefined;
        const armorBonus = metadata?.armorBonus ?? 0;
        const resolveBonus = metadata?.resolveBonus ?? 0;
        const allies = metadata?.adjacentAllies ?? 0;
        if (armorBonus > 0 || resolveBonus > 0) {
          return `🛡️ ${actorName} в фаланге: +${armorBonus} брони, +${resolveBonus} решимости (${allies} союзн.)`;
        }
        return `🛡️ ${actorName} в строю фаланги`;
      }
      case 'mechanic_overwatch':
        return `👁️ ${actorName} на страже`;
      case 'mechanic_contagion':
        return `☠️ ${targetName} заражён`;
      case 'mechanic_ammunition': {
        const metadata = event.metadata as { action?: string; ammoConsumed?: number; ammoRemaining?: number; cooldownDuration?: number; abilityId?: string } | undefined;
        const action = metadata?.action;
        if (action === 'consumed') {
          return `🏹 ${actorName} использует боеприпас (осталось: ${metadata?.ammoRemaining ?? 0})`;
        }
        if (action === 'depleted') {
          return `🏹 ${actorName} израсходовал все боеприпасы!`;
        }
        if (action === 'cooldown_triggered') {
          return `⏳ ${actorName}: способность на перезарядке (${metadata?.cooldownDuration ?? 0} ходов)`;
        }
        return `🏹 ${actorName} использует боеприпасы`;
      }
      default:
        return EVENT_TYPE_NAMES[event.type] || event.type;
    }
  };

  // Group events by rounds
  const eventsByRound = events.slice(0, currentEventIndex + 1).reduce((acc, event, index) => {
    const round = event.round || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push({ event, index });
    return acc;
  }, {} as Record<number, Array<{ event: BattleEvent; index: number }>>);

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
      <h3 className="text-lg font-medium mb-3">Журнал событий</h3>

      <div className="space-y-3">
        {Object.entries(eventsByRound).map(([round, roundEvents]) => (
          <div key={round}>
            {/* Round separator */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-gray-600 flex-1" />
              <span className="text-xs text-gray-400 bg-gray-800 px-2">
                Раунд {round}
              </span>
              <div className="h-px bg-gray-600 flex-1" />
            </div>

            {/* Round events */}
            <div className="space-y-1 ml-2">
              {roundEvents.map(({ event, index }) => {
                const primaryUnitId = getPrimaryUnitIdForEvent(event);
                const team = getTeamFromUnitId(primaryUnitId);
                const showTeamDot = team !== null; // Only show dot for events with a unit

                return (
                  <div
                    key={index}
                    ref={index === currentEventIndex ? currentEventRef : null}
                    className={`
                      text-sm p-2 rounded border-l-4 transition-all duration-200 cursor-pointer
                      ${index === currentEventIndex
                        ? 'bg-blue-900/30 border-blue-400 ring-1 ring-blue-400/50'
                        : `bg-gray-700/20 ${getEventBorderColor(event.type)} hover:bg-gray-600/30`
                      }
                    `}
                    onClick={() => {
                      // Highlight target unit (or actor if no target)
                      const unitToHighlight = event.targetId || event.actorId;
                      if (unitToHighlight && onHighlightUnit) {
                        onHighlightUnit(unitToHighlight);
                      }
                    }}
                    title="Клик для выделения юнита на поле"
                  >
                    <div className="flex items-center gap-2">
                      {/* Team color indicator dot */}
                      {showTeamDot && (
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${getTeamDotColor(team)}`}
                          title={team === 'player1' ? 'Команда 1' : 'Команда 2'}
                        />
                      )}

                      <div className={`font-medium ${getEventColor(event.type)} flex-1`}>
                        {formatEventDescription(event)}
                      </div>
                    </div>

                    {/* Additional event details */}
                    <div className="mt-1 space-y-1 ml-4">
                      {/* Dodge indicator for attack events */}
                      {event.type === 'attack' && event.dodged && (
                        <div className="text-cyan-300 text-xs font-medium">
                          💨 Атака уклонена!
                        </div>
                      )}

                      {event.damage && (
                        <div className="text-red-300 text-xs">
                          💥 -{event.damage} HP
                        </div>
                      )}

                      {event.healing && (
                        <div className="text-green-300 text-xs">
                          💚 +{event.healing} HP
                        </div>
                      )}

                      {/* Ability-specific details */}
                      {event.type === 'ability' && event.abilityId && (
                        <div className="text-yellow-200 text-xs space-y-0.5">
                          {(() => {
                            const ability = getAbilityById(event.abilityId);
                            if (!ability) return null;
                            return (
                              <>
                                <div className="text-gray-400 italic">
                                  {ability.description}
                                </div>
                                {event.totalDamage && event.totalDamage > 0 && (
                                  <div className="text-red-300">
                                    💥 Урон: {event.totalDamage}
                                  </div>
                                )}
                                {event.totalHealing && event.totalHealing > 0 && (
                                  <div className="text-green-300">
                                    💚 Лечение: {event.totalHealing}
                                  </div>
                                )}
                                {event.targetIds && event.targetIds.length > 1 && (
                                  <div className="text-blue-300">
                                    🎯 Цели: {event.targetIds.map(id => getUnitDisplayName(id, units)).join(', ')}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {event.fromPosition && event.toPosition && (
                        <div className="text-blue-300 text-xs">
                          🚶 ({event.fromPosition.x},{event.fromPosition.y}) → ({event.toPosition.x},{event.toPosition.y})
                        </div>
                      )}

                      {event.killedUnits && event.killedUnits.length > 0 && (
                        <div className="text-purple-300 text-xs">
                          💀 Погибли: {event.killedUnits.map(id => getUnitDisplayName(id, units)).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * BattleReplay component for displaying battle replays with full visualization.
 * Features 8×10 grid, step-by-step event playback, animations, and controls.
 * 
 * @param props - Component props
 * @returns Battle replay component
 * @example
 * <BattleReplay battle={battleLog} />
 */
export function BattleReplay({ battle, playerId, onBack, hideResultScreen = false }: BattleReplayProps) {
  // Safety check for required battle data - moved to top to avoid conditional hooks
  const isValidBattle = battle && battle.id;

  // Get debug mode from UI store
  const showDebugInfo = useUIStore((state) => state.showDebugInfo);

  // Determine current player ID - use provided playerId or fallback to player1Id
  const currentPlayerId = playerId || battle.player1Id;

  // Initialize units from battle log
  const initialUnits = useMemo(() => {
    if (!isValidBattle) return [];
    try {
      return extractInitialUnits(battle);
    } catch (error) {
      // Error will be visible in battle validation below
      return [];
    }
  }, [battle, isValidBattle]);

  // Replay state
  const [replayState, setReplayState] = useState<ReplayState>({
    currentEventIndex: -1,
    isPlaying: false,
    speed: 1,
    currentRound: 1,
  });

  // Key moments only mode state
  const [keyMomentsOnly, setKeyMomentsOnly] = useState(false);

  // Battle result display state
  const [showBattleResult, setShowBattleResult] = useState(false);

  // Current unit states
  const [units, setUnits] = useState<ReplayUnit[]>(initialUnits);

  // Unit popup state
  const [selectedGridUnit, setSelectedGridUnit] = useState<{
    unit: ReplayUnit;
    position: { x: number; y: number };
  } | null>(null);

  // Highlighted unit from event log click
  const [highlightedUnitId, setHighlightedUnitId] = useState<string | null>(null);

  // Active animations state
  const [activeAnimations, setActiveAnimations] = useState<{
    moves: Array<{ id: string; fromPosition: Position; toPosition: Position }>;
    attacks: Array<{ id: string; attackerPosition: Position; targetPosition: Position }>;
    damages: Array<{ id: string; damage: number; position: Position }>;
    deaths: Array<{ id: string; position: Position }>;
    heals: Array<{ id: string; healing: number; position: Position }>;
    abilities: Array<{
      id: string;
      abilityType: 'fireball' | 'heal' | 'stun' | 'buff' | 'debuff' | 'shield' | 'lightning' | 'explosion';
      fromPosition?: Position;
      toPosition: Position;
      radius?: number;
      value?: number;
    }>;
  }>({
    moves: [],
    attacks: [],
    damages: [],
    deaths: [],
    heals: [],
    abilities: [],
  });

  // Battle events - memoized to prevent dependency issues
  const events = useMemo(() => battle?.events || [], [battle?.events]);

  /**
   * Trigger animation for a specific battle event.
   * 
   * @param event - Battle event to animate
   * @param currentUnits - Current unit states
   */
  const triggerEventAnimation = useCallback((event: BattleEvent, currentUnits: ReplayUnit[]) => {
    const animationId = `${event.type}-${Date.now()}-${Math.random()}`;

    switch (event.type) {
      case 'move':
        if (event.fromPosition && event.toPosition) {
          setActiveAnimations(prev => ({
            ...prev,
            moves: [...prev.moves, {
              id: animationId,
              fromPosition: event.fromPosition as Position,
              toPosition: event.toPosition as Position,
            }],
          }));
        }
        break;

      case 'attack':
        if (event.actorId && event.targetId) {
          const attacker = currentUnits.find(u => u.instanceId === event.actorId);
          const target = currentUnits.find(u => u.instanceId === event.targetId);

          // Only show attack animation if attacker is alive
          // (prevents showing attacks from units killed in previous events)
          if (attacker && attacker.alive && target) {
            setActiveAnimations(prev => ({
              ...prev,
              attacks: [...prev.attacks, {
                id: animationId,
                attackerPosition: attacker.position,
                targetPosition: target.position,
              }],
            }));
          }
        }
        break;

      case 'damage':
        if (event.targetId && typeof event.damage === 'number') {
          const target = currentUnits.find(u => u.instanceId === event.targetId);

          if (target) {
            setActiveAnimations(prev => ({
              ...prev,
              damages: [...prev.damages, {
                id: animationId,
                damage: event.damage as number,
                position: target.position,
              }],
            }));
          }
        }
        break;

      case 'death':
        if (event.targetId || event.killedUnits) {
          const killedIds = event.killedUnits || (event.targetId ? [event.targetId] : []);

          killedIds.forEach((killedId, index) => {
            const killedUnit = currentUnits.find(u => u.instanceId === killedId);

            if (killedUnit) {
              setActiveAnimations(prev => ({
                ...prev,
                deaths: [...prev.deaths, {
                  id: `${animationId}-${index}`,
                  position: killedUnit.position,
                }],
              }));
            }
          });
        }
        break;

      case 'heal':
        if (event.targetId && typeof event.healing === 'number') {
          const target = currentUnits.find(u => u.instanceId === event.targetId);

          if (target) {
            setActiveAnimations(prev => ({
              ...prev,
              heals: [...prev.heals, {
                id: animationId,
                healing: event.healing as number,
                position: target.position,
              }],
            }));
          }
        }
        break;

      case 'ability':
        if (event.actorId && event.targetId) {
          const caster = currentUnits.find(u => u.instanceId === event.actorId);
          const target = currentUnits.find(u => u.instanceId === event.targetId);

          // Only show ability animation if caster is alive
          // (prevents showing abilities from units killed in previous events)
          if (caster && caster.alive && target) {
            // Determine ability type based on event metadata or ability name
            let abilityType: 'fireball' | 'heal' | 'stun' | 'buff' | 'debuff' | 'shield' | 'lightning' | 'explosion' = 'fireball';

            // Map ability names to animation types
            if (event.abilityId) {
              switch (event.abilityId) {
                case 'fireball':
                  abilityType = 'fireball';
                  break;
                case 'chain_lightning':
                  abilityType = 'lightning';
                  break;
                case 'heal':
                  abilityType = 'heal';
                  break;
                case 'stun':
                  abilityType = 'stun';
                  break;
                case 'shield_wall':
                case 'taunt':
                  abilityType = 'shield';
                  break;
                case 'inspire':
                case 'rage':
                  abilityType = 'buff';
                  break;
                case 'piercing_shot':
                case 'execute':
                  abilityType = 'debuff';
                  break;
                default:
                  abilityType = 'explosion';
              }
            }

            setActiveAnimations(prev => ({
              ...prev,
              abilities: [...prev.abilities, {
                id: animationId,
                abilityType,
                fromPosition: caster.position,
                toPosition: target.position,
                radius: event.areaSize || 1,
                value: event.damage || event.healing || 0,
              }],
            }));
          }
        }
        break;

      case 'buff':
        if (event.targetId) {
          const target = currentUnits.find(u => u.instanceId === event.targetId);

          if (target) {
            setActiveAnimations(prev => ({
              ...prev,
              abilities: [...prev.abilities, {
                id: animationId,
                abilityType: 'buff',
                toPosition: target.position,
                radius: 1,
              }],
            }));
          }
        }
        break;

      case 'debuff':
        if (event.targetId) {
          const target = currentUnits.find(u => u.instanceId === event.targetId);

          if (target) {
            setActiveAnimations(prev => ({
              ...prev,
              abilities: [...prev.abilities, {
                id: animationId,
                abilityType: 'debuff',
                toPosition: target.position,
                radius: 1,
              }],
            }));
          }
        }
        break;
    }
  }, []);

  /**
   * Apply events up to specified index and trigger animations for current event.
   * Returns the current round number for the caller to update state.
   */
  const applyEventsUpTo = useCallback((eventIndex: number): number => {
    let currentUnits = [...initialUnits];
    let currentRound = 1;

    // Clear previous animations
    setActiveAnimations({
      moves: [],
      attacks: [],
      damages: [],
      deaths: [],
      heals: [],
      abilities: [],
    });

    for (let i = 0; i <= eventIndex && i < events.length; i++) {
      const event = events[i];
      if (!event) continue;

      currentUnits = applyEventToUnits(currentUnits, event);

      if (event.type === 'round_start') {
        currentRound = event.round;
      }

      // Trigger animations for the current event (last one being processed)
      if (i === eventIndex) {
        triggerEventAnimation(event, currentUnits);
      }
    }

    setUnits(currentUnits);
    return currentRound;
  }, [initialUnits, events, triggerEventAnimation]);

  /**
   * Handle animation completion by removing it from active animations.
   * 
   * @param animationType - Type of animation that completed
   * @param animationId - ID of the completed animation
   */
  const handleAnimationComplete = useCallback((
    animationType: 'moves' | 'attacks' | 'damages' | 'deaths' | 'heals' | 'abilities',
    animationId: string
  ) => {
    setActiveAnimations(prev => ({
      ...prev,
      [animationType]: prev[animationType].filter(anim => anim.id !== animationId),
    }));
  }, []);

  /**
   * Step to next event.
   */
  const stepForward = useCallback(() => {
    const nextIndex = replayState.currentEventIndex + 1;
    if (nextIndex < events.length) {
      const currentRound = applyEventsUpTo(nextIndex);
      setReplayState(prev => ({ ...prev, currentEventIndex: nextIndex, currentRound }));
    } else if (nextIndex === events.length) {
      // Reached the end, stop playing
      setReplayState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [replayState.currentEventIndex, events.length, applyEventsUpTo]);

  /**
   * Play/pause controls.
   */
  const handlePlay = useCallback(() => {
    setReplayState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setReplayState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleStep = useCallback(() => {
    stepForward();
  }, [stepForward]);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setReplayState(prev => ({ ...prev, speed }));
  }, []);

  const handleSeek = useCallback((eventIndex: number) => {
    const currentRound = applyEventsUpTo(eventIndex);
    setReplayState(prev => ({ ...prev, currentEventIndex: eventIndex, currentRound, isPlaying: false }));
  }, [applyEventsUpTo]);

  const handleSkipToEnd = useCallback(() => {
    const lastIndex = events.length - 1;
    const currentRound = applyEventsUpTo(lastIndex);
    setReplayState(prev => ({ ...prev, currentEventIndex: lastIndex, currentRound, isPlaying: false }));
    // Show battle result immediately when skipping to end
    setTimeout(() => {
      // For roguelike mode, call onBack instead of showing built-in result screen
      if (hideResultScreen && onBack) {
        onBack();
      } else {
        setShowBattleResult(true);
      }
    }, 500);
  }, [events.length, applyEventsUpTo, hideResultScreen, onBack]);

  /**
   * Handle battle result actions.
   */
  const handleWatchReplay = useCallback(() => {
    setShowBattleResult(false);
    const currentRound = applyEventsUpTo(-1);
    setReplayState(prev => ({ ...prev, currentEventIndex: -1, currentRound, isPlaying: false }));
  }, [applyEventsUpTo]);

  const handleNewBattle = useCallback(() => {
    setShowBattleResult(false);
    // Use provided callback or fallback to history.back()
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);

  const handleEditTeam = useCallback(() => {
    setShowBattleResult(false);
    // Use provided callback or fallback to history.back()
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);

  /**
   * Step to previous event.
   */
  const handleStepBack = useCallback(() => {
    const prevIndex = replayState.currentEventIndex - 1;
    if (prevIndex >= -1) {
      const currentRound = applyEventsUpTo(prevIndex);
      setReplayState(prev => ({ ...prev, currentEventIndex: prevIndex, currentRound, isPlaying: false }));
    }
  }, [replayState.currentEventIndex, applyEventsUpTo]);

  /**
   * Skip to beginning of battle.
   */
  const handleSkipToStart = useCallback(() => {
    const currentRound = applyEventsUpTo(-1);
    setReplayState(prev => ({ ...prev, currentEventIndex: -1, currentRound, isPlaying: false }));
  }, [applyEventsUpTo]);

  /**
   * Toggle key moments only mode.
   * When enabled, only shows death and ability events.
   */
  const handleToggleKeyMoments = useCallback(() => {
    setKeyMomentsOnly(prev => !prev);
    // Pause playback when toggling
    setReplayState(prev => ({ ...prev, isPlaying: false }));
  }, []);



  // Auto-play effect
  useEffect(() => {
    if (!replayState.isPlaying) return;

    const interval = setInterval(() => {
      // Check if we've reached the end of events (allow processing of the last event)
      if (replayState.currentEventIndex >= events.length - 1) {
        setReplayState(prev => ({ ...prev, isPlaying: false }));
        // Show battle result after a short delay
        setTimeout(() => {
          // For roguelike mode, call onBack instead of showing built-in result screen
          if (hideResultScreen && onBack) {
            onBack();
          } else {
            setShowBattleResult(true);
          }
        }, 1500);
        return;
      }

      stepForward();
    }, BASE_ANIMATION_DURATION / replayState.speed);

    return () => clearInterval(interval);
  }, [replayState.isPlaying, replayState.speed, replayState.currentEventIndex, events.length, stepForward, hideResultScreen, onBack]);

  // Keyboard shortcuts effect
  useEffect(() => {
    /**
     * Handle keyboard shortcuts for battle replay navigation.
     * 
     * @param event - Keyboard event
     */
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ': // Spacebar - Play/Pause
          event.preventDefault();
          if (replayState.isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'ArrowLeft': // Left arrow - Step back
          event.preventDefault();
          handleStepBack();
          break;
        case 'ArrowRight': // Right arrow - Step forward
          event.preventDefault();
          handleStep();
          break;
        case 'Home': // Home - Skip to start
          event.preventDefault();
          handleSkipToStart();
          break;
        case 'End': // End - Skip to end
          event.preventDefault();
          handleSkipToEnd();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          // Speed shortcuts
          event.preventDefault();
          const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4];
          const speedIndex = parseInt(event.key) - 1;
          if (speedIndex >= 0 && speedIndex < speeds.length) {
            const selectedSpeed = speeds[speedIndex];
            if (selectedSpeed) {
              handleSpeedChange(selectedSpeed);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [replayState.isPlaying, handlePlay, handlePause, handleStep, handleStepBack, handleSkipToStart, handleSkipToEnd, handleSpeedChange]);

  /**
   * Handle unit click on grid to show popup with stats.
   * Uses smart positioning to keep tooltip within viewport.
   */
  const handleGridUnitClick = useCallback((unit: ReplayUnit, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate tooltip width
    const tooltipHeight = 280; // Approximate tooltip height
    const padding = 10;

    // Calculate initial position (centered above the unit)
    let x = rect.left + rect.width / 2;
    let y = rect.top - padding;

    // Adjust horizontal position to stay within viewport
    const minX = tooltipWidth / 2 + padding;
    const maxX = window.innerWidth - tooltipWidth / 2 - padding;
    x = Math.max(minX, Math.min(maxX, x));

    // If tooltip would go above viewport, show it below the unit instead
    if (y - tooltipHeight < padding) {
      y = rect.bottom + padding + tooltipHeight;
    }

    setSelectedGridUnit({
      unit,
      position: { x, y },
    });
  }, []);

  /**
   * Close unit popup.
   */
  const handleCloseUnitPopup = useCallback(() => {
    setSelectedGridUnit(null);
  }, []);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = () => handleCloseUnitPopup();
    if (selectedGridUnit) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [selectedGridUnit, handleCloseUnitPopup]);

  // Create grid with units and movement indicators
  const grid = useMemo(() => {
    const cells: JSX.Element[] = [];

    // Get current event for movement indicators and path
    const currentEvent = events[replayState.currentEventIndex];
    const activeUnitId = currentEvent?.actorId;
    let movementPath: Position[] = [];

    // Build movement path if current event is movement
    if (currentEvent?.type === 'move' && currentEvent.fromPosition && currentEvent.toPosition) {
      // Simple path - just from and to positions for now
      // In a more advanced implementation, this could show the actual pathfinding route
      movementPath = [currentEvent.fromPosition, currentEvent.toPosition];
    }

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const position = { x, y };
        // Only find alive units at this position (dead units should not be displayed)
        const unit = units.find(u => u.position.x === x && u.position.y === y && u.alive);

        // Check if this position is involved in current movement
        let isMovementSource = false;
        let isMovementTarget = false;

        if (currentEvent?.type === 'move') {
          isMovementSource = currentEvent.fromPosition?.x === x && currentEvent.fromPosition?.y === y;
          isMovementTarget = currentEvent.toPosition?.x === x && currentEvent.toPosition?.y === y;
        }

        // Check if this unit is the active unit (currently taking action)
        const isActiveUnit = unit?.instanceId === activeUnitId;
        
        // Check if this unit is highlighted from event log click
        const isHighlighted = unit?.instanceId === highlightedUnitId;

        cells.push(
          <ReplayGridCell
            key={`${x}-${y}`}
            position={position}
            unit={unit}
            onUnitClick={handleGridUnitClick}
            isMovementSource={isMovementSource}
            isMovementTarget={isMovementTarget}
            movementPath={movementPath}
            showDebugInfo={showDebugInfo}
            isActiveUnit={isActiveUnit}
            isHighlighted={isHighlighted}
          />
        );
      }
    }

    return cells;
  }, [units, events, replayState.currentEventIndex, handleGridUnitClick, showDebugInfo, highlightedUnitId]);

  // Early return after all hooks are defined
  if (!isValidBattle) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-4">❌ Invalid Battle Data</h1>
          <p className="text-gray-300 mb-4">The battle data is missing or corrupted.</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white">
      {/* Compact header in Figma style */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-6 py-4 bg-gray-800/50 rounded-lg">
          <div className="flex flex-col items-end">
            <span className="text-blue-400 font-bold text-lg">{getPlayerName(battle, 'player1')}</span>
            <span className="text-gray-500 text-sm">Уровень 15</span>
          </div>

          <div className="px-6 py-2 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
            <span className="text-yellow-400 font-bold">
              {battle.winner === 'player1' ? '👑 Победа' : battle.winner === 'player2' ? '👑 Победа' : '🤝 Ничья'}
            </span>
          </div>

          <div className="flex flex-col items-start">
            <span className="text-red-400 font-bold text-lg">{getPlayerName(battle, 'player2')}</span>
            <span className="text-gray-500 text-sm">Уровень 15</span>
          </div>
        </div>
      </div>



      {/* Turn order bar */}
      <TurnOrderBar
        units={units}
        currentRound={replayState.currentRound}
        currentEventIndex={replayState.currentEventIndex}
        events={events}
        battle={battle}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battle grid */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-center">
              <div
                className="relative grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
                  width: `${GRID_WIDTH * 3.25}rem`
                }}
              >
                {grid}

                {/* Animation Overlay - positioned inside grid container */}
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{ zIndex: 10 }}
                >
                  {/* Move Animations */}
                  {activeAnimations.moves.map(moveAnim => (
                    <MoveAnimation
                      key={moveAnim.id}
                      fromPosition={moveAnim.fromPosition}
                      toPosition={moveAnim.toPosition}
                      onComplete={() => handleAnimationComplete('moves', moveAnim.id)}
                    />
                  ))}

                  {/* Attack Animations */}
                  {activeAnimations.attacks.map(attackAnim => (
                    <AttackAnimation
                      key={attackAnim.id}
                      attackerPosition={attackAnim.attackerPosition}
                      targetPosition={attackAnim.targetPosition}
                      onComplete={() => handleAnimationComplete('attacks', attackAnim.id)}
                    />
                  ))}

                  {/* Damage Numbers */}
                  {activeAnimations.damages.map(damageAnim => (
                    <DamageNumber
                      key={damageAnim.id}
                      damage={damageAnim.damage}
                      position={damageAnim.position}
                      onComplete={() => handleAnimationComplete('damages', damageAnim.id)}
                    />
                  ))}

                  {/* Death Animations */}
                  {activeAnimations.deaths.map(deathAnim => (
                    <DeathAnimation
                      key={deathAnim.id}
                      position={deathAnim.position}
                      onComplete={() => handleAnimationComplete('deaths', deathAnim.id)}
                    />
                  ))}

                  {/* Heal Animations */}
                  {activeAnimations.heals.map(healAnim => (
                    <HealAnimation
                      key={healAnim.id}
                      healing={healAnim.healing}
                      position={healAnim.position}
                      onComplete={() => handleAnimationComplete('heals', healAnim.id)}
                    />
                  ))}

                  {/* Ability Animations */}
                  {activeAnimations.abilities.map(abilityAnim => (
                    <AbilityAnimation
                      key={abilityAnim.id}
                      abilityType={abilityAnim.abilityType}
                      config={{
                        fromPosition: abilityAnim.fromPosition,
                        toPosition: abilityAnim.toPosition,
                        radius: abilityAnim.radius,
                        value: abilityAnim.value,
                      }}
                      onComplete={() => handleAnimationComplete('abilities', abilityAnim.id)}
                      duration={1200}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4">
            <ReplayControls
              replayState={replayState}
              totalEvents={events.length}
              onPlay={handlePlay}
              onPause={handlePause}
              onStep={handleStep}
              onStepBack={handleStepBack}
              onSpeedChange={handleSpeedChange}
              onSeek={handleSeek}
              onSkipToStart={handleSkipToStart}
              onSkipToEnd={handleSkipToEnd}
              events={events}
              units={units}
              keyMomentsOnly={keyMomentsOnly}
              onToggleKeyMoments={handleToggleKeyMoments}
            />
          </div>
        </div>

        {/* Event log */}
        <div>
          <EventLog
            events={events}
            currentEventIndex={replayState.currentEventIndex}
            units={units}
            onHighlightUnit={(unitId) => {
              setHighlightedUnitId(prev => prev === unitId ? null : unitId);
            }}
          />
        </div>
      </div>

      {/* Unit Stats Popup */}
      {selectedGridUnit && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-xl"
          style={{
            left: selectedGridUnit.position.x,
            top: selectedGridUnit.position.y,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm">
            <div className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">{UNIT_INFO[selectedGridUnit.unit.template.id]?.emoji}</span>
              <div>
                <div>{selectedGridUnit.unit.template.name}</div>
                <div className="text-xs text-gray-400">
                  {selectedGridUnit.unit.team === 'player1' ? getPlayerName(battle, 'player1') : getPlayerName(battle, 'player2')}
                </div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">HP</span>
                <span className={`font-medium ${selectedGridUnit.unit.currentHp > selectedGridUnit.unit.maxHp * 0.6
                  ? 'text-green-400'
                  : selectedGridUnit.unit.currentHp > selectedGridUnit.unit.maxHp * 0.3
                    ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                  {selectedGridUnit.unit.currentHp}/{selectedGridUnit.unit.maxHp}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getHpBarColor((selectedGridUnit.unit.currentHp / selectedGridUnit.unit.maxHp) * 100)}`}
                  style={{ width: `${(selectedGridUnit.unit.currentHp / selectedGridUnit.unit.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Resolve Bar (Core 2.0) */}
            {selectedGridUnit.unit.resolve !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Мораль</span>
                  <span className={`font-medium ${selectedGridUnit.unit.resolve > 60
                    ? 'text-indigo-400'
                    : selectedGridUnit.unit.resolve > 30
                      ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                    {selectedGridUnit.unit.resolve}/{selectedGridUnit.unit.maxResolve ?? 100}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${selectedGridUnit.unit.resolve > 60
                      ? 'bg-indigo-500'
                      : selectedGridUnit.unit.resolve > 30
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                      }`}
                    style={{ width: `${(selectedGridUnit.unit.resolve / (selectedGridUnit.unit.maxResolve ?? 100)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <span className="text-gray-400">ATK:</span>
                <span className="text-orange-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.atk}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Armor:</span>
                {/* Show effective armor accounting for shred */}
                {(() => {
                  const baseArmor = selectedGridUnit.unit.template.stats.armor;
                  const shred = selectedGridUnit.unit.armorShred ?? 0;
                  const effectiveArmor = Math.max(0, baseArmor - shred);
                  const hasShred = shred > 0;
                  return (
                    <span className={`font-medium ml-1 ${hasShred ? 'text-amber-400' : 'text-blue-400'}`}>
                      {effectiveArmor}
                      {hasShred && (
                        <span className="text-gray-500 text-[10px] ml-1">
                          ({baseArmor}-{shred})
                        </span>
                      )}
                    </span>
                  );
                })()}
              </div>
              <div>
                <span className="text-gray-400">Speed:</span>
                <span className="text-green-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.speed}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Initiative:</span>
                <span className="text-yellow-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.initiative}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Dodge:</span>
                <span className="text-purple-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.stats.dodge}%
                </span>
              </div>
              <div>
                <span className="text-gray-400">Range:</span>
                <span className="text-cyan-400 font-medium ml-1">
                  {selectedGridUnit.unit.template.range}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-1">
                Position: <span className="text-white">({selectedGridUnit.unit.position.x}, {selectedGridUnit.unit.position.y})</span>
              </div>
              {selectedGridUnit.unit.facing && (
                <div className="text-xs text-gray-400 mb-1">
                  Facing: <span className="text-white">{selectedGridUnit.unit.facing}</span>
                </div>
              )}
              <div className="text-xs text-gray-400">
                Status: <span className={selectedGridUnit.unit.alive ? 'text-green-400' : 'text-red-400'}>
                  {selectedGridUnit.unit.alive ? 'Alive' : 'Dead'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCloseUnitPopup}
              className="mt-3 w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Battle Result Screen */}
      <BattleResult
        battle={battle}
        playerId={currentPlayerId}
        ratingChange={{
          oldRating: 1200,
          newRating: battle.winner === 'player1' ? 1215 : 1185,
          change: battle.winner === 'player1' ? 15 : -15,
        }}
        onWatchReplay={handleWatchReplay}
        onNewBattle={handleNewBattle}
        onEditTeam={handleEditTeam}
        show={showBattleResult}
      />
    </div>
  );
}


export default BattleReplay;