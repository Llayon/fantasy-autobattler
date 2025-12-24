/**
 * Unit tests for core target selection system.
 * Tests various targeting strategies, deterministic tiebreaking, and edge cases.
 * Uses minimal TargetingUnit interface instead of game-specific BattleUnit.
 *
 * @module core/battle/targeting.spec
 */

import {
  findNearestEnemy,
  findWeakestEnemy,
  findTauntTarget,
  findHighestThreatEnemy,
  calculateThreatLevel,
  selectTarget,
  selectTargetWithDetails,
  canTarget,
  getEnemiesInRange,
  recommendTargetingStrategy,
  TargetingUnit,
} from './targeting';

describe('Target Selection System (Core)', () => {
  // Helper function to create a mock unit using minimal TargetingUnit interface
  const createMockUnit = (
    id: string,
    x: number,
    y: number,
    currentHp: number = 100,
    maxHp: number = 100,
    alive: boolean = true,
    role: string = 'tank',
    atk: number = 10,
    atkCount: number = 1,
    range: number = 1,
    abilities: string[] = []
  ): TargetingUnit => ({
    id,
    instanceId: `${id}_1`,
    alive,
    position: { x, y },
    currentHp,
    maxHp,
    range,
    role,
    stats: {
      atk,
      atkCount,
    },
    abilities,
  });

  describe('findNearestEnemy', () => {
    it('should find the closest enemy by Manhattan distance', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('far', 7, 7), // Distance: 10
        createMockUnit('near', 3, 3), // Distance: 2
        createMockUnit('medium', 5, 4), // Distance: 5
      ];

      const nearest = findNearestEnemy(attacker, enemies);

      expect(nearest?.id).toBe('near');
    });

    it('should use deterministic tiebreaking by ID when distances are equal', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('zebra', 3, 3), // Distance: 2, ID 'zebra'
        createMockUnit('alpha', 4, 2), // Distance: 2, ID 'alpha'
        createMockUnit('beta', 2, 4), // Distance: 2, ID 'beta'
      ];

      const nearest = findNearestEnemy(attacker, enemies);

      // Should pick 'alpha' (alphabetically first among equal distances)
      expect(nearest?.id).toBe('alpha');
    });

    it('should ignore dead enemies', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_close', 3, 3, 0, 100, false), // Dead, close
        createMockUnit('alive_far', 7, 7, 50, 100, true), // Alive, far
      ];

      const nearest = findNearestEnemy(attacker, enemies);

      expect(nearest?.id).toBe('alive_far');
    });

    it('should return null when no living enemies', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead1', 3, 3, 0, 100, false),
        createMockUnit('dead2', 4, 4, 0, 100, false),
      ];

      const nearest = findNearestEnemy(attacker, enemies);

      expect(nearest).toBeNull();
    });
  });

  describe('findWeakestEnemy', () => {
    it('should find enemy with lowest current HP', () => {
      const enemies = [
        createMockUnit('healthy', 2, 2, 80, 100),
        createMockUnit('wounded', 3, 3, 25, 100),
        createMockUnit('critical', 4, 4, 5, 100),
      ];

      const weakest = findWeakestEnemy(enemies);

      expect(weakest?.id).toBe('critical');
      expect(weakest?.currentHp).toBe(5);
    });

    it('should use deterministic tiebreaking by ID when HP is equal', () => {
      const enemies = [
        createMockUnit('zebra', 2, 2, 50, 100),
        createMockUnit('alpha', 3, 3, 50, 100),
        createMockUnit('beta', 4, 4, 50, 100),
      ];

      const weakest = findWeakestEnemy(enemies);

      // Should pick 'alpha' (alphabetically first among equal HP)
      expect(weakest?.id).toBe('alpha');
    });

    it('should ignore dead enemies', () => {
      const enemies = [
        createMockUnit('dead_weak', 2, 2, 0, 100, false),
        createMockUnit('alive_strong', 3, 3, 90, 100, true),
      ];

      const weakest = findWeakestEnemy(enemies);

      expect(weakest?.id).toBe('alive_strong');
    });

    it('should return null when no living enemies', () => {
      const enemies = [createMockUnit('dead1', 2, 2, 0, 100, false)];

      const weakest = findWeakestEnemy(enemies);

      expect(weakest).toBeNull();
    });
  });

  describe('findTauntTarget', () => {
    it('should find enemy with Taunt ability', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('normal', 3, 3, 100, 100, true, 'tank', 10, 1, 1, []),
        createMockUnit('taunter', 4, 4, 100, 100, true, 'tank', 10, 1, 1, ['taunt']),
        createMockUnit('other', 5, 5, 100, 100, true, 'tank', 10, 1, 1, []),
      ];

      const tauntTarget = findTauntTarget(attacker, enemies);

      expect(tauntTarget?.id).toBe('taunter');
    });

    it('should use deterministic tiebreaking when multiple enemies have Taunt', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('zebra', 3, 3, 100, 100, true, 'tank', 10, 1, 1, ['taunt']),
        createMockUnit('alpha', 4, 4, 100, 100, true, 'tank', 10, 1, 1, ['taunt']),
        createMockUnit('beta', 5, 5, 100, 100, true, 'tank', 10, 1, 1, ['taunt']),
      ];

      const tauntTarget = findTauntTarget(attacker, enemies);

      // Should pick 'alpha' (alphabetically first)
      expect(tauntTarget?.id).toBe('alpha');
    });

    it('should return null when no enemies have Taunt', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('normal1', 3, 3, 100, 100, true, 'tank', 10, 1, 1, []),
        createMockUnit('normal2', 4, 4, 100, 100, true, 'tank', 10, 1, 1, ['other_ability']),
      ];

      const tauntTarget = findTauntTarget(attacker, enemies);

      expect(tauntTarget).toBeNull();
    });

    it('should ignore dead enemies with Taunt', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('dead_taunter', 3, 3, 0, 100, false, 'tank', 10, 1, 1, ['taunt']),
        createMockUnit('alive_normal', 4, 4, 50, 100, true, 'tank', 10, 1, 1, []),
      ];

      const tauntTarget = findTauntTarget(attacker, enemies);

      expect(tauntTarget).toBeNull();
    });
  });

  describe('calculateThreatLevel', () => {
    it('should calculate threat based on damage potential', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const highDamage = createMockUnit('high_dmg', 3, 3, 100, 100, true, 'melee_dps', 30, 2); // 60 damage
      const lowDamage = createMockUnit('low_dmg', 3, 3, 100, 100, true, 'tank', 10, 1); // 10 damage

      const highThreat = calculateThreatLevel(highDamage, attacker);
      const lowThreat = calculateThreatLevel(lowDamage, attacker);

      expect(highThreat).toBeGreaterThan(lowThreat);
    });

    it('should prioritize low HP enemies (easier to finish)', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const lowHp = createMockUnit('low_hp', 3, 3, 10, 100, true, 'tank', 15, 1);
      const highHp = createMockUnit('high_hp', 3, 3, 90, 100, true, 'tank', 15, 1);

      const lowHpThreat = calculateThreatLevel(lowHp, attacker);
      const highHpThreat = calculateThreatLevel(highHp, attacker);

      expect(lowHpThreat).toBeGreaterThan(highHpThreat);
    });

    it('should consider distance in threat calculation', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const close = createMockUnit('close', 3, 3, 50, 100, true, 'tank', 15, 1); // Distance 2
      const far = createMockUnit('far', 7, 7, 50, 100, true, 'tank', 15, 1); // Distance 10

      const closeThreat = calculateThreatLevel(close, attacker);
      const farThreat = calculateThreatLevel(far, attacker);

      expect(closeThreat).toBeGreaterThan(farThreat);
    });

    it('should apply role-based modifiers', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const mage = createMockUnit('mage', 3, 3, 50, 100, true, 'mage', 20, 1);
      const tank = createMockUnit('tank', 3, 3, 50, 100, true, 'tank', 20, 1);

      const mageThreat = calculateThreatLevel(mage, attacker);
      const tankThreat = calculateThreatLevel(tank, attacker);

      // Mages should be higher priority than tanks
      expect(mageThreat).toBeGreaterThan(tankThreat);
    });

    it('should return 0 for dead enemies', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const deadEnemy = createMockUnit('dead', 3, 3, 0, 100, false, 'mage', 30, 2);

      const threat = calculateThreatLevel(deadEnemy, attacker);

      expect(threat).toBe(0);
    });
  });

  describe('findHighestThreatEnemy', () => {
    it('should find enemy with highest threat level', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('low_threat', 5, 5, 90, 100, true, 'tank', 5, 1),
        createMockUnit('high_threat', 3, 3, 20, 100, true, 'mage', 25, 2),
        createMockUnit('med_threat', 4, 4, 60, 100, true, 'ranged_dps', 15, 1),
      ];

      const target = findHighestThreatEnemy(attacker, enemies);

      expect(target?.id).toBe('high_threat');
    });

    it('should use deterministic tiebreaking when threat levels are equal', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('zebra', 4, 4, 50, 100, true, 'tank', 15, 1), // Same distance (4)
        createMockUnit('alpha', 4, 4, 50, 100, true, 'tank', 15, 1), // Same distance (4)
        createMockUnit('beta', 4, 4, 50, 100, true, 'tank', 15, 1), // Same distance (4)
      ];

      const target = findHighestThreatEnemy(attacker, enemies);

      // Should pick 'alpha' (alphabetically first among equal threats)
      expect(target?.id).toBe('alpha');
    });
  });

  describe('selectTarget', () => {
    const attacker = createMockUnit('attacker', 2, 2);

    it('should prioritize Taunt over strategy', () => {
      const enemies = [
        createMockUnit('weak', 3, 3, 5, 100, true, 'tank', 10, 1, 1, []),
        createMockUnit('taunter', 5, 5, 80, 100, true, 'tank', 10, 1, 1, ['taunt']),
      ];

      const target = selectTarget(attacker, enemies, 'weakest');

      // Should target taunter despite 'weakest' strategy
      expect(target?.id).toBe('taunter');
    });

    it('should use nearest strategy correctly', () => {
      const enemies = [
        createMockUnit('far', 7, 7, 100, 100),
        createMockUnit('near', 3, 3, 100, 100),
      ];

      const target = selectTarget(attacker, enemies, 'nearest');

      expect(target?.id).toBe('near');
    });

    it('should use weakest strategy correctly', () => {
      const enemies = [
        createMockUnit('strong', 3, 3, 90, 100),
        createMockUnit('weak', 7, 7, 10, 100),
      ];

      const target = selectTarget(attacker, enemies, 'weakest');

      expect(target?.id).toBe('weak');
    });

    it('should use highest_threat strategy correctly', () => {
      const enemies = [
        createMockUnit('low_threat', 3, 3, 90, 100, true, 'tank', 5, 1),
        createMockUnit('high_threat', 4, 4, 30, 100, true, 'mage', 25, 2),
      ];

      const target = selectTarget(attacker, enemies, 'highest_threat');

      expect(target?.id).toBe('high_threat');
    });

    it('should fallback to nearest when strategy fails', () => {
      const enemies = [createMockUnit('only_enemy', 3, 3, 100, 100)];

      // Even if strategy would normally fail, should fallback to nearest
      const target = selectTarget(attacker, enemies, 'weakest');

      expect(target?.id).toBe('only_enemy');
    });

    it('should return null when no living enemies', () => {
      const enemies = [createMockUnit('dead', 3, 3, 0, 100, false)];

      const target = selectTarget(attacker, enemies, 'nearest');

      expect(target).toBeNull();
    });
  });

  describe('selectTargetWithDetails', () => {
    it('should provide detailed information about target selection', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [createMockUnit('target', 3, 3, 25, 100)];

      const result = selectTargetWithDetails(attacker, enemies, 'weakest');

      expect(result.target?.id).toBe('target');
      expect(result.strategy).toBe('weakest');
      expect(result.reason).toContain('Weakest enemy with 25 HP');
    });

    it('should explain Taunt override', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('taunter', 3, 3, 100, 100, true, 'tank', 10, 1, 1, ['taunt']),
      ];

      const result = selectTargetWithDetails(attacker, enemies, 'weakest');

      expect(result.reason).toContain('Forced to target taunter due to Taunt ability');
    });
  });

  describe('canTarget', () => {
    it('should return true when target is within range', () => {
      const attacker = createMockUnit('attacker', 2, 2, 100, 100, true, 'ranged_dps', 15, 1, 3);
      const target = createMockUnit('target', 4, 4, 50, 100); // Distance 4, within range 3? No, distance is 4

      const canAttack = canTarget(attacker, target);

      expect(canAttack).toBe(false); // Distance 4 > Range 3
    });

    it('should return true when target is exactly at range', () => {
      const attacker = createMockUnit('attacker', 2, 2, 100, 100, true, 'ranged_dps', 15, 1, 4);
      const target = createMockUnit('target', 4, 4, 50, 100); // Distance 4, range 4

      const canAttack = canTarget(attacker, target);

      expect(canAttack).toBe(true);
    });

    it('should return false for dead targets', () => {
      const attacker = createMockUnit('attacker', 2, 2, 100, 100, true, 'ranged_dps', 15, 1, 5);
      const target = createMockUnit('target', 3, 3, 0, 100, false); // Dead, within range

      const canAttack = canTarget(attacker, target);

      expect(canAttack).toBe(false);
    });
  });

  describe('getEnemiesInRange', () => {
    it('should return only enemies within attack range', () => {
      const attacker = createMockUnit('attacker', 2, 2, 100, 100, true, 'ranged_dps', 15, 1, 3);
      const enemies = [
        createMockUnit('close', 3, 3, 100, 100), // Distance 2, in range
        createMockUnit('medium', 4, 4, 100, 100), // Distance 4, out of range
        createMockUnit('adjacent', 2, 3, 100, 100), // Distance 1, in range
      ];

      const inRange = getEnemiesInRange(attacker, enemies);

      expect(inRange.map((e) => e.id)).toEqual(['close', 'adjacent']);
    });
  });

  describe('recommendTargetingStrategy', () => {
    it('should recommend appropriate strategy based on unit role', () => {
      const enemies = [createMockUnit('enemy', 3, 3, 50, 100)];

      const mage = createMockUnit('mage', 2, 2, 100, 100, true, 'mage');
      const assassin = createMockUnit('assassin', 2, 2, 100, 100, true, 'melee_dps');
      const tank = createMockUnit('tank', 2, 2, 100, 100, true, 'tank');

      expect(recommendTargetingStrategy(mage, enemies)).toBe('highest_threat');
      expect(recommendTargetingStrategy(assassin, enemies)).toBe('weakest');
      expect(recommendTargetingStrategy(tank, enemies)).toBe('nearest');
    });

    it('should default to nearest when no enemies', () => {
      const unit = createMockUnit('unit', 2, 2);
      const enemies: TargetingUnit[] = [];

      const strategy = recommendTargetingStrategy(unit, enemies);

      expect(strategy).toBe('nearest');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle empty enemy arrays gracefully', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies: TargetingUnit[] = [];

      expect(findNearestEnemy(attacker, enemies)).toBeNull();
      expect(findWeakestEnemy(enemies)).toBeNull();
      expect(findTauntTarget(attacker, enemies)).toBeNull();
      expect(selectTarget(attacker, enemies, 'nearest')).toBeNull();
    });

    it('should be deterministic across multiple calls', () => {
      const attacker = createMockUnit('attacker', 2, 2);
      const enemies = [
        createMockUnit('alpha', 3, 3, 50, 100),
        createMockUnit('beta', 4, 4, 50, 100),
        createMockUnit('gamma', 5, 5, 50, 100),
      ];

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(selectTarget(attacker, [...enemies], 'weakest')?.id);
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBe(results[0]);
      }

      // Should consistently pick 'alpha' (alphabetically first)
      expect(results[0]).toBe('alpha');
    });
  });
});
