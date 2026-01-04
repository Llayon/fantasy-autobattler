/**
 * Test Fixtures for Core Mechanics 2.0
 *
 * Provides reusable test fixtures for common battle scenarios.
 * Used for integration tests, regression tests, and property-based testing.
 *
 * @module core/mechanics/test-fixtures
 */

import { Position } from '../types/grid.types';
import { BattleUnit, BattleState, TeamType, UnitStats } from '../types/battle.types';
import { TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId, UNIT_TEMPLATES } from '../../unit/unit.data';

// ═══════════════════════════════════════════════════════════════
// UNIT FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a minimal BattleUnit for testing.
 * Provides sensible defaults that can be overridden.
 *
 * @param overrides - Partial unit properties to override defaults
 * @returns Complete BattleUnit instance
 *
 * @example
 * const tank = createTestUnit({ id: 'tank', stats: { hp: 200, armor: 15 } });
 */
export function createTestUnit(
  overrides: Partial<BattleUnit> & { id?: string } = {},
): BattleUnit {
  const id = overrides.id ?? 'test-unit';
  const instanceId = overrides.instanceId ?? `${id}-${Date.now()}`;

  const defaultStats: UnitStats = {
    hp: 100,
    atk: 10,
    atkCount: 1,
    armor: 5,
    speed: 3,
    initiative: 5,
    dodge: 0,
  };

  return {
    id,
    name: overrides.name ?? 'Test Unit',
    role: overrides.role ?? 'tank',
    cost: overrides.cost ?? 5,
    stats: { ...defaultStats, ...overrides.stats },
    range: overrides.range ?? 1,
    abilities: overrides.abilities ?? [],
    position: overrides.position ?? { x: 0, y: 0 },
    currentHp: overrides.currentHp ?? overrides.stats?.hp ?? defaultStats.hp,
    maxHp: overrides.maxHp ?? overrides.stats?.hp ?? defaultStats.hp,
    team: overrides.team ?? 'player',
    alive: overrides.alive ?? true,
    instanceId,
  };
}

/**
 * Creates a BattleUnit from a game unit template.
 *
 * @param unitId - ID of the unit template to use
 * @param team - Team assignment
 * @param position - Position on the battlefield
 * @param index - Index for unique instance ID generation
 * @returns BattleUnit instance based on template
 *
 * @example
 * const knight = createUnitFromTemplate('knight', 'player', { x: 1, y: 0 }, 0);
 */
export function createUnitFromTemplate(
  unitId: UnitId,
  team: TeamType,
  position: Position,
  index: number = 0,
): BattleUnit {
  const template = getUnitTemplate(unitId);
  if (!template) {
    throw new Error(`Unit template not found: ${unitId}`);
  }

  return {
    ...template,
    position,
    currentHp: template.stats.hp,
    maxHp: template.stats.hp,
    team,
    alive: true,
    instanceId: `${team}_${unitId}_${index}`,
  };
}

// ═══════════════════════════════════════════════════════════════
// BATTLE STATE FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a minimal BattleState for testing.
 *
 * @param units - Array of battle units
 * @param round - Current round number
 * @returns BattleState instance
 *
 * @example
 * const state = createTestBattleState([attacker, defender], 1);
 */
