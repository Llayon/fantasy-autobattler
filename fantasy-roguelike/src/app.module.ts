import { Module } from '@nestjs/common';

/**
 * Root application module.
 * Imports all feature modules for the roguelike battle simulator.
 */
@Module({
  imports: [
    // Feature modules will be added here as they are implemented:
    // - RunModule (roguelike run management)
    // - BattleModule (battle simulation)
    // - DraftModule (card drafting)
    // - UpgradeModule (unit upgrades)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
