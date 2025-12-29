/**
 * Core Mechanics 2.0 - Modular battle mechanics system
 *
 * Provides 14 optional mechanics that extend Core 1.0 foundation:
 * - Tier 0: Facing, ArmorShred
 * - Tier 1: Resolve, Engagement, Flanking
 * - Tier 2: Riposte, Intercept, Aura
 * - Tier 3: Charge, Overwatch, Phalanx, LineOfSight, Ammunition
 * - Tier 4: Contagion
 *
 * All mechanics are optional and can be enabled/disabled via configuration.
 * Three presets provided: MVP (current), Roguelike (all), Tactical (partial).
 *
 * @example
 * // Use MVP preset (current behavior, no mechanics)
 * const processor = createMechanicsProcessor(MVP_PRESET);
 *
 * // Use Roguelike preset (all mechanics enabled)
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 *
 * // Use custom config
 * const processor = createMechanicsProcessor({
 *   facing: true,
 *   flanking: true,
 *   resolve: false,
 * });
 */

export * from './config';
export * from './tier0';
export * from './tier1';
export * from './tier2';
export * from './tier3';
export * from './tier4';
export * from './processor';
