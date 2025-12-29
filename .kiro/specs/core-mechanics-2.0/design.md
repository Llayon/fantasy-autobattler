# Design: Core Mechanics 2.0

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE 2.0 ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    CORE 1.0 (unchanged)                  │    │
│  │  grid/ │ battle/ │ utils/ │ events/ │ types/            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MECHANICS LAYER                       │    │
│  │                                                          │    │
│  │  config/          │ processor.ts                         │    │
│  │  ├── types.ts     │ ├── createMechanicsProcessor()      │    │
│  │  ├── deps.ts      │ ├── resolveDependencies()           │    │
│  │  └── presets/     │ └── applyMechanics()                │    │
│  │                                                          │    │
│  │  tier0/  │ tier1/  │ tier2/  │ tier3/  │ tier4/         │    │
│  │  facing  │ resolve │ riposte │ charge  │ contagion      │    │
│  │          │ engage  │ inter.  │ overw.  │ shred          │    │
│  │          │ flank   │ aura    │ phalanx │                │    │
│  │          │         │         │ los     │                │    │
│  │          │         │         │ ammo    │                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dependency Graph Visualization

```
                    DEPENDENCY GRAPH
                    
Tier 4:  ┌──────────┐
         │contagion │ (counters phalanx)
         └──────────┘
              
Tier 3:  ┌─────────┐  ┌─────────┐  ┌─────┐  ┌──────────┐
         │ phalanx │  │ charge  │  │ los │  │ overwatch│
         └────┬────┘  └────┬────┘  └──┬──┘  └────┬─────┘
              │            │          │          │
              │       ┌────▼────┐     │     ┌────▼─────┐
              │       │intercept│     │     │ammunition│
              │       └────┬────┘     │     └──────────┘
              │            │          │
Tier 2:  ┌────┴─────┐     │          │     ┌─────────┐
         │ riposte  │     │          │     │  aura   │
         └────┬─────┘     │          │     └─────────┘
              │           │          │
Tier 1:  ┌────▼─────┐  ┌──▼───────┐  │     ┌───────────┐
         │ flanking │  │engagement│  │     │  resolve  │
         └────┬─────┘  └──────────┘  │     └───────────┘
              │                      │
Tier 0:  ┌────▼──────────────────────▼──┐  ┌────────────┐
         │           facing             │  │ armorShred │
         └──────────────────────────────┘  └────────────┘
                                            (independent)
```

---

## Configuration Types

### MechanicsConfig (Full Interface)

```typescript
/**
 * Complete mechanics configuration.
 * Each mechanic can be:
 * - false: disabled
 * - true: enabled with defaults
 * - object: enabled with custom config
 */
interface MechanicsConfig {
  // Tier 0: Base
  facing: boolean;
  
  // Tier 1: Core Combat
  resolve: ResolveConfig | false;
  engagement: EngagementConfig | false;
  flanking: boolean;
  
  // Tier 2: Advanced
  riposte: RiposteConfig | false;
  intercept: InterceptConfig | false;
  aura: boolean;
  
  // Tier 3: Specialized
  charge: ChargeConfig | false;
  overwatch: boolean;
  phalanx: PhalanxConfig | false;
  lineOfSight: LoSConfig | false;
  ammunition: AmmoConfig | false;
  
  // Tier 4: Counter-mechanics
  contagion: ContagionConfig | false;
  armorShred: ShredConfig | false;
}
```


### Sub-Configuration Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════
// TIER 0: FACING
// ═══════════════════════════════════════════════════════════════

/**
 * Facing is boolean-only (no config needed).
 * When enabled, units have a direction (N/S/E/W).
 */
type FacingDirection = 'N' | 'S' | 'E' | 'W';

interface UnitWithFacing {
  facing: FacingDirection;
}

// ═══════════════════════════════════════════════════════════════
// TIER 1: RESOLVE, ENGAGEMENT, FLANKING
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve (Morale) system configuration.
 */
interface ResolveConfig {
  /** Maximum resolve value. Default: 100 */
  maxResolve: number;
  
  /** Resolve regeneration per turn. Default: 5 */
  baseRegeneration: number;
  
  /** Human units retreat when resolve = 0. Default: true */
  humanRetreat: boolean;
  
  /** Undead units crumble when resolve = 0. Default: true */
  undeadCrumble: boolean;
  
  /** Resolve damage multiplier from attacker's ATK. Default: 0.25 (25%) */
  resolveDamageMultiplier: number;
  
  /** Resolve damage bonus for flanking attacks. Default: 0 (no bonus, uses multiplier) */
  flankingResolveDamageBonus: number;
  
  /** Resolve damage bonus for rear attacks. Default: 0 (no bonus, uses multiplier) */
  rearResolveDamageBonus: number;
}

const DEFAULT_RESOLVE_CONFIG: ResolveConfig = {
  maxResolve: 100,
  baseRegeneration: 5,
  humanRetreat: true,
  undeadCrumble: true,
  resolveDamageMultiplier: 0.25,  // 25% от ATK атакующего
  flankingResolveDamageBonus: 0,  // Без дополнительного бонуса
  rearResolveDamageBonus: 0,      // Без дополнительного бонуса
};

/**
 * Engagement (Zone of Control) configuration.
 */
interface EngagementConfig {
  /** Enable Attack of Opportunity. Default: true */
  attackOfOpportunity: boolean;
  
  /** Archers suffer penalty when engaged. Default: true */
  archerPenalty: boolean;
  
  /** Penalty percentage for engaged archers. Default: 0.5 (50%) */
  archerPenaltyPercent: number;
}

const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  attackOfOpportunity: true,
  archerPenalty: true,
  archerPenaltyPercent: 0.5,
};

/**
 * Flanking is boolean-only.
 * Requires: facing
 * Enables: front/flank/rear attack arcs
 */

// ═══════════════════════════════════════════════════════════════
// TIER 2: RIPOSTE, INTERCEPT, AURA
// ═══════════════════════════════════════════════════════════════

/**
 * Riposte (Counter-attack) configuration.
 * Requires: flanking
 */
interface RiposteConfig {
  /** Use Initiative comparison for riposte chance. Default: true */
  initiativeBased: boolean;
  
  /** Riposte charges per round. 'attackCount' uses unit's attack count. */
  chargesPerRound: number | 'attackCount';
  
  /** Base riposte chance when Initiative equal. Default: 0.5 (50%) */
  baseChance: number;
  
  /** Initiative difference for guaranteed riposte. Default: 10 */
  guaranteedThreshold: number;
}

const DEFAULT_RIPOSTE_CONFIG: RiposteConfig = {
  initiativeBased: true,
  chargesPerRound: 'attackCount',
  baseChance: 0.5,
  guaranteedThreshold: 10,
};

/**
 * Intercept configuration.
 * Requires: engagement
 */
