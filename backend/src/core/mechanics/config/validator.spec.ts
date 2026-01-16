/**
 * Unit tests for mechanics configuration validator
 *
 * Tests the validateMechanicsConfig() function for:
 * - Dependency consistency validation
 * - Config value bounds validation
 * - Warning generation
 *
 * @module core/mechanics/config
 */

import { validateMechanicsConfig } from './validator';
import { MVP_PRESET } from './presets/mvp';
import { ROGUELIKE_PRESET } from './presets/roguelike';
import { TACTICAL_PRESET } from './presets/tactical';
import {
  DEFAULT_RESOLVE_CONFIG,
  DEFAULT_ENGAGEMENT_CONFIG,
  DEFAULT_RIPOSTE_CONFIG,
  DEFAULT_INTERCEPT_CONFIG,
  DEFAULT_CHARGE_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_LOS_CONFIG,
  DEFAULT_AMMO_CONFIG,
  DEFAULT_CONTAGION_CONFIG,
  DEFAULT_SHRED_CONFIG,
} from './defaults';
import type { MechanicsConfig } from './mechanics.types';

describe('validateMechanicsConfig', () => {
  describe('valid configurations', () => {
    it('should validate MVP preset as valid', () => {
      const result = validateMechanicsConfig(MVP_PRESET);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate ROGUELIKE preset as valid', () => {
      const result = validateMechanicsConfig(ROGUELIKE_PRESET);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate TACTICAL preset as valid', () => {
      const result = validateMechanicsConfig(TACTICAL_PRESET);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate config with all defaults as valid', () => {
      const config: MechanicsConfig = {
        facing: true,
        resolve: DEFAULT_RESOLVE_CONFIG,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        flanking: true,
        riposte: DEFAULT_RIPOSTE_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        aura: true,
        charge: DEFAULT_CHARGE_CONFIG,
        overwatch: true,
        phalanx: DEFAULT_PHALANX_CONFIG,
        lineOfSight: DEFAULT_LOS_CONFIG,
        ammunition: DEFAULT_AMMO_CONFIG,
        contagion: DEFAULT_CONTAGION_CONFIG,
        armorShred: DEFAULT_SHRED_CONFIG,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('dependency consistency validation', () => {
    it('should error when flanking is enabled without facing', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        flanking: true,
        facing: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'flanking' requires 'facing' to be enabled, but it is disabled",
      );
    });

    it('should error when riposte is enabled without flanking', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        riposte: DEFAULT_RIPOSTE_CONFIG,
        flanking: false,
        facing: true,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'riposte' requires 'flanking' to be enabled, but it is disabled",
      );
    });

    it('should error when intercept is enabled without engagement', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        engagement: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'intercept' requires 'engagement' to be enabled, but it is disabled",
      );
    });

    it('should error when charge is enabled without intercept', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        charge: DEFAULT_CHARGE_CONFIG,
        intercept: false,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'charge' requires 'intercept' to be enabled, but it is disabled",
      );
    });

    it('should error when overwatch is enabled without intercept', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        overwatch: true,
        intercept: false,
        ammunition: DEFAULT_AMMO_CONFIG,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'overwatch' requires 'intercept' to be enabled, but it is disabled",
      );
    });

    it('should error when overwatch is enabled without ammunition', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        overwatch: true,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        ammunition: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'overwatch' requires 'ammunition' to be enabled, but it is disabled",
      );
    });

    it('should error when phalanx is enabled without facing', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        phalanx: DEFAULT_PHALANX_CONFIG,
        facing: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'phalanx' requires 'facing' to be enabled, but it is disabled",
      );
    });

    it('should error when lineOfSight is enabled without facing', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        lineOfSight: DEFAULT_LOS_CONFIG,
        facing: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Mechanic 'lineOfSight' requires 'facing' to be enabled, but it is disabled",
      );
    });

    it('should report multiple dependency errors', () => {
      // Enable overwatch which requires both intercept and ammunition
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        overwatch: true,
        intercept: false,
        ammunition: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors).toContain(
        "Mechanic 'overwatch' requires 'intercept' to be enabled, but it is disabled",
      );
      expect(result.errors).toContain(
        "Mechanic 'overwatch' requires 'ammunition' to be enabled, but it is disabled",
      );
    });
  });


  describe('resolve config bounds validation', () => {
    it('should error when maxResolve is zero', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, maxResolve: 0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resolve.maxResolve must be positive');
    });

    it('should error when maxResolve is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, maxResolve: -10 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resolve.maxResolve must be positive');
    });

    it('should error when baseRegeneration is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, baseRegeneration: -5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resolve.baseRegeneration cannot be negative');
    });

    it('should error when flankingResolveDamage is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, flankingResolveDamage: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resolve.flankingResolveDamage cannot be negative');
    });

    it('should error when rearResolveDamage is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, rearResolveDamage: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resolve.rearResolveDamage cannot be negative');
    });

    it('should allow zero baseRegeneration', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, baseRegeneration: 0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('engagement config bounds validation', () => {
    it('should error when archerPenaltyPercent is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: { ...DEFAULT_ENGAGEMENT_CONFIG, archerPenaltyPercent: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('engagement.archerPenaltyPercent must be between 0 and 1');
    });

    it('should error when archerPenaltyPercent is greater than 1', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: { ...DEFAULT_ENGAGEMENT_CONFIG, archerPenaltyPercent: 1.5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('engagement.archerPenaltyPercent must be between 0 and 1');
    });

    it('should allow archerPenaltyPercent at boundary values', () => {
      const configZero: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: { ...DEFAULT_ENGAGEMENT_CONFIG, archerPenaltyPercent: 0 },
      };
      const configOne: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: { ...DEFAULT_ENGAGEMENT_CONFIG, archerPenaltyPercent: 1 },
      };

      expect(validateMechanicsConfig(configZero).valid).toBe(true);
      expect(validateMechanicsConfig(configOne).valid).toBe(true);
    });
  });

  describe('riposte config bounds validation', () => {
    it('should error when baseChance is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        flanking: true,
        riposte: { ...DEFAULT_RIPOSTE_CONFIG, baseChance: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('riposte.baseChance must be between 0 and 1');
    });

    it('should error when baseChance is greater than 1', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        flanking: true,
        riposte: { ...DEFAULT_RIPOSTE_CONFIG, baseChance: 1.5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('riposte.baseChance must be between 0 and 1');
    });

    it('should error when guaranteedThreshold is zero', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        flanking: true,
        riposte: { ...DEFAULT_RIPOSTE_CONFIG, guaranteedThreshold: 0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('riposte.guaranteedThreshold must be positive');
    });

    it('should error when guaranteedThreshold is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        flanking: true,
        riposte: { ...DEFAULT_RIPOSTE_CONFIG, guaranteedThreshold: -5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('riposte.guaranteedThreshold must be positive');
    });
  });

  describe('intercept config bounds validation', () => {
    it('should error when disengageCost is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: { ...DEFAULT_INTERCEPT_CONFIG, disengageCost: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('intercept.disengageCost cannot be negative');
    });

    it('should allow zero disengageCost', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: { ...DEFAULT_INTERCEPT_CONFIG, disengageCost: 0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
    });
  });


  describe('charge config bounds validation', () => {
    it('should error when momentumPerCell is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        charge: { ...DEFAULT_CHARGE_CONFIG, momentumPerCell: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('charge.momentumPerCell cannot be negative');
    });

    it('should error when maxMomentum is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        charge: { ...DEFAULT_CHARGE_CONFIG, maxMomentum: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('charge.maxMomentum cannot be negative');
    });

    it('should error when minChargeDistance is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        charge: { ...DEFAULT_CHARGE_CONFIG, minChargeDistance: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('charge.minChargeDistance cannot be negative');
    });

    it('should error when shockResolveDamage is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        charge: { ...DEFAULT_CHARGE_CONFIG, shockResolveDamage: -5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('charge.shockResolveDamage cannot be negative');
    });

    it('should allow zero values for charge config', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        charge: {
          momentumPerCell: 0,
          maxMomentum: 0,
          minChargeDistance: 0,
          shockResolveDamage: 0,
        },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('phalanx config bounds validation', () => {
    it('should error when maxArmorBonus is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        phalanx: { ...DEFAULT_PHALANX_CONFIG, maxArmorBonus: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phalanx.maxArmorBonus cannot be negative');
    });

    it('should error when maxResolveBonus is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        phalanx: { ...DEFAULT_PHALANX_CONFIG, maxResolveBonus: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phalanx.maxResolveBonus cannot be negative');
    });

    it('should error when armorPerAlly is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        phalanx: { ...DEFAULT_PHALANX_CONFIG, armorPerAlly: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phalanx.armorPerAlly cannot be negative');
    });

    it('should error when resolvePerAlly is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        phalanx: { ...DEFAULT_PHALANX_CONFIG, resolvePerAlly: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('phalanx.resolvePerAlly cannot be negative');
    });
  });

  describe('lineOfSight config bounds validation', () => {
    it('should error when arcFirePenalty is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        lineOfSight: { ...DEFAULT_LOS_CONFIG, arcFirePenalty: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('lineOfSight.arcFirePenalty must be between 0 and 1');
    });

    it('should error when arcFirePenalty is greater than 1', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        lineOfSight: { ...DEFAULT_LOS_CONFIG, arcFirePenalty: 1.5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('lineOfSight.arcFirePenalty must be between 0 and 1');
    });
  });

  describe('ammunition config bounds validation', () => {
    it('should error when defaultAmmo is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        ammunition: { ...DEFAULT_AMMO_CONFIG, defaultAmmo: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ammunition.defaultAmmo cannot be negative');
    });

    it('should error when defaultCooldown is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        ammunition: { ...DEFAULT_AMMO_CONFIG, defaultCooldown: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ammunition.defaultCooldown cannot be negative');
    });

    it('should allow zero values for ammunition config', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        ammunition: { ...DEFAULT_AMMO_CONFIG, defaultAmmo: 0, defaultCooldown: 0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
    });
  });


  describe('contagion config bounds validation', () => {
    it('should error when fireSpread is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, fireSpread: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('contagion.fireSpread must be between 0 and 1');
    });

    it('should error when fireSpread is greater than 1', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, fireSpread: 1.5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('contagion.fireSpread must be between 0 and 1');
    });

    it('should error when poisonSpread is out of bounds', () => {
      const configNegative: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, poisonSpread: -0.1 },
      };
      const configOver: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, poisonSpread: 1.1 },
      };

      expect(validateMechanicsConfig(configNegative).errors).toContain(
        'contagion.poisonSpread must be between 0 and 1',
      );
      expect(validateMechanicsConfig(configOver).errors).toContain(
        'contagion.poisonSpread must be between 0 and 1',
      );
    });

    it('should error when curseSpread is out of bounds', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, curseSpread: -0.5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('contagion.curseSpread must be between 0 and 1');
    });

    it('should error when frostSpread is out of bounds', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, frostSpread: 2.0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('contagion.frostSpread must be between 0 and 1');
    });

    it('should error when plagueSpread is out of bounds', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, plagueSpread: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('contagion.plagueSpread must be between 0 and 1');
    });

    it('should error when phalanxSpreadBonus is out of bounds', () => {
      const configNegative: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, phalanxSpreadBonus: -0.1 },
      };
      const configOver: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: { ...DEFAULT_CONTAGION_CONFIG, phalanxSpreadBonus: 1.5 },
      };

      expect(validateMechanicsConfig(configNegative).errors).toContain(
        'contagion.phalanxSpreadBonus must be between 0 and 1',
      );
      expect(validateMechanicsConfig(configOver).errors).toContain(
        'contagion.phalanxSpreadBonus must be between 0 and 1',
      );
    });

    it('should allow boundary values for contagion spread', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: {
          fireSpread: 0,
          poisonSpread: 1,
          curseSpread: 0,
          frostSpread: 1,
          plagueSpread: 0.5,
          phalanxSpreadBonus: 0,
        },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('armorShred config bounds validation', () => {
    it('should error when shredPerAttack is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        armorShred: { ...DEFAULT_SHRED_CONFIG, shredPerAttack: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('armorShred.shredPerAttack cannot be negative');
    });

    it('should error when maxShredPercent is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        armorShred: { ...DEFAULT_SHRED_CONFIG, maxShredPercent: -0.1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('armorShred.maxShredPercent must be between 0 and 1');
    });

    it('should error when maxShredPercent is greater than 1', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        armorShred: { ...DEFAULT_SHRED_CONFIG, maxShredPercent: 1.5 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('armorShred.maxShredPercent must be between 0 and 1');
    });

    it('should error when decayPerTurn is negative', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        armorShred: { ...DEFAULT_SHRED_CONFIG, decayPerTurn: -1 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('armorShred.decayPerTurn cannot be negative');
    });

    it('should allow zero values for armorShred config', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        armorShred: {
          shredPerAttack: 0,
          maxShredPercent: 0,
          decayPerTurn: 0,
        },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('warnings', () => {
    it('should warn when both contagion and phalanx are enabled', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        contagion: DEFAULT_CONTAGION_CONFIG,
        phalanx: DEFAULT_PHALANX_CONFIG,
      };

      const result = validateMechanicsConfig(config);

      expect(result.warnings).toContain(
        'Both contagion and phalanx are enabled. Contagion spreads faster in phalanx formations.',
      );
    });

    it('should not warn when only contagion is enabled', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        contagion: DEFAULT_CONTAGION_CONFIG,
      };

      const result = validateMechanicsConfig(config);

      expect(result.warnings).toHaveLength(0);
    });

    it('should not warn when only phalanx is enabled', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        facing: true,
        phalanx: DEFAULT_PHALANX_CONFIG,
      };

      const result = validateMechanicsConfig(config);

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('multiple validation errors', () => {
    it('should report all errors in a single validation', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        resolve: { ...DEFAULT_RESOLVE_CONFIG, maxResolve: -10, baseRegeneration: -5 },
        engagement: { ...DEFAULT_ENGAGEMENT_CONFIG, archerPenaltyPercent: 2.0 },
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors).toContain('resolve.maxResolve must be positive');
      expect(result.errors).toContain('resolve.baseRegeneration cannot be negative');
      expect(result.errors).toContain('engagement.archerPenaltyPercent must be between 0 and 1');
    });
  });

  describe('ValidationResult structure', () => {
    it('should return correct structure for valid config', () => {
      const result = validateMechanicsConfig(MVP_PRESET);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should return correct structure for invalid config', () => {
      const config: MechanicsConfig = {
        ...MVP_PRESET,
        flanking: true,
        facing: false,
      };

      const result = validateMechanicsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
