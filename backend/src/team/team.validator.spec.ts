/**
 * Test suite for TeamValidator service.
 * Tests all validation functions with comprehensive scenarios.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TeamValidator, UnitSelection, CreateTeamDto } from './team.validator';
import { Position } from '../types/game.types';

describe('TeamValidator', () => {
  let validator: TeamValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamValidator],
    }).compile();

    validator = module.get<TeamValidator>(TeamValidator);
  });

  describe('validateTeamBudget', () => {
    it('should validate budget within limits', () => {
      const units: UnitSelection[] = [
        { unitId: 'knight', position: { x: 0, y: 0 } },
        { unitId: 'mage', position: { x: 1, y: 0 } },
      ];

      const result = validator.validateTeamBudget(units);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(11); // knight(5) + mage(6)
      expect(result.error).toBeUndefined();
    });

    it('should reject budget exceeding limit', () => {
      const units: UnitSelection[] = [
        { unitId: 'berserker', position: { x: 0, y: 0 } }, // 8 points
        { unitId: 'elementalist', position: { x: 1, y: 0 } }, // 8 points
        { unitId: 'assassin', position: { x: 2, y: 0 } }, // 7 points
        { unitId: 'warlock', position: { x: 3, y: 0 } }, // 7 points
        { unitId: 'hunter', position: { x: 4, y: 0 } }, // 6 points
      ]; // Total: 36 points > 30 limit

      const result = validator.validateTeamBudget(units);

      expect(result.valid).toBe(false);
      expect(result.totalCost).toBe(36);
      expect(result.error).toContain('превышает бюджет');
    });

    it('should reject unknown unit IDs', () => {
      const units: UnitSelection[] = [
        { unitId: 'unknown_unit', position: { x: 0, y: 0 } },
      ];

      const result = validator.validateTeamBudget(units);

      expect(result.valid).toBe(false);
      expect(result.totalCost).toBe(0);
      expect(result.error).toContain('Неизвестный юнит');
    });

    it('should handle empty units array', () => {
      const result = validator.validateTeamBudget([]);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(0);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validatePositions', () => {
    it('should validate correct positions in deployment zone', () => {
      const positions: Position[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 1 },
        { x: 7, y: 1 },
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject positions outside deployment zone', () => {
      const positions: Position[] = [
        { x: 0, y: 2 }, // Row 2 is outside player deployment zone
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('зоне развертывания');
    });

    it('should reject positions outside grid bounds', () => {
      const positions: Position[] = [
        { x: 8, y: 0 }, // x=8 is outside 8×10 grid (0-7)
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('за пределами поля');
    });

    it('should reject negative coordinates', () => {
      const positions: Position[] = [
        { x: -1, y: 0 },
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('за пределами поля');
    });

    it('should reject duplicate positions', () => {
      const positions: Position[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // Duplicate
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Дублирующаяся позиция');
    });

    it('should reject invalid position structure', () => {
      const positions: any[] = [
        { x: 'invalid', y: 0 }, // Non-numeric x
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('числовые координаты');
    });

    it('should handle empty positions array', () => {
      const result = validator.validatePositions([]);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateNoDuplicateUnits', () => {
    it('should validate unique unit IDs', () => {
      const unitIds = ['knight', 'mage', 'priest', 'archer'];

      const result = validator.validateNoDuplicateUnits(unitIds);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject duplicate unit IDs', () => {
      const unitIds = ['knight', 'mage', 'knight']; // Duplicate knight

      const result = validator.validateNoDuplicateUnits(unitIds);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('уже добавлен');
    });

    it('should handle empty unit IDs array', () => {
      const result = validator.validateNoDuplicateUnits([]);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle single unit ID', () => {
      const result = validator.validateNoDuplicateUnits(['knight']);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateTeam', () => {
    it('should validate complete valid team', () => {
      const team: CreateTeamDto = {
        name: 'Test Team',
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
          { unitId: 'mage', position: { x: 1, y: 0 } },
          { unitId: 'priest', position: { x: 2, y: 1 } },
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.totalCost).toBe(15); // knight(5) + mage(6) + priest(4)
      expect(result.data?.unitCount).toBe(3);
    });

    it('should reject team without name', () => {
      const team: CreateTeamDto = {
        name: '',
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Название команды обязательно');
    });

    it('should reject team with long name', () => {
      const team: CreateTeamDto = {
        name: 'A'.repeat(101), // 101 characters
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('не может превышать 100 символов');
    });

    it('should reject team without units', () => {
      const team: CreateTeamDto = {
        name: 'Empty Team',
        units: [],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('хотя бы одного юнита');
    });

    it('should reject team with too many units', () => {
      const units: UnitSelection[] = [];
      for (let i = 0; i < 11; i++) { // 11 units > MAX_UNITS (10)
        units.push({
          unitId: 'priest', // Cheapest unit (4 points)
          position: { x: i % 8, y: Math.floor(i / 8) },
        });
      }

      const team: CreateTeamDto = {
        name: 'Too Many Units',
        units,
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('не может содержать более');
    });

    it('should reject team with unknown unit', () => {
      const team: CreateTeamDto = {
        name: 'Invalid Team',
        units: [
          { unitId: 'unknown_unit', position: { x: 0, y: 0 } },
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Неизвестный юнит');
    });

    it('should reject team with duplicate units', () => {
      const team: CreateTeamDto = {
        name: 'Duplicate Team',
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
          { unitId: 'knight', position: { x: 1, y: 0 } }, // Duplicate
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('уже добавлен');
    });

    it('should reject team with invalid positions', () => {
      const team: CreateTeamDto = {
        name: 'Invalid Position Team',
        units: [
          { unitId: 'knight', position: { x: 0, y: 2 } }, // Outside deployment zone
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('зоне развертывания');
    });

    it('should reject team exceeding budget', () => {
      const team: CreateTeamDto = {
        name: 'Expensive Team',
        units: [
          { unitId: 'berserker', position: { x: 0, y: 0 } }, // 8 points
          { unitId: 'elementalist', position: { x: 1, y: 0 } }, // 8 points
          { unitId: 'assassin', position: { x: 2, y: 0 } }, // 7 points
          { unitId: 'warlock', position: { x: 3, y: 0 } }, // 7 points
          { unitId: 'hunter', position: { x: 4, y: 0 } }, // 6 points
        ], // Total: 36 > 30
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('превышает бюджет');
    });

    it('should handle invalid units array', () => {
      const team: any = {
        name: 'Invalid Team',
        units: 'not an array',
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('должны быть массивом');
    });
  });

  describe('Edge Cases and Additional Tests', () => {
    it('should validate maximum budget team', () => {
      const team: CreateTeamDto = {
        name: 'Max Budget Team',
        units: [
          { unitId: 'elementalist', position: { x: 0, y: 0 } }, // 8 points
          { unitId: 'assassin', position: { x: 1, y: 0 } }, // 8 points
          { unitId: 'berserker', position: { x: 2, y: 0 } }, // 7 points
          { unitId: 'warlock', position: { x: 3, y: 0 } }, // 7 points
        ], // Total: 30 points exactly
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(true);
      expect(result.data?.totalCost).toBe(30);
    });

    it('should validate team with multiple units in deployment zone', () => {
      const units: UnitSelection[] = [
        { unitId: 'priest', position: { x: 0, y: 0 } }, // 4 points
        { unitId: 'bard', position: { x: 1, y: 0 } }, // 5 points
        { unitId: 'archer', position: { x: 2, y: 0 } }, // 4 points
        { unitId: 'knight', position: { x: 3, y: 0 } }, // 5 points
        { unitId: 'crossbowman', position: { x: 4, y: 1 } }, // 5 points
        { unitId: 'rogue', position: { x: 5, y: 1 } }, // 5 points
      ]; // Total: 28 points (within budget, all unique units)

      const team: CreateTeamDto = {
        name: 'Multi Unit Deployment',
        units,
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(true);
      expect(result.data?.unitCount).toBe(6);
      expect(result.data?.totalCost).toBe(28);
    });

    it('should handle position validation with null/undefined positions', () => {
      const positions: any[] = [
        null,
        undefined,
        { x: 0, y: 0 },
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('числовые координаты');
    });

    it('should validate positions at exact grid boundaries', () => {
      const positions: Position[] = [
        { x: 0, y: 0 }, // Min valid
        { x: 7, y: 1 }, // Max valid
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(true);
    });

    it('should reject positions at invalid boundaries', () => {
      const positions: Position[] = [
        { x: 8, y: 0 }, // x too high (max is 7)
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('за пределами поля');
    });

    it('should validate budget with single expensive unit', () => {
      const units: UnitSelection[] = [
        { unitId: 'elementalist', position: { x: 0, y: 0 } }, // 8 points (most expensive)
      ];

      const result = validator.validateTeamBudget(units);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(8);
    });

    it('should validate budget with many cheap units', () => {
      const units: UnitSelection[] = [
        { unitId: 'priest', position: { x: 0, y: 0 } }, // 4 points
        { unitId: 'archer', position: { x: 1, y: 0 } }, // 4 points
        { unitId: 'bard', position: { x: 2, y: 0 } }, // 5 points
        { unitId: 'knight', position: { x: 3, y: 0 } }, // 5 points
        { unitId: 'crossbowman', position: { x: 4, y: 0 } }, // 5 points
        { unitId: 'rogue', position: { x: 5, y: 0 } }, // 5 points
      ]; // Total: 28 points (7 units under budget)

      const result = validator.validateTeamBudget(units);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(28);
    });

    it('should handle duplicate validation with case sensitivity', () => {
      const unitIds = ['knight', 'Knight', 'KNIGHT']; // Different cases

      const result = validator.validateNoDuplicateUnits(unitIds);

      // Should be valid since unit IDs are case-sensitive
      expect(result.valid).toBe(true);
    });

    it('should validate team name with whitespace trimming', () => {
      const team: CreateTeamDto = {
        name: '  Valid Team Name  ', // Leading/trailing spaces
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(true);
    });

    it('should reject team name with only whitespace', () => {
      const team: CreateTeamDto = {
        name: '   ', // Only spaces
        units: [
          { unitId: 'knight', position: { x: 0, y: 0 } },
        ],
      };

      const result = validator.validateTeam(team);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Название команды обязательно');
    });

    it('should validate positions with floating point coordinates', () => {
      const positions: Position[] = [
        { x: 0.5, y: 0.5 }, // Floating point numbers
      ];

      const result = validator.validatePositions(positions);

      // Should be valid since they're still numbers within bounds
      expect(result.valid).toBe(true);
    });

    it('should handle very large position coordinates', () => {
      const positions: Position[] = [
        { x: 999999, y: 999999 }, // Very large numbers
      ];

      const result = validator.validatePositions(positions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('за пределами поля');
    });
  });
});