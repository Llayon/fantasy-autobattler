/**
 * Units Controller Tests for Fantasy Autobattler.
 * Tests public unit data endpoints and error handling.
 * 
 * @fileoverview Comprehensive test suite for UnitsController.
 * Tests all endpoints, validation, and edge cases.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UNIT_TEMPLATES } from './unit.data';
import { UNIT_ROLES } from '../config/game.constants';

describe('UnitsController', () => {
  let controller: UnitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
  });

  describe('getAllUnits', () => {
    it('should return all 15 units with role grouping', () => {
      const result = controller.getAllUnits();

      expect(result).toBeDefined();
      expect(result.units).toHaveLength(15);
      expect(result.total).toBe(15);
      expect(result.byRole).toBeDefined();
    });

    it('should group units correctly by role', () => {
      const result = controller.getAllUnits();

      // Verify all roles are present
      expect(result.byRole[UNIT_ROLES.TANK]).toHaveLength(3);
      expect(result.byRole[UNIT_ROLES.MELEE_DPS]).toHaveLength(3);
      expect(result.byRole[UNIT_ROLES.RANGED_DPS]).toHaveLength(3);
      expect(result.byRole[UNIT_ROLES.MAGE]).toHaveLength(3);
      expect(result.byRole[UNIT_ROLES.SUPPORT]).toHaveLength(2);
      expect(result.byRole[UNIT_ROLES.CONTROL]).toHaveLength(1);
    });

    it('should include complete unit data', () => {
      const result = controller.getAllUnits();
      const firstUnit = result.units[0];

      expect(firstUnit).toHaveProperty('id');
      expect(firstUnit).toHaveProperty('name');
      expect(firstUnit).toHaveProperty('role');
      expect(firstUnit).toHaveProperty('cost');
      expect(firstUnit).toHaveProperty('stats');
      expect(firstUnit).toHaveProperty('range');
      expect(firstUnit).toHaveProperty('abilities');
    });

    it('should have consistent data between units array and byRole grouping', () => {
      const result = controller.getAllUnits();
      
      // Count units in byRole groups
      const totalInGroups = Object.values(result.byRole)
        .reduce((sum, units) => sum + units.length, 0);
      
      expect(totalInGroups).toBe(result.total);
      expect(totalInGroups).toBe(result.units.length);
    });
  });

  describe('getUnitById', () => {
    it('should return knight unit by ID', () => {
      const result = controller.getUnitById('knight');

      expect(result).toBeDefined();
      expect(result.id).toBe('knight');
      expect(result.name).toBe('Рыцарь');
      expect(result.role).toBe(UNIT_ROLES.TANK);
      expect(result.cost).toBe(5);
    });

    it('should return mage unit by ID', () => {
      const result = controller.getUnitById('mage');

      expect(result).toBeDefined();
      expect(result.id).toBe('mage');
      expect(result.name).toBe('Маг');
      expect(result.role).toBe(UNIT_ROLES.MAGE);
      expect(result.cost).toBe(6);
    });

    it('should return assassin unit by ID', () => {
      const result = controller.getUnitById('assassin');

      expect(result).toBeDefined();
      expect(result.id).toBe('assassin');
      expect(result.name).toBe('Убийца');
      expect(result.role).toBe(UNIT_ROLES.MELEE_DPS);
      expect(result.cost).toBe(8);
    });

    it('should include complete unit stats', () => {
      const result = controller.getUnitById('archer');

      expect(result.stats).toBeDefined();
      expect(result.stats.hp).toBeGreaterThan(0);
      expect(result.stats.atk).toBeGreaterThan(0);
      expect(result.stats.atkCount).toBeGreaterThan(0);
      expect(result.stats.armor).toBeGreaterThanOrEqual(0);
      expect(result.stats.speed).toBeGreaterThan(0);
      expect(result.stats.initiative).toBeGreaterThan(0);
      expect(result.stats.dodge).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundException for invalid unit ID', () => {
      expect(() => {
        controller.getUnitById('invalid_unit');
      }).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for empty unit ID', () => {
      expect(() => {
        controller.getUnitById('');
      }).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for null unit ID', () => {
      expect(() => {
        controller.getUnitById('nonexistent');
      }).toThrow(NotFoundException);
    });
  });

  describe('getUnitsByRole', () => {
    it('should return all tank units', () => {
      const result = controller.getUnitsByRole(UNIT_ROLES.TANK);

      expect(result).toBeDefined();
      expect(result.role).toBe(UNIT_ROLES.TANK);
      expect(result.units).toHaveLength(3);
      expect(result.count).toBe(3);
      
      const unitIds = result.units.map(u => u.id);
      expect(unitIds).toContain('knight');
      expect(unitIds).toContain('guardian');
      expect(unitIds).toContain('berserker');
    });

    it('should return all mage units', () => {
      const result = controller.getUnitsByRole(UNIT_ROLES.MAGE);

      expect(result).toBeDefined();
      expect(result.role).toBe(UNIT_ROLES.MAGE);
      expect(result.units).toHaveLength(3);
      expect(result.count).toBe(3);
      
      const unitIds = result.units.map(u => u.id);
      expect(unitIds).toContain('mage');
      expect(unitIds).toContain('warlock');
      expect(unitIds).toContain('elementalist');
    });

    it('should return all support units', () => {
      const result = controller.getUnitsByRole(UNIT_ROLES.SUPPORT);

      expect(result).toBeDefined();
      expect(result.role).toBe(UNIT_ROLES.SUPPORT);
      expect(result.units).toHaveLength(2);
      expect(result.count).toBe(2);
      
      const unitIds = result.units.map(u => u.id);
      expect(unitIds).toContain('priest');
      expect(unitIds).toContain('bard');
    });

    it('should return control units (single unit)', () => {
      const result = controller.getUnitsByRole(UNIT_ROLES.CONTROL);

      expect(result).toBeDefined();
      expect(result.role).toBe(UNIT_ROLES.CONTROL);
      expect(result.units).toHaveLength(1);
      expect(result.count).toBe(1);
      
      const unitIds = result.units.map(u => u.id);
      expect(unitIds).toContain('enchanter');
    });

    it('should return ranged DPS units', () => {
      const result = controller.getUnitsByRole(UNIT_ROLES.RANGED_DPS);

      expect(result).toBeDefined();
      expect(result.role).toBe(UNIT_ROLES.RANGED_DPS);
      expect(result.units).toHaveLength(3);
      expect(result.count).toBe(3);
      
      const unitIds = result.units.map(u => u.id);
      expect(unitIds).toContain('archer');
      expect(unitIds).toContain('crossbowman');
      expect(unitIds).toContain('hunter');
    });

    it('should return melee DPS units', () => {
      const result = controller.getUnitsByRole(UNIT_ROLES.MELEE_DPS);

      expect(result).toBeDefined();
      expect(result.role).toBe(UNIT_ROLES.MELEE_DPS);
      expect(result.units).toHaveLength(3);
      expect(result.count).toBe(3);
      
      const unitIds = result.units.map(u => u.id);
      expect(unitIds).toContain('rogue');
      expect(unitIds).toContain('duelist');
      expect(unitIds).toContain('assassin');
    });

    it('should throw NotFoundException for invalid role', () => {
      expect(() => {
        controller.getUnitsByRole('invalid_role');
      }).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for empty role', () => {
      expect(() => {
        controller.getUnitsByRole('');
      }).toThrow(NotFoundException);
    });

    it('should include valid role names in error message', () => {
      try {
        controller.getUnitsByRole('invalid_role');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        if (error instanceof NotFoundException) {
          expect(error.message).toContain('tank');
          expect(error.message).toContain('mage');
          expect(error.message).toContain('support');
        }
      }
    });
  });

  describe('Unit Data Integrity', () => {
    it('should have all units with valid roles', () => {
      const allUnits = Object.values(UNIT_TEMPLATES);
      const validRoles = Object.values(UNIT_ROLES);

      allUnits.forEach(unit => {
        expect(validRoles).toContain(unit.role);
      });
    });

    it('should have all units with positive costs', () => {
      const allUnits = Object.values(UNIT_TEMPLATES);

      allUnits.forEach(unit => {
        expect(unit.cost).toBeGreaterThan(0);
        expect(unit.cost).toBeLessThanOrEqual(8); // Max cost from GDD
      });
    });

    it('should have all units with valid stats', () => {
      const allUnits = Object.values(UNIT_TEMPLATES);

      allUnits.forEach(unit => {
        expect(unit.stats.hp).toBeGreaterThan(0);
        expect(unit.stats.atk).toBeGreaterThan(0);
        expect(unit.stats.atkCount).toBeGreaterThan(0);
        expect(unit.stats.armor).toBeGreaterThanOrEqual(0);
        expect(unit.stats.speed).toBeGreaterThan(0);
        expect(unit.stats.initiative).toBeGreaterThan(0);
        expect(unit.stats.dodge).toBeGreaterThanOrEqual(0);
        expect(unit.stats.dodge).toBeLessThanOrEqual(100);
      });
    });

    it('should have all units with valid ranges', () => {
      const allUnits = Object.values(UNIT_TEMPLATES);

      allUnits.forEach(unit => {
        expect(unit.range).toBeGreaterThan(0);
        expect(unit.range).toBeLessThanOrEqual(5); // Max range from GDD
      });
    });

    it('should have all units with abilities arrays', () => {
      const allUnits = Object.values(UNIT_TEMPLATES);

      allUnits.forEach(unit => {
        expect(Array.isArray(unit.abilities)).toBe(true);
        expect(unit.abilities.length).toBeGreaterThan(0);
      });
    });
  });
});