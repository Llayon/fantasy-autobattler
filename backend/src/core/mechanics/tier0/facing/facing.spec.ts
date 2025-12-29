/**
 * Tests for Facing processor
 */

import { AttackArc } from '../../config/mechanics.types';
import {
  getFacing,
  getDirectionTo,
  faceTarget,
  getAttackArc,
  isAttackerFacingTarget,
  calculateFacingResult,
  getPositionsInFront,
  getPositionsBehind,
  rotate90,
  rotate180,
} from './facing.processor';
import { FacingUnit, Position } from './facing.types';

describe('Facing Processor', () => {
  describe('getFacing', () => {
    it('should return unit facing if set', () => {
      expect(getFacing({ facing: 'N' })).toBe('N');
      expect(getFacing({ facing: 'E' })).toBe('E');
    });

    it('should return default S if facing not set', () => {
      expect(getFacing({})).toBe('S');
    });
  });

  describe('getDirectionTo', () => {
    it('should return N when target is above', () => {
      expect(getDirectionTo({ x: 5, y: 5 }, { x: 5, y: 3 })).toBe('N');
    });

    it('should return S when target is below', () => {
      expect(getDirectionTo({ x: 5, y: 5 }, { x: 5, y: 7 })).toBe('S');
    });

    it('should return E when target is to the right', () => {
      expect(getDirectionTo({ x: 5, y: 5 }, { x: 7, y: 5 })).toBe('E');
    });

    it('should return W when target is to the left', () => {
      expect(getDirectionTo({ x: 5, y: 5 }, { x: 3, y: 5 })).toBe('W');
    });

    it('should prioritize vertical when equal distance', () => {
      expect(getDirectionTo({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe('S');
      expect(getDirectionTo({ x: 0, y: 0 }, { x: 1, y: -1 })).toBe('N');
    });
  });

  describe('faceTarget', () => {
    it('should update unit facing towards target', () => {
      const unit = { position: { x: 5, y: 5 }, facing: 'N' as const };
      const result = faceTarget(unit, { x: 5, y: 7 });
      expect(result.facing).toBe('S');
    });

    it('should preserve other unit properties', () => {
      const unit = { id: 'test', position: { x: 5, y: 5 }, facing: 'N' as const, hp: 100 };
      const result = faceTarget(unit, { x: 7, y: 5 });
      expect(result.id).toBe('test');
      expect(result.hp).toBe(100);
      expect(result.facing).toBe('E');
    });
  });

  describe('getAttackArc', () => {
    const targetFacingNorth: { position: Position; facing: 'N' } = {
      position: { x: 5, y: 5 },
      facing: 'N',
    };

    it('should return FRONT when attacker is in front of target', () => {
      // Target facing N, attacker is above (N of target)
      const attackerPosition = { x: 5, y: 3 };
      expect(getAttackArc(attackerPosition, targetFacingNorth)).toBe(AttackArc.FRONT);
    });

    it('should return REAR when attacker is behind target', () => {
      // Target facing N, attacker is below (S of target)
      const attackerPosition = { x: 5, y: 7 };
      expect(getAttackArc(attackerPosition, targetFacingNorth)).toBe(AttackArc.REAR);
    });

    it('should return FLANK when attacker is to the side', () => {
      // Target facing N, attacker is to the right (E of target)
      const attackerPositionE = { x: 7, y: 5 };
      expect(getAttackArc(attackerPositionE, targetFacingNorth)).toBe(AttackArc.FLANK);

      // Target facing N, attacker is to the left (W of target)
      const attackerPositionW = { x: 3, y: 5 };
      expect(getAttackArc(attackerPositionW, targetFacingNorth)).toBe(AttackArc.FLANK);
    });

    it('should handle all facing directions', () => {
      const targetFacingS = { position: { x: 5, y: 5 }, facing: 'S' as const };
      const targetFacingE = { position: { x: 5, y: 5 }, facing: 'E' as const };
      const targetFacingW = { position: { x: 5, y: 5 }, facing: 'W' as const };

      // S facing - front is below
      expect(getAttackArc({ x: 5, y: 7 }, targetFacingS)).toBe(AttackArc.FRONT);
      expect(getAttackArc({ x: 5, y: 3 }, targetFacingS)).toBe(AttackArc.REAR);

      // E facing - front is right
      expect(getAttackArc({ x: 7, y: 5 }, targetFacingE)).toBe(AttackArc.FRONT);
      expect(getAttackArc({ x: 3, y: 5 }, targetFacingE)).toBe(AttackArc.REAR);

      // W facing - front is left
      expect(getAttackArc({ x: 3, y: 5 }, targetFacingW)).toBe(AttackArc.FRONT);
      expect(getAttackArc({ x: 7, y: 5 }, targetFacingW)).toBe(AttackArc.REAR);
    });
  });

  describe('isAttackerFacingTarget', () => {
    it('should return true when attacker faces target', () => {
      const attacker = { position: { x: 5, y: 5 }, facing: 'N' as const };
      const targetPosition = { x: 5, y: 3 };
      expect(isAttackerFacingTarget(attacker, targetPosition)).toBe(true);
    });

    it('should return false when attacker faces away', () => {
      const attacker = { position: { x: 5, y: 5 }, facing: 'S' as const };
      const targetPosition = { x: 5, y: 3 };
      expect(isAttackerFacingTarget(attacker, targetPosition)).toBe(false);
    });
  });

  describe('calculateFacingResult', () => {
    it('should return complete facing result', () => {
      const attacker: FacingUnit = { id: 'a1', position: { x: 5, y: 7 }, facing: 'N' };
      const target: FacingUnit = { id: 't1', position: { x: 5, y: 5 }, facing: 'S' };

      const result = calculateFacingResult(attacker, target);

      expect(result.attacker).toBe(attacker);
      expect(result.target).toBe(target);
      expect(result.arc).toBe(AttackArc.FRONT); // Target facing S, attacker is S of target
      expect(result.attackerFacingTarget).toBe(true); // Attacker facing N towards target
    });

    it('should detect rear attack', () => {
      const attacker: FacingUnit = { id: 'a1', position: { x: 5, y: 7 }, facing: 'N' };
      const target: FacingUnit = { id: 't1', position: { x: 5, y: 5 }, facing: 'N' };

      const result = calculateFacingResult(attacker, target);

      expect(result.arc).toBe(AttackArc.REAR); // Target facing N, attacker is S of target
    });
  });

  describe('getPositionsInFront', () => {
    it('should return positions in front of unit', () => {
      const unit = { position: { x: 5, y: 5 }, facing: 'N' as const };
      const positions = getPositionsInFront(unit, 2);

      expect(positions).toHaveLength(2);
      expect(positions[0]).toEqual({ x: 5, y: 4 });
      expect(positions[1]).toEqual({ x: 5, y: 3 });
    });

    it('should handle all directions', () => {
      const unitS = { position: { x: 5, y: 5 }, facing: 'S' as const };
      const unitE = { position: { x: 5, y: 5 }, facing: 'E' as const };
      const unitW = { position: { x: 5, y: 5 }, facing: 'W' as const };

      expect(getPositionsInFront(unitS, 1)[0]).toEqual({ x: 5, y: 6 });
      expect(getPositionsInFront(unitE, 1)[0]).toEqual({ x: 6, y: 5 });
      expect(getPositionsInFront(unitW, 1)[0]).toEqual({ x: 4, y: 5 });
    });
  });

  describe('getPositionsBehind', () => {
    it('should return positions behind unit', () => {
      const unit = { position: { x: 5, y: 5 }, facing: 'N' as const };
      const positions = getPositionsBehind(unit, 2);

      expect(positions).toHaveLength(2);
      expect(positions[0]).toEqual({ x: 5, y: 6 });
      expect(positions[1]).toEqual({ x: 5, y: 7 });
    });
  });

  describe('rotate90', () => {
    it('should rotate clockwise', () => {
      expect(rotate90({ facing: 'N' as const }, true).facing).toBe('E');
      expect(rotate90({ facing: 'E' as const }, true).facing).toBe('S');
      expect(rotate90({ facing: 'S' as const }, true).facing).toBe('W');
      expect(rotate90({ facing: 'W' as const }, true).facing).toBe('N');
    });

    it('should rotate counter-clockwise', () => {
      expect(rotate90({ facing: 'N' as const }, false).facing).toBe('W');
      expect(rotate90({ facing: 'W' as const }, false).facing).toBe('S');
      expect(rotate90({ facing: 'S' as const }, false).facing).toBe('E');
      expect(rotate90({ facing: 'E' as const }, false).facing).toBe('N');
    });
  });

  describe('rotate180', () => {
    it('should rotate 180 degrees', () => {
      expect(rotate180({ facing: 'N' as const }).facing).toBe('S');
      expect(rotate180({ facing: 'S' as const }).facing).toBe('N');
      expect(rotate180({ facing: 'E' as const }).facing).toBe('W');
      expect(rotate180({ facing: 'W' as const }).facing).toBe('E');
    });
  });
});
