/**
 * Tests for Resolve processor
 */

import { ResolveState } from '../../config/mechanics.types';
import {
  getResolveState,
  checkState,
  applyDamage,
  regenerate,
  createResolveUnit,
  updateResolve,
  isSteady,
  isWavering,
  isRouting,
  getResolvePercentage,
} from './resolve.processor';
import { ResolveUnit } from './resolve.types';

describe('Resolve Processor', () => {
  describe('getResolveState', () => {
    it('should return STEADY for high resolve', () => {
      expect(getResolveState(100)).toBe(ResolveState.STEADY);
      expect(getResolveState(51)).toBe(ResolveState.STEADY);
    });

    it('should return WAVERING for medium resolve', () => {
      expect(getResolveState(50)).toBe(ResolveState.WAVERING);
      expect(getResolveState(25)).toBe(ResolveState.WAVERING);
      expect(getResolveState(1)).toBe(ResolveState.WAVERING);
    });

    it('should return ROUTING for zero resolve', () => {
      expect(getResolveState(0)).toBe(ResolveState.ROUTING);
    });

    it('should use custom thresholds', () => {
      const config = { wavering: 30, routing: 10 };
      expect(getResolveState(31, config)).toBe(ResolveState.STEADY);
      expect(getResolveState(30, config)).toBe(ResolveState.WAVERING);
      expect(getResolveState(10, config)).toBe(ResolveState.ROUTING);
    });
  });

  describe('checkState', () => {
    it('should return steady state for healthy unit', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 100, maxResolve: 100, faction: 'human' };
      const result = checkState(unit);

      expect(result.state).toBe(ResolveState.STEADY);
      expect(result.shouldRetreat).toBe(false);
      expect(result.shouldCrumble).toBe(false);
    });

    it('should return retreat for routing human', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 0, maxResolve: 100, faction: 'human' };
      const result = checkState(unit);

      expect(result.state).toBe(ResolveState.ROUTING);
      expect(result.shouldRetreat).toBe(true);
      expect(result.shouldCrumble).toBe(false);
      expect(result.retreatChance).toBe(0.3);
    });

    it('should return crumble for routing undead', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 0, maxResolve: 100, faction: 'undead' };
      const result = checkState(unit);

      expect(result.state).toBe(ResolveState.ROUTING);
      expect(result.shouldRetreat).toBe(false);
      expect(result.shouldCrumble).toBe(true);
      expect(result.retreatChance).toBe(0.5);
    });

    it('should use custom chances', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 0, maxResolve: 100, faction: 'human' };
      const config = { humanRetreatChance: 0.5 };
      const result = checkState(unit, config);

      expect(result.retreatChance).toBe(0.5);
    });
  });

  describe('applyDamage', () => {
    it('should reduce resolve by damage amount', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 100, maxResolve: 100 };
      const result = applyDamage(unit, 20);

      expect(result.previousResolve).toBe(100);
      expect(result.newResolve).toBe(80);
      expect(result.damage).toBe(20);
    });

    it('should not go below zero', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 10, maxResolve: 100 };
      const result = applyDamage(unit, 50);

      expect(result.newResolve).toBe(0);
    });

    it('should detect state changes', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 60, maxResolve: 100 };
      const result = applyDamage(unit, 20);

      expect(result.stateChanged).toBe(true);
      expect(result.previousState).toBe(ResolveState.STEADY);
      expect(result.newState).toBe(ResolveState.WAVERING);
    });

    it('should not flag state change if state unchanged', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 100, maxResolve: 100 };
      const result = applyDamage(unit, 10);

      expect(result.stateChanged).toBe(false);
      expect(result.previousState).toBe(ResolveState.STEADY);
      expect(result.newState).toBe(ResolveState.STEADY);
    });
  });

  describe('regenerate', () => {
    it('should regenerate resolve by recovery amount', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 80, maxResolve: 100 };
      const newResolve = regenerate(unit);

      expect(newResolve).toBe(90);
    });

    it('should not exceed max resolve', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 95, maxResolve: 100 };
      const newResolve = regenerate(unit);

      expect(newResolve).toBe(100);
    });

    it('should not regenerate routing units', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 0, maxResolve: 100 };
      const newResolve = regenerate(unit);

      expect(newResolve).toBe(0);
    });

    it('should use custom recovery rate', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 50, maxResolve: 100 };
      const config = { recoveryPerTurn: 20 };
      const newResolve = regenerate(unit, config);

      expect(newResolve).toBe(70);
    });
  });

  describe('createResolveUnit', () => {
    it('should create unit with max resolve', () => {
      const unit = createResolveUnit('u1', 'human');

      expect(unit.id).toBe('u1');
      expect(unit.resolve).toBe(100);
      expect(unit.maxResolve).toBe(100);
      expect(unit.faction).toBe('human');
    });

    it('should use custom max resolve', () => {
      const config = { maxResolve: 150 };
      const unit = createResolveUnit('u1', 'undead', config);

      expect(unit.resolve).toBe(150);
      expect(unit.maxResolve).toBe(150);
    });
  });

  describe('updateResolve', () => {
    it('should update resolve value', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 100, maxResolve: 100 };
      const updated = updateResolve(unit, 50);

      expect(updated.resolve).toBe(50);
    });

    it('should clamp to valid range', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 50, maxResolve: 100 };

      expect(updateResolve(unit, -10).resolve).toBe(0);
      expect(updateResolve(unit, 150).resolve).toBe(100);
    });

    it('should preserve other properties', () => {
      const unit = { id: 'u1', resolve: 100, maxResolve: 100, faction: 'human' as const, hp: 50 };
      const updated = updateResolve(unit, 80);

      expect(updated.hp).toBe(50);
      expect(updated.faction).toBe('human');
    });
  });

  describe('state check helpers', () => {
    it('isSteady should return true for steady units', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 100, maxResolve: 100 };
      expect(isSteady(unit)).toBe(true);
    });

    it('isWavering should return true for wavering units', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 30, maxResolve: 100 };
      expect(isWavering(unit)).toBe(true);
    });

    it('isRouting should return true for routing units', () => {
      const unit: ResolveUnit = { id: 'u1', resolve: 0, maxResolve: 100 };
      expect(isRouting(unit)).toBe(true);
    });
  });

  describe('getResolvePercentage', () => {
    it('should return resolve as percentage', () => {
      expect(getResolvePercentage({ id: 'u1', resolve: 100, maxResolve: 100 })).toBe(100);
      expect(getResolvePercentage({ id: 'u1', resolve: 50, maxResolve: 100 })).toBe(50);
      expect(getResolvePercentage({ id: 'u1', resolve: 0, maxResolve: 100 })).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(getResolvePercentage({ id: 'u1', resolve: 33, maxResolve: 100 })).toBe(33);
      expect(getResolvePercentage({ id: 'u1', resolve: 1, maxResolve: 3 })).toBe(33);
    });
  });
});
