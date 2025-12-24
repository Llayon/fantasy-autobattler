/**
 * Unit tests for Synergy System.
 * Tests synergy detection and bonus application.
 * 
 * @fileoverview Comprehensive tests for calculateSynergies and applySynergyBonuses.
 */

import {
  calculateSynergies,
  applySynergyBonuses,
  getSynergyById,
  getAllSynergies,
  calculateTotalStatBonus,
  formatSynergyBonus,
  SYNERGIES,
  ActiveSynergy,
} from './synergies';
import { UnitTemplate, BattleUnit } from '../../types/game.types';
import { UNIT_TEMPLATES } from '../units/unit.data';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Create a battle unit from a template for testing.
 */
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
// SYNERGY CALCULATION TESTS
// =============================================================================

describe('calculateSynergies', () => {
  it('should return empty array for empty team', () => {
    const result = calculateSynergies([]);
    expect(result).toEqual([]);
  });

  it('should detect Frontline synergy with 2 tanks', () => {
    const team = [UNIT_TEMPLATES.knight, UNIT_TEMPLATES.guardian];
    const synergies = calculateSynergies(team);
    
    const frontline = synergies.find(s => s.id === 'frontline');
    expect(frontline).toBeDefined();
    expect(frontline?.name).toBe('Передовая линия');
  });

  it('should detect Magic Circle synergy with 2 mages', () => {
    const team = [UNIT_TEMPLATES.mage, UNIT_TEMPLATES.warlock];
    const synergies = calculateSynergies(team);
    
    const magicCircle = synergies.find(s => s.id === 'magic_circle');
    expect(magicCircle).toBeDefined();
    expect(magicCircle?.bonuses[0]?.percentage).toBe(0.15);
  });

  it('should detect Balanced synergy with tank, melee dps, and support', () => {
    const team = [
      UNIT_TEMPLATES.knight,
      UNIT_TEMPLATES.rogue,
      UNIT_TEMPLATES.priest,
    ];
    const synergies = calculateSynergies(team);
    
    const balanced = synergies.find(s => s.id === 'balanced');
    expect(balanced).toBeDefined();
    expect(balanced?.bonuses[0]?.stat).toBe('all');
  });

  it('should detect multiple synergies when requirements overlap', () => {
    const team = [
      UNIT_TEMPLATES.knight,
      UNIT_TEMPLATES.guardian,
      UNIT_TEMPLATES.rogue,
      UNIT_TEMPLATES.priest,
    ];
    const synergies = calculateSynergies(team);
    
    // Should have Frontline (2 tanks) and Balanced (tank + melee + support)
    expect(synergies.some(s => s.id === 'frontline')).toBe(true);
    expect(synergies.some(s => s.id === 'balanced')).toBe(true);
  });

  it('should NOT detect Glass Cannon if team has tanks', () => {
    const team = [
      UNIT_TEMPLATES.mage,
      UNIT_TEMPLATES.warlock,
      UNIT_TEMPLATES.elementalist,
      UNIT_TEMPLATES.knight, // Tank present
    ];
    const synergies = calculateSynergies(team);
    
    const glassCannon = synergies.find(s => s.id === 'glass_cannon');
    expect(glassCannon).toBeUndefined();
  });

  it('should detect Glass Cannon with 3 mages and no tanks', () => {
    const team = [
      UNIT_TEMPLATES.mage,
      UNIT_TEMPLATES.warlock,
      UNIT_TEMPLATES.elementalist,
    ];
    const synergies = calculateSynergies(team);
    
    const glassCannon = synergies.find(s => s.id === 'glass_cannon');
    expect(glassCannon).toBeDefined();
  });

  it('should include contributing units in active synergy', () => {
    const team = [UNIT_TEMPLATES.knight, UNIT_TEMPLATES.guardian];
    const synergies = calculateSynergies(team);
    
    const frontline = synergies.find(s => s.id === 'frontline');
    expect(frontline?.contributingUnits).toContain('knight');
    expect(frontline?.contributingUnits).toContain('guardian');
  });
});

// =============================================================================
// BONUS APPLICATION TESTS
// =============================================================================

