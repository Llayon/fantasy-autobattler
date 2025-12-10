/**
 * Unit tests for Team entity.
 * Tests validation logic, budget constraints, and position validation.
 */

import { Team } from './team.entity';
import { TEAM_LIMITS } from '../config/game.constants';

describe('Team Entity', () => {
  let team: Team;

  beforeEach(() => {
    team = new Team();
    team.id = 'test-team-id';
    team.playerId = 'test-player-id';
    team.name = 'Test Team';
    team.isActive = false;
    team.createdAt = new Date();
    team.updatedAt = new Date();
  });

  describe('budget validation', () => {
    it('should allow teams within budget limit', () => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 0 } },
        { unitId: 'archer', position: { x: 1, y: 0 } }
      ];
      team.totalCost = 25; // Within TEAM_LIMITS.BUDGET (30)

      expect(() => team.validateTeam()).not.toThrow();
    });

    it('should reject teams exceeding budget limit', () => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 0 } }
      ];
      team.totalCost = 35; // Exceeds TEAM_LIMITS.BUDGET (30)

      expect(() => team.validateTeam()).toThrow(/exceeds maximum budget/);
    });

    it('should reject teams with negative cost', () => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 0 } }
      ];
      team.totalCost = -5;

      expect(() => team.validateTeam()).toThrow(/cannot be negative/);
    });
  });

  describe('units validation', () => {
    it('should require at least one unit', () => {
      team.units = [];
      team.totalCost = 0;

      expect(() => team.validateTeam()).toThrow(/must have at least one unit/);
    });

    it('should reject teams with too many units', () => {
      // Create more units than MAX_UNITS allows
      team.units = Array(TEAM_LIMITS.MAX_UNITS + 1).fill(null).map((_, i) => ({
        unitId: 'knight',
        position: { x: i % 8, y: Math.floor(i / 8) }
      }));
      team.totalCost = 20;

      expect(() => team.validateTeam()).toThrow(/cannot have more than/);
    });

    it('should validate unit structure', () => {
      team.units = [
        { unitId: '', position: { x: 0, y: 0 } } // Invalid unitId
      ];
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/must have a valid unitId/);
    });

    it('should validate position structure', () => {
      team.units = [
        { unitId: 'knight', position: { x: 'invalid', y: 0 } as any }
      ];
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/must have numeric x and y coordinates/);
    });
  });

  describe('position validation', () => {
    it('should reject duplicate positions', () => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 0 } },
        { unitId: 'archer', position: { x: 0, y: 0 } } // Duplicate position
      ];
      team.totalCost = 15;

      expect(() => team.validateTeam()).toThrow(/duplicate positions/);
    });

    it('should reject positions outside grid bounds', () => {
      team.units = [
        { unitId: 'knight', position: { x: -1, y: 0 } } // Outside bounds
      ];
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/outside grid bounds/);
    });

    it('should reject positions outside player deployment zone', () => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 5 } } // Outside rows 0-1
      ];
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/outside player deployment zone/);
    });

    it('should allow valid positions in deployment zone', () => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 0 } },
        { unitId: 'archer', position: { x: 1, y: 1 } }
      ];
      team.totalCost = 15;

      expect(() => team.validateTeam()).not.toThrow();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      team.units = [
        { unitId: 'knight', position: { x: 0, y: 0 } },
        { unitId: 'archer', position: { x: 1, y: 0 } }
      ];
      team.totalCost = 20;
    });

    it('should calculate total cost correctly', () => {
      const getUnitCost = (unitId: string): number => {
        const costs: Record<string, number> = { knight: 5, archer: 4 };
        return costs[unitId] || 0;
      };

      const calculatedCost = team.calculateTotalCost(getUnitCost);
      expect(calculatedCost).toBe(9); // 5 + 4
    });

    it('should validate team for battle', () => {
      expect(team.isValidForBattle()).toBe(true);

      // Make team invalid
      team.totalCost = 35; // Exceeds budget
      expect(team.isValidForBattle()).toBe(false);
    });

    it('should provide team summary', () => {
      const summary = team.getSummary();

      expect(summary).toEqual({
        id: 'test-team-id',
        name: 'Test Team',
        unitCount: 2,
        totalCost: 20,
        isActive: false,
        isValid: true
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined units gracefully', () => {
      team.units = [undefined as any];
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/Unit at index 0 is undefined/);
    });

    it('should handle units without positions', () => {
      team.units = [
        { unitId: 'knight', position: undefined as any }
      ];
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/must have a valid position object/);
    });

    it('should handle non-array units', () => {
      team.units = 'invalid' as any;
      team.totalCost = 10;

      expect(() => team.validateTeam()).toThrow(/must be an array/);
    });
  });
});