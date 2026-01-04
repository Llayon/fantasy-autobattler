/**
 * Unit tests for Core Mechanics 2.0 helper utilities.
 *
 * Tests immutable state update helpers used by mechanics processors.
 *
 * @module core/mechanics
 */

import { updateUnit, updateUnits, findUnit } from './helpers';
import type { BattleState, BattleUnit, TeamType } from '../types';

/**
 * Creates a mock battle unit for testing.
 */
function createMockUnit(
  id: string,
  team: TeamType = 'player',
  overrides: Partial<BattleUnit> = {},
): BattleUnit {
  return {
    id,
    instanceId: `${id}_instance`,
    name: `Unit ${id}`,
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
    position: { x: 0, y: 0 },
    currentHp: 100,
    maxHp: 100,
    team,
    alive: true,
    ...overrides,
  };
}

/**
 * Creates a mock battle state for testing.
 */
function createMockBattleState(units: BattleUnit[]): BattleState {
  return {
    units,
    round: 1,
    events: [],
  };
}

describe('helpers', () => {
  describe('updateUnit', () => {
    it('should update a single unit immutably', () => {
      const unit1 = createMockUnit('unit1', 'player', { currentHp: 100 });
      const unit2 = createMockUnit('unit2', 'bot', { currentHp: 80 });
      const state = createMockBattleState([unit1, unit2]);

      const updatedUnit1 = { ...unit1, currentHp: 50 };
      const newState = updateUnit(state, updatedUnit1);

      // Original state should be unchanged
      expect(state.units[0]?.currentHp).toBe(100);
      // New state should have updated unit
      expect(newState.units[0]?.currentHp).toBe(50);
      // Other unit should be unchanged
      expect(newState.units[1]?.currentHp).toBe(80);
    });

    it('should return new state object (immutability)', () => {
      const unit = createMockUnit('unit1');
      const state = createMockBattleState([unit]);

      const updatedUnit = { ...unit, currentHp: 50 };
      const newState = updateUnit(state, updatedUnit);

      expect(newState).not.toBe(state);
      expect(newState.units).not.toBe(state.units);
    });

    it('should preserve other state properties', () => {
      const unit = createMockUnit('unit1');
      const state = createMockBattleState([unit]);
      state.round = 5;
      state.events = [{ type: 'test' }];

      const updatedUnit = { ...unit, currentHp: 50 };
      const newState = updateUnit(state, updatedUnit);

      expect(newState.round).toBe(5);
      expect(newState.events).toEqual([{ type: 'test' }]);
    });

    it('should handle unit not found (no changes)', () => {
      const unit1 = createMockUnit('unit1');
      const state = createMockBattleState([unit1]);

      const nonExistentUnit = createMockUnit('unit999');
      const newState = updateUnit(state, nonExistentUnit);

      // State should be unchanged (unit not found)
      expect(newState.units.length).toBe(1);
      expect(newState.units[0]?.id).toBe('unit1');
    });

    it('should update unit with mechanics extensions', () => {
      const unit = createMockUnit('unit1', 'player', {
        facing: 'N',
        resolve: 100,
        engaged: false,
        faction: 'human',
      });
      const state = createMockBattleState([unit]);

      const updatedUnit = {
        ...unit,
        facing: 'S' as const,
        resolve: 75,
        engaged: true,
      };
      const newState = updateUnit(state, updatedUnit);

      expect(newState.units[0]?.facing).toBe('S');
      expect(newState.units[0]?.resolve).toBe(75);
      expect(newState.units[0]?.engaged).toBe(true);
      expect(newState.units[0]?.faction).toBe('human');
    });
  });

  describe('updateUnits', () => {
    it('should update multiple units immutably', () => {
      const unit1 = createMockUnit('unit1', 'player', { currentHp: 100 });
      const unit2 = createMockUnit('unit2', 'bot', { currentHp: 80 });
      const unit3 = createMockUnit('unit3', 'player', { currentHp: 60 });
      const state = createMockBattleState([unit1, unit2, unit3]);

      const updatedUnits = [
        { ...unit1, currentHp: 50 },
        { ...unit2, currentHp: 40 },
      ];
      const newState = updateUnits(state, updatedUnits);

      // Original state should be unchanged
      expect(state.units[0]?.currentHp).toBe(100);
      expect(state.units[1]?.currentHp).toBe(80);
      // New state should have updated units
      expect(newState.units[0]?.currentHp).toBe(50);
      expect(newState.units[1]?.currentHp).toBe(40);
      // Unmodified unit should be unchanged
      expect(newState.units[2]?.currentHp).toBe(60);
    });

    it('should return new state object (immutability)', () => {
      const unit1 = createMockUnit('unit1');
      const unit2 = createMockUnit('unit2');
      const state = createMockBattleState([unit1, unit2]);

      const updatedUnits = [{ ...unit1, currentHp: 50 }];
      const newState = updateUnits(state, updatedUnits);

      expect(newState).not.toBe(state);
      expect(newState.units).not.toBe(state.units);
    });

    it('should handle empty update array', () => {
      const unit = createMockUnit('unit1');
      const state = createMockBattleState([unit]);

      const newState = updateUnits(state, []);

      expect(newState.units[0]?.currentHp).toBe(100);
    });

    it('should handle updating all units', () => {
      const unit1 = createMockUnit('unit1', 'player', { currentHp: 100 });
      const unit2 = createMockUnit('unit2', 'bot', { currentHp: 80 });
      const state = createMockBattleState([unit1, unit2]);

      const updatedUnits = [
        { ...unit1, currentHp: 10 },
        { ...unit2, currentHp: 20 },
      ];
      const newState = updateUnits(state, updatedUnits);

      expect(newState.units[0]?.currentHp).toBe(10);
      expect(newState.units[1]?.currentHp).toBe(20);
    });

    it('should preserve unit order', () => {
      const unit1 = createMockUnit('unit1');
      const unit2 = createMockUnit('unit2');
      const unit3 = createMockUnit('unit3');
      const state = createMockBattleState([unit1, unit2, unit3]);

      // Update in reverse order
      const updatedUnits = [
        { ...unit3, currentHp: 30 },
        { ...unit1, currentHp: 10 },
      ];
      const newState = updateUnits(state, updatedUnits);

      // Order should be preserved
      expect(newState.units[0]?.id).toBe('unit1');
      expect(newState.units[1]?.id).toBe('unit2');
      expect(newState.units[2]?.id).toBe('unit3');
      // Values should be updated
      expect(newState.units[0]?.currentHp).toBe(10);
      expect(newState.units[2]?.currentHp).toBe(30);
    });
  });

  describe('findUnit', () => {
    it('should find unit by ID', () => {
      const unit1 = createMockUnit('unit1');
      const unit2 = createMockUnit('unit2');
      const state = createMockBattleState([unit1, unit2]);

      const found = findUnit(state, 'unit2');

      expect(found).toBeDefined();
      expect(found?.id).toBe('unit2');
    });

    it('should return undefined for non-existent unit', () => {
      const unit = createMockUnit('unit1');
      const state = createMockBattleState([unit]);

      const found = findUnit(state, 'nonexistent');

      expect(found).toBeUndefined();
    });

    it('should return undefined for empty state', () => {
      const state = createMockBattleState([]);

      const found = findUnit(state, 'unit1');

      expect(found).toBeUndefined();
    });

    it('should find first matching unit if duplicates exist', () => {
      // Edge case: duplicate IDs (shouldn't happen in practice)
      const unit1 = createMockUnit('unit1', 'player', { currentHp: 100 });
      const unit1Duplicate = createMockUnit('unit1', 'bot', { currentHp: 50 });
      const state = createMockBattleState([unit1, unit1Duplicate]);

      const found = findUnit(state, 'unit1');

      expect(found?.currentHp).toBe(100); // First match
    });
  });
});