export function createTestBattleState(
  units: BattleUnit[],
  round: number = 1,
): BattleState {
  return {
    units,
    round,
    events: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// TEAM SETUP FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a TeamSetup from unit IDs and positions.
 *
 * @param unitIds - Array of unit template IDs
 * @param positions - Array of positions for each unit
 * @returns TeamSetup instance
 *
 * @example
 * const team = createTeamSetup(['knight', 'archer'], [{ x: 1, y: 0 }, { x: 2, y: 1 }]);
 */
export function createTeamSetup(
  unitIds: UnitId[],
  positions: Position[],
): TeamSetup {
  const units = unitIds.map((id) => {
    const template = getUnitTemplate(id);
    if (!template) {
      throw new Error(`Unit template not found: ${id}`);
    }
    return template;
  });

  return { units, positions };
}

/**
 * Creates a TeamSetup with custom unit stats.
 *
 * @param unitConfigs - Array of unit configurations with optional stat overrides
 * @returns TeamSetup instance
 *
 * @example
 * const team = createCustomTeamSetup([
 *   { unitId: 'knight', position: { x: 1, y: 0 }, stats: { hp: 200 } },
 *   { unitId: 'archer', position: { x: 2, y: 1 } },
 * ]);
 */
export function createCustomTeamSetup(
  unitConfigs: Array<{
    unitId: UnitId;
    position: Position;
    stats?: Partial<UnitStats>;
  }>,
): TeamSetup {
  const units = unitConfigs.map((config) => {
    const template = getUnitTemplate(config.unitId);
    if (!template) {
      throw new Error(`Unit template not found: ${config.unitId}`);
    }

    if (config.stats) {
      return {
        ...template,
        stats: { ...template.stats, ...config.stats },
      };
    }
    return template;
  });

  const positions = unitConfigs.map((config) => config.position);

  return { units, positions };
}

// ═══════════════════════════════════════════════════════════════
// COMMON BATTLE SCENARIO FIXTURES
// ═══════════════════════════════════════════════════════════════

/**
 * Standard test seeds for deterministic testing.
 */
export const TEST_SEEDS = {
  /** Default seed for basic tests */
  DEFAULT: 12345,
  /** Seed that tends to favor player */
  PLAYER_FAVORABLE: 42,
  /** Seed that tends to favor bot */
  BOT_FAVORABLE: 77777,
  /** Seed for edge case testing */
  EDGE_CASE: 99999,
  /** Array of seeds for multi-seed testing */
  MULTI: [1001, 2002, 3003, 4004, 5005],
} as const;

/**
 * Standard deployment positions for player team.
 */
export const PLAYER_POSITIONS = {
  /** Front row positions (y=0) */
  FRONT_ROW: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 5, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
  ] as Position[],
  /** Back row positions (y=1) */
  BACK_ROW: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
    { x: 5, y: 1 },
    { x: 6, y: 1 },
    { x: 7, y: 1 },
  ] as Position[],
} as const;

/**
 * Standard deployment positions for enemy team.
 */
export const ENEMY_POSITIONS = {
  /** Front row positions (y=9) */
  FRONT_ROW: [
    { x: 0, y: 9 },
    { x: 1, y: 9 },
    { x: 2, y: 9 },
    { x: 3, y: 9 },
    { x: 4, y: 9 },
    { x: 5, y: 9 },
    { x: 6, y: 9 },
    { x: 7, y: 9 },
  ] as Position[],
  /** Back row positions (y=8) */
  BACK_ROW: [
    { x: 0, y: 8 },
    { x: 1, y: 8 },
    { x: 2, y: 8 },
    { x: 3, y: 8 },
    { x: 4, y: 8 },
    { x: 5, y: 8 },
    { x: 6, y: 8 },
    { x: 7, y: 8 },
  ] as Position[],
} as const;


// ═══════════════════════════════════════════════════════════════
// PREDEFINED BATTLE SCENARIOS
// ═══════════════════════════════════════════════════════════════

/**
 * Predefined battle scenarios for common test cases.
 * Each scenario includes player team, enemy team, and expected characteristics.
 */
