/**
 * Unit tests for configuration validators.
 * Tests validation of GridConfig and BattleConfig.
 *
 * @module core/types/config.validators.spec
 */

import { validateGridConfig, validateBattleConfig, validateEngineConfig } from './config.validators';
import type { GridConfig, BattleConfig } from './config.types';

describe('Config Validators (Core)', () => {
  describe('validateGridConfig', () => {
    describe('valid configurations', () => {
      it('should accept standard 8×10 grid config', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [0, 1],
          enemyRows: [8, 9],
        };

        expect(() => validateGridConfig(config)).not.toThrow();
      });

      it('should accept minimal 1×1 grid config', () => {
        const config: GridConfig = {
          width: 1,
          height: 1,
          playerRows: [],
          enemyRows: [],
        };

        expect(() => validateGridConfig(config)).not.toThrow();
      });

      it('should accept custom grid sizes', () => {
        const configs: GridConfig[] = [
          { width: 4, height: 4, playerRows: [0], enemyRows: [3] },
          { width: 16, height: 20, playerRows: [0, 1, 2], enemyRows: [17, 18, 19] },
          { width: 100, height: 100, playerRows: [0], enemyRows: [99] },
        ];

        for (const config of configs) {
          expect(() => validateGridConfig(config)).not.toThrow();
        }
      });

      it('should accept empty deployment zones', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [],
          enemyRows: [],
        };

        expect(() => validateGridConfig(config)).not.toThrow();
      });
    });

    describe('invalid dimensions', () => {
      it('should reject zero width', () => {
        const config: GridConfig = {
          width: 0,
          height: 10,
          playerRows: [],
          enemyRows: [],
        };

        expect(() => validateGridConfig(config)).toThrow('Grid dimensions must be positive');
      });

      it('should reject zero height', () => {
        const config: GridConfig = {
          width: 8,
          height: 0,
          playerRows: [],
          enemyRows: [],
        };

        expect(() => validateGridConfig(config)).toThrow('Grid dimensions must be positive');
      });

      it('should reject negative width', () => {
        const config: GridConfig = {
          width: -5,
          height: 10,
          playerRows: [],
          enemyRows: [],
        };

        expect(() => validateGridConfig(config)).toThrow('Grid dimensions must be positive');
      });

      it('should reject negative height', () => {
        const config: GridConfig = {
          width: 8,
          height: -10,
          playerRows: [],
          enemyRows: [],
        };

        expect(() => validateGridConfig(config)).toThrow('Grid dimensions must be positive');
      });
    });

    describe('invalid row indices', () => {
      it('should reject player row outside grid bounds (too high)', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [0, 10], // Row 10 is outside [0, 9]
          enemyRows: [8, 9],
        };

        expect(() => validateGridConfig(config)).toThrow('Player row 10 is outside grid bounds');
      });

      it('should reject player row outside grid bounds (negative)', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [-1, 0],
          enemyRows: [8, 9],
        };

        expect(() => validateGridConfig(config)).toThrow('Player row -1 is outside grid bounds');
      });

      it('should reject enemy row outside grid bounds (too high)', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [0, 1],
          enemyRows: [8, 15], // Row 15 is outside [0, 9]
        };

        expect(() => validateGridConfig(config)).toThrow('Enemy row 15 is outside grid bounds');
      });

      it('should reject enemy row outside grid bounds (negative)', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [0, 1],
          enemyRows: [-2, 9],
        };

        expect(() => validateGridConfig(config)).toThrow('Enemy row -2 is outside grid bounds');
      });
    });

    describe('overlapping deployment zones', () => {
      it('should reject overlapping player and enemy rows', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [0, 1, 5], // Row 5 overlaps
          enemyRows: [5, 8, 9], // Row 5 overlaps
        };

        expect(() => validateGridConfig(config)).toThrow(
          'Row 5 is assigned to both player and enemy deployment zones'
        );
      });

      it('should reject completely overlapping zones', () => {
        const config: GridConfig = {
          width: 8,
          height: 10,
          playerRows: [4, 5],
          enemyRows: [4, 5],
        };

        expect(() => validateGridConfig(config)).toThrow(
          'Row 4 is assigned to both player and enemy deployment zones'
        );
      });
    });
  });

  describe('validateBattleConfig', () => {
    describe('valid configurations', () => {
      it('should accept standard battle config', () => {
        const config: BattleConfig = {
          maxRounds: 100,
          minDamage: 1,
          dodgeCapPercent: 50,
        };

        expect(() => validateBattleConfig(config)).not.toThrow();
      });

      it('should accept minimal battle config', () => {
        const config: BattleConfig = {
          maxRounds: 1,
          minDamage: 0,
          dodgeCapPercent: 0,
        };

        expect(() => validateBattleConfig(config)).not.toThrow();
      });

      it('should accept maximum dodge cap', () => {
        const config: BattleConfig = {
          maxRounds: 100,
          minDamage: 1,
          dodgeCapPercent: 100,
        };

        expect(() => validateBattleConfig(config)).not.toThrow();
      });

      it('should accept high values', () => {
        const config: BattleConfig = {
          maxRounds: 10000,
          minDamage: 100,
          dodgeCapPercent: 75,
        };

        expect(() => validateBattleConfig(config)).not.toThrow();
      });
    });

    describe('invalid maxRounds', () => {
      it('should reject zero maxRounds', () => {
        const config: BattleConfig = {
          maxRounds: 0,
          minDamage: 1,
          dodgeCapPercent: 50,
        };

        expect(() => validateBattleConfig(config)).toThrow('Max rounds must be positive');
      });

      it('should reject negative maxRounds', () => {
        const config: BattleConfig = {
          maxRounds: -10,
          minDamage: 1,
          dodgeCapPercent: 50,
        };

        expect(() => validateBattleConfig(config)).toThrow('Max rounds must be positive');
      });
    });

    describe('invalid minDamage', () => {
      it('should reject negative minDamage', () => {
        const config: BattleConfig = {
          maxRounds: 100,
          minDamage: -1,
          dodgeCapPercent: 50,
        };

        expect(() => validateBattleConfig(config)).toThrow('Min damage cannot be negative');
      });
    });

    describe('invalid dodgeCapPercent', () => {
      it('should reject negative dodgeCapPercent', () => {
        const config: BattleConfig = {
          maxRounds: 100,
          minDamage: 1,
          dodgeCapPercent: -10,
        };

        expect(() => validateBattleConfig(config)).toThrow('Dodge cap must be between 0 and 100');
      });

      it('should reject dodgeCapPercent over 100', () => {
        const config: BattleConfig = {
          maxRounds: 100,
          minDamage: 1,
          dodgeCapPercent: 150,
        };

        expect(() => validateBattleConfig(config)).toThrow('Dodge cap must be between 0 and 100');
      });
    });
  });

  describe('validateEngineConfig', () => {
    it('should accept valid grid and battle configs', () => {
      const gridConfig: GridConfig = {
        width: 8,
        height: 10,
        playerRows: [0, 1],
        enemyRows: [8, 9],
      };

      const battleConfig: BattleConfig = {
        maxRounds: 100,
        minDamage: 1,
        dodgeCapPercent: 50,
      };

      expect(() => validateEngineConfig(gridConfig, battleConfig)).not.toThrow();
    });

    it('should reject invalid grid config', () => {
      const gridConfig: GridConfig = {
        width: 0, // Invalid
        height: 10,
        playerRows: [],
        enemyRows: [],
      };

      const battleConfig: BattleConfig = {
        maxRounds: 100,
        minDamage: 1,
        dodgeCapPercent: 50,
      };

      expect(() => validateEngineConfig(gridConfig, battleConfig)).toThrow(
        'Grid dimensions must be positive'
      );
    });

    it('should reject invalid battle config', () => {
      const gridConfig: GridConfig = {
        width: 8,
        height: 10,
        playerRows: [0, 1],
        enemyRows: [8, 9],
      };

      const battleConfig: BattleConfig = {
        maxRounds: 0, // Invalid
        minDamage: 1,
        dodgeCapPercent: 50,
      };

      expect(() => validateEngineConfig(gridConfig, battleConfig)).toThrow(
        'Max rounds must be positive'
      );
    });
  });
});
