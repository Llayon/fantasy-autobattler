/**
 * Tier 3: Line of Sight (LoS) Module
 *
 * Exports all LoS-related types, processors, and utilities.
 *
 * @module core/mechanics/tier3/los
 */

// Types
export * from './los.types';

// Bresenham line algorithm utilities
export {
  bresenhamLine,
  getLineOfSight,
  isBlocked,
  findObstaclesAlongLine,
  hasDirectLoS,
  manhattanDistance,
  euclideanDistance,
  chebyshevDistance,
} from './bresenham';

// Processor
export { createLoSProcessor, default } from './los.processor';
