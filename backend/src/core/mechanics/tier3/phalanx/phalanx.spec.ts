/**
 * Tests for Phalanx processor
 */

import {
  getDistance,
  isAdjacent,
  getAdjacentPositions,
  findAdjacentAllies,
  calculatePhalanxBonus,
  updatePhalanxStatus,
  recalculateAllPhalanx,
  getEffectiveArmor,
  getEffectiveResolve,
  getFormationInfo,
  checkFormationBreak,
  countUnitsInPhalanx,
} from './phalanx.processor';
import { PhalanxUnit } from './phalanx.types';

describe('Phalanx Processor', () => {
  const createUnit = (overrides: Partial<PhalanxUnit> = {}): PhalanxUnit => ({
    id: 'unit1',
    position: { x: 5, y: 5 },
    team: 'player',
    isAlive: true,
    ...overrides,
  });

  describe('getDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('isAdjacent', () => {
    it('should return true for adjacent positions', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 6 })).toBe(true);
      expect(isAdjacent({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(true);
      expect(isAdjacent({ x: 5, y: 5 }, { x: 4, y: 5 })).toBe(true);
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 4 })).toBe(true);
    });

    it('should return false for non-adjacent positions', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 7 })).toBe(false);
      expect(isAdjacent({ x: 5, y: 5 }, { x: 6, y: 6 })).toBe(false);
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(false);
    });
  });

  describe('getAdjacentPositions', () => {
    it('should return 4 adjacent positions', () => {
      const positions = getAdjacentPositions({ x: 5, y: 5 });

      expect(positions).toHaveLength(4);
      expect(positions).toContainEqual({ x: 4, y: 5 });
      expect(positions).toContainEqual({ x: 6, y: 5 });
      expect(positions).toContainEqual({ x: 5, y: 4 });
      expect(positions).toContainEqual({ x: 5, y: 6 });
    });
  });

  describe('findAdjacentAllies', () => {
    it('should find adjacent allies', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });
      const ally1 = createUnit({ id: 'ally1', position: { x: 5, y: 6 } });
      const ally2 = createUnit({ id: 'ally2', position: { x: 6, y: 5 } });
      const farAlly = createUnit({ id: 'far', position: { x: 10, y: 10 } });
      const enemy = createUnit({ id: 'enemy', position: { x: 4, y: 5 }, team: 'enemy' });

      const allies = findAdjacentAllies(unit, [unit, ally1, ally2, farAlly, enemy]);

      expect(allies).toHaveLength(2);
      expect(allies.map((a) => a.id)).toContain('ally1');
      expect(allies.map((a) => a.id)).toContain('ally2');
    });

    it('should not include dead allies', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });
      const deadAlly = createUnit({ id: 'dead', position: { x: 5, y: 6 }, isAlive: false });

      const allies = findAdjacentAllies(unit, [unit, deadAlly]);

      expect(allies).toHaveLength(0);
    });
  });

  describe('calculatePhalanxBonus', () => {
    it('should calculate bonus with adjacent allies', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });
      const ally1 = createUnit({ id: 'ally1', position: { x: 5, y: 6 } });
      const ally2 = createUnit({ id: 'ally2', position: { x: 6, y: 5 } });

      const result = calculatePhalanxBonus(unit, [unit, ally1, ally2]);

      expect(result.inPhalanx).toBe(true);
      expect(result.adjacentAllies).toHaveLength(2);
      expect(result.armorBonus).toBe(2); // 2 allies * 1
      expect(result.resolveBonus).toBe(10); // 2 allies * 5
    });

    it('should not form phalanx with insufficient allies', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });

      const result = calculatePhalanxBonus(unit, [unit]);

      expect(result.inPhalanx).toBe(false);
      expect(result.armorBonus).toBe(0);
      expect(result.resolveBonus).toBe(0);
    });

    it('should cap bonuses at max', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });
      const allies = [
        createUnit({ id: 'a1', position: { x: 4, y: 5 } }),
        createUnit({ id: 'a2', position: { x: 6, y: 5 } }),
        createUnit({ id: 'a3', position: { x: 5, y: 4 } }),
        createUnit({ id: 'a4', position: { x: 5, y: 6 } }),
      ];

      const result = calculatePhalanxBonus(unit, [unit, ...allies]);

      expect(result.armorBonus).toBe(4); // 4 allies * 1 (under max of 5)
      expect(result.resolveBonus).toBe(20); // 4 allies * 5 (under max of 25)
    });

    it('should use custom config values', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });
      const ally = createUnit({ id: 'ally', position: { x: 5, y: 6 } });
      const config = { armorBonus: 3, resolveBonus: 10 };

      const result = calculatePhalanxBonus(unit, [unit, ally], config);

      expect(result.armorBonus).toBe(3);
      expect(result.resolveBonus).toBe(10);
    });
  });

  describe('updatePhalanxStatus', () => {
    it('should update unit with phalanx status', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });
      const ally = createUnit({ id: 'ally', position: { x: 5, y: 6 } });

      const result = updatePhalanxStatus(unit, [unit, ally]);

      expect(result.inPhalanx).toBe(true);
      expect(result.phalanxBonus).toBeDefined();
      expect(result.phalanxBonus?.armorBonus).toBe(1);
      expect(result.phalanxBonus?.adjacentAllies).toBe(1);
    });

    it('should clear phalanx bonus when not in formation', () => {
      const unit = createUnit({ position: { x: 5, y: 5 } });

      const result = updatePhalanxStatus(unit, [unit]);

      expect(result.inPhalanx).toBe(false);
      expect(result.phalanxBonus).toBeUndefined();
    });
  });

  describe('recalculateAllPhalanx', () => {
    it('should update all units', () => {
      const unit1 = createUnit({ id: 'u1', position: { x: 5, y: 5 } });
      const unit2 = createUnit({ id: 'u2', position: { x: 5, y: 6 } });
      const unit3 = createUnit({ id: 'u3', position: { x: 10, y: 10 } });

      const result = recalculateAllPhalanx([unit1, unit2, unit3]);

      expect(result[0]?.inPhalanx).toBe(true);
      expect(result[1]?.inPhalanx).toBe(true);
      expect(result[2]?.inPhalanx).toBe(false);
    });
  });

  describe('getEffectiveArmor', () => {
    it('should add phalanx bonus to base armor', () => {
      const bonus = { armorBonus: 3, resolveBonus: 15, adjacentAllies: 3 };

      expect(getEffectiveArmor(5, bonus)).toBe(8);
    });

    it('should return base armor without bonus', () => {
      expect(getEffectiveArmor(5)).toBe(5);
      expect(getEffectiveArmor(5, undefined)).toBe(5);
    });
  });

  describe('getEffectiveResolve', () => {
    it('should add phalanx bonus to base resolve', () => {
      const bonus = { armorBonus: 3, resolveBonus: 15, adjacentAllies: 3 };

      expect(getEffectiveResolve(100, bonus)).toBe(115);
    });

    it('should return base resolve without bonus', () => {
      expect(getEffectiveResolve(100)).toBe(100);
    });
  });

  describe('getFormationInfo', () => {
    it('should return formation info for team', () => {
      const units = [
        createUnit({ id: 'u1', position: { x: 5, y: 5 }, team: 'player' }),
        createUnit({ id: 'u2', position: { x: 5, y: 6 }, team: 'player' }),
        createUnit({ id: 'u3', position: { x: 10, y: 10 }, team: 'player' }),
        createUnit({ id: 'e1', position: { x: 0, y: 0 }, team: 'enemy' }),
      ];

      const info = getFormationInfo('player', units);

      expect(info.units).toHaveLength(2);
      expect(info.totalArmorBonus).toBe(2); // 2 units with 1 bonus each
      expect(info.totalResolveBonus).toBe(10);
    });
  });

  describe('checkFormationBreak', () => {
    it('should identify units that would lose phalanx', () => {
      const units = [
        createUnit({ id: 'u1', position: { x: 5, y: 5 } }),
        createUnit({ id: 'u2', position: { x: 5, y: 6 } }),
        createUnit({ id: 'u3', position: { x: 5, y: 7 } }),
      ];

      // Removing u2 would break the chain
      const affected = checkFormationBreak('u2', units);

      // u1 and u3 would lose phalanx (they only had u2 as neighbor)
      expect(affected).toContain('u1');
      expect(affected).toContain('u3');
    });

    it('should return empty if formation survives', () => {
      const units = [
        createUnit({ id: 'u1', position: { x: 5, y: 5 } }),
        createUnit({ id: 'u2', position: { x: 5, y: 6 } }),
        createUnit({ id: 'u3', position: { x: 6, y: 5 } }),
        createUnit({ id: 'u4', position: { x: 6, y: 6 } }),
      ];

      // Removing u1 - others still have neighbors
      const affected = checkFormationBreak('u1', units);

      // u2 and u3 still have u4 as neighbor
      expect(affected).toHaveLength(0);
    });
  });

  describe('countUnitsInPhalanx', () => {
    it('should count units in phalanx', () => {
      const units = [
        createUnit({ id: 'u1', position: { x: 5, y: 5 }, team: 'player' }),
        createUnit({ id: 'u2', position: { x: 5, y: 6 }, team: 'player' }),
        createUnit({ id: 'u3', position: { x: 10, y: 10 }, team: 'player' }),
      ];

      expect(countUnitsInPhalanx('player', units)).toBe(2);
    });

    it('should not count dead units', () => {
      const units = [
        createUnit({ id: 'u1', position: { x: 5, y: 5 }, team: 'player' }),
        createUnit({ id: 'u2', position: { x: 5, y: 6 }, team: 'player', isAlive: false }),
      ];

      expect(countUnitsInPhalanx('player', units)).toBe(0);
    });
  });
});
