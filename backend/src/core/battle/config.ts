/**
 * Default battle configuration for the core battle engine.
 *
 * @module core/battle/config
 */

import { BattleConfig, DamageConfig } from '../types/config.types';

/**
 * Default battle configuration.
 * Standard battle parameters for most games.
 *
 * @example
 * import { DEFAULT_BATTLE_CONFIG } from '@core/battle/config';
 * const myConfig = { ...DEFAULT_BATTLE_CONFIG, maxRounds: 50 };
 */
export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  maxRounds: 100,
  minDamage: 1,
  dodgeCapPercent: 50,
};

/**
 * Default damage calculation configuration.
 * Standard formulas: physical reduced by armor, magic ignores armor.
 *
 * @example
 * import { DEFAULT_DAMAGE_CONFIG } from '@core/battle/config';
 * const damage = DEFAULT_DAMAGE_CONFIG.physicalFormula(20, 5, 2); // (20-5)*2 = 30
 */
export const DEFAULT_DAMAGE_CONFIG: DamageConfig = {
  physicalFormula: (atk: number, armor: number, atkCount: number): number =>
    Math.max(1, (atk - armor) * atkCount),
  magicFormula: (atk: number, atkCount: number): number => atk * atkCount,
};
