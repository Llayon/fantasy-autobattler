/**
 * Tier 3: Line of Sight (LoS) Processor
 *
 * Implements the Line of Sight system which controls ranged attack
 * validation. LoS determines whether a ranged unit can target an enemy
 * based on obstacles and firing mode.
 *
 * Line of Sight requires the facing mechanic (Tier 0) to be enabled,
 * as firing arcs depend on unit facing direction.
 *
 * Key mechanics:
 * - Direct Fire: Straight-line attacks blocked by units/obstacles
 * - Arc Fire: Lobbed attacks that ignore obstacles but have accuracy penalty
 * - Firing Arc: Units can only fire within their facing arc
 * - LoS Validation: Ranged attacks must pass LoS check before execution
 * - Bresenham Algorithm: Used for precise line-of-sight calculation
 *
 * @module core/mechanics/tier3/los
 */

import type { BattleState, BattleUnit, Position } from '../../../types';
import type { BattlePhase, PhaseContext } from '../../processor';
import type { LoSConfig } from '../../config/mechanics.types';
import { manhattanDistance } from '../../../grid/grid';
import type {
  LoSProcessor,
  UnitWithLoS,
  LoSLine,
  LoSCell,
  LoSObstacle,
  LoSCheckResult,
  LoSValidationResult,
  FiringArcResult,
  FireModeResult,
  LoSBlockReason,
} from './los.types';
import {
  DEFAULT_ARC_FIRE_PENALTY,
  DEFAULT_FIRING_ARC_ANGLE,
  ARC_FIRE_TAG,
  LOS_TRANSPARENT_TAG,
  ENHANCED_LOS_TAG,
} from './los.types';
import type { FacingDirection } from '../../tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Angle mappings for each facing direction (in degrees).
 * North = 0°, East = 90°, South = 180°, West = 270°
 */
const FACING_ANGLES: Record<FacingDirection, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a unit is alive.
 *
 * @param unit - Unit to check
 * @returns True if unit is alive
 */
function isUnitAlive(unit: BattleUnit): boolean {
  return (unit.currentHp ?? 0) > 0 && unit.alive !== false;
}

/**
 * Gets the unit's unique identifier.
 *
 * @param unit - Unit to get ID from
 * @returns Unit ID (instanceId or id)
 */
function getUnitId(unit: BattleUnit): string {
  return unit.instanceId ?? unit.id;
}

/**
 * Gets the unit's position.
 *
 * @param unit - Unit to get position from
 * @returns Position or undefined if not set
 */
function getUnitPosition(unit: BattleUnit): Position | undefined {
  return unit.position;
}

/**
 * Gets the unit's facing direction.
 *
 * @param unit - Unit to get facing from
 * @returns Facing direction or 'S' as default
 */
function getUnitFacing(unit: BattleUnit & UnitWithLoS): FacingDirection {
  return unit.facing ?? 'S';
}

/**
 * Gets the unit's attack range.
 *
 * @param unit - Unit to get range from
 * @returns Attack range in cells
 */
function getUnitRange(unit: BattleUnit & UnitWithLoS): number {
  return unit.range ?? 1;
}

/**
 * Gets the unit's firing arc in degrees.
 *
 * @param unit - Unit to get firing arc from
 * @returns Firing arc in degrees
 */
function getUnitFiringArc(unit: BattleUnit & UnitWithLoS): number {
  return unit.firingArc ?? DEFAULT_FIRING_ARC_ANGLE;
}

/**
 * Checks if a unit can use arc fire.
 *
 * @param unit - Unit to check
 * @returns True if unit can use arc fire
 */
function canUseArcFire(unit: BattleUnit & UnitWithLoS): boolean {
  if (unit.canArcFire !== undefined) {
    return unit.canArcFire;
  }
  const tags = unit.tags ?? [];
  return tags.includes(ARC_FIRE_TAG);
}

/**
 * Checks if a unit blocks line of sight.
 *
 * @param unit - Unit to check
 * @returns True if unit blocks LoS
 */
