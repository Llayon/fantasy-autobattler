/**
 * Matchmaking Module for Fantasy Autobattler.
 * Handles player queue management and opponent matching.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingQueue } from '../entities/matchmaking-queue.entity';
import { Player } from '../entities/player.entity';
import { Team } from '../entities/team.entity';
import { BattleModule } from '../battle/battle.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Matchmaking module providing queue management and battle creation.
 * 
 * @example
 * // Import in app.module.ts
 * imports: [MatchmakingModule]
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MatchmakingQueue, Player, Team]),
    BattleModule, // Import BattleModule to access BattleService
    AuthModule, // Import AuthModule for GuestGuard
  ],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}