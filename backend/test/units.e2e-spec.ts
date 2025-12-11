/**
 * End-to-End Tests for Units API.
 * 
 * Tests Units API functionality which doesn't require database dependencies.
 * This validates the core game data endpoints that the frontend relies on.
 * 
 * @fileoverview E2E tests for Units API
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UnitsController } from '../src/unit/units.controller';

/**
 * Units API E2E Test Suite.
 * 
 * Tests the Units API endpoints that provide game data to the frontend.
 * These tests validate that all 15 units are properly defined and accessible.
 */
describe('Units API E2E Tests', () => {
  let app: INestApplication;

  /**
   * Setup test application with Units controller.
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
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
   * Test Suite: Units API Endpoints
   * Tests all Units API functionality including data validation.
   */
  describe('Units API Endpoints', () => {
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
      response.body.units.forEach((unit: { role: string }) => {
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
     * Test: Unit Data Validation
     * Verifies that all units have valid data within expected ranges.
     */
    it('should have valid unit data', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      response.body.units.forEach((unit: {
        cost: number;
        stats: {
          hp: number;
          atk: number;
          atkCount: number;
          armor: number;
          speed: number;
          initiative: number;
          dodge: number;
        };
        range: number;
        abilities: unknown[];
      }) => {
        // Cost validation
        expect(unit.cost).toBeGreaterThanOrEqual(3);
        expect(unit.cost).toBeLessThanOrEqual(8);
        
        // Stats validation
        expect(unit.stats.hp).toBeGreaterThan(0);
        expect(unit.stats.atk).toBeGreaterThan(0);
        expect(unit.stats.atkCount).toBeGreaterThanOrEqual(1);
        expect(unit.stats.armor).toBeGreaterThanOrEqual(0);
        expect(unit.stats.speed).toBeGreaterThan(0);
        expect(unit.stats.initiative).toBeGreaterThan(0);
        expect(unit.stats.dodge).toBeGreaterThanOrEqual(0);
        expect(unit.stats.dodge).toBeLessThanOrEqual(100);
        
        // Range validation
        expect(unit.range).toBeGreaterThan(0);
        
        // Abilities validation
        expect(Array.isArray(unit.abilities)).toBe(true);
      });
    });
  });
});