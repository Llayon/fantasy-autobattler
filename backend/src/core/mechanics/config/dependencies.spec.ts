/**
 * Unit tests for dependency resolution
 *
 * Tests the MECHANIC_DEPENDENCIES constant and resolveDependencies() function.
 *
 * @module core/mechanics/config
 */

import {
  MECHANIC_DEPENDENCIES,
  getDefaultConfig,
  resolveDependencies,
} from './dependencies';
import {
  DEFAULT_RESOLVE_CONFIG,
  DEFAULT_ENGAGEMENT_CONFIG,
  DEFAULT_RIPOSTE_CONFIG,
  DEFAULT_INTERCEPT_CONFIG,
  DEFAULT_CHARGE_CONFIG,
  DEFAULT_PHALANX_CONFIG,
  DEFAULT_LOS_CONFIG,
  DEFAULT_AMMO_CONFIG,
  DEFAULT_CONTAGION_CONFIG,
  DEFAULT_SHRED_CONFIG,
} from './defaults';
import { MVP_PRESET } from './presets/mvp';
import type { MechanicsConfig } from './mechanics.types';

describe('MECHANIC_DEPENDENCIES', () => {
  it('should define dependencies for all mechanics', () => {
    const allMechanics: (keyof MechanicsConfig)[] = [
      'facing',
      'armorShred',
      'resolve',
      'engagement',
      'flanking',
      'ammunition',
      'riposte',
      'intercept',
      'aura',
      'charge',
      'overwatch',
      'phalanx',
      'lineOfSight',
      'contagion',
    ];

    for (const mechanic of allMechanics) {
      expect(MECHANIC_DEPENDENCIES).toHaveProperty(mechanic);
      expect(Array.isArray(MECHANIC_DEPENDENCIES[mechanic])).toBe(true);
    }
  });

  it('should have no dependencies for Tier 0 mechanics', () => {
    expect(MECHANIC_DEPENDENCIES.facing).toEqual([]);
    expect(MECHANIC_DEPENDENCIES.armorShred).toEqual([]);
  });

  it('should have correct dependencies for Tier 1 mechanics', () => {
    expect(MECHANIC_DEPENDENCIES.resolve).toEqual([]);
    expect(MECHANIC_DEPENDENCIES.engagement).toEqual([]);
    expect(MECHANIC_DEPENDENCIES.flanking).toEqual(['facing']);
    expect(MECHANIC_DEPENDENCIES.ammunition).toEqual([]);
  });

  it('should have correct dependencies for Tier 2 mechanics', () => {
    expect(MECHANIC_DEPENDENCIES.riposte).toEqual(['flanking']);
    expect(MECHANIC_DEPENDENCIES.intercept).toEqual(['engagement']);
    expect(MECHANIC_DEPENDENCIES.aura).toEqual([]);
  });

  it('should have correct dependencies for Tier 3 mechanics', () => {
    expect(MECHANIC_DEPENDENCIES.charge).toEqual(['intercept']);
    expect(MECHANIC_DEPENDENCIES.overwatch).toEqual(['intercept', 'ammunition']);
    expect(MECHANIC_DEPENDENCIES.phalanx).toEqual(['facing']);
    expect(MECHANIC_DEPENDENCIES.lineOfSight).toEqual(['facing']);
  });

  it('should have correct dependencies for Tier 4 mechanics', () => {
    expect(MECHANIC_DEPENDENCIES.contagion).toEqual([]);
  });
});

describe('getDefaultConfig', () => {
  it('should return true for boolean-only mechanics', () => {
    expect(getDefaultConfig('facing')).toBe(true);
    expect(getDefaultConfig('flanking')).toBe(true);
    expect(getDefaultConfig('aura')).toBe(true);
    expect(getDefaultConfig('overwatch')).toBe(true);
  });

  it('should return default config objects for configurable mechanics', () => {
    expect(getDefaultConfig('resolve')).toEqual(DEFAULT_RESOLVE_CONFIG);
    expect(getDefaultConfig('engagement')).toEqual(DEFAULT_ENGAGEMENT_CONFIG);
    expect(getDefaultConfig('riposte')).toEqual(DEFAULT_RIPOSTE_CONFIG);
    expect(getDefaultConfig('intercept')).toEqual(DEFAULT_INTERCEPT_CONFIG);
    expect(getDefaultConfig('charge')).toEqual(DEFAULT_CHARGE_CONFIG);
    expect(getDefaultConfig('phalanx')).toEqual(DEFAULT_PHALANX_CONFIG);
    expect(getDefaultConfig('lineOfSight')).toEqual(DEFAULT_LOS_CONFIG);
    expect(getDefaultConfig('ammunition')).toEqual(DEFAULT_AMMO_CONFIG);
    expect(getDefaultConfig('contagion')).toEqual(DEFAULT_CONTAGION_CONFIG);
    expect(getDefaultConfig('armorShred')).toEqual(DEFAULT_SHRED_CONFIG);
  });
});

