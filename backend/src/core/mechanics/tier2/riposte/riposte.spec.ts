/**
 * Tier 2: Riposte Processor Tests
 *
 * Tests for the riposte (counter-attack) system.
 * Validates arc checking, initiative-based chance calculation,
 * and riposte execution.
 *
 * @module core/mechanics/tier2/riposte
 */

import { createRiposteProcessor } from './riposte.processor';
import { createTestUnit } from '../../test-fixtures';
import type { RiposteConfig } from '../../config/mechanics.types';
import type { BattleUnit } from '../../../types';
import type { UnitWithRiposte } from './riposte.types';

// ═══════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: RiposteConfig = {
  initiativeBased: true,
  chargesPerRound: 'attackCount',
  baseChance: 0.5,
  guaranteedThreshold: 10,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a test unit with riposte properties.
 */
function createRiposteUnit(
  overrides: Partial<BattleUnit & UnitWithRiposte> = {},
): BattleUnit & UnitWithRiposte {
  const unit = createTestUnit({
    id: overrides.id ?? 'riposte-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    stats: {
      hp: 100,
      atk: 20,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: overrides.initiative ?? 5,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 100,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  const result: BattleUnit & UnitWithRiposte = {
    ...unit,
    initiative: overrides.initiative ?? unit.stats?.initiative ?? 5,
    attackCount: overrides.attackCount ?? unit.stats?.atkCount ?? 1,
  };

  // Only add optional properties if they are defined
  if (overrides.riposteCharges !== undefined) {
    result.riposteCharges = overrides.riposteCharges;
  }
  if (overrides.maxRiposteCharges !== undefined) {
    result.maxRiposteCharges = overrides.maxRiposteCharges;
  }
  if (overrides.canRiposte !== undefined) {
    result.canRiposte = overrides.canRiposte;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// canRiposte() TESTS
// ═══════════════════════════════════════════════════════════════

describe('RiposteProcessor', () => {
  describe('canRiposte()', () => {
    describe('arc check', () => {
      it('should allow riposte from front arc', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ riposteCharges: 1 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(true);
      });

      it('should deny riposte from flank arc', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ riposteCharges: 1 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'flank');

        expect(result).toBe(false);
      });

      it('should deny riposte from rear arc', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ riposteCharges: 1 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'rear');

        expect(result).toBe(false);
      });
    });

    describe('charge check', () => {
      it('should allow riposte when charges remaining', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ riposteCharges: 2 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(true);
      });

      it('should deny riposte when no charges remaining', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ riposteCharges: 0 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(false);
      });

      it('should use attackCount as default charges when not set', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          attackCount: 2,
          // riposteCharges not set - should use attackCount as default
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        // Should use attackCount (2) as default charges
        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(true);
      });

      it('should use fixed charges when config specifies number', () => {
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          chargesPerRound: 3,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({
          attackCount: 1,
          // riposteCharges not set - should use config value
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        // Should use config value (3) as default charges
        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(true);
      });
    });

    describe('alive check', () => {
      it('should deny riposte when defender is dead (alive=false)', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          riposteCharges: 1,
          alive: false,
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(false);
      });

      it('should deny riposte when defender has 0 HP', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          riposteCharges: 1,
          currentHp: 0,
          alive: true, // Edge case: alive flag not updated
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(false);
      });

      it('should allow riposte when defender is alive with HP', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          riposteCharges: 1,
          currentHp: 50,
          alive: true,
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(true);
      });
    });

    describe('combined conditions', () => {
      it('should deny riposte when flanked even with charges', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          riposteCharges: 5,
          currentHp: 100,
          alive: true,
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'flank');

        expect(result).toBe(false);
      });

      it('should deny riposte from front when dead', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          riposteCharges: 5,
          currentHp: 0,
          alive: false,
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(false);
      });

      it('should deny riposte from front when no charges', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          riposteCharges: 0,
          currentHp: 100,
          alive: true,
        });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });

        const result = processor.canRiposte(defender, attacker, 'front');

        expect(result).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getRiposteChance() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('getRiposteChance()', () => {
    describe('initiative-based calculation', () => {
      it('should return baseChance when initiatives are equal', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 10 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 0, so chance = baseChance (0.5)
        expect(chance).toBe(0.5);
      });

      it('should return 1.0 (guaranteed) when defender initiative >= threshold higher', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        // guaranteedThreshold = 10, so defender needs 10+ higher initiative
        const defender = createRiposteUnit({ initiative: 20 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 10 >= guaranteedThreshold (10), so chance = 1.0
        expect(chance).toBe(1.0);
      });

      it('should return 1.0 when defender initiative exceeds threshold', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 25 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 15 >= guaranteedThreshold (10), so chance = 1.0
        expect(chance).toBe(1.0);
      });

      it('should return 0.0 (impossible) when attacker initiative >= threshold higher', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 5 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 15 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = -10 <= -guaranteedThreshold (-10), so chance = 0.0
        expect(chance).toBe(0.0);
      });

      it('should return 0.0 when attacker initiative exceeds threshold', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 5 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 20 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = -15 <= -guaranteedThreshold (-10), so chance = 0.0
        expect(chance).toBe(0.0);
      });

      it('should interpolate linearly for positive initiative difference', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 15 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 5, guaranteedThreshold = 10
        // chance = 0.5 + (5 / 10) * 0.5 = 0.5 + 0.25 = 0.75
        expect(chance).toBe(0.75);
      });

      it('should interpolate linearly for negative initiative difference', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 5 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = -5, guaranteedThreshold = 10
        // chance = 0.5 + (-5 / 10) * 0.5 = 0.5 - 0.25 = 0.25
        expect(chance).toBe(0.25);
      });

      it('should handle small initiative differences correctly', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 12 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 2, guaranteedThreshold = 10
        // chance = 0.5 + (2 / 10) * 0.5 = 0.5 + 0.1 = 0.6
        expect(chance).toBe(0.6);
      });
    });

    describe('non-initiative-based calculation', () => {
      it('should return baseChance directly when initiativeBased is false', () => {
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          initiativeBased: false,
          baseChance: 0.3,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({ initiative: 20 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 5 });

        const chance = processor.getRiposteChance(defender, attacker, config);

        // Should ignore initiative and return baseChance
        expect(chance).toBe(0.3);
      });

      it('should return baseChance regardless of initiative difference', () => {
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          initiativeBased: false,
          baseChance: 0.7,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({ initiative: 5 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 25 });

        const chance = processor.getRiposteChance(defender, attacker, config);

        // Should ignore initiative and return baseChance
        expect(chance).toBe(0.7);
      });
    });

    describe('custom configuration', () => {
      it('should use custom baseChance', () => {
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          baseChance: 0.3,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({ initiative: 10 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, config);

        // Equal initiative, so chance = baseChance (0.3)
        expect(chance).toBe(0.3);
      });

      it('should use custom guaranteedThreshold', () => {
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          guaranteedThreshold: 5,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({ initiative: 15 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, config);

        // initDiff = 5 >= guaranteedThreshold (5), so chance = 1.0
        expect(chance).toBe(1.0);
      });

      it('should clamp chance to valid range [0, 1]', () => {
        // Edge case: very high baseChance with positive initiative diff
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          baseChance: 0.9,
          guaranteedThreshold: 10,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({ initiative: 18 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 10 });

        const chance = processor.getRiposteChance(defender, attacker, config);

        // initDiff = 8, chance = 0.9 + (8/10) * 0.5 = 0.9 + 0.4 = 1.3
        // Should be clamped to 1.0
        expect(chance).toBe(1.0);
      });
    });

    describe('edge cases', () => {
      it('should handle zero initiative values', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({ initiative: 0 });
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot', initiative: 0 });

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 0, so chance = baseChance (0.5)
        expect(chance).toBe(0.5);
      });

      it('should handle missing initiative (defaults to 0)', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({});
        // Remove initiative from defender
        delete (defender as Partial<BattleUnit & UnitWithRiposte>).initiative;
        const attacker = createRiposteUnit({ id: 'attacker', team: 'bot' });
        delete (attacker as Partial<BattleUnit & UnitWithRiposte>).initiative;

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // Both default to 0, initDiff = 0, so chance = baseChance (0.5)
        expect(chance).toBe(0.5);
      });

      it('should use stats.initiative as fallback', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 15, dodge: 0 },
        });
        // Remove top-level initiative to force fallback
        delete (defender as Partial<BattleUnit & UnitWithRiposte>).initiative;
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        delete (attacker as Partial<BattleUnit & UnitWithRiposte>).initiative;

        const chance = processor.getRiposteChance(defender, attacker, DEFAULT_CONFIG);

        // initDiff = 15 - 10 = 5
        // chance = 0.5 + (5 / 10) * 0.5 = 0.75
        expect(chance).toBe(0.75);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // executeRiposte() TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('executeRiposte()', () => {
    /**
     * Creates a test battle state with the given units.
     */
    function createTestState(units: BattleUnit[]): { units: BattleUnit[]; round: number; events: unknown[] } {
      return {
        units,
        round: 1,
        events: [],
      };
    }

    describe('damage calculation', () => {
      it('should deal 50% of defender ATK as riposte damage', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 2,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(20 * 0.5) = 10
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(90); // 100 - 10 = 90
      });

      it('should floor the damage calculation', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(15 * 0.5) = floor(7.5) = 7
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(93); // 100 - 7 = 93
      });

      it('should handle zero ATK defender (no damage)', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 0, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 50,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(0 * 0.5) = 0
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(50); // No change
      });

      it('should handle high ATK defender', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 100, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 80,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(100 * 0.5) = 50
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(30); // 80 - 50 = 30
      });
    });

    describe('attacker HP and alive status', () => {
      it('should reduce attacker HP by riposte damage', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 30, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 50,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(30 * 0.5) = 15
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(35); // 50 - 15 = 35
        expect(updatedAttacker?.alive).toBe(true);
      });

      it('should set attacker alive to false when HP reaches 0', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 40, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 20,
          alive: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(40 * 0.5) = 20
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(0); // 20 - 20 = 0
        expect(updatedAttacker?.alive).toBe(false);
      });

      it('should not reduce HP below 0', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 100, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 10,
          alive: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(100 * 0.5) = 50, but HP is only 10
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(0); // Clamped to 0, not -40
        expect(updatedAttacker?.alive).toBe(false);
      });

      it('should keep attacker alive when HP > 0 after riposte', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          alive: true,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Riposte damage = floor(10 * 0.5) = 5
        const updatedAttacker = newState.units.find(u => u.id === 'attacker');
        expect(updatedAttacker?.currentHp).toBe(95); // 100 - 5 = 95
        expect(updatedAttacker?.alive).toBe(true);
      });
    });

    describe('riposte charge consumption', () => {
      it('should consume one riposte charge', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 3,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        const updatedDefender = newState.units.find(u => u.id === 'defender') as BattleUnit & UnitWithRiposte;
        expect(updatedDefender?.riposteCharges).toBe(2); // 3 - 1 = 2
      });

      it('should reduce charges from 1 to 0', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        const updatedDefender = newState.units.find(u => u.id === 'defender') as BattleUnit & UnitWithRiposte;
        expect(updatedDefender?.riposteCharges).toBe(0); // 1 - 1 = 0
      });

      it('should not reduce charges below 0', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 0,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        const updatedDefender = newState.units.find(u => u.id === 'defender') as BattleUnit & UnitWithRiposte;
        expect(updatedDefender?.riposteCharges).toBe(0); // Clamped to 0
      });

      it('should use attackCount as default charges when not set', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          attackCount: 2,
          // riposteCharges not set - should use attackCount as default
          stats: { hp: 100, atk: 20, atkCount: 2, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Default charges = attackCount (2), after riposte = 2 - 1 = 1
        const updatedDefender = newState.units.find(u => u.id === 'defender') as BattleUnit & UnitWithRiposte;
        expect(updatedDefender?.riposteCharges).toBe(1);
      });

      it('should use fixed charges from config when specified', () => {
        const config: RiposteConfig = {
          ...DEFAULT_CONFIG,
          chargesPerRound: 5,
        };
        const processor = createRiposteProcessor(config);
        const defender = createRiposteUnit({
          id: 'defender',
          attackCount: 1,
          // riposteCharges not set - should use config value
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Default charges = config value (5), after riposte = 5 - 1 = 4
        const updatedDefender = newState.units.find(u => u.id === 'defender') as BattleUnit & UnitWithRiposte;
        expect(updatedDefender?.riposteCharges).toBe(4);
      });
    });

    describe('state immutability', () => {
      it('should not mutate the original state', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 2,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);
        const originalAttackerHp = attacker.currentHp;
        const originalDefenderCharges = defender.riposteCharges;

        processor.executeRiposte(defender, attacker, state);

        // Original objects should be unchanged
        expect(attacker.currentHp).toBe(originalAttackerHp);
        expect(defender.riposteCharges).toBe(originalDefenderCharges);
        expect(state.units[0]).toBe(defender);
        expect(state.units[1]).toBe(attacker);
      });

      it('should return a new state object', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const state = createTestState([defender, attacker]);

        const newState = processor.executeRiposte(defender, attacker, state);

        expect(newState).not.toBe(state);
        expect(newState.units).not.toBe(state.units);
      });
    });

    describe('multiple units in state', () => {
      it('should only update attacker and defender, not other units', () => {
        const processor = createRiposteProcessor(DEFAULT_CONFIG);
        const defender = createRiposteUnit({
          id: 'defender',
          riposteCharges: 1,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteUnit({
          id: 'attacker',
          team: 'bot',
          currentHp: 100,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const bystander = createRiposteUnit({
          id: 'bystander',
          team: 'player',
          currentHp: 50,
          riposteCharges: 3,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 7, dodge: 0 },
        });
        const state = createTestState([defender, attacker, bystander]);

        const newState = processor.executeRiposte(defender, attacker, state);

        // Bystander should be unchanged
        const updatedBystander = newState.units.find(u => u.id === 'bystander') as BattleUnit & UnitWithRiposte;
        expect(updatedBystander?.currentHp).toBe(50);
        expect(updatedBystander?.riposteCharges).toBe(3);
      });
    });
  });
});
