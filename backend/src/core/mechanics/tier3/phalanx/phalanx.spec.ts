/**
 * Tier 3: Phalanx Processor Tests
 *
 * Tests for the phalanx (formation) system.
 * Validates formation detection, bonus calculation, recalculation after casualties,
 * and phase integration.
 *
 * @module core/mechanics/tier3/phalanx
 */

import { createPhalanxProcessor } from './phalanx.processor';
import { createTestUnit, createTestBattleState } from '../../test-fixtures';
import type { PhalanxConfig } from '../../config/mechanics.types';
import type { BattleUnit, TeamType } from '../../../types';
import {
  PHALANX_TAG,
  PHALANX_IMMUNE_TAG,
  DEFAULT_MAX_ARMOR_BONUS,
  DEFAULT_MAX_RESOLVE_BONUS,
  DEFAULT_ARMOR_PER_ALLY,
  DEFAULT_RESOLVE_PER_ALLY,
} from './phalanx.types';
import type { FacingDirection } from '../../tier0/facing/facing.types';

// ═══════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PhalanxConfig = {
  maxArmorBonus: DEFAULT_MAX_ARMOR_BONUS,
  maxResolveBonus: DEFAULT_MAX_RESOLVE_BONUS,
  armorPerAlly: DEFAULT_ARMOR_PER_ALLY,
  resolvePerAlly: DEFAULT_RESOLVE_PER_ALLY,
};

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES AND FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** Phalanx unit type for testing - avoids intersection type issues */
interface PhalanxTestUnit extends BattleUnit {
  canFormPhalanx?: boolean;
  inPhalanx?: boolean;
  phalanxState?: 'none' | 'partial' | 'full';
  adjacentAlliesCount?: number;
  adjacentAllyIds?: string[];
  phalanxArmorBonus?: number;
  phalanxResolveBonus?: number;
  baseArmor?: number;
  baseResolve?: number;
  facing?: FacingDirection;
  tags?: string[];
  resolve?: number;
  armor?: number;
}


/** Options for creating a phalanx test unit */
interface PhalanxUnitOptions {
  id?: string;
  position?: { x: number; y: number };
  team?: TeamType;
  facing?: FacingDirection;
  tags?: string[];
  currentHp?: number;
  alive?: boolean;
  inPhalanx?: boolean;
  phalanxState?: 'none' | 'partial' | 'full';
  adjacentAlliesCount?: number;
  adjacentAllyIds?: string[];
  phalanxArmorBonus?: number;
  phalanxResolveBonus?: number;
  baseArmor?: number;
  baseResolve?: number;
  canFormPhalanx?: boolean;
}

/**
 * Creates a test unit with phalanx properties (infantry unit).
 */
function createPhalanxUnit(options: PhalanxUnitOptions = {}): PhalanxTestUnit {
  const unit = createTestUnit({
    id: options.id ?? 'phalanx-unit',
    position: options.position ?? { x: 3, y: 3 },
    team: options.team ?? 'player',
    range: 1,
    role: 'tank',
    stats: {
      hp: 100,
      atk: 12,
      atkCount: 1,
      armor: 8,
      speed: 2,
      initiative: 4,
      dodge: 0,
    },
    currentHp: options.currentHp ?? 100,
    alive: options.alive ?? true,
  });

  return {
    ...unit,
    canFormPhalanx: options.canFormPhalanx ?? true,
    inPhalanx: options.inPhalanx ?? false,
    phalanxState: options.phalanxState ?? 'none',
    adjacentAlliesCount: options.adjacentAlliesCount ?? 0,
    adjacentAllyIds: options.adjacentAllyIds ?? [],
    phalanxArmorBonus: options.phalanxArmorBonus ?? 0,
    phalanxResolveBonus: options.phalanxResolveBonus ?? 0,
    baseArmor: options.baseArmor ?? 8,
    baseResolve: options.baseResolve ?? 100,
    facing: options.facing ?? 'N',
    tags: options.tags ?? [PHALANX_TAG],
    resolve: 100,
    armor: 8,
  };
}

/**
 * Creates a unit that cannot form phalanx (cavalry).
 */
function createNonPhalanxUnit(options: PhalanxUnitOptions = {}): PhalanxTestUnit {
  const unit = createTestUnit({
    id: options.id ?? 'cavalry-unit',
    position: options.position ?? { x: 5, y: 5 },
    team: options.team ?? 'player',
    range: 1,
    role: 'melee_dps',
    stats: {
      hp: 80,
      atk: 15,
      atkCount: 1,
      armor: 4,
      speed: 5,
      initiative: 7,
      dodge: 0,
    },
    currentHp: options.currentHp ?? 80,
    alive: options.alive ?? true,
  });

  return {
    ...unit,
    canFormPhalanx: false,
    inPhalanx: false,
    facing: options.facing ?? 'N',
    tags: options.tags ?? [PHALANX_IMMUNE_TAG],
  };
}

