/**
 * Tests for configuration validator
 */

import { validateMechanicsConfig, ValidationError } from './validator';
import { MechanicsConfig } from './mechanics.types';
import { MVP_PRESET, ROGUELIKE_PRESET, TACTICAL_PRESET } from './presets';

describe('Configuration Validator', () => {
  describe('validateMechanicsConfig', () => {
    it('should accept MVP preset', () => {
      expect(() => validateMechanicsConfig(MVP_PRESET)).not.toThrow();
    });

    it('should accept ROGUELIKE preset', () => {
      expect(() => validateMechanicsConfig(ROGUELIKE_PRESET)).not.toThrow();
    });

    it('should accept TACTICAL preset', () => {
      expect(() => validateMechanicsConfig(TACTICAL_PRESET)).not.toThrow();
    });

    it('should accept empty config', () => {
      expect(() => validateMechanicsConfig({})).not.toThrow();
    });

    it('should accept valid custom config', () => {
      const config: MechanicsConfig = {
        flanking: {
          frontDamageModifier: 1.0,
          flankDamageModifier: 1.3,
          rearDamageModifier: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).not.toThrow();
    });
  });

  describe('ArmorShred validation', () => {
    it('should reject maxShred > 100', () => {
      const config: MechanicsConfig = {
        armorShred: {
          maxShred: 150,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject negative decayPerTurn', () => {
      const config: MechanicsConfig = {
        armorShred: {
          decayPerTurn: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Resolve validation', () => {
    it('should reject maxResolve <= 0', () => {
      const config: MechanicsConfig = {
        resolve: {
          maxResolve: 0,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject wavering > 100', () => {
      const config: MechanicsConfig = {
        resolve: {
          wavering: 150,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject humanRetreatChance > 1', () => {
      const config: MechanicsConfig = {
        resolve: {
          humanRetreatChance: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Engagement validation', () => {
    it('should reject negative zoneOfControlRange', () => {
      const config: MechanicsConfig = {
        engagement: {
          zoneOfControlRange: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject archerPenalty > 1', () => {
      const config: MechanicsConfig = {
        engagement: {
          archerPenalty: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Flanking validation', () => {
    it('should reject negative frontDamageModifier', () => {
      const config: MechanicsConfig = {
        flanking: {
          frontDamageModifier: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject resolveDamageModifier > 1', () => {
      const config: MechanicsConfig = {
        flanking: {
          resolveDamageModifier: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Riposte validation', () => {
    it('should reject baseChance > 1', () => {
      const config: MechanicsConfig = {
        riposte: {
          baseChance: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject negative chargeLimit', () => {
      const config: MechanicsConfig = {
        riposte: {
          chargeLimit: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Charge validation', () => {
    it('should reject negative momentumPerCell', () => {
      const config: MechanicsConfig = {
        charge: {
          momentumPerCell: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject spearWallCounterChance > 1', () => {
      const config: MechanicsConfig = {
        charge: {
          spearWallCounterChance: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Phalanx validation', () => {
    it('should reject negative minFormationSize', () => {
      const config: MechanicsConfig = {
        phalanx: {
          minFormationSize: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject armorBonus > 1', () => {
      const config: MechanicsConfig = {
        phalanx: {
          armorBonus: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('LineOfSight validation', () => {
    it('should reject arcFirePenalty > 1', () => {
      const config: MechanicsConfig = {
        lineOfSight: {
          arcFirePenalty: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Ammunition validation', () => {
    it('should reject negative maxAmmo', () => {
      const config: MechanicsConfig = {
        ammunition: {
          maxAmmo: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject negative reloadPerTurn', () => {
      const config: MechanicsConfig = {
        ammunition: {
          reloadPerTurn: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });

  describe('Contagion validation', () => {
    it('should reject spreadChance > 1', () => {
      const config: MechanicsConfig = {
        contagion: {
          spreadChance: 1.5,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });

    it('should reject negative spreadRange', () => {
      const config: MechanicsConfig = {
        contagion: {
          spreadRange: -1,
        },
      };
      expect(() => validateMechanicsConfig(config)).toThrow(ValidationError);
    });
  });
});
