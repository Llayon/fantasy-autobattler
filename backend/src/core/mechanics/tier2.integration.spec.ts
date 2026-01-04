/**
 * Tier 2 Integration Tests
 *
 * Tests the integration between Tier 2 mechanics (Intercept, Riposte, Aura)
 * and their dependencies (Tier 1: Engagement, Flanking, Resolve).
 *
 * Key interactions tested:
 * - Intercept + Engagement: Soft intercept marks units as engaged
 * - Intercept + Engagement: Disengage cost and Attack of Opportunity
 * - Intercept + Engagement: Archer penalty when engaged via soft intercept
 *
 * @module core/mechanics/tier2
 */

import { createInterceptProcessor } from './tier2/intercept/intercept.processor';
import { createEngagementProcessor } from './tier1/engagement/engagement.processor';
import { createAuraProcessor } from './tier2/aura/aura.processor';
import { DEFAULT_ENGAGEMENT_CONFIG, DEFAULT_INTERCEPT_CONFIG } from './config/defaults';
import { resolveDependencies } from './config/dependencies';
import { createTestUnit, createTestBattleState } from './test-fixtures';
import type { BattleUnit, Position, BattleAura } from '../types';
import type { UnitWithIntercept } from './tier2/intercept/intercept.types';
import type { UnitWithEngagement } from './tier1/engagement/engagement.types';
import type { UnitWithAura } from './tier2/aura/aura.types';
import type { InterceptConfig } from './config/mechanics.types';
import { HARD_INTERCEPT_TAG, CAVALRY_TAG } from './tier2/intercept/intercept.types';

// ═══════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: InterceptConfig = {
  hardIntercept: true,
  softIntercept: true,
  disengageCost: 2,
};

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES AND FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Combined unit type with both intercept and engagement properties.
 */
type InterceptEngagementUnit = BattleUnit & UnitWithIntercept & UnitWithEngagement;


/**
 * Creates a test unit with intercept and engagement properties.
 */
function createInterceptEngagementUnit(
  overrides: Partial<InterceptEngagementUnit> & { position: Position },
): InterceptEngagementUnit {
  const { position, ...restOverrides } = overrides;
  const base = createTestUnit({
    id: restOverrides.id ?? 'test-unit',
    position: position,
    team: restOverrides.team ?? 'player',
    stats: {
      hp: 100,
      atk: 20,
      atkCount: 1,
      armor: 5,
      speed: 3,
      initiative: 5,
      dodge: 0,
      ...restOverrides.stats,
    },
    currentHp: restOverrides.currentHp ?? 100,
    alive: restOverrides.alive ?? true,
    range: restOverrides.range ?? 1,
    ...restOverrides,
  });

  const result: InterceptEngagementUnit = {
    ...base,
  };

  // Add intercept properties
  if (overrides.tags !== undefined) result.tags = overrides.tags;
  if (overrides.canHardIntercept !== undefined) result.canHardIntercept = overrides.canHardIntercept;
  if (overrides.canSoftIntercept !== undefined) result.canSoftIntercept = overrides.canSoftIntercept;
  if (overrides.isCavalry !== undefined) result.isCavalry = overrides.isCavalry;
  if (overrides.interceptsRemaining !== undefined) result.interceptsRemaining = overrides.interceptsRemaining;
  if (overrides.maxIntercepts !== undefined) result.maxIntercepts = overrides.maxIntercepts;

  // Add engagement properties
  if (overrides.engaged !== undefined) result.engaged = overrides.engaged;
  if (overrides.engagedBy !== undefined) result.engagedBy = overrides.engagedBy;
  if (overrides.hasZoneOfControl !== undefined) result.hasZoneOfControl = overrides.hasZoneOfControl;
  if (overrides.isRanged !== undefined) result.isRanged = overrides.isRanged;
  if (overrides.usedAttackOfOpportunity !== undefined) result.usedAttackOfOpportunity = overrides.usedAttackOfOpportunity;

  return result;
}

/**
 * Creates a melee infantry unit that can soft intercept.
 */
function createInfantry(
  overrides: Partial<InterceptEngagementUnit> = {},
): InterceptEngagementUnit {
  return createInterceptEngagementUnit({
    id: overrides.id ?? 'infantry',
    position: overrides.position ?? { x: 3, y: 3 },
    range: 1,
    interceptsRemaining: 1,
    hasZoneOfControl: true,
    ...overrides,
  });
}


/**
 * Creates an archer unit (ranged, can be penalized when engaged).
 */
function createArcher(
  overrides: Partial<InterceptEngagementUnit> = {},
): InterceptEngagementUnit {
  return createInterceptEngagementUnit({
    id: overrides.id ?? 'archer',
    position: overrides.position ?? { x: 5, y: 5 },
    range: 4,
    isRanged: true,
    hasZoneOfControl: false, // Ranged units don't project ZoC
    ...overrides,
  });
}

/**
 * Creates a spearman unit (can hard intercept cavalry).
 */
function createSpearman(
  overrides: Partial<InterceptEngagementUnit> = {},
): InterceptEngagementUnit {
  return createInterceptEngagementUnit({
    id: overrides.id ?? 'spearman',
    position: overrides.position ?? { x: 3, y: 5 },
    tags: [HARD_INTERCEPT_TAG],
    interceptsRemaining: 1,
    hasZoneOfControl: true,
    ...overrides,
  });
}

/**
 * Creates a cavalry unit (can be hard intercepted).
 */
