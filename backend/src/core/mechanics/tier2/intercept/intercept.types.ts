/**
 * Intercept mechanic types
 *
 * Defines types for the movement interception system.
 * - Hard Intercept: Spearmen stop cavalry charges
 * - Soft Intercept: Infantry engages passing units
 * - Disengage cost for leaving engagement
 */

import { Position } from '../../tier0/facing';

export { Position };

/**
 * Unit with intercept-relevant information
 */
export interface InterceptUnit {
  id: string;
  position: Position;
  tags?: string[];
  speed?: number;
  isCharging?: boolean;
}

/**
 * Intercept type
 */
export type InterceptType = 'hard' | 'soft' | 'none';

/**
 * Result of intercept check
 */
export interface InterceptCheckResult {
  intercepted: boolean;
  interceptType: InterceptType;
  interceptorId?: string;
  stopMovement: boolean;
  triggerEngagement: boolean;
}

/**
 * Result of disengage calculation
 */
export interface DisengageResult {
  canDisengage: boolean;
  movementCost: number;
  remainingMovement: number;
}

/**
 * Path segment for movement interception
 */
export interface PathSegment {
  from: Position;
  to: Position;
}

/**
 * Default intercept configuration values
 */
export const DEFAULT_INTERCEPT_VALUES = {
  hardInterceptTypes: ['spearman', 'pikeman', 'halberdier'],
  softInterceptTypes: ['infantry', 'swordsman', 'axeman'],
  cavalryTypes: ['cavalry', 'knight', 'lancer'],
  disengageCost: 2,
};