describe('applySynergyBonuses', () => {
  it('should return unchanged units when no synergies', () => {
    const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
    const result = applySynergyBonuses([unit], []);
    
    expect(result[0]?.stats.hp).toBe(unit.stats.hp);
    expect(result[0]?.stats.atk).toBe(unit.stats.atk);
  });

  it('should apply HP bonus from Frontline synergy', () => {
    const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
    const originalHp = unit.stats.hp;
    
    const synergies = calculateSynergies([
      UNIT_TEMPLATES.knight,
      UNIT_TEMPLATES.guardian,
    ]);
    
    const result = applySynergyBonuses([unit], synergies);
    
    // Frontline gives +10% HP
    expect(result[0]?.stats.hp).toBe(Math.round(originalHp * 1.10));
    expect(result[0]?.maxHp).toBe(Math.round(originalHp * 1.10));
  });

  it('should apply ATK bonus from Magic Circle synergy', () => {
    const unit = createBattleUnit(UNIT_TEMPLATES.mage, 'mage-1');
    const originalAtk = unit.stats.atk;
    
    const synergies = calculateSynergies([
      UNIT_TEMPLATES.mage,
      UNIT_TEMPLATES.warlock,
    ]);
    
    const result = applySynergyBonuses([unit], synergies);
    
    // Magic Circle gives +15% ATK
    expect(result[0]?.stats.atk).toBe(Math.round(originalAtk * 1.15));
  });

  it('should apply all-stat bonus from Balanced synergy', () => {
    const unit = createBattleUnit(UNIT_TEMPLATES.knight, 'knight-1');
    const originalHp = unit.stats.hp;
    const originalAtk = unit.stats.atk;
    
    const synergies = calculateSynergies([
      UNIT_TEMPLATES.knight,
      UNIT_TEMPLATES.rogue,
      UNIT_TEMPLATES.priest,
    ]);
    
    const result = applySynergyBonuses([unit], synergies);
    
    // Balanced gives +5% to all stats
    expect(result[0]?.stats.hp).toBe(Math.round(originalHp * 1.05));
    expect(result[0]?.stats.atk).toBe(Math.round(originalAtk * 1.05));
  });

  it('should cap dodge at 50%', () => {
    const unit = createBattleUnit(UNIT_TEMPLATES.rogue, 'rogue-1');
    unit.stats.dodge = 45; // High dodge
    
    // Create a synergy that would push dodge over 50%
    const mockSynergy: ActiveSynergy = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      requiredRoles: [],
      bonuses: [{ stat: 'dodge', percentage: 0.50 }],
      icon: '🧪',
      contributingUnits: [],
    };
    
    const result = applySynergyBonuses([unit], [mockSynergy]);
    
    // Should be capped at 50%
    expect(result[0]?.stats.dodge).toBeLessThanOrEqual(50);
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('getSynergyById', () => {
  it('should return synergy by ID', () => {
    const synergy = getSynergyById('frontline');
    expect(synergy).toBeDefined();
    expect(synergy?.name).toBe('Передовая линия');
  });

  it('should return undefined for unknown ID', () => {
    const synergy = getSynergyById('unknown_synergy');
    expect(synergy).toBeUndefined();
  });
});

describe('getAllSynergies', () => {
  it('should return all synergies', () => {
    const synergies = getAllSynergies();
    expect(synergies.length).toBe(SYNERGIES.length);
    expect(synergies.length).toBeGreaterThan(0);
  });
});

describe('calculateTotalStatBonus', () => {
  it('should calculate total HP bonus from multiple synergies', () => {
    const synergies = calculateSynergies([
      UNIT_TEMPLATES.knight,
      UNIT_TEMPLATES.guardian,
      UNIT_TEMPLATES.rogue,
      UNIT_TEMPLATES.priest,
    ]);
    
    const hpBonus = calculateTotalStatBonus(synergies, 'hp');
    
    // Frontline (+10% HP) + Balanced (+5% all)
    expect(hpBonus).toBeGreaterThanOrEqual(0.10);
  });

  it('should return 0 for no matching bonuses', () => {
    const synergies = calculateSynergies([
      UNIT_TEMPLATES.mage,
      UNIT_TEMPLATES.warlock,
    ]);
    
    // Magic Circle only gives ATK bonus, not armor
    const armorBonus = calculateTotalStatBonus(synergies, 'armor');
    expect(armorBonus).toBe(0);
  });
});

describe('formatSynergyBonus', () => {
  it('should format percentage bonus correctly', () => {
    const result = formatSynergyBonus({ stat: 'hp', percentage: 0.10 });
    expect(result).toBe('+10% HP');
  });

  it('should format all-stat bonus correctly', () => {
    const result = formatSynergyBonus({ stat: 'all', percentage: 0.05 });
    expect(result).toBe('+5% все характеристики');
  });

  it('should include flat bonus when present', () => {
    const result = formatSynergyBonus({ stat: 'atk', percentage: 0.10, flat: 5 });
    expect(result).toBe('+10% ATK (+5)');
  });
});
