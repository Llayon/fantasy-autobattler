/**
 * Engagement Mechanic Verification Tests for Roguelike Mode
 *
 * Verifies that the Engagement (Zone of Control) mechanic works correctly
 * in roguelike battles using ROGUELIKE_PRESET.
 */

import { createMechanicsProcessor, ROGUELIKE_PRESET } from '../../core/mechanics';
import { createEngagementProcessor } from '../../core/mechanics/tier1/engagement/engagement.processor';
import type { BattleState, BattleUnit, Position } from '../../core/types';
import type { UnitWithEngagement } from '../../core/mechanics/tier1/engagement/engagement.types';
import type { EngagementConfig } from '../../core/mechanics/config/mechanics.types';

describe('Engagement Mechanic - Roguelike Mode', () => {
  describe('ROGUELIKE_PRESET Configuration', () => {
    it('should have engagement enabled', () => {
      expect(ROGUELIKE_PRESET.engagement).toBeDefined();
      expect(typeof ROGUELIKE_PRESET.engagement).toBe('object');
    });

    it('should have Attack of Opportunity enabled', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      expect(config.attackOfOpportunity).toBe(true);
    });

    it('should have Archer Penalty enabled', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      expect(config.archerPenalty).toBe(true);
    });

    it('should have correct archer penalty percentage', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      expect(config.archerPenaltyPercent).toBe(0.5);
    });

    it('should create processor with engagement enabled', () => {
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      
      expect(processor.config.engagement).toBeTruthy();
      expect(processor.processors.engagement).toBeDefined();
    });
  });

  describe('Zone of Control Detection', () => {
    const createTestUnit = (
      id: string,
      position: Position,
      team: 'player' | 'bot',
      range: number = 1,
    ): BattleUnit & UnitWithEngagement => ({
      id: `unit_${id}`,
      name: `Unit ${id}`,
      role: range > 1 ? 'ranged' : 'melee',
      cost: 5,
      stats: {
        hp: 100,
        atk: 20,
        atkCount: 1,
        armor: 5,
        speed: 3,
        initiative: 10,
        dodge: 10,
      },
      range,
      abilities: [],
      position,
      currentHp: 100,
      maxHp: 100,
      team,
      alive: true,
      instanceId: `instance_${id}`,
      engaged: false,
      engagedBy: [],
      hasZoneOfControl: range <= 1,
      isRanged: range > 1,
    });

    const createTestState = (units: BattleUnit[]): BattleState => ({
      units,
      round: 1,
      events: [],
    });

    it('should detect ZoC for melee units (range <= 1)', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const meleeUnit = createTestUnit('melee', { x: 3, y: 3 }, 'player', 1);
      
      const zoc = processor.getZoneOfControl(meleeUnit);

      expect(zoc.active).toBe(true);
      expect(zoc.cells.length).toBeGreaterThan(0);
      expect(zoc.unitId).toBe(meleeUnit.instanceId);
    });

    it('should not detect ZoC for ranged units (range > 1)', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const rangedUnit = createTestUnit('archer', { x: 3, y: 3 }, 'player', 3);
      
      const zoc = processor.getZoneOfControl(rangedUnit);

      expect(zoc.active).toBe(false);
      expect(zoc.cells.length).toBe(0);
    });

    it('should mark unit as "free" when not adjacent to enemies', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const playerUnit = createTestUnit('player1', { x: 2, y: 2 }, 'player', 1);
      const enemyUnit = createTestUnit('enemy1', { x: 5, y: 5 }, 'bot', 1);
      const state = createTestState([playerUnit, enemyUnit]);

      const status = processor.getEngagementStatus(playerUnit, state);
      
      expect(status).toBe('free');
    });

    it('should mark unit as "engaged" when adjacent to one enemy', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const playerUnit = createTestUnit('player1', { x: 3, y: 3 }, 'player', 1);
      const enemyUnit = createTestUnit('enemy1', { x: 3, y: 4 }, 'bot', 1);
      const state = createTestState([playerUnit, enemyUnit]);

      const status = processor.getEngagementStatus(playerUnit, state);
      
      expect(status).toBe('engaged');
    });

    it('should mark unit as "pinned" when adjacent to multiple enemies', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const playerUnit = createTestUnit('player1', { x: 3, y: 3 }, 'player', 1);
      const enemy1 = createTestUnit('enemy1', { x: 3, y: 4 }, 'bot', 1);
      const enemy2 = createTestUnit('enemy2', { x: 4, y: 3 }, 'bot', 1);
      const state = createTestState([playerUnit, enemy1, enemy2]);

      const status = processor.getEngagementStatus(playerUnit, state);
      
      expect(status).toBe('pinned');
    });
  });

  describe('Archer Penalty', () => {
    const createTestUnit = (
      id: string,
      position: Position,
      team: 'player' | 'bot',
      range: number = 1,
    ): BattleUnit & UnitWithEngagement => ({
      id: `unit_${id}`,
      name: `Unit ${id}`,
      role: range > 1 ? 'ranged' : 'melee',
      cost: 5,
      stats: {
        hp: 100,
        atk: 20,
        atkCount: 1,
        armor: 5,
        speed: 3,
        initiative: 10,
        dodge: 10,
      },
      range,
      abilities: [],
      position,
      currentHp: 100,
      maxHp: 100,
      team,
      alive: true,
      instanceId: `instance_${id}`,
      engaged: false,
      engagedBy: [],
      hasZoneOfControl: range <= 1,
      isRanged: range > 1,
    });

    const createTestState = (units: BattleUnit[]): BattleState => ({
      units,
      round: 1,
      events: [],
    });

    it('should apply 50% penalty to engaged ranged units', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const archerUnit = createTestUnit('archer', { x: 3, y: 3 }, 'player', 3);
      const enemyUnit = createTestUnit('enemy1', { x: 3, y: 4 }, 'bot', 1);
      const state = createTestState([archerUnit, enemyUnit]);

      const penalty = processor.getArcherPenalty(archerUnit, state, config);

      expect(penalty).toBe(0.5); // 50% damage (1.0 - 0.5)
    });

    it('should not apply penalty to free ranged units', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const archerUnit = createTestUnit('archer', { x: 2, y: 2 }, 'player', 3);
      const enemyUnit = createTestUnit('enemy1', { x: 5, y: 5 }, 'bot', 1);
      const state = createTestState([archerUnit, enemyUnit]);

      const penalty = processor.getArcherPenalty(archerUnit, state, config);

      expect(penalty).toBe(1.0); // No penalty
    });

    it('should not apply penalty to melee units', () => {
      const config = ROGUELIKE_PRESET.engagement as EngagementConfig;
      const processor = createEngagementProcessor(config);
      const meleeUnit = createTestUnit('warrior', { x: 3, y: 3 }, 'player', 1);
      const enemyUnit = createTestUnit('enemy1', { x: 3, y: 4 }, 'bot', 1);
      const state = createTestState([meleeUnit, enemyUnit]);

      const penalty = processor.getArcherPenalty(meleeUnit, state, config);

      expect(penalty).toBe(1.0); // No penalty for melee
    });
  });
});
