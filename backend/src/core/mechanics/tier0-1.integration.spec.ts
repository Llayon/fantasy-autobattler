/**
 * Tier 0-1 Integration Tests
 *
 * Tests the integration between Tier 0 (Facing) and Tier 1 (Flanking, Resolve, Engagement)
 * mechanics. Verifies that these mechanics work correctly together.
 *
 * @module core/mechanics
 */

import { createFacingProcessor } from './tier0/facing/facing.processor';
import { createFlankingProcessor } from './tier1/flanking/flanking.processor';
import { createResolveProcessor } from './tier1/resolve/resolve.processor';
import { createEngagementProcessor } from './tier1/engagement/engagement.processor';
import { createRiposteProcessor } from './tier2/riposte/riposte.processor';
import { DEFAULT_RESOLVE_CONFIG, DEFAULT_ENGAGEMENT_CONFIG, DEFAULT_RIPOSTE_CONFIG } from './config/defaults';
import { resolveDependencies, getDefaultConfig } from './config/dependencies';
import type { FacingDirection, AttackArc } from './tier0/facing/facing.types';
import type { BattleUnit } from '../types';
import type { UnitWithRiposte } from './tier2/riposte/riposte.types';
import { createTestUnit, createTestBattleState } from './test-fixtures';

/**
 * Extended BattleUnit type with mechanics properties for testing.
 */
type MechanicsUnit = BattleUnit & {
  facing?: FacingDirection;
  resolve?: number;
  engaged?: boolean;
  faction?: string;
};

/**
 * Creates a test unit with mechanics properties.
 */
function createMechanicsUnit(
  overrides: Partial<MechanicsUnit> & { position: { x: number; y: number } },
): MechanicsUnit {
  const base = createTestUnit(overrides);
  const result: MechanicsUnit = { ...base };
  if (overrides.facing !== undefined) result.facing = overrides.facing;
  if (overrides.resolve !== undefined) result.resolve = overrides.resolve;
  if (overrides.engaged !== undefined) result.engaged = overrides.engaged;
  if (overrides.faction !== undefined) result.faction = overrides.faction;
  return result;
}