export const BATTLE_SCENARIOS = {
  /**
   * Basic 2v2 battle with mixed unit types.
   * Good for general integration testing.
   */
  BASIC_2V2: {
    name: 'Basic 2v2 Battle',
    playerTeam: createTeamSetup(
      ['knight', 'archer'],
      [{ x: 1, y: 0 }, { x: 2, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['rogue', 'mage'],
      [{ x: 1, y: 9 }, { x: 2, y: 8 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Tank + ranged vs melee DPS + mage',
  },

  /**
   * Mixed 3v3 battle with diverse roles.
   * Tests role interactions and targeting.
   */
  MIXED_3V3: {
    name: 'Mixed 3v3 Battle',
    playerTeam: createTeamSetup(
      ['knight', 'archer', 'mage'],
      [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['berserker', 'crossbowman', 'warlock'],
      [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 8 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Diverse team compositions',
  },

  /**
   * 1v1 duel between single units.
   * Good for testing individual unit mechanics.
   */
  DUEL_1V1: {
    name: '1v1 Duel',
    playerTeam: createTeamSetup(['guardian'], [{ x: 3, y: 0 }]),
    enemyTeam: createTeamSetup(['assassin'], [{ x: 3, y: 9 }]),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Tank vs assassin duel',
  },

  /**
   * Player victory scenario with strong player team.
   * Used for testing victory conditions.
   */
  PLAYER_VICTORY: {
    name: 'Player Victory Scenario',
    playerTeam: createTeamSetup(
      ['berserker', 'elementalist'],
      [{ x: 2, y: 1 }, { x: 3, y: 1 }],
    ),
    enemyTeam: createCustomTeamSetup([
      { unitId: 'priest', position: { x: 2, y: 8 }, stats: { hp: 5 } },
      { unitId: 'bard', position: { x: 3, y: 8 }, stats: { hp: 5 } },
    ]),
    seed: TEST_SEEDS.PLAYER_FAVORABLE,
    description: 'Strong player team vs weak enemies',
  },

  /**
   * Bot victory scenario with weak player team.
   * Used for testing defeat conditions.
   */
  BOT_VICTORY: {
    name: 'Bot Victory Scenario',
    playerTeam: createCustomTeamSetup([
      { unitId: 'priest', position: { x: 4, y: 1 }, stats: { hp: 3 } },
    ]),
    enemyTeam: createTeamSetup(
      ['assassin', 'elementalist'],
      [{ x: 4, y: 8 }, { x: 5, y: 8 }],
    ),
    seed: TEST_SEEDS.BOT_FAVORABLE,
    description: 'Weak player vs strong enemies',
  },

  /**
   * Draw scenario with extremely tanky units.
   * Used for testing max rounds condition.
   */
  DRAW_MAX_ROUNDS: {
    name: 'Draw (Max Rounds)',
    playerTeam: createCustomTeamSetup([
      { unitId: 'guardian', position: { x: 0, y: 1 }, stats: { hp: 500, armor: 50 } },
    ]),
    enemyTeam: createCustomTeamSetup([
      { unitId: 'guardian', position: { x: 0, y: 8 }, stats: { hp: 500, armor: 50 } },
    ]),
    seed: TEST_SEEDS.EDGE_CASE,
    description: 'Two super tanks that cannot kill each other',
  },

  /**
   * All tanks battle.
   * Tests tank-specific mechanics and slow battles.
   */
  ALL_TANKS: {
    name: 'All Tanks Battle',
    playerTeam: createTeamSetup(
      ['knight', 'guardian', 'berserker'],
      [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    ),
    enemyTeam: createTeamSetup(
      ['knight', 'guardian', 'berserker'],
      [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Tank vs tank battle',
  },

  /**
   * All ranged battle.
   * Tests ranged combat and positioning.
   */
  ALL_RANGED: {
    name: 'All Ranged Battle',
    playerTeam: createTeamSetup(
      ['archer', 'crossbowman', 'hunter'],
      [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['archer', 'crossbowman', 'hunter'],
      [{ x: 1, y: 8 }, { x: 3, y: 8 }, { x: 5, y: 8 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Ranged vs ranged battle',
  },

  /**
   * All mages battle.
   * Tests magic damage and mage abilities.
   */
  ALL_MAGES: {
    name: 'All Mages Battle',
    playerTeam: createTeamSetup(
      ['mage', 'warlock', 'elementalist'],
      [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['mage', 'warlock', 'elementalist'],
      [{ x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Mage vs mage battle',
  },

  /**
   * Support-heavy battle.
   * Tests healing and buff mechanics.
   */
  SUPPORT_HEAVY: {
    name: 'Support Heavy Battle',
    playerTeam: createTeamSetup(
      ['knight', 'priest', 'bard'],
      [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['guardian', 'priest', 'bard'],
      [{ x: 2, y: 9 }, { x: 2, y: 8 }, { x: 3, y: 8 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Teams with multiple supports',
  },

  /**
   * High initiative battle.
   * Tests turn order with fast units.
   */
  HIGH_INITIATIVE: {
    name: 'High Initiative Battle',
    playerTeam: createTeamSetup(
      ['assassin', 'rogue', 'duelist'],
      [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    ),
    enemyTeam: createTeamSetup(
      ['assassin', 'rogue', 'duelist'],
      [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Fast melee DPS units',
  },

  /**
   * Long range battle.
   * Tests maximum range combat.
   */
  LONG_RANGE: {
    name: 'Long Range Battle',
    playerTeam: createTeamSetup(
      ['crossbowman', 'elementalist'],
      [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    ),
    enemyTeam: createTeamSetup(
      ['crossbowman', 'elementalist'],
      [{ x: 0, y: 9 }, { x: 7, y: 9 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'Units at maximum range',
  },

  /**
   * Melee rush battle.
   * Tests melee-only combat.
   */
  MELEE_RUSH: {
    name: 'Melee Rush Battle',
    playerTeam: createTeamSetup(
      ['knight', 'rogue', 'berserker', 'assassin'],
      [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
    ),
    enemyTeam: createTeamSetup(
      ['guardian', 'duelist', 'berserker', 'rogue'],
      [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }],
    ),
    seed: TEST_SEEDS.DEFAULT,
    description: 'All melee units',
  },
} as const;


// ═══════════════════════════════════════════════════════════════
// MECHANICS-SPECIFIC FIXTURES
// ═══════════════════════════════════════════════════════════════

/**
 * Fixtures specifically designed for testing individual mechanics.
 */
export const MECHANICS_FIXTURES = {
  /**
   * Fixture for testing facing mechanics.
   * Units positioned to test different attack angles.
   */
  FACING_TEST: {
    name: 'Facing Test',
    description: 'Units positioned for front/flank/rear attack testing',
    attacker: createTestUnit({
      id: 'attacker',
      position: { x: 3, y: 5 },
      team: 'player',
      stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    // Target facing North - attacker is behind (rear attack)
    targetFacingNorth: createTestUnit({
      id: 'target-north',
      position: { x: 3, y: 4 },
      team: 'bot',
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    // Target facing South - attacker is in front (front attack)
    targetFacingSouth: createTestUnit({
      id: 'target-south',
      position: { x: 3, y: 6 },
      team: 'bot',
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    // Target facing East - attacker is on flank
    targetFacingEast: createTestUnit({
      id: 'target-east',
      position: { x: 4, y: 5 },
      team: 'bot',
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing resolve/morale mechanics.
   * Units with different resolve states.
   */
  RESOLVE_TEST: {
    name: 'Resolve Test',
    description: 'Units for testing morale/resolve mechanics',
    fullResolve: createTestUnit({
      id: 'full-resolve',
      position: { x: 1, y: 1 },
      team: 'player',
      stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    lowResolve: createTestUnit({
      id: 'low-resolve',
      position: { x: 2, y: 1 },
      team: 'player',
      stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    zeroResolve: createTestUnit({
      id: 'zero-resolve',
      position: { x: 3, y: 1 },
      team: 'player',
      stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing engagement/ZoC mechanics.
   * Units positioned for zone of control testing.
   */
  ENGAGEMENT_TEST: {
    name: 'Engagement Test',
    description: 'Units for testing zone of control',
    melee: createTestUnit({
      id: 'melee-unit',
      position: { x: 3, y: 3 },
      team: 'player',
      range: 1,
      stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    adjacentEnemy: createTestUnit({
      id: 'adjacent-enemy',
      position: { x: 3, y: 4 },
      team: 'bot',
      range: 1,
      stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
    archer: createTestUnit({
      id: 'archer-unit',
      position: { x: 5, y: 3 },
      team: 'player',
      range: 4,
      role: 'ranged_dps',
      stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
    }),
  },

  /**
   * Fixture for testing riposte mechanics.
   * Units with different initiative values.
   */
  RIPOSTE_TEST: {
    name: 'Riposte Test',
    description: 'Units for testing counter-attack mechanics',
    highInitiative: createTestUnit({
      id: 'high-init',
      position: { x: 2, y: 2 },
      team: 'player',
      stats: { hp: 80, atk: 20, atkCount: 1, armor: 4, speed: 3, initiative: 10, dodge: 15 },
    }),
    lowInitiative: createTestUnit({
      id: 'low-init',
      position: { x: 2, y: 3 },
      team: 'bot',
      stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 2, initiative: 3, dodge: 0 },
    }),
    equalInitiative: createTestUnit({
      id: 'equal-init',
      position: { x: 3, y: 3 },
      team: 'bot',
      stats: { hp: 90, atk: 18, atkCount: 1, armor: 4, speed: 3, initiative: 10, dodge: 10 },
    }),
  },

  /**
   * Fixture for testing charge mechanics.
   * Units positioned for cavalry charge testing.
   */
  CHARGE_TEST: {
    name: 'Charge Test',
    description: 'Units for testing cavalry charge mechanics',
    cavalry: createTestUnit({
      id: 'cavalry',
      position: { x: 3, y: 0 },
      team: 'player',
      stats: { hp: 80, atk: 15, atkCount: 1, armor: 4, speed: 5, initiative: 7, dodge: 0 },
    }),
    targetFar: createTestUnit({
      id: 'target-far',
      position: { x: 3, y: 6 },
      team: 'bot',
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 4, dodge: 0 },
    }),
    targetNear: createTestUnit({
      id: 'target-near',
      position: { x: 3, y: 2 },
      team: 'bot',
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 4, dodge: 0 },
    }),
    spearman: createTestUnit({
      id: 'spearman',
      position: { x: 3, y: 5 },
      team: 'bot',
      stats: { hp: 90, atk: 12, atkCount: 1, armor: 6, speed: 2, initiative: 5, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing phalanx/formation mechanics.
   * Units in formation positions.
   */
  PHALANX_TEST: {
    name: 'Phalanx Test',
    description: 'Units for testing formation bonuses',
    centerUnit: createTestUnit({
      id: 'center',
      position: { x: 3, y: 3 },
      team: 'player',
      stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
    }),
    leftFlank: createTestUnit({
      id: 'left-flank',
      position: { x: 2, y: 3 },
      team: 'player',
      stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
    }),
    rightFlank: createTestUnit({
      id: 'right-flank',
      position: { x: 4, y: 3 },
      team: 'player',
      stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
    }),
    behindCenter: createTestUnit({
      id: 'behind-center',
      position: { x: 3, y: 2 },
      team: 'player',
      stats: { hp: 100, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 4, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing armor shred mechanics.
   * Units with different armor values.
   */
  ARMOR_SHRED_TEST: {
    name: 'Armor Shred Test',
    description: 'Units for testing armor reduction mechanics',
    highArmor: createTestUnit({
      id: 'high-armor',
      position: { x: 3, y: 5 },
      team: 'bot',
      stats: { hp: 150, atk: 8, atkCount: 1, armor: 20, speed: 1, initiative: 3, dodge: 0 },
    }),
    lowArmor: createTestUnit({
      id: 'low-armor',
      position: { x: 4, y: 5 },
      team: 'bot',
      stats: { hp: 80, atk: 15, atkCount: 1, armor: 3, speed: 3, initiative: 6, dodge: 10 },
    }),
    attacker: createTestUnit({
      id: 'shred-attacker',
      position: { x: 3, y: 3 },
      team: 'player',
      stats: { hp: 100, atk: 18, atkCount: 2, armor: 5, speed: 3, initiative: 5, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing contagion/effect spread mechanics.
   * Units in close formation for spread testing.
   */
  CONTAGION_TEST: {
    name: 'Contagion Test',
    description: 'Units for testing effect spread mechanics',
    infectedUnit: createTestUnit({
      id: 'infected',
      position: { x: 3, y: 3 },
      team: 'bot',
      stats: { hp: 80, atk: 10, atkCount: 1, armor: 3, speed: 2, initiative: 4, dodge: 0 },
    }),
    adjacentUnit1: createTestUnit({
      id: 'adjacent-1',
      position: { x: 2, y: 3 },
      team: 'bot',
      stats: { hp: 80, atk: 10, atkCount: 1, armor: 3, speed: 2, initiative: 4, dodge: 0 },
    }),
    adjacentUnit2: createTestUnit({
      id: 'adjacent-2',
      position: { x: 4, y: 3 },
      team: 'bot',
      stats: { hp: 80, atk: 10, atkCount: 1, armor: 3, speed: 2, initiative: 4, dodge: 0 },
    }),
    adjacentUnit3: createTestUnit({
      id: 'adjacent-3',
      position: { x: 3, y: 4 },
      team: 'bot',
      stats: { hp: 80, atk: 10, atkCount: 1, armor: 3, speed: 2, initiative: 4, dodge: 0 },
    }),
    distantUnit: createTestUnit({
      id: 'distant',
      position: { x: 6, y: 6 },
      team: 'bot',
      stats: { hp: 80, atk: 10, atkCount: 1, armor: 3, speed: 2, initiative: 4, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing line of sight mechanics.
   * Units positioned for LoS blocking tests.
   */
  LINE_OF_SIGHT_TEST: {
    name: 'Line of Sight Test',
    description: 'Units for testing LoS blocking',
    shooter: createTestUnit({
      id: 'shooter',
      position: { x: 2, y: 2 },
      team: 'player',
      range: 5,
      role: 'ranged_dps',
      stats: { hp: 60, atk: 20, atkCount: 1, armor: 2, speed: 3, initiative: 6, dodge: 5 },
    }),
    blocker: createTestUnit({
      id: 'blocker',
      position: { x: 2, y: 4 },
      team: 'bot',
      stats: { hp: 120, atk: 10, atkCount: 1, armor: 10, speed: 2, initiative: 3, dodge: 0 },
    }),
    targetBehindBlocker: createTestUnit({
      id: 'target-behind',
      position: { x: 2, y: 6 },
      team: 'bot',
      stats: { hp: 50, atk: 25, atkCount: 1, armor: 0, speed: 2, initiative: 6, dodge: 0 },
    }),
    targetClear: createTestUnit({
      id: 'target-clear',
      position: { x: 5, y: 5 },
      team: 'bot',
      stats: { hp: 50, atk: 25, atkCount: 1, armor: 0, speed: 2, initiative: 6, dodge: 0 },
    }),
  },

  /**
   * Fixture for testing ammunition mechanics.
   * Ranged units with limited ammo.
   */
  AMMUNITION_TEST: {
    name: 'Ammunition Test',
    description: 'Units for testing ammo/cooldown mechanics',
    archerWithAmmo: createTestUnit({
      id: 'archer-ammo',
      position: { x: 3, y: 1 },
      team: 'player',
      range: 4,
      role: 'ranged_dps',
      stats: { hp: 60, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
    }),
    mageWithCooldown: createTestUnit({
      id: 'mage-cooldown',
      position: { x: 5, y: 1 },
      team: 'player',
      range: 3,
      role: 'mage',
      stats: { hp: 50, atk: 25, atkCount: 1, armor: 0, speed: 2, initiative: 6, dodge: 0 },
    }),
    target: createTestUnit({
      id: 'ammo-target',
      position: { x: 4, y: 7 },
      team: 'bot',
      stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 2, initiative: 4, dodge: 0 },
    }),
  },
} as const;


// ═══════════════════════════════════════════════════════════════
// EDGE CASE FIXTURES
// ═══════════════════════════════════════════════════════════════

/**
 * Edge case scenarios for boundary testing.
 */
export const EDGE_CASE_FIXTURES = {
  /**
   * Empty teams (should be handled gracefully).
   */
  EMPTY_TEAMS: {
    name: 'Empty Teams',
    description: 'Both teams have no units',
    playerTeam: { units: [], positions: [] } as TeamSetup,
    enemyTeam: { units: [], positions: [] } as TeamSetup,
  },

  /**
   * Single unit vs empty team.
   */
  SINGLE_VS_EMPTY: {
    name: 'Single vs Empty',
    description: 'One unit vs no enemies',
    playerTeam: createTeamSetup(['knight'], [{ x: 3, y: 0 }]),
    enemyTeam: { units: [], positions: [] } as TeamSetup,
  },

  /**
   * Maximum team size (8 units each).
   */
  MAX_TEAM_SIZE: {
    name: 'Maximum Team Size',
    description: '8v8 battle',
    playerTeam: createTeamSetup(
      ['knight', 'guardian', 'berserker', 'rogue', 'archer', 'mage', 'priest', 'bard'],
      [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
        { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
      ],
    ),
    enemyTeam: createTeamSetup(
      ['knight', 'guardian', 'berserker', 'rogue', 'archer', 'mage', 'priest', 'bard'],
      [
        { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 },
        { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 },
      ],
    ),
  },

  /**
   * Units at grid corners.
   */
  CORNER_POSITIONS: {
    name: 'Corner Positions',
    description: 'Units at grid corners',
    playerTeam: createTeamSetup(
      ['knight', 'archer'],
      [{ x: 0, y: 0 }, { x: 7, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['rogue', 'mage'],
      [{ x: 0, y: 9 }, { x: 7, y: 8 }],
    ),
  },

  /**
   * Units with 1 HP (near death).
   */
  ONE_HP_UNITS: {
    name: 'One HP Units',
    description: 'All units at 1 HP',
    playerTeam: createCustomTeamSetup([
      { unitId: 'knight', position: { x: 2, y: 0 }, stats: { hp: 1 } },
      { unitId: 'archer', position: { x: 3, y: 1 }, stats: { hp: 1 } },
    ]),
    enemyTeam: createCustomTeamSetup([
      { unitId: 'rogue', position: { x: 2, y: 9 }, stats: { hp: 1 } },
      { unitId: 'mage', position: { x: 3, y: 8 }, stats: { hp: 1 } },
    ]),
  },

  /**
   * Units with maximum stats.
   */
  MAX_STATS: {
    name: 'Maximum Stats',
    description: 'Units with extremely high stats',
    playerTeam: createCustomTeamSetup([
      {
        unitId: 'knight',
        position: { x: 3, y: 0 },
        stats: { hp: 9999, atk: 999, atkCount: 10, armor: 999, speed: 10, initiative: 99, dodge: 50 },
      },
    ]),
    enemyTeam: createCustomTeamSetup([
      {
        unitId: 'guardian',
        position: { x: 3, y: 9 },
        stats: { hp: 9999, atk: 999, atkCount: 10, armor: 999, speed: 10, initiative: 99, dodge: 50 },
      },
    ]),
  },

  /**
   * Units with zero attack.
   */
  ZERO_ATTACK: {
    name: 'Zero Attack',
    description: 'Units that cannot deal damage',
    playerTeam: createCustomTeamSetup([
      { unitId: 'priest', position: { x: 3, y: 1 }, stats: { atk: 0 } },
    ]),
    enemyTeam: createCustomTeamSetup([
      { unitId: 'bard', position: { x: 3, y: 8 }, stats: { atk: 0 } },
    ]),
  },

  /**
   * Units with maximum dodge.
   */
  MAX_DODGE: {
    name: 'Maximum Dodge',
    description: 'Units with 50% dodge (max)',
    playerTeam: createCustomTeamSetup([
      { unitId: 'rogue', position: { x: 2, y: 0 }, stats: { dodge: 50 } },
      { unitId: 'assassin', position: { x: 3, y: 0 }, stats: { dodge: 50 } },
    ]),
    enemyTeam: createCustomTeamSetup([
      { unitId: 'duelist', position: { x: 2, y: 9 }, stats: { dodge: 50 } },
      { unitId: 'hunter', position: { x: 3, y: 9 }, stats: { dodge: 50 } },
    ]),
  },

  /**
   * Same unit type on both teams.
   */
  MIRROR_MATCH: {
    name: 'Mirror Match',
    description: 'Identical teams',
    playerTeam: createTeamSetup(
      ['knight', 'archer', 'mage'],
      [{ x: 2, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 1 }],
    ),
    enemyTeam: createTeamSetup(
      ['knight', 'archer', 'mage'],
      [{ x: 2, y: 9 }, { x: 3, y: 8 }, { x: 4, y: 8 }],
    ),
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

/**
 * Gets all available battle scenarios as an array.
 * Useful for parameterized testing.
 *
 * @returns Array of scenario objects with name and data
 *
 * @example
 * const scenarios = getAllBattleScenarios();
 * scenarios.forEach(scenario => {
 *   test(scenario.name, () => { ... });
 * });
 */
export function getAllBattleScenarios(): Array<{
  name: string;
  playerTeam: TeamSetup;
  enemyTeam: TeamSetup;
  seed: number;
  description: string;
}> {
  return Object.values(BATTLE_SCENARIOS);
}

/**
 * Gets all edge case fixtures as an array.
 * Useful for parameterized testing.
 *
 * @returns Array of edge case objects
 */
export function getAllEdgeCaseFixtures(): Array<{
  name: string;
  description: string;
  playerTeam: TeamSetup;
  enemyTeam: TeamSetup;
}> {
  return Object.values(EDGE_CASE_FIXTURES);
}

/**
 * Creates a battle state from a scenario.
 *
 * @param scenario - Battle scenario to convert
 * @returns BattleState with units from both teams
 */
export function createBattleStateFromScenario(
  scenario: { playerTeam: TeamSetup; enemyTeam: TeamSetup },
): BattleState {
  const playerUnits = scenario.playerTeam.units.map((template, index) => {
    const position = scenario.playerTeam.positions[index];
    if (!position) {
      throw new Error(`Missing position for player unit ${index}`);
    }
    return createUnitFromTemplate(template.id as UnitId, 'player', position, index);
  });

  const enemyUnits = scenario.enemyTeam.units.map((template, index) => {
    const position = scenario.enemyTeam.positions[index];
    if (!position) {
      throw new Error(`Missing position for enemy unit ${index}`);
    }
    return createUnitFromTemplate(template.id as UnitId, 'bot', position, index);
  });

  return createTestBattleState([...playerUnits, ...enemyUnits], 1);
}

/**
 * Generates random positions within valid deployment zones.
 *
 * @param count - Number of positions to generate
 * @param team - Team type for zone selection
 * @returns Array of unique positions
 */
export function generateRandomPositions(
  count: number,
  team: TeamType,
): Position[] {
  const positions: Position[] = [];
  const usedPositions = new Set<string>();

  const rows = team === 'player' ? [0, 1] : [8, 9];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];

  while (positions.length < count && positions.length < rows.length * cols.length) {
    const row = rows[Math.floor(Math.random() * rows.length)];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const key = `${col},${row}`;

    if (row !== undefined && col !== undefined && !usedPositions.has(key)) {
      usedPositions.add(key);
      positions.push({ x: col, y: row });
    }
  }

  return positions;
}

/**
 * Creates a random team setup for fuzz testing.
 *
 * @param minUnits - Minimum number of units
 * @param maxUnits - Maximum number of units
 * @param team - Team type
 * @returns Random TeamSetup
 */
export function createRandomTeamSetup(
  minUnits: number = 1,
  maxUnits: number = 4,
  team: TeamType = 'player',
): TeamSetup {
  const allUnitIds = Object.keys(UNIT_TEMPLATES) as UnitId[];
  const unitCount = Math.floor(Math.random() * (maxUnits - minUnits + 1)) + minUnits;

  const unitIds: UnitId[] = [];
  for (let i = 0; i < unitCount; i++) {
    const randomIndex = Math.floor(Math.random() * allUnitIds.length);
    const unitId = allUnitIds[randomIndex];
    if (unitId) {
      unitIds.push(unitId);
    }
  }

  const positions = generateRandomPositions(unitIds.length, team);

  return createTeamSetup(unitIds, positions);
}
