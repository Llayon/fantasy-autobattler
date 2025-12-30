/**
 * Core Mechanics 2.0 - Modular battle mechanics system
 *
 * Provides 14 optional mechanics that extend Core 1.0 foundation:
 * - Tier 0: Facing
 * - Tier 1: Resolve, Engagement, Flanking
 * - Tier 2: Riposte, Intercept, Aura
 * - Tier 3: Charge, Overwatch, Phalanx, LineOfSight, Ammunition
 * - Tier 4: Contagion, ArmorShred
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

// Config exports
export * from './config';

// Processor exports
export * from './processor';

// Tier 0: Facing
export * as facing from './tier0/facing';

// Tier 1: Resolve, Engagement, Flanking
export * as resolve from './tier1/resolve';
export * as engagement from './tier1/engagement';
export * as flanking from './tier1/flanking';

// Tier 2: Riposte, Intercept, Aura
export * as riposte from './tier2/riposte';
export * as intercept from './tier2/intercept';
export * as aura from './tier2/aura';

// Tier 3: Charge, Phalanx, LoS, Ammunition, Overwatch
export * as charge from './tier3/charge';
export * as phalanx from './tier3/phalanx';
export * as los from './tier3/los';
export * as ammunition from './tier3/ammunition';
export * as overwatch from './tier3/overwatch';

// Tier 4: Contagion, ArmorShred
export * as contagion from './tier4/contagion';
export * as armorShred from './tier4/armor-shred';
