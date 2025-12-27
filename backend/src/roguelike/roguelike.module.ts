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

// Auth module for GuestGuard
import { AuthModule } from '../auth/auth.module';

// Entities
import { RoguelikeRunEntity } from './entities/run.entity';
import { RoguelikeSnapshotEntity } from './entities/snapshot.entity';
import { BattleLog } from '../entities/battle-log.entity';

// Services
import { RunService } from './run/run.service';
import { DraftService } from './draft/draft.service';
import { UpgradeService } from './upgrade/upgrade.service';
import { EconomyService } from './economy/economy.service';
import { MatchmakingService } from './matchmaking/matchmaking.service';
import { PlacementService } from './placement/placement.service';
import { RoguelikeBattleService } from './battle/battle.service';

// Controllers
import { RunController } from './run/run.controller';
import { DraftController } from './draft/draft.controller';
import { UpgradeController } from './upgrade/upgrade.controller';
import { DataController } from './data/data.controller';
import { BattleController } from './battle/battle.controller';
import { PlacementController } from './placement/placement.controller';

/**
 * RoguelikeModule provides all roguelike run mode functionality.
 *
 * Features:
 * - Faction selection (Humans, Undead)
 * - Leader selection with passive abilities and spells
 * - Draft mechanics (initial 3/5, post-battle 1/3)
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
    TypeOrmModule.forFeature([RoguelikeRunEntity, RoguelikeSnapshotEntity, BattleLog]),
    AuthModule,
  ],
  controllers: [
    RunController,
    DraftController,
    UpgradeController,
    DataController,
    BattleController,
    PlacementController,
  ],
  providers: [
    RunService,
    DraftService,
    UpgradeService,
    EconomyService,
    MatchmakingService,
    PlacementService,
    RoguelikeBattleService,
  ],
  exports: [
    RunService,
    DraftService,
    UpgradeService,
    EconomyService,
    MatchmakingService,
    PlacementService,
    RoguelikeBattleService,
  ],
})
export class RoguelikeModule {}
