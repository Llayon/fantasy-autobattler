import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { BattleService } from './battle.service';
import { GuestGuard } from '../auth/guest.guard';

@Controller('battle')
@UseGuards(GuestGuard)
export class BattleController {
  constructor(private battleService: BattleService) {}

  @Post('start')
  async startBattle(@Req() req: any) {
    return this.battleService.startBattle(req.player.id);
  }

  @Get(':id')
  async getBattle(@Param('id') id: string) {
    return this.battleService.getBattle(id);
  }

  @Get()
  async getMyBattles(@Req() req: any) {
    return this.battleService.getPlayerBattles(req.player.id);
  }
}
