/**
 * Tier 1: Engagement (Zone of Control) Processor
 *
 * Implements the engagement/Zone of Control system which controls
 * how units interact when in close proximity.
 *
 * Key mechanics:
 * - Zone of Control (ZoC): Adjacent cells around a melee unit
 * - Engagement: When an enemy enters a unit's ZoC
 * - Attack of Opportunity: Free attack when enemy leaves ZoC
 * - Archer Penalty: Ranged units suffer accuracy penalty when engaged
 *
 * @module core/mechanics/tier1/engagement
 */

import type { EngagementConfig } from '../../config/mechanics.types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { BattleState, BattleUnit, Position } from '../../../types';
import { getNeighbors, manhattanDistance } from '../../../grid/grid';
import { updateUnit, updateUnits, findUnit } from '../../helpers';
import { SeededRandom } from '../../../utils/random';
import type {
  EngagementProcessor,
  EngagementStatus,
  ZoneOfControl,
  ZoCCheckResult,
  AoOTrigger,
  AoOResult,
  UnitWithEngagement,
} from './engagement.types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit has Zone of Control capability.
 * Only melee units (range <= 1) project ZoC by default.
 *
 * @param unit - Unit to check
 * @returns True if unit projects Zone of Control
 */
function hasZoC(unit: BattleUnit & UnitWithEngagement): boolean {
  // Explicit override takes precedence
  if (unit.hasZoneOfControl !== undefined) {
    return unit.hasZoneOfControl;
  }
  // Default: melee units (range <= 1) have ZoC
  return unit.range <= 1;
}

/**
 * Checks if a unit is a ranged unit (for archer penalty).
 *
 * @param unit - Unit to check
 * @returns True if unit is ranged
 */
function isRangedUnit(unit: BattleUnit & UnitWithEngagement): boolean {
  if (unit.isRanged !== undefined) {
    return unit.isRanged;
  }
  return unit.range > 1;
}

/**
 * Gets all enemy units for a given unit.
 *
 * @param unit - Unit to find enemies for
 * @param state - Current battle state
 * @returns Array of enemy units
 */
function getEnemyUnits(
  unit: BattleUnit,
  state: BattleState,
): BattleUnit[] {
  return state.units.filter(
    (u) => u.alive && u.team !== unit.team,
  );
}

/**
 * Gets all adjacent positions to a unit.
 *
 * @param unit - Unit to get adjacent positions for
 * @returns Array of adjacent positions
 */
function getAdjacentPositions(unit: BattleUnit): Position[] {
  return getNeighbors(unit.position);
}

/**
 * Checks if two positions are adjacent (Manhattan distance = 1).
 *
 * @param a - First position
 * @param b - Second position
 * @returns True if positions are adjacent
 */
