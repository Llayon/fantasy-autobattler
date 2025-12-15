/**
 * Ability data definitions for Fantasy Autobattler frontend.
 * Mirrors backend ability data for UI display and targeting preview.
 * 
 * @fileoverview Frontend ability definitions with display information.
 */

import { AbilityPreviewData } from '@/components/AbilityTargetingPreview';
import { UnitId } from '@/types/game';

// =============================================================================
// ABILITY DATA
// =============================================================================

/**
 * Complete ability definitions for all units.
 * Maps ability ID to full ability data for preview and display.
 */
export const ABILITY_DATA: Record<string, AbilityPreviewData> = {
  // Tank abilities
  shield_wall: {
    id: 'shield_wall',
    name: 'Стена щитов',
    description: 'Увеличивает броню на 50% на 2 хода',
    type: 'active',
    targetType: 'self',
    cooldown: 3,
    range: 0,
    effects: [
      { type: 'buff', stat: 'armor', percentage: 0.5, duration: 2 },
    ],
    icon: 'shield',
  },
  taunt: {
    id: 'taunt',
    name: 'Провокация',
    description: 'Враги атакуют только этого юнита 2 хода',
    type: 'active',
    targetType: 'self',
    cooldown: 4,
    range: 0,
    effects: [
      { type: 'taunt', duration: 2 },
    ],
    icon: 'taunt',
  },
  rage: {
    id: 'rage',
    name: 'Ярость',
    description: '+50% к атаке при HP ниже 50%',
    type: 'passive',
    targetType: 'self',
    range: 0,
    effects: [
      { type: 'buff', stat: 'attack', percentage: 0.5, duration: 999 },
    ],
    icon: 'rage',
  },
  
  // Melee DPS abilities
  backstab: {
    id: 'backstab',
    name: 'Удар в спину',
    description: '+100% урона при атаке сзади',
    type: 'passive',
    targetType: 'enemy',
    range: 1,
    effects: [
      { type: 'damage', damageType: 'physical', attackScaling: 1.0 },
    ],
    icon: 'dagger',
  },
  riposte: {
    id: 'riposte',
    name: 'Рипост',
    description: '30% шанс контратаки при получении урона',
    type: 'passive',
    targetType: 'enemy',
    range: 1,
    effects: [
      { type: 'damage', damageType: 'physical', attackScaling: 0.75 },
    ],
    icon: 'sword',
  },
  execute: {
    id: 'execute',
    name: 'Казнь',
    description: '+100% урона по целям с HP ниже 30%',
    type: 'passive',
    targetType: 'lowest_hp_enemy',
    range: 1,
    effects: [
      { type: 'damage', damageType: 'physical', attackScaling: 1.0 },
    ],
    icon: 'skull',
  },
  
  // Ranged DPS abilities
  volley: {
    id: 'volley',
    name: 'Залп',
    description: 'Наносит урон всем врагам в радиусе 2 клеток',
    type: 'active',
    targetType: 'area',
    cooldown: 3,
    range: 4,
    areaSize: 2,
    effects: [
      { type: 'damage', value: 12, damageType: 'physical', attackScaling: 0.5 },
    ],
    icon: 'arrows',
  },
  piercing_shot: {
    id: 'piercing_shot',
    name: 'Пробивающий выстрел',
    description: 'Игнорирует 50% брони цели',
    type: 'active',
    targetType: 'enemy',
    cooldown: 2,
    range: 5,
    effects: [
      { type: 'damage', value: 25, damageType: 'physical', attackScaling: 0.8 },
      { type: 'debuff', stat: 'armor', percentage: 0.5, duration: 0 },
    ],
    icon: 'crossbow',
  },
  trap: {
    id: 'trap',
    name: 'Ловушка',
    description: 'Устанавливает ловушку, оглушающую врага на 1 ход',
    type: 'active',
    targetType: 'area',
    cooldown: 4,
    range: 3,
    areaSize: 1,
    effects: [
      { type: 'stun', duration: 1 },
      { type: 'damage', value: 10, damageType: 'physical' },
    ],
    icon: 'trap',
  },
  
  // Mage abilities
  fireball: {
    id: 'fireball',
    name: 'Огненный шар',
    description: 'Наносит 30 магического урона в радиусе 1 клетки',
    type: 'active',
    targetType: 'area',
    cooldown: 2,
    range: 3,
    areaSize: 1,
    effects: [
      { type: 'damage', value: 30, damageType: 'magical', attackScaling: 0.6 },
    ],
    icon: 'fireball',
  },
  drain_life: {
    id: 'drain_life',
    name: 'Похищение жизни',
    description: 'Наносит урон и лечит на 50% от нанесённого',
    type: 'active',
    targetType: 'enemy',
    cooldown: 3,
    range: 3,
    effects: [
      { type: 'damage', value: 20, damageType: 'magical', attackScaling: 0.5 },
      { type: 'heal', value: 10, attackScaling: 0.25 },
    ],
    icon: 'drain',
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Цепная молния',
    description: 'Поражает до 3 врагов, урон уменьшается на 25% за каждый прыжок',
    type: 'active',
    targetType: 'enemy',
    cooldown: 3,
    range: 4,
    effects: [
      { type: 'damage', value: 25, damageType: 'magical', attackScaling: 0.7 },
    ],
    icon: 'lightning',
  },
  
  // Support abilities
  heal: {
    id: 'heal',
    name: 'Исцеление',
    description: 'Восстанавливает 25 HP союзнику',
    type: 'active',
    targetType: 'lowest_hp_ally',
    cooldown: 2,
    range: 4,
    effects: [
      { type: 'heal', value: 25, attackScaling: 0.4 },
    ],
    icon: 'heal',
  },
  inspire: {
    id: 'inspire',
    name: 'Вдохновение',
    description: '+20% к атаке всем союзникам на 2 хода',
    type: 'active',
    targetType: 'ally',
    cooldown: 4,
    range: 3,
    areaSize: 2,
    effects: [
      { type: 'buff', stat: 'attack', percentage: 0.2, duration: 2 },
    ],
    icon: 'music',
  },
  
  // Control abilities
  stun: {
    id: 'stun',
    name: 'Оглушение',
    description: 'Оглушает врага на 1 ход',
    type: 'active',
    targetType: 'enemy',
    cooldown: 3,
    range: 3,
    effects: [
      { type: 'stun', duration: 1 },
    ],
    icon: 'stun',
  },
};

