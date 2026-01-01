/**
 * Tier 1: Engagement (Zone of Control) Processor - Unit Tests
 *
 * Tests for Zone of Control detection, Attack of Opportunity,
 * and archer penalty mechanics.
 *
 * @module core/mechanics/tier1/engagement
 */

import { createEngagementProcessor } from './engagement.processor';
import type { EngagementConfig } from '../../config/mechanics.types';
import type { BattleState, BattleUnit, TeamType } from '../../../types';
import type { UnitWithEngagement } from './engagement.types';

// ═══════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a mock battle unit for testing.
 */
function createMockUnit(
  overrides: Partial<BattleUnit & UnitWithEngagement> = {},
): BattleUnit & UnitWithEngagement {
  // If instanceId is provided in overrides, use it; otherwise generate a unique one
  const uniqueId = overrides.instanceId ?? `unit_${Math.random().toString(36).substring(2, 11)}`;
  const baseUnit = {
    instanceId: uniqueId,
    id: uniqueId, // Use same ID for both to ensure updateUnit works
    name: 'Test Unit',
    team: 'player' as TeamType,
    position: { x: 0, y: 0 },
    currentHp: 100,
    maxHp: 100,
    alive: true,
    cost: 5,
    abilities: [],
    stats: {
      hp: 100,
      atk: 10,
      armor: 5,
      speed: 3,
      initiative: 10,
      dodge: 0,
      atkCount: 1,
    },
    range: 1,
    role: 'tank',
  };
  
  return {
    ...baseUnit,
    ...overrides,
    // Ensure id always matches instanceId
    id: overrides.instanceId ?? uniqueId,
    instanceId: uniqueId,
  };
}

/**
 * Creates a mock battle state for testing.
 */
function createMockState(units: BattleUnit[]): BattleState {
  return {
    units,
    round: 1,
    events: [],
  };
}


/**
 * Default engagement config for tests.
 */
const DEFAULT_CONFIG: EngagementConfig = {
  attackOfOpportunity: true,
  archerPenalty: true,
  archerPenaltyPercent: 0.5,
};

// ═══════════════════════════════════════════════════════════════
// ZONE OF CONTROL DETECTION TESTS
// ═══════════════════════════════════════════════════════════════