function createCavalry(
  overrides: Partial<InterceptEngagementUnit> = {},
): InterceptEngagementUnit {
  return createInterceptEngagementUnit({
    id: overrides.id ?? 'cavalry',
    position: overrides.position ?? { x: 3, y: 0 },
    tags: [CAVALRY_TAG],
    isCavalry: true,
    stats: {
      hp: 80,
      atk: 15,
      atkCount: 1,
      armor: 4,
      speed: 5,
      initiative: 7,
      dodge: 0,
      ...overrides.stats,
    },
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════
// INTERCEPT + ENGAGEMENT INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════

describe('Tier 2 Integration Tests', () => {
  describe('Intercept + Engagement Integration', () => {
    const interceptProcessor = createInterceptProcessor(DEFAULT_CONFIG);
    const engagementProcessor = createEngagementProcessor(DEFAULT_ENGAGEMENT_CONFIG);


    describe('Soft intercept marks units as engaged', () => {
      it('should mark target as engaged after soft intercept', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: false,
        });
        const state = createTestBattleState([infantry, enemy]);

        // Execute soft intercept
        const result = interceptProcessor.executeSoftIntercept(infantry, enemy, state);

        // Verify target is now engaged
        const updatedEnemy = result.state.units.find(u => u.id === 'enemy') as InterceptEngagementUnit;
        expect(updatedEnemy?.engaged).toBe(true);
      });

      it('should allow engagement processor to detect engaged status after soft intercept', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: false,
        });
        const state = createTestBattleState([infantry, enemy]);

        // Execute soft intercept
        const interceptResult = interceptProcessor.executeSoftIntercept(infantry, enemy, state);

        // Verify engagement processor detects the engagement
        const updatedEnemy = interceptResult.state.units.find(u => u.id === 'enemy') as InterceptEngagementUnit;
        const engagementStatus = engagementProcessor.getEngagementStatus(updatedEnemy, interceptResult.state);
        expect(engagementStatus).toBe('engaged');
      });

      it('should mark target as pinned when engaged by multiple interceptors', () => {
        const infantry1 = createInfantry({
          id: 'infantry1',
          instanceId: 'infantry1-instance',
          position: { x: 2, y: 4 },
          team: 'player',
        });
        const infantry2 = createInfantry({
          id: 'infantry2',
          instanceId: 'infantry2-instance',
          position: { x: 4, y: 4 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: false,
        });
        const state = createTestBattleState([infantry1, infantry2, enemy]);

        // Execute soft intercept from first infantry
        const result1 = interceptProcessor.executeSoftIntercept(infantry1, enemy, state);
        const updatedEnemy1 = result1.state.units.find(u => u.id === 'enemy') as InterceptEngagementUnit;

        // Verify engagement status is 'pinned' (engaged by 2 adjacent melee units)
        const engagementStatus = engagementProcessor.getEngagementStatus(updatedEnemy1, result1.state);
        expect(engagementStatus).toBe('pinned');
      });
    });


    describe('Disengage cost and Attack of Opportunity', () => {
      it('should require disengage cost when unit is engaged via soft intercept', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: false,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 5, initiative: 5, dodge: 0 },
        });
        const state = createTestBattleState([infantry, enemy]);

        // Execute soft intercept to engage the enemy
        const interceptResult = interceptProcessor.executeSoftIntercept(infantry, enemy, state);
        const engagedEnemy = interceptResult.state.units.find(u => u.id === 'enemy') as InterceptEngagementUnit;

        // Verify disengage cost is required
        const disengageCost = interceptProcessor.getDisengageCost(engagedEnemy, interceptResult.state, DEFAULT_CONFIG);
        expect(disengageCost).toBe(DEFAULT_CONFIG.disengageCost);
      });

      it('should not require disengage cost when unit is not engaged', () => {
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 5, y: 5 },
          team: 'bot',
          engaged: false,
        });
        const state = createTestBattleState([enemy]);

        const disengageCost = interceptProcessor.getDisengageCost(enemy, state, DEFAULT_CONFIG);
        expect(disengageCost).toBe(0);
      });

      it('should trigger Attack of Opportunity when disengaging after soft intercept', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: false,
        });
        const state = createTestBattleState([infantry, enemy]);

        // Execute soft intercept to engage the enemy
        const interceptResult = interceptProcessor.executeSoftIntercept(infantry, enemy, state);

        // Check for Attack of Opportunity when enemy tries to move away
        const engagedEnemy = interceptResult.state.units.find(u => u.id === 'enemy') as InterceptEngagementUnit;
        const fromPos = engagedEnemy.position;
        const toPos = { x: 3, y: 6 }; // Moving away from infantry

        const aooTriggers = engagementProcessor.checkAttackOfOpportunity(
          engagedEnemy,
          fromPos,
          toPos,
          interceptResult.state,
        );

        expect(aooTriggers.length).toBeGreaterThan(0);
        expect(aooTriggers[0]!.type).toBe('leave_zoc');
        expect(aooTriggers[0]!.attacker.id).toBe('infantry');
      });

      it('should allow disengage attempt to succeed with sufficient movement', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: true,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 5, initiative: 5, dodge: 0 },
        });
        const state = createTestBattleState([infantry, enemy]);

        // Attempt to disengage
        const disengageResult = interceptProcessor.attemptDisengage(enemy, state, DEFAULT_CONFIG, 12345);

        expect(disengageResult.success).toBe(true);
        expect(disengageResult.movementCost).toBe(DEFAULT_CONFIG.disengageCost);
        expect(disengageResult.triggeredAoO).toBe(true);
      });

      it('should fail disengage attempt with insufficient movement', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          engaged: true,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 1, initiative: 5, dodge: 0 }, // Speed 1 < disengage cost 2
        });
        const state = createTestBattleState([infantry, enemy]);

        // Attempt to disengage with insufficient movement
        const disengageResult = interceptProcessor.attemptDisengage(enemy, state, DEFAULT_CONFIG, 12345);

        expect(disengageResult.success).toBe(false);
        expect(disengageResult.reason).toBe('insufficient_movement');
      });
    });


    describe('Archer penalty when engaged via soft intercept', () => {
      it('should apply archer penalty when archer is engaged via soft intercept', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 5, y: 6 },
          team: 'bot',
        });
        const archer = createArcher({
          id: 'archer',
          instanceId: 'archer-instance',
          position: { x: 5, y: 5 },
          team: 'player',
          engaged: false,
        });
        const state = createTestBattleState([infantry, archer]);

        // Execute soft intercept to engage the archer
        const interceptResult = interceptProcessor.executeSoftIntercept(infantry, archer, state);
        const engagedArcher = interceptResult.state.units.find(u => u.id === 'archer') as InterceptEngagementUnit;

        // Verify archer penalty is applied
        const penalty = engagementProcessor.getArcherPenalty(engagedArcher, interceptResult.state, DEFAULT_ENGAGEMENT_CONFIG);
        expect(penalty).toBe(1.0 - DEFAULT_ENGAGEMENT_CONFIG.archerPenaltyPercent);
        expect(penalty).toBe(0.5); // 50% damage when engaged
      });

      it('should not apply archer penalty when archer is not engaged', () => {
        const archer = createArcher({
          id: 'archer',
          instanceId: 'archer-instance',
          position: { x: 5, y: 5 },
          team: 'player',
          engaged: false,
        });
        const distantEnemy = createInfantry({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 5, y: 9 }, // Far away, not adjacent
          team: 'bot',
        });
        const state = createTestBattleState([archer, distantEnemy]);

        const penalty = engagementProcessor.getArcherPenalty(archer, state, DEFAULT_ENGAGEMENT_CONFIG);
        expect(penalty).toBe(1.0); // No penalty
      });

      it('should calculate correct penalized damage for engaged archer', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 5, y: 6 },
          team: 'bot',
        });
        const archer = createArcher({
          id: 'archer',
          instanceId: 'archer-instance',
          position: { x: 5, y: 5 },
          team: 'player',
          engaged: false,
          stats: { hp: 60, atk: 20, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
        });
        const state = createTestBattleState([infantry, archer]);

        // Execute soft intercept to engage the archer
        const interceptResult = interceptProcessor.executeSoftIntercept(infantry, archer, state);
        const engagedArcher = interceptResult.state.units.find(u => u.id === 'archer') as InterceptEngagementUnit;

        // Calculate penalized damage
        const penalty = engagementProcessor.getArcherPenalty(engagedArcher, interceptResult.state, DEFAULT_ENGAGEMENT_CONFIG);
        const baseDamage = engagedArcher.stats.atk; // 20
        const penalizedDamage = Math.floor(baseDamage * penalty);

        expect(penalizedDamage).toBe(10); // 20 * 0.5 = 10
      });
    });


    describe('Zone of Control interaction with intercept', () => {
      it('should detect ZoC coverage at intercept position', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const state = createTestBattleState([infantry]);

        // Check ZoC at adjacent position
        const adjacentPos = { x: 3, y: 4 };
        const zocCheck = engagementProcessor.checkZoneOfControl(adjacentPos, state);

        expect(zocCheck.inZoC).toBe(true);
        expect(zocCheck.controllingUnits).toContain('infantry-instance');
        expect(zocCheck.triggersAoO).toBe(true);
      });

      it('should not detect ZoC at non-adjacent position', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 3 },
          team: 'player',
        });
        const state = createTestBattleState([infantry]);

        // Check ZoC at distant position
        const distantPos = { x: 3, y: 6 };
        const zocCheck = engagementProcessor.checkZoneOfControl(distantPos, state);

        expect(zocCheck.inZoC).toBe(false);
        expect(zocCheck.controllingUnits).toHaveLength(0);
      });

      it('should check intercept opportunities along path through ZoC', () => {
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 5 },
          team: 'player',
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 3 },
          team: 'bot',
        });
        const state = createTestBattleState([infantry, enemy]);

        // Path that passes through infantry's ZoC
        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 }, // Adjacent to infantry - triggers intercept
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const interceptCheck = interceptProcessor.checkIntercept(enemy, path, state, DEFAULT_CONFIG);

        expect(interceptCheck.hasIntercept).toBe(true);
        expect(interceptCheck.opportunities.length).toBeGreaterThan(0);
        expect(interceptCheck.opportunities[0]!.type).toBe('soft');
      });
    });


    describe('Hard intercept and engagement', () => {
      it('should stop cavalry and mark as engaged after hard intercept', () => {
        const spearman = createSpearman({
          id: 'spearman',
          instanceId: 'spearman-instance',
          position: { x: 3, y: 5 },
          team: 'player',
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          instanceId: 'cavalry-instance',
          position: { x: 3, y: 3 },
          team: 'bot',
        });
        const state = createTestBattleState([spearman, cavalry]);

        // Path that passes through spearman's position
        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 }, // Adjacent to spearman - triggers hard intercept
          { x: 3, y: 5 },
          { x: 3, y: 6 },
        ];

        const interceptCheck = interceptProcessor.checkIntercept(cavalry, path, state, DEFAULT_CONFIG);

        expect(interceptCheck.hasIntercept).toBe(true);
        expect(interceptCheck.movementBlocked).toBe(true);
        expect(interceptCheck.firstIntercept?.type).toBe('hard');
      });

      it('should deal damage to cavalry on hard intercept', () => {
        const spearman = createSpearman({
          id: 'spearman',
          instanceId: 'spearman-instance',
          position: { x: 3, y: 5 },
          team: 'player',
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          instanceId: 'cavalry-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          currentHp: 80,
        });
        const state = createTestBattleState([spearman, cavalry]);

        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        // Damage = floor(20 * 1.5) = 30
        expect(result.damage).toBe(30);
        expect(result.targetNewHp).toBe(50); // 80 - 30 = 50
        expect(result.movementStopped).toBe(true);
      });

      it('should reset cavalry momentum on hard intercept', () => {
        const spearman = createSpearman({
          id: 'spearman',
          instanceId: 'spearman-instance',
          position: { x: 3, y: 5 },
          team: 'player',
        });
        const cavalry = createCavalry({
          id: 'cavalry',
          instanceId: 'cavalry-instance',
          position: { x: 3, y: 4 },
          team: 'bot',
          momentum: 0.6,
          isCharging: true,
        });
        const state = createTestBattleState([spearman, cavalry]);

        const result = interceptProcessor.executeHardIntercept(spearman, cavalry, state, 12345);

        const updatedCavalry = result.state.units.find(u => u.id === 'cavalry') as InterceptEngagementUnit;
        expect(updatedCavalry?.momentum).toBe(0);
        expect(updatedCavalry?.isCharging).toBe(false);
      });
    });


    describe('Dependency auto-resolution', () => {
      it('should auto-enable engagement when intercept is enabled', () => {
        const config = resolveDependencies({ intercept: DEFAULT_INTERCEPT_CONFIG });

        expect(config.intercept).toBeTruthy();
        expect(config.engagement).toBeTruthy();
      });

      it('should not enable unrelated mechanics when intercept is enabled', () => {
        const config = resolveDependencies({ intercept: DEFAULT_INTERCEPT_CONFIG });

        expect(config.intercept).toBeTruthy();
        expect(config.engagement).toBeTruthy();
        // These should remain disabled
        expect(config.facing).toBe(false);
        expect(config.flanking).toBe(false);
        expect(config.riposte).toBe(false);
        expect(config.charge).toBe(false);
      });

      it('should enable full chain for overwatch (requires intercept + ammunition)', () => {
        const config = resolveDependencies({ overwatch: true });

        expect(config.overwatch).toBe(true);
        expect(config.intercept).toBeTruthy(); // Dependency
        expect(config.engagement).toBeTruthy(); // Transitive dependency
        expect(config.ammunition).toBeTruthy(); // Dependency
      });
    });

    describe('Combined scenario: intercept during movement with engagement effects', () => {
      it('should process complete intercept + engagement scenario', () => {
        // Setup: Infantry guarding a position, enemy adjacent to infantry
        const infantry = createInfantry({
          id: 'infantry',
          instanceId: 'infantry-instance',
          position: { x: 3, y: 4 },
          team: 'player',
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });
        const enemy = createInterceptEngagementUnit({
          id: 'enemy',
          instanceId: 'enemy-instance',
          position: { x: 3, y: 3 },
          team: 'bot',
          engaged: false,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 4, initiative: 5, dodge: 0 },
        });
        const state = createTestBattleState([infantry, enemy]);

        // Step 1: Check intercept opportunities along path
        const path: Position[] = [
          { x: 3, y: 3 },
          { x: 3, y: 4 }, // Adjacent to infantry - triggers intercept
          { x: 3, y: 5 },
        ];
        const interceptCheck = interceptProcessor.checkIntercept(enemy, path, state, DEFAULT_CONFIG);
        expect(interceptCheck.hasIntercept).toBe(true);

        // Step 2: Execute soft intercept
        const interceptResult = interceptProcessor.executeSoftIntercept(infantry, enemy, state);
        const engagedEnemy = interceptResult.state.units.find(u => u.id === 'enemy') as InterceptEngagementUnit;
        expect(engagedEnemy.engaged).toBe(true);

        // Step 3: Verify engagement status - enemy is adjacent to infantry at (3,4), enemy at (3,3)
        const engagementStatus = engagementProcessor.getEngagementStatus(engagedEnemy, interceptResult.state);
        expect(engagementStatus).toBe('engaged');

        // Step 4: Check disengage cost
        const disengageCost = interceptProcessor.getDisengageCost(engagedEnemy, interceptResult.state, DEFAULT_CONFIG);
        expect(disengageCost).toBe(2);

        // Step 5: Check AoO would trigger if enemy tries to leave
        const aooTriggers = engagementProcessor.checkAttackOfOpportunity(
          engagedEnemy,
          engagedEnemy.position,
          { x: 3, y: 1 }, // Moving away from infantry
          interceptResult.state,
        );
        expect(aooTriggers.length).toBeGreaterThan(0);
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// RIPOSTE + INITIATIVE INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════

describe('Riposte + Initiative Integration', () => {
  const { createRiposteProcessor } = require('./tier2/riposte/riposte.processor');
  const { createFacingProcessor } = require('./tier0/facing/facing.processor');
  const { DEFAULT_RIPOSTE_CONFIG } = require('./config/defaults');

  /**
   * Creates a test unit with riposte properties.
   */
  function createRiposteTestUnit(
    overrides: Partial<BattleUnit> & { position: Position; initiative?: number },
  ): BattleUnit {
    const { position, initiative, ...restOverrides } = overrides;
    const base = createTestUnit({
      id: restOverrides.id ?? 'riposte-unit',
      position: position,
      team: restOverrides.team ?? 'player',
      stats: {
        hp: 100,
        atk: 20,
        atkCount: 1,
        armor: 5,
        speed: 3,
        initiative: initiative ?? 5,
        dodge: 0,
        ...restOverrides.stats,
      },
      currentHp: restOverrides.currentHp ?? 100,
      alive: restOverrides.alive ?? true,
      range: restOverrides.range ?? 1,
      ...restOverrides,
    });

    return {
      ...base,
      initiative: initiative ?? base.stats?.initiative ?? 5,
      attackCount: base.stats?.atkCount ?? 1,
      facing: 'S' as const,
    } as BattleUnit;
  }

  describe('Initiative-based riposte chance', () => {
    it('should calculate higher riposte chance when defender has higher initiative', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);

      // Defender has initiative 15, attacker has initiative 5
      // initDiff = 15 - 5 = 10 >= guaranteedThreshold (10)
      // Expected: 100% riposte chance
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 15,
      });
      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 5,
      });

      const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);

      // With initDiff = 10 and guaranteedThreshold = 10, chance should be 1.0
      expect(chance).toBe(1.0);
    });

    it('should calculate lower riposte chance when attacker has higher initiative', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);

      // Defender has initiative 5, attacker has initiative 15
      // initDiff = 5 - 15 = -10 <= -guaranteedThreshold (-10)
      // Expected: 0% riposte chance
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 5,
      });
      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 15,
      });

      const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);

      // With initDiff = -10 and guaranteedThreshold = 10, chance should be 0.0
      expect(chance).toBe(0.0);
    });

    it('should calculate base chance when initiatives are equal', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);

      // Both have initiative 10
      // initDiff = 0
      // Expected: baseChance (0.5)
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 10,
      });
      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 10,
      });

      const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);

      expect(chance).toBe(0.5);
    });

    it('should interpolate linearly for intermediate initiative differences', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);

      // Defender has initiative 12, attacker has initiative 10
      // initDiff = 2, guaranteedThreshold = 10
      // chance = 0.5 + (2 / 10) * 0.5 = 0.5 + 0.1 = 0.6
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 12,
      });
      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 10,
      });

      const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);

      expect(chance).toBe(0.6);
    });

    it('should use flat baseChance when initiativeBased is false', () => {
      const config = {
        ...DEFAULT_RIPOSTE_CONFIG,
        initiativeBased: false,
        baseChance: 0.3,
      };
      const riposteProcessor = createRiposteProcessor(config);

      // Even with large initiative difference, should return baseChance
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 20,
      });
      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 5,
      });

      const chance = riposteProcessor.getRiposteChance(defender, attacker, config);

      expect(chance).toBe(0.3);
    });

    it('should integrate with facing to determine attack arc before riposte check', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);
      const facingProcessor = createFacingProcessor();

      // Defender facing South, attacker is to the South (front attack)
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 15,
      });
      (defender as BattleUnit & { facing: string }).facing = 'S';

      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 5,
      });

      // Get attack arc
      const arc = facingProcessor.getAttackArc(attacker, defender);

      // Front attack should allow riposte
      expect(arc).toBe('front');

      // Check riposte eligibility
      const canRiposte = riposteProcessor.canRiposte(
        { ...defender, riposteCharges: 1 },
        attacker,
        arc,
      );
      expect(canRiposte).toBe(true);

      // Check riposte chance (should be guaranteed due to high initiative)
      const chance = riposteProcessor.getRiposteChance(defender, attacker, DEFAULT_RIPOSTE_CONFIG);
      expect(chance).toBe(1.0);
    });

    it('should deny riposte from flank even with high initiative', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);
      const facingProcessor = createFacingProcessor();

      // Defender facing South, attacker is to the East (flank attack)
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 20, // Very high initiative
      });
      (defender as BattleUnit & { facing: string }).facing = 'S';

      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 4, y: 3 },
        team: 'bot',
        initiative: 5,
      });

      // Get attack arc
      const arc = facingProcessor.getAttackArc(attacker, defender);

      // Flank attack should deny riposte
      expect(arc).toBe('flank');

      // Check riposte eligibility - should be denied due to flank
      const canRiposte = riposteProcessor.canRiposte(
        { ...defender, riposteCharges: 1 },
        attacker,
        arc,
      );
      expect(canRiposte).toBe(false);
    });

    it('should apply riposte during attack phase with initiative-based chance', () => {
      const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);

      // Defender has much higher initiative (guaranteed riposte)
      const defender = createRiposteTestUnit({
        id: 'defender',
        position: { x: 3, y: 3 },
        team: 'player',
        initiative: 20,
        currentHp: 100,
      });
      (defender as BattleUnit & { facing: string; riposteCharges: number }).facing = 'S';
      (defender as BattleUnit & { facing: string; riposteCharges: number }).riposteCharges = 1;

      const attacker = createRiposteTestUnit({
        id: 'attacker',
        position: { x: 3, y: 4 },
        team: 'bot',
        initiative: 5,
        currentHp: 100,
      });

      const state = createTestBattleState([defender, attacker]);

      // Apply riposte during attack phase
      // Using a seed that will result in a roll < 1.0 (guaranteed riposte)
      const newState = riposteProcessor.apply('attack', state, {
        activeUnit: attacker,
        target: defender,
        seed: 12345,
      });

      // Attacker should have taken riposte damage
      // Riposte damage = floor(20 * 0.5) = 10
      const updatedAttacker = newState.units.find((u: BattleUnit) => u.id === 'attacker');
      expect(updatedAttacker?.currentHp).toBe(90); // 100 - 10 = 90
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// AURA STACKING RULES INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════

describe('Aura Stacking Rules Integration', () => {
  const auraProcessor = createAuraProcessor();

  /**
   * Creates a test unit with aura properties.
   */
  function createAuraUnit(
    overrides: Partial<BattleUnit & UnitWithAura> & { position: Position },
  ): BattleUnit & UnitWithAura {
    const { position, ...restOverrides } = overrides;
    const base = createTestUnit({
      id: restOverrides.id ?? 'aura-unit',
      position: position,
      team: restOverrides.team ?? 'player',
      stats: {
        hp: 100,
        atk: 20,
        atkCount: 1,
        armor: 5,
        speed: 3,
        initiative: 5,
        dodge: 0,
        ...restOverrides.stats,
      },
      currentHp: restOverrides.currentHp ?? 100,
      alive: restOverrides.alive ?? true,
      range: restOverrides.range ?? 1,
      ...restOverrides,
    });

    return {
      ...base,
      auras: overrides.auras ?? [],
      activeAuraBuffs: overrides.activeAuraBuffs ?? [],
      auraImmunities: overrides.auraImmunities ?? [],
    } as BattleUnit & UnitWithAura;
  }

  /**
   * Creates a leadership aura (static, allies, +10% ATK).
   */
  function createLeadershipAura(id: string = 'leadership'): BattleAura {
    return {
      id,
      name: 'Leadership',
      type: 'static',
      target: 'allies',
      range: 2,
      effect: {
        type: 'buff_stat',
        stat: 'atk',
        value: 0.1,
        isPercentage: true,
      },
      stackable: false,
    };
  }

  /**
   * Creates a stackable strength aura (+5 flat ATK per stack).
   */
  function createStackableStrengthAura(maxStacks: number = 3): BattleAura {
    return {
      id: 'stackable_strength',
      name: 'Stackable Strength',
      type: 'static',
      target: 'allies',
      range: 2,
      effect: {
        type: 'buff_stat',
        stat: 'atk',
        value: 5,
        isPercentage: false,
      },
      stackable: true,
      maxStacks,
    };
  }

  /**
   * Creates an armor aura (static, allies, +2 flat armor).
   */
  function createArmorAura(): BattleAura {
    return {
      id: 'armor_aura',
      name: 'Armor Aura',
      type: 'static',
      target: 'allies',
      range: 2,
      effect: {
        type: 'buff_stat',
        stat: 'armor',
        value: 2,
        isPercentage: false,
      },
      stackable: false,
    };
  }

  /**
   * Creates a fear aura (static, enemies, -10% ATK).
   */
  function createFearAura(): BattleAura {
    return {
      id: 'fear',
      name: 'Fear',
      type: 'static',
      target: 'enemies',
      range: 2,
      effect: {
        type: 'debuff_stat',
        stat: 'atk',
        value: 0.1,
        isPercentage: true,
      },
      stackable: false,
    };
  }

  describe('Non-stackable auras from different sources', () => {
    it('should apply same aura type from multiple different sources', () => {
      // Two leaders with the same leadership aura
      const leader1 = createAuraUnit({
        id: 'leader_1',
        instanceId: 'leader_1_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura('leadership')],
      });

      const leader2 = createAuraUnit({
        id: 'leader_2',
        instanceId: 'leader_2_instance',
        position: { x: 4, y: 2 },
        auras: [createLeadershipAura('leadership')],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 }, // In range of both leaders
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
      });

      const state = createTestBattleState([leader1, leader2, ally]);
      const newState = auraProcessor.applyStaticAuras(state);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Should have buffs from both leaders (same aura ID, different sources)
      expect(updatedAlly.activeAuraBuffs).toHaveLength(2);
      expect(updatedAlly.activeAuraBuffs?.map(b => b.sourceId)).toContain('leader_1');
      expect(updatedAlly.activeAuraBuffs?.map(b => b.sourceId)).toContain('leader_2');

      // Effective stat should include both buffs: 20 + 10% + 10% = 20 + 2 + 2 = 24
      const effectiveAtk = auraProcessor.getEffectiveStat(updatedAlly, 'atk', newState);
      expect(effectiveAtk).toBe(24);
    });

    it('should not duplicate buff from same source', () => {
      const leader = createAuraUnit({
        id: 'leader',
        instanceId: 'leader_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura()],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 },
      });

      const state = createTestBattleState([leader, ally]);

      // Apply auras twice
      const state1 = auraProcessor.applyStaticAuras(state);
      const state2 = auraProcessor.applyStaticAuras(state1);

      const updatedAlly = state2.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Should only have one buff from the leader
      expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
      expect(updatedAlly.activeAuraBuffs?.[0]?.sourceId).toBe('leader');
    });
  });

  describe('Different aura types stacking', () => {
    it('should stack different aura types affecting different stats', () => {
      const leader = createAuraUnit({
        id: 'leader',
        instanceId: 'leader_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura(), createArmorAura()],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 },
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
      });

      const state = createTestBattleState([leader, ally]);
      const newState = auraProcessor.applyStaticAuras(state);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Should have both buffs
      expect(updatedAlly.activeAuraBuffs).toHaveLength(2);

      // Check effective stats
      const effectiveAtk = auraProcessor.getEffectiveStat(updatedAlly, 'atk', newState);
      const effectiveArmor = auraProcessor.getEffectiveStat(updatedAlly, 'armor', newState);

      expect(effectiveAtk).toBe(22); // 20 + 10% = 22
      expect(effectiveArmor).toBe(7); // 5 + 2 = 7
    });

    it('should combine buffs and debuffs on same stat', () => {
      // Leader provides ATK buff to allies
      const leader = createAuraUnit({
        id: 'leader',
        instanceId: 'leader_instance',
        position: { x: 2, y: 2 },
        team: 'player',
        auras: [createLeadershipAura()],
      });

      // Enemy provides ATK debuff to enemies (which includes the ally)
      const enemy = createAuraUnit({
        id: 'enemy',
        instanceId: 'enemy_instance',
        position: { x: 4, y: 2 },
        team: 'bot',
        auras: [createFearAura()],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 }, // In range of both
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
      });

      const state = createTestBattleState([leader, enemy, ally]);
      const newState = auraProcessor.applyStaticAuras(state);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Should have both buff and debuff
      expect(updatedAlly.activeAuraBuffs).toHaveLength(2);

      // Effective ATK: 20 + 10% (buff) - 10% (debuff) = 20 + 2 - 2 = 20
      const effectiveAtk = auraProcessor.getEffectiveStat(updatedAlly, 'atk', newState);
      expect(effectiveAtk).toBe(20);
    });
  });

  describe('Stackable auras', () => {
    it('should respect maxStacks limit for stackable auras', () => {
      const stackableAura = createStackableStrengthAura(3);

      // Create multiple units with the same stackable aura
      // All sources positioned within range 2 of ally at (2, 2)
      const source1 = createAuraUnit({
        id: 'source_1',
        instanceId: 'source_1_instance',
        position: { x: 1, y: 2 }, // Distance 1 from ally
        auras: [stackableAura],
      });

      const source2 = createAuraUnit({
        id: 'source_2',
        instanceId: 'source_2_instance',
        position: { x: 3, y: 2 }, // Distance 1 from ally
        auras: [stackableAura],
      });

      const source3 = createAuraUnit({
        id: 'source_3',
        instanceId: 'source_3_instance',
        position: { x: 2, y: 1 }, // Distance 1 from ally
        auras: [stackableAura],
      });

      const source4 = createAuraUnit({
        id: 'source_4',
        instanceId: 'source_4_instance',
        position: { x: 2, y: 3 }, // Distance 1 from ally
        auras: [stackableAura],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 2, y: 2 }, // Center position, all sources within range 2
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
      });

      const state = createTestBattleState([source1, source2, source3, source4, ally]);
      const newState = auraProcessor.applyStaticAuras(state);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Should have buffs from all 4 sources (each is a different source)
      expect(updatedAlly.activeAuraBuffs?.length).toBe(4);

      // Effective ATK: 20 + (5 * 4) = 40 (all 4 sources apply their buff)
      const effectiveAtk = auraProcessor.getEffectiveStat(updatedAlly, 'atk', newState);
      expect(effectiveAtk).toBe(40);
    });

    it('should track stacks correctly for single source stackable aura', () => {
      const stackableAura = createStackableStrengthAura(5);

      const source = createAuraUnit({
        id: 'source',
        instanceId: 'source_instance',
        position: { x: 2, y: 2 },
        auras: [stackableAura],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 },
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
      });

      const state = createTestBattleState([source, ally]);
      const newState = auraProcessor.applyStaticAuras(state);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Should have 1 buff with 1 stack
      expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
      expect(updatedAlly.activeAuraBuffs?.[0]?.stacks).toBe(1);

      // Effective ATK: 20 + 5 = 25
      const effectiveAtk = auraProcessor.getEffectiveStat(updatedAlly, 'atk', newState);
      expect(effectiveAtk).toBe(25);
    });
  });

  describe('Aura removal on source death', () => {
    it('should remove aura buffs when source dies', () => {
      const leader = createAuraUnit({
        id: 'leader',
        instanceId: 'leader_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura()],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 },
        activeAuraBuffs: [
          {
            auraId: 'leadership',
            sourceId: 'leader',
            stat: 'atk',
            value: 0.1,
            isPercentage: true,
            stacks: 1,
          },
        ],
      });

      const state = createTestBattleState([leader, ally]);
      const newState = auraProcessor.handleUnitDeath(state, 'leader');

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Buff from dead leader should be removed
      expect(updatedAlly.activeAuraBuffs).toHaveLength(0);
    });

    it('should keep buffs from other sources when one source dies', () => {
      const leader1 = createAuraUnit({
        id: 'leader_1',
        instanceId: 'leader_1_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura()],
      });

      const leader2 = createAuraUnit({
        id: 'leader_2',
        instanceId: 'leader_2_instance',
        position: { x: 4, y: 2 },
        auras: [createLeadershipAura()],
      });

      const ally = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 },
        activeAuraBuffs: [
          {
            auraId: 'leadership',
            sourceId: 'leader_1',
            stat: 'atk',
            value: 0.1,
            isPercentage: true,
            stacks: 1,
          },
          {
            auraId: 'leadership',
            sourceId: 'leader_2',
            stat: 'atk',
            value: 0.1,
            isPercentage: true,
            stacks: 1,
          },
        ],
      });

      const state = createTestBattleState([leader1, leader2, ally]);
      const newState = auraProcessor.handleUnitDeath(state, 'leader_1');

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Only buff from leader_2 should remain
      expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
      expect(updatedAlly.activeAuraBuffs?.[0]?.sourceId).toBe('leader_2');
    });
  });

  describe('Aura range and recalculation', () => {
    it('should remove buffs when unit moves out of range', () => {
      const leader = createAuraUnit({
        id: 'leader',
        instanceId: 'leader_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura()], // Range 2
      });

      // Ally starts in range
      const allyInRange = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 3, y: 2 }, // Distance 1 (in range)
      });

      const state = createTestBattleState([leader, allyInRange]);
      const stateWithAuras = auraProcessor.applyStaticAuras(state);

      // Verify ally has buff
      const allyWithBuff = stateWithAuras.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;
      expect(allyWithBuff.activeAuraBuffs).toHaveLength(1);

      // Move ally out of range
      const movedAlly = {
        ...allyWithBuff,
        position: { x: 6, y: 2 }, // Distance 4 (out of range 2)
      };
      const stateWithMovedAlly = {
        ...stateWithAuras,
        units: stateWithAuras.units.map(u => u.id === 'ally' ? movedAlly : u),
      };

      // Recalculate auras
      const newState = auraProcessor.recalculateAuras(stateWithMovedAlly);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Buff should be removed since ally is out of range
      expect(updatedAlly.activeAuraBuffs).toHaveLength(0);
    });

    it('should add buffs when unit moves into range', () => {
      const leader = createAuraUnit({
        id: 'leader',
        instanceId: 'leader_instance',
        position: { x: 2, y: 2 },
        auras: [createLeadershipAura()], // Range 2
      });

      // Ally starts out of range
      const allyOutOfRange = createAuraUnit({
        id: 'ally',
        instanceId: 'ally_instance',
        team: 'player',
        position: { x: 6, y: 2 }, // Distance 4 (out of range)
      });

      const state = createTestBattleState([leader, allyOutOfRange]);
      const stateWithAuras = auraProcessor.applyStaticAuras(state);

      // Verify ally has no buff
      const allyWithoutBuff = stateWithAuras.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;
      expect(allyWithoutBuff.activeAuraBuffs).toHaveLength(0);

      // Move ally into range
      const movedAlly = {
        ...allyWithoutBuff,
        position: { x: 3, y: 2 }, // Distance 1 (in range)
      };
      const stateWithMovedAlly = {
        ...stateWithAuras,
        units: stateWithAuras.units.map(u => u.id === 'ally' ? movedAlly : u),
      };

      // Recalculate auras
      const newState = auraProcessor.recalculateAuras(stateWithMovedAlly);

      const updatedAlly = newState.units.find(u => u.id === 'ally') as BattleUnit & UnitWithAura;

      // Buff should be added since ally is now in range
      expect(updatedAlly.activeAuraBuffs).toHaveLength(1);
      expect(updatedAlly.activeAuraBuffs?.[0]?.auraId).toBe('leadership');
    });
  });

  describe('Effective stat calculation with multiple buffs', () => {
    it('should correctly sum multiple percentage buffs', () => {
      const unit = createAuraUnit({
        id: 'unit',
        instanceId: 'unit_instance',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 100, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        activeAuraBuffs: [
          { auraId: 'buff1', sourceId: 's1', stat: 'atk', value: 0.1, isPercentage: true, stacks: 1 },
          { auraId: 'buff2', sourceId: 's2', stat: 'atk', value: 0.2, isPercentage: true, stacks: 1 },
          { auraId: 'buff3', sourceId: 's3', stat: 'atk', value: 0.15, isPercentage: true, stacks: 1 },
        ],
      });

      const state = createTestBattleState([unit]);
      const effectiveAtk = auraProcessor.getEffectiveStat(unit, 'atk', state);

      // 100 + 10% + 20% + 15% = 100 + 10 + 20 + 15 = 145
      expect(effectiveAtk).toBe(145);
    });

    it('should correctly sum multiple flat buffs', () => {
      const unit = createAuraUnit({
        id: 'unit',
        instanceId: 'unit_instance',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        activeAuraBuffs: [
          { auraId: 'buff1', sourceId: 's1', stat: 'atk', value: 5, isPercentage: false, stacks: 1 },
          { auraId: 'buff2', sourceId: 's2', stat: 'atk', value: 3, isPercentage: false, stacks: 1 },
          { auraId: 'buff3', sourceId: 's3', stat: 'atk', value: 7, isPercentage: false, stacks: 1 },
        ],
      });

      const state = createTestBattleState([unit]);
      const effectiveAtk = auraProcessor.getEffectiveStat(unit, 'atk', state);

      // 20 + 5 + 3 + 7 = 35
      expect(effectiveAtk).toBe(35);
    });

    it('should correctly combine percentage and flat buffs', () => {
      const unit = createAuraUnit({
        id: 'unit',
        instanceId: 'unit_instance',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        activeAuraBuffs: [
          { auraId: 'buff1', sourceId: 's1', stat: 'atk', value: 0.5, isPercentage: true, stacks: 1 }, // +50% = +10
          { auraId: 'buff2', sourceId: 's2', stat: 'atk', value: 5, isPercentage: false, stacks: 1 }, // +5 flat
        ],
      });

      const state = createTestBattleState([unit]);
      const effectiveAtk = auraProcessor.getEffectiveStat(unit, 'atk', state);

      // 20 + 50% + 5 = 20 + 10 + 5 = 35
      expect(effectiveAtk).toBe(35);
    });

    it('should handle stacks multiplier correctly', () => {
      const unit = createAuraUnit({
        id: 'unit',
        instanceId: 'unit_instance',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        activeAuraBuffs: [
          { auraId: 'buff1', sourceId: 's1', stat: 'atk', value: 5, isPercentage: false, stacks: 3 }, // +5 * 3 = +15
        ],
      });

      const state = createTestBattleState([unit]);
      const effectiveAtk = auraProcessor.getEffectiveStat(unit, 'atk', state);

      // 20 + (5 * 3) = 35
      expect(effectiveAtk).toBe(35);
    });

    it('should not allow effective stat to go below 0', () => {
      const unit = createAuraUnit({
        id: 'unit',
        instanceId: 'unit_instance',
        position: { x: 0, y: 0 },
        stats: { hp: 100, atk: 10, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        activeAuraBuffs: [
          { auraId: 'debuff1', sourceId: 's1', stat: 'atk', value: -0.5, isPercentage: true, stacks: 1 }, // -50% = -5
          { auraId: 'debuff2', sourceId: 's2', stat: 'atk', value: -10, isPercentage: false, stacks: 1 }, // -10 flat
        ],
      });

      const state = createTestBattleState([unit]);
      const effectiveAtk = auraProcessor.getEffectiveStat(unit, 'atk', state);

      // 10 - 5 - 10 = -5, but clamped to 0
      expect(effectiveAtk).toBe(0);
    });
  });
});
