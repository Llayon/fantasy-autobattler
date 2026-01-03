/**
 * Tier 3: Ammunition Processor Tests
 *
 * Tests for the ammunition and cooldown system which tracks resource
 * consumption for ranged units and ability cooldowns for mages.
 *
 * @module core/mechanics/tier3/ammunition
 */

import { createAmmunitionProcessor } from './ammunition.processor';
import { createTestUnit, createTestBattleState } from '../../test-fixtures';
import type { BattleUnit } from '../../../types';
import type { AmmoConfig } from '../../config/mechanics.types';
import type { UnitWithAmmunition } from './ammunition.types';
import {
  DEFAULT_AMMO_COUNT,
  DEFAULT_COOLDOWN_DURATION,
  RANGED_TAG,
  MAGE_TAG,
  UNLIMITED_AMMO_TAG,
  QUICK_COOLDOWN_TAG,
} from './ammunition.types';

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_AMMO_CONFIG: AmmoConfig = {
  enabled: true,
  mageCooldowns: true,
  defaultAmmo: DEFAULT_AMMO_COUNT,
  defaultCooldown: DEFAULT_COOLDOWN_DURATION,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a ranged unit with ammunition properties.
 */
function createRangedUnit(
  overrides: Partial<BattleUnit & UnitWithAmmunition> = {},
): BattleUnit & UnitWithAmmunition {
  const unit = createTestUnit({
    id: overrides.id ?? 'ranged-unit',
    position: overrides.position ?? { x: 3, y: 1 },
    team: overrides.team ?? 'player',
    range: overrides.range ?? 4,
    role: 'ranged_dps',
    stats: {
      hp: 60,
      atk: 18,
      atkCount: 1,
      armor: 2,
      speed: 3,
      initiative: 7,
      dodge: 0.1,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 60,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  // Build result with explicit properties - don't set ammoState unless explicitly provided
  // so the processor can calculate it dynamically
  const result: BattleUnit & UnitWithAmmunition = {
    ...unit,
    ammo: overrides.ammo ?? DEFAULT_AMMO_COUNT,
    maxAmmo: overrides.maxAmmo ?? DEFAULT_AMMO_COUNT,
    resourceType: overrides.resourceType ?? 'ammo',
    tags: overrides.tags ?? [RANGED_TAG],
  };

  // Only set ammoState if explicitly provided
  if (overrides.ammoState !== undefined) {
    result.ammoState = overrides.ammoState;
  }

  // Set isReloading if provided
  if (overrides.isReloading !== undefined) {
    result.isReloading = overrides.isReloading;
  }

  return result;
}

/**
 * Creates a mage unit with cooldown properties.
 */
function createMageUnit(
  overrides: Partial<BattleUnit & UnitWithAmmunition> = {},
): BattleUnit & UnitWithAmmunition {
  const unit = createTestUnit({
    id: overrides.id ?? 'mage-unit',
    position: overrides.position ?? { x: 5, y: 1 },
    team: overrides.team ?? 'player',
    range: overrides.range ?? 3,
    role: 'mage',
    stats: {
      hp: 50,
      atk: 25,
      atkCount: 1,
      armor: 0,
      speed: 2,
      initiative: 6,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 50,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  return {
    ...unit,
    cooldowns: overrides.cooldowns ?? {},
    defaultCooldown: overrides.defaultCooldown ?? DEFAULT_COOLDOWN_DURATION,
    resourceType: overrides.resourceType ?? 'cooldown',
    tags: overrides.tags ?? [MAGE_TAG],
  } as BattleUnit & UnitWithAmmunition;
}

/**
 * Creates a melee unit without ammunition.
 */
function createMeleeUnit(
  overrides: Partial<BattleUnit & UnitWithAmmunition> = {},
): BattleUnit & UnitWithAmmunition {
  const unit = createTestUnit({
    id: overrides.id ?? 'melee-unit',
    position: overrides.position ?? { x: 3, y: 3 },
    team: overrides.team ?? 'player',
    range: 1,
    role: 'melee_dps',
    stats: {
      hp: 80,
      atk: 15,
      atkCount: 1,
      armor: 5,
      speed: 4,
      initiative: 6,
      dodge: 0,
      ...overrides.stats,
    },
    currentHp: overrides.currentHp ?? 80,
    alive: overrides.alive ?? true,
    ...overrides,
  });

  return {
    ...unit,
    resourceType: 'none',
    tags: overrides.tags ?? [],
  } as BattleUnit & UnitWithAmmunition;
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('AmmunitionProcessor', () => {
  // ─────────────────────────────────────────────────────────────
  // GET RESOURCE TYPE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('getResourceType', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should return "ammo" for ranged units with ranged tag', () => {
      const archer = createRangedUnit({ tags: [RANGED_TAG] });
      expect(processor.getResourceType(archer)).toBe('ammo');
    });

    it('should return "ammo" for units with range > 1 even without tag', () => {
      const rangedUnit = createRangedUnit({ range: 4, tags: [] });
      expect(processor.getResourceType(rangedUnit)).toBe('ammo');
    });

    it('should return "cooldown" for mage units', () => {
      const mage = createMageUnit({ tags: [MAGE_TAG] });
      expect(processor.getResourceType(mage)).toBe('cooldown');
    });

    it('should return "none" for melee units', () => {
      const melee = createMeleeUnit({ range: 1, tags: [] });
      expect(processor.getResourceType(melee)).toBe('none');
    });

    it('should use existing resourceType if set', () => {
      const unit = createRangedUnit({ resourceType: 'cooldown' });
      expect(processor.getResourceType(unit)).toBe('cooldown');
    });

    it('should return "none" when mageCooldowns is disabled for mages', () => {
      const configNoCooldowns: AmmoConfig = { ...DEFAULT_AMMO_CONFIG, mageCooldowns: false };
      const processorNoCooldowns = createAmmunitionProcessor(configNoCooldowns);
      // Create mage without resourceType set so processor determines it
      const baseUnit = createTestUnit({
        id: 'mage-unit',
        position: { x: 5, y: 1 },
        team: 'player',
        range: 1, // Melee range
        role: 'mage',
      });
      const mage = { ...baseUnit, tags: [MAGE_TAG] } as BattleUnit & UnitWithAmmunition;
      // Mage with range 1 and no mageCooldowns should be 'none'
      expect(processorNoCooldowns.getResourceType(mage)).toBe('none');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CHECK AMMO TESTS
  // ─────────────────────────────────────────────────────────────
  describe('checkAmmo', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should return canAttack=true for ranged unit with ammo', () => {
      const archer = createRangedUnit({ ammo: 5 });
      const result = processor.checkAmmo(archer);

      expect(result.canAttack).toBe(true);
      expect(result.hasAmmo).toBe(true);
      expect(result.ammoRemaining).toBe(5);
      expect(result.ammoState).toBe('partial');
    });

    it('should return canAttack=false for ranged unit with no ammo', () => {
      const archer = createRangedUnit({ ammo: 0 });
      const result = processor.checkAmmo(archer);

      expect(result.canAttack).toBe(false);
      expect(result.hasAmmo).toBe(false);
      expect(result.ammoRemaining).toBe(0);
      expect(result.ammoState).toBe('empty');
      expect(result.reason).toBe('no_ammo');
    });

    it('should return canAttack=false for reloading unit', () => {
      const archer = createRangedUnit({ ammo: 3, isReloading: true });
      const result = processor.checkAmmo(archer);

      expect(result.canAttack).toBe(false);
      expect(result.ammoState).toBe('reloading');
      expect(result.reason).toBe('reloading');
    });

    it('should return canAttack=true for unit with unlimited ammo', () => {
      const archer = createRangedUnit({ ammo: 0, tags: [RANGED_TAG, UNLIMITED_AMMO_TAG] });
      const result = processor.checkAmmo(archer);

      expect(result.canAttack).toBe(true);
      expect(result.hasAmmo).toBe(true);
      expect(result.ammoRemaining).toBe(Infinity);
      expect(result.ammoState).toBe('full');
    });

    it('should return canAttack=true for melee units (no ammo needed)', () => {
      const melee = createMeleeUnit();
      const result = processor.checkAmmo(melee);

      expect(result.canAttack).toBe(true);
      expect(result.hasAmmo).toBe(true);
      expect(result.ammoRemaining).toBe(Infinity);
    });

    it('should return full state when ammo equals maxAmmo', () => {
      const archer = createRangedUnit({ ammo: 6, maxAmmo: 6 });
      const result = processor.checkAmmo(archer);

      expect(result.ammoState).toBe('full');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CONSUME AMMO TESTS
  // ─────────────────────────────────────────────────────────────
  describe('consumeAmmo', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should consume 1 ammo by default', () => {
      const archer = createRangedUnit({ ammo: 5 });
      const state = createTestBattleState([archer]);

      const result = processor.consumeAmmo(archer, state);

      expect(result.success).toBe(true);
      expect(result.ammoConsumed).toBe(1);
      expect(result.ammoRemaining).toBe(4);
      expect(result.unit.ammo).toBe(4);
    });

    it('should consume specified amount of ammo', () => {
      const archer = createRangedUnit({ ammo: 5 });
      const state = createTestBattleState([archer]);

      const result = processor.consumeAmmo(archer, state, 3);

      expect(result.success).toBe(true);
      expect(result.ammoConsumed).toBe(3);
      expect(result.ammoRemaining).toBe(2);
    });

    it('should fail when not enough ammo', () => {
      const archer = createRangedUnit({ ammo: 1 });
      const state = createTestBattleState([archer]);

      const result = processor.consumeAmmo(archer, state, 3);

      expect(result.success).toBe(false);
      expect(result.ammoConsumed).toBe(0);
      expect(result.reason).toBe('no_ammo');
    });

    it('should not consume ammo for melee units', () => {
      const melee = createMeleeUnit();
      const state = createTestBattleState([melee]);

      const result = processor.consumeAmmo(melee, state);

      expect(result.success).toBe(true);
      expect(result.ammoConsumed).toBe(0);
    });

    it('should not consume ammo for unlimited ammo units', () => {
      const archer = createRangedUnit({ ammo: 3, tags: [RANGED_TAG, UNLIMITED_AMMO_TAG] });
      const state = createTestBattleState([archer]);

      const result = processor.consumeAmmo(archer, state);

      expect(result.success).toBe(true);
      expect(result.ammoConsumed).toBe(0);
      expect(result.ammoRemaining).toBe(Infinity);
    });

    it('should fail when unit is reloading', () => {
      const archer = createRangedUnit({ ammo: 5, isReloading: true });
      const state = createTestBattleState([archer]);

      const result = processor.consumeAmmo(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('reloading');
    });

    it('should update ammoState to empty when ammo reaches 0', () => {
      const archer = createRangedUnit({ ammo: 1 });
      const state = createTestBattleState([archer]);

      const result = processor.consumeAmmo(archer, state);

      expect(result.success).toBe(true);
      expect(result.ammoRemaining).toBe(0);
      expect(result.newState).toBe('empty');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET AMMO STATE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('getAmmoState', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should return "full" when ammo equals maxAmmo', () => {
      const archer = createRangedUnit({ ammo: 6, maxAmmo: 6 });
      expect(processor.getAmmoState(archer)).toBe('full');
    });

    it('should return "partial" when ammo is between 0 and max', () => {
      const archer = createRangedUnit({ ammo: 3, maxAmmo: 6 });
      expect(processor.getAmmoState(archer)).toBe('partial');
    });

    it('should return "empty" when ammo is 0', () => {
      const archer = createRangedUnit({ ammo: 0, maxAmmo: 6 });
      expect(processor.getAmmoState(archer)).toBe('empty');
    });

    it('should return "reloading" when unit is reloading', () => {
      const archer = createRangedUnit({ ammo: 0, isReloading: true });
      expect(processor.getAmmoState(archer)).toBe('reloading');
    });

    it('should return "full" for melee units', () => {
      const melee = createMeleeUnit();
      expect(processor.getAmmoState(melee)).toBe('full');
    });

    it('should return "full" for unlimited ammo units', () => {
      const archer = createRangedUnit({ ammo: 0, tags: [RANGED_TAG, UNLIMITED_AMMO_TAG] });
      expect(processor.getAmmoState(archer)).toBe('full');
    });

    it('should use existing ammoState if set', () => {
      const archer = createRangedUnit({ ammoState: 'partial' });
      expect(processor.getAmmoState(archer)).toBe('partial');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // RELOAD TESTS
  // ─────────────────────────────────────────────────────────────
  describe('reload', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should restore ammo to max', () => {
      const archer = createRangedUnit({ ammo: 2, maxAmmo: 6 });
      const state = createTestBattleState([archer]);

      const result = processor.reload(archer, state);

      expect(result.success).toBe(true);
      expect(result.ammoRestored).toBe(4);
      expect(result.newAmmo).toBe(6);
      expect(result.newState).toBe('full');
    });

    it('should restore specified amount', () => {
      const archer = createRangedUnit({ ammo: 2, maxAmmo: 6 });
      const state = createTestBattleState([archer]);

      const result = processor.reload(archer, state, 2);

      expect(result.success).toBe(true);
      expect(result.ammoRestored).toBe(2);
      expect(result.newAmmo).toBe(4);
    });

    it('should not exceed maxAmmo', () => {
      const archer = createRangedUnit({ ammo: 5, maxAmmo: 6 });
      const state = createTestBattleState([archer]);

      const result = processor.reload(archer, state, 10);

      expect(result.success).toBe(true);
      expect(result.newAmmo).toBe(6);
      expect(result.ammoRestored).toBe(1);
    });

    it('should fail when already full', () => {
      const archer = createRangedUnit({ ammo: 6, maxAmmo: 6 });
      const state = createTestBattleState([archer]);

      const result = processor.reload(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_full');
    });

    it('should fail when already reloading', () => {
      const archer = createRangedUnit({ ammo: 2, isReloading: true });
      const state = createTestBattleState([archer]);

      const result = processor.reload(archer, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_reloading');
    });

    it('should fail for melee units', () => {
      const melee = createMeleeUnit();
      const state = createTestBattleState([melee]);

      const result = processor.reload(melee, state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_ranged');
    });

    it('should succeed for unlimited ammo units (no-op)', () => {
      const archer = createRangedUnit({ ammo: 0, tags: [RANGED_TAG, UNLIMITED_AMMO_TAG] });
      const state = createTestBattleState([archer]);

      const result = processor.reload(archer, state);

      expect(result.success).toBe(true);
      expect(result.ammoRestored).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // INITIALIZE UNIT TESTS
  // ─────────────────────────────────────────────────────────────
  describe('initializeUnit', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should initialize ranged unit with full ammo', () => {
      // Create unit without ammo/maxAmmo set (will use defaults)
      const baseUnit = createTestUnit({
        id: 'ranged-unit',
        position: { x: 3, y: 1 },
        team: 'player',
        range: 4,
        role: 'ranged_dps',
      });
      const archer = { ...baseUnit, tags: [RANGED_TAG] } as BattleUnit & UnitWithAmmunition;
      const result = processor.initializeUnit(archer, DEFAULT_AMMO_CONFIG);

      expect(result.resourceType).toBe('ammo');
      expect(result.ammo).toBe(DEFAULT_AMMO_COUNT);
      expect(result.maxAmmo).toBe(DEFAULT_AMMO_COUNT);
      expect(result.ammoState).toBe('full');
    });

    it('should initialize mage unit with empty cooldowns', () => {
      // Create unit without cooldowns set
      const baseUnit = createTestUnit({
        id: 'mage-unit',
        position: { x: 5, y: 1 },
        team: 'player',
        range: 3,
        role: 'mage',
      });
      const mage = { ...baseUnit, tags: [MAGE_TAG] } as BattleUnit & UnitWithAmmunition;
      const result = processor.initializeUnit(mage, DEFAULT_AMMO_CONFIG);

      expect(result.resourceType).toBe('cooldown');
      expect(result.cooldowns).toEqual({});
      expect(result.defaultCooldown).toBe(DEFAULT_COOLDOWN_DURATION);
    });

    it('should initialize melee unit with none resource type', () => {
      const melee = createMeleeUnit();
      const result = processor.initializeUnit(melee, DEFAULT_AMMO_CONFIG);

      expect(result.resourceType).toBe('none');
    });

    it('should preserve existing maxAmmo if set', () => {
      const archer = createRangedUnit({ maxAmmo: 10 });
      const result = processor.initializeUnit(archer, DEFAULT_AMMO_CONFIG);

      expect(result.maxAmmo).toBe(10);
      expect(result.ammo).toBe(10);
    });

    it('should set hasUnlimitedAmmo for units with unlimited tag', () => {
      const archer = createRangedUnit({ tags: [RANGED_TAG, UNLIMITED_AMMO_TAG] });
      const result = processor.initializeUnit(archer, DEFAULT_AMMO_CONFIG);

      expect(result.hasUnlimitedAmmo).toBe(true);
    });

    it('should set hasQuickCooldown for mages with quick cooldown tag', () => {
      const mage = createMageUnit({ tags: [MAGE_TAG, QUICK_COOLDOWN_TAG] });
      const result = processor.initializeUnit(mage, DEFAULT_AMMO_CONFIG);

      expect(result.hasQuickCooldown).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('apply (phase integration)', () => {
    const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG);

    it('should return unchanged state when ammunition is disabled', () => {
      const disabledConfig: AmmoConfig = { ...DEFAULT_AMMO_CONFIG, enabled: false };
      const disabledProcessor = createAmmunitionProcessor(disabledConfig);
      const archer = createRangedUnit({ id: 'archer', ammo: 5 });
      const state = createTestBattleState([archer]);

      const result = disabledProcessor.apply('attack', state, {
        activeUnit: archer,
        action: { type: 'attack', targetId: 'enemy' },
        seed: 12345,
      });

      expect(result).toEqual(state);
    });

    it('should tick cooldowns at turn_start for mages', () => {
      const mage = createMageUnit({
        id: 'mage',
        cooldowns: { fireball: 2, frostbolt: 1 },
      });
      const state = createTestBattleState([mage]);

      const result = processor.apply('turn_start', state, {
        activeUnit: mage,
        seed: 12345,
      });

      const updatedMage = result.units.find(u => u.id === 'mage') as BattleUnit & UnitWithAmmunition;
      const cooldowns = updatedMage.cooldowns as Record<string, number> | undefined;
      expect(cooldowns?.['fireball']).toBe(1);
      expect(cooldowns?.['frostbolt']).toBe(0);
    });

    it('should consume ammo during attack phase for ranged units', () => {
      const archer = createRangedUnit({ id: 'archer', ammo: 5 });
      const target = createMeleeUnit({ id: 'target', team: 'bot' });
      const state = createTestBattleState([archer, target]);

      const result = processor.apply('attack', state, {
        activeUnit: archer,
        target,
        action: { type: 'attack', targetId: 'target' },
        seed: 12345,
      });

      const updatedArcher = result.units.find(u => u.id === 'archer') as BattleUnit & UnitWithAmmunition;
      expect(updatedArcher.ammo).toBe(4);
    });

    it('should not consume ammo for melee units during attack', () => {
      const melee = createMeleeUnit({ id: 'melee' });
      const target = createMeleeUnit({ id: 'target', team: 'bot' });
      const state = createTestBattleState([melee, target]);

      const result = processor.apply('attack', state, {
        activeUnit: melee,
        target,
        action: { type: 'attack', targetId: 'target' },
        seed: 12345,
      });

      // State should be unchanged for melee
      expect(result).toEqual(state);
    });

    it('should return unchanged state for unhandled phases', () => {
      const archer = createRangedUnit({ id: 'archer' });
      const state = createTestBattleState([archer]);

      const result = processor.apply('post_attack', state, {
        activeUnit: archer,
        seed: 12345,
      });

      expect(result).toEqual(state);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CUSTOM OPTIONS TESTS
  // ─────────────────────────────────────────────────────────────
  describe('custom options', () => {
    it('should use custom default ammo', () => {
      const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG, { defaultAmmo: 10 });
      // Create unit without ammo set to test default
      const baseUnit = createTestUnit({
        id: 'ranged-unit',
        position: { x: 3, y: 1 },
        team: 'player',
        range: 4,
        role: 'ranged_dps',
      });
      const archer = { ...baseUnit, tags: [RANGED_TAG] } as BattleUnit & UnitWithAmmunition;
      
      // Check ammo uses default when not set
      const result = processor.checkAmmo(archer);
      expect(result.ammoRemaining).toBe(10);
    });

    it('should use custom ranged tags', () => {
      const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG, { rangedTags: ['archer', 'crossbow'] });
      const archer = createRangedUnit({ tags: ['archer'], range: 1 });
      
      expect(processor.getResourceType(archer)).toBe('ammo');
    });

    it('should use custom mage tags', () => {
      const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG, { mageTags: ['wizard', 'sorcerer'] });
      const mage = createMageUnit({ tags: ['wizard'], range: 1 });
      
      expect(processor.getResourceType(mage)).toBe('cooldown');
    });

    it('should use custom unlimited ammo tags', () => {
      const processor = createAmmunitionProcessor(DEFAULT_AMMO_CONFIG, { unlimitedAmmoTags: ['infinite_arrows'] });
      const archer = createRangedUnit({ ammo: 0, tags: [RANGED_TAG, 'infinite_arrows'] });
      
      const result = processor.checkAmmo(archer);
      expect(result.canAttack).toBe(true);
      expect(result.ammoRemaining).toBe(Infinity);
    });
  });
});
