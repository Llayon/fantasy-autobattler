/**
 * Roguelike Module
 *
 * Main module for roguelike run mode.
 * Provides faction-based deck building, draft mechanics,
 * unit upgrades, and async PvP matchmaking.
 *
 * @module roguelike
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { RoguelikeRunEntity } from './entities/run.entity';
import { RoguelikeSnapshotEntity } from './entities/snapshot.entity';

// Services
import { RunService } from './run/run.service';
// import { DraftService } from './draft/draft.service';
// import { UpgradeService } from './upgrade/upgrade.service';
// import { EconomyService } from './economy/economy.service';
// import { MatchmakingService } from './matchmaking/matchmaking.service';

// Controllers
import { RunController } from './run/run.controller';
// import { DraftController } from './draft/draft.controller';
// import { UpgradeController } from './upgrade/upgrade.controller';

/**
 * RoguelikeModule provides all roguelike run mode functionality.
 *
 * Features:
 * - Faction selection (Humans, Undead)
 * - Leader selection with passive abilities and spells
 * - Draft mechanics (initial 3/4, post-battle 1/3)
 * - Unit upgrades (T1 → T2 → T3)
 * - Economy (gold rewards, upgrade costs)
 * - Async PvP matchmaking with bot fallback
 *
 * @example
 * // Import in AppModule
 * import { RoguelikeModule } from './roguelike/roguelike.module';
 *
 * @Module({
 *   imports: [RoguelikeModule],
 * })
 * export class AppModule {}
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RoguelikeRunEntity, RoguelikeSnapshotEntity]),
  ],
  controllers: [
    RunController,
    // DraftController,
    // UpgradeController,
  ],
  providers: [
    RunService,
    // DraftService,
    // UpgradeService,
    // EconomyService,
    // MatchmakingService,
  ],
  exports: [
    RunService,
    // DraftService,
    // UpgradeService,
    // EconomyService,
    // MatchmakingService,
  ],
})
export class RoguelikeModule {}