function areAdjacent(a: Position, b: Position): boolean {
  return manhattanDistance(a, b) === 1;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an engagement processor instance.
 *
 * The engagement processor handles:
 * - Zone of Control detection
 * - Attack of Opportunity when enemies leave ZoC
 * - Archer penalty when engaged in melee
 * - Engagement status tracking
 *
 * @param config - Engagement configuration
 * @returns EngagementProcessor instance
 *
 * @example
 * const processor = createEngagementProcessor({
 *   attackOfOpportunity: true,
 *   archerPenalty: true,
 *   archerPenaltyPercent: 0.5,
 * });
 *
 * // Check engagement status
 * const status = processor.getEngagementStatus(unit, state);
 *
 * // Get archer penalty
 * const penalty = processor.getArcherPenalty(archer, state, config);
 */
export function createEngagementProcessor(
  config: EngagementConfig,
): EngagementProcessor {
  return {
    /**
     * Gets the engagement status of a unit.
     * Checks if unit is in any enemy's Zone of Control.
     *
     * @param unit - Unit to check engagement status for
     * @param state - Current battle state with all units
     * @returns Engagement status ('free', 'engaged', or 'pinned')
     * @example
     * const status = processor.getEngagementStatus(unit, state);
     * if (status === 'pinned') {
     *   // Unit is engaged by multiple enemies
     * }
     */
    getEngagementStatus(
      unit: BattleUnit & UnitWithEngagement,
      state: BattleState,
    ): EngagementStatus {
      // Get all enemy units with ZoC
      const enemies = getEnemyUnits(unit, state);
      const engagingEnemies = enemies.filter((enemy) => {
        const enemyWithEngagement = enemy as BattleUnit & UnitWithEngagement;
        return hasZoC(enemyWithEngagement) && areAdjacent(unit.position, enemy.position);
      });

      if (engagingEnemies.length === 0) {
        return 'free';
      }

      if (engagingEnemies.length >= 2) {
        return 'pinned';
      }

      return 'engaged';
    },

    /**
     * Gets the Zone of Control for a unit.
     * Returns adjacent cells that the unit controls.
     *
     * @param unit - Unit to get Zone of Control for
     * @returns Zone of Control information with controlled cells
     * @example
     * const zoc = processor.getZoneOfControl(unit);
     * console.log(`Unit controls ${zoc.cells.length} cells`);
     */
    getZoneOfControl(unit: BattleUnit & UnitWithEngagement): ZoneOfControl {
      const active = unit.alive && hasZoC(unit);
      const cells = active ? getAdjacentPositions(unit) : [];

      return {
        unitId: unit.instanceId,
        cells,
        active,
      };
    },

    /**
     * Checks if a position is in any unit's Zone of Control.
     *
     * @param position - Position to check for ZoC coverage
     * @param state - Current battle state with all units
     * @param excludeUnitId - Optional unit ID to exclude from check
     * @returns ZoC check result with controlling units
     * @example
     * const check = processor.checkZoneOfControl(targetPos, state);
     * if (check.triggersAoO) {
     *   // Moving here will trigger Attack of Opportunity
     * }
     */
    checkZoneOfControl(
      position: Position,
      state: BattleState,
      excludeUnitId?: string,
    ): ZoCCheckResult {
      const controllingUnits: string[] = [];

      for (const unit of state.units) {
        // Skip dead units and excluded unit
        if (!unit.alive) continue;
        if (excludeUnitId && unit.instanceId === excludeUnitId) continue;

        const unitWithEngagement = unit as BattleUnit & UnitWithEngagement;
        if (!hasZoC(unitWithEngagement)) continue;

        // Check if position is adjacent to this unit
        if (areAdjacent(position, unit.position)) {
          controllingUnits.push(unit.instanceId);
        }
      }

      return {
        inZoC: controllingUnits.length > 0,
        controllingUnits,
        triggersAoO: config.attackOfOpportunity && controllingUnits.length > 0,
      };
    },

    /**
     * Checks if movement triggers Attack of Opportunity.
     *
     * @param unit - Unit that is moving
     * @param fromPosition - Starting position of the movement
     * @param toPosition - Target position of the movement
     * @param state - Current battle state with all units
     * @returns Array of AoO triggers (empty if none triggered)
     * @example
     * const triggers = processor.checkAttackOfOpportunity(unit, from, to, state);
     * for (const trigger of triggers) {
     *   const result = processor.executeAttackOfOpportunity(trigger, state, seed);
     * }
     */
    checkAttackOfOpportunity(
      unit: BattleUnit & UnitWithEngagement,
      fromPosition: Position,
      toPosition: Position,
      state: BattleState,
    ): AoOTrigger[] {
      // AoO disabled in config
      if (!config.attackOfOpportunity) {
        return [];
      }

      const triggers: AoOTrigger[] = [];
      const enemies = getEnemyUnits(unit, state);

      for (const enemy of enemies) {
        const enemyWithEngagement = enemy as BattleUnit & UnitWithEngagement;

        // Skip enemies without ZoC
        if (!hasZoC(enemyWithEngagement)) continue;

        // Skip enemies that already used AoO this turn
        if (enemyWithEngagement.usedAttackOfOpportunity) continue;

        // Check if unit was in enemy's ZoC at start position
        const wasInZoC = areAdjacent(fromPosition, enemy.position);

        // Check if unit is leaving ZoC (moving away from enemy)
        const isLeavingZoC = wasInZoC && !areAdjacent(toPosition, enemy.position);

        if (isLeavingZoC) {
          triggers.push({
            type: 'leave_zoc',
            attacker: enemy,
            target: unit,
            fromPosition,
            toPosition,
          });
        }
      }

      return triggers;
    },

    /**
     * Executes an Attack of Opportunity.
     *
     * @param trigger - AoO trigger information with attacker and target
     * @param state - Current battle state
     * @param seed - Random seed for deterministic hit calculation
     * @returns AoO result with hit status, damage, and updated state
     * @example
     * const result = processor.executeAttackOfOpportunity(trigger, state, seed);
     * if (result.hit) {
     *   console.log(`AoO dealt ${result.damage} damage`);
     * }
     */
    executeAttackOfOpportunity(
      trigger: AoOTrigger,
      state: BattleState,
      seed: number,
    ): AoOResult {
      const { attacker, target } = trigger;
      const random = new SeededRandom(seed);

      // AoO hit chance formula: fixed 80% chance to hit
      // This is lower than normal attacks to balance the free attack
      const hitChance = 0.8;
      const roll = random.next();
      const hit = roll < hitChance;

      if (!hit) {
        // Mark attacker as having used AoO
        const updatedAttacker: BattleUnit & UnitWithEngagement = {
          ...attacker,
          usedAttackOfOpportunity: true,
        };

        return {
          hit: false,
          damage: 0,
          movementInterrupted: false,
          state: updateUnit(state, updatedAttacker),
        };
      }

      // AoO damage formula: max(1, floor((ATK - armor) * 0.5))
      // AoO deals 50% of normal attack damage to balance the free attack
      const baseDamage = attacker.stats.atk;
      const targetArmor = target.stats.armor;
      const damage = Math.max(1, Math.floor((baseDamage - targetArmor) * 0.5));

      // Apply damage to target: newHp = max(0, currentHp - damage)
      const newHp = Math.max(0, target.currentHp - damage);
      const updatedTarget: BattleUnit = {
        ...target,
        currentHp: newHp,
        alive: newHp > 0,
      };

      // Mark attacker as having used AoO
      const updatedAttacker: BattleUnit & UnitWithEngagement = {
        ...attacker,
        usedAttackOfOpportunity: true,
      };

      return {
        hit: true,
        damage,
        movementInterrupted: false, // AoO doesn't interrupt movement by default
        state: updateUnits(state, [updatedTarget, updatedAttacker]),
      };
    },

    /**
     * Calculates archer penalty when engaged.
     * Returns damage multiplier (1.0 = no penalty, 0.5 = 50% damage).
     *
     * @param unit - Ranged unit to check for penalty
     * @param state - Current battle state
     * @param engagementConfig - Engagement configuration with penalty settings
     * @returns Damage multiplier (0.0 to 1.0)
     * @example
     * const multiplier = processor.getArcherPenalty(archer, state, config);
     * const finalDamage = Math.floor(baseDamage * multiplier);
     */
    getArcherPenalty(
      unit: BattleUnit & UnitWithEngagement,
      state: BattleState,
      engagementConfig: EngagementConfig,
    ): number {
      // Penalty disabled in config
      if (!engagementConfig.archerPenalty) {
        return 1.0;
      }

      // Only ranged units suffer penalty
      if (!isRangedUnit(unit)) {
        return 1.0;
      }

      // Check if unit is engaged
      const status = this.getEngagementStatus(unit, state);
      if (status === 'free') {
        return 1.0;
      }

      // Archer penalty formula: multiplier = 1.0 - archerPenaltyPercent
      // Default: 1.0 - 0.5 = 0.5 (50% damage when engaged)
      // This represents the difficulty of aiming while in melee combat
      return 1.0 - engagementConfig.archerPenaltyPercent;
    },

    /**
     * Updates engagement status for all units.
     * Should be called after movement to recalculate engagements.
     *
     * @param state - Current battle state with all units
     * @returns Updated battle state with engagement info on all units
     * @example
     * const newState = processor.updateEngagements(state);
     * // All units now have updated engaged and engagedBy properties
     */
    updateEngagements(state: BattleState): BattleState {
      const updatedUnits: BattleUnit[] = [];

      for (const unit of state.units) {
        if (!unit.alive) continue;

        const unitWithEngagement = unit as BattleUnit & UnitWithEngagement;
        const status = this.getEngagementStatus(unitWithEngagement, state);

        // Find all enemies engaging this unit
        const enemies = getEnemyUnits(unit, state);
        const engagingEnemyIds = enemies
          .filter((enemy) => {
            const enemyWithEngagement = enemy as BattleUnit & UnitWithEngagement;
            return hasZoC(enemyWithEngagement) && areAdjacent(unit.position, enemy.position);
          })
          .map((e) => e.instanceId);

        const updatedUnit: BattleUnit & UnitWithEngagement = {
          ...unit,
          engaged: status !== 'free',
          engagedBy: engagingEnemyIds.length > 0 ? engagingEnemyIds : [],
        };

        updatedUnits.push(updatedUnit);
      }

      return {
        ...state,
        units: state.units.map((u) => {
          const updated = updatedUnits.find((upd) => upd.instanceId === u.instanceId);
          return updated ?? u;
        }),
      };
    },

    /**
     * Apply engagement logic for a battle phase.
     *
     * Phase behaviors:
     * - movement: Check for ZoC entry/exit, trigger AoO
     * - pre_attack: Apply archer penalty if engaged (stored in context for damage calculation)
     * - turn_end: Reset AoO usage
     *
     * @param phase - Current battle phase
     * @param state - Current battle state with all units
     * @param context - Phase context containing activeUnit, action, and seed
     * @returns Updated battle state with engagement changes applied
     * @example
     * const newState = processor.apply('movement', state, {
     *   activeUnit: unit,
     *   action: { type: 'move', path: [...] },
     *   seed: 12345,
     * });
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // Movement phase: check for AoO and update engagements
      if (phase === 'movement' && context.action?.type === 'move' && context.action.path) {
        let currentState = state;
        const path = context.action.path;
        const unit = context.activeUnit as BattleUnit & UnitWithEngagement;

        // Check each step of the path for AoO triggers
        for (let i = 0; i < path.length - 1; i++) {
          const fromPos = path[i];
          const toPos = path[i + 1];

          if (!fromPos || !toPos) continue;

          const triggers = this.checkAttackOfOpportunity(
            unit,
            fromPos,
            toPos,
            currentState,
          );

          // Execute each AoO
          for (const trigger of triggers) {
            const result = this.executeAttackOfOpportunity(
              trigger,
              currentState,
              context.seed + i,
            );
            currentState = result.state;

            // If unit died from AoO, stop processing
            const updatedUnit = findUnit(currentState, unit.instanceId);
            if (!updatedUnit?.alive) {
              return currentState;
            }
          }
        }

        // Update engagements after movement
        return this.updateEngagements(currentState);
      }

      // Pre-attack phase: apply archer penalty modifier to engaged ranged units
      if (phase === 'pre_attack' && context.action?.type === 'attack') {
        const unit = context.activeUnit as BattleUnit & UnitWithEngagement;
        const penalty = this.getArcherPenalty(unit, state, config);

        // If there's a penalty, store it on the unit for damage calculation
        if (penalty < 1.0) {
          const updatedUnit: BattleUnit & UnitWithEngagement = {
            ...unit,
            archerPenaltyModifier: penalty,
          };
          return updateUnit(state, updatedUnit);
        }

        return state;
      }

      // Turn end: reset AoO usage
      if (phase === 'turn_end') {
        const updatedUnits = state.units.map((u) => {
          const unitWithEngagement = u as BattleUnit & UnitWithEngagement;
          if (unitWithEngagement.usedAttackOfOpportunity) {
            return {
              ...u,
              usedAttackOfOpportunity: false,
            };
          }
          return u;
        });

        return {
          ...state,
          units: updatedUnits,
        };
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createEngagementProcessor;
