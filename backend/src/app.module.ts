import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PlayerModule } from './player/player.module';
import { BattleModule } from './battle/battle.module';
import { TeamModule } from './team/team.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { UnitsModule } from './unit/units.module';
import { HealthModule } from './health/health.module';
import { RoguelikeModule } from './roguelike/roguelike.module';
import { Player } from './entities/player.entity';
import { BattleLog } from './entities/battle-log.entity';
import { Team } from './entities/team.entity';
import { MatchmakingQueue } from './entities/matchmaking-queue.entity';
import { RoguelikeRunEntity } from './roguelike/entities/run.entity';
import { RoguelikeSnapshotEntity } from './roguelike/entities/snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'autobattler',
      entities: [Player, BattleLog, Team, MatchmakingQueue, RoguelikeRunEntity, RoguelikeSnapshotEntity],
      synchronize: true, // Auto-create tables (dev only)
    }),
    AuthModule,
    PlayerModule,
    BattleModule,
    TeamModule,
    MatchmakingModule,
    UnitsModule,
    HealthModule,
    RoguelikeModule,
  ],
})
export class AppModule {}
