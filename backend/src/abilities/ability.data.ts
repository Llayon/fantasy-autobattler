/**
 * Re-export ability data from game module for backward compatibility.
 * @fileoverview All ability data has been moved to game/abilities/ability.data.ts
 */

export {
  GameAbilityId,
  ABILITIES,
  getAbility,
  getActiveAbilities,
  getPassiveAbilities,
  getAllAbilityIds,
  hasAbility,
  getAbilitiesByEffectType,
  getAbilitiesByTargetType,
  calculateCooldownReduction,
  getFormattedDescription,
  isOnCooldown,
  isInAbilityRange,
  UNIT_ABILITY_MAP,
  getUnitAbility,
  unitHasActiveAbility,
  unitHasPassiveAbility,
} from '../game/abilities/ability.data';
