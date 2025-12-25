/**
 * Roguelike Data Exports
 *
 * Re-exports all static game data for the roguelike mode.
 *
 * @module roguelike/data
 */

// Faction data
export {
  HUMANS_FACTION,
  UNDEAD_FACTION,
  FACTIONS_DATA,
  FACTION_LIST,
  getFaction,
  getFactionBasic,
  isValidFaction,
  applyFactionBonus,
} from './factions.data';

// Leader data
export {
  // Passives
  PASSIVE_FORMATION,
  PASSIVE_LIFE_DRAIN,
  // Spells
  SPELL_HOLY_LIGHT,
  SPELL_RALLY,
  SPELL_DEATH_COIL,
  SPELL_RAISE_DEAD,
  SPELLS_DATA,
  getSpell,
  getSpellsByFaction,
  // Leaders
  LEADER_COMMANDER_ALDRIC,
  LEADER_LICH_KING_MALACHAR,
  LEADERS_DATA,
  getLeader,
  getLeadersByFaction,
  isValidLeader,
  getLeaderWithSpells,
  // Spell trigger functions
  shouldTriggerSpell,
  getSpellTimingThreshold,
  createSpellExecution,
  markSpellTriggered,
  UnitHpState,
} from './leaders.data';

// Humans units
export {
  // T1 units
  FOOTMAN_T1,
  KNIGHT_T1,
  PALADIN_T1,
  SWORDSMAN_T1,
  CRUSADER_T1,
  CHAMPION_T1,
  ARCHER_T1,
  CROSSBOWMAN_T1,
  MARKSMAN_T1,
  APPRENTICE_T1,
  BATTLE_MAGE_T1,
  PRIEST_T1,
  // Upgrade lines
  FOOTMAN_LINE,
  KNIGHT_LINE,
  PALADIN_LINE,
  SWORDSMAN_LINE,
  CRUSADER_LINE,
  CHAMPION_LINE,
  ARCHER_LINE,
  CROSSBOWMAN_LINE,
  MARKSMAN_LINE,
  APPRENTICE_LINE,
  BATTLE_MAGE_LINE,
  PRIEST_LINE,
  // Collections
  HUMANS_T1_UNITS,
  HUMANS_UPGRADE_LINES,
  HUMANS_ALL_UNITS,
} from './humans.units';

// Undead units
export {
  // T1 units
  ZOMBIE_T1,
  ABOMINATION_T1,
  BONE_GOLEM_T1,
  SKELETON_WARRIOR_T1,
  GHOUL_T1,
  DEATH_KNIGHT_T1,
  SKELETON_ARCHER_T1,
  BANSHEE_T1,
  LICH_T1,
  NECROMANCER_T1,
  DARK_SORCERER_T1,
  VAMPIRE_T1,
  // Upgrade lines
  ZOMBIE_LINE,
  ABOMINATION_LINE,
  BONE_GOLEM_LINE,
  SKELETON_WARRIOR_LINE,
  GHOUL_LINE,
  DEATH_KNIGHT_LINE,
  SKELETON_ARCHER_LINE,
  BANSHEE_LINE,
  LICH_LINE,
  NECROMANCER_LINE,
  DARK_SORCERER_LINE,
  VAMPIRE_LINE,
  // Collections
  UNDEAD_T1_UNITS,
  UNDEAD_UPGRADE_LINES,
  UNDEAD_ALL_UNITS,
} from './undead.units';

// Starter decks
export {
  HUMANS_STARTER_DECK,
  UNDEAD_STARTER_DECK,
  STARTER_DECKS,
  getStarterDeck,
  getStarterDeckUnitCount,
  expandStarterDeck,
  isValidStarterDeck,
  getStarterDeckRoleDistribution,
} from './starter-decks.data';
