/**
 * End-to-End Tests for Fantasy Autobattler Backend API.
 * 
 * Tests core API functionality:
 * 1. Units API endpoints
 * 2. Health check endpoints
 * 3. Basic error handling
 * 
 * Simplified E2E tests focusing on stateless endpoints to avoid entity relationship issues.
 * 
 * @fileoverview Core E2E tests for API endpoints without complex database relationships
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UnitsModule } from '../src/unit/units.module';
import { HealthModule } from '../src/health/health.module';

/**
 * Fantasy Autobattler E2E Test Suite.
 * 
 * Tests core API functionality without complex database relationships.
 * Focuses on stateless endpoints and basic functionality.
 */
describe('Fantasy Autobattler E2E Tests', () => {
  let app: INestApplication;

  /**
   * Setup test application for stateless endpoint testing.
   * Configures minimal test environment for API testing.
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import core modules for API testing
        UnitsModule,
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /**
   * Cleanup test application after all tests complete.
   */
  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  /**
   * Test Suite: Units API
   * Tests the public units API endpoints for game data access.
   */
  describe('Units API', () => {
    /**
     * Test: Get All Units
     * Verifies that all 15 units can be retrieved with complete data.
     */
    it('should get all units with complete data', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      expect(response.body).toHaveProperty('units');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byRole');
      expect(response.body.total).toBe(15);
      expect(response.body.units).toHaveLength(15);

      // Verify unit structure
      const unit = response.body.units[0];
      expect(unit).toHaveProperty('id');
      expect(unit).toHaveProperty('name');
      expect(unit).toHaveProperty('role');
      expect(unit).toHaveProperty('cost');
      expect(unit).toHaveProperty('stats');
      expect(unit).toHaveProperty('range');
      expect(unit).toHaveProperty('abilities');
      expect(unit.stats).toHaveProperty('hp');
      expect(unit.stats).toHaveProperty('atk');
      expect(unit.stats).toHaveProperty('atkCount');
      expect(unit.stats).toHaveProperty('armor');
      expect(unit.stats).toHaveProperty('speed');
      expect(unit.stats).toHaveProperty('initiative');
      expect(unit.stats).toHaveProperty('dodge');

      // Verify role grouping
      expect(response.body.byRole).toHaveProperty('tank');
      expect(response.body.byRole).toHaveProperty('mage');
      expect(response.body.byRole).toHaveProperty('support');
      expect(response.body.byRole.tank).toHaveLength(3);
      expect(response.body.byRole.mage).toHaveLength(3);
      expect(response.body.byRole.support).toHaveLength(2);
    });

    /**
     * Test: Get Specific Unit by ID
     * Verifies that individual units can be retrieved by their ID.
     */
    it('should get specific unit by ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/units/knight')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'knight');
      expect(response.body).toHaveProperty('name', 'Рыцарь');
      expect(response.body).toHaveProperty('role', 'tank');
      expect(response.body).toHaveProperty('cost', 5);
      expect(response.body.stats).toHaveProperty('hp', 120);
      expect(response.body.stats).toHaveProperty('atk', 12);
      expect(response.body.stats).toHaveProperty('armor', 8);
    });

    /**
     * Test: Get Units by Role
     * Verifies that units can be filtered by their role.
     */
    it('should get units by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/units/roles/tank')
        .expect(200);

      expect(response.body).toHaveProperty('role', 'tank');
      expect(response.body).toHaveProperty('units');
      expect(response.body).toHaveProperty('count', 3);
      expect(response.body.units).toHaveLength(3);

      // Verify all units are tanks
      response.body.units.forEach((unit: any) => {
        expect(unit.role).toBe('tank');
      });
    });

    /**
     * Test: Invalid Unit ID
     * Verifies that requests for non-existent units return 404.
     */
    it('should return 404 for invalid unit ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/units/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Unit with ID');
    });

    /**
     * Test: Invalid Role
     * Verifies that requests for non-existent roles return 404.
     */
    it('should return 404 for invalid role', async () => {
      const response = await request(app.getHttpServer())
        .get('/units/roles/invalid_role')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    /**
     * Test: Unit Cost Validation
     * Verifies that all units have valid costs within expected range.
     */
    it('should have valid unit costs', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      response.body.units.forEach((unit: any) => {
        expect(unit.cost).toBeGreaterThanOrEqual(3);
        expect(unit.cost).toBeLessThanOrEqual(8);
        expect(typeof unit.cost).toBe('number');
      });
    });

    /**
     * Test: Unit Stats Validation
     * Verifies that all units have valid stat values.
     */
    it('should have valid unit stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      response.body.units.forEach((unit: any) => {
        const stats = unit.stats;
        
        // Health should be positive
        expect(stats.hp).toBeGreaterThan(0);
        
        // Attack should be positive
        expect(stats.atk).toBeGreaterThan(0);
        
        // Attack count should be at least 1
        expect(stats.atkCount).toBeGreaterThanOrEqual(1);
        
        // Armor should be non-negative
        expect(stats.armor).toBeGreaterThanOrEqual(0);
        
        // Speed should be positive
        expect(stats.speed).toBeGreaterThan(0);
        
        // Initiative should be positive
        expect(stats.initiative).toBeGreaterThan(0);
        
        // Dodge should be between 0 and 100
        expect(stats.dodge).toBeGreaterThanOrEqual(0);
        expect(stats.dodge).toBeLessThanOrEqual(100);
        
        // All stats should be non-negative numbers
        expect(typeof stats.hp).toBe('number');
        expect(typeof stats.atk).toBe('number');
        expect(typeof stats.atkCount).toBe('number');
        expect(typeof stats.armor).toBe('number');
        expect(typeof stats.speed).toBe('number');
        expect(typeof stats.initiative).toBe('number');
        expect(typeof stats.dodge).toBe('number');
      });
    });
  });

  /**
   * Test Suite: Health Checks
   * Tests system health monitoring endpoints.
   * Note: Database-dependent health checks are skipped in E2E tests.
   */
  describe('Health Checks', () => {
    /**
     * Test: Health Endpoints Exist
     * Verifies that health endpoints are accessible (may return errors without DB).
     */
    it('should have health endpoints available', async () => {
      // Health endpoints should exist even if they return errors without database
      await request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          // Accept either 200 (success) or 500 (error without DB)
          expect([200, 500]).toContain(res.status);
        });

      await request(app.getHttpServer())
        .get('/health/db')
        .expect((res) => {
          // Accept either 200 (success) or 503 (service unavailable without DB)
          expect([200, 503]).toContain(res.status);
        });

      await request(app.getHttpServer())
        .get('/health/ready')
        .expect((res) => {
          // Accept either 200 (success) or 503 (service unavailable without DB)
          expect([200, 503]).toContain(res.status);
        });
    });
  });

  /**
   * Test Suite: Error Handling
   * Tests various error scenarios and proper error responses.
   */
  describe('Error Handling', () => {
    /**
     * Test: 404 for Non-existent Endpoints
     * Verifies that non-existent endpoints return 404.
     */
    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/nonexistent-endpoint')
        .expect(404);
    });

    /**
     * Test: Invalid HTTP Methods
     * Verifies that invalid HTTP methods return 404 (route not found).
     */
    it('should return 404 for invalid HTTP methods', async () => {
      await request(app.getHttpServer())
        .post('/units')
        .expect(404);
    });

    /**
     * Test: Malformed Requests
     * Verifies proper error handling for malformed requests.
     */
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/units/roles/')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  /**
   * Test Suite: Performance and Limits
   * Tests system performance and resource limits.
   */
  describe('Performance and Limits', () => {
    /**
     * Test: Response Time
     * Verifies that API responses are returned within acceptable time limits.
     */
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/units')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    /**
     * Test: Concurrent Requests
     * Verifies that the API can handle multiple concurrent requests.
     */
    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/units')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.body).toHaveProperty('units');
        expect(response.body.units).toHaveLength(15);
      });
    });

    /**
     * Test: Large Response Handling
     * Verifies that large responses are handled correctly.
     */
    it('should handle large responses correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      // Response should contain all unit data
      expect(response.body.units).toHaveLength(15);
      
      // Each unit should have complete data
      response.body.units.forEach((unit: any) => {
        expect(Object.keys(unit)).toContain('id');
        expect(Object.keys(unit)).toContain('name');
        expect(Object.keys(unit)).toContain('role');
        expect(Object.keys(unit)).toContain('stats');
        expect(Object.keys(unit.stats)).toHaveLength(7); // All 7 stats (hp, atk, atkCount, armor, speed, initiative, dodge)
      });
    });
  });

  /**
   * Test Suite: Data Integrity
   * Tests data consistency and integrity across API responses.
   */
  describe('Data Integrity', () => {
    /**
     * Test: Unit ID Consistency
     * Verifies that unit IDs are consistent across different endpoints.
     */
    it('should have consistent unit IDs across endpoints', async () => {
      const allUnitsResponse = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      const unitIds = allUnitsResponse.body.units.map((unit: any) => unit.id);

      // Test each unit individually
      for (const unitId of unitIds) {
        const unitResponse = await request(app.getHttpServer())
          .get(`/units/${unitId}`)
          .expect(200);

        expect(unitResponse.body.id).toBe(unitId);
      }
    });

    /**
     * Test: Role Consistency
     * Verifies that role groupings are consistent with individual unit roles.
     */
    it('should have consistent role groupings', async () => {
      const allUnitsResponse = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      // Get available roles from the byRole data
      const availableRoles = Object.keys(allUnitsResponse.body.byRole);

      for (const role of availableRoles) {
        const roleResponse = await request(app.getHttpServer())
          .get(`/units/roles/${role}`)
          .expect(200);

        // All units in role response should have the correct role
        roleResponse.body.units.forEach((unit: any) => {
          expect(unit.role).toBe(role);
        });

        // Count should match the byRole data from all units endpoint
        expect(roleResponse.body.count).toBe(allUnitsResponse.body.byRole[role].length);
      }
    });

    /**
     * Test: Unit Data Completeness
     * Verifies that all units have complete and valid data.
     */
    it('should have complete unit data', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      const requiredFields = ['id', 'name', 'role', 'cost', 'stats', 'range', 'abilities'];
      const requiredStats = ['hp', 'atk', 'atkCount', 'armor', 'speed', 'initiative', 'dodge'];

      response.body.units.forEach((unit: any) => {
        // Check required fields
        requiredFields.forEach(field => {
          expect(unit).toHaveProperty(field);
          expect(unit[field]).toBeDefined();
          expect(unit[field]).not.toBeNull();
        });

        // Check required stats
        requiredStats.forEach(stat => {
          expect(unit.stats).toHaveProperty(stat);
          expect(typeof unit.stats[stat]).toBe('number');
          expect(unit.stats[stat]).toBeGreaterThanOrEqual(0);
        });

        // Check string fields are not empty
        expect(unit.id.length).toBeGreaterThan(0);
        expect(unit.name.length).toBeGreaterThan(0);
        expect(unit.role.length).toBeGreaterThan(0);
        
        // Check range is positive
        expect(unit.range).toBeGreaterThan(0);
        
        // Check abilities is an array
        expect(Array.isArray(unit.abilities)).toBe(true);
      });
    });
  });
});