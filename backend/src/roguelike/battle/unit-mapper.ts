/**
 * Unit Mapper for Roguelike Battle Integration
 *
 * Converts roguelike units (RoguelikeUnit, FieldUnit) to battle-compatible
 * UnitTemplate format with tier-based stat modifiers applied.
 *
 * @module roguelike/battle/unit-mapper
 */

import { UnitTemplate, UnitStats, Position } from '../../types/game.types';
import { TeamSetup } from '../../battle/battle.simulator';
import { RoguelikeUnit, UnitTier, TIER_STAT_MULTIPLIERS, UnitRole } from '../types/unit.types';
import { FieldUnit } from '../entities/run.entity';
import { getRoguelikeUnit } from '../data/units.helpers';

/**
 * Legacy role mapping from roguelike roles to MVP roles.
 * MVP uses: 'tank' | 'melee' | 'ranged' | 'mage' | 'support'
 * Roguelike uses: 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support'
 */
const ROLE_MAPPING: Record<UnitRole, string> = {
  tank: 'tank',
  melee_dps: 'melee',
  ranged_dps: 'ranged',
  mage: 'mage',
  support: 'support',
};

/**
 * Maps a roguelike unit role to legacy MVP role format.
 *
 * @param role - Roguelike unit role
 * @returns Legacy role string
 * @example
 * mapRoleToLegacy('melee_dps'); // 'melee'
 */
export function mapRoleToLegacy(role: UnitRole): string {
  return ROLE_MAPPING[role] || role;
}

/**
 * Maps a roguelike unit to UnitTemplate format.
 * Applies tier-based stat multipliers (T1: ×1.0, T2: ×1.5, T3: ×2.0).
 *
 * @param unit - Roguelike unit definition
 * @param tier - Unit tier (1, 2, or 3)
 * @returns Battle-compatible UnitTemplate
 * @example
 * const template = mapRoguelikeUnitToTemplate(footman, 2);
 * // Returns UnitTemplate with T2 stats (×1.5 multiplier)
 */
export function mapRoguelikeUnitToTemplate(
  unit: RoguelikeUnit,
  tier: UnitTier,
): UnitTemplate {
  const multiplier = TIER_STAT_MULTIPLIERS[tier];

  // Build stats with tier multiplier applied
  const stats: UnitStats = {
    hp: Math.round(unit.hp * multiplier),
    atk: Math.round(unit.atk * multiplier),
    armor: Math.round(unit.armor * multiplier),
    speed: unit.speed,
    initiative: unit.initiative,
    dodge: unit.dodge,
    atkCount: unit.attackCount,
  };

  // T3 units get their ability
  const abilities: string[] = [];
  if (tier === 3 && unit.abilityId) {
    abilities.push(unit.abilityId);
  }

  return {
    id: unit.id,
    name: unit.name,
    role: mapRoleToLegacy(unit.role) as UnitTemplate['role'],
    cost: unit.cost,
    range: unit.range,
    abilities,
    stats,
  };
}

/**
 * Maps a FieldUnit to UnitTemplate format.
 * Looks up the base unit data and applies tier modifiers.
 *
 * @param fieldUnit - Unit placed on the deployment field
 * @returns Battle-compatible UnitTemplate or null if unit not found
 * @example
 * const template = mapFieldUnitToTemplate(fieldUnit);
 */
export function mapFieldUnitToTemplate(fieldUnit: FieldUnit): UnitTemplate | null {
  const unitData = getRoguelikeUnit(fieldUnit.unitId);
  if (!unitData) {
    return null;
  }

  return mapRoguelikeUnitToTemplate(unitData, fieldUnit.tier);
}

/**
 * Converts an array of FieldUnits to TeamSetup format for battle simulation.
 * Handles position mapping based on team type:
 * - Player: positions stay at y: 0-1 (deployment grid = battle grid)
 * - Opponent: positions map from y: 0-1 to y: 8-9 (mirror to enemy side)
 *
 * @param fieldUnits - Array of units placed on the deployment field
 * @param team - Team type ('player' or 'opponent')
 * @returns TeamSetup for battle simulator
 * @example
 * // Player team - positions unchanged
 * const playerSetup = mapToTeamSetup(playerField, 'player');
 *
 * // Opponent team - positions mirrored to y: 8-9
 * const opponentSetup = mapToTeamSetup(opponentField, 'opponent');
 * // Unit at (3, 1) becomes (3, 9)
 */
export function mapToTeamSetup(
  fieldUnits: FieldUnit[],
  team: 'player' | 'opponent',
): TeamSetup {
  const units: UnitTemplate[] = [];
  const positions: Position[] = [];

  for (const fieldUnit of fieldUnits) {
    const template = mapFieldUnitToTemplate(fieldUnit);
    if (!template) {
      // Skip units that couldn't be mapped (shouldn't happen in practice)
      continue;
    }

    units.push(template);

    // Map position based on team
    if (team === 'player') {
      // Player positions stay at y: 0-1
      positions.push({
        x: fieldUnit.position.x,
        y: fieldUnit.position.y,
      });
    } else {
      // Opponent positions map to y: 8-9
      // Deployment y: 0 → Battle y: 9
      // Deployment y: 1 → Battle y: 8
      positions.push({
        x: fieldUnit.position.x,
        y: 9 - fieldUnit.position.y,
      });
    }
  }

  return { units, positions };
}

/**
 * Creates an empty TeamSetup.
 * Used for edge cases where a team has no units.
 *
 * @returns Empty TeamSetup
 */
export function createEmptyTeamSetup(): TeamSetup {
  return { units: [], positions: [] };
}
