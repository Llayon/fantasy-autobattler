import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { PlayerService } from './player.service';
import { GuestGuard } from '../auth/guest.guard';
import { UnitType } from '../unit/unit.data';

@Controller('player')
@UseGuards(GuestGuard)
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    return this.playerService.getPlayer(req.player.id);
  }

  @Put('team')
  async updateTeam(@Req() req: any, @Body() body: { team: UnitType[] }) {
    return this.playerService.updateTeam(req.player.id, body.team);
  }
}
