/**
 * Verification tests for targeting system requirements.
 * Tests specific requirements mentioned in the user query.
 */

import {
  findNearestEnemy,
  findWeakestEnemy,
  findTauntTarget,
  selectTarget,
} from './targeting';
import { BattleUnit } from '../types/game.types';

describe('Targeting System Requirements Verification', () => {
  // Helper function to create a mock unit
  const createMockUnit = (
    id: string,
    x: number,
    y: number,
    currentHp: number = 100,
    maxHp: number = 100,
    alive: boolean = true,
    abilities: string[] = []
  ): BattleUnit => ({
    id,
    name: `Unit ${id}`,
    role: 'tank',
    cost: 5,
    stats: {
      hp: maxHp,
      atk: 10,
      atkCount: 1,
      armor: 5,
      speed: 2,
      initiative: 5,
      dodge: 0,
    },
    range: 1,
    abilities,
    position: { x, y },
    currentHp,
    maxHp,
    team: 'bot',
    alive,
    instanceId: `${id}_1`,
  });

  describe('Requirement 1: Taunt has priority over other strategies', () => {
    it('should target taunting enemy even when using weakest strategy', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('weak_enemy', 3, 3, 5, 100, true, []), // Very weak but no taunt
        createMockUnit('taunting_tank', 5, 5, 90, 100, true, ['taunt']), // Strong but has taunt
      ];
      
      const target = selectTarget(attacker, enemies, 'weakest');
      
      // Should target taunting tank despite weakest strategy
      expect(target?.id).toBe('taunting_tank');
      expect(target?.abilities).toContain('taunt');
    });

    it('should target taunting enemy even when using nearest strategy', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('close_enemy', 3, 3, 50, 100, true, []), // Closer but no taunt
        createMockUnit('far_taunter', 7, 7, 80, 100, true, ['taunt']), // Far but has taunt
      ];
      
      const target = selectTarget(attacker, enemies, 'nearest');
      
      // Should target far taunter despite nearest strategy
      expect(target?.id).toBe('far_taunter');
      expect(target?.abilities).toContain('taunt');
    });

    it('should target taunting enemy even when using highest_threat strategy', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('high_threat', 3, 3, 20, 100, true, []), // High threat but no taunt
        createMockUnit('low_threat_taunter', 5, 5, 90, 100, true, ['taunt']), // Low threat but has taunt
      ];
      
      const target = selectTarget(attacker, enemies, 'highest_threat');
      
      // Should target taunter despite highest_threat strategy
      expect(target?.id).toBe('low_threat_taunter');
      expect(target?.abilities).toContain('taunt');
    });
  });

  describe('Requirement 2: Deterministic tiebreaking by ID', () => {
    it('should consistently choose same target when distances are equal', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('zebra', 3, 3, 50, 100), // Distance 2, ID 'zebra'
        createMockUnit('alpha', 4, 2, 50, 100), // Distance 2, ID 'alpha'
        createMockUnit('beta', 2, 4, 50, 100),  // Distance 2, ID 'beta'
      ];
      
      // Run multiple times to ensure consistency
      const results = [];
      for (let i = 0; i < 10; i++) {
        const target = findNearestEnemy(attacker, [...enemies]);
        results.push(target?.id);
      }
      
      // All results should be identical
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults).toHaveLength(1);
      
      // Should consistently pick 'alpha' (alphabetically first)
      expect(results[0]).toBe('alpha');
    });

    it('should consistently choose same target when HP values are equal', () => {
      const enemies = [
        createMockUnit('zebra', 2, 2, 50, 100),
        createMockUnit('alpha', 3, 3, 50, 100),
        createMockUnit('beta', 4, 4, 50, 100),
      ];
      
      // Run multiple times to ensure consistency
      const results = [];
      for (let i = 0; i < 10; i++) {
        const target = findWeakestEnemy([...enemies]);
        results.push(target?.id);
      }
      
      // All results should be identical
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults).toHaveLength(1);
      
      // Should consistently pick 'alpha' (alphabetically first)
      expect(results[0]).toBe('alpha');
    });

    it('should use deterministic tiebreaking for multiple taunters', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('zebra_taunter', 3, 3, 100, 100, true, ['taunt']),
        createMockUnit('alpha_taunter', 4, 4, 100, 100, true, ['taunt']),
        createMockUnit('beta_taunter', 5, 5, 100, 100, true, ['taunt']),
      ];
      
      // Run multiple times to ensure consistency
      const results = [];
      for (let i = 0; i < 10; i++) {
        const target = findTauntTarget(attacker, [...enemies]);
        results.push(target?.id);
      }
      
      // All results should be identical
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults).toHaveLength(1);
      
      // Should consistently pick 'alpha_taunter' (alphabetically first)
      expect(results[0]).toBe('alpha_taunter');
    });
  });

  describe('Requirement 3: Returns null when no living enemies', () => {
    it('should return null from findNearestEnemy when all enemies are dead', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead1', 3, 3, 0, 100, false),
        createMockUnit('dead2', 4, 4, 0, 100, false),
      ];
      
      const target = findNearestEnemy(attacker, enemies);
      
      expect(target).toBeNull();
    });

    it('should return null from findWeakestEnemy when all enemies are dead', () => {
      const enemies = [
        createMockUnit('dead1', 3, 3, 0, 100, false),
        createMockUnit('dead2', 4, 4, 0, 100, false),
      ];
      
      const target = findWeakestEnemy(enemies);
      
      expect(target).toBeNull();
    });

    it('should return null from findTauntTarget when all taunters are dead', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_taunter', 3, 3, 0, 100, false, ['taunt']),
        createMockUnit('living_normal', 4, 4, 50, 100, true, []),
      ];
      
      const target = findTauntTarget(attacker, enemies);
      
      expect(target).toBeNull();
    });

    it('should return null from selectTarget when no living enemies exist', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead1', 3, 3, 0, 100, false),
        createMockUnit('dead2', 4, 4, 0, 100, false),
      ];
      
      const target = selectTarget(attacker, enemies, 'nearest');
      
      expect(target).toBeNull();
    });

    it('should return null from selectTarget with empty enemy array', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies: BattleUnit[] = [];
      
      const target = selectTarget(attacker, enemies, 'weakest');
      
      expect(target).toBeNull();
    });
  });

  describe('Requirement 4: Does not select dead units', () => {
    it('should skip dead enemies and select living ones', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_close', 3, 3, 0, 100, false), // Dead and close
        createMockUnit('living_far', 7, 7, 50, 100, true), // Living but far
      ];
      
      const target = findNearestEnemy(attacker, enemies);
      
      expect(target?.id).toBe('living_far');
      expect(target?.alive).toBe(true);
    });

    it('should not select dead unit even if it has lowest HP', () => {
      const enemies = [
        createMockUnit('dead_weak', 3, 3, 0, 100, false), // Dead with 0 HP
        createMockUnit('living_wounded', 4, 4, 10, 100, true), // Living with low HP
      ];
      
      const target = findWeakestEnemy(enemies);
      
      expect(target?.id).toBe('living_wounded');
      expect(target?.alive).toBe(true);
      expect(target?.currentHp).toBe(10);
    });

    it('should not select dead taunter', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_taunter', 3, 3, 0, 100, false, ['taunt']),
        createMockUnit('living_normal', 4, 4, 50, 100, true, []),
      ];
      
      // Should not find any taunt target since taunter is dead
      const tauntTarget = findTauntTarget(attacker, enemies);
      expect(tauntTarget).toBeNull();
      
      // Should fall back to living normal enemy
      const target = selectTarget(attacker, enemies, 'nearest');
      expect(target?.id).toBe('living_normal');
      expect(target?.alive).toBe(true);
    });

    it('should filter out dead units from all targeting strategies', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead1', 2, 3, 0, 100, false), // Dead, closest
        createMockUnit('dead2', 3, 4, 1, 100, false), // Dead, weakest
        createMockUnit('living', 7, 7, 80, 100, true), // Living, far and strong
      ];
      
      // All strategies should select the only living enemy
      expect(selectTarget(attacker, enemies, 'nearest')?.id).toBe('living');
      expect(selectTarget(attacker, enemies, 'weakest')?.id).toBe('living');
      expect(selectTarget(attacker, enemies, 'highest_threat')?.id).toBe('living');
    });
  });

  describe('Integration: All requirements working together', () => {
    it('should handle complex scenario with taunt priority, deterministic tiebreaking, and dead unit filtering', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_taunter', 3, 3, 0, 100, false, ['taunt']), // Dead taunter
        createMockUnit('zebra_weak', 4, 4, 5, 100, true, []), // Living weak, ID 'zebra'
        createMockUnit('alpha_weak', 5, 5, 5, 100, true, []), // Living weak, ID 'alpha'
        createMockUnit('beta_taunter', 6, 6, 90, 100, true, ['taunt']), // Living taunter
      ];
      
      const target = selectTarget(attacker, enemies, 'weakest');
      
      // Should target living taunter despite weakest strategy and presence of weaker enemies
      expect(target?.id).toBe('beta_taunter');
      expect(target?.abilities).toContain('taunt');
      expect(target?.alive).toBe(true);
    });

    it('should demonstrate deterministic behavior across multiple calls with complex scenario', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_close', 3, 3, 0, 100, false), // Dead
        createMockUnit('zebra_equal', 4, 4, 50, 100, true), // Equal distance and HP
        createMockUnit('alpha_equal', 2, 6, 50, 100, true), // Equal distance and HP
        createMockUnit('beta_equal', 6, 2, 50, 100, true), // Equal distance and HP
      ];
      
      // Run multiple times with different strategies
      const nearestResults = [];
      const weakestResults = [];
      
      for (let i = 0; i < 5; i++) {
        nearestResults.push(selectTarget(attacker, [...enemies], 'nearest')?.id);
        weakestResults.push(selectTarget(attacker, [...enemies], 'weakest')?.id);
      }
      
      // All results should be consistent
      expect(new Set(nearestResults).size).toBe(1);
      expect(new Set(weakestResults).size).toBe(1);
      
      // Should consistently pick 'alpha_equal' (alphabetically first)
      expect(nearestResults[0]).toBe('alpha_equal');
      expect(weakestResults[0]).toBe('alpha_equal');
    });
  });
});