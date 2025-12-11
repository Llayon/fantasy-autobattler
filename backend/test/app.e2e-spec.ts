/**
 * End-to-End Tests for Fantasy Autobattler Backend API.
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

describe('Fantasy Autobattler E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Units API', () => {
    it('should get all units', async () => {
      const response = await request(app.getHttpServer())
        .get('/units')
        .expect(200);

      expect(response.body).toHaveProperty('units');
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBe(15);
      expect(response.body.units).toHaveLength(15);
    });

    it('should get specific unit by ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/units/knight')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'knight');
      expect(response.body).toHaveProperty('name', 'Рыцарь');
      expect(response.body).toHaveProperty('role', 'tank');
      expect(response.body).toHaveProperty('cost', 5);
    });

    it('should return 404 for invalid unit ID', async () => {
      await request(app.getHttpServer())
        .get('/units/nonexistent')
        .expect(404);
    });
  });
});