function doesUnitBlockLoS(unit: BattleUnit & UnitWithLoS): boolean {
  // Check explicit property first
  if (unit.blocksLoS !== undefined) {
    return unit.blocksLoS;
  }
  // Check for transparency tag
  const tags = unit.tags ?? [];
  if (tags.includes(LOS_TRANSPARENT_TAG)) {
    return false;
  }
  // Default: units block LoS
  return true;
}

/**
 * Checks if a unit has true sight (can see through obstacles).
 *
 * @param unit - Unit to check
 * @returns True if unit has true sight
 */
function hasTrueSight(unit: BattleUnit & UnitWithLoS): boolean {
  if (unit.hasTrueSight !== undefined) {
    return unit.hasTrueSight;
  }
  const tags = unit.tags ?? [];
  return tags.includes(ENHANCED_LOS_TAG);
}

/**
 * Checks if two units are on different teams (enemies).
 *
 * @param unit1 - First unit
 * @param unit2 - Second unit
 * @returns True if units are enemies
 */
function areEnemies(unit1: BattleUnit, unit2: BattleUnit): boolean {
  return unit1.team !== unit2.team;
}

/**
 * Calculates the angle from origin to target in degrees.
 * Returns angle in range [0, 360) where:
 * - 0° = North (negative Y)
 * - 90° = East (positive X)
 * - 180° = South (positive Y)
 * - 270° = West (negative X)
 *
 * @param origin - Origin position
 * @param target - Target position
 * @returns Angle in degrees [0, 360)
 */
function calculateAngle(origin: Position, target: Position): number {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  // atan2(dx, -dy) gives angle where North = 0°
  const radians = Math.atan2(dx, -dy);
  const degrees = radians * (180 / Math.PI);

  // Normalize to [0, 360)
  return (degrees + 360) % 360;
}

/**
 * Calculates the smallest angle difference between two angles.
 * Result is always in range [0, 180].
 *
 * @param angle1 - First angle in degrees
 * @param angle2 - Second angle in degrees
 * @returns Absolute angle difference [0, 180]
 */
function angleDifference(angle1: number, angle2: number): number {
  const diff = Math.abs(angle1 - angle2);
  return diff > 180 ? 360 - diff : diff;
}

// ═══════════════════════════════════════════════════════════════
// BRESENHAM LINE ALGORITHM
// ═══════════════════════════════════════════════════════════════

/**
 * Implements Bresenham's line algorithm to calculate all cells
 * along a line between two positions.
 *
 * ═══════════════════════════════════════════════════════════════
 * BRESENHAM'S LINE ALGORITHM
 * ═══════════════════════════════════════════════════════════════
 *
 * The algorithm works by tracking an error term that determines
 * when to step in the secondary direction:
 *
 * 1. Calculate dx = |x1 - x0| and dy = |y1 - y0|
 * 2. Determine step directions: sx = sign(x1 - x0), sy = sign(y1 - y0)
 * 3. Initialize error = dx - dy
 * 4. For each step:
 *    - Add current position to line
 *    - If at end, stop
 *    - Calculate e2 = 2 * error
 *    - If e2 > -dy: error -= dy, x += sx
 *    - If e2 < dx: error += dx, y += sy
 *
 * This produces a line with no gaps and minimal deviation from
 * the true line between the two points.
 *
 * ═══════════════════════════════════════════════════════════════
 *
 * @param start - Starting position
 * @param end - Ending position
 * @returns Array of cells along the line
 */
function bresenhamLine(start: Position, end: Position): LoSCell[] {
  const cells: LoSCell[] = [];

  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let distanceFromStart = 0;

  while (true) {
    const isEndpoint = (x0 === start.x && y0 === start.y) || (x0 === x1 && y0 === y1);

    cells.push({
      position: { x: x0, y: y0 },
      distanceFromStart,
      isEndpoint,
    });

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }

    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }

    distanceFromStart++;
  }

  return cells;
}

// ═══════════════════════════════════════════════════════════════
// PROCESSOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a Line of Sight processor instance.
 *
 * The LoS processor handles:
 * - Calculating line of sight paths using Bresenham's algorithm
 * - Checking for obstacles blocking direct fire
 * - Validating firing arcs based on unit facing
 * - Determining fire mode (direct vs arc)
 * - Applying accuracy penalties for arc fire
 *
 * @param config - LoS configuration with fire mode settings
 * @returns LoSProcessor instance
 *
 * @example
 * const processor = createLoSProcessor({
 *   directFire: true,
 *   arcFire: true,
 *   arcFirePenalty: 0.2,
 * });
 *
 * // Check LoS between two units
 * const losCheck = processor.checkLoS(archer, enemy, state);
 *
 * // Validate a ranged attack
 * const validation = processor.validateRangedAttack(archer, enemy, state, config);
 */
