/**
 * Bot team generator for Fantasy Autobattler.
 * Creates intelligent bot teams with different difficulty strategies.
 * 
 * @fileoverview Advanced bot team generation with role-based strategies,
 * smart positioning, and deterministic seeded randomness.
 */

import { UnitTemplate, UnitRole, Position } from '../types/game.types';
import { TeamSetup } from './battle.simulator';
import { 
  UnitId, 
  getUnitTemplate, 
  getUnitsByRole, 
  getAllUnitIds
} from '../unit/unit.data';
import { UNIT_ROLES, DEPLOYMENT_ZONES, GRID_DIMENSIONS } from '../config/game.constants';

/**
 * Bot difficulty levels with different team generation strategies.
 */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Budget allocation for different difficulty levels.
 */
const DIFFICULTY_BUDGETS: Record<BotDifficulty, number> = {
  easy: 20,   // Reduced budget for easier opponents
  medium: 25, // Balanced budget for fair challenge
  hard: 30,   // Full budget for maximum challenge
};

/**
 * Seeded random number generator for deterministic bot generation.
 * Uses Linear Congruential Generator (LCG) algorithm.
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1.
   * 
   * @returns Random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate random integer between min and max (inclusive).
   * 
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer in range
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm with seeded randomness.
   * 
   * @param array - Array to shuffle
   * @returns New shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = result[i];
      const swapItem = result[j];
      if (temp !== undefined && swapItem !== undefined) {
        result[i] = swapItem;
        result[j] = temp;
      }
    }
    return result;
  }
}

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
 * const hardBot = generateBotTeam('hard'); // Uses default budget and random seed
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
 * 
 * @param budget - Available budget for team
 * @param rng - Seeded random number generator
 * @returns Array of unit templates
 */
function generateEasyTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const allUnits = getAllUnitIds();
  const shuffledUnits = rng.shuffle(allUnits);
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  // Simple random selection until budget is exhausted
  for (const unitId of shuffledUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget) {
      team.push(template);
      remainingBudget -= template.cost;
    }

    // Limit team size to prevent too many weak units
    if (team.length >= 6) break;
  }

  return team;
}

/**
 * Generate medium difficulty bot team.
 * Strategy: Balanced composition with at least one unit from each major role.
 * 
 * @param budget - Available budget for team
 * @param rng - Seeded random number generator
 * @returns Array of unit templates
 */
function generateMediumTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  // Ensure balanced composition: Tank + DPS + Support/Mage
  const requiredRoles: UnitRole[] = [
    UNIT_ROLES.TANK as UnitRole,
    UNIT_ROLES.MELEE_DPS as UnitRole,
    UNIT_ROLES.RANGED_DPS as UnitRole,
  ];

  // Add one unit from each required role
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

  // Fill remaining budget with random units
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
 * 
 * @param budget - Available budget for team
 * @param rng - Seeded random number generator
 * @returns Array of unit templates
 */
function generateHardTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  // Optimal team compositions based on synergies
  const strategies = [
    // Tank + High DPS strategy
    () => buildTankDpsTeam(budget, rng),
    // Ranged + Control strategy  
    () => buildRangedControlTeam(budget, rng),
    // Balanced all-rounder strategy
    () => buildBalancedTeam(budget, rng),
  ];

  // Select random strategy
  const selectedStrategy = strategies[rng.nextInt(0, strategies.length - 1)];
  if (selectedStrategy) {
    return selectedStrategy();
  }

  // Fallback to balanced team
  return buildBalancedTeam(budget, rng);
}

/**
 * Build tank + high DPS focused team.
 * 
 * @param budget - Available budget
 * @param rng - Random number generator
 * @returns Array of unit templates
 */
function buildTankDpsTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  // Priority: Strong tank + assassin/berserker
  const preferredUnits: UnitId[] = ['guardian', 'assassin', 'berserker', 'elementalist'];
  
  for (const unitId of preferredUnits) {
    const template = getUnitTemplate(unitId);
    if (template && template.cost <= remainingBudget) {
      team.push(template);
      remainingBudget -= template.cost;
    }
  }

  // Fill with remaining units
  return fillTeamWithBudget(team, remainingBudget, rng);
}

/**
 * Build ranged + control focused team.
 * 
 * @param budget - Available budget
 * @param rng - Random number generator
 * @returns Array of unit templates
 */
function buildRangedControlTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  const team: UnitTemplate[] = [];
  let remainingBudget = budget;

  // Priority: Ranged DPS + control + support
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
 * 
 * @param budget - Available budget
 * @param rng - Random number generator
 * @returns Array of unit templates
 */
function buildBalancedTeam(budget: number, rng: SeededRandom): UnitTemplate[] {
  let remainingBudget = budget;

  // One unit from each role, prioritizing cost-effectiveness
  const roleSelections = {
    tank: ['knight', 'guardian'] as UnitId[],
    melee_dps: ['rogue', 'duelist'] as UnitId[],
    ranged_dps: ['archer', 'hunter'] as UnitId[],
    mage: ['mage', 'warlock'] as UnitId[],
    support: ['priest', 'bard'] as UnitId[],
    control: ['enchanter'] as UnitId[],
  };

  const selectedUnits: UnitTemplate[] = [];

  // Add one unit from each role if budget allows
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
 * 
 * @param team - Current team units
 * @param budget - Remaining budget
 * @param rng - Random number generator
 * @returns Complete team array
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
 * // Knight at front, archer and mage at back
 */
export function generateBotPositions(units: UnitTemplate[]): Position[] {
  const positions: Position[] = [];
  const deploymentRows = DEPLOYMENT_ZONES.ENEMY_ROWS; // [8, 9]
  
  // Separate units by positioning priority
  const frontLine: UnitTemplate[] = []; // Tanks and melee
  const backLine: UnitTemplate[] = [];  // Ranged, mages, support

  for (const unit of units) {
    if (unit.role === UNIT_ROLES.TANK || unit.role === UNIT_ROLES.MELEE_DPS) {
      frontLine.push(unit);
    } else {
      backLine.push(unit);
    }
  }

  let currentCol = 0;

  // Place front line units in row 9 (closer to enemy deployment zone)
  for (let i = 0; i < frontLine.length && currentCol < GRID_DIMENSIONS.WIDTH; i++) {
    positions.push({
      x: currentCol,
      y: deploymentRows[1] as number, // Row 9
    });
    currentCol++;
  }

  // Reset column for back line
  currentCol = 0;

  // Place back line units in row 8 (further from enemy)
  for (let i = 0; i < backLine.length && currentCol < GRID_DIMENSIONS.WIDTH; i++) {
    positions.push({
      x: currentCol,
      y: deploymentRows[0] as number, // Row 8
    });
    currentCol++;
  }

  // If we have more units than positions calculated, fill remaining spots
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
  if (units.length > 8) return false; // Reasonable team size limit
  
  const totalCost = units.reduce((sum, unit) => sum + unit.cost, 0);
  return totalCost <= maxBudget;
}