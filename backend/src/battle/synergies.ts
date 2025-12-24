/**
 * Re-export synergies from game module for backward compatibility.
 * @fileoverview All synergy logic has been moved to game/battle/synergies.ts
 */

export {
  StatModifier,
  SynergyBonus,
  RoleRequirement,
  Synergy,
  ActiveSynergy,
  SYNERGIES,
  calculateSynergies,
  applySynergyBonuses,
  getSynergyById,
  getAllSynergies,
  calculateTotalStatBonus,
  formatSynergyBonus,
} from '../game/battle/synergies';
