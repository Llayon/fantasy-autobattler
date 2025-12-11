/**
 * Health Check Controller for Fantasy Autobattler API.
 * Provides system health monitoring endpoints for operational readiness.
 * 
 * @fileoverview Health monitoring endpoints for application status,
 * database connectivity, and service readiness checks.
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

/**
 * Health status response interface.
 * Standardized format for health check responses.
 */
interface HealthStatus {
  /** Overall system status */
  status: 'ok' | 'error' | 'shutting_down';
  /** Detailed health information */
  details: Record<string, unknown>;
  /** Timestamp of health check */
  timestamp: string;
  /** Application version */
  version: string;
}

/**
 * Health Check Controller.
 * Provides endpoints for monitoring application health and readiness.
 * 
 * Endpoints:
 * - GET /health - Overall system health status
 * - GET /health/db - Database connectivity check
 * - GET /health/ready - Service readiness for traffic
 * 
 * Used by:
 * - Load balancers for health checks
 * - Kubernetes liveness/readiness probes
 * - Monitoring systems for alerting
 * - Operations teams for troubleshooting
 * 
 * @example
 * // Check overall health
 * GET /health
 * // Response: { status: 'ok', details: {...}, timestamp: '2023-...' }
 * 
 * // Check database connectivity
 * GET /health/db
 * // Response: { status: 'ok', details: { database: { status: 'up' } } }
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly version = process.env['npm_package_version'] || '1.0.0';

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly dbHealthIndicator: TypeOrmHealthIndicator,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly diskHealthIndicator: DiskHealthIndicator,
  ) {}

  /**
   * General health check endpoint.
   * Returns overall system status including all subsystems.
   * 
   * @returns Promise<HealthStatus> Overall system health status
   * @throws HealthCheckError When system is unhealthy
   * 
   * @example
   * const health = await fetch('/health');
   * if (health.status === 200) {
   *   console.log('System is healthy');
   * }
   */
  @Get()
  @ApiOperation({
    summary: 'Overall system health check',
    description: 'Returns comprehensive health status of all system components',
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        details: { type: 'object' },
        timestamp: { type: 'string' },
        version: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'System is unhealthy',
  })
  @HealthCheck()
  async checkHealth(): Promise<HealthStatus> {
    this.logger.debug('Performing general health check');

    try {
      const result = await this.healthCheckService.check([
        // Memory usage check (heap should be under 150MB)
        () => this.memoryHealthIndicator.checkHeap('memory_heap', 150 * 1024 * 1024),
        // Disk usage check (should have at least 250MB free)
        () => this.diskHealthIndicator.checkStorage('disk', { 
          path: '/', 
          thresholdPercent: 0.9 
        }),
      ]);

      const healthStatus: HealthStatus = {
        status: 'ok',
        details: result.details || {},
        timestamp: new Date().toISOString(),
        version: this.version,
      };

      this.logger.log('General health check completed successfully', {
        status: healthStatus.status,
        checks: Object.keys(result.details || {}),
      });

      return healthStatus;
    } catch (error) {
      this.logger.error('General health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw to let NestJS handle the HTTP status
      throw error;
    }
  }

  /**
   * Database connectivity health check.
   * Specifically tests database connection and responsiveness.
   * 
   * @returns Promise<HealthStatus> Database health status with timestamp
   * @throws ServiceUnavailableException When database is unreachable
   * 
   * @example
   * const dbHealth = await fetch('/health/db');
   * if (dbHealth.status === 200) {
   *   console.log('Database is connected');
   * }
   */
  @Get('db')
  @ApiOperation({
    summary: 'Database connectivity check',
    description: 'Tests database connection and query responsiveness',
  })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy and responsive',
  })
  @ApiResponse({
    status: 503,
    description: 'Database is unreachable or unresponsive',
  })
  @HealthCheck()
  async checkDatabase(): Promise<HealthStatus> {
    this.logger.debug('Performing database health check');

    try {
      const result = await this.healthCheckService.check([
        () => this.dbHealthIndicator.pingCheck('database'),
      ]);

      const dbStatus = result.details?.['database']?.status || 'unknown';
      
      this.logger.log('Database health check completed successfully', {
        status: result.status,
        database: dbStatus,
      });

      return {
        status: result.status,
        details: result.details || {},
        timestamp: new Date().toISOString(),
        version: this.version,
      };
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }

  /**
   * Readiness probe endpoint.
   * Indicates if the service is ready to accept traffic.
   * 
   * Checks:
   * - Database connectivity
   * - Application readiness state
   * 
   * @returns Promise<HealthStatus> Service readiness status
   * @throws ServiceUnavailableException When service is not ready
   * 
   * @example
   * // Kubernetes readiness probe
   * readinessProbe:
   *   httpGet:
   *     path: /health/ready
   *     port: 3001
   */
  @Get('ready')
  @ApiOperation({
    summary: 'Service readiness check',
    description: 'Indicates if service is ready to accept traffic (Kubernetes readiness probe)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to accept traffic',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready (starting up or degraded)',
  })
  @HealthCheck()
  async checkReadiness(): Promise<HealthStatus> {
    this.logger.debug('Performing readiness check');

    try {
      // Check all critical dependencies for readiness
      const result = await this.healthCheckService.check([
        // Database must be available for service to be ready
        () => this.dbHealthIndicator.pingCheck('database'),
        // Application readiness check
        () => this.checkApplicationReadiness(),
      ]);

      const readinessStatus: HealthStatus = {
        status: 'ok',
        details: result.details || {},
        timestamp: new Date().toISOString(),
        version: this.version,
      };

      this.logger.debug('Readiness check completed successfully', {
        status: readinessStatus.status,
        checks: Object.keys(result.details || {}),
      });

      return readinessStatus;
    } catch (error) {
      this.logger.error('Readiness check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }

  /**
   * Application-specific readiness check.
   * Verifies that the application is ready to handle requests.
   * 
   * @returns Promise<{ readiness: { status: 'up' } }> Application readiness status
   * @private
   */
  private async checkApplicationReadiness(): Promise<{ readiness: { status: 'up' } }> {
    // Add application-specific readiness logic here
    // For example: check if all required services are initialized
    // For now, we assume the application is always ready if it's running
    return {
      readiness: {
        status: 'up',
      },
    };
  }
}