/**
 * Rating Module for Fantasy Autobattler.
 * Provides ELO-based rating system for competitive PvP.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { Player } from '../entities/player.entity';

/**
 * Module handling player rating calculations and leaderboards.
 * Implements ELO-based competitive rating system.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}