/** Helper to cast processor results to PhalanxTestUnit */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asPhalanxUnit(unit: any): PhalanxTestUnit {
  return unit as PhalanxTestUnit;
}


// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('PhalanxProcessor', () => {
  // ─────────────────────────────────────────────────────────────
  // CAN JOIN PHALANX TESTS
  // ─────────────────────────────────────────────────────────────
  describe('canJoinPhalanx', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should return true for unit with phalanx tag and facing', () => {
      const spearman = createPhalanxUnit({ facing: 'N' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.canJoinPhalanx(spearman as any);

      expect(result.canJoinPhalanx).toBe(true);
      expect(result.hasTag).toBe(true);
      expect(result.isAlive).toBe(true);
    });

    it('should return false for unit without phalanx tag', () => {
      const cavalry = createNonPhalanxUnit({ tags: [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.canJoinPhalanx(cavalry as any);

      expect(result.canJoinPhalanx).toBe(false);
      expect(result.reason).toBe('no_phalanx_tag');
      expect(result.hasTag).toBe(false);
    });

    it('should return false for unit with immunity tag', () => {
      const cavalry = createPhalanxUnit({ tags: [PHALANX_TAG, PHALANX_IMMUNE_TAG] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.canJoinPhalanx(cavalry as any);

      expect(result.canJoinPhalanx).toBe(false);
      expect(result.reason).toBe('immune_tag');
    });

    it('should return false for dead unit', () => {
      const deadUnit = createPhalanxUnit({ currentHp: 0, alive: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.canJoinPhalanx(deadUnit as any);

      expect(result.canJoinPhalanx).toBe(false);
      expect(result.reason).toBe('dead');
      expect(result.isAlive).toBe(false);
    });

    it('should return false for unit without facing', () => {
      const noFacing = createPhalanxUnit({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (noFacing as any).facing = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.canJoinPhalanx(noFacing as any);

      expect(result.canJoinPhalanx).toBe(false);
      expect(result.reason).toBe('no_facing');
    });
  });


  // ─────────────────────────────────────────────────────────────
  // DETECT FORMATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('detectFormation', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should detect adjacent allies with same facing', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const right = createPhalanxUnit({
        id: 'right',
        position: { x: 4, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const state = createTestBattleState([center, left, right]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.detectFormation(center as any, state);

      expect(result.canFormPhalanx).toBe(true);
      expect(result.alignedCount).toBe(2);
      expect(result.totalAdjacent).toBe(2);
    });

    it('should not count allies with different facing', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'S', // Different facing
        team: 'player',
      });
      const state = createTestBattleState([center, left]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.detectFormation(center as any, state);

      expect(result.canFormPhalanx).toBe(false);
      expect(result.alignedCount).toBe(0);
      expect(result.totalAdjacent).toBe(1);
    });

    it('should not count enemies as allies', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const enemy = createPhalanxUnit({
        id: 'enemy',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'bot',
      });
      const state = createTestBattleState([center, enemy]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.detectFormation(center as any, state);

      expect(result.canFormPhalanx).toBe(false);
      expect(result.alignedCount).toBe(0);
      expect(result.totalAdjacent).toBe(0);
    });

    it('should not count dead allies', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const deadAlly = createPhalanxUnit({
        id: 'dead',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
        currentHp: 0,
        alive: false,
      });
      const state = createTestBattleState([center, deadAlly]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.detectFormation(center as any, state);

      expect(result.canFormPhalanx).toBe(false);
      expect(result.alignedCount).toBe(0);
    });

    it('should return empty result for unit without position', () => {
      const noPosition = createPhalanxUnit({ id: 'no-pos', facing: 'N' });
      noPosition.position = undefined as unknown as { x: number; y: number };
      const state = createTestBattleState([noPosition]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.detectFormation(noPosition as any, state);

      expect(result.canFormPhalanx).toBe(false);
      expect(result.alignedCount).toBe(0);
    });

    it('should detect all four orthogonal neighbors', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const north = createPhalanxUnit({
        id: 'north',
        position: { x: 3, y: 2 },
        facing: 'N',
        team: 'player',
      });
      const south = createPhalanxUnit({
        id: 'south',
        position: { x: 3, y: 4 },
        facing: 'N',
        team: 'player',
      });
      const east = createPhalanxUnit({
        id: 'east',
        position: { x: 4, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const west = createPhalanxUnit({
        id: 'west',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const state = createTestBattleState([center, north, south, east, west]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processor.detectFormation(center as any, state);

      expect(result.canFormPhalanx).toBe(true);
      expect(result.alignedCount).toBe(4);
      expect(result.totalAdjacent).toBe(4);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // CALCULATE BONUSES TESTS
  // ─────────────────────────────────────────────────────────────
  describe('calculateBonuses', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should return zero bonuses for zero adjacent allies', () => {
      const result = processor.calculateBonuses(0, DEFAULT_CONFIG);

      expect(result.armorBonus).toBe(0);
      expect(result.resolveBonus).toBe(0);
      expect(result.formationState).toBe('none');
    });

    it('should calculate bonuses for one adjacent ally', () => {
      const result = processor.calculateBonuses(1, DEFAULT_CONFIG);

      expect(result.armorBonus).toBe(1);
      expect(result.resolveBonus).toBe(5);
      expect(result.formationState).toBe('partial');
    });

    it('should calculate bonuses for two adjacent allies', () => {
      const result = processor.calculateBonuses(2, DEFAULT_CONFIG);

      expect(result.armorBonus).toBe(2);
      expect(result.resolveBonus).toBe(10);
      expect(result.formationState).toBe('partial');
    });

    it('should cap armor bonus at maximum', () => {
      const result = processor.calculateBonuses(10, DEFAULT_CONFIG);

      expect(result.armorBonus).toBe(5);
      expect(result.cappedArmor).toBe(true);
      expect(result.rawArmorBonus).toBe(10);
    });

    it('should cap resolve bonus at maximum', () => {
      const result = processor.calculateBonuses(10, DEFAULT_CONFIG);

      expect(result.resolveBonus).toBe(25);
      expect(result.cappedResolve).toBe(true);
      expect(result.rawResolveBonus).toBe(50);
    });

    it('should return full formation state for 4 adjacent allies', () => {
      const result = processor.calculateBonuses(4, DEFAULT_CONFIG);

      expect(result.formationState).toBe('full');
      expect(result.armorBonus).toBe(4);
      expect(result.resolveBonus).toBe(20);
    });

    it('should work with custom config values', () => {
      const customConfig: PhalanxConfig = {
        maxArmorBonus: 10,
        maxResolveBonus: 50,
        armorPerAlly: 2,
        resolvePerAlly: 10,
      };

      const result = processor.calculateBonuses(3, customConfig);

      expect(result.armorBonus).toBe(6);
      expect(result.resolveBonus).toBe(30);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // GET EFFECTIVE ARMOR/RESOLVE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('getEffectiveArmor', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should return base armor when no phalanx bonus', () => {
      const unit = createPhalanxUnit({ baseArmor: 8, phalanxArmorBonus: 0 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.getEffectiveArmor(unit as any)).toBe(8);
    });

    it('should add phalanx bonus to base armor', () => {
      const unit = createPhalanxUnit({ baseArmor: 8, phalanxArmorBonus: 3 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.getEffectiveArmor(unit as any)).toBe(11);
    });
  });

  describe('getEffectiveResolve', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should return base resolve when no phalanx bonus', () => {
      const unit = createPhalanxUnit({ baseResolve: 100, phalanxResolveBonus: 0 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.getEffectiveResolve(unit as any)).toBe(100);
    });

    it('should add phalanx bonus to base resolve', () => {
      const unit = createPhalanxUnit({ baseResolve: 100, phalanxResolveBonus: 15 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.getEffectiveResolve(unit as any)).toBe(115);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // UPDATE UNIT PHALANX TESTS
  // ─────────────────────────────────────────────────────────────
  describe('updateUnitPhalanx', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should update phalanx state for unit with adjacent allies', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const state = createTestBattleState([center, left]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = asPhalanxUnit(processor.updateUnitPhalanx(center as any, state, DEFAULT_CONFIG));

      expect(result.inPhalanx).toBe(true);
      expect(result.phalanxArmorBonus).toBe(1);
      expect(result.phalanxResolveBonus).toBe(5);
      expect(result.adjacentAlliesCount).toBe(1);
    });

    it('should clear phalanx state for ineligible unit', () => {
      const cavalry = createNonPhalanxUnit({
        id: 'cavalry',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
        tags: [],
      });
      const state = createTestBattleState([cavalry]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = asPhalanxUnit(processor.updateUnitPhalanx(cavalry as any, state, DEFAULT_CONFIG));

      expect(result.inPhalanx).toBe(false);
      expect(result.phalanxArmorBonus).toBe(0);
      expect(result.phalanxResolveBonus).toBe(0);
    });

    it('should clear phalanx state when no aligned allies', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
        inPhalanx: true,
        phalanxArmorBonus: 2,
      });
      const state = createTestBattleState([center]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = asPhalanxUnit(processor.updateUnitPhalanx(center as any, state, DEFAULT_CONFIG));

      expect(result.inPhalanx).toBe(false);
      expect(result.phalanxArmorBonus).toBe(0);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // RECALCULATE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('recalculate', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should recalculate bonuses for all units', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const right = createPhalanxUnit({
        id: 'right',
        position: { x: 4, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const state = createTestBattleState([center, left, right]);

      const result = processor.recalculate(state, 'turn_start');

      expect(result.unitsUpdated.length).toBeGreaterThan(0);
      expect(result.formationsChanged).toBeGreaterThan(0);

      const updatedCenter = asPhalanxUnit(result.state.units.find(u => u.id === 'center'));
      expect(updatedCenter.inPhalanx).toBe(true);
      expect(updatedCenter.phalanxArmorBonus).toBe(2);
      expect(updatedCenter.phalanxResolveBonus).toBe(10);
    });

    it('should update formations after unit death', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
        inPhalanx: true,
        phalanxArmorBonus: 2,
        adjacentAlliesCount: 2,
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
        currentHp: 0,
        alive: false,
      });
      const right = createPhalanxUnit({
        id: 'right',
        position: { x: 4, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const state = createTestBattleState([center, left, right]);

      const result = processor.recalculate(state, 'unit_death');

      const updatedCenter = asPhalanxUnit(result.state.units.find(u => u.id === 'center'));
      expect(updatedCenter.adjacentAlliesCount).toBe(1);
      expect(updatedCenter.phalanxArmorBonus).toBe(1);
    });

    it('should track total bonus changes', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
        phalanxArmorBonus: 0,
        phalanxResolveBonus: 0,
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
        phalanxArmorBonus: 0,
        phalanxResolveBonus: 0,
      });
      const state = createTestBattleState([center, left]);

      const result = processor.recalculate(state, 'turn_start');

      expect(result.totalArmorBonusChange).toBeGreaterThan(0);
      expect(result.totalResolveBonusChange).toBeGreaterThan(0);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // CLEAR PHALANX TESTS
  // ─────────────────────────────────────────────────────────────
  describe('clearPhalanx', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should reset all phalanx properties', () => {
      const unit = createPhalanxUnit({
        inPhalanx: true,
        phalanxState: 'partial',
        adjacentAlliesCount: 2,
        adjacentAllyIds: ['ally1', 'ally2'],
        phalanxArmorBonus: 2,
        phalanxResolveBonus: 10,
        baseArmor: 8,
        baseResolve: 100,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = asPhalanxUnit(processor.clearPhalanx(unit as any));

      expect(result.inPhalanx).toBe(false);
      expect(result.phalanxState).toBe('none');
      expect(result.adjacentAlliesCount).toBe(0);
      expect(result.adjacentAllyIds).toEqual([]);
      expect(result.phalanxArmorBonus).toBe(0);
      expect(result.phalanxResolveBonus).toBe(0);
    });

    it('should preserve base armor and resolve', () => {
      const unit = createPhalanxUnit({
        baseArmor: 10,
        baseResolve: 80,
        phalanxArmorBonus: 3,
        phalanxResolveBonus: 15,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = asPhalanxUnit(processor.clearPhalanx(unit as any));

      expect(result.baseArmor).toBe(10);
      expect(result.baseResolve).toBe(80);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // IS IN PHALANX TESTS
  // ─────────────────────────────────────────────────────────────
  describe('isInPhalanx', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should return true for unit in phalanx with adjacent allies', () => {
      const unit = createPhalanxUnit({
        inPhalanx: true,
        adjacentAlliesCount: 2,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.isInPhalanx(unit as any)).toBe(true);
    });

    it('should return false for unit not in phalanx', () => {
      const unit = createPhalanxUnit({
        inPhalanx: false,
        adjacentAlliesCount: 0,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.isInPhalanx(unit as any)).toBe(false);
    });

    it('should return false for unit with inPhalanx true but no adjacent allies', () => {
      const unit = createPhalanxUnit({
        inPhalanx: true,
        adjacentAlliesCount: 0,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(processor.isInPhalanx(unit as any)).toBe(false);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // PHASE INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('apply (phase integration)', () => {
    const processor = createPhalanxProcessor(DEFAULT_CONFIG);

    it('should recalculate phalanx at turn_start', () => {
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const left = createPhalanxUnit({
        id: 'left',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'player',
      });
      const state = createTestBattleState([center, left]);

      const result = processor.apply('turn_start', state, {
        activeUnit: center,
        seed: 12345,
      });

      const updatedCenter = asPhalanxUnit(result.units.find(u => u.id === 'center'));
      expect(updatedCenter.inPhalanx).toBe(true);
      expect(updatedCenter.phalanxArmorBonus).toBe(1);
    });

    it('should recalculate phalanx after target death in post_attack', () => {
      const attacker = createPhalanxUnit({
        id: 'attacker',
        position: { x: 1, y: 1 },
        facing: 'N',
        team: 'player',
      });
      const center = createPhalanxUnit({
        id: 'center',
        position: { x: 3, y: 3 },
        facing: 'N',
        team: 'bot',
        inPhalanx: true,
        phalanxArmorBonus: 1,
        adjacentAlliesCount: 1,
      });
      const deadTarget = createPhalanxUnit({
        id: 'dead-target',
        position: { x: 2, y: 3 },
        facing: 'N',
        team: 'bot',
        currentHp: 0,
        alive: false,
      });
      const state = createTestBattleState([attacker, center, deadTarget]);

      const result = processor.apply('post_attack', state, {
        activeUnit: attacker,
        target: deadTarget,
        seed: 12345,
      });

      const updatedCenter = asPhalanxUnit(result.units.find(u => u.id === 'center'));
      expect(updatedCenter.inPhalanx).toBe(false);
      expect(updatedCenter.phalanxArmorBonus).toBe(0);
    });

    it('should not change state for unhandled phases', () => {
      const unit = createPhalanxUnit({ id: 'unit' });
      const state = createTestBattleState([unit]);

      const result = processor.apply('attack', state, {
        activeUnit: unit,
        seed: 12345,
      });

      expect(result).toEqual(state);
    });

    it('should not recalculate in post_attack if no unit died', () => {
      const attacker = createPhalanxUnit({
        id: 'attacker',
        position: { x: 1, y: 1 },
        facing: 'N',
        team: 'player',
      });
      const target = createPhalanxUnit({
        id: 'target',
        position: { x: 2, y: 2 },
        facing: 'N',
        team: 'bot',
        currentHp: 50,
        alive: true,
      });
      const state = createTestBattleState([attacker, target]);

      const result = processor.apply('post_attack', state, {
        activeUnit: attacker,
        target: target,
        seed: 12345,
      });

      expect(result).toEqual(state);
    });
  });


  // ─────────────────────────────────────────────────────────────
  // CUSTOM CONFIG TESTS
  // ─────────────────────────────────────────────────────────────
  describe('custom config', () => {
    it('should use custom armor per ally', () => {
      const customConfig: PhalanxConfig = {
        ...DEFAULT_CONFIG,
        armorPerAlly: 3,
      };
      const processor = createPhalanxProcessor(customConfig);

      const result = processor.calculateBonuses(2, customConfig);
      expect(result.armorBonus).toBe(5); // 2 * 3 = 6, but capped at 5
    });

    it('should use custom resolve per ally', () => {
      const customConfig: PhalanxConfig = {
        ...DEFAULT_CONFIG,
        resolvePerAlly: 8,
      };
      const processor = createPhalanxProcessor(customConfig);

      const result = processor.calculateBonuses(2, customConfig);
      expect(result.resolveBonus).toBe(16); // 2 * 8
    });

    it('should use custom max armor bonus', () => {
      const customConfig: PhalanxConfig = {
        ...DEFAULT_CONFIG,
        maxArmorBonus: 3,
      };
      const processor = createPhalanxProcessor(customConfig);

      const result = processor.calculateBonuses(4, customConfig);
      expect(result.armorBonus).toBe(3); // Capped at 3
      expect(result.cappedArmor).toBe(true);
    });

    it('should use custom max resolve bonus', () => {
      const customConfig: PhalanxConfig = {
        ...DEFAULT_CONFIG,
        maxResolveBonus: 15,
      };
      const processor = createPhalanxProcessor(customConfig);

      const result = processor.calculateBonuses(4, customConfig);
      expect(result.resolveBonus).toBe(15); // Capped at 15
      expect(result.cappedResolve).toBe(true);
    });
  });
});
