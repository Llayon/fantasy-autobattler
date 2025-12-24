/**
 * Bot team generator for Fantasy Autobattler.
 * Creates intelligent bot teams with different difficulty strategies.
 * 
 * @fileoverview Advanced bot team generation with role-based strategies,
 * smart positioning, and deterministic seeded randomness.
 */

import { UnitTemplate, UnitRole, Position } from '../../types/game.types';
import { TeamSetup } from '../../battle/battle.simulator';
import { 
  UnitId, 
  getUnitTemplate, 
  getUnitsByRole, 
  getAllUnitIds
} from '../units/unit.data';
import { UNIT_ROLES, DEPLOYMENT_ZONES, GRID_DIMENSIONS } from '../../config/game.constants';
import { SeededRandom } from '../../core/utils/random';

/**
 * Bot difficulty levels with different team generation strategies.
 */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Budget allocation for different difficulty levels.
 */
const DIFFICULTY_BUDGETS: Record<BotDifficulty, number> = {
  easy: 20,
  medium: 25,
  hard: 30,
};

/**
 * Generate bot team based on difficulty level and budget.
 * Uses different strategies for each difficulty to create varied gameplay.
 * 
 * @param difficulty - Bot difficulty level affecting strategy and budget
 * @param budget - Optional custom budget (uses difficulty default if not provided)
 * @param seed - Optional seed for deterministic generation
 * @returns TeamSetup with bot units and strategic positions
 * @example
 * const easyBot = generateBotTeam('easy', 20, 12345);
 * const hardBot = generateBotTeam('hard');
 */
export function generateBotTeam(
  difficulty: BotDifficulty, 
  budget?: number, 
  seed?: number
): TeamSetup {
  const finalBudget = budget ?? DIFFICULTY_BUDGETS[difficulty];
  const rng = new SeededRandom(seed ?? Date.now());

  let units: UnitTemplate[];

  switch (difficulty) {
    case 'easy':
      units = generateEasyTeam(finalBudget, rng);
      break;
    case 'medium':
      units = generateMediumTeam(finalBudget, rng);
      break;
    case 'hard':
      units = generateHardTeam(finalBudget, rng);
      break;
    default:
      throw new Error(`Unknown difficulty: ${difficulty}`);
  }

  const positions = generateBotPositions(units);

  return { units, positions };
}

/**
 * Generate easy difficulty bot team.
 * Strategy: Random unit selection with no role balancing.
 */
function generateEasyTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const allUnits = getAllUnitIds();
  const shuffledUnits = rng.shuffle(allUnits);
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  for (const unitId of shuffledUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget) {
      team.push(template);
      remainingBudget -= template.cost;
    }

    if (team.length >= 6) break;
  }

  return team;
}

/**
 * Generate medium difficulty bot team.
 * Strategy: Balanced composition with at least one unit from each major role.
 */
function generateMediumTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  const requiredRoles: UnitRole[] = [
    UNIT_ROLES.TANK as UnitRole,
    UNIT_ROLES.MELEE_DPS as UnitRole,
    UNIT_ROLES.RANGED_DPS as UnitRole,
  ];

  for (const role of requiredRoles) {
    const roleUnits = getUnitsByRole(role);
    const affordableUnits = roleUnits.filter(unit => unit.cost <= remainingBudget);
    
    if (affordableUnits.length > 0) {
      const shuffled = rng.shuffle(affordableUnits);
      const selectedUnit = shuffled[0];
      if (selectedUnit) {
        team.push(selectedUnit);
        remainingBudget -= selectedUnit.cost;
      }
    }
  }

  const allUnits = getAllUnitIds();
  const shuffledUnits = rng.shuffle(allUnits);
  
  for (const unitId of shuffledUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget && team.length < 6) {
      team.push(template);
      remainingBudget -= template.cost;
    }
  }

  return team;
}

/**
 * Generate hard difficulty bot team.
 * Strategy: Optimal unit combinations and synergies.
 */
function generateHardTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const strategies = [
    () => buildTankDpsTeam(budget, rng),
    () => buildRangedControlTeam(budget, rng),
    () => buildBalancedTeam(budget, rng),
  ];

  const selectedStrategy = strategies[rng.nextInt(0, strategies.length - 1)];
  if (selectedStrategy) {
    return selectedStrategy();
  }

  return buildBalancedTeam(budget, rng);
}

/**
 * Build tank + high DPS focused team.
 */
function buildTankDpsTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  const preferredUnits: UnitId[] = ['guardian', 'assassin', 'berserker', 'elementalist'];
  
  for (const unitId of preferredUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget) {
      team.push(template);
      remainingBudget -= template.cost;
    }
  }

  return fillTeamWithBudget(team, remainingBudget, rng);
}

/**
 * Build ranged + control focused team.
 */
function buildRangedControlTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  const preferredUnits: UnitId[] = ['crossbowman', 'enchanter', 'mage', 'priest'];
  
  for (const unitId of preferredUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget) {
      team.push(template);
      remainingBudget -= template.cost;
    }
  }

  return fillTeamWithBudget(team, remainingBudget, rng);
}

/**
 * Build balanced team with all roles represented.
 */
function buildBalancedTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  let remainingBudget = budget;

  const roleSelections = {
    tank: ['knight', 'guardian'] as UnitId[],
    melee_dps: ['rogue', 'duelist'] as UnitId[],
    ranged_dps: ['archer', 'hunter'] as UnitId[],
    mage: ['mage', 'warlock'] as UnitId[],
    support: ['priest', 'bard'] as UnitId[],
    control: ['enchanter'] as UnitId[],
  };

  const selectedUnits: UnitTemplate[] = [];

  for (const unitIds of Object.values(roleSelections)) {
    const shuffledIds = rng.shuffle(unitIds);
    for (const unitId of shuffledIds) {
      const template = getUnitTemplate(unitId);
      if (template && template.cost <= remainingBudget) {
        selectedUnits.push(template);
        remainingBudget -= template.cost;
        break;
      }
    }
  }

  return fillTeamWithBudget(selectedUnits, remainingBudget, rng);
}

/**
 * Fill remaining team slots with available budget.
 */
function fillTeamWithBudget(
  team: UnitTemplate[], 
  budget: number, 
  rng: SeededRandom
): UnitTemplate[] {
  const allUnits = getAllUnitIds();
  const shuffledUnits = rng.shuffle(allUnits);
  let remainingBudget = budget;

  for (const unitId of shuffledUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget && team.length < 8) {
      team.push(template);
      remainingBudget -= template.cost;
    }
  }

  return team;
}

/**
 * Generate strategic positions for bot units.
 * Places tanks in front, ranged units in back, with optimal spacing.
 * 
 * @param units - Array of unit templates to position
 * @returns Array of positions corresponding to units
 * @example
 * const positions = generateBotPositions([knight, archer, mage]);
 */
export function generateBotPositions(units: UnitTemplate[]): Position[] {
  const positions: Position[] = [];
  const deploymentRows = DEPLOYMENT_ZONES.ENEMY_ROWS;
  
  const frontLine: UnitTemplate[] = [];
  const backLine: UnitTemplate[] = [];

  for (const unit of units) {
    if (unit.role === UNIT_ROLES.TANK || unit.role === UNIT_ROLES.MELEE_DPS) {
      frontLine.push(unit);
    } else {
      backLine.push(unit);
    }
  }

  let currentCol = 0;

  for (let i = 0; i < frontLine.length && currentCol < GRID_DIMENSIONS.WIDTH; i++) {
    positions.push({
      x: currentCol,
      y: deploymentRows[1] as number,
    });
    currentCol++;
  }

  currentCol = 0;

  for (let i = 0; i < backLine.length && currentCol < GRID_DIMENSIONS.WIDTH; i++) {
    positions.push({
      x: currentCol,
      y: deploymentRows[0] as number,
    });
    currentCol++;
  }

  while (positions.length < units.length && positions.length < GRID_DIMENSIONS.WIDTH * 2) {
    const row = positions.length < GRID_DIMENSIONS.WIDTH ? 
      deploymentRows[1] as number : deploymentRows[0] as number;
    const col = positions.length % GRID_DIMENSIONS.WIDTH;
    
    positions.push({ x: col, y: row });
  }

  return positions;
}

/**
 * Validate that a bot team meets budget and composition requirements.
 * 
 * @param units - Array of unit templates
 * @param maxBudget - Maximum allowed budget
 * @returns True if team is valid
 * @example
 * const isValid = validateBotTeam([knight, mage], 30);
 */
export function validateBotTeam(units: UnitTemplate[], maxBudget: number): boolean {
  if (units.length === 0) return false;
  if (units.length > 8) return false;
  
  const totalCost = units.reduce((sum, unit) => sum + unit.cost, 0);
  return totalCost <= maxBudget;
}
