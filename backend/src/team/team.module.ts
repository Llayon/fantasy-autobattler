/**
 * Team module for Fantasy Autobattler.
 * Handles team creation, management, and validation.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamValidator } from './team.validator';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Player]),
    AuthModule, // Import AuthModule for GuestGuard
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamValidator],
  exports: [TeamService, TeamValidator],
})
export class TeamModule {}