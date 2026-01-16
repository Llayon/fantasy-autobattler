/**
 * Tier 1: Core Combat Mechanics
 *
 * Tier 1 mechanics build on Tier 0 (facing) and provide core combat features:
 * - Resolve: Morale system with routing/crumbling
 * - Engagement: Zone of Control and Attack of Opportunity
 * - Flanking: Damage bonuses based on attack angle
 *
 * Dependencies:
 * - Flanking requires Facing (Tier 0)
 * - Resolve and Engagement are independent
 *
 * @module core/mechanics/tier1
 */

export * from './resolve';
export * from './engagement';
export * from './flanking';
