/**
 * Core Mechanics 2.0 - Preset Structure Tests
 *
 * Verifies that all presets have correct structure and valid configurations.
 *
 * @module core/mechanics/config/presets
 */

import { MVP_PRESET, ROGUELIKE_PRESET, TACTICAL_PRESET } from './index';
import { validateMechanicsConfig } from '../validator';
import type { MechanicsConfig } from '../mechanics.types';

/**
 * All mechanic keys that must be present in every preset.
 */
const ALL_MECHANIC_KEYS: (keyof MechanicsConfig)[] = [
  'facing',
  'resolve',
  'engagement',
  'flanking',
  'riposte',
  'intercept',
  'aura',
  'charge',
  'overwatch',
  'phalanx',
  'lineOfSight',
  'ammunition',
  'contagion',
  'armorShred',
];

describe('Preset Structure Tests', () => {
  describe('MVP_PRESET', () => {
    it('should have all 14 mechanic keys defined', () => {
      for (const key of ALL_MECHANIC_KEYS) {
        expect(MVP_PRESET).toHaveProperty(key);
      }
    });

    it('should have all mechanics disabled (false)', () => {
      for (const key of ALL_MECHANIC_KEYS) {
        expect(MVP_PRESET[key]).toBe(false);
      }
    });

    it('should pass validation', () => {
      const result = validateMechanicsConfig(MVP_PRESET);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have exactly 14 keys (no extra properties)', () => {
      expect(Object.keys(MVP_PRESET)).toHaveLength(14);
    });
  });

  describe('ROGUELIKE_PRESET', () => {
    it('should have all 14 mechanic keys defined', () => {
      for (const key of ALL_MECHANIC_KEYS) {
        expect(ROGUELIKE_PRESET).toHaveProperty(key);
      }
    });

    it('should have all mechanics enabled', () => {
      for (const key of ALL_MECHANIC_KEYS) {
        expect(ROGUELIKE_PRESET[key]).not.toBe(false);
      }
    });

    it('should pass validation', () => {
      const result = validateMechanicsConfig(ROGUELIKE_PRESET);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have exactly 14 keys (no extra properties)', () => {
      expect(Object.keys(ROGUELIKE_PRESET)).toHaveLength(14);
    });

    it('should have resolve config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.resolve).toBe('object');
      if (typeof ROGUELIKE_PRESET.resolve === 'object') {
        expect(ROGUELIKE_PRESET.resolve).toHaveProperty('maxResolve');
        expect(ROGUELIKE_PRESET.resolve).toHaveProperty('baseRegeneration');
        expect(ROGUELIKE_PRESET.resolve).toHaveProperty('humanRetreat');
        expect(ROGUELIKE_PRESET.resolve).toHaveProperty('undeadCrumble');
        expect(ROGUELIKE_PRESET.resolve).toHaveProperty('flankingResolveDamage');
        expect(ROGUELIKE_PRESET.resolve).toHaveProperty('rearResolveDamage');
      }
    });

    it('should have engagement config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.engagement).toBe('object');
      if (typeof ROGUELIKE_PRESET.engagement === 'object') {
        expect(ROGUELIKE_PRESET.engagement).toHaveProperty(
          'attackOfOpportunity',
        );
        expect(ROGUELIKE_PRESET.engagement).toHaveProperty('archerPenalty');
        expect(ROGUELIKE_PRESET.engagement).toHaveProperty(
          'archerPenaltyPercent',
        );
      }
    });

    it('should have riposte config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.riposte).toBe('object');
      if (typeof ROGUELIKE_PRESET.riposte === 'object') {
        expect(ROGUELIKE_PRESET.riposte).toHaveProperty('initiativeBased');
        expect(ROGUELIKE_PRESET.riposte).toHaveProperty('chargesPerRound');
        expect(ROGUELIKE_PRESET.riposte).toHaveProperty('baseChance');
        expect(ROGUELIKE_PRESET.riposte).toHaveProperty('guaranteedThreshold');
      }
    });

    it('should have intercept config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.intercept).toBe('object');
      if (typeof ROGUELIKE_PRESET.intercept === 'object') {
        expect(ROGUELIKE_PRESET.intercept).toHaveProperty('hardIntercept');
        expect(ROGUELIKE_PRESET.intercept).toHaveProperty('softIntercept');
        expect(ROGUELIKE_PRESET.intercept).toHaveProperty('disengageCost');
      }
    });

    it('should have charge config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.charge).toBe('object');
      if (typeof ROGUELIKE_PRESET.charge === 'object') {
        expect(ROGUELIKE_PRESET.charge).toHaveProperty('momentumPerCell');
        expect(ROGUELIKE_PRESET.charge).toHaveProperty('maxMomentum');
        expect(ROGUELIKE_PRESET.charge).toHaveProperty('shockResolveDamage');
        expect(ROGUELIKE_PRESET.charge).toHaveProperty('minChargeDistance');
      }
    });

    it('should have phalanx config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.phalanx).toBe('object');
      if (typeof ROGUELIKE_PRESET.phalanx === 'object') {
        expect(ROGUELIKE_PRESET.phalanx).toHaveProperty('maxArmorBonus');
        expect(ROGUELIKE_PRESET.phalanx).toHaveProperty('maxResolveBonus');
        expect(ROGUELIKE_PRESET.phalanx).toHaveProperty('armorPerAlly');
        expect(ROGUELIKE_PRESET.phalanx).toHaveProperty('resolvePerAlly');
      }
    });

    it('should have lineOfSight config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.lineOfSight).toBe('object');
      if (typeof ROGUELIKE_PRESET.lineOfSight === 'object') {
        expect(ROGUELIKE_PRESET.lineOfSight).toHaveProperty('directFire');
        expect(ROGUELIKE_PRESET.lineOfSight).toHaveProperty('arcFire');
        expect(ROGUELIKE_PRESET.lineOfSight).toHaveProperty('arcFirePenalty');
      }
    });

    it('should have ammunition config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.ammunition).toBe('object');
      if (typeof ROGUELIKE_PRESET.ammunition === 'object') {
        expect(ROGUELIKE_PRESET.ammunition).toHaveProperty('enabled');
        expect(ROGUELIKE_PRESET.ammunition).toHaveProperty('mageCooldowns');
        expect(ROGUELIKE_PRESET.ammunition).toHaveProperty('defaultAmmo');
        expect(ROGUELIKE_PRESET.ammunition).toHaveProperty('defaultCooldown');
      }
    });

    it('should have contagion config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.contagion).toBe('object');
      if (typeof ROGUELIKE_PRESET.contagion === 'object') {
        expect(ROGUELIKE_PRESET.contagion).toHaveProperty('fireSpread');
        expect(ROGUELIKE_PRESET.contagion).toHaveProperty('poisonSpread');
        expect(ROGUELIKE_PRESET.contagion).toHaveProperty('curseSpread');
        expect(ROGUELIKE_PRESET.contagion).toHaveProperty('frostSpread');
        expect(ROGUELIKE_PRESET.contagion).toHaveProperty('plagueSpread');
        expect(ROGUELIKE_PRESET.contagion).toHaveProperty('phalanxSpreadBonus');
      }
    });

    it('should have armorShred config with all required fields', () => {
      expect(typeof ROGUELIKE_PRESET.armorShred).toBe('object');
      if (typeof ROGUELIKE_PRESET.armorShred === 'object') {
        expect(ROGUELIKE_PRESET.armorShred).toHaveProperty('shredPerAttack');
        expect(ROGUELIKE_PRESET.armorShred).toHaveProperty('maxShredPercent');
        expect(ROGUELIKE_PRESET.armorShred).toHaveProperty('decayPerTurn');
      }
    });
  });

  describe('TACTICAL_PRESET', () => {
    it('should have all 14 mechanic keys defined', () => {
      for (const key of ALL_MECHANIC_KEYS) {
        expect(TACTICAL_PRESET).toHaveProperty(key);
      }
    });

    it('should pass validation', () => {
      const result = validateMechanicsConfig(TACTICAL_PRESET);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have exactly 14 keys (no extra properties)', () => {
      expect(Object.keys(TACTICAL_PRESET)).toHaveLength(14);
    });

    it('should have Tier 0-2 mechanics enabled', () => {
      // Tier 0
      expect(TACTICAL_PRESET.facing).toBe(true);

      // Tier 1
      expect(TACTICAL_PRESET.resolve).not.toBe(false);
      expect(TACTICAL_PRESET.engagement).not.toBe(false);
      expect(TACTICAL_PRESET.flanking).toBe(true);

      // Tier 2
      expect(TACTICAL_PRESET.riposte).not.toBe(false);
      expect(TACTICAL_PRESET.intercept).not.toBe(false);
    });

    it('should have Tier 3-4 mechanics disabled', () => {
      // Tier 2 (aura disabled in tactical)
      expect(TACTICAL_PRESET.aura).toBe(false);

      // Tier 3
      expect(TACTICAL_PRESET.charge).toBe(false);
      expect(TACTICAL_PRESET.overwatch).toBe(false);
      expect(TACTICAL_PRESET.phalanx).toBe(false);
      expect(TACTICAL_PRESET.lineOfSight).toBe(false);
      expect(TACTICAL_PRESET.ammunition).toBe(false);

      // Tier 4
      expect(TACTICAL_PRESET.contagion).toBe(false);
      expect(TACTICAL_PRESET.armorShred).toBe(false);
    });
  });

  describe('Preset Consistency', () => {
    it('all presets should have the same keys', () => {
      const mvpKeys = Object.keys(MVP_PRESET).sort();
      const roguelikeKeys = Object.keys(ROGUELIKE_PRESET).sort();
      const tacticalKeys = Object.keys(TACTICAL_PRESET).sort();

      expect(mvpKeys).toEqual(roguelikeKeys);
      expect(mvpKeys).toEqual(tacticalKeys);
    });

    it('all presets should be valid MechanicsConfig objects', () => {
      const presets = [MVP_PRESET, ROGUELIKE_PRESET, TACTICAL_PRESET];

      for (const preset of presets) {
        const result = validateMechanicsConfig(preset);
        expect(result.valid).toBe(true);
      }
    });
  });
});