interface InterceptConfig {
  /** Hard Intercept: Spearmen stop cavalry. Default: true */
  hardIntercept: boolean;
  
  /** Soft Intercept: Infantry engages passing units. Default: true */
  softIntercept: boolean;
  
  /** Movement cost to disengage. Default: 2 cells */
  disengageCost: number;
}

const DEFAULT_INTERCEPT_CONFIG: InterceptConfig = {
  hardIntercept: true,
  softIntercept: true,
  disengageCost: 2,
};

/**
 * Aura is boolean-only.
 * Types: Static (always on), Pulse (per turn), Relic (item-based)
 */

// ═══════════════════════════════════════════════════════════════
// TIER 3: CHARGE, OVERWATCH, PHALANX, LOS, AMMUNITION
// ═══════════════════════════════════════════════════════════════

/**
 * Charge (Cavalry momentum) configuration.
 * Requires: intercept
 */
interface ChargeConfig {
  /** Damage bonus per cell moved. Default: 0.2 (20%) */
  momentumPerCell: number;
  
  /** Maximum momentum bonus. Default: 1.0 (100%) */
  maxMomentum: number;
  
  /** Resolve damage on charge impact. Default: 10 */
  shockResolveDamage: number;
  
  /** Minimum cells for charge bonus. Default: 3 */
  minChargeDistance: number;
}

const DEFAULT_CHARGE_CONFIG: ChargeConfig = {
  momentumPerCell: 0.2,
  maxMomentum: 1.0,
  shockResolveDamage: 10,
  minChargeDistance: 3,
};

/**
 * Overwatch is boolean-only.
 * Requires: intercept, ammunition
 * Ranged units can enter Vigilance state.
 */

/**
 * Phalanx (Formation) configuration.
 * Requires: facing
 */
interface PhalanxConfig {
  /** Maximum armor bonus from formation depth. Default: 5 */
  maxArmorBonus: number;
  
  /** Maximum resolve bonus from formation. Default: 25 */
  maxResolveBonus: number;
  
  /** Armor bonus per adjacent ally. Default: 1 */
  armorPerAlly: number;
  
  /** Resolve bonus per adjacent ally. Default: 5 */
  resolvePerAlly: number;
}

const DEFAULT_PHALANX_CONFIG: PhalanxConfig = {
  maxArmorBonus: 5,
  maxResolveBonus: 25,
  armorPerAlly: 1,
  resolvePerAlly: 5,
};

/**
 * Line of Sight configuration.
 * Requires: facing
 */
interface LoSConfig {
  /** Enable direct fire (blocked by units). Default: true */
  directFire: boolean;
  
  /** Enable arc fire (ignores obstacles). Default: true */
  arcFire: boolean;
  
  /** Arc fire accuracy penalty. Default: 0.2 (20%) */
  arcFirePenalty: number;
}

const DEFAULT_LOS_CONFIG: LoSConfig = {
  directFire: true,
  arcFire: true,
  arcFirePenalty: 0.2,
};

/**
 * Ammunition & Cooldown configuration.
 */
interface AmmoConfig {
  /** Enable ammunition for ranged units. Default: true */
  enabled: boolean;
  
  /** Use cooldowns for mages instead of ammo. Default: true */
  mageCooldowns: boolean;
  
  /** Default ammo count for ranged. Default: 6 */
  defaultAmmo: number;
  
  /** Default cooldown for mage abilities. Default: 3 */
  defaultCooldown: number;
}

const DEFAULT_AMMO_CONFIG: AmmoConfig = {
  enabled: true,
  mageCooldowns: true,
  defaultAmmo: 6,
  defaultCooldown: 3,
};

// ═══════════════════════════════════════════════════════════════
// TIER 4: CONTAGION, ARMOR SHRED
// ═══════════════════════════════════════════════════════════════

/**
 * Contagion (Effect spreading) configuration.
 * Counters: phalanx (dense formations = high spread risk)
 */
interface ContagionConfig {
  /** Fire spread chance to adjacent units. Default: 0.5 (50%) */
  fireSpread: number;
  
  /** Poison spread chance. Default: 0.3 (30%) */
  poisonSpread: number;
  
  /** Curse spread chance. Default: 0.25 (25%) */
  curseSpread: number;
  
  /** Frost spread chance. Default: 0.2 (20%) */
  frostSpread: number;
  
  /** Plague spread chance. Default: 0.6 (60%) */
  plagueSpread: number;
  
  /** Phalanx spread bonus. Default: 0.15 (+15%) */
  phalanxSpreadBonus: number;
}

const DEFAULT_CONTAGION_CONFIG: ContagionConfig = {
  fireSpread: 0.5,
  poisonSpread: 0.3,
  curseSpread: 0.25,
  frostSpread: 0.2,
  plagueSpread: 0.6,
  phalanxSpreadBonus: 0.15,
};

/**
 * Armor Shred configuration.
 */
interface ShredConfig {
  /** Armor shred per physical attack. Default: 1 */
  shredPerAttack: number;
  
  /** Maximum armor reduction percentage. Default: 0.4 (40%) */
  maxShredPercent: number;
  
  /** Shred decay per turn. Default: 0 (no decay) */
  decayPerTurn: number;
}

const DEFAULT_SHRED_CONFIG: ShredConfig = {
  shredPerAttack: 1,
  maxShredPercent: 0.4,
  decayPerTurn: 0,
};
```

---

## Dependency Resolution

```typescript
/**
 * Dependency graph for mechanics.
 * Key: mechanic name
 * Value: array of required mechanics
 */
const MECHANIC_DEPENDENCIES: Record<keyof MechanicsConfig, (keyof MechanicsConfig)[]> = {
  // Tier 0 (independent)
  facing: [],
  armorShred: [],  // Fully independent!
  
  // Tier 1
  resolve: [],
  engagement: [],
  flanking: ['facing'],
  ammunition: [],
  
  // Tier 2
  riposte: ['flanking'],  // flanking → facing
  intercept: ['engagement'],
  aura: [],
  
  // Tier 3
  charge: ['intercept'],  // intercept → engagement
  overwatch: ['intercept', 'ammunition'],
  phalanx: ['facing'],
  lineOfSight: ['facing'],
  
  // Tier 4
  contagion: [],  // Independent, but designed to counter phalanx
};

/**
 * Resolves mechanic dependencies recursively.
 * Enabling a mechanic auto-enables all its dependencies.
 * 
 * @param config - User-provided mechanics configuration
 * @returns Resolved configuration with all dependencies enabled
 * @example
 * // User enables riposte only
 * const input = { riposte: true, ...allOthersFalse };
 * const resolved = resolveDependencies(input);
 * // resolved.flanking = true (dependency)
 * // resolved.facing = true (transitive dependency)
 */