describe('resolveDependencies', () => {
  describe('empty config', () => {
    it('should return MVP preset when given empty config', () => {
      const result = resolveDependencies({});
      expect(result).toEqual(MVP_PRESET);
    });
  });

  describe('independent mechanics (no dependencies)', () => {
    it('should enable facing without additional dependencies', () => {
      const result = resolveDependencies({ facing: true });

      expect(result.facing).toBe(true);
      // All other mechanics should remain disabled
      expect(result.resolve).toBe(false);
      expect(result.engagement).toBe(false);
      expect(result.flanking).toBe(false);
    });

    it('should enable armorShred without additional dependencies', () => {
      const result = resolveDependencies({ armorShred: DEFAULT_SHRED_CONFIG });

      expect(result.armorShred).toEqual(DEFAULT_SHRED_CONFIG);
      expect(result.facing).toBe(false);
      expect(result.flanking).toBe(false);
    });

    it('should enable resolve without additional dependencies', () => {
      const result = resolveDependencies({ resolve: DEFAULT_RESOLVE_CONFIG });

      expect(result.resolve).toEqual(DEFAULT_RESOLVE_CONFIG);
      expect(result.facing).toBe(false);
    });

    it('should enable engagement without additional dependencies', () => {
      const result = resolveDependencies({ engagement: DEFAULT_ENGAGEMENT_CONFIG });

      expect(result.engagement).toEqual(DEFAULT_ENGAGEMENT_CONFIG);
      expect(result.facing).toBe(false);
    });

    it('should enable aura without additional dependencies', () => {
      const result = resolveDependencies({ aura: true });

      expect(result.aura).toBe(true);
      expect(result.facing).toBe(false);
    });

    it('should enable ammunition without additional dependencies', () => {
      const result = resolveDependencies({ ammunition: DEFAULT_AMMO_CONFIG });

      expect(result.ammunition).toEqual(DEFAULT_AMMO_CONFIG);
      expect(result.facing).toBe(false);
    });

    it('should enable contagion without additional dependencies', () => {
      const result = resolveDependencies({ contagion: DEFAULT_CONTAGION_CONFIG });

      expect(result.contagion).toEqual(DEFAULT_CONTAGION_CONFIG);
      expect(result.facing).toBe(false);
    });
  });

  describe('single-level dependencies', () => {
    it('should auto-enable facing when flanking is enabled', () => {
      const result = resolveDependencies({ flanking: true });

      expect(result.flanking).toBe(true);
      expect(result.facing).toBe(true); // Auto-enabled dependency
    });

    it('should auto-enable engagement when intercept is enabled', () => {
      const result = resolveDependencies({ intercept: DEFAULT_INTERCEPT_CONFIG });

      expect(result.intercept).toEqual(DEFAULT_INTERCEPT_CONFIG);
      expect(result.engagement).toEqual(DEFAULT_ENGAGEMENT_CONFIG); // Auto-enabled
    });

    it('should auto-enable facing when phalanx is enabled', () => {
      const result = resolveDependencies({ phalanx: DEFAULT_PHALANX_CONFIG });

      expect(result.phalanx).toEqual(DEFAULT_PHALANX_CONFIG);
      expect(result.facing).toBe(true); // Auto-enabled dependency
    });

    it('should auto-enable facing when lineOfSight is enabled', () => {
      const result = resolveDependencies({ lineOfSight: DEFAULT_LOS_CONFIG });

      expect(result.lineOfSight).toEqual(DEFAULT_LOS_CONFIG);
      expect(result.facing).toBe(true); // Auto-enabled dependency
    });
  });

  describe('transitive dependencies', () => {
    it('should auto-enable flanking and facing when riposte is enabled', () => {
      const result = resolveDependencies({ riposte: DEFAULT_RIPOSTE_CONFIG });

      expect(result.riposte).toEqual(DEFAULT_RIPOSTE_CONFIG);
      expect(result.flanking).toBe(true); // Direct dependency
      expect(result.facing).toBe(true); // Transitive dependency (flanking → facing)
    });

    it('should auto-enable intercept and engagement when charge is enabled', () => {
      const result = resolveDependencies({ charge: DEFAULT_CHARGE_CONFIG });

      expect(result.charge).toEqual(DEFAULT_CHARGE_CONFIG);
      expect(result.intercept).toEqual(DEFAULT_INTERCEPT_CONFIG); // Direct dependency
      expect(result.engagement).toEqual(DEFAULT_ENGAGEMENT_CONFIG); // Transitive (intercept → engagement)
    });

    it('should auto-enable intercept, engagement, and ammunition when overwatch is enabled', () => {
      const result = resolveDependencies({ overwatch: true });

      expect(result.overwatch).toBe(true);
      expect(result.intercept).toEqual(DEFAULT_INTERCEPT_CONFIG); // Direct dependency
      expect(result.ammunition).toEqual(DEFAULT_AMMO_CONFIG); // Direct dependency
      expect(result.engagement).toEqual(DEFAULT_ENGAGEMENT_CONFIG); // Transitive (intercept → engagement)
    });
  });

  describe('multiple mechanics enabled', () => {
    it('should resolve dependencies for multiple independent mechanics', () => {
      const result = resolveDependencies({
        facing: true,
        resolve: DEFAULT_RESOLVE_CONFIG,
        aura: true,
      });

      expect(result.facing).toBe(true);
      expect(result.resolve).toEqual(DEFAULT_RESOLVE_CONFIG);
      expect(result.aura).toBe(true);
      // No additional dependencies should be enabled
      expect(result.flanking).toBe(false);
      expect(result.engagement).toBe(false);
    });

    it('should resolve shared dependencies only once', () => {
      // Both phalanx and lineOfSight depend on facing
      const result = resolveDependencies({
        phalanx: DEFAULT_PHALANX_CONFIG,
        lineOfSight: DEFAULT_LOS_CONFIG,
      });

      expect(result.phalanx).toEqual(DEFAULT_PHALANX_CONFIG);
      expect(result.lineOfSight).toEqual(DEFAULT_LOS_CONFIG);
      expect(result.facing).toBe(true); // Shared dependency
    });

    it('should handle complex dependency chains', () => {
      // Enable riposte (needs flanking → facing) and charge (needs intercept → engagement)
      const result = resolveDependencies({
        riposte: DEFAULT_RIPOSTE_CONFIG,
        charge: DEFAULT_CHARGE_CONFIG,
      });

      expect(result.riposte).toEqual(DEFAULT_RIPOSTE_CONFIG);
      expect(result.charge).toEqual(DEFAULT_CHARGE_CONFIG);
      expect(result.flanking).toBe(true);
      expect(result.facing).toBe(true);
      expect(result.intercept).toEqual(DEFAULT_INTERCEPT_CONFIG);
      expect(result.engagement).toEqual(DEFAULT_ENGAGEMENT_CONFIG);
    });
  });

  describe('preserves user-provided config', () => {
    it('should preserve custom config values over defaults', () => {
      const customResolve: typeof DEFAULT_RESOLVE_CONFIG = {
        ...DEFAULT_RESOLVE_CONFIG,
        maxResolve: 200,
        baseRegeneration: 10,
      };

      const result = resolveDependencies({ resolve: customResolve });

      expect(result.resolve).toEqual(customResolve);
      expect((result.resolve as typeof DEFAULT_RESOLVE_CONFIG).maxResolve).toBe(200);
    });

    it('should preserve user-enabled dependencies', () => {
      // User explicitly enables facing with custom intent
      const result = resolveDependencies({
        facing: true,
        flanking: true,
      });

      expect(result.facing).toBe(true);
      expect(result.flanking).toBe(true);
    });

    it('should not override user-provided dependency config with defaults', () => {
      const customEngagement: typeof DEFAULT_ENGAGEMENT_CONFIG = {
        attackOfOpportunity: false,
        archerPenalty: false,
        archerPenaltyPercent: 0.25,
      };

      // User provides custom engagement config, then enables intercept
      const result = resolveDependencies({
        engagement: customEngagement,
        intercept: DEFAULT_INTERCEPT_CONFIG,
      });

      expect(result.engagement).toEqual(customEngagement);
      expect(result.intercept).toEqual(DEFAULT_INTERCEPT_CONFIG);
    });
  });

  describe('disabled mechanics', () => {
    it('should not enable dependencies for disabled mechanics', () => {
      const result = resolveDependencies({
        riposte: false,
        flanking: false,
      });

      expect(result.riposte).toBe(false);
      expect(result.flanking).toBe(false);
      expect(result.facing).toBe(false); // Should not be auto-enabled
    });

    it('should handle mix of enabled and disabled mechanics', () => {
      const result = resolveDependencies({
        riposte: false, // Disabled, no deps needed
        phalanx: DEFAULT_PHALANX_CONFIG, // Enabled, needs facing
      });

      expect(result.riposte).toBe(false);
      expect(result.phalanx).toEqual(DEFAULT_PHALANX_CONFIG);
      expect(result.facing).toBe(true); // Only from phalanx
      expect(result.flanking).toBe(false); // Not needed since riposte is disabled
    });
  });
});
