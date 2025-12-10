import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { PlayerService } from './player.service';
import { GuestGuard } from '../auth/guest.guard';
import { UnitType } from '../unit/unit.data';

interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

interface UpdateTeamDto {
  team: UnitType[];
}

/**
 * Controller handling player-related HTTP endpoints.
 * All endpoints require guest authentication.
 */
@Controller('player')
@UseGuards(GuestGuard)
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  /**
   * Get current player information.
   * @param req - Authenticated request containing player information
   * @returns Player entity with current team and stats
   */
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.playerService.getPlayer(req.player.id);
  }

  /**
   * Update player's team composition.
   * @param req - Authenticated request containing player information
   * @param body - Request body containing new team composition
   * @returns Updated player entity
   */
  @Put('team')
  async updateTeam(@Req() req: AuthenticatedRequest, @Body() body: UpdateTeamDto) {
    return this.playerService.updateTeam(req.player.id, body.team);
  }
}
