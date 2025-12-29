/**
 * Engagement mechanic types
 *
 * Defines types for the zone of control system.
 * Units in melee range create zones of control.
 * Moving through ZoC triggers attacks of opportunity.
 */

/**
 * Position on the grid
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Unit with engagement information
 */
export interface EngagementUnit {
  id: string;
  position: Position;
  engaged?: boolean;
  engagedWith?: string[];
  isRanged?: boolean;
}

/**
 * Result of engagement check
 */
export interface EngagementCheckResult {
  isEngaged: boolean;
  engagedWith: string[];
  canMoveFreely: boolean;
  attackOfOpportunityFrom: string[];
}

/**
 * Result of archer penalty calculation
 */
export interface ArcherPenaltyResult {
  isEngaged: boolean;
  penaltyMultiplier: number;
  effectiveDamage: number;
}

/**
 * Default engagement configuration values
 */
export const DEFAULT_ENGAGEMENT_VALUES = {
  zoneOfControlRange: 1,
  archerPenalty: 0.5,
};