/**
 * Maps unit ID to their ability ID.
 */
export const UNIT_ABILITY_MAP: Record<UnitId, string> = {
  // Tanks
  knight: 'shield_wall',
  guardian: 'taunt',
  berserker: 'rage',
  // Melee DPS
  rogue: 'backstab',
  duelist: 'riposte',
  assassin: 'execute',
  // Ranged DPS
  archer: 'volley',
  crossbowman: 'piercing_shot',
  hunter: 'trap',
  // Mages
  mage: 'fireball',
  warlock: 'drain_life',
  elementalist: 'chain_lightning',
  // Support
  priest: 'heal',
  bard: 'inspire',
  // Control
  enchanter: 'stun',
};

/**
 * Get ability data for a unit.
 * 
 * @param unitId - Unit identifier
 * @returns Ability data or undefined
 * @example
 * const ability = getUnitAbility('mage'); // Returns fireball ability
 */
export function getUnitAbility(unitId: UnitId): AbilityPreviewData | undefined {
  const abilityId = UNIT_ABILITY_MAP[unitId];
  return abilityId ? ABILITY_DATA[abilityId] : undefined;
}

/**
 * Get ability by ID.
 * 
 * @param abilityId - Ability identifier
 * @returns Ability data or undefined
 * @example
 * const ability = getAbilityById('fireball');
 */
export function getAbilityById(abilityId: string): AbilityPreviewData | undefined {
  return ABILITY_DATA[abilityId];
}

/**
 * Icon mapping for abilities.
 */
export const ABILITY_ICONS: Record<string, string> = {
  shield: '🛡️',
  taunt: '🗣️',
  rage: '😡',
  dagger: '🗡️',
  sword: '⚔️',
  skull: '💀',
  arrows: '🏹',
  crossbow: '🎯',
  trap: '🕳️',
  fireball: '🔥',
  drain: '🌙',
  lightning: '⚡',
  heal: '💚',
  music: '🎵',
  stun: '✨',
  default: '❓',
};

/**
 * Get icon for ability.
 * 
 * @param iconId - Icon identifier
 * @returns Emoji icon
 */
export function getAbilityIcon(iconId: string): string {
  return ABILITY_ICONS[iconId] || ABILITY_ICONS['default'] || '❓';
}