function resolveDependencies(config: Partial<MechanicsConfig>): MechanicsConfig {
  const resolved = { ...MVP_PRESET, ...config };
  
  // Iterate until no changes (handles transitive deps)
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const [mechanic, deps] of Object.entries(MECHANIC_DEPENDENCIES)) {
      const key = mechanic as keyof MechanicsConfig;
      
      // If mechanic is enabled, enable all its dependencies
      if (resolved[key]) {
        for (const dep of deps) {
          if (!resolved[dep]) {
            resolved[dep] = getDefaultConfig(dep);
            changed = true;
          }
        }
      }
    }
  }
  
  return resolved;
}

/**
 * Returns default configuration for a mechanic.
 * 
 * @param mechanic - Mechanic name
 * @returns Default config (true for boolean, object for configurable)
 */
function getDefaultConfig(mechanic: keyof MechanicsConfig): boolean | object {
  const defaults: Record<string, boolean | object> = {
    facing: true,
    resolve: DEFAULT_RESOLVE_CONFIG,
    engagement: DEFAULT_ENGAGEMENT_CONFIG,
    flanking: true,
    riposte: DEFAULT_RIPOSTE_CONFIG,
    intercept: DEFAULT_INTERCEPT_CONFIG,
    aura: true,
    charge: DEFAULT_CHARGE_CONFIG,
    overwatch: true,
    phalanx: DEFAULT_PHALANX_CONFIG,
    lineOfSight: DEFAULT_LOS_CONFIG,
    ammunition: DEFAULT_AMMO_CONFIG,
    contagion: DEFAULT_CONTAGION_CONFIG,
    armorShred: DEFAULT_SHRED_CONFIG,
  };
  
  return defaults[mechanic] ?? true;
}
```

---

## Mechanics Processor

```typescript
/**
 * Processor that applies enabled mechanics to battle state.
 */
interface MechanicsProcessor {
  /** Resolved configuration */
  readonly config: MechanicsConfig;
  
  /** Individual mechanic processors */
  readonly processors: MechanicProcessorMap;
  
