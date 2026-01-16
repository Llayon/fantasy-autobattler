/**
 * Tier 1: Flanking Processor - Unit Tests
 *
 * Tests for the flanking system which provides damage bonuses
 * and resolve damage based on attack angle relative to target's facing.
 *
 * @module core/mechanics/tier1/flanking
 */

import { createFlankingProcessor } from './flanking.processor';
import type { ResolveConfig } from '../../config/mechanics.types';
import type { AttackArc } from './flanking.types';
import {
  FLANKING_DAMAGE_MODIFIERS,
  DEFAULT_FLANKING_RESOLVE_DAMAGE,
} from './flanking.types';

describe('FlankingProcessor', () => {
  describe('getDamageModifier', () => {
    const processor = createFlankingProcessor();

    it('should return 1.0 for front attacks (no bonus)', () => {
      expect(processor.getDamageModifier('front')).toBe(1.0);
    });

    it('should return 1.15 for flank attacks (+15% bonus)', () => {
      expect(processor.getDamageModifier('flank')).toBe(1.15);
    });

    it('should return 1.3 for rear attacks (+30% bonus)', () => {
      expect(processor.getDamageModifier('rear')).toBe(1.3);
    });

    it('should match FLANKING_DAMAGE_MODIFIERS constants', () => {
      const arcs: AttackArc[] = ['front', 'flank', 'rear'];
      for (const arc of arcs) {
        expect(processor.getDamageModifier(arc)).toBe(
          FLANKING_DAMAGE_MODIFIERS[arc],
        );
      }
    });
  });

  describe('getDamageModifier with custom options', () => {
    it('should use custom damage modifiers when provided', () => {
      const processor = createFlankingProcessor({
        damageModifiers: {
          front: 1.0,
          flank: 1.2, // Custom: +20% instead of +15%
          rear: 1.4, // Custom: +40% instead of +30%
        },
      });

      expect(processor.getDamageModifier('front')).toBe(1.0);
      expect(processor.getDamageModifier('flank')).toBe(1.2);
      expect(processor.getDamageModifier('rear')).toBe(1.4);
    });

    it('should merge partial custom modifiers with defaults', () => {
      const processor = createFlankingProcessor({
        damageModifiers: {
          rear: 1.5, // Only override rear
        },
      });

      expect(processor.getDamageModifier('front')).toBe(1.0); // Default
      expect(processor.getDamageModifier('flank')).toBe(1.15); // Default
      expect(processor.getDamageModifier('rear')).toBe(1.5); // Custom
    });
  });

  describe('getResolveDamage', () => {
    const processor = createFlankingProcessor();

    describe('without ResolveConfig', () => {
      it('should return 0 for front attacks', () => {
        expect(processor.getResolveDamage('front')).toBe(0);
      });

      it('should return 12 for flank attacks (default)', () => {
        expect(processor.getResolveDamage('flank')).toBe(12);
      });

      it('should return 20 for rear attacks (default)', () => {
        expect(processor.getResolveDamage('rear')).toBe(20);
      });

      it('should match DEFAULT_FLANKING_RESOLVE_DAMAGE constants', () => {
        const arcs: AttackArc[] = ['front', 'flank', 'rear'];
        for (const arc of arcs) {
          expect(processor.getResolveDamage(arc)).toBe(
            DEFAULT_FLANKING_RESOLVE_DAMAGE[arc],
          );
        }
      });
    });

    describe('with ResolveConfig', () => {
      const resolveConfig: ResolveConfig = {
        maxResolve: 100,
        baseRegeneration: 5,
        humanRetreat: true,
        undeadCrumble: true,
        flankingResolveDamage: 15, // Custom value
        rearResolveDamage: 25, // Custom value
      };

      it('should return 0 for front attacks regardless of config', () => {
        expect(processor.getResolveDamage('front', resolveConfig)).toBe(0);
      });

      it('should use config.flankingResolveDamage for flank attacks', () => {
        expect(processor.getResolveDamage('flank', resolveConfig)).toBe(15);
      });

      it('should use config.rearResolveDamage for rear attacks', () => {
        expect(processor.getResolveDamage('rear', resolveConfig)).toBe(25);
      });
    });

    describe('with custom default resolve damage', () => {
      it('should use custom default resolve damage when no config provided', () => {
        const processor = createFlankingProcessor({
          defaultResolveDamage: {
            front: 0,
            flank: 18,
            rear: 30,
          },
        });

        expect(processor.getResolveDamage('front')).toBe(0);
        expect(processor.getResolveDamage('flank')).toBe(18);
        expect(processor.getResolveDamage('rear')).toBe(30);
      });
    });
  });

  describe('disablesRiposte', () => {
    const processor = createFlankingProcessor();

    it('should return false for front attacks (riposte allowed)', () => {
      expect(processor.disablesRiposte('front')).toBe(false);
    });

    it('should return true for flank attacks (riposte disabled)', () => {
      expect(processor.disablesRiposte('flank')).toBe(true);
    });

    it('should return true for rear attacks (riposte disabled)', () => {
      expect(processor.disablesRiposte('rear')).toBe(true);
    });
  });

  describe('calculateFlankingEffects', () => {
    const processor = createFlankingProcessor();

    it('should return complete result for front attack', () => {
      const result = processor.calculateFlankingEffects('front');

      expect(result).toEqual({
        arc: 'front',
        damageModifier: 1.0,
        resolveDamage: 0,
        disablesRiposte: false,
      });
    });

    it('should return complete result for flank attack', () => {
      const result = processor.calculateFlankingEffects('flank');

      expect(result).toEqual({
        arc: 'flank',
        damageModifier: 1.15,
        resolveDamage: 12,
        disablesRiposte: true,
      });
    });

    it('should return complete result for rear attack', () => {
      const result = processor.calculateFlankingEffects('rear');

      expect(result).toEqual({
        arc: 'rear',
        damageModifier: 1.3,
        resolveDamage: 20,
        disablesRiposte: true,
      });
    });

    it('should use ResolveConfig values when provided', () => {
      const resolveConfig: ResolveConfig = {
        maxResolve: 100,
        baseRegeneration: 5,
        humanRetreat: true,
        undeadCrumble: true,
        flankingResolveDamage: 18,
        rearResolveDamage: 28,
      };

      const flankResult = processor.calculateFlankingEffects(
        'flank',
        resolveConfig,
      );
      expect(flankResult.resolveDamage).toBe(18);

      const rearResult = processor.calculateFlankingEffects(
        'rear',
        resolveConfig,
      );
      expect(rearResult.resolveDamage).toBe(28);
    });
  });

  describe('apply', () => {
    const processor = createFlankingProcessor();

    it('should return state unchanged (modifiers applied elsewhere)', () => {
      // Use any to bypass strict type checking for mock data
      const mockState = {
        units: [
          {
            id: 'unit_1',
            name: 'Attacker',
            position: { x: 0, y: 0 },
            currentHp: 100,
            maxHp: 100,
            atk: 10,
            armor: 5,
            speed: 3,
            initiative: 10,
            range: 1,
            attackCount: 1,
            team: 'player',
            role: 'tank',
            cost: 5,
            stats: {},
            abilities: [],
            dodge: 0,
          },
          {
            id: 'unit_2',
            name: 'Defender',
            position: { x: 1, y: 0 },
            currentHp: 100,
            maxHp: 100,
            atk: 10,
            armor: 5,
            speed: 3,
            initiative: 10,
            range: 1,
            attackCount: 1,
            team: 'enemy',
            facing: 'S',
            role: 'tank',
            cost: 5,
            stats: {},
            abilities: [],
            dodge: 0,
          },
        ],
        grid: [],
        round: 1,
        events: [],
      } as any;

      const context = {
        activeUnit: mockState.units[0],
        target: mockState.units[1],
        seed: 12345,
      } as any;

      // Apply should return state unchanged
      const result = processor.apply('pre_attack', mockState, context);
      expect(result).toBe(mockState);
    });

    it('should return state unchanged for all phases', () => {
      const mockState = {
        units: [],
        grid: [],
        round: 1,
        events: [],
      } as any;

      const context = {
        activeUnit: {
          id: 'unit_1',
          name: 'Test',
          position: { x: 0, y: 0 },
          currentHp: 100,
          maxHp: 100,
          atk: 10,
          armor: 5,
          speed: 3,
          initiative: 10,
          range: 1,
          attackCount: 1,
          team: 'player',
          role: 'tank',
          cost: 5,
          stats: {},
          abilities: [],
          dodge: 0,
        },
        seed: 12345,
      } as any;

      const phases = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ] as const;

      for (const phase of phases) {
        const result = processor.apply(phase, mockState, context);
        expect(result).toBe(mockState);
      }
    });
  });

  describe('damage calculation integration', () => {
    const processor = createFlankingProcessor();

    it('should calculate correct damage with front attack modifier', () => {
      const baseDamage = 100;
      const modifier = processor.getDamageModifier('front');
      const finalDamage = Math.floor(baseDamage * modifier);

      expect(finalDamage).toBe(100); // No bonus
    });

    it('should calculate correct damage with flank attack modifier', () => {
      const baseDamage = 100;
      const modifier = processor.getDamageModifier('flank');
      const finalDamage = Math.floor(baseDamage * modifier);

      // Note: 100 * 1.15 = 114.99999999999999 due to floating point precision
      // Math.floor gives 114, not 115
      expect(finalDamage).toBe(114); // +15% (with floor rounding)
    });

    it('should calculate correct damage with rear attack modifier', () => {
      const baseDamage = 100;
      const modifier = processor.getDamageModifier('rear');
      const finalDamage = Math.floor(baseDamage * modifier);

      expect(finalDamage).toBe(130); // +30%
    });

    it('should handle non-round damage values correctly', () => {
      const baseDamage = 73;

      expect(Math.floor(baseDamage * processor.getDamageModifier('front'))).toBe(
        73,
      );
      expect(Math.floor(baseDamage * processor.getDamageModifier('flank'))).toBe(
        83,
      ); // 73 * 1.15 = 83.95
      expect(Math.floor(baseDamage * processor.getDamageModifier('rear'))).toBe(
        94,
      ); // 73 * 1.3 = 94.9
    });
  });

  describe('riposte interaction', () => {
    const processor = createFlankingProcessor();

    it('should allow riposte check for front attacks', () => {
      const arc: AttackArc = 'front';
      const canCheckRiposte = !processor.disablesRiposte(arc);

      expect(canCheckRiposte).toBe(true);
    });

    it('should skip riposte check for flank attacks', () => {
      const arc: AttackArc = 'flank';
      const canCheckRiposte = !processor.disablesRiposte(arc);

      expect(canCheckRiposte).toBe(false);
    });

    it('should skip riposte check for rear attacks', () => {
      const arc: AttackArc = 'rear';
      const canCheckRiposte = !processor.disablesRiposte(arc);

      expect(canCheckRiposte).toBe(false);
    });
  });
});