describe('Tier 0-1 Integration Tests', () => {
  describe('Facing + Flanking Integration', () => {
    const facingProcessor = createFacingProcessor();
    const flankingProcessor = createFlankingProcessor();

    describe('Attack arc determination with facing', () => {
      it('should correctly identify front attack when attacker faces target front', () => {
        const target = createMechanicsUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createMechanicsUnit({
          id: 'attacker',
          position: { x: 5, y: 3 },
        });

        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('front');

        const damageModifier = flankingProcessor.getDamageModifier(arc);
        expect(damageModifier).toBe(1.0);

        const disablesRiposte = flankingProcessor.disablesRiposte(arc);
        expect(disablesRiposte).toBe(false);
      });

      it('should correctly identify flank attack when attacker is to the side', () => {
        const target = createMechanicsUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createMechanicsUnit({
          id: 'attacker',
          position: { x: 7, y: 5 },
        });

        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('flank');

        const damageModifier = flankingProcessor.getDamageModifier(arc);
        expect(damageModifier).toBe(1.15);

        const disablesRiposte = flankingProcessor.disablesRiposte(arc);
        expect(disablesRiposte).toBe(true);
      });

      it('should correctly identify rear attack when attacker is behind', () => {
        const target = createMechanicsUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
        });
        const attacker = createMechanicsUnit({
          id: 'attacker',
          position: { x: 5, y: 7 },
        });

        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('rear');

        const damageModifier = flankingProcessor.getDamageModifier(arc);
        expect(damageModifier).toBe(1.3);

        const disablesRiposte = flankingProcessor.disablesRiposte(arc);
        expect(disablesRiposte).toBe(true);
      });
    });


    describe('Auto-facing before attack', () => {
      it('should auto-face attacker toward target and calculate correct arc', () => {
        const attacker = createMechanicsUnit({
          id: 'attacker',
          instanceId: 'attacker-instance',
          position: { x: 5, y: 5 },
          facing: 'S',
        });
        const target = createMechanicsUnit({
          id: 'target',
          instanceId: 'target-instance',
          position: { x: 5, y: 3 },
          facing: 'S',
        });

        const facedAttacker = facingProcessor.faceTarget(attacker, target.position);
        expect(facedAttacker.facing).toBe('N');

        const arc = facingProcessor.getAttackArc(facedAttacker, target);
        expect(arc).toBe('front');
      });

      it('should calculate flanking effects after auto-facing', () => {
        const attacker = createMechanicsUnit({
          id: 'attacker',
          position: { x: 7, y: 5 },
          facing: 'S',
        });
        const target = createMechanicsUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
        });

        const facedAttacker = facingProcessor.faceTarget(attacker, target.position);
        expect(facedAttacker.facing).toBe('W');

        const arc = facingProcessor.getAttackArc(facedAttacker, target);
        expect(arc).toBe('flank');

        const effects = flankingProcessor.calculateFlankingEffects(arc);
        expect(effects).toEqual({
          arc: 'flank',
          damageModifier: 1.15,
          resolveDamage: 12,
          disablesRiposte: true,
        });
      });
    });

    describe('Damage calculation with flanking modifiers', () => {
      it('should apply correct damage modifier for each attack arc', () => {
        const baseDamage = 100;
        const arcs: AttackArc[] = ['front', 'flank', 'rear'];
        const expectedDamage = [100, 114, 130];

        arcs.forEach((arc, index) => {
          const modifier = flankingProcessor.getDamageModifier(arc);
          const finalDamage = Math.floor(baseDamage * modifier);
          expect(finalDamage).toBe(expectedDamage[index]);
        });
      });

      it('should calculate damage correctly for various base damage values', () => {
        const testCases = [
          { baseDamage: 50, front: 50, flank: 57, rear: 65 },
          { baseDamage: 73, front: 73, flank: 83, rear: 94 },
          { baseDamage: 150, front: 150, flank: 172, rear: 195 },
        ];

        testCases.forEach(({ baseDamage, front, flank, rear }) => {
          expect(Math.floor(baseDamage * flankingProcessor.getDamageModifier('front'))).toBe(front);
          expect(Math.floor(baseDamage * flankingProcessor.getDamageModifier('flank'))).toBe(flank);
          expect(Math.floor(baseDamage * flankingProcessor.getDamageModifier('rear'))).toBe(rear);
        });
      });
    });

    describe('All facing directions with flanking', () => {
      const facingDirections: FacingDirection[] = ['N', 'S', 'E', 'W'];

      facingDirections.forEach((facing) => {
        it(`should correctly calculate arcs for target facing ${facing}`, () => {
          const target = createMechanicsUnit({
            id: 'target',
            position: { x: 5, y: 5 },
            facing,
          });

          type AttackPosition = { pos: { x: number; y: number }; expectedArc: AttackArc };
          const attackerPositions: Record<FacingDirection, AttackPosition[]> = {
            N: [
              { pos: { x: 5, y: 3 }, expectedArc: 'front' },
              { pos: { x: 5, y: 7 }, expectedArc: 'rear' },
              { pos: { x: 7, y: 5 }, expectedArc: 'flank' },
              { pos: { x: 3, y: 5 }, expectedArc: 'flank' },
            ],
            S: [
              { pos: { x: 5, y: 7 }, expectedArc: 'front' },
              { pos: { x: 5, y: 3 }, expectedArc: 'rear' },
              { pos: { x: 7, y: 5 }, expectedArc: 'flank' },
              { pos: { x: 3, y: 5 }, expectedArc: 'flank' },
            ],
            E: [
              { pos: { x: 7, y: 5 }, expectedArc: 'front' },
              { pos: { x: 3, y: 5 }, expectedArc: 'rear' },
              { pos: { x: 5, y: 3 }, expectedArc: 'flank' },
              { pos: { x: 5, y: 7 }, expectedArc: 'flank' },
            ],
            W: [
              { pos: { x: 3, y: 5 }, expectedArc: 'front' },
              { pos: { x: 7, y: 5 }, expectedArc: 'rear' },
              { pos: { x: 5, y: 3 }, expectedArc: 'flank' },
              { pos: { x: 5, y: 7 }, expectedArc: 'flank' },
            ],
          };

          const positions = attackerPositions[facing];
          positions.forEach(({ pos, expectedArc }) => {
            const attacker = createMechanicsUnit({
              id: 'attacker',
              position: pos,
            });
            const arc = facingProcessor.getAttackArc(attacker, target);
            expect(arc).toBe(expectedArc);
          });
        });
      });
    });
  });


  describe('Flanking + Resolve Integration', () => {
    const facingProcessor = createFacingProcessor();
    const flankingProcessor = createFlankingProcessor();
    const resolveProcessor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);

    it('should apply resolve damage based on attack arc', () => {
      const target = createMechanicsUnit({
        id: 'target',
        position: { x: 5, y: 5 },
        facing: 'N',
        resolve: 100,
        faction: 'human',
      });

      const frontAttacker = createMechanicsUnit({
        id: 'front-attacker',
        position: { x: 5, y: 3 },
      });
      const frontArc = facingProcessor.getAttackArc(frontAttacker, target);
      const frontResolveDamage = flankingProcessor.getResolveDamage(frontArc, DEFAULT_RESOLVE_CONFIG);
      expect(frontResolveDamage).toBe(0);

      const flankAttacker = createMechanicsUnit({
        id: 'flank-attacker',
        position: { x: 7, y: 5 },
      });
      const flankArc = facingProcessor.getAttackArc(flankAttacker, target);
      const flankResolveDamage = flankingProcessor.getResolveDamage(flankArc, DEFAULT_RESOLVE_CONFIG);
      expect(flankResolveDamage).toBe(DEFAULT_RESOLVE_CONFIG.flankingResolveDamage);

      const rearAttacker = createMechanicsUnit({
        id: 'rear-attacker',
        position: { x: 5, y: 7 },
      });
      const rearArc = facingProcessor.getAttackArc(rearAttacker, target);
      const rearResolveDamage = flankingProcessor.getResolveDamage(rearArc, DEFAULT_RESOLVE_CONFIG);
      expect(rearResolveDamage).toBe(DEFAULT_RESOLVE_CONFIG.rearResolveDamage);
    });

    it('should track resolve state after flanking attacks', () => {
      const unit = createMechanicsUnit({
        id: 'unit',
        position: { x: 5, y: 5 },
        resolve: 100,
        faction: 'human',
      }) as MechanicsUnit & { resolve: number };

      const flankDamage = flankingProcessor.getResolveDamage('flank', DEFAULT_RESOLVE_CONFIG);
      const afterFlank = resolveProcessor.applyDamage(unit, flankDamage);
      expect(afterFlank.resolve).toBe(100 - flankDamage);

      const rearDamage = flankingProcessor.getResolveDamage('rear', DEFAULT_RESOLVE_CONFIG);
      const afterRear = resolveProcessor.applyDamage(afterFlank, rearDamage);
      expect(afterRear.resolve).toBe(100 - flankDamage - rearDamage);
    });

    it('should trigger rout when resolve reaches zero from flanking', () => {
      const unit = createMechanicsUnit({
        id: 'unit',
        position: { x: 5, y: 5 },
        resolve: 15,
        faction: 'human',
      }) as MechanicsUnit & { resolve: number };

      const rearDamage = flankingProcessor.getResolveDamage('rear', DEFAULT_RESOLVE_CONFIG);
      const afterRear = resolveProcessor.applyDamage(unit, rearDamage);
      expect(afterRear.resolve).toBe(0);

      const state = resolveProcessor.checkState(afterRear, DEFAULT_RESOLVE_CONFIG);
      expect(state).toBe('routing');
    });

    it('should handle undead crumbling from flanking resolve damage', () => {
      const undead = createMechanicsUnit({
        id: 'undead',
        position: { x: 5, y: 5 },
        resolve: 10,
        faction: 'undead',
      }) as MechanicsUnit & { resolve: number };

      const flankDamage = flankingProcessor.getResolveDamage('flank', DEFAULT_RESOLVE_CONFIG);
      const afterFlank = resolveProcessor.applyDamage(undead, flankDamage);
      expect(afterFlank.resolve).toBe(0);

      const state = resolveProcessor.checkState(afterFlank, DEFAULT_RESOLVE_CONFIG);
      expect(state).toBe('crumbled');
    });
  });

  describe('Engagement + Archer Penalty Integration', () => {
    const engagementProcessor = createEngagementProcessor(DEFAULT_ENGAGEMENT_CONFIG);

    it('should detect engagement when melee units are adjacent', () => {
      const melee = createMechanicsUnit({
        id: 'melee',
        instanceId: 'melee-instance',
        position: { x: 3, y: 3 },
        range: 1,
        team: 'player',
      });
      const enemy = createMechanicsUnit({
        id: 'enemy',
        instanceId: 'enemy-instance',
        position: { x: 3, y: 4 },
        team: 'bot',
        range: 1,
      });

      const state = createTestBattleState([melee, enemy]);
      const status = engagementProcessor.getEngagementStatus(melee, state);
      expect(status).toBe('engaged');
    });

    it('should not detect engagement when units are not adjacent', () => {
      const melee = createMechanicsUnit({
        id: 'melee',
        instanceId: 'melee-instance',
        position: { x: 3, y: 3 },
        range: 1,
        team: 'player',
      });
      const enemy = createMechanicsUnit({
        id: 'enemy',
        instanceId: 'enemy-instance',
        position: { x: 3, y: 6 },
        team: 'bot',
        range: 1,
      });

      const state = createTestBattleState([melee, enemy]);
      const status = engagementProcessor.getEngagementStatus(melee, state);
      expect(status).toBe('free');
    });

    it('should apply archer penalty when engaged', () => {
      const archer = createMechanicsUnit({
        id: 'archer',
        instanceId: 'archer-instance',
        position: { x: 5, y: 5 },
        range: 4,
        role: 'ranged_dps',
        team: 'player',
        stats: { hp: 60, atk: 20, atkCount: 1, armor: 2, speed: 3, initiative: 7, dodge: 10 },
      });
      const enemy = createMechanicsUnit({
        id: 'enemy',
        instanceId: 'enemy-instance',
        position: { x: 5, y: 6 },
        team: 'bot',
        range: 1,
      });

      const state = createTestBattleState([archer, enemy]);
      const status = engagementProcessor.getEngagementStatus(archer, state);
      expect(status).toBe('engaged');

      const penalty = engagementProcessor.getArcherPenalty(archer, state, DEFAULT_ENGAGEMENT_CONFIG);
      expect(penalty).toBe(1.0 - DEFAULT_ENGAGEMENT_CONFIG.archerPenaltyPercent);

      const baseDamage = 20;
      const penalizedDamage = Math.floor(baseDamage * penalty);
      expect(penalizedDamage).toBe(10);
    });

    it('should not apply archer penalty when not engaged', () => {
      const archer = createMechanicsUnit({
        id: 'archer',
        instanceId: 'archer-instance',
        position: { x: 5, y: 5 },
        range: 4,
        role: 'ranged_dps',
        team: 'player',
      });
      const enemy = createMechanicsUnit({
        id: 'enemy',
        instanceId: 'enemy-instance',
        position: { x: 5, y: 9 },
        team: 'bot',
        range: 1,
      });

      const state = createTestBattleState([archer, enemy]);
      const penalty = engagementProcessor.getArcherPenalty(archer, state, DEFAULT_ENGAGEMENT_CONFIG);
      expect(penalty).toBe(1.0);
    });
  });


  describe('Dependency Auto-Resolution', () => {
    it('should auto-enable facing when flanking is enabled', () => {
      const config = resolveDependencies({ flanking: true });
      expect(config.flanking).toBe(true);
      expect(config.facing).toBe(true);
    });

    it('should not enable unrelated mechanics', () => {
      const config = resolveDependencies({ flanking: true });
      expect(config.flanking).toBe(true);
      expect(config.facing).toBe(true);
      expect(config.resolve).toBe(false);
      expect(config.engagement).toBe(false);
      expect(config.armorShred).toBe(false);
    });

    it('should return default config for enabled mechanics', () => {
      const facingDefault = getDefaultConfig('facing');
      expect(facingDefault).toBe(true);

      const resolveDefault = getDefaultConfig('resolve');
      expect(resolveDefault).toEqual(DEFAULT_RESOLVE_CONFIG);

      const engagementDefault = getDefaultConfig('engagement');
      expect(engagementDefault).toEqual(DEFAULT_ENGAGEMENT_CONFIG);
    });
  });

  describe('Combined Mechanics Scenario', () => {
    it('should correctly process a complete attack scenario with facing, flanking, and resolve', () => {
      const facingProcessor = createFacingProcessor();
      const flankingProcessor = createFlankingProcessor();
      const resolveProcessor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);

      const attacker = createMechanicsUnit({
        id: 'attacker',
        position: { x: 5, y: 7 },
        facing: 'S',
        stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 8, dodge: 0 },
      });

      const target = createMechanicsUnit({
        id: 'target',
        position: { x: 5, y: 5 },
        facing: 'N',
        resolve: 100,
        faction: 'human',
        stats: { hp: 100, atk: 15, atkCount: 1, armor: 10, speed: 2, initiative: 5, dodge: 0 },
      }) as MechanicsUnit & { resolve: number };

      const facedAttacker = facingProcessor.faceTarget(attacker, target.position);
      expect(facedAttacker.facing).toBe('N');

      const arc = facingProcessor.getAttackArc(facedAttacker, target);
      expect(arc).toBe('rear');

      const effects = flankingProcessor.calculateFlankingEffects(arc, DEFAULT_RESOLVE_CONFIG);
      expect(effects.damageModifier).toBe(1.3);
      expect(effects.resolveDamage).toBe(20);
      expect(effects.disablesRiposte).toBe(true);

      const baseDamage = Math.max(1, facedAttacker.stats.atk - target.stats.armor);
      const finalDamage = Math.floor(baseDamage * effects.damageModifier);
      expect(finalDamage).toBe(Math.floor(10 * 1.3));

      const afterResolve = resolveProcessor.applyDamage(target, effects.resolveDamage);
      expect(afterResolve.resolve).toBe(80);

      const state = resolveProcessor.checkState(afterResolve, DEFAULT_RESOLVE_CONFIG);
      expect(state).toBe('active');
    });

    it('should handle multiple flanking attacks leading to rout', () => {
      const facingProcessor = createFacingProcessor();
      const flankingProcessor = createFlankingProcessor();
      const resolveProcessor = createResolveProcessor(DEFAULT_RESOLVE_CONFIG);

      let target = createMechanicsUnit({
        id: 'target',
        position: { x: 5, y: 5 },
        facing: 'N',
        resolve: 50,
        faction: 'human',
      }) as MechanicsUnit & { resolve: number };

      const attacker1 = createMechanicsUnit({
        id: 'attacker1',
        position: { x: 5, y: 7 },
      });
      const arc1 = facingProcessor.getAttackArc(attacker1, target);
      const damage1 = flankingProcessor.getResolveDamage(arc1, DEFAULT_RESOLVE_CONFIG);
      target = resolveProcessor.applyDamage(target, damage1) as typeof target;
      expect(target.resolve).toBe(30);

      const attacker2 = createMechanicsUnit({
        id: 'attacker2',
        position: { x: 4, y: 7 },
      });
      const arc2 = facingProcessor.getAttackArc(attacker2, target);
      const damage2 = flankingProcessor.getResolveDamage(arc2, DEFAULT_RESOLVE_CONFIG);
      target = resolveProcessor.applyDamage(target, damage2) as typeof target;
      expect(target.resolve).toBe(10);

      const attacker3 = createMechanicsUnit({
        id: 'attacker3',
        position: { x: 6, y: 7 },
      });
      const arc3 = facingProcessor.getAttackArc(attacker3, target);
      const damage3 = flankingProcessor.getResolveDamage(arc3, DEFAULT_RESOLVE_CONFIG);
      target = resolveProcessor.applyDamage(target, damage3) as typeof target;
      expect(target.resolve).toBe(0);

      const state = resolveProcessor.checkState(target, DEFAULT_RESOLVE_CONFIG);
      expect(state).toBe('routing');
    });
  });

  describe('Riposte + Flanking Integration', () => {
    const facingProcessor = createFacingProcessor();
    const flankingProcessor = createFlankingProcessor();
    const riposteProcessor = createRiposteProcessor(DEFAULT_RIPOSTE_CONFIG);

    /**
     * Extended unit type with riposte properties for testing.
     */
    type RiposteUnit = MechanicsUnit & UnitWithRiposte;

    /**
     * Creates a test unit with riposte properties.
     */
    function createRiposteTestUnit(
      overrides: Partial<RiposteUnit> & { position: { x: number; y: number } },
    ): RiposteUnit {
      const base = createMechanicsUnit(overrides);
      const result: RiposteUnit = {
        ...base,
        initiative: overrides.initiative ?? base.stats?.initiative ?? 5,
        attackCount: overrides.attackCount ?? base.stats?.atkCount ?? 1,
      };
      if (overrides.riposteCharges !== undefined) {
        result.riposteCharges = overrides.riposteCharges;
      }
      if (overrides.maxRiposteCharges !== undefined) {
        result.maxRiposteCharges = overrides.maxRiposteCharges;
      }
      return result;
    }

    describe('Riposte disabled by flanking attacks', () => {
      it('should allow riposte when attacked from front', () => {
        // Target facing North, attacker from North (front attack)
        const target = createRiposteTestUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
          team: 'bot',
          riposteCharges: 2,
          initiative: 10,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteTestUnit({
          id: 'attacker',
          position: { x: 5, y: 3 },
          team: 'player',
          initiative: 5,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });

        // Determine attack arc
        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('front');

        // Flanking processor should NOT disable riposte for front attacks
        const disablesRiposte = flankingProcessor.disablesRiposte(arc);
        expect(disablesRiposte).toBe(false);

        // Riposte processor should allow riposte from front
        const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
        expect(canRiposte).toBe(true);
      });

      it('should disable riposte when attacked from flank', () => {
        // Target facing North, attacker from East (flank attack)
        const target = createRiposteTestUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
          team: 'bot',
          riposteCharges: 2,
          initiative: 10,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteTestUnit({
          id: 'attacker',
          position: { x: 7, y: 5 },
          team: 'player',
          initiative: 5,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });

        // Determine attack arc
        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('flank');

        // Flanking processor should disable riposte for flank attacks
        const disablesRiposte = flankingProcessor.disablesRiposte(arc);
        expect(disablesRiposte).toBe(true);

        // Riposte processor should deny riposte from flank
        const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
        expect(canRiposte).toBe(false);
      });

      it('should disable riposte when attacked from rear', () => {
        // Target facing North, attacker from South (rear attack)
        const target = createRiposteTestUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
          team: 'bot',
          riposteCharges: 2,
          initiative: 10,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });
        const attacker = createRiposteTestUnit({
          id: 'attacker',
          position: { x: 5, y: 7 },
          team: 'player',
          initiative: 5,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });

        // Determine attack arc
        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('rear');

        // Flanking processor should disable riposte for rear attacks
        const disablesRiposte = flankingProcessor.disablesRiposte(arc);
        expect(disablesRiposte).toBe(true);

        // Riposte processor should deny riposte from rear
        const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
        expect(canRiposte).toBe(false);
      });
    });

    describe('Riposte disabled by flanking for all facing directions', () => {
      const facingDirections: FacingDirection[] = ['N', 'S', 'E', 'W'];

      facingDirections.forEach((facing) => {
        it(`should disable riposte for flank attacks when target faces ${facing}`, () => {
          const target = createRiposteTestUnit({
            id: 'target',
            position: { x: 5, y: 5 },
            facing,
            team: 'bot',
            riposteCharges: 2,
            initiative: 10,
            stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
          });

          // Determine flank position based on facing
          // Flank is perpendicular to facing direction
          const flankPositions: Record<FacingDirection, { x: number; y: number }> = {
            N: { x: 7, y: 5 }, // East side
            S: { x: 3, y: 5 }, // West side
            E: { x: 5, y: 7 }, // South side
            W: { x: 5, y: 3 }, // North side
          };

          const attacker = createRiposteTestUnit({
            id: 'attacker',
            position: flankPositions[facing],
            team: 'player',
            initiative: 5,
            stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
          });

          const arc = facingProcessor.getAttackArc(attacker, target);
          expect(arc).toBe('flank');

          const disablesRiposte = flankingProcessor.disablesRiposte(arc);
          expect(disablesRiposte).toBe(true);

          const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
          expect(canRiposte).toBe(false);
        });

        it(`should disable riposte for rear attacks when target faces ${facing}`, () => {
          const target = createRiposteTestUnit({
            id: 'target',
            position: { x: 5, y: 5 },
            facing,
            team: 'bot',
            riposteCharges: 2,
            initiative: 10,
            stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
          });

          // Determine rear position based on facing
          // Rear is opposite to facing direction
          const rearPositions: Record<FacingDirection, { x: number; y: number }> = {
            N: { x: 5, y: 7 }, // South (behind North-facing)
            S: { x: 5, y: 3 }, // North (behind South-facing)
            E: { x: 3, y: 5 }, // West (behind East-facing)
            W: { x: 7, y: 5 }, // East (behind West-facing)
          };

          const attacker = createRiposteTestUnit({
            id: 'attacker',
            position: rearPositions[facing],
            team: 'player',
            initiative: 5,
            stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
          });

          const arc = facingProcessor.getAttackArc(attacker, target);
          expect(arc).toBe('rear');

          const disablesRiposte = flankingProcessor.disablesRiposte(arc);
          expect(disablesRiposte).toBe(true);

          const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
          expect(canRiposte).toBe(false);
        });

        it(`should allow riposte for front attacks when target faces ${facing}`, () => {
          const target = createRiposteTestUnit({
            id: 'target',
            position: { x: 5, y: 5 },
            facing,
            team: 'bot',
            riposteCharges: 2,
            initiative: 10,
            stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
          });

          // Determine front position based on facing
          // Front is in the direction the unit is facing
          const frontPositions: Record<FacingDirection, { x: number; y: number }> = {
            N: { x: 5, y: 3 }, // North (in front of North-facing)
            S: { x: 5, y: 7 }, // South (in front of South-facing)
            E: { x: 7, y: 5 }, // East (in front of East-facing)
            W: { x: 3, y: 5 }, // West (in front of West-facing)
          };

          const attacker = createRiposteTestUnit({
            id: 'attacker',
            position: frontPositions[facing],
            team: 'player',
            initiative: 5,
            stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
          });

          const arc = facingProcessor.getAttackArc(attacker, target);
          expect(arc).toBe('front');

          const disablesRiposte = flankingProcessor.disablesRiposte(arc);
          expect(disablesRiposte).toBe(false);

          const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
          expect(canRiposte).toBe(true);
        });
      });
    });

    describe('Flanking effects combined with riposte check', () => {
      it('should calculate flanking effects and correctly determine riposte eligibility', () => {
        const target = createRiposteTestUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
          team: 'bot',
          riposteCharges: 2,
          initiative: 10,
          stats: { hp: 100, atk: 20, atkCount: 1, armor: 5, speed: 3, initiative: 10, dodge: 0 },
        });

        // Test all three arcs
        const testCases: Array<{
          attackerPos: { x: number; y: number };
          expectedArc: AttackArc;
          expectedDamageModifier: number;
          expectedDisablesRiposte: boolean;
        }> = [
          { attackerPos: { x: 5, y: 3 }, expectedArc: 'front', expectedDamageModifier: 1.0, expectedDisablesRiposte: false },
          { attackerPos: { x: 7, y: 5 }, expectedArc: 'flank', expectedDamageModifier: 1.15, expectedDisablesRiposte: true },
          { attackerPos: { x: 5, y: 7 }, expectedArc: 'rear', expectedDamageModifier: 1.3, expectedDisablesRiposte: true },
        ];

        testCases.forEach(({ attackerPos, expectedArc, expectedDamageModifier, expectedDisablesRiposte }) => {
          const attacker = createRiposteTestUnit({
            id: 'attacker',
            position: attackerPos,
            team: 'player',
            initiative: 5,
            stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
          });

          // Get attack arc from facing processor
          const arc = facingProcessor.getAttackArc(attacker, target);
          expect(arc).toBe(expectedArc);

          // Get flanking effects
          const effects = flankingProcessor.calculateFlankingEffects(arc);
          expect(effects.arc).toBe(expectedArc);
          expect(effects.damageModifier).toBe(expectedDamageModifier);
          expect(effects.disablesRiposte).toBe(expectedDisablesRiposte);

          // Check riposte eligibility
          const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
          expect(canRiposte).toBe(!expectedDisablesRiposte);
        });
      });

      it('should deny riposte even with high initiative when flanked', () => {
        // Target has very high initiative (would normally guarantee riposte)
        const target = createRiposteTestUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
          team: 'bot',
          riposteCharges: 5,
          initiative: 100, // Very high initiative
          stats: { hp: 100, atk: 50, atkCount: 3, armor: 10, speed: 5, initiative: 100, dodge: 0 },
        });

        // Attacker has low initiative
        const attacker = createRiposteTestUnit({
          id: 'attacker',
          position: { x: 7, y: 5 }, // Flank position
          team: 'player',
          initiative: 1, // Very low initiative
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 2, speed: 2, initiative: 1, dodge: 0 },
        });

        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('flank');

        // Even with high initiative and charges, riposte should be denied due to flanking
        const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
        expect(canRiposte).toBe(false);

        // Verify that if it were a front attack, riposte would be allowed
        const frontAttacker = createRiposteTestUnit({
          id: 'front-attacker',
          position: { x: 5, y: 3 }, // Front position
          team: 'player',
          initiative: 1,
          stats: { hp: 100, atk: 10, atkCount: 1, armor: 2, speed: 2, initiative: 1, dodge: 0 },
        });

        const frontArc = facingProcessor.getAttackArc(frontAttacker, target);
        expect(frontArc).toBe('front');

        const canRiposteFront = riposteProcessor.canRiposte(target, frontAttacker, frontArc);
        expect(canRiposteFront).toBe(true);
      });

      it('should deny riposte even with many charges when attacked from rear', () => {
        const target = createRiposteTestUnit({
          id: 'target',
          position: { x: 5, y: 5 },
          facing: 'N',
          team: 'bot',
          riposteCharges: 10, // Many charges
          maxRiposteCharges: 10,
          initiative: 15,
          stats: { hp: 100, atk: 30, atkCount: 2, armor: 8, speed: 4, initiative: 15, dodge: 0 },
        });

        const attacker = createRiposteTestUnit({
          id: 'attacker',
          position: { x: 5, y: 7 }, // Rear position
          team: 'player',
          initiative: 5,
          stats: { hp: 100, atk: 15, atkCount: 1, armor: 5, speed: 3, initiative: 5, dodge: 0 },
        });

        const arc = facingProcessor.getAttackArc(attacker, target);
        expect(arc).toBe('rear');

        // Even with many charges, riposte should be denied due to rear attack
        const canRiposte = riposteProcessor.canRiposte(target, attacker, arc);
        expect(canRiposte).toBe(false);
      });
    });
  });
});
