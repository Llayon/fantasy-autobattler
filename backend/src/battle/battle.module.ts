import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { BattleLog } from '../entities/battle-log.entity';
import { Player } from '../entities/player.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([BattleLog, Player]), AuthModule],
  controllers: [BattleController],
  providers: [BattleService],
})
export class BattleModule {}
