/**
 * Team validation service for Fantasy Autobattler.
 * Handles budget validation, position validation, and team composition rules.
 */

import { Injectable } from '@nestjs/common';
import { Position } from '../types/game.types';
import { TeamUnit } from '../entities/team.entity';
import { getUnitTemplate, UnitId } from '../unit/unit.data';
import { TEAM_LIMITS, GRID_DIMENSIONS, DEPLOYMENT_ZONES } from '../config/game.constants';

/**
 * Interface for team creation/update requests.
 */
export interface CreateTeamRequest {
  /** Team name for identification */
  name: string;
  /** Array of units with positions */
  units: TeamUnit[];
}

/**
 * Interface for team validation results.
 */
export interface TeamValidationResult {
  /** Whether the team is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Total cost of the team */
  totalCost: number;
  /** Number of units in the team */
  unitCount: number;
}

/**
 * Service responsible for validating team configurations.
 * Ensures teams meet budget, positioning, and composition requirements.
 */
@Injectable()
export class TeamValidator {
  /**
   * Validate a complete team configuration.
   * Checks budget constraints, unit positioning, and composition rules.
   * 
   * @param teamData - Team data to validate
   * @returns Validation result with errors and metadata
   * @example
   * const result = validator.validateTeam({
   *   name: 'My Team',
   *   units: [{ unitId: 'knight', position: { x: 0, y: 0 } }]
   * });
   */
  validateTeam(teamData: CreateTeamRequest): TeamValidationResult {
    const errors: string[] = [];
    let totalCost = 0;

    // Validate team name
    if (!teamData.name || teamData.name.trim().length === 0) {
      errors.push('Team name is required');
    } else if (teamData.name.length > 100) {
      errors.push('Team name cannot exceed 100 characters');
    }

    // Validate units array
    if (!Array.isArray(teamData.units)) {
      errors.push('Units must be an array');
      return {
        isValid: false,
        errors,
        totalCost: 0,
        unitCount: 0,
      };
    }

    // Validate unit count
    if (teamData.units.length === 0) {
      errors.push('Team must have at least one unit');
    } else if (teamData.units.length > TEAM_LIMITS.MAX_UNITS) {
      errors.push(`Team cannot have more than ${TEAM_LIMITS.MAX_UNITS} units`);
    }

    // Validate each unit and calculate total cost
    const usedPositions = new Set<string>();
    
    for (let i = 0; i < teamData.units.length; i++) {
      const unit = teamData.units[i];
      if (!unit) {
        errors.push(`Unit at index ${i} is undefined`);
        continue;
      }

      // Validate unit structure
      const unitErrors = this.validateUnit(unit, i);
      errors.push(...unitErrors);

      // Calculate cost if unit is valid
      if (unit.unitId) {
        const template = getUnitTemplate(unit.unitId as UnitId);
        if (template) {
          totalCost += template.cost;
        }
      }

      // Validate position uniqueness
      if (unit.position) {
        const positionKey = `${unit.position.x},${unit.position.y}`;
        if (usedPositions.has(positionKey)) {
          errors.push(`Duplicate position at (${unit.position.x}, ${unit.position.y})`);
        } else {
          usedPositions.add(positionKey);
        }

        // Validate position bounds and deployment zone
        const positionErrors = this.validatePosition(unit.position, i);
        errors.push(...positionErrors);
      }
    }

    // Validate budget
    if (totalCost > TEAM_LIMITS.BUDGET) {
      errors.push(`Team cost ${totalCost} exceeds maximum budget of ${TEAM_LIMITS.BUDGET} points`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalCost,
      unitCount: teamData.units.length,
    };
  }

  /**
   * Validate a single unit configuration.
   * 
   * @param unit - Unit to validate
   * @param index - Unit index for error messages
   * @returns Array of validation error messages
   * @example
   * const errors = validator.validateUnit({ unitId: 'knight', position: { x: 0, y: 0 } }, 0);
   */
  validateUnit(unit: TeamUnit, index: number): string[] {
    const errors: string[] = [];

    // Validate unitId
    if (!unit.unitId || typeof unit.unitId !== 'string') {
      errors.push(`Unit at index ${index} must have a valid unitId string`);
    } else {
      const template = getUnitTemplate(unit.unitId as UnitId);
      if (!template) {
        errors.push(`Unit at index ${index} has unknown unitId: ${unit.unitId}`);
      }
    }

    // Validate position
    if (!unit.position || typeof unit.position !== 'object') {
      errors.push(`Unit at index ${index} must have a valid position object`);
    } else if (
      typeof unit.position.x !== 'number' || 
      typeof unit.position.y !== 'number'
    ) {
      errors.push(`Unit at index ${index} position must have numeric x and y coordinates`);
    }

    return errors;
  }

  /**
   * Validate a position for grid bounds and deployment zone.
   * 
   * @param position - Position to validate
   * @param unitIndex - Unit index for error messages
   * @returns Array of validation error messages
   * @example
   * const errors = validator.validatePosition({ x: 0, y: 0 }, 0);
   */
  validatePosition(position: Position, unitIndex: number): string[] {
    const errors: string[] = [];

    // Grid bounds validation
    if (
      position.x < 0 || 
      position.x >= GRID_DIMENSIONS.WIDTH || 
      position.y < 0 || 
      position.y >= GRID_DIMENSIONS.HEIGHT
    ) {
      errors.push(
        `Unit at index ${unitIndex} position (${position.x}, ${position.y}) is outside grid bounds (0-${GRID_DIMENSIONS.WIDTH - 1}, 0-${GRID_DIMENSIONS.HEIGHT - 1})`
      );
    }

    // Player deployment zone validation (rows 0-1)
    if (position.y < 0 || position.y > 1) {
      errors.push(
        `Unit at index ${unitIndex} position (${position.x}, ${position.y}) is outside player deployment zone (rows ${DEPLOYMENT_ZONES.PLAYER_ROWS.join(', ')})`
      );
    }

    return errors;
  }

  /**
   * Validate team budget against unit costs.
   * 
   * @param unitIds - Array of unit IDs to check
   * @returns Validation result with cost information
   * @throws BadRequestException if any unit ID is invalid
   * @example
   * const result = validator.validateBudget(['knight', 'mage', 'priest']);
   */
  validateBudget(unitIds: string[]): { isValid: boolean; totalCost: number; errors: string[] } {
    const errors: string[] = [];
    let totalCost = 0;

    for (const unitId of unitIds) {
      const template = getUnitTemplate(unitId as UnitId);
      if (!template) {
        errors.push(`Unknown unit ID: ${unitId}`);
      } else {
        totalCost += template.cost;
      }
    }

    if (totalCost > TEAM_LIMITS.BUDGET) {
      errors.push(`Team cost ${totalCost} exceeds maximum budget of ${TEAM_LIMITS.BUDGET} points`);
    }

    return {
      isValid: errors.length === 0,
      totalCost,
      errors,
    };
  }

  /**
   * Validate team for battle readiness.
   * Checks if team meets all requirements for participating in battles.
   * 
   * @param team - Team entity to validate
   * @returns True if team is ready for battle
   * @example
   * const isReady = validator.validateForBattle(team);
   */
  validateForBattle(team: { units: TeamUnit[]; totalCost: number }): boolean {
    return (
      team.units.length > 0 &&
      team.totalCost <= TEAM_LIMITS.BUDGET &&
      team.totalCost > 0
    );
  }

  /**
   * Get team composition summary for display.
   * 
   * @param units - Array of team units
   * @returns Summary with role distribution and statistics
   * @example
   * const summary = validator.getTeamSummary(team.units);
   * console.log(summary.roleDistribution); // { tank: 1, dps: 2, support: 1 }
   */
  getTeamSummary(units: TeamUnit[]): {
    unitCount: number;
    totalCost: number;
    roleDistribution: Record<string, number>;
    averageCost: number;
  } {
    let totalCost = 0;
    const roleDistribution: Record<string, number> = {};

    for (const unit of units) {
      const template = getUnitTemplate(unit.unitId as UnitId);
      if (template) {
        totalCost += template.cost;
        roleDistribution[template.role] = (roleDistribution[template.role] || 0) + 1;
      }
    }

    return {
      unitCount: units.length,
      totalCost,
      roleDistribution,
      averageCost: units.length > 0 ? Math.round(totalCost / units.length) : 0,
    };
  }
}