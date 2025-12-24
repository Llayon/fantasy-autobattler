/**
 * Game battle module exports.
 * @fileoverview Game-specific battle logic for Fantasy Autobattler.
 */

// Synergies
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
} from './synergies';

// AI Decision
export {
  ActionType,
  UnitAction,
  decideAction,
  selectBestAction,
  shouldUseAbility,
  getActionPriority,
} from './ai.decision';

// Bot Generator
export {
  BotDifficulty,
  generateBotTeam,
  generateBotPositions,
  validateBotTeam,
} from './bot-generator';
