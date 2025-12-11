/**
 * Test suite for HealthController.
 * Tests basic health check endpoints functionality.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockTypeOrmHealthIndicator = {
      pingCheck: jest.fn(),
    };

    const mockMemoryHealthIndicator = {
      checkHeap: jest.fn(),
    };

    const mockDiskHealthIndicator = {
      checkStorage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);

    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(controller.checkHealth).toBeDefined();
    });

    it('should call health check service', async () => {
      const mockResult = {
        status: 'ok' as const,
        info: {},
        error: {},
        details: {
          memory_heap: { status: 'up' as const },
          disk: { status: 'up' as const },
        },
      };

      healthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.checkHealth();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
    });
  });

  describe('checkDatabase', () => {
    it('should be defined', () => {
      expect(controller.checkDatabase).toBeDefined();
    });

    it('should call database health check', async () => {
      const mockResult = {
        status: 'ok' as const,
        info: {},
        error: {},
        details: {
          database: { status: 'up' as const },
        },
      };

      healthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.checkDatabase();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('checkReadiness', () => {
    it('should be defined', () => {
      expect(controller.checkReadiness).toBeDefined();
    });

    it('should call readiness health check', async () => {
      const mockResult = {
        status: 'ok' as const,
        info: {},
        error: {},
        details: {
          database: { status: 'up' as const },
          readiness: { status: 'up' as const },
        },
      };

      healthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.checkReadiness();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('timestamp');
    });
  });
});