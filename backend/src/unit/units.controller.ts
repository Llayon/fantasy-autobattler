/**
 * Units Controller for Fantasy Autobattler.
 * Provides public endpoints for unit data and statistics.
 * 
 * @fileoverview REST API for accessing unit templates, roles, and game data.
 * All endpoints are public and serve static data from unit.data.ts.
 */

import { Controller, Get, Param, NotFoundException, Logger, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UnitTemplate, UnitRole } from '../types/game.types';
import { 
  UNIT_TEMPLATES, 
  UnitId, 
  getUnitTemplate, 
  getUnitsByRole
} from './unit.data';
import { UNIT_ROLES } from '../config/game.constants';
import { 
  UnitsListResponseDto, 
  UnitTemplateDto, 
  UnitsByRoleResponseDto
} from './dto/unit.dto';
import { ErrorResponseDto } from '../common/dto/api-response.dto';



/**
 * Controller handling unit data endpoints.
 * Serves static unit information for team building and game reference.
 * 
 * All endpoints are public (no authentication required) as unit data
 * is considered public game information needed for team building.
 */
@ApiTags('units')
@Controller('units')
export class UnitsController {
  private readonly logger = new Logger(UnitsController.name);

  /**
   * Get all available units with complete stats and role grouping.
   * Returns comprehensive unit database for team building interfaces.
   * 
   * @returns Complete list of all 15 units with role grouping
   * @example
   * GET /units
   * {
   *   "units": [...],
   *   "total": 15,
   *   "byRole": {
   *     "tank": [...],
   *     "melee_dps": [...],
   *     ...
   *   }
   * }
   */
  @Get()
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @ApiOperation({
    summary: 'Get all units',
    description: 'Returns complete list of all 15 units with role grouping for team building interfaces',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all units',
    type: UnitsListResponseDto,
  })
  getAllUnits(): UnitsListResponseDto {
    this.logger.debug('Fetching all units');

    const allUnits = Object.values(UNIT_TEMPLATES);
    
    // Group units by role for convenient filtering
    const byRole: Record<UnitRole, UnitTemplate[]> = {
      [UNIT_ROLES.TANK]: [],
      [UNIT_ROLES.MELEE_DPS]: [],
      [UNIT_ROLES.RANGED_DPS]: [],
      [UNIT_ROLES.MAGE]: [],
      [UNIT_ROLES.SUPPORT]: [],
      [UNIT_ROLES.CONTROL]: [],
    };

    // Populate role groups
    allUnits.forEach(unit => {
      if (byRole[unit.role]) {
        byRole[unit.role].push(unit);
      }
    });

    this.logger.debug(`Retrieved ${allUnits.length} units grouped by ${Object.keys(byRole).length} roles`);

    return {
      units: allUnits as UnitTemplateDto[],
      total: allUnits.length,
      byRole: byRole as Record<UnitRole, UnitTemplateDto[]>,
    };
  }

  /**
   * Get specific unit by ID with complete template data.
   * Returns detailed unit information for unit cards and tooltips.
   * 
   * @param id - The unit ID to retrieve
   * @returns Complete unit template with all stats and abilities
   * @throws NotFoundException when unit ID is not found
   * @example
   * GET /units/knight
   * {
   *   "id": "knight",
   *   "name": "Рыцарь",
   *   "role": "tank",
   *   "cost": 5,
   *   "stats": { ... },
   *   "range": 1,
   *   "abilities": ["shield_wall"]
   * }
   */
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @ApiOperation({
    summary: 'Get unit by ID',
    description: 'Returns detailed unit information for unit cards and tooltips',
  })
  @ApiParam({
    name: 'id',
    description: 'Unit identifier',
    example: 'knight',
    enum: [
      'knight', 'guardian', 'berserker',
      'rogue', 'duelist', 'assassin',
      'archer', 'crossbowman', 'hunter',
      'mage', 'warlock', 'elementalist',
      'priest', 'bard', 'enchanter'
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved unit',
    type: UnitTemplateDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Unit not found',
    type: ErrorResponseDto,
  })
  getUnitById(@Param('id') id: string): UnitTemplateDto {
    this.logger.debug(`Fetching unit by ID: ${id}`);

    const unit = getUnitTemplate(id as UnitId);
    
    if (!unit) {
      this.logger.warn(`Unit not found: ${id}`);
      throw new NotFoundException(`Unit with ID '${id}' not found`);
    }

    this.logger.debug(`Retrieved unit: ${unit.name} (${unit.role})`);
    return unit as UnitTemplateDto;
  }

  /**
   * Get all units of a specific role.
   * Returns filtered unit list for role-based team building.
   * 
   * @param role - The unit role to filter by
   * @returns Array of units with the specified role
   * @throws NotFoundException when role is invalid
   * @example
   * GET /units/roles/tank
   * {
   *   "role": "tank",
   *   "units": [
   *     { "id": "knight", "name": "Рыцарь", ... },
   *     { "id": "guardian", "name": "Страж", ... },
   *     { "id": "berserker", "name": "Берсерк", ... }
   *   ],
   *   "count": 3
   * }
   */
  @Get('roles/:role')
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @ApiOperation({
    summary: 'Get units by role',
    description: 'Returns filtered unit list for role-based team building',
  })
  @ApiParam({
    name: 'role',
    description: 'Unit role for filtering',
    example: 'tank',
    enum: ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'],
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved units by role',
    type: UnitsByRoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid role',
    type: ErrorResponseDto,
  })
  getUnitsByRole(@Param('role') role: string): UnitsByRoleResponseDto {
    this.logger.debug(`Fetching units by role: ${role}`);

    // Validate role exists in our constants
    const validRoles = Object.values(UNIT_ROLES);
    if (!validRoles.includes(role as UnitRole)) {
      this.logger.warn(`Invalid role requested: ${role}`);
      throw new NotFoundException(`Role '${role}' not found. Valid roles: ${validRoles.join(', ')}`);
    }

    const units = getUnitsByRole(role as UnitRole);
    
    this.logger.debug(`Retrieved ${units.length} units for role: ${role}`);

    return {
      role: role as UnitRole,
      units,
      count: units.length,
    };
  }
}