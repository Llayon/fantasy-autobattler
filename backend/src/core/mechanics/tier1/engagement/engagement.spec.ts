/**
 * Tests for Engagement processor
 */

import {
  getDistance,
  isInZoneOfControl,
  getZoneOfControlPositions,
  checkEngagement,
  checkAttackOfOpportunity,
  calculateArcherPenalty,
  updateEngagement,
  wouldTriggerDisengage,
  getEngagedUnits,
} from './engagement.processor';
import { EngagementUnit } from './engagement.types';

describe('Engagement Processor', () => {
  describe('getDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
      expect(getDistance({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(1);
    });
  });

  describe('isInZoneOfControl', () => {
    it('should return true for adjacent positions', () => {
      const unitPos = { x: 5, y: 5 };
      expect(isInZoneOfControl(unitPos, { x: 5, y: 4 })).toBe(true);
      expect(isInZoneOfControl(unitPos, { x: 5, y: 6 })).toBe(true);
      expect(isInZoneOfControl(unitPos, { x: 4, y: 5 })).toBe(true);
      expect(isInZoneOfControl(unitPos, { x: 6, y: 5 })).toBe(true);
    });

    it('should return false for distant positions', () => {
      const unitPos = { x: 5, y: 5 };
      expect(isInZoneOfControl(unitPos, { x: 5, y: 3 })).toBe(false);
      expect(isInZoneOfControl(unitPos, { x: 7, y: 5 })).toBe(false);
    });

    it('should use custom range', () => {
      const unitPos = { x: 5, y: 5 };
      const config = { zoneOfControlRange: 2 };
      expect(isInZoneOfControl(unitPos, { x: 5, y: 3 }, config)).toBe(true);
      expect(isInZoneOfControl(unitPos, { x: 5, y: 2 }, config)).toBe(false);
    });
  });

  describe('getZoneOfControlPositions', () => {
    it('should return all adjacent positions', () => {
      const positions = getZoneOfControlPositions({ x: 5, y: 5 });

      expect(positions).toHaveLength(4);
      expect(positions).toContainEqual({ x: 5, y: 4 });
      expect(positions).toContainEqual({ x: 5, y: 6 });
      expect(positions).toContainEqual({ x: 4, y: 5 });
      expect(positions).toContainEqual({ x: 6, y: 5 });
    });

    it('should return more positions with larger range', () => {
      const positions = getZoneOfControlPositions({ x: 5, y: 5 }, { zoneOfControlRange: 2 });

      expect(positions.length).toBeGreaterThan(4);
      expect(positions).toContainEqual({ x: 5, y: 3 });
      expect(positions).toContainEqual({ x: 3, y: 5 });
    });
  });

  describe('checkEngagement', () => {
    const unit: EngagementUnit = { id: 'u1', position: { x: 5, y: 5 } };

    it('should detect engagement with adjacent enemy', () => {
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
      ];
      const result = checkEngagement(unit, enemies);

      expect(result.isEngaged).toBe(true);
      expect(result.engagedWith).toContain('e1');
      expect(result.canMoveFreely).toBe(false);
    });

    it('should not detect engagement with distant enemy', () => {
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 2 } },
      ];
      const result = checkEngagement(unit, enemies);

      expect(result.isEngaged).toBe(false);
      expect(result.engagedWith).toHaveLength(0);
      expect(result.canMoveFreely).toBe(true);
    });

    it('should detect multiple engagements', () => {
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
        { id: 'e2', position: { x: 6, y: 5 } },
      ];
      const result = checkEngagement(unit, enemies);

      expect(result.isEngaged).toBe(true);
      expect(result.engagedWith).toHaveLength(2);
      expect(result.engagedWith).toContain('e1');
      expect(result.engagedWith).toContain('e2');
    });
  });

  describe('checkAttackOfOpportunity', () => {
    it('should trigger AoO when leaving ZoC', () => {
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 5 } },
      ];

      // Moving from adjacent to far
      const attackers = checkAttackOfOpportunity(
        { x: 5, y: 4 },
        { x: 5, y: 2 },
        enemies,
      );

      expect(attackers).toContain('e1');
    });

    it('should not trigger AoO when staying in ZoC', () => {
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 5 } },
      ];

      // Moving within ZoC
      const attackers = checkAttackOfOpportunity(
        { x: 5, y: 4 },
        { x: 4, y: 5 },
        enemies,
      );

      expect(attackers).toHaveLength(0);
    });

    it('should not trigger AoO when not in ZoC', () => {
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 5 } },
      ];

      // Moving far from enemy
      const attackers = checkAttackOfOpportunity(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        enemies,
      );

      expect(attackers).toHaveLength(0);
    });
  });

  describe('calculateArcherPenalty', () => {
    it('should apply penalty to engaged archer', () => {
      const archer: EngagementUnit = {
        id: 'a1',
        position: { x: 5, y: 5 },
        isRanged: true,
      };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
      ];

      const result = calculateArcherPenalty(archer, 10, enemies);

      expect(result.isEngaged).toBe(true);
      expect(result.penaltyMultiplier).toBe(0.5);
      expect(result.effectiveDamage).toBe(5);
    });

    it('should not apply penalty to non-engaged archer', () => {
      const archer: EngagementUnit = {
        id: 'a1',
        position: { x: 5, y: 5 },
        isRanged: true,
      };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 2 } },
      ];

      const result = calculateArcherPenalty(archer, 10, enemies);

      expect(result.isEngaged).toBe(false);
      expect(result.penaltyMultiplier).toBe(1.0);
      expect(result.effectiveDamage).toBe(10);
    });

    it('should not apply penalty to melee unit', () => {
      const melee: EngagementUnit = {
        id: 'm1',
        position: { x: 5, y: 5 },
        isRanged: false,
      };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
      ];

      const result = calculateArcherPenalty(melee, 10, enemies);

      expect(result.isEngaged).toBe(true);
      expect(result.penaltyMultiplier).toBe(1.0);
      expect(result.effectiveDamage).toBe(10);
    });

    it('should use custom penalty', () => {
      const archer: EngagementUnit = {
        id: 'a1',
        position: { x: 5, y: 5 },
        isRanged: true,
      };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
      ];
      const config = { archerPenalty: 0.3 };

      const result = calculateArcherPenalty(archer, 10, enemies, config);

      expect(result.penaltyMultiplier).toBe(0.7);
      expect(result.effectiveDamage).toBe(7);
    });
  });

  describe('updateEngagement', () => {
    it('should update unit with engagement info', () => {
      const unit: EngagementUnit = { id: 'u1', position: { x: 5, y: 5 } };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
      ];

      const updated = updateEngagement(unit, enemies);

      expect(updated.engaged).toBe(true);
      expect(updated.engagedWith).toContain('e1');
    });
  });

  describe('wouldTriggerDisengage', () => {
    it('should return true when engaged', () => {
      const unit: EngagementUnit = { id: 'u1', position: { x: 5, y: 5 } };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 4 } },
      ];

      expect(wouldTriggerDisengage(unit, enemies)).toBe(true);
    });

    it('should return false when not engaged', () => {
      const unit: EngagementUnit = { id: 'u1', position: { x: 5, y: 5 } };
      const enemies: EngagementUnit[] = [
        { id: 'e1', position: { x: 5, y: 2 } },
      ];

      expect(wouldTriggerDisengage(unit, enemies)).toBe(false);
    });
  });

  describe('getEngagedUnits', () => {
    it('should return all units in ZoC', () => {
      const unit: EngagementUnit = { id: 'u1', position: { x: 5, y: 5 } };
      const allUnits: EngagementUnit[] = [
        { id: 'u1', position: { x: 5, y: 5 } },
        { id: 'u2', position: { x: 5, y: 4 } },
        { id: 'u3', position: { x: 5, y: 2 } },
      ];

      const engaged = getEngagedUnits(unit, allUnits);

      expect(engaged.length).toBe(1);
      expect(engaged[0]?.id).toBe('u2');
    });
  });
});
