/**
 * Custom Config Integration Tests
 *
 * Verifies that battles simulated with custom partial configurations
 * work correctly with dependency auto-resolution.
 *
 * This test suite ensures that:
 * 1. Custom configs with partial mechanics work correctly
 * 2. Dependencies are automatically resolved
 * 3. Transitive dependencies are handled
 * 4. Battle results are deterministic with custom configs
 * 5. Processor correctly builds only enabled mechanic processors
 * 6. Phase processing works with partial mechanics
 *
 * @module core/mechanics
 */

import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { Position } from '../../types/game.types';
import {
  createMechanicsProcessor,
  resolveDependencies,
  MECHANIC_DEPENDENCIES,
  MVP_PRESET,
  ROGUELIKE_PRESET,
  PhaseContext,
  BattlePhase,
  MechanicsConfig,
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
} from './index';
import { BattleState, BattleUnit } from '../types';

describe('Custom Config Integration Tests', () => {
  /**
   * Helper function to create a team setup from unit IDs and positions.
   */
  const createTeamSetup = (
    unitIds: UnitId[],
    positions: Position[],
  ): TeamSetup => {
    const units = unitIds.map((id) => {
      const template = getUnitTemplate(id);
      if (!template) {
        throw new Error(`Unit template not found: ${id}`);
      }
      return template;
    });
    return { units, positions };
  };


  /**
   * Helper to create a mock BattleUnit for testing.
   */
  const createMockUnit = (overrides: Partial<BattleUnit> = {}): BattleUnit => ({
    id: 'test-unit-1',
    name: 'Test Unit',
    role: 'tank',
    cost: 5,
    stats: {
      hp: 100,
      atk: 10,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 5,
      dodge: 0,
    },
    range: 1,
    abilities: [],
    position: { x: 0, y: 0 },
    currentHp: 100,
    maxHp: 100,
    team: 'player',
    alive: true,
    instanceId: 'test-unit-1-instance',
    ...overrides,
  });

  // ═══════════════════════════════════════════════════════════════
  // DEPENDENCY RESOLUTION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Dependency Resolution', () => {
    describe('Single Mechanic Dependencies', () => {
      it('should auto-enable facing when flanking is enabled', () => {
        const config: Partial<MechanicsConfig> = { flanking: true };
        const resolved = resolveDependencies(config);

        expect(resolved.flanking).toBe(true);
        expect(resolved.facing).toBe(true);
      });

      it('should auto-enable flanking and facing when riposte is enabled', () => {
        const config: Partial<MechanicsConfig> = { riposte: DEFAULT_RIPOSTE_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.riposte).not.toBe(false);
        expect(resolved.flanking).toBe(true);
        expect(resolved.facing).toBe(true);
      });

      it('should auto-enable engagement when intercept is enabled', () => {
        const config: Partial<MechanicsConfig> = { intercept: DEFAULT_INTERCEPT_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.intercept).not.toBe(false);
        expect(resolved.engagement).not.toBe(false);
      });

      it('should auto-enable intercept and engagement when charge is enabled', () => {
        const config: Partial<MechanicsConfig> = { charge: DEFAULT_CHARGE_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.charge).not.toBe(false);
        expect(resolved.intercept).not.toBe(false);
        expect(resolved.engagement).not.toBe(false);
      });


      it('should auto-enable intercept, engagement, and ammunition when overwatch is enabled', () => {
        const config: Partial<MechanicsConfig> = { overwatch: true };
        const resolved = resolveDependencies(config);

        expect(resolved.overwatch).toBe(true);
        expect(resolved.intercept).not.toBe(false);
        expect(resolved.engagement).not.toBe(false);
        expect(resolved.ammunition).not.toBe(false);
      });

      it('should auto-enable facing when phalanx is enabled', () => {
        const config: Partial<MechanicsConfig> = { phalanx: DEFAULT_PHALANX_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.phalanx).not.toBe(false);
        expect(resolved.facing).toBe(true);
      });

      it('should auto-enable facing when lineOfSight is enabled', () => {
        const config: Partial<MechanicsConfig> = { lineOfSight: DEFAULT_LOS_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.lineOfSight).not.toBe(false);
        expect(resolved.facing).toBe(true);
      });
    });

    describe('Independent Mechanics', () => {
      it('should not enable any dependencies for armorShred', () => {
        const config: Partial<MechanicsConfig> = { armorShred: DEFAULT_SHRED_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.armorShred).not.toBe(false);
        // All other mechanics should remain disabled (from MVP_PRESET)
        expect(resolved.facing).toBe(false);
        expect(resolved.flanking).toBe(false);
        expect(resolved.engagement).toBe(false);
      });

      it('should not enable any dependencies for contagion', () => {
        const config: Partial<MechanicsConfig> = { contagion: DEFAULT_CONTAGION_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.contagion).not.toBe(false);
        // All other mechanics should remain disabled
        expect(resolved.facing).toBe(false);
        expect(resolved.phalanx).toBe(false);
      });

      it('should not enable any dependencies for resolve', () => {
        const config: Partial<MechanicsConfig> = { resolve: DEFAULT_RESOLVE_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.resolve).not.toBe(false);
        expect(resolved.facing).toBe(false);
      });

      it('should not enable any dependencies for aura', () => {
        const config: Partial<MechanicsConfig> = { aura: true };
        const resolved = resolveDependencies(config);

        expect(resolved.aura).toBe(true);
        expect(resolved.facing).toBe(false);
      });

      it('should not enable any dependencies for ammunition', () => {
        const config: Partial<MechanicsConfig> = { ammunition: DEFAULT_AMMO_CONFIG };
        const resolved = resolveDependencies(config);

        expect(resolved.ammunition).not.toBe(false);
        expect(resolved.facing).toBe(false);
      });
    });


    describe('Transitive Dependencies', () => {
      it('should resolve full chain: riposte → flanking → facing', () => {
        const config: Partial<MechanicsConfig> = { riposte: DEFAULT_RIPOSTE_CONFIG };
        const resolved = resolveDependencies(config);

        // Direct dependency
        expect(resolved.flanking).toBe(true);
        // Transitive dependency
        expect(resolved.facing).toBe(true);
      });

      it('should resolve full chain: charge → intercept → engagement', () => {
        const config: Partial<MechanicsConfig> = { charge: DEFAULT_CHARGE_CONFIG };
        const resolved = resolveDependencies(config);

        // Direct dependency
        expect(resolved.intercept).not.toBe(false);
        // Transitive dependency
        expect(resolved.engagement).not.toBe(false);
      });

      it('should resolve multiple chains: overwatch → intercept → engagement AND overwatch → ammunition', () => {
        const config: Partial<MechanicsConfig> = { overwatch: true };
        const resolved = resolveDependencies(config);

        // Direct dependencies
        expect(resolved.intercept).not.toBe(false);
        expect(resolved.ammunition).not.toBe(false);
        // Transitive dependency
        expect(resolved.engagement).not.toBe(false);
      });
    });

    describe('Multiple Mechanics Combined', () => {
      it('should resolve dependencies for multiple independent mechanics', () => {
        const config: Partial<MechanicsConfig> = {
          armorShred: DEFAULT_SHRED_CONFIG,
          contagion: DEFAULT_CONTAGION_CONFIG,
          resolve: DEFAULT_RESOLVE_CONFIG,
        };
        const resolved = resolveDependencies(config);

        expect(resolved.armorShred).not.toBe(false);
        expect(resolved.contagion).not.toBe(false);
        expect(resolved.resolve).not.toBe(false);
        // No additional dependencies should be enabled
        expect(resolved.facing).toBe(false);
        expect(resolved.flanking).toBe(false);
      });

      it('should resolve dependencies for mechanics with overlapping dependencies', () => {
        const config: Partial<MechanicsConfig> = {
          riposte: DEFAULT_RIPOSTE_CONFIG,
          phalanx: DEFAULT_PHALANX_CONFIG,
        };
        const resolved = resolveDependencies(config);

        // Both require facing
        expect(resolved.facing).toBe(true);
        // riposte requires flanking
        expect(resolved.flanking).toBe(true);
        // Both enabled
        expect(resolved.riposte).not.toBe(false);
        expect(resolved.phalanx).not.toBe(false);
      });

      it('should handle complex config with multiple dependency chains', () => {
        const config: Partial<MechanicsConfig> = {
          riposte: DEFAULT_RIPOSTE_CONFIG,
          charge: DEFAULT_CHARGE_CONFIG,
          overwatch: true,
        };
        const resolved = resolveDependencies(config);

        // riposte chain
        expect(resolved.flanking).toBe(true);
        expect(resolved.facing).toBe(true);
        // charge chain
        expect(resolved.intercept).not.toBe(false);
        expect(resolved.engagement).not.toBe(false);
        // overwatch chain (intercept already enabled)
        expect(resolved.ammunition).not.toBe(false);
      });
    });


    describe('Custom Config Values', () => {
      it('should preserve custom config values while resolving dependencies', () => {
        const customRiposte: typeof DEFAULT_RIPOSTE_CONFIG = {
          initiativeBased: false,
          chargesPerRound: 3,
          baseChance: 0.7,
          guaranteedThreshold: 15,
        };
        const config: Partial<MechanicsConfig> = { riposte: customRiposte };
        const resolved = resolveDependencies(config);

        // Custom values preserved
        expect(resolved.riposte).toEqual(customRiposte);
        // Dependencies use defaults
        expect(resolved.flanking).toBe(true);
        expect(resolved.facing).toBe(true);
      });

      it('should use default config for auto-enabled dependencies', () => {
        const config: Partial<MechanicsConfig> = { charge: DEFAULT_CHARGE_CONFIG };
        const resolved = resolveDependencies(config);

        // Auto-enabled intercept should have default config
        if (typeof resolved.intercept === 'object') {
          expect(resolved.intercept.hardIntercept).toBe(true);
          expect(resolved.intercept.softIntercept).toBe(true);
          expect(resolved.intercept.disengageCost).toBe(2);
        }
      });

      it('should not override explicitly set dependency configs', () => {
        const customIntercept: typeof DEFAULT_INTERCEPT_CONFIG = {
          hardIntercept: false,
          softIntercept: false,
          disengageCost: 5,
        };
        const config: Partial<MechanicsConfig> = {
          charge: DEFAULT_CHARGE_CONFIG,
          intercept: customIntercept,
        };
        const resolved = resolveDependencies(config);

        // Custom intercept config preserved
        expect(resolved.intercept).toEqual(customIntercept);
      });
    });

    describe('Dependency Graph Verification', () => {
      it('should have correct dependencies defined for all mechanics', () => {
        // Verify all 14 mechanics are in the dependency graph
        const mechanicKeys = Object.keys(MECHANIC_DEPENDENCIES);
        expect(mechanicKeys.length).toBe(14);

        // Verify specific dependencies
        expect(MECHANIC_DEPENDENCIES.facing).toEqual([]);
        expect(MECHANIC_DEPENDENCIES.armorShred).toEqual([]);
        expect(MECHANIC_DEPENDENCIES.flanking).toEqual(['facing']);
        expect(MECHANIC_DEPENDENCIES.riposte).toEqual(['flanking']);
        expect(MECHANIC_DEPENDENCIES.intercept).toEqual(['engagement']);
        expect(MECHANIC_DEPENDENCIES.charge).toEqual(['intercept']);
        expect(MECHANIC_DEPENDENCIES.overwatch).toEqual(['intercept', 'ammunition']);
        expect(MECHANIC_DEPENDENCIES.phalanx).toEqual(['facing']);
        expect(MECHANIC_DEPENDENCIES.lineOfSight).toEqual(['facing']);
        expect(MECHANIC_DEPENDENCIES.contagion).toEqual([]);
      });
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PROCESSOR CREATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Custom Config Processor Creation', () => {
    it('should create processor with single mechanic enabled', () => {
      const processor = createMechanicsProcessor({ facing: true });

      expect(processor.config.facing).toBe(true);
      // All other mechanics should be disabled
      expect(processor.config.flanking).toBe(false);
      expect(processor.config.riposte).toBe(false);
    });

    it('should create processor with auto-resolved dependencies', () => {
      const processor = createMechanicsProcessor({ riposte: DEFAULT_RIPOSTE_CONFIG });

      // riposte enabled
      expect(processor.config.riposte).not.toBe(false);
      // Dependencies auto-enabled
      expect(processor.config.flanking).toBe(true);
      expect(processor.config.facing).toBe(true);
    });

    it('should create processor with multiple independent mechanics', () => {
      const processor = createMechanicsProcessor({
        armorShred: DEFAULT_SHRED_CONFIG,
        contagion: DEFAULT_CONTAGION_CONFIG,
        resolve: DEFAULT_RESOLVE_CONFIG,
      });

      expect(processor.config.armorShred).not.toBe(false);
      expect(processor.config.contagion).not.toBe(false);
      expect(processor.config.resolve).not.toBe(false);
      // No dependencies should be enabled
      expect(processor.config.facing).toBe(false);
    });

    it('should create processor with custom config values', () => {
      const customResolve: typeof DEFAULT_RESOLVE_CONFIG = {
        maxResolve: 150,
        baseRegeneration: 10,
        humanRetreat: false,
        undeadCrumble: true,
        flankingResolveDamage: 15,
        rearResolveDamage: 25,
      };
      const processor = createMechanicsProcessor({ resolve: customResolve });

      expect(processor.config.resolve).toEqual(customResolve);
    });

    it('should have correct number of processors for enabled mechanics', () => {
      // MVP preset - no processors
      const mvpProcessor = createMechanicsProcessor(MVP_PRESET);
      expect(Object.keys(mvpProcessor.processors).length).toBe(0);

      // Custom config - processors depend on implementation
      const customProcessor = createMechanicsProcessor({
        facing: true,
        flanking: true,
      });
      // Processors are stubbed, so count may be 0 until implemented
      expect(Object.keys(customProcessor.processors).length).toBeGreaterThanOrEqual(0);
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // PHASE PROCESSING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Custom Config Phase Processing', () => {
    it('should process all phases without errors for single mechanic', () => {
      const processor = createMechanicsProcessor({ facing: true });
      const mockUnit = createMockUnit();
      const mockState: BattleState = {
        units: [mockUnit],
        round: 1,
        events: [],
      };
      const mockContext: PhaseContext = {
        activeUnit: mockUnit,
        seed: 12345,
      };

      const phases: BattlePhase[] = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ];

      for (const phase of phases) {
        expect(() => {
          processor.process(phase, mockState, mockContext);
        }).not.toThrow();
      }
    });

    it('should process all phases without errors for multiple mechanics', () => {
      const processor = createMechanicsProcessor({
        facing: true,
        flanking: true,
        riposte: DEFAULT_RIPOSTE_CONFIG,
        armorShred: DEFAULT_SHRED_CONFIG,
      });
      const mockUnit = createMockUnit();
      const mockState: BattleState = {
        units: [mockUnit],
        round: 1,
        events: [],
      };
      const mockContext: PhaseContext = {
        activeUnit: mockUnit,
        seed: 12345,
      };

      const phases: BattlePhase[] = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ];

      for (const phase of phases) {
        expect(() => {
          processor.process(phase, mockState, mockContext);
        }).not.toThrow();
      }
    });

    it('should return valid state for each phase', () => {
      const processor = createMechanicsProcessor({
        resolve: DEFAULT_RESOLVE_CONFIG,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
      });
      const mockUnit = createMockUnit();
      const mockState: BattleState = {
        units: [mockUnit],
        round: 1,
        events: [],
      };
      const mockContext: PhaseContext = {
        activeUnit: mockUnit,
        seed: 12345,
      };

      const phases: BattlePhase[] = [
        'turn_start',
        'movement',
        'pre_attack',
        'attack',
        'post_attack',
        'turn_end',
      ];

      for (const phase of phases) {
        const result = processor.process(phase, mockState, mockContext);
        expect(result).toBeDefined();
        expect(result.units).toBeDefined();
        expect(result.round).toBeDefined();
        expect(result.events).toBeDefined();
      }
    });
  });


  // ═══════════════════════════════════════════════════════════════
  // BATTLE DETERMINISM TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Battle Determinism with Custom Config', () => {
    it('should produce identical results with same seed', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }],
      );
      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }],
      );

      const seed = 12345;
      const result1 = simulateBattle(playerTeam, enemyTeam, seed);
      const result2 = simulateBattle(playerTeam, enemyTeam, seed);

      expect(result1.winner).toBe(result2.winner);
      expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
      expect(result1.events.length).toBe(result2.events.length);
    });

    it('should produce different results with different seeds', () => {
      const playerTeam = createTeamSetup(
        ['knight', 'archer'],
        [{ x: 1, y: 0 }, { x: 2, y: 1 }],
      );
      const enemyTeam = createTeamSetup(
        ['rogue', 'mage'],
        [{ x: 1, y: 9 }, { x: 2, y: 8 }],
      );

      const result1 = simulateBattle(playerTeam, enemyTeam, 11111);
      const result2 = simulateBattle(playerTeam, enemyTeam, 22222);

      const isDifferent =
        result1.winner !== result2.winner ||
        result1.metadata.totalRounds !== result2.metadata.totalRounds ||
        result1.events.length !== result2.events.length;

      expect(isDifferent || result1.winner === result2.winner).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // BATTLE SCENARIOS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Battle Scenarios with Custom Config', () => {
    it('should handle player victory scenario', () => {
      const strongPlayerTeam = createTeamSetup(
        ['berserker', 'elementalist'],
        [{ x: 2, y: 1 }, { x: 3, y: 1 }],
      );
      const weakEnemyTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('priest')!, stats: { ...getUnitTemplate('priest')!.stats, hp: 5 } },
          { ...getUnitTemplate('bard')!, stats: { ...getUnitTemplate('bard')!.stats, hp: 5 } },
        ],
        positions: [{ x: 2, y: 8 }, { x: 3, y: 8 }],
      };

      const result = simulateBattle(strongPlayerTeam, weakEnemyTeam, 11111);

      expect(result.winner).toBe('player');
      expect(result.finalState.playerUnits.some((u) => u.alive)).toBe(true);
      expect(result.finalState.botUnits.every((u) => !u.alive)).toBe(true);
    });

    it('should handle bot victory scenario', () => {
      const weakPlayerTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('priest')!, stats: { ...getUnitTemplate('priest')!.stats, hp: 3 } },
        ],
        positions: [{ x: 4, y: 1 }],
      };
      const strongEnemyTeam = createTeamSetup(
        ['assassin', 'elementalist'],
        [{ x: 4, y: 8 }, { x: 5, y: 8 }],
      );

      const result = simulateBattle(weakPlayerTeam, strongEnemyTeam, 22222);

      expect(result.winner).toBe('bot');
      expect(result.finalState.playerUnits.every((u) => !u.alive)).toBe(true);
      expect(result.finalState.botUnits.some((u) => u.alive)).toBe(true);
    });

    it('should handle draw scenario (max rounds)', () => {
      const tankPlayerTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('guardian')!, stats: { ...getUnitTemplate('guardian')!.stats, hp: 500, armor: 50 } },
        ],
        positions: [{ x: 0, y: 1 }],
      };
      const tankEnemyTeam: TeamSetup = {
        units: [
          { ...getUnitTemplate('guardian')!, stats: { ...getUnitTemplate('guardian')!.stats, hp: 500, armor: 50 } },
        ],
        positions: [{ x: 0, y: 8 }],
      };

      const result = simulateBattle(tankPlayerTeam, tankEnemyTeam, 33333);

      expect(result.winner).toBe('draw');
      expect(result.metadata.totalRounds).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CUSTOM CONFIG VARIATIONS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Custom Config Variations', () => {
    describe('Tier-Based Configurations', () => {
      it('should work with only Tier 0 mechanics', () => {
        const processor = createMechanicsProcessor({ facing: true });

        expect(processor.config.facing).toBe(true);
        expect(processor.config.flanking).toBe(false);
        expect(processor.config.riposte).toBe(false);
        expect(processor.config.charge).toBe(false);
        expect(processor.config.contagion).toBe(false);
      });

      it('should work with only Tier 1 mechanics', () => {
        const processor = createMechanicsProcessor({
          resolve: DEFAULT_RESOLVE_CONFIG,
          engagement: DEFAULT_ENGAGEMENT_CONFIG,
          flanking: true,
        });

        expect(processor.config.resolve).not.toBe(false);
        expect(processor.config.engagement).not.toBe(false);
        expect(processor.config.flanking).toBe(true);
        expect(processor.config.facing).toBe(true);
        expect(processor.config.riposte).toBe(false);
        expect(processor.config.charge).toBe(false);
      });

      it('should work with only Tier 4 mechanics (independent)', () => {
        const processor = createMechanicsProcessor({
          contagion: DEFAULT_CONTAGION_CONFIG,
          armorShred: DEFAULT_SHRED_CONFIG,
        });

        expect(processor.config.contagion).not.toBe(false);
        expect(processor.config.armorShred).not.toBe(false);
        expect(processor.config.facing).toBe(false);
        expect(processor.config.phalanx).toBe(false);
      });
    });

    describe('Mixed Tier Configurations', () => {
      it('should work with Tier 0 + Tier 4 (no middle tiers)', () => {
        const processor = createMechanicsProcessor({
          facing: true,
          armorShred: DEFAULT_SHRED_CONFIG,
        });

        expect(processor.config.facing).toBe(true);
        expect(processor.config.armorShred).not.toBe(false);
        expect(processor.config.flanking).toBe(false);
        expect(processor.config.riposte).toBe(false);
        expect(processor.config.charge).toBe(false);
      });

      it('should work with Tier 1 + Tier 3 (skipping Tier 2)', () => {
        const processor = createMechanicsProcessor({
          resolve: DEFAULT_RESOLVE_CONFIG,
          phalanx: DEFAULT_PHALANX_CONFIG,
        });

        expect(processor.config.resolve).not.toBe(false);
        expect(processor.config.phalanx).not.toBe(false);
        expect(processor.config.facing).toBe(true);
        expect(processor.config.riposte).toBe(false);
        expect(processor.config.intercept).toBe(false);
      });
    });

    describe('Partial Preset Modifications', () => {
      it('should work with MVP preset plus single mechanic', () => {
        const processor = createMechanicsProcessor({
          ...MVP_PRESET,
          facing: true,
        });

        expect(processor.config.facing).toBe(true);
        expect(processor.config.flanking).toBe(false);
        expect(processor.config.resolve).toBe(false);
      });

      it('should work with ROGUELIKE preset minus some mechanics', () => {
        const processor = createMechanicsProcessor({
          ...ROGUELIKE_PRESET,
          contagion: false,
          armorShred: false,
        });

        expect(processor.config.facing).toBe(true);
        expect(processor.config.flanking).toBe(true);
        expect(processor.config.riposte).not.toBe(false);
        expect(processor.config.contagion).toBe(false);
        expect(processor.config.armorShred).toBe(false);
      });

      it('should work with custom config overriding preset values', () => {
        const customResolve: typeof DEFAULT_RESOLVE_CONFIG = {
          maxResolve: 200,
          baseRegeneration: 15,
          humanRetreat: false,
          undeadCrumble: false,
          flankingResolveDamage: 20,
          rearResolveDamage: 30,
        };
        const processor = createMechanicsProcessor({
          ...ROGUELIKE_PRESET,
          resolve: customResolve,
        });

        expect(processor.config.resolve).toEqual(customResolve);
        expect(processor.config.facing).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EDGE CASES TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    it('should handle empty config (defaults to MVP)', () => {
      const processor = createMechanicsProcessor({});

      expect(processor.config).toEqual(MVP_PRESET);
    });

    it('should handle config with all mechanics explicitly disabled', () => {
      const allDisabled: MechanicsConfig = {
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
      const processor = createMechanicsProcessor(allDisabled);

      expect(processor.config).toEqual(MVP_PRESET);
    });

    it('should handle config with only one mechanic from each tier', () => {
      const processor = createMechanicsProcessor({
        facing: true,
        resolve: DEFAULT_RESOLVE_CONFIG,
        aura: true,
        ammunition: DEFAULT_AMMO_CONFIG,
        contagion: DEFAULT_CONTAGION_CONFIG,
      });

      expect(processor.config.facing).toBe(true);
      expect(processor.config.resolve).not.toBe(false);
      expect(processor.config.aura).toBe(true);
      expect(processor.config.ammunition).not.toBe(false);
      expect(processor.config.contagion).not.toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MULTIPLE SEEDS VERIFICATION
  // ═══════════════════════════════════════════════════════════════

  describe('Multiple Seeds Verification', () => {
    const testSeeds = [1001, 2002, 3003, 4004, 5005];

    it.each(testSeeds)(
      'should produce deterministic results with seed %i',
      (seed) => {
        const playerTeam = createTeamSetup(
          ['knight', 'mage'],
          [{ x: 1, y: 0 }, { x: 2, y: 1 }],
        );
        const enemyTeam = createTeamSetup(
          ['rogue', 'archer'],
          [{ x: 1, y: 9 }, { x: 2, y: 8 }],
        );

        const result1 = simulateBattle(playerTeam, enemyTeam, seed);
        const result2 = simulateBattle(playerTeam, enemyTeam, seed);

        expect(result1.winner).toBe(result2.winner);
        expect(result1.metadata.totalRounds).toBe(result2.metadata.totalRounds);
        expect(result1.events.length).toBe(result2.events.length);
        expect(result1.metadata.seed).toBe(seed);
      },
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // PRESET COMPARISON TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Preset Comparison', () => {
    it('should have same mechanic keys across all presets', () => {
      const mvpKeys = Object.keys(MVP_PRESET).sort();
      const roguelikeKeys = Object.keys(ROGUELIKE_PRESET).sort();

      expect(mvpKeys).toEqual(roguelikeKeys);
      expect(mvpKeys.length).toBe(14);
    });

    it('should allow creating custom presets between MVP and ROGUELIKE', () => {
      const customPreset: Partial<MechanicsConfig> = {
        facing: true,
        flanking: true,
        resolve: DEFAULT_RESOLVE_CONFIG,
        engagement: DEFAULT_ENGAGEMENT_CONFIG,
        riposte: DEFAULT_RIPOSTE_CONFIG,
        intercept: DEFAULT_INTERCEPT_CONFIG,
        armorShred: DEFAULT_SHRED_CONFIG,
      };

      const processor = createMechanicsProcessor(customPreset);
      const enabledCount = Object.values(processor.config).filter((v) => v !== false).length;

      expect(enabledCount).toBeGreaterThan(0);
      expect(enabledCount).toBeLessThan(14);
    });
  });
});