export function createLoSProcessor(config: LoSConfig): LoSProcessor {
  const arcFirePenalty = config.arcFirePenalty ?? DEFAULT_ARC_FIRE_PENALTY;

  return {
    /**
     * Calculates the line of sight path between two positions.
     * Uses Bresenham's line algorithm for precise cell enumeration.
     *
     * @param start - Starting position
     * @param end - Ending position
     * @returns Line of sight path with all cells
     */
    getLineOfSight(start: Position, end: Position): LoSLine {
      const cells = bresenhamLine(start, end);

      return {
        cells,
        start,
        end,
        length: cells.length,
      };
    },

    /**
     * Checks if a position is blocked by an obstacle.
     *
     * @param position - Position to check
     * @param state - Current battle state
     * @param excludeUnitId - Unit ID to exclude from blocking check
     * @returns Obstacle information if blocked, undefined if clear
     */
    isBlocked(
      position: Position,
      state: BattleState,
      excludeUnitId?: string,
    ): LoSObstacle | undefined {
      // Find unit at this position
      const unitAtPosition = state.units.find(
        (u) =>
          u.position &&
          u.position.x === position.x &&
          u.position.y === position.y &&
          isUnitAlive(u) &&
          getUnitId(u) !== excludeUnitId,
      );

      if (unitAtPosition) {
        const unitWithLoS = unitAtPosition as BattleUnit & UnitWithLoS;

        // Check if this unit blocks LoS
        if (doesUnitBlockLoS(unitWithLoS)) {
          return {
            position,
            type: 'unit',
            unitId: getUnitId(unitAtPosition),
            blocksCompletely: true,
          };
        }
      }

      // No obstacle at this position
      return undefined;
    },

    /**
     * Checks if target is within attacker's firing arc.
     *
     * ═══════════════════════════════════════════════════════════════
     * FIRING ARC CALCULATION
     * ═══════════════════════════════════════════════════════════════
     *
     * 1. Get attacker's facing angle (N=0°, E=90°, S=180°, W=270°)
     * 2. Calculate angle from attacker to target
     * 3. Calculate angle difference (0-180°)
     * 4. Compare to half of firing arc (arcLimit)
     *
     * Example with 90° firing arc:
     * - arcLimit = 45° (half of 90°)
     * - If angle difference <= 45°: in arc (front)
     * - If angle difference <= 90°: side
     * - If angle difference > 90°: rear
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param attacker - Unit performing the attack
     * @param target - Target unit
     * @returns Firing arc check result
     */
    checkFiringArc(
      attacker: BattleUnit & UnitWithLoS,
      target: BattleUnit & UnitWithLoS,
    ): FiringArcResult {
      const attackerPos = getUnitPosition(attacker as BattleUnit);
      const targetPos = getUnitPosition(target as BattleUnit);

      if (!attackerPos || !targetPos) {
        return {
          inArc: false,
          angle: 180,
          arcLimit: 0,
          relativeDirection: 'rear',
        };
      }

      const facing = getUnitFacing(attacker);
      const firingArc = getUnitFiringArc(attacker);
      const arcLimit = firingArc / 2;

      // Calculate angle from attacker to target
      const angleToTarget = calculateAngle(attackerPos, targetPos);

      // Get facing angle
      const facingAngle = FACING_ANGLES[facing];

      // Calculate angle difference
      const angle = angleDifference(angleToTarget, facingAngle);

      // Determine relative direction
      let relativeDirection: 'front' | 'side' | 'rear';
      if (angle <= 45) {
        relativeDirection = 'front';
      } else if (angle <= 135) {
        relativeDirection = 'side';
      } else {
        relativeDirection = 'rear';
      }

      return {
        inArc: angle <= arcLimit,
        angle,
        arcLimit,
        relativeDirection,
      };
    },

    /**
     * Checks line of sight between attacker and target.
     * Evaluates both direct and arc fire possibilities.
     *
     * @param attacker - Unit performing the attack
     * @param target - Target unit
     * @param state - Current battle state
     * @returns Complete LoS check result
     */
    checkLoS(
      attacker: BattleUnit & UnitWithLoS,
      target: BattleUnit & UnitWithLoS,
      state: BattleState,
    ): LoSCheckResult {
      const attackerPos = getUnitPosition(attacker as BattleUnit);
      const targetPos = getUnitPosition(target as BattleUnit);

      // Handle missing positions
      if (!attackerPos || !targetPos) {
        return {
          hasLoS: false,
          directLoS: false,
          arcLoS: false,
          obstacles: [],
          recommendedMode: 'blocked',
          distance: 0,
          inFiringArc: false,
          blockReason: 'disabled',
        };
      }

      // Calculate distance
      const distance = manhattanDistance(attackerPos, targetPos);

      // Check firing arc
      const arcCheck = this.checkFiringArc(attacker, target);

      // If not in firing arc, LoS is blocked
      if (!arcCheck.inArc) {
        return {
          hasLoS: false,
          directLoS: false,
          arcLoS: false,
          obstacles: [],
          recommendedMode: 'blocked',
          distance,
          inFiringArc: false,
          blockReason: 'out_of_arc',
        };
      }

      // Check range
      const range = getUnitRange(attacker);
      if (distance > range) {
        return {
          hasLoS: false,
          directLoS: false,
          arcLoS: false,
          obstacles: [],
          recommendedMode: 'blocked',
          distance,
          inFiringArc: true,
          blockReason: 'out_of_range',
        };
      }

      // Check for true sight (ignores all obstacles)
      if (hasTrueSight(attacker)) {
        return {
          hasLoS: true,
          directLoS: true,
          arcLoS: true,
          obstacles: [],
          recommendedMode: 'direct',
          distance,
          inFiringArc: true,
        };
      }

      // Calculate line of sight path
      const line = this.getLineOfSight(attackerPos, targetPos);

      // Check for obstacles along the path (excluding start and end)
      const obstacles: LoSObstacle[] = [];
      const attackerId = getUnitId(attacker as BattleUnit);
      const targetId = getUnitId(target as BattleUnit);

      for (const cell of line.cells) {
        // Skip start and end positions
        if (cell.isEndpoint) continue;

        const obstacle = this.isBlocked(cell.position, state, attackerId);
        if (obstacle && obstacle.unitId !== targetId) {
          obstacles.push(obstacle);
        }
      }

      // Determine direct LoS availability
      const directLoS = config.directFire && obstacles.length === 0;

      // Determine arc LoS availability
      const arcLoS = config.arcFire && canUseArcFire(attacker);

      // Determine recommended mode
      let recommendedMode: FireModeResult;
      let blockReason: LoSBlockReason | undefined;

      if (directLoS) {
        recommendedMode = 'direct';
      } else if (arcLoS) {
        recommendedMode = 'arc';
      } else {
        recommendedMode = 'blocked';
        if (obstacles.length > 0 && obstacles[0]) {
          blockReason = obstacles[0].type === 'unit' ? 'blocked_by_unit' : 'blocked_by_terrain';
        } else if (!config.arcFire || !canUseArcFire(attacker)) {
          blockReason = 'no_arc_fire';
        }
      }

      // Build result object conditionally to satisfy exactOptionalPropertyTypes
      const result: LoSCheckResult = {
        hasLoS: directLoS || arcLoS,
        directLoS,
        arcLoS,
        obstacles,
        recommendedMode,
        distance,
        inFiringArc: true,
      };

      if (blockReason !== undefined) {
        result.blockReason = blockReason;
      }

      return result;
    },

    /**
     * Validates a ranged attack considering LoS, range, and firing arc.
     *
     * @param attacker - Unit performing the attack
     * @param target - Target unit
     * @param state - Current battle state
     * @param losConfig - LoS configuration
     * @returns Validation result with fire mode and accuracy modifier
     */
    validateRangedAttack(
      attacker: BattleUnit & UnitWithLoS,
      target: BattleUnit & UnitWithLoS,
      state: BattleState,
      losConfig: LoSConfig,
    ): LoSValidationResult {
      const losCheck = this.checkLoS(attacker, target, state);

      if (!losCheck.hasLoS) {
        // Build result object conditionally to satisfy exactOptionalPropertyTypes
        const result: LoSValidationResult = {
          valid: false,
          fireMode: 'blocked',
          accuracyModifier: 0,
          losCheck,
        };

        if (losCheck.blockReason !== undefined) {
          result.reason = losCheck.blockReason;
        }

        return result;
      }

      // Determine accuracy modifier based on fire mode
      const fireMode = losCheck.recommendedMode;
      const accuracyModifier = this.getAccuracyModifier(fireMode, losConfig);

      return {
        valid: true,
        fireMode,
        accuracyModifier,
        losCheck,
      };
    },

    /**
     * Gets the accuracy modifier for a fire mode.
     *
     * ═══════════════════════════════════════════════════════════════
     * ACCURACY MODIFIER CALCULATION
     * ═══════════════════════════════════════════════════════════════
     *
     * Direct Fire: 1.0 (100% accuracy)
     * Arc Fire: 1.0 - arcFirePenalty (default: 80% accuracy)
     * Blocked: 0.0 (cannot fire)
     *
     * ═══════════════════════════════════════════════════════════════
     *
     * @param fireMode - Fire mode being used
     * @param losConfig - LoS configuration
     * @returns Accuracy modifier (1.0 for direct, reduced for arc)
     */
    getAccuracyModifier(fireMode: FireModeResult, losConfig: LoSConfig): number {
      switch (fireMode) {
        case 'direct':
          return 1.0;
        case 'arc':
          return 1.0 - (losConfig.arcFirePenalty ?? arcFirePenalty);
        case 'blocked':
          return 0.0;
      }
    },

    /**
     * Finds all valid targets within range and LoS.
     *
     * @param attacker - Unit looking for targets
     * @param state - Current battle state
     * @param _losConfig - LoS configuration (unused, kept for API consistency)
     * @returns Array of valid targets with their LoS check results
     */
    findValidTargets(
      attacker: BattleUnit & UnitWithLoS,
      state: BattleState,
      _losConfig: LoSConfig,
    ): Array<{ target: BattleUnit & UnitWithLoS; losCheck: LoSCheckResult }> {
      const results: Array<{ target: BattleUnit & UnitWithLoS; losCheck: LoSCheckResult }> = [];

      for (const unit of state.units) {
        // Skip self, allies, and dead units
        if (
          getUnitId(unit) === getUnitId(attacker as BattleUnit) ||
          !areEnemies(attacker as BattleUnit, unit) ||
          !isUnitAlive(unit)
        ) {
          continue;
        }

        const target = unit as BattleUnit & UnitWithLoS;
        const losCheck = this.checkLoS(attacker, target, state);

        if (losCheck.hasLoS) {
          results.push({ target, losCheck });
        }
      }

      return results;
    },

    /**
     * Apply LoS logic for a battle phase.
     *
     * Phase behaviors:
     * - pre_attack: Validate LoS for ranged attacks, determine fire mode
     *
     * Note: The actual attack validation and accuracy modification
     * should be handled by the battle simulator using the validation
     * result from this processor.
     *
     * @param phase - Current battle phase
     * @param state - Current battle state
     * @param context - Phase context with active unit and action
     * @returns Updated battle state (unchanged for LoS - validation only)
     */
    apply(
      phase: BattlePhase,
      state: BattleState,
      context: PhaseContext,
    ): BattleState {
      // LoS processor primarily provides validation functions
      // The actual state modification happens in the battle simulator
      // based on the validation results

      // For pre_attack phase, we could add LoS validation metadata
      // to the state, but for now we just return unchanged state
      // as the battle simulator should call validateRangedAttack directly

      if (phase === 'pre_attack' && context.target && context.action?.type === 'attack') {
        // LoS validation is performed by the battle simulator
        // This processor provides the validation functions
        // No state modification needed here
      }

      return state;
    },
  };
}

/**
 * Default export for convenience.
 */
export default createLoSProcessor;
