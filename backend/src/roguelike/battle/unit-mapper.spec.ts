/**
 * Unit Mapper Tests
 *
 * Tests for converting RoguelikeUnit to UnitTemplate with Core 2.0 mechanics.
 *
 * @module roguelike/battle/unit-mapper.spec
 */

import { mapRoguelikeUnitToTemplate } from './unit-mapper';
import { RoguelikeUnit } from '../types/unit.types';

describe('Unit Mapper', () => {
  describe('mapRoguelikeUnitToTemplate', () => {
    it('should map basic unit without Core 2.0 mechanics', () => {
      const unit: RoguelikeUnit = {
        id: 'footman',
        name: 'Footman',
        nameRu: 'Пехотинец',
        faction: 'humans',
        role: 'tank',
        tier: 1,
        cost: 3,
        purchasable: true,
        hp: 100,
        atk: 12,
        armor: 20,
        speed: 2,
        initiative: 8,
        range: 1,
        attackCount: 1,
        dodge: 5,
        resolve: 70,
        resolveResist: 0,
      };

      const template = mapRoguelikeUnitToTemplate(unit, 1);

      expect(template.id).toBe('footman');
      expect(template.stats.hp).toBe(100);
      expect(template.resolve).toBe(70);
      expect(template.faction).toBe('humans');
      expect(template.tags).toBeUndefined();
      expect(template.ammo).toBeUndefined();
    });

    it('should map cavalry unit with charge tags', () => {
      const cavalry: RoguelikeUnit = {
        id: 'light_cavalry',
        name: 'Light Cavalry',
        nameRu: 'Лёгкая кавалерия',
        faction: 'humans',
        role: 'melee_dps',
        tier: 1,
        cost: 6,
        purchasable: true,
        hp: 75,
        atk: 24,
        armor: 10,
        speed: 4,
        initiative: 16,
        range: 1,
        attackCount: 1,
        dodge: 15,
        resolve: 70,
        resolveResist: 0,
        tags: ['cavalry', 'charge'],
      };

      const template = mapRoguelikeUnitToTemplate(cavalry, 1);

      expect(template.tags).toEqual(['cavalry', 'charge']);
      expect(template.ammo).toBeUndefined();
    });

    it('should map hunter with ammunition', () => {
      const hunter: RoguelikeUnit = {
        id: 'hunter',
        name: 'Hunter',
        nameRu: 'Охотник',
        faction: 'humans',
        role: 'ranged_dps',
        tier: 1,
        cost: 5,
        purchasable: true,
        hp: 55,
        atk: 22,
        armor: 5,
        speed: 3,
        initiative: 15,
        range: 5,
        attackCount: 1,
        dodge: 12,
        resolve: 60,
        resolveResist: 0,
        ammunition: 6,
      };

      const template = mapRoguelikeUnitToTemplate(hunter, 1);

      expect(template.ammo).toBe(6);
      expect(template.tags).toBeUndefined();
    });

    it('should map spearman with phalanx tags', () => {
      const spearman: RoguelikeUnit = {
        id: 'spearman',
        name: 'Spearman',
        nameRu: 'Копейщик',
        faction: 'humans',
        role: 'tank',
        tier: 1,
        cost: 4,
        purchasable: true,
        hp: 90,
        atk: 14,
        armor: 15,
        speed: 2,
        initiative: 9,
        range: 1,
        attackCount: 1,
        dodge: 8,
        resolve: 75,
        resolveResist: 0,
        tags: ['spear_wall', 'phalanx'],
      };

      const template = mapRoguelikeUnitToTemplate(spearman, 1);

      expect(template.tags).toEqual(['spear_wall', 'phalanx']);
    });

    it('should map wraith with flanker and riposte tags', () => {
      const wraith: RoguelikeUnit = {
        id: 'wraith',
        name: 'Wraith',
        nameRu: 'Призрак',
        faction: 'undead',
        role: 'melee_dps',
        tier: 1,
        cost: 6,
        purchasable: true,
        hp: 60,
        atk: 26,
        armor: 6,
        speed: 4,
        initiative: 19,
        range: 1,
        attackCount: 1,
        dodge: 25,
        resolve: 100,
        resolveResist: 0,
        tags: ['flanker', 'riposte'],
      };

      const template = mapRoguelikeUnitToTemplate(wraith, 1);

      expect(template.tags).toEqual(['flanker', 'riposte']);
      expect(template.faction).toBe('undead');
    });

    it('should apply tier multipliers to stats', () => {
      const unit: RoguelikeUnit = {
        id: 'footman',
        name: 'Footman',
        nameRu: 'Пехотинец',
        faction: 'humans',
        role: 'tank',
        tier: 1,
        cost: 3,
        purchasable: true,
        hp: 100,
        atk: 12,
        armor: 20,
        speed: 2,
        initiative: 8,
        range: 1,
        attackCount: 1,
        dodge: 5,
        resolve: 70,
        resolveResist: 0,
      };

      // T1: ×1.0
      const t1 = mapRoguelikeUnitToTemplate(unit, 1);
      expect(t1.stats.hp).toBe(100);
      expect(t1.stats.atk).toBe(12);
      expect(t1.stats.armor).toBe(20);

      // T2: ×1.5
      const t2 = mapRoguelikeUnitToTemplate(unit, 2);
      expect(t2.stats.hp).toBe(150);
      expect(t2.stats.atk).toBe(18);
      expect(t2.stats.armor).toBe(30);

      // T3: ×2.0
      const t3 = mapRoguelikeUnitToTemplate(unit, 3);
      expect(t3.stats.hp).toBe(200);
      expect(t3.stats.atk).toBe(24);
      expect(t3.stats.armor).toBe(40);
    });
  });
});
