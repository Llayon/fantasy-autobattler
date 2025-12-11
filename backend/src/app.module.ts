import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PlayerModule } from './player/player.module';
import { BattleModule } from './battle/battle.module';
import { TeamModule } from './team/team.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { UnitsModule } from './unit/units.module';
import { Player } from './entities/player.entity';
import { BattleLog } from './entities/battle-log.entity';
import { Team } from './entities/team.entity';
import { MatchmakingQueue } from './entities/matchmaking-queue.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'autobattler',
      entities: [Player, BattleLog, Team, MatchmakingQueue],
      synchronize: true, // Auto-create tables (dev only)
    }),
    AuthModule,
    PlayerModule,
    BattleModule,
    TeamModule,
    MatchmakingModule,
    UnitsModule,
  ],
})
export class AppModule {}
