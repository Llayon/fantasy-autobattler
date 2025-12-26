/**
 * Roguelike Data Controller
 *
 * Provides endpoints for static game data (factions, leaders).
 *
 * @module roguelike/data
 */

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  FACTIONS_DATA,
  getFaction,
  isValidFaction,
} from './factions.data';
import {
  LEADERS_DATA,
  getLeadersByFaction,
  getLeaderWithSpells,
} from './leaders.data';

/**
 * Controller for roguelike static data endpoints.
 * Provides faction and leader information.
 */
@ApiTags('roguelike')
@Controller('roguelike')
export class DataController {
  /**
   * Get all available factions.
   *
   * @returns Array of faction data
   */
  @Get('factions')
  @ApiOperation({ summary: 'Get all factions' })
  @ApiResponse({
    status: 200,
    description: 'List of all available factions',
  })
  getFactions() {
    return Object.values(FACTIONS_DATA).map((faction) => ({
      id: faction.id,
      name: faction.name,
      description: faction.description,
      bonus: faction.bonus,
      icon: faction.icon,
    }));
  }

  /**
   * Get faction by ID.
   *
   * @param factionId - Faction identifier
   * @returns Faction data
   */
  @Get('factions/:factionId')
  @ApiOperation({ summary: 'Get faction by ID' })
  @ApiParam({ name: 'factionId', description: 'Faction identifier' })
  @ApiResponse({
    status: 200,
    description: 'Faction data',
  })
  @ApiResponse({
    status: 404,
    description: 'Faction not found',
  })
  getFactionById(@Param('factionId') factionId: string) {
    if (!isValidFaction(factionId)) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }
    const faction = getFaction(factionId);
    if (!faction) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }
    return {
      id: faction.id,
      name: faction.name,
      description: faction.description,
      bonus: faction.bonus,
      icon: faction.icon,
    };
  }

  /**
   * Get leaders for a faction.
   *
   * @param factionId - Faction identifier
   * @returns Array of leader data
   */
  @Get('factions/:factionId/leaders')
  @ApiOperation({ summary: 'Get leaders for a faction' })
  @ApiParam({ name: 'factionId', description: 'Faction identifier' })
  @ApiResponse({
    status: 200,
    description: 'List of leaders for the faction',
  })
  @ApiResponse({
    status: 404,
    description: 'Faction not found',
  })
  getLeadersByFactionId(@Param('factionId') factionId: string) {
    if (!isValidFaction(factionId)) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }

    const leaders = getLeadersByFaction(factionId);
    return leaders.map((leader) => {
      const leaderWithSpells = getLeaderWithSpells(leader.id);
      return {
        id: leader.id,
        name: leader.name,
        faction: leader.faction,
        passive: {
          id: leader.passive.id,
          name: leader.passive.name,
          description: leader.passive.description,
        },
        spells: leaderWithSpells?.spells.map((spell) => ({
          id: spell.id,
          name: spell.name,
          description: spell.description,
        })) ?? [],
        portrait: leader.portrait,
      };
    });
  }

  /**
   * Get all leaders.
   *
   * @returns Array of all leader data
   */
  @Get('leaders')
  @ApiOperation({ summary: 'Get all leaders' })
  @ApiResponse({
    status: 200,
    description: 'List of all leaders',
  })
  getAllLeaders() {
    return Object.values(LEADERS_DATA).map((leader) => {
      const leaderWithSpells = getLeaderWithSpells(leader.id);
      return {
        id: leader.id,
        name: leader.name,
        faction: leader.faction,
        passive: {
          id: leader.passive.id,
          name: leader.passive.name,
          description: leader.passive.description,
        },
        spells: leaderWithSpells?.spells.map((spell) => ({
          id: spell.id,
          name: spell.name,
          description: spell.description,
        })) ?? [],
        portrait: leader.portrait,
      };
    });
  }
}
