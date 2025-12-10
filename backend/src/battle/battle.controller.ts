import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { BattleService } from './battle.service';
import { GuestGuard } from '../auth/guest.guard';

interface AuthenticatedRequest extends Request {
  player: {
    id: string;
  };
}

/**
 * Controller handling battle-related HTTP endpoints.
 * All endpoints require guest authentication.
 */
@Controller('battle')
@UseGuards(GuestGuard)
export class BattleController {
  constructor(private battleService: BattleService) {}

  /**
   * Start a new battle against a bot opponent.
   * @param req - Authenticated request containing player information
   * @returns Battle result with events and winner
   */
  @Post('start')
  async startBattle(@Req() req: AuthenticatedRequest) {
    return this.battleService.startBattle(req.player.id);
  }

  /**
   * Get battle details by ID.
   * @param id - Battle ID
   * @returns Battle log with events and metadata
   */
  @Get(':id')
  async getBattle(@Param('id') id: string) {
    return this.battleService.getBattle(id);
  }

  /**
   * Get all battles for the authenticated player.
   * @param req - Authenticated request containing player information
   * @returns Array of player's battle logs
   */
  @Get()
  async getMyBattles(@Req() req: AuthenticatedRequest) {
    return this.battleService.getPlayerBattles(req.player.id);
  }
}
