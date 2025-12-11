/**
 * Health Module for Fantasy Autobattler API.
 * Configures health check services and indicators.
 * 
 * @fileoverview Health monitoring module configuration with
 * database connectivity and system readiness checks.
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health Module.
 * Provides health check endpoints and monitoring capabilities.
 * 
 * Features:
 * - Database connectivity monitoring
 * - System readiness checks
 * - Kubernetes probe endpoints
 * - Operational health status
 * 
 * Dependencies:
 * - @nestjs/terminus for health check framework
 * - TypeORM for database health indicators
 * 
 * @example
 * // Import in AppModule
 * @Module({
 *   imports: [HealthModule],
 * })
 * export class AppModule {}
 */
@Module({
  imports: [
    // Terminus provides health check framework
    TerminusModule,
  ],
  controllers: [
    HealthController,
  ],
  providers: [
    // Health indicators are automatically provided by TerminusModule
  ],
})
export class HealthModule {}