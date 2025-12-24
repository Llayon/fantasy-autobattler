/**
 * Comprehensive verification tests for Synergy System.
 * Tests all aspects: detection, bonus application, stacking, and edge cases.
 */

import {
  calculateSynergies,
  applySynergyBonuses,
  calculateTotalStatBonus,
  SYNERGIES,
} from './synergies';
import { UnitTemplate, BattleUnit } from '../../types/game.types';
import { UNIT_TEMPLATES } from '../units/unit.data';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createBattleUnit(template: UnitTemplate, instanceId: string): BattleUnit {
  return {
    ...template,
    position: { x: 0, y: 0 },
    currentHp: template.stats.hp,
    maxHp: template.stats.hp,
    team: 'player',
    alive: true,
    instanceId,
  };
}

// =============================================================================
// COMPREHENSIVE VERIFICATION TESTS
// =============================================================================

describe('Synergy System Verification', () => {
  describe('1. Синергии определяются корректно', () => {
    it('should detect all 10 synergies correctly', () => {
      expect(SYNERGIES).toHaveLength(10);
      
      const synergyIds = SYNERGIES.map(s => s.id);
      expect(synergyIds).toContain('frontline');
      expect(synergyIds).toContain('magic_circle');
      expect(synergyIds).toContain('balanced');
      expect(synergyIds).toContain('glass_cannon');
    });

    it('should detect Frontline with exactly 2 tanks', () => {
      const team = [UNIT_TEMPLATES.knight, UNIT_TEMPLATES.guardian];
      const synergies = calculateSynergies(team);
      
      const frontline = synergies.find(s => s.id === 'frontline');
      expect(frontline).toBeDefined();
      expect(frontline?.bonuses[0]?.percentage).toBe(0.10);
    });

    it('should detect Magic Circle with 2+ mages', () => {
      const team = [UNIT_TEMPLATES.mage, UNIT_TEMPLATES.warlock, UNIT_TEMPLATES.elementalist];
      const synergies = calculateSynergies(team);
      
      const magicCircle = synergies.find(s => s.id === 'magic_circle');
      expect(magicCircle).toBeDefined();
      expect(magicCircle?.bonuses[0]?.percentage).toBe(0.15);
    });

    it('should detect Glass Cannon only without tanks', () => {
      const teamWithTanks = [
        UNIT_TEMPLATES.mage,
        UNIT_TEMPLATES.warlock,
        UNIT_TEMPLATES.elementalist,
        UNIT_TEMPLATES.knight, // Tank present
      ];
      
      const teamWithoutTanks = [
        UNIT_TEMPLATES.mage,
        UNIT_TEMPLATES.warlock,
        UNIT_TEMPLATES.elementalist,
      ];
      
      const synergiesWithTanks = calculateSynergies(teamWithTanks);
      const synergiesWithoutTanks = calculateSynergies(teamWithoutTanks);
      
      expect(synergiesWithTanks.find(s => s.id === 'glass_cannon')).toBeUndefined();
      expect(synergiesWithoutTanks.find(s => s.id === 'glass_cannon')).toBeDefined();
    });
  });

  describe('2. Бонусы применяются правильно', () => {
    it('should apply HP bonus correctly', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
      const originalHp = unit.stats.hp; // 120
      
      const synergies = calculateSynergies([UNIT_TEMPLATES.knight, UNIT_TEMPLATES.guardian]);
      const modifiedUnits = applySynergyBonuses([unit], synergies);
      
      // Frontline: +10% HP
      const expectedHp = Math.round(originalHp * 1.10); // 132
      expect(modifiedUnits[0]?.stats.hp).toBe(expectedHp);
      expect(modifiedUnits[0]?.maxHp).toBe(expectedHp);
      expect(modifiedUnits[0]?.currentHp).toBe(expectedHp);
    });

    it('should apply ATK bonus correctly', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.mage, 'mage-1');
      const originalAtk = unit.stats.atk; // 25
      
      const synergies = calculateSynergies([UNIT_TEMPLATES.mage, UNIT_TEMPLATES.warlock]);
      const modifiedUnits = applySynergyBonuses([unit], synergies);
      
      // Magic Circle: +15% ATK
      const expectedAtk = Math.round(originalAtk * 1.15); // 29
      expect(modifiedUnits[0]?.stats.atk).toBe(expectedAtk);
    });

    it('should apply all-stat bonus correctly', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
      const originalStats = { ...unit.stats };
      
      const synergies = calculateSynergies([
        UNIT_TEMPLATES.knight,
        UNIT_TEMPLATES.rogue,
        UNIT_TEMPLATES.priest,
      ]);
      
      const modifiedUnits = applySynergyBonuses([unit], synergies);
      const modifiedStats = modifiedUnits[0]?.stats;
      
      // Balanced: +5% all stats
      expect(modifiedStats?.hp).toBe(Math.round(originalStats.hp * 1.05));
      expect(modifiedStats?.atk).toBe(Math.round(originalStats.atk * 1.05));
      expect(modifiedStats?.armor).toBe(Math.round(originalStats.armor * 1.05));
      expect(modifiedStats?.speed).toBe(Math.round(originalStats.speed * 1.05));
    });

    it('should cap dodge at 50%', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.rogue, 'rogue-1');
      unit.stats.dodge = 45; // High base dodge
      
      // Apply multiple dodge bonuses that would exceed 50%
      const synergies = calculateSynergies([
        UNIT_TEMPLATES.rogue,
        UNIT_TEMPLATES.duelist, // Assassin Guild: +20% dodge
        UNIT_TEMPLATES.knight,
        UNIT_TEMPLATES.priest, // Balanced: +5% all (including dodge)
      ]);
      
      const modifiedUnits = applySynergyBonuses([unit], synergies);
      
      // Should be capped at 50%
      expect(modifiedUnits[0]?.stats.dodge).toBeLessThanOrEqual(50);
    });
  });

  describe('3. Несколько синергий стакаются', () => {
    it('should stack multiple synergies correctly', () => {
      // Team with multiple synergies: Frontline + Balanced
      const team = [
        UNIT_TEMPLATES.knight,    // Tank for Frontline + Balanced
        UNIT_TEMPLATES.guardian,  // Tank for Frontline
        UNIT_TEMPLATES.rogue,     // Melee DPS for Balanced
        UNIT_TEMPLATES.priest,    // Support for Balanced
      ];
      
      const synergies = calculateSynergies(team);
      
      // Should have both Frontline and Balanced
      expect(synergies.some(s => s.id === 'frontline')).toBe(true);
      expect(synergies.some(s => s.id === 'balanced')).toBe(true);
      
      // Calculate total HP bonus: Frontline (+10%) + Balanced (+5%) = +15%
      const hpBonus = calculateTotalStatBonus(synergies, 'hp');
      expect(hpBonus).toBeCloseTo(0.15, 2);
    });

    it('should apply stacked bonuses to units', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
      const originalHp = unit.stats.hp; // 120
      
      // Team with Frontline + Balanced synergies
      const synergies = calculateSynergies([
        UNIT_TEMPLATES.knight,
        UNIT_TEMPLATES.guardian,
        UNIT_TEMPLATES.rogue,
        UNIT_TEMPLATES.priest,
      ]);
      
      const modifiedUnits = applySynergyBonuses([unit], synergies);
      
      // Both bonuses should apply: +10% (Frontline) then +5% (Balanced)
      // 120 * 1.10 * 1.05 = 138.6 → 139
      const expectedHp = Math.round(Math.round(originalHp * 1.10) * 1.05);
      expect(modifiedUnits[0]?.stats.hp).toBe(expectedHp);
    });

    it('should handle complex synergy combinations', () => {
      // Team with Magic Circle + Arcane Army + Balanced
      const team = [
        UNIT_TEMPLATES.mage,        // Mage for Magic Circle + Arcane Army
        UNIT_TEMPLATES.warlock,     // Mage for Magic Circle
        UNIT_TEMPLATES.enchanter,   // Control for Arcane Army
        UNIT_TEMPLATES.knight,      // Tank for Balanced
        UNIT_TEMPLATES.rogue,       // Melee DPS for Balanced
        UNIT_TEMPLATES.priest,      // Support for Balanced
      ];
      
      const synergies = calculateSynergies(team);
      
      // Should detect all three synergies
      expect(synergies.some(s => s.id === 'magic_circle')).toBe(true);
      expect(synergies.some(s => s.id === 'arcane_army')).toBe(true);
      expect(synergies.some(s => s.id === 'balanced')).toBe(true);
      
      // Calculate total ATK bonus: Magic Circle (+15%) + Arcane Army (+10%) + Balanced (+5%) = +30%
      const atkBonus = calculateTotalStatBonus(synergies, 'atk');
      expect(atkBonus).toBeCloseTo(0.30, 2);
    });

    it('should not double-count same synergy', () => {
      // Team with 3 tanks (should only get Frontline once, not multiple times)
      const team = [
        UNIT_TEMPLATES.knight,
        UNIT_TEMPLATES.guardian,
        UNIT_TEMPLATES.berserker,
      ];
      
      const synergies = calculateSynergies(team);
      
      // Should have both Frontline and Iron Wall, but Frontline only once
      const frontlineSynergies = synergies.filter(s => s.id === 'frontline');
      const ironWallSynergies = synergies.filter(s => s.id === 'iron_wall');
      
      expect(frontlineSynergies).toHaveLength(1);
      expect(ironWallSynergies).toHaveLength(1);
    });
  });

  describe('4. Edge Cases and Validation', () => {
    it('should handle empty team', () => {
      const synergies = calculateSynergies([]);
      expect(synergies).toHaveLength(0);
    });

    it('should handle single unit team', () => {
      const synergies = calculateSynergies([UNIT_TEMPLATES.knight]);
      expect(synergies).toHaveLength(0);
    });

    it('should handle team with no synergies', () => {
      const team = [
        UNIT_TEMPLATES.knight,     // 1 tank (need 2+ for Frontline)
        UNIT_TEMPLATES.mage,       // 1 mage (need 2+ for Magic Circle)
        UNIT_TEMPLATES.archer,     // 1 ranged (need 2+ for Ranger Corps)
      ];
      
      const synergies = calculateSynergies(team);
      expect(synergies).toHaveLength(0);
    });

    it('should preserve original units when no synergies', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
      const originalStats = { ...unit.stats };
      
      const modifiedUnits = applySynergyBonuses([unit], []);
      
      expect(modifiedUnits[0]?.stats).toEqual(originalStats);
    });

    it('should handle units with zero stats gracefully', () => {
      const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
      unit.stats.dodge = 0; // Zero dodge
      
      const synergies = calculateSynergies([
        UNIT_TEMPLATES.rogue,
        UNIT_TEMPLATES.duelist, // Assassin Guild: +20% dodge
      ]);
      
      const modifiedUnits = applySynergyBonuses([unit], synergies);
      
      // 0 * 1.20 = 0, should remain 0
      expect(modifiedUnits[0]?.stats.dodge).toBe(0);
    });
  });
});
