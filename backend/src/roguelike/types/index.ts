/**
 * Roguelike Types Exports
 *
 * Re-exports all roguelike-specific type definitions.
 *
 * @module roguelike/types
 */

// Faction types
export {
  Faction,
  FactionBonusStat,
  FactionBonus,
  FactionData,
  BrokenStateBehavior,
  FactionDataWithResolve,
} from './faction.types';

// Leader types
export {
  PassiveEffectType,
  PassiveAbility,
  SpellTiming,
  SpellTargetType,
  SpellEffectType,
  Spell,
  Leader,
  SpellExecution,
  SPELL_TIMING_THRESHOLDS,
} from './leader.types';

// Unit types
export {
  UnitTier,
  UnitRole,
  ResolveTrait,
  UnitStats,
  ResolveStats,
  RoguelikeUnit,
  UnitUpgradeLine,
  DeckCard,
  StarterDeck,
  StarterDeckEntry,
  TIER_STAT_MULTIPLIERS,
  TIER_RESOLVE_BONUSES,
  calculateUpgradeCost,
  calculateTotalCost,
} from './unit.types';
