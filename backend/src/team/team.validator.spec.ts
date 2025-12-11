/**
 * Unit tests for TeamValidator.
 * Tests validation logic for team configuration, budget constraints, and positioning.
 */

import { TeamValidator, CreateTeamRequest } from './team.validator';
import { TEAM_LIMITS } from '../config/game.constants';

describe('TeamValidator', () => {
  let validator: TeamValidator;

  beforeEach(() => {
    validator = new TeamValidator();
  });

  describe('validateTeam', () => {
    it('should validate a correct team configuration', () => {
      const teamData: CreateTeamRequest = {
        name: 'Test Team',
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
          { unitId: 'mage', position: { x: 1, y: 0 } },
          { unitId: 'priest', position: { x: 2, y: 0 } },
        ],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalCost).toBe(15); // 5 + 6 + 4
      expect(result.unitCount).toBe(3);
    });

    it('should reject team with empty name', () => {
      const teamData: CreateTeamRequest = {
        name: '',
        units: [{ unitId: 'knight', position: { x: 0, y: 0 } }],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name is required');
    });

    it('should reject team with name too long', () => {
      const teamData: CreateTeamRequest = {
        name: 'a'.repeat(101), // 101 characters
        units: [{ unitId: 'knight', position: { x: 0, y: 0 } }],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name cannot exceed 100 characters');
    });

    it('should reject team with no units', () => {
      const teamData: CreateTeamRequest = {
        name: 'Empty Team',
        units: [],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team must have at least one unit');
    });

    it('should reject team exceeding budget', () => {
      const teamData: CreateTeamRequest = {
        name: 'Expensive Team',
        units: [
          { unitId: 'berserker', position: { x: 0, y: 0 } }, // 7 cost
          { unitId: 'assassin', position: { x: 1, y: 0 } },  // 8 cost
          { unitId: 'elementalist', position: { x: 2, y: 0 } }, // 8 cost
          { unitId: 'guardian', position: { x: 3, y: 0 } }, // 6 cost
          { unitId: 'hunter', position: { x: 4, y: 0 } }, // 6 cost
        ], // Total: 35 > 30 budget
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Team cost 35 exceeds maximum budget of ${TEAM_LIMITS.BUDGET} points`);
      expect(result.totalCost).toBe(35);
    });

    it('should reject team with duplicate positions', () => {
      const teamData: CreateTeamRequest = {
        name: 'Duplicate Positions',
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
          { unitId: 'mage', position: { x: 0, y: 0 } }, // Duplicate position
        ],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate position at (0, 0)');
    });

    it('should reject units with invalid unitId', () => {
      const teamData: CreateTeamRequest = {
        name: 'Invalid Unit',
        units: [
          { unitId: 'invalid_unit', position: { x: 0, y: 0 } },
        ],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unit at index 0 has unknown unitId: invalid_unit');
    });

    it('should reject units with positions outside grid bounds', () => {
      const teamData: CreateTeamRequest = {
        name: 'Out of Bounds',
        units: [
          { unitId: 'knight', position: { x: -1, y: 0 } }, // x < 0
          { unitId: 'mage', position: { x: 8, y: 0 } },   // x >= 8
          { unitId: 'priest', position: { x: 0, y: 10 } }, // y >= 10
        ],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unit at index 0 position (-1, 0) is outside grid bounds (0-7, 0-9)');
      expect(result.errors).toContain('Unit at index 1 position (8, 0) is outside grid bounds (0-7, 0-9)');
      expect(result.errors).toContain('Unit at index 2 position (0, 10) is outside grid bounds (0-7, 0-9)');
    });

    it('should reject units outside player deployment zone', () => {
      const teamData: CreateTeamRequest = {
        name: 'Wrong Zone',
        units: [
          { unitId: 'knight', position: { x: 0, y: 2 } }, // y not in [0, 1]
          { unitId: 'mage', position: { x: 1, y: 5 } },   // y not in [0, 1]
        ],
      };

      const result = validator.validateTeam(teamData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unit at index 0 position (0, 2) is outside player deployment zone (rows 0, 1)');
      expect(result.errors).toContain('Unit at index 1 position (1, 5) is outside player deployment zone (rows 0, 1)');
    });
  });

  describe('validateUnit', () => {
    it('should validate a correct unit', () => {
      const unit = { unitId: 'knight', position: { x: 0, y: 0 } };
      const errors = validator.validateUnit(unit, 0);

      expect(errors).toHaveLength(0);
    });

    it('should reject unit with invalid unitId', () => {
      const unit = { unitId: '', position: { x: 0, y: 0 } };
      const errors = validator.validateUnit(unit, 0);

      expect(errors).toContain('Unit at index 0 must have a valid unitId string');
    });

    it('should reject unit with invalid position', () => {
      const unit = { unitId: 'knight', position: { x: 'invalid', y: 0 } as any };
      const errors = validator.validateUnit(unit, 0);

      expect(errors).toContain('Unit at index 0 position must have numeric x and y coordinates');
    });
  });

  describe('validateBudget', () => {
    it('should validate team within budget', () => {
      const result = validator.validateBudget(['knight', 'mage', 'priest']); // 5 + 6 + 4 = 15

      expect(result.isValid).toBe(true);
      expect(result.totalCost).toBe(15);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject team exceeding budget', () => {
      const result = validator.validateBudget(['berserker', 'assassin', 'elementalist', 'guardian']); // 7 + 8 + 8 + 6 = 29

      expect(result.isValid).toBe(true); // 29 <= 30
      expect(result.totalCost).toBe(29);
    });

    it('should reject unknown unit IDs', () => {
      const result = validator.validateBudget(['knight', 'invalid_unit']);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown unit ID: invalid_unit');
    });
  });

  describe('validateForBattle', () => {
    it('should validate team ready for battle', () => {
      const team = {
        units: [{ unitId: 'knight', position: { x: 0, y: 0 } }],
        totalCost: 15,
      };

      const result = validator.validateForBattle(team);

      expect(result).toBe(true);
    });

    it('should reject empty team', () => {
      const team = {
        units: [],
        totalCost: 0,
      };

      const result = validator.validateForBattle(team);

      expect(result).toBe(false);
    });

    it('should reject team exceeding budget', () => {
      const team = {
        units: [{ unitId: 'knight', position: { x: 0, y: 0 } }],
        totalCost: 35,
      };

      const result = validator.validateForBattle(team);

      expect(result).toBe(false);
    });
  });

  describe('getTeamSummary', () => {
    it('should provide correct team summary', () => {
      const units = [
        { unitId: 'knight', position: { x: 0, y: 0 } },    // tank, 5 cost
        { unitId: 'mage', position: { x: 1, y: 0 } },      // mage, 6 cost
        { unitId: 'priest', position: { x: 2, y: 0 } },    // support, 4 cost
      ];

      const summary = validator.getTeamSummary(units);

      expect(summary.unitCount).toBe(3);
      expect(summary.totalCost).toBe(15);
      expect(summary.averageCost).toBe(5); // 15 / 3
      expect(summary.roleDistribution).toEqual({
        tank: 1,
        mage: 1,
        support: 1,
      });
    });

    it('should handle empty team', () => {
      const summary = validator.getTeamSummary([]);

      expect(summary.unitCount).toBe(0);
      expect(summary.totalCost).toBe(0);
      expect(summary.averageCost).toBe(0);
      expect(summary.roleDistribution).toEqual({});
    });
  });
});