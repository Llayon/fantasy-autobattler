/**
 * Re-export unit data from game module for backward compatibility.
 * @fileoverview All unit data has been moved to game/units/unit.data.ts
 */

export {
  UnitId,
  UnitType,
  UnitStats,
  UNIT_TEMPLATES,
  LEGACY_UNIT_TEMPLATES,
  getUnitTemplate,
  getUnitsByRole,
  getAllUnitIds,
  calculateTeamCost,
  generateRandomTeam,
  createUnit,
  getRandomTeam,
} from '../game/units/unit.data';