  /** Apply all enabled mechanics to battle state */
  process(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

type BattlePhase = 
  | 'turn_start'
  | 'movement'
  | 'pre_attack'
  | 'attack'
  | 'post_attack'
  | 'turn_end';

interface PhaseContext {
  activeUnit: BattleUnit;
  target?: BattleUnit;
  action?: BattleAction;
  seed: number;
}

/**
 * Creates a mechanics processor from configuration.
 * 
 * @param config - Mechanics configuration (partial, dependencies auto-resolved)
 * @returns Configured mechanics processor
 * @example
 * // Create processor with roguelike preset
 * const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
 * 
 * // Create processor with custom config
 * const processor = createMechanicsProcessor({
 *   facing: true,
 *   flanking: true,
 *   riposte: { initiativeBased: true },
 * });
 */
function createMechanicsProcessor(config: Partial<MechanicsConfig>): MechanicsProcessor {
  // 1. Resolve dependencies
  const resolved = resolveDependencies(config);
  
  // 2. Build individual processors for enabled mechanics
  const processors = buildProcessors(resolved);
  
  // 3. Return processor interface
  return {
    config: resolved,
    processors,
    process: (phase, state, context) => applyMechanics(phase, state, context, resolved, processors),
  };
}

/**
 * Builds processor map for enabled mechanics.
 */
function buildProcessors(config: MechanicsConfig): MechanicProcessorMap {
  const processors: MechanicProcessorMap = {};
  
  if (config.facing) {
    processors.facing = createFacingProcessor();
  }
  if (config.resolve) {
    processors.resolve = createResolveProcessor(config.resolve);
  }
  if (config.engagement) {
    processors.engagement = createEngagementProcessor(config.engagement);
  }
  if (config.flanking) {
    processors.flanking = createFlankingProcessor();
  }
  if (config.riposte) {
    processors.riposte = createRiposteProcessor(config.riposte);
  }
  if (config.intercept) {
    processors.intercept = createInterceptProcessor(config.intercept);
  }
  if (config.aura) {
    processors.aura = createAuraProcessor();
  }
  if (config.charge) {
    processors.charge = createChargeProcessor(config.charge);
  }
  if (config.overwatch) {
    processors.overwatch = createOverwatchProcessor();
  }
  if (config.phalanx) {
    processors.phalanx = createPhalanxProcessor(config.phalanx);
  }
  if (config.lineOfSight) {
    processors.lineOfSight = createLoSProcessor(config.lineOfSight);
  }
  if (config.ammunition) {
    processors.ammunition = createAmmoProcessor(config.ammunition);
  }
  if (config.contagion) {
    processors.contagion = createContagionProcessor(config.contagion);
  }
  if (config.armorShred) {
    processors.armorShred = createShredProcessor(config.armorShred);
  }
  
  return processors;
}
```

---

## Phase Integration

### Phase-to-Mechanic Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    BATTLE PHASE FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TURN_START                                                      │
│  ├── resolve.recovery()      → Regenerate resolve               │
│  ├── ammunition.reload()     → Reload ranged ammo               │
│  ├── aura.pulse()            → Apply pulse aura effects         │
│  └── phalanx.recalculate()   → Update formation bonuses         │
│                                                                  │
│  MOVEMENT                                                        │
│  ├── engagement.check()      → Check ZoC entry/exit             │
│  ├── intercept.trigger()     → Hard/Soft intercept              │
│  ├── overwatch.trigger()     → Ranged overwatch fire            │
│  └── charge.accumulate()     → Build momentum                   │
│                                                                  │
│  PRE_ATTACK                                                      │
│  ├── facing.validate()       → Check attack arc                 │
│  ├── flanking.check()        → Determine attack angle           │
│  ├── charge.validate()       → Apply charge bonus               │
│  ├── lineOfSight.check()     → Validate LoS for ranged          │
│  └── ammunition.consume()    → Spend ammo/cooldown              │
│                                                                  │
│  ATTACK                                                          │
│  ├── armorShred.apply()      → Reduce target armor              │
│  ├── riposte.trigger()       → Counter-attack check             │
│  └── contagion.apply()       → Apply spreading effects          │
│                                                                  │
│  POST_ATTACK                                                     │
│  ├── resolve.damage()        → Apply resolve damage             │
│  ├── phalanx.recalculate()   → Update after casualties          │
│  └── resolve.stateCheck()    → Check rout/crumble               │
│                                                                  │
│  TURN_END                                                        │
│  ├── contagion.spread()      → Spread effects to adjacent       │
│  ├── aura.decay()            → Reduce temporary auras           │
│  └── overwatch.reset()       → Clear vigilance state            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### applyMechanics Implementation

```typescript
/**
 * Applies all enabled mechanics for a given phase.
 * Mechanics are applied in dependency order (Tier 0 → Tier 4).
 * 
 * @param phase - Current battle phase
 * @param state - Current battle state
 * @param context - Phase context (active unit, target, etc.)
 * @param config - Resolved mechanics config
 * @param processors - Built mechanic processors
 * @returns Updated battle state
 */
function applyMechanics(
  phase: BattlePhase,
  state: BattleState,
  context: PhaseContext,
  config: MechanicsConfig,
  processors: MechanicProcessorMap
): BattleState {
  let result = state;
  
  // Get mechanics to apply for this phase (in tier order)
  const mechanicsForPhase = PHASE_MECHANICS[phase];
  
  for (const mechanic of mechanicsForPhase) {
    const processor = processors[mechanic];
    if (processor) {
      result = processor.apply(phase, result, context);
    }
  }
  
  return result;
}

/**
 * Mapping of phases to mechanics (in execution order).
 */
const PHASE_MECHANICS: Record<BattlePhase, (keyof MechanicsConfig)[]> = {
  turn_start: ['resolve', 'ammunition', 'aura', 'phalanx'],
  movement: ['engagement', 'intercept', 'overwatch', 'charge'],
  pre_attack: ['facing', 'flanking', 'charge', 'lineOfSight', 'ammunition'],
  attack: ['armorShred', 'riposte', 'contagion'],
  post_attack: ['resolve', 'phalanx'],
  turn_end: ['contagion', 'aura', 'overwatch'],
};
```

---

## Individual Mechanic Processors

### Tier 0: Facing Processor

```typescript
interface FacingProcessor {
  /**
   * Gets unit's current facing direction.
   */
  getFacing(unit: BattleUnit): FacingDirection;
  
  /**
   * Rotates unit to face target.
   */
  faceTarget(unit: BattleUnit, target: Position): BattleUnit;
  
  /**
   * Determines attack arc (front/flank/rear).
   */
  getAttackArc(attacker: BattleUnit, target: BattleUnit): AttackArc;
  
  /**
   * Apply facing logic for phase.
   */
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

type AttackArc = 'front' | 'flank' | 'rear';

function createFacingProcessor(): FacingProcessor {
  return {
    getFacing: (unit) => unit.facing ?? 'S',
    
    faceTarget: (unit, target) => {
      const dx = target.x - unit.position.x;
      const dy = target.y - unit.position.y;
      
      // Determine primary direction
      let facing: FacingDirection;
      if (Math.abs(dx) > Math.abs(dy)) {
        facing = dx > 0 ? 'E' : 'W';
      } else {
        facing = dy > 0 ? 'S' : 'N';
      }
      
      return { ...unit, facing };
    },
    
    getAttackArc: (attacker, target) => {
      const facing = target.facing ?? 'S';
      const dx = attacker.position.x - target.position.x;
      const dy = attacker.position.y - target.position.y;
      
      // Calculate angle relative to facing
      const facingAngles: Record<FacingDirection, number> = {
        N: 0, E: 90, S: 180, W: 270,
      };
      const attackAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
      const relativeAngle = Math.abs(attackAngle - facingAngles[facing]);
      const normalized = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
      
      if (normalized <= 45) return 'front';
      if (normalized <= 135) return 'flank';
      return 'rear';
    },
    
    apply: (phase, state, context) => {
      if (phase === 'pre_attack' && context.target) {
        // Auto-face target before attack
        const updatedUnit = createFacingProcessor().faceTarget(
          context.activeUnit,
          context.target.position
        );
        return updateUnit(state, updatedUnit);
      }
      return state;
    },
  };
}
```

### Tier 1: Resolve Processor

```typescript
interface ResolveProcessor {
  /**
   * Regenerates resolve at turn start.
   */
  regenerate(unit: BattleUnit, config: ResolveConfig): BattleUnit;
  
  /**
   * Applies resolve damage from combat.
   */
  applyDamage(unit: BattleUnit, damage: number): BattleUnit;
  
  /**
   * Checks if unit should rout/crumble.
   */
  checkState(unit: BattleUnit, config: ResolveConfig): 'active' | 'routing' | 'crumbled';
  
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

function createResolveProcessor(config: ResolveConfig): ResolveProcessor {
  return {
    regenerate: (unit) => ({
      ...unit,
      resolve: Math.min(config.maxResolve, (unit.resolve ?? config.maxResolve) + config.baseRegeneration),
    }),
    
    applyDamage: (unit, damage) => ({
      ...unit,
      resolve: Math.max(0, (unit.resolve ?? config.maxResolve) - damage),
    }),
    
    checkState: (unit) => {
      const resolve = unit.resolve ?? config.maxResolve;
      if (resolve > 0) return 'active';
      
      // Faction-specific behavior
      if (unit.faction === 'undead' && config.undeadCrumble) return 'crumbled';
      if (unit.faction !== 'undead' && config.humanRetreat) return 'routing';
      
      return 'active';
    },
    
    apply: (phase, state, context) => {
      if (phase === 'turn_start') {
        // Regenerate resolve for active unit
        const updated = createResolveProcessor(config).regenerate(context.activeUnit);
        return updateUnit(state, updated);
      }
      
      if (phase === 'post_attack' && context.target) {
        // Check for rout/crumble after damage
        const targetState = createResolveProcessor(config).checkState(context.target);
        if (targetState !== 'active') {
          return handleResolveBreak(state, context.target, targetState);
        }
      }
      
      return state;
    },
  };
}
```

### Tier 1: Flanking Processor

```typescript
interface FlankingProcessor {
  /**
   * Calculates damage modifier based on attack arc.
   */
  getDamageModifier(arc: AttackArc): number;
  
  /**
   * Calculates resolve damage based on attack arc.
   */
  getResolveDamage(arc: AttackArc, config: ResolveConfig): number;
  
  /**
   * Checks if flanking disables riposte.
   */
  disablesRiposte(arc: AttackArc): boolean;
  
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

function createFlankingProcessor(): FlankingProcessor {
  return {
    getDamageModifier: (arc) => {
      switch (arc) {
        case 'front': return 1.0;
        case 'flank': return 1.15;  // +15% damage
        case 'rear': return 1.30;   // +30% damage
      }
    },
    
    getResolveDamage: (arc, config) => {
      switch (arc) {
        case 'front': return 0;
        case 'flank': return config.flankingResolveDamage;
        case 'rear': return config.rearResolveDamage;
      }
    },
    
    disablesRiposte: (arc) => arc !== 'front',
    
    apply: (phase, state, context) => {
      // Flanking modifiers applied during damage calculation
      return state;
    },
  };
}
```

### Tier 2: Riposte Processor

```typescript
interface RiposteProcessor {
  /**
   * Checks if defender can riposte.
   */
  canRiposte(defender: BattleUnit, attacker: BattleUnit, arc: AttackArc): boolean;
  
  /**
   * Calculates riposte chance based on Initiative.
   */
  getRiposteChance(defender: BattleUnit, attacker: BattleUnit, config: RiposteConfig): number;
  
  /**
   * Executes riposte counter-attack.
   */
  executeRiposte(defender: BattleUnit, attacker: BattleUnit, state: BattleState): BattleState;
  
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

function createRiposteProcessor(config: RiposteConfig): RiposteProcessor {
  return {
    canRiposte: (defender, attacker, arc) => {
      // Cannot riposte if flanked/rear attacked
      if (arc !== 'front') return false;
      
      // Check remaining charges
      const charges = config.chargesPerRound === 'attackCount' 
        ? defender.attackCount 
        : config.chargesPerRound;
      
      return (defender.riposteCharges ?? charges) > 0;
    },
    
    getRiposteChance: (defender, attacker) => {
      if (!config.initiativeBased) return config.baseChance;
      
      const initDiff = defender.initiative - attacker.initiative;
      
      // Guaranteed riposte if defender much faster
      if (initDiff >= config.guaranteedThreshold) return 1.0;
      // No riposte if attacker much faster
      if (initDiff <= -config.guaranteedThreshold) return 0.0;
      
      // Linear interpolation
      return config.baseChance + (initDiff / config.guaranteedThreshold) * 0.5;
    },
    
    executeRiposte: (defender, attacker, state) => {
      // Riposte deals 50% of normal damage
      const damage = Math.floor(defender.atk * 0.5);
      const updatedAttacker = {
        ...attacker,
        currentHp: Math.max(0, attacker.currentHp - damage),
      };
      
      // Consume riposte charge
      const updatedDefender = {
        ...defender,
        riposteCharges: (defender.riposteCharges ?? defender.attackCount) - 1,
      };
      
      return updateUnits(state, [updatedAttacker, updatedDefender]);
    },
    
    apply: (phase, state, context) => {
      if (phase === 'attack' && context.target) {
        const processor = createRiposteProcessor(config);
        const facingProcessor = createFacingProcessor();
        const arc = facingProcessor.getAttackArc(context.activeUnit, context.target);
        
        if (processor.canRiposte(context.target, context.activeUnit, arc)) {
          const chance = processor.getRiposteChance(context.target, context.activeUnit);
          const roll = seededRandom(context.seed);
          
          if (roll < chance) {
            return processor.executeRiposte(context.target, context.activeUnit, state);
          }
        }
      }
      
      return state;
    },
  };
}
```

### Tier 3: Charge Processor

```typescript
interface ChargeProcessor {
  /**
   * Calculates momentum based on distance moved.
   */
  calculateMomentum(distance: number, config: ChargeConfig): number;
  
  /**
   * Applies charge damage bonus.
   */
  applyChargeBonus(baseDamage: number, momentum: number): number;
  
  /**
   * Checks if charge is countered by Spear Wall.
   */
  isCounteredBySpearWall(target: BattleUnit): boolean;
  
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

function createChargeProcessor(config: ChargeConfig): ChargeProcessor {
  return {
    calculateMomentum: (distance) => {
      if (distance < config.minChargeDistance) return 0;
      return Math.min(config.maxMomentum, distance * config.momentumPerCell);
    },
    
    applyChargeBonus: (baseDamage, momentum) => {
      return Math.floor(baseDamage * (1 + momentum));
    },
    
    isCounteredBySpearWall: (target) => {
      return target.tags?.includes('spear_wall') ?? false;
    },
    
    apply: (phase, state, context) => {
      if (phase === 'movement') {
        // Track distance moved for momentum
        const distance = context.action?.path?.length ?? 0;
        const momentum = createChargeProcessor(config).calculateMomentum(distance);
        
        if (momentum > 0) {
          const updated = { ...context.activeUnit, momentum };
          return updateUnit(state, updated);
        }
      }
      
      if (phase === 'pre_attack' && context.target) {
        const processor = createChargeProcessor(config);
        const momentum = context.activeUnit.momentum ?? 0;
        
        // Check for Spear Wall counter
        if (momentum > 0 && processor.isCounteredBySpearWall(context.target)) {
          // Charge is stopped, attacker takes damage
          const counterDamage = Math.floor(context.target.atk * 1.5);
          const updated = {
            ...context.activeUnit,
            currentHp: Math.max(0, context.activeUnit.currentHp - counterDamage),
            momentum: 0,
          };
          return updateUnit(state, updated);
        }
      }
      
      return state;
    },
  };
}
```

### Tier 4: Contagion Processor

```typescript
interface ContagionProcessor {
  /**
   * Gets spread chance for effect type.
   */
  getSpreadChance(effectType: ContagionType, config: ContagionConfig): number;
  
  /**
   * Finds adjacent units that can be infected.
   */
  findSpreadTargets(source: BattleUnit, units: BattleUnit[]): BattleUnit[];
  
  /**
   * Applies contagion spread at turn end.
   */
  spreadEffects(state: BattleState, seed: number): BattleState;
  
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

type ContagionType = 'fire' | 'poison' | 'curse' | 'frost' | 'plague';

function createContagionProcessor(config: ContagionConfig): ContagionProcessor {
  return {
    getSpreadChance: (effectType) => {
      const chances: Record<ContagionType, number> = {
        fire: config.fireSpread,
        poison: config.poisonSpread,
        curse: config.curseSpread,
        frost: config.frostSpread,
        plague: config.plagueSpread,
      };
      return chances[effectType];
    },
    
    findSpreadTargets: (source, units) => {
      return units.filter(u => 
        u.id !== source.id &&
        u.currentHp > 0 &&
        manhattanDistance(source.position, u.position) === 1
      );
    },
    
    spreadEffects: (state, seed) => {
      let result = state;
      let seedOffset = 0;
      
      for (const unit of state.units) {
        const contagiousEffects = unit.statusEffects?.filter(e => 
          ['fire', 'poison', 'curse', 'frost', 'plague'].includes(e.type)
        ) ?? [];
        
        for (const effect of contagiousEffects) {
          const targets = createContagionProcessor(config).findSpreadTargets(unit, state.units);
          let spreadChance = createContagionProcessor(config).getSpreadChance(effect.type as ContagionType);
          
          // Phalanx bonus: dense formations spread faster
          if (unit.inPhalanx) {
            spreadChance += config.phalanxSpreadBonus;
          }
          
          for (const target of targets) {
            const roll = seededRandom(seed + seedOffset++);
            if (roll < spreadChance && !target.statusEffects?.some(e => e.type === effect.type)) {
              result = applyStatusEffect(result, target.id, { ...effect, duration: effect.duration });
            }
          }
        }
      }
      
      return result;
    },
    
    apply: (phase, state, context) => {
      if (phase === 'turn_end') {
        return createContagionProcessor(config).spreadEffects(state, context.seed);
      }
      return state;
    },
  };
}
```

### Tier 4: Armor Shred Processor

```typescript
interface ArmorShredProcessor {
  /**
   * Applies armor shred on physical attack.
   */
  applyShred(target: BattleUnit, config: ShredConfig): BattleUnit;
  
  /**
   * Gets effective armor after shred.
   */
  getEffectiveArmor(unit: BattleUnit): number;
  
  /**
   * Decays shred at turn end (if configured).
   */
  decayShred(unit: BattleUnit, config: ShredConfig): BattleUnit;
  
  apply(phase: BattlePhase, state: BattleState, context: PhaseContext): BattleState;
}

function createShredProcessor(config: ShredConfig): ArmorShredProcessor {
  return {
    applyShred: (target) => {
      const currentShred = target.armorShred ?? 0;
      const maxShred = Math.floor(target.armor * config.maxShredPercent);
      const newShred = Math.min(maxShred, currentShred + config.shredPerAttack);
      
      return { ...target, armorShred: newShred };
    },
    
    getEffectiveArmor: (unit) => {
      return Math.max(0, unit.armor - (unit.armorShred ?? 0));
    },
    
    decayShred: (unit) => {
      if (config.decayPerTurn === 0) return unit;
      
      const currentShred = unit.armorShred ?? 0;
      const newShred = Math.max(0, currentShred - config.decayPerTurn);
      
      return { ...unit, armorShred: newShred };
    },
    
    apply: (phase, state, context) => {
      if (phase === 'attack' && context.target && context.action?.type === 'physical') {
        const updated = createShredProcessor(config).applyShred(context.target);
        return updateUnit(state, updated);
      }
      
      if (phase === 'turn_end' && config.decayPerTurn > 0) {
        const updatedUnits = state.units.map(u => 
          createShredProcessor(config).decayShred(u)
        );
        return { ...state, units: updatedUnits };
      }
      
      return state;
    },
  };
}
```

---

## Battle Simulator Integration

```typescript
/**
 * Enhanced battle simulator with mechanics support.
 * Backward compatible: works without processor (MVP mode).
 * 
 * @param state - Initial battle state
 * @param seed - Random seed for determinism
 * @param processor - Optional mechanics processor
 * @returns Battle result with events
 */
function simulateBattle(
  state: BattleState,
  seed: number,
  processor?: MechanicsProcessor
): BattleResult {
  let currentState = state;
  let currentSeed = seed;
  const events: BattleEvent[] = [];
  
  for (let round = 1; round <= config.maxRounds; round++) {
    const turnQueue = buildTurnQueue(currentState.units);
    
    for (const unit of turnQueue) {
      if (unit.currentHp <= 0) continue;
      
      // TURN_START phase
      if (processor) {
        currentState = processor.process('turn_start', currentState, {
          activeUnit: unit,
          seed: currentSeed++,
        });
      }
      
      // Decide action (AI or player input)
      const action = decideAction(unit, currentState);
      
      // MOVEMENT phase
      if (action.type === 'move') {
        if (processor) {
          currentState = processor.process('movement', currentState, {
            activeUnit: unit,
            action,
            seed: currentSeed++,
          });
        }
        currentState = executeMove(currentState, unit, action);
      }
      
      // PRE_ATTACK phase
      if (action.type === 'attack') {
        const target = findUnit(currentState, action.targetId);
        
        if (processor) {
          currentState = processor.process('pre_attack', currentState, {
            activeUnit: unit,
            target,
            action,
            seed: currentSeed++,
          });
        }
        
        // ATTACK phase
        currentState = executeAttack(currentState, unit, target, processor);
        
        if (processor) {
          currentState = processor.process('attack', currentState, {
            activeUnit: unit,
            target,
            action,
            seed: currentSeed++,
          });
        }
        
        // POST_ATTACK phase
        if (processor) {
          currentState = processor.process('post_attack', currentState, {
            activeUnit: unit,
            target,
            seed: currentSeed++,
          });
        }
      }
      
      // TURN_END phase
      if (processor) {
        currentState = processor.process('turn_end', currentState, {
          activeUnit: unit,
          seed: currentSeed++,
        });
      }
      
      // Check battle end
      if (isBattleOver(currentState)) {
        return buildResult(currentState, events, round);
      }
    }
  }
  
  return buildResult(currentState, events, config.maxRounds);
}
```

---

## Presets Implementation

```typescript
// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

/**
 * MVP Preset: All mechanics disabled.
 * Produces identical results to core 1.0.
 */
export const MVP_PRESET: MechanicsConfig = {
  facing: false,
  resolve: false,
  engagement: false,
  flanking: false,
  riposte: false,
  intercept: false,
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};

/**
 * Roguelike Preset: All mechanics enabled with balanced defaults.
 * Used for roguelike-run mode.
 */
export const ROGUELIKE_PRESET: MechanicsConfig = {
  facing: true,
  resolve: {
    maxResolve: 100,
    baseRegeneration: 5,
    humanRetreat: true,
    undeadCrumble: true,
    resolveDamageMultiplier: 0.25,  // 25% от ATK атакующего
    flankingResolveDamageBonus: 0,
    rearResolveDamageBonus: 0,
  },
  engagement: {
    attackOfOpportunity: true,
    archerPenalty: true,
    archerPenaltyPercent: 0.5,
  },
  flanking: true,
  riposte: {
    initiativeBased: true,
    chargesPerRound: 'attackCount',
    baseChance: 0.5,
    guaranteedThreshold: 10,
  },
  intercept: {
    hardIntercept: true,
    softIntercept: true,
    disengageCost: 2,
  },
  aura: true,
  charge: {
    momentumPerCell: 0.2,
    maxMomentum: 1.0,
    shockResolveDamage: 10,
    minChargeDistance: 3,
  },
  overwatch: true,
  phalanx: {
    maxArmorBonus: 5,
    maxResolveBonus: 25,
    armorPerAlly: 1,
    resolvePerAlly: 5,
  },
  lineOfSight: {
    directFire: true,
    arcFire: true,
    arcFirePenalty: 0.2,
  },
  ammunition: {
    enabled: true,
    mageCooldowns: true,
    defaultAmmo: 6,
    defaultCooldown: 3,
  },
  contagion: {
    fireSpread: 0.5,
    poisonSpread: 0.3,
    curseSpread: 0.25,
    frostSpread: 0.2,
    plagueSpread: 0.6,
    phalanxSpreadBonus: 0.15,
  },
  armorShred: {
    shredPerAttack: 1,
    maxShredPercent: 0.4,
    decayPerTurn: 0,
  },
};

/**
 * Tactical Preset: Tier 0-2 mechanics only.
 * Simpler combat without specialized mechanics.
 */
export const TACTICAL_PRESET: MechanicsConfig = {
  facing: true,
  resolve: {
    maxResolve: 100,
    baseRegeneration: 5,
    humanRetreat: true,
    undeadCrumble: false,
    flankingResolveDamage: 12,
    rearResolveDamage: 20,
  },
  engagement: {
    attackOfOpportunity: true,
    archerPenalty: false,
    archerPenaltyPercent: 0,
  },
  flanking: true,
  riposte: {
    initiativeBased: true,
    chargesPerRound: 1,
    baseChance: 0.5,
    guaranteedThreshold: 10,
  },
  intercept: {
    hardIntercept: false,
    softIntercept: true,
    disengageCost: 1,
  },
  aura: false,
  charge: false,
  overwatch: false,
  phalanx: false,
  lineOfSight: false,
  ammunition: false,
  contagion: false,
  armorShred: false,
};
```

---

## Migration Guide

### From Core 1.0 to Core 2.0

```typescript
// ═══════════════════════════════════════════════════════════════
// BEFORE (Core 1.0)
// ═══════════════════════════════════════════════════════════════

import { simulateBattle } from '@core/battle';

const result = simulateBattle(state, seed);

// ═══════════════════════════════════════════════════════════════
// AFTER (Core 2.0 - MVP mode, identical behavior)
// ═══════════════════════════════════════════════════════════════

import { simulateBattle } from '@core/battle';

// Option 1: No processor (backward compatible)
const result = simulateBattle(state, seed);

// Option 2: Explicit MVP preset
import { createMechanicsProcessor, MVP_PRESET } from '@core/mechanics';

const processor = createMechanicsProcessor(MVP_PRESET);
const result = simulateBattle(state, seed, processor);

// ═══════════════════════════════════════════════════════════════
// AFTER (Core 2.0 - Roguelike mode)
// ═══════════════════════════════════════════════════════════════

import { simulateBattle } from '@core/battle';
import { createMechanicsProcessor, ROGUELIKE_PRESET } from '@core/mechanics';

const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
const result = simulateBattle(state, seed, processor);

// ═══════════════════════════════════════════════════════════════
// AFTER (Core 2.0 - Custom config)
// ═══════════════════════════════════════════════════════════════

import { createMechanicsProcessor } from '@core/mechanics';

const processor = createMechanicsProcessor({
  facing: true,
  flanking: true,
  riposte: { initiativeBased: true, chargesPerRound: 2 },
  // Dependencies auto-resolved: facing enabled automatically
});

const result = simulateBattle(state, seed, processor);
```

---

## File Structure

```
backend/src/core/
├── grid/                         # ✅ Core 1.0 (unchanged)
├── battle/                       # ✅ Core 1.0 (unchanged)
├── utils/                        # ✅ Core 1.0 (unchanged)
├── events/                       # ✅ Core 1.0 (unchanged)
├── types/                        # ✅ Core 1.0 (unchanged)
│
├── mechanics/                    # 🆕 Core 2.0
│   ├── config/
│   │   ├── mechanics.types.ts    # MechanicsConfig, sub-configs
│   │   ├── dependencies.ts       # MECHANIC_DEPENDENCIES, resolveDependencies()
│   │   ├── defaults.ts           # DEFAULT_*_CONFIG constants
│   │   ├── validator.ts          # validateMechanicsConfig()
│   │   └── presets/
│   │       ├── index.ts          # Re-exports all presets
│   │       ├── mvp.ts            # MVP_PRESET
│   │       ├── roguelike.ts      # ROGUELIKE_PRESET
│   │       └── tactical.ts       # TACTICAL_PRESET
│   │
│   ├── tier0/
│   │   └── facing/
│   │       ├── facing.processor.ts
│   │       ├── facing.types.ts
│   │       └── facing.spec.ts
│   │
│   ├── tier1/
│   │   ├── resolve/
│   │   │   ├── resolve.processor.ts
│   │   │   ├── resolve.types.ts
│   │   │   └── resolve.spec.ts
│   │   ├── engagement/
│   │   │   ├── engagement.processor.ts
│   │   │   ├── engagement.types.ts
│   │   │   └── engagement.spec.ts
│   │   └── flanking/
│   │       ├── flanking.processor.ts
│   │       ├── flanking.types.ts
│   │       └── flanking.spec.ts
│   │
│   ├── tier2/
│   │   ├── riposte/
│   │   │   ├── riposte.processor.ts
│   │   │   ├── riposte.types.ts
│   │   │   └── riposte.spec.ts
│   │   ├── intercept/
│   │   │   ├── intercept.processor.ts
│   │   │   ├── intercept.types.ts
│   │   │   └── intercept.spec.ts
│   │   └── aura/
│   │       ├── aura.processor.ts
│   │       ├── aura.types.ts
│   │       └── aura.spec.ts
│   │
│   ├── tier3/
│   │   ├── charge/
│   │   │   ├── charge.processor.ts
│   │   │   ├── charge.types.ts
│   │   │   └── charge.spec.ts
│   │   ├── overwatch/
│   │   │   ├── overwatch.processor.ts
│   │   │   ├── overwatch.types.ts
│   │   │   └── overwatch.spec.ts
│   │   ├── phalanx/
│   │   │   ├── phalanx.processor.ts
│   │   │   ├── phalanx.types.ts
│   │   │   └── phalanx.spec.ts
│   │   ├── los/
│   │   │   ├── los.processor.ts
│   │   │   ├── los.types.ts
│   │   │   └── los.spec.ts
│   │   └── ammunition/
│   │       ├── ammunition.processor.ts
│   │       ├── ammunition.types.ts
│   │       └── ammunition.spec.ts
│   │
│   ├── tier4/
│   │   ├── contagion/
│   │   │   ├── contagion.processor.ts
│   │   │   ├── contagion.types.ts
│   │   │   └── contagion.spec.ts
│   │   └── armor-shred/
│   │       ├── armor-shred.processor.ts
│   │       ├── armor-shred.types.ts
│   │       └── armor-shred.spec.ts
│   │
│   ├── processor.ts              # createMechanicsProcessor(), applyMechanics()
│   ├── processor.spec.ts         # Integration tests
│   └── index.ts                  # Public API exports
│
└── index.ts                      # Re-exports core 1.0 + mechanics
```

---

## Testing Strategy

### Unit Tests (per mechanic)

```typescript
// Example: riposte.spec.ts
describe('RiposteProcessor', () => {
  const config: RiposteConfig = {
    initiativeBased: true,
    chargesPerRound: 'attackCount',
    baseChance: 0.5,
    guaranteedThreshold: 10,
  };
  
  describe('canRiposte', () => {
    it('should allow riposte from front arc', () => {
      const processor = createRiposteProcessor(config);
      const defender = createMockUnit({ riposteCharges: 1 });
      const attacker = createMockUnit();
      
      expect(processor.canRiposte(defender, attacker, 'front')).toBe(true);
    });
    
    it('should deny riposte from flank arc', () => {
      const processor = createRiposteProcessor(config);
      const defender = createMockUnit({ riposteCharges: 1 });
      const attacker = createMockUnit();
      
      expect(processor.canRiposte(defender, attacker, 'flank')).toBe(false);
    });
    
    it('should deny riposte when no charges', () => {
      const processor = createRiposteProcessor(config);
      const defender = createMockUnit({ riposteCharges: 0 });
      const attacker = createMockUnit();
      
      expect(processor.canRiposte(defender, attacker, 'front')).toBe(false);
    });
  });
  
  describe('getRiposteChance', () => {
    it('should return 100% when defender initiative much higher', () => {
      const processor = createRiposteProcessor(config);
      const defender = createMockUnit({ initiative: 20 });
      const attacker = createMockUnit({ initiative: 5 });
      
      expect(processor.getRiposteChance(defender, attacker)).toBe(1.0);
    });
    
    it('should return 0% when attacker initiative much higher', () => {
      const processor = createRiposteProcessor(config);
      const defender = createMockUnit({ initiative: 5 });
      const attacker = createMockUnit({ initiative: 20 });
      
      expect(processor.getRiposteChance(defender, attacker)).toBe(0.0);
    });
  });
});
```


### Integration Tests

```typescript
// processor.spec.ts
describe('MechanicsProcessor Integration', () => {
  describe('dependency resolution', () => {
    it('should auto-enable facing when flanking enabled', () => {
      const processor = createMechanicsProcessor({ flanking: true });
      
      expect(processor.config.facing).toBe(true);
      expect(processor.config.flanking).toBe(true);
    });
    
    it('should auto-enable full chain for riposte', () => {
      const processor = createMechanicsProcessor({ riposte: true });
      
      expect(processor.config.facing).toBe(true);    // Tier 0
      expect(processor.config.flanking).toBe(true);  // Tier 1
      expect(processor.config.riposte).toBeTruthy(); // Tier 2
    });
    
    it('should auto-enable intercept and ammunition for overwatch', () => {
      const processor = createMechanicsProcessor({ overwatch: true });
      
      expect(processor.config.engagement).toBeTruthy(); // For intercept
      expect(processor.config.intercept).toBeTruthy();  // Tier 2
      expect(processor.config.ammunition).toBeTruthy(); // Tier 3
      expect(processor.config.overwatch).toBe(true);    // Tier 3
    });
  });
  
  describe('MVP preset backward compatibility', () => {
    it('should produce identical results to core 1.0', () => {
      const state = createTestBattleState();
      const seed = 12345;
      
      // Core 1.0 behavior (no processor)
      const result1 = simulateBattle(state, seed);
      
      // Core 2.0 with MVP preset
      const processor = createMechanicsProcessor(MVP_PRESET);
      const result2 = simulateBattle(state, seed, processor);
      
      expect(result2.winner).toBe(result1.winner);
      expect(result2.rounds).toBe(result1.rounds);
      expect(result2.events).toEqual(result1.events);
    });
  });
  
  describe('preset validation', () => {
    it('should validate MVP preset has all mechanics disabled', () => {
      for (const [key, value] of Object.entries(MVP_PRESET)) {
        expect(value).toBe(false);
      }
    });
    
    it('should validate ROGUELIKE preset has all mechanics enabled', () => {
      for (const [key, value] of Object.entries(ROGUELIKE_PRESET)) {
        expect(value).not.toBe(false);
      }
    });
  });
});
```

### Regression Tests

```typescript
// regression.spec.ts
describe('Core 2.0 Regression Tests', () => {
  // Snapshot tests for deterministic battles
  const testCases = [
    { name: 'basic_melee_fight', seed: 1001 },
    { name: 'ranged_vs_melee', seed: 2002 },
    { name: 'mixed_team_battle', seed: 3003 },
  ];
  
  for (const { name, seed } of testCases) {
    it(`should match snapshot for ${name}`, () => {
      const state = loadTestState(name);
      const result = simulateBattle(state, seed);
      
      expect(result).toMatchSnapshot();
    });
    
    it(`should match snapshot for ${name} with MVP preset`, () => {
      const state = loadTestState(name);
      const processor = createMechanicsProcessor(MVP_PRESET);
      const result = simulateBattle(state, seed, processor);
      
      expect(result).toMatchSnapshot();
    });
  }
});
```

---

## Public API

```typescript
// core/mechanics/index.ts

// Configuration types
export type { MechanicsConfig } from './config/mechanics.types';
export type { 
  ResolveConfig,
  EngagementConfig,
  RiposteConfig,
  InterceptConfig,
  ChargeConfig,
  PhalanxConfig,
  LoSConfig,
  AmmoConfig,
  ContagionConfig,
  ShredConfig,
} from './config/mechanics.types';

// Presets
export { MVP_PRESET } from './config/presets/mvp';
export { ROGUELIKE_PRESET } from './config/presets/roguelike';
export { TACTICAL_PRESET } from './config/presets/tactical';

// Processor
export { createMechanicsProcessor } from './processor';
export type { MechanicsProcessor, BattlePhase, PhaseContext } from './processor';

// Dependency resolution
export { resolveDependencies, MECHANIC_DEPENDENCIES } from './config/dependencies';

// Individual processors (for advanced use)
export { createFacingProcessor } from './tier0/facing/facing.processor';
export { createResolveProcessor } from './tier1/resolve/resolve.processor';
export { createEngagementProcessor } from './tier1/engagement/engagement.processor';
export { createFlankingProcessor } from './tier1/flanking/flanking.processor';
export { createRiposteProcessor } from './tier2/riposte/riposte.processor';
export { createInterceptProcessor } from './tier2/intercept/intercept.processor';
export { createAuraProcessor } from './tier2/aura/aura.processor';
export { createChargeProcessor } from './tier3/charge/charge.processor';
export { createOverwatchProcessor } from './tier3/overwatch/overwatch.processor';
export { createPhalanxProcessor } from './tier3/phalanx/phalanx.processor';
export { createLoSProcessor } from './tier3/los/los.processor';
export { createAmmoProcessor } from './tier3/ammunition/ammunition.processor';
export { createContagionProcessor } from './tier4/contagion/contagion.processor';
export { createShredProcessor } from './tier4/armor-shred/armor-shred.processor';
```

---

## Summary

Core Mechanics 2.0 provides:

1. **Modular mechanics** — 14 mechanics organized in 5 tiers
2. **Feature flags** — Each mechanic can be enabled/disabled independently
3. **Auto-dependency resolution** — Enabling a mechanic enables its dependencies
4. **Presets** — MVP (off), Roguelike (all on), Tactical (Tier 0-2)
5. **Backward compatibility** — MVP preset produces identical results to Core 1.0
6. **Phase integration** — Mechanics hook into battle phases
7. **Configurable** — Each mechanic has customizable parameters
8. **Testable** — Isolated unit tests + integration tests
9. **Documented** — JSDoc for all public APIs
