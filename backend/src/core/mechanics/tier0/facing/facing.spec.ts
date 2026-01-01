/**
 * Unit tests for Facing Processor (Tier 0)
 *
 * Tests the facing/direction system for directional combat.
 * Units have a facing direction (N/S/E/W) and attacks from different angles
 * (front/flank/rear) have different effects.
 *
 * @module core/mechanics/tier0/facing
 */

import { createFacingProcessor } from './facing.processor';
import type { FacingDirection } from './facing.types';
import type { BattleState, BattleUnit } from '../../../types';
import type { PhaseContext } from '../../processor';

/**
 * Extended BattleUnit type with facing for testing.
 */
type BattleUnitWithFacing = BattleUnit & { facing?: FacingDirection };

/**
 * Creates a minimal test unit with required properties.
 */
function createTestUnit(
  overrides: Partial<BattleUnitWithFacing> & { position: { x: number; y: number } },
): BattleUnitWithFacing {
  return {
    id: 'test-unit',
    name: 'Test Unit',
    role: 'tank',
    cost: 5,
    stats: {
      hp: 100,
      atk: 10,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 10,
      dodge: 0,
    },
    range: 1,
    abilities: [],
    currentHp: 100,
    maxHp: 100,
    team: 'player',
    alive: true,
    instanceId: 'test-instance',
    ...overrides,
  };
}

/**
 * Creates a minimal battle state for testing.
 */
function createTestState(units: BattleUnitWithFacing[]): BattleState<BattleUnitWithFacing> {
  return {
    units,
    round: 1,
    events: [],
  };
}

