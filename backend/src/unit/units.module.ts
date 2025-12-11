/**
 * Units Module for Fantasy Autobattler.
 * Provides unit data endpoints without database dependencies.
 * 
 * @fileoverview NestJS module for unit-related functionality.
 * Serves static unit data from unit.data.ts for public consumption.
 */

import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';

/**
 * Units module providing public unit data endpoints.
 * 
 * This module serves static unit information and does not require:
 * - Database connections (uses static data)
 * - Authentication (public endpoints)
 * - External services (self-contained)
 * 
 * Exports: None (controller-only module)
 */
@Module({
  controllers: [UnitsController],
})
export class UnitsModule {}