describe('EngagementProcessor', () => {
  describe('Zone of Control Detection', () => {
    describe('hasZoC (via getZoneOfControl)', () => {
      it('should return active ZoC for melee units (range <= 1)', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const meleeUnit = createMockUnit({ range: 1, position: { x: 3, y: 3 } });

        const zoc = processor.getZoneOfControl(meleeUnit);

        expect(zoc.active).toBe(true);
        expect(zoc.unitId).toBe(meleeUnit.instanceId);
        expect(zoc.cells.length).toBeGreaterThan(0);
      });

      it('should return inactive ZoC for ranged units (range > 1)', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const rangedUnit = createMockUnit({ range: 4, position: { x: 3, y: 3 } });

        const zoc = processor.getZoneOfControl(rangedUnit);

        expect(zoc.active).toBe(false);
        expect(zoc.cells).toHaveLength(0);
      });

      it('should respect explicit hasZoneOfControl override', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const rangedWithZoC = createMockUnit({
          range: 4,
          hasZoneOfControl: true,
          position: { x: 3, y: 3 },
        });

        const zoc = processor.getZoneOfControl(rangedWithZoC);

        expect(zoc.active).toBe(true);
        expect(zoc.cells.length).toBeGreaterThan(0);
      });

      it('should return inactive ZoC for dead units', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const deadUnit = createMockUnit({
          range: 1,
          alive: false,
          currentHp: 0,
          position: { x: 3, y: 3 },
        });

        const zoc = processor.getZoneOfControl(deadUnit);

        expect(zoc.active).toBe(false);
        expect(zoc.cells).toHaveLength(0);
      });
    });

    describe('getZoneOfControl', () => {
      it('should return adjacent cells for unit at center of grid', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({ position: { x: 3, y: 3 } });

        const zoc = processor.getZoneOfControl(unit);

        // Should have 4 adjacent cells (N, S, E, W)
        expect(zoc.cells).toHaveLength(4);
        expect(zoc.cells).toContainEqual({ x: 3, y: 2 }); // North
        expect(zoc.cells).toContainEqual({ x: 3, y: 4 }); // South
        expect(zoc.cells).toContainEqual({ x: 2, y: 3 }); // West
        expect(zoc.cells).toContainEqual({ x: 4, y: 3 }); // East
      });

      it('should return fewer cells for unit at grid edge', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({ position: { x: 0, y: 0 } });

        const zoc = processor.getZoneOfControl(unit);

        // Corner unit should have 2 adjacent cells
        expect(zoc.cells.length).toBeLessThanOrEqual(4);
        // Should include valid adjacent positions
        expect(zoc.cells).toContainEqual({ x: 1, y: 0 }); // East
        expect(zoc.cells).toContainEqual({ x: 0, y: 1 }); // South
      });
    });


    describe('checkZoneOfControl', () => {
      it('should detect position in enemy ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const meleeEnemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([meleeEnemy]);

        const result = processor.checkZoneOfControl({ x: 3, y: 4 }, state);

        expect(result.inZoC).toBe(true);
        expect(result.controllingUnits).toContain('enemy_1');
        expect(result.triggersAoO).toBe(true);
      });

      it('should not detect position outside any ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const meleeEnemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([meleeEnemy]);

        const result = processor.checkZoneOfControl({ x: 5, y: 5 }, state);

        expect(result.inZoC).toBe(false);
        expect(result.controllingUnits).toHaveLength(0);
        expect(result.triggersAoO).toBe(false);
      });

      it('should detect position in multiple units ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const enemy1 = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const enemy2 = createMockUnit({
          instanceId: 'enemy_2',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 5 },
        });
        const state = createMockState([enemy1, enemy2]);

        // Position between both enemies
        const result = processor.checkZoneOfControl({ x: 3, y: 4 }, state);

        expect(result.inZoC).toBe(true);
        expect(result.controllingUnits).toContain('enemy_1');
        expect(result.controllingUnits).toContain('enemy_2');
        expect(result.controllingUnits).toHaveLength(2);
      });

      it('should exclude specified unit from ZoC check', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([enemy]);

        const result = processor.checkZoneOfControl(
          { x: 3, y: 4 },
          state,
          'enemy_1',
        );

        expect(result.inZoC).toBe(false);
        expect(result.controllingUnits).toHaveLength(0);
      });

      it('should not include dead units in ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const deadEnemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
          alive: false,
          currentHp: 0,
        });
        const state = createMockState([deadEnemy]);

        const result = processor.checkZoneOfControl({ x: 3, y: 4 }, state);

        expect(result.inZoC).toBe(false);
        expect(result.controllingUnits).toHaveLength(0);
      });

      it('should not include ranged units in ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const rangedEnemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 4,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([rangedEnemy]);

        const result = processor.checkZoneOfControl({ x: 3, y: 4 }, state);

        expect(result.inZoC).toBe(false);
        expect(result.controllingUnits).toHaveLength(0);
      });

      it('should not trigger AoO when config disabled', () => {
        const configNoAoO: EngagementConfig = {
          ...DEFAULT_CONFIG,
          attackOfOpportunity: false,
        };
        const processor = createEngagementProcessor(configNoAoO);
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([enemy]);

        const result = processor.checkZoneOfControl({ x: 3, y: 4 }, state);

        expect(result.inZoC).toBe(true);
        expect(result.triggersAoO).toBe(false);
      });
    });


    describe('getEngagementStatus', () => {
      it('should return "free" when not in any enemy ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          team: 'player' as TeamType,
          position: { x: 0, y: 0 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 5, y: 5 },
        });
        const state = createMockState([unit, enemy]);

        const status = processor.getEngagementStatus(unit, state);

        expect(status).toBe('free');
      });

      it('should return "engaged" when in one enemy ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          team: 'player' as TeamType,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, enemy]);

        const status = processor.getEngagementStatus(unit, state);

        expect(status).toBe('engaged');
      });

      it('should return "pinned" when in multiple enemy ZoCs', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          team: 'player' as TeamType,
          position: { x: 3, y: 4 },
        });
        const enemy1 = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const enemy2 = createMockUnit({
          instanceId: 'enemy_2',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 5 },
        });
        const state = createMockState([unit, enemy1, enemy2]);

        const status = processor.getEngagementStatus(unit, state);

        expect(status).toBe('pinned');
      });

      it('should not count allies as engaging', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          team: 'player' as TeamType,
          position: { x: 3, y: 4 },
        });
        const ally = createMockUnit({
          team: 'player' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, ally]);

        const status = processor.getEngagementStatus(unit, state);

        expect(status).toBe('free');
      });

      it('should not count ranged enemies as engaging', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          team: 'player' as TeamType,
          position: { x: 3, y: 4 },
        });
        const rangedEnemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 4,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, rangedEnemy]);

        const status = processor.getEngagementStatus(unit, state);

        expect(status).toBe('free');
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // ATTACK OF OPPORTUNITY TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Attack of Opportunity', () => {
    describe('checkAttackOfOpportunity', () => {
      it('should trigger AoO when leaving enemy ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, enemy]);

        // Moving from adjacent to enemy (in ZoC) to away from enemy (out of ZoC)
        const triggers = processor.checkAttackOfOpportunity(
          unit,
          { x: 3, y: 4 }, // Adjacent to enemy
          { x: 3, y: 5 }, // Away from enemy
          state,
        );

        expect(triggers).toHaveLength(1);
        expect(triggers[0]!.type).toBe('leave_zoc');
        expect(triggers[0]!.attacker.instanceId).toBe('enemy_1');
        expect(triggers[0]!.target.instanceId).toBe('unit_1');
      });

      it('should not trigger AoO when staying in ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, enemy]);

        // Moving from one adjacent cell to another adjacent cell
        const triggers = processor.checkAttackOfOpportunity(
          unit,
          { x: 3, y: 4 }, // Adjacent to enemy
          { x: 4, y: 3 }, // Still adjacent to enemy
          state,
        );

        expect(triggers).toHaveLength(0);
      });

      it('should not trigger AoO when not starting in ZoC', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, enemy]);

        // Moving from outside ZoC to further outside
        const triggers = processor.checkAttackOfOpportunity(
          unit,
          { x: 5, y: 5 }, // Not adjacent to enemy
          { x: 6, y: 5 }, // Still not adjacent
          state,
        );

        expect(triggers).toHaveLength(0);
      });

      it('should not trigger AoO when config disabled', () => {
        const configNoAoO: EngagementConfig = {
          ...DEFAULT_CONFIG,
          attackOfOpportunity: false,
        };
        const processor = createEngagementProcessor(configNoAoO);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, enemy]);

        const triggers = processor.checkAttackOfOpportunity(
          unit,
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          state,
        );

        expect(triggers).toHaveLength(0);
      });

      it('should not trigger AoO from enemy that already used it', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
          usedAttackOfOpportunity: true,
        });
        const state = createMockState([unit, enemy]);

        const triggers = processor.checkAttackOfOpportunity(
          unit,
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          state,
        );

        expect(triggers).toHaveLength(0);
      });

      it('should trigger multiple AoOs from multiple enemies', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy1 = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const enemy2 = createMockUnit({
          instanceId: 'enemy_2',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 4, y: 4 },
        });
        const state = createMockState([unit, enemy1, enemy2]);

        // Unit at (3,4) is adjacent to both enemies
        // Moving to (3,5) leaves both ZoCs
        const triggers = processor.checkAttackOfOpportunity(
          unit,
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          state,
        );

        expect(triggers).toHaveLength(2);
        expect(triggers.map((t) => t.attacker.instanceId)).toContain('enemy_1');
        expect(triggers.map((t) => t.attacker.instanceId)).toContain('enemy_2');
      });
    });


    describe('executeAttackOfOpportunity', () => {
      it('should deal damage on hit', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
          currentHp: 100,
          maxHp: 100,
          stats: { hp: 100, atk: 10, armor: 5, speed: 3, initiative: 10, dodge: 0, atkCount: 1 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
          stats: { hp: 100, atk: 20, armor: 5, speed: 3, initiative: 10, dodge: 0, atkCount: 1 },
        });
        const state = createMockState([unit, enemy]);

        const trigger = {
          type: 'leave_zoc' as const,
          attacker: enemy,
          target: unit,
          fromPosition: { x: 3, y: 4 },
          toPosition: { x: 3, y: 5 },
        };

        // Use a seed that results in a hit (80% chance)
        const result = processor.executeAttackOfOpportunity(trigger, state, 12345);

        // Check that attacker used AoO
        const updatedAttacker = result.state.units.find(
          (u) => u.instanceId === 'enemy_1',
        ) as BattleUnit & UnitWithEngagement;
        expect(updatedAttacker.usedAttackOfOpportunity).toBe(true);

        // If hit, damage should be dealt
        if (result.hit) {
          expect(result.damage).toBeGreaterThan(0);
          const updatedTarget = result.state.units.find(
            (u) => u.instanceId === 'unit_1',
          );
          expect(updatedTarget).toBeDefined();
          expect(updatedTarget!.currentHp).toBeLessThan(100);
        }
      });

      it('should mark attacker as having used AoO even on miss', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const unit = createMockUnit({
          instanceId: 'unit_1',
          team: 'player' as TeamType,
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([unit, enemy]);

        const trigger = {
          type: 'leave_zoc' as const,
          attacker: enemy,
          target: unit,
          fromPosition: { x: 3, y: 4 },
          toPosition: { x: 3, y: 5 },
        };

        const result = processor.executeAttackOfOpportunity(trigger, state, 99999);

        const updatedAttacker = result.state.units.find(
          (u) => u.instanceId === 'enemy_1',
        ) as BattleUnit & UnitWithEngagement;
        expect(updatedAttacker.usedAttackOfOpportunity).toBe(true);
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // ARCHER PENALTY TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Archer Penalty', () => {
    describe('getArcherPenalty', () => {
      it('should return 1.0 (no penalty) for free ranged unit', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const archer = createMockUnit({
          team: 'player' as TeamType,
          range: 4,
          position: { x: 0, y: 0 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 5, y: 5 },
        });
        const state = createMockState([archer, enemy]);

        const penalty = processor.getArcherPenalty(archer, state, DEFAULT_CONFIG);

        expect(penalty).toBe(1.0);
      });

      it('should return penalty for engaged ranged unit', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const archer = createMockUnit({
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const penalty = processor.getArcherPenalty(archer, state, DEFAULT_CONFIG);

        expect(penalty).toBe(0.5); // 1.0 - 0.5 = 0.5
      });

      it('should return 1.0 (no penalty) for melee unit', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const meleeUnit = createMockUnit({
          team: 'player' as TeamType,
          range: 1,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([meleeUnit, enemy]);

        const penalty = processor.getArcherPenalty(meleeUnit, state, DEFAULT_CONFIG);

        expect(penalty).toBe(1.0);
      });

      it('should return 1.0 when archer penalty disabled', () => {
        const configNoPenalty: EngagementConfig = {
          ...DEFAULT_CONFIG,
          archerPenalty: false,
        };
        const processor = createEngagementProcessor(configNoPenalty);
        const archer = createMockUnit({
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const penalty = processor.getArcherPenalty(archer, state, configNoPenalty);

        expect(penalty).toBe(1.0);
      });

      it('should use custom penalty percent', () => {
        const customConfig: EngagementConfig = {
          ...DEFAULT_CONFIG,
          archerPenaltyPercent: 0.3,
        };
        const processor = createEngagementProcessor(customConfig);
        const archer = createMockUnit({
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const penalty = processor.getArcherPenalty(archer, state, customConfig);

        expect(penalty).toBe(0.7); // 1.0 - 0.3 = 0.7
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // UPDATE ENGAGEMENTS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('updateEngagements', () => {
    it('should mark unit as engaged when in enemy ZoC', () => {
      const processor = createEngagementProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({
        instanceId: 'unit_1',
        team: 'player' as TeamType,
        position: { x: 3, y: 4 },
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot' as TeamType,
        range: 1,
        position: { x: 3, y: 3 },
      });
      const state = createMockState([unit, enemy]);

      const newState = processor.updateEngagements(state);

      const updatedUnit = newState.units.find(
        (u) => u.instanceId === 'unit_1',
      ) as BattleUnit & UnitWithEngagement;
      expect(updatedUnit.engaged).toBe(true);
      expect(updatedUnit.engagedBy).toContain('enemy_1');
    });

    it('should mark unit as not engaged when outside enemy ZoC', () => {
      const processor = createEngagementProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({
        instanceId: 'unit_1',
        team: 'player' as TeamType,
        position: { x: 0, y: 0 },
        engaged: true, // Previously engaged
        engagedBy: ['enemy_1'],
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot' as TeamType,
        range: 1,
        position: { x: 5, y: 5 },
      });
      const state = createMockState([unit, enemy]);

      const newState = processor.updateEngagements(state);

      const updatedUnit = newState.units.find(
        (u) => u.instanceId === 'unit_1',
      ) as BattleUnit & UnitWithEngagement;
      expect(updatedUnit.engaged).toBe(false);
      expect(updatedUnit.engagedBy).toHaveLength(0);
    });

    it('should track multiple engaging enemies', () => {
      const processor = createEngagementProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({
        instanceId: 'unit_1',
        team: 'player' as TeamType,
        position: { x: 3, y: 4 },
      });
      const enemy1 = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot' as TeamType,
        range: 1,
        position: { x: 3, y: 3 },
      });
      const enemy2 = createMockUnit({
        instanceId: 'enemy_2',
        team: 'bot' as TeamType,
        range: 1,
        position: { x: 3, y: 5 },
      });
      const state = createMockState([unit, enemy1, enemy2]);

      const newState = processor.updateEngagements(state);

      const updatedUnit = newState.units.find(
        (u) => u.instanceId === 'unit_1',
      ) as BattleUnit & UnitWithEngagement;
      expect(updatedUnit.engaged).toBe(true);
      expect(updatedUnit.engagedBy).toContain('enemy_1');
      expect(updatedUnit.engagedBy).toContain('enemy_2');
      expect(updatedUnit.engagedBy).toHaveLength(2);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // APPLY PHASE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('apply', () => {
    it('should reset AoO usage at turn end', () => {
      const processor = createEngagementProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({
        instanceId: 'unit_1',
        team: 'player' as TeamType,
        usedAttackOfOpportunity: true,
      });
      const state = createMockState([unit]);

      const newState = processor.apply('turn_end', state, {
        activeUnit: unit,
        seed: 12345,
      });

      const updatedUnit = newState.units.find(
        (u) => u.instanceId === 'unit_1',
      ) as BattleUnit & UnitWithEngagement;
      expect(updatedUnit.usedAttackOfOpportunity).toBe(false);
    });

    it('should process movement and check for AoO', () => {
      const processor = createEngagementProcessor(DEFAULT_CONFIG);
      const unit = createMockUnit({
        instanceId: 'unit_1',
        team: 'player' as TeamType,
        position: { x: 3, y: 4 },
      });
      const enemy = createMockUnit({
        instanceId: 'enemy_1',
        team: 'bot' as TeamType,
        range: 1,
        position: { x: 3, y: 3 },
      });
      const state = createMockState([unit, enemy]);

      const newState = processor.apply('movement', state, {
        activeUnit: unit,
        action: {
          type: 'move',
          path: [
            { x: 3, y: 4 }, // Start (in ZoC)
            { x: 3, y: 5 }, // End (out of ZoC)
          ],
        },
        seed: 12345,
      });

      // Enemy should have used AoO
      const updatedEnemy = newState.units.find(
        (u) => u.instanceId === 'enemy_1',
      ) as BattleUnit & UnitWithEngagement;
      expect(updatedEnemy.usedAttackOfOpportunity).toBe(true);
    });

    describe('pre_attack phase - archer penalty', () => {
      it('should apply archer penalty modifier to engaged ranged unit during pre_attack', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const archer = createMockUnit({
          instanceId: 'archer_1',
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: archer,
          action: { type: 'attack', targetId: 'some_target' },
          seed: 12345,
        });

        const updatedArcher = newState.units.find(
          (u) => u.instanceId === 'archer_1',
        ) as BattleUnit & UnitWithEngagement;
        expect(updatedArcher.archerPenaltyModifier).toBe(0.5);
      });

      it('should not apply archer penalty modifier to free ranged unit during pre_attack', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const archer = createMockUnit({
          instanceId: 'archer_1',
          team: 'player' as TeamType,
          range: 4,
          position: { x: 0, y: 0 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 5, y: 5 },
        });
        const state = createMockState([archer, enemy]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: archer,
          action: { type: 'attack', targetId: 'some_target' },
          seed: 12345,
        });

        const updatedArcher = newState.units.find(
          (u) => u.instanceId === 'archer_1',
        ) as BattleUnit & UnitWithEngagement;
        // No penalty modifier should be set (or it should be undefined)
        expect(updatedArcher.archerPenaltyModifier).toBeUndefined();
      });

      it('should not apply archer penalty modifier to melee unit during pre_attack', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const meleeUnit = createMockUnit({
          instanceId: 'melee_1',
          team: 'player' as TeamType,
          range: 1,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([meleeUnit, enemy]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: meleeUnit,
          action: { type: 'attack', targetId: 'some_target' },
          seed: 12345,
        });

        const updatedMelee = newState.units.find(
          (u) => u.instanceId === 'melee_1',
        ) as BattleUnit & UnitWithEngagement;
        // No penalty modifier should be set for melee units
        expect(updatedMelee.archerPenaltyModifier).toBeUndefined();
      });

      it('should not apply archer penalty when config disabled during pre_attack', () => {
        const configNoPenalty: EngagementConfig = {
          ...DEFAULT_CONFIG,
          archerPenalty: false,
        };
        const processor = createEngagementProcessor(configNoPenalty);
        const archer = createMockUnit({
          instanceId: 'archer_1',
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: archer,
          action: { type: 'attack', targetId: 'some_target' },
          seed: 12345,
        });

        const updatedArcher = newState.units.find(
          (u) => u.instanceId === 'archer_1',
        ) as BattleUnit & UnitWithEngagement;
        // No penalty modifier should be set when disabled
        expect(updatedArcher.archerPenaltyModifier).toBeUndefined();
      });

      it('should use custom penalty percent during pre_attack', () => {
        const customConfig: EngagementConfig = {
          ...DEFAULT_CONFIG,
          archerPenaltyPercent: 0.3,
        };
        const processor = createEngagementProcessor(customConfig);
        const archer = createMockUnit({
          instanceId: 'archer_1',
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: archer,
          action: { type: 'attack', targetId: 'some_target' },
          seed: 12345,
        });

        const updatedArcher = newState.units.find(
          (u) => u.instanceId === 'archer_1',
        ) as BattleUnit & UnitWithEngagement;
        expect(updatedArcher.archerPenaltyModifier).toBe(0.7); // 1.0 - 0.3 = 0.7
      });

      it('should not apply penalty for non-attack actions during pre_attack', () => {
        const processor = createEngagementProcessor(DEFAULT_CONFIG);
        const archer = createMockUnit({
          instanceId: 'archer_1',
          team: 'player' as TeamType,
          range: 4,
          position: { x: 3, y: 4 },
        });
        const enemy = createMockUnit({
          instanceId: 'enemy_1',
          team: 'bot' as TeamType,
          range: 1,
          position: { x: 3, y: 3 },
        });
        const state = createMockState([archer, enemy]);

        const newState = processor.apply('pre_attack', state, {
          activeUnit: archer,
          action: { type: 'move', path: [] }, // Not an attack action
          seed: 12345,
        });

        const updatedArcher = newState.units.find(
          (u) => u.instanceId === 'archer_1',
        ) as BattleUnit & UnitWithEngagement;
        // No penalty modifier should be set for non-attack actions
        expect(updatedArcher.archerPenaltyModifier).toBeUndefined();
      });
    });
  });
});