describe('FacingProcessor', () => {
  describe('getFacing', () => {
    it('should return default facing (S) when unit has no facing set', () => {
      const processor = createFacingProcessor();
      const unit: { facing?: FacingDirection } = {};

      const result = processor.getFacing(unit);

      expect(result).toBe('S');
    });

    it('should return unit facing when set', () => {
      const processor = createFacingProcessor();
      const directions: FacingDirection[] = ['N', 'S', 'E', 'W'];

      for (const direction of directions) {
        const unit = { facing: direction };
        expect(processor.getFacing(unit)).toBe(direction);
      }
    });
  });

  describe('faceTarget', () => {
    it('should face North when target is directly above', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 5, y: 3 }; // Above (lower Y)

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('N');
    });

    it('should face South when target is directly below', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 5, y: 7 }; // Below (higher Y)

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('S');
    });

    it('should face East when target is directly to the right', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 7, y: 5 }; // Right (higher X)

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('E');
    });

    it('should face West when target is directly to the left', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 3, y: 5 }; // Left (lower X)

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('W');
    });

    it('should face North-East diagonal as East (X dominant)', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 8, y: 3 }; // NE diagonal, X diff > Y diff

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('E');
    });

    it('should face North-East diagonal as North (Y dominant)', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 6, y: 1 }; // NE diagonal, Y diff > X diff

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('N');
    });

    it('should face South-West diagonal as West (X dominant)', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 1, y: 6 }; // SW diagonal, X diff > Y diff

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('W');
    });

    it('should face South-East diagonal as South (Y dominant)', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = { x: 6, y: 9 }; // SE diagonal, Y diff > X diff

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('S');
    });

    it('should preserve other unit properties when updating facing', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({
        id: 'knight',
        name: 'Knight',
        position: { x: 5, y: 5 },
        currentHp: 75,
      });
      const target = { x: 5, y: 3 };

      const result = processor.faceTarget(unit, target);

      expect(result.id).toBe('knight');
      expect(result.name).toBe('Knight');
      expect(result.currentHp).toBe(75);
      expect(result.position).toEqual({ x: 5, y: 5 });
    });
  });

  describe('getAttackArc', () => {
    describe('front arc (0-45 degrees)', () => {
      it('should return front when attacker is directly in front (facing N)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createTestUnit({ position: { x: 5, y: 3 } }); // Above

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('front');
      });

      it('should return front when attacker is directly in front (facing S)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'S',
        });
        const attacker = createTestUnit({ position: { x: 5, y: 7 } }); // Below

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('front');
      });

      it('should return front when attacker is directly in front (facing E)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'E',
        });
        const attacker = createTestUnit({ position: { x: 7, y: 5 } }); // Right

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('front');
      });

      it('should return front when attacker is directly in front (facing W)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'W',
        });
        const attacker = createTestUnit({ position: { x: 3, y: 5 } }); // Left

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('front');
      });

      it('should return front when attacker is within 45 degrees of facing', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        // Attacker at slight angle (within 45 degrees)
        const attacker = createTestUnit({ position: { x: 6, y: 3 } });

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('front');
      });
    });

    describe('flank arc (45-135 degrees)', () => {
      it('should return flank when attacker is to the side (facing N, attack from E)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createTestUnit({ position: { x: 7, y: 5 } }); // Right side

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('flank');
      });

      it('should return flank when attacker is to the side (facing N, attack from W)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createTestUnit({ position: { x: 3, y: 5 } }); // Left side

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('flank');
      });

      it('should return flank when attacker is to the side (facing E, attack from N)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'E',
        });
        const attacker = createTestUnit({ position: { x: 5, y: 3 } }); // Above

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('flank');
      });

      it('should return flank when attacker is to the side (facing S, attack from E)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'S',
        });
        const attacker = createTestUnit({ position: { x: 7, y: 5 } }); // Right side

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('flank');
      });
    });

    describe('rear arc (135-180 degrees)', () => {
      it('should return rear when attacker is directly behind (facing N)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createTestUnit({ position: { x: 5, y: 7 } }); // Behind (South)

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('rear');
      });

      it('should return rear when attacker is directly behind (facing S)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'S',
        });
        const attacker = createTestUnit({ position: { x: 5, y: 3 } }); // Behind (North)

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('rear');
      });

      it('should return rear when attacker is directly behind (facing E)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'E',
        });
        const attacker = createTestUnit({ position: { x: 3, y: 5 } }); // Behind (West)

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('rear');
      });

      it('should return rear when attacker is directly behind (facing W)', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'W',
        });
        const attacker = createTestUnit({ position: { x: 7, y: 5 } }); // Behind (East)

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('rear');
      });

      it('should return rear when attacker is at rear diagonal', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        // Attacker at rear diagonal (more than 135 degrees from facing)
        const attacker = createTestUnit({ position: { x: 4, y: 8 } });

        const result = processor.getAttackArc(attacker, target);

        expect(result).toBe('rear');
      });
    });

    describe('default facing', () => {
      it('should use default facing (S) when target has no facing set', () => {
        const processor = createFacingProcessor();
        const target = createTestUnit({
          position: { x: 5, y: 5 },
        });
        // Ensure no facing property
        delete target.facing;

        // Attacker from below (South) - should be front for S-facing target
        const attackerFront = createTestUnit({ position: { x: 5, y: 7 } });
        expect(processor.getAttackArc(attackerFront, target)).toBe('front');

        // Attacker from above (North) - should be rear for S-facing target
        const attackerRear = createTestUnit({ position: { x: 5, y: 3 } });
        expect(processor.getAttackArc(attackerRear, target)).toBe('rear');
      });
    });
  });

  describe('apply', () => {
    it('should not modify state for non-pre_attack phases', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const target = createTestUnit({
        id: 'target',
        instanceId: 'target-instance',
        position: { x: 5, y: 3 },
      });
      const state = createTestState([unit, target]);
      const context: PhaseContext = {
        activeUnit: unit as BattleUnit,
        target: target as BattleUnit,
        seed: 12345,
      };

      const phases: Array<'turn_start' | 'movement' | 'attack' | 'post_attack' | 'turn_end'> = [
        'turn_start',
        'movement',
        'attack',
        'post_attack',
        'turn_end',
      ];

      for (const phase of phases) {
        const result = processor.apply(phase, state as BattleState, context);
        expect(result).toBe(state); // Same reference, no modification
      }
    });

    it('should not modify state when no target in pre_attack phase', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 5, y: 5 } });
      const state = createTestState([unit]);
      const context = {
        activeUnit: unit as BattleUnit,
        seed: 12345,
      } as PhaseContext;

      const result = processor.apply('pre_attack', state as BattleState, context);

      expect(result).toBe(state);
    });

    it('should auto-face active unit toward target in pre_attack phase', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({
        position: { x: 5, y: 5 },
        facing: 'S',
      });
      const target = createTestUnit({
        id: 'target',
        instanceId: 'target-instance',
        position: { x: 5, y: 3 }, // Above (North)
      });
      const state = createTestState([unit, target]);
      const context: PhaseContext = {
        activeUnit: unit as BattleUnit,
        target: target as BattleUnit,
        seed: 12345,
      };

      const result = processor.apply('pre_attack', state as BattleState, context);

      // Find updated unit in state
      const updatedUnit = result.units.find((u) => u.instanceId === unit.instanceId) as BattleUnitWithFacing;
      expect(updatedUnit?.facing).toBe('N'); // Should now face North toward target
    });

    it('should preserve other units in state when updating facing', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({
        position: { x: 5, y: 5 },
        facing: 'S',
      });
      const target = createTestUnit({
        id: 'target',
        instanceId: 'target-instance',
        position: { x: 5, y: 3 },
      });
      const bystander = createTestUnit({
        id: 'bystander',
        instanceId: 'bystander-instance',
        position: { x: 0, y: 0 },
        facing: 'E',
      });
      const state = createTestState([unit, target, bystander]);
      const context: PhaseContext = {
        activeUnit: unit as BattleUnit,
        target: target as BattleUnit,
        seed: 12345,
      };

      const result = processor.apply('pre_attack', state as BattleState, context);

      // Bystander should be unchanged
      const updatedBystander = result.units.find(
        (u) => u.instanceId === 'bystander-instance',
      ) as BattleUnitWithFacing;
      expect(updatedBystander?.facing).toBe('E');
      expect(updatedBystander?.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('edge cases', () => {
    it('should handle same position (attacker on target)', () => {
      const processor = createFacingProcessor();
      const target = createTestUnit({
        position: { x: 5, y: 5 },
        facing: 'N',
      });
      const attacker = createTestUnit({ position: { x: 5, y: 5 } }); // Same position

      // Should not throw, behavior is implementation-defined
      const result = processor.getAttackArc(attacker, target);
      expect(['front', 'flank', 'rear']).toContain(result);
    });

    it('should handle large coordinate values', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: 1000, y: 1000 } });
      const target = { x: 1000, y: 500 }; // Far above

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('N');
    });

    it('should handle negative coordinate values', () => {
      const processor = createFacingProcessor();
      const unit = createTestUnit({ position: { x: -5, y: -5 } });
      const target = { x: -5, y: -10 }; // Above (more negative Y)

      const result = processor.faceTarget(unit, target);

      expect(result.facing).toBe('N');
    });
  });
});
