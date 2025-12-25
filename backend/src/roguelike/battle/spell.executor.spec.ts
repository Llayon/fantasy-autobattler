/**
 * Spell Executor Tests
 *
 * @module roguelike/battle/tests
 */

import {
  checkAndExecuteSpells,
  createSpellExecutions,
  createEmptySpellConfig,
  SpellConfig,
} from './spell.executor';
import { BattleUnit } from '../../types/game.types';

describe('SpellExecutor', () => {
  // Helper to create a mock battle unit
  const createMockUnit = (
    id: string,
    team: 'player' | 'bot',
    currentHp: number,
    maxHp: number,
  ): BattleUnit => ({
    id,
    instanceId: `${team}_${id}_0`,
    name: id,
    team,
    currentHp,
    maxHp,
    alive: currentHp > 0,
    position: { x: 0, y: team === 'player' ? 0 : 9 },
    stats: {
      hp: maxHp,
      atk: 10,
      armor: 5,
      speed: 3,
      initiative: 10,
      dodge: 0,
      atkCount: 1,
    },
    range: 1,
    role: 'tank',
    cost: 5,
    abilities: [],
  });

  describe('createEmptySpellConfig', () => {
    it('should create empty spell config', () => {
      const config = createEmptySpellConfig();

      expect(config.playerSpells).toEqual([]);
      expect(config.enemySpells).toEqual([]);
    });
  });

  describe('createSpellExecutions', () => {
    it('should create spell executions from timings', () => {
      const timings = [
        { spellId: 'holy_light', timing: 'mid' as const },
        { spellId: 'rally', timing: 'early' as const },
      ];

      const executions = createSpellExecutions(timings);

      expect(executions).toHaveLength(2);
      expect(executions[0]).toEqual({
        spellId: 'holy_light',
        timing: 'mid',
        triggered: false,
      });
      expect(executions[1]).toEqual({
        spellId: 'rally',
        timing: 'early',
        triggered: false,
      });
    });

    it('should handle empty array', () => {
      const executions = createSpellExecutions([]);
      expect(executions).toEqual([]);
    });
  });

  describe('checkAndExecuteSpells', () => {
    it('should trigger early spells immediately', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 100, 100),
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'rally', timing: 'early', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
      // Spell cast events use 'ability' type with isSpell metadata
      expect(result.events.some((e) => e.type === 'ability' && e.metadata?.['isSpell'])).toBe(true);
    });

    it('should not trigger mid spells when HP is above 70%', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 80, 100), // 80% HP
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'holy_light', timing: 'mid', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(false);
      expect(result.events).toHaveLength(0);
    });

    it('should trigger mid spells when HP drops below 70%', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 60, 100), // 60% HP
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'holy_light', timing: 'mid', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(true);
      expect(result.events.some((e) => e.type === 'ability' && e.metadata?.['isSpell'])).toBe(true);
      expect(result.events.some((e) => e.type === 'heal')).toBe(true);
    });

    it('should trigger late spells when HP drops below 40%', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 30, 100), // 30% HP
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'holy_light', timing: 'late', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(true);
    });

    it('should not trigger late spells when HP is above 40%', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 50, 100), // 50% HP
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'holy_light', timing: 'late', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(false);
    });

    it('should not trigger already triggered spells', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 100, 100),
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'rally', timing: 'early', triggered: true }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.events).toHaveLength(0);
    });

    it('should execute damage spells correctly', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 60, 100),
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'death_coil', timing: 'mid', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(true);
      expect(result.events.some((e) => e.type === 'damage')).toBe(true);
      
      // Check that damage was applied
      const botUnit = result.units.find((u) => u.team === 'bot');
      expect(botUnit?.currentHp).toBeLessThan(100);
    });

    it('should execute both player and enemy spells', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 100, 100),
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'rally', timing: 'early', triggered: false }],
        enemySpells: [{ spellId: 'death_coil', timing: 'early', triggered: false }],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.playerSpells[0]?.triggered).toBe(true);
      expect(result.enemySpells[0]?.triggered).toBe(true);
      // Both spells should generate ability events with isSpell metadata
      expect(result.events.filter((e) => e.type === 'ability' && e.metadata?.['isSpell'])).toHaveLength(2);
    });

    it('should heal lowest HP ally with holy_light', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 40, 100), // Lowest HP
        createMockUnit('mage', 'player', 60, 100),
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'holy_light', timing: 'mid', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      // Find the healed unit (warrior with lowest HP)
      const healedUnit = result.units.find((u) => u.instanceId === 'player_warrior_0');
      expect(healedUnit?.currentHp).toBe(70); // 40 + 30 heal
    });

    it('should not heal above max HP', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 90, 100), // Only 10 HP missing
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      // Force trigger by using early timing
      const config: SpellConfig = {
        playerSpells: [{ spellId: 'holy_light', timing: 'early', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      const healedUnit = result.units.find((u) => u.instanceId === 'player_warrior_0');
      expect(healedUnit?.currentHp).toBe(100); // Capped at max HP
    });

    it('should kill unit when damage exceeds HP', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 100, 100),
        createMockUnit('skeleton', 'bot', 30, 100), // Low HP
      ];

      const config: SpellConfig = {
        playerSpells: [{ spellId: 'death_coil', timing: 'early', triggered: false }],
        enemySpells: [],
      };

      const result = checkAndExecuteSpells(config, units, 1);

      const deadUnit = result.units.find((u) => u.instanceId === 'bot_skeleton_0');
      expect(deadUnit?.currentHp).toBe(0);
      expect(deadUnit?.alive).toBe(false);
      expect(result.events.some((e) => e.type === 'death')).toBe(true);
    });

    it('should handle empty spell config', () => {
      const units: BattleUnit[] = [
        createMockUnit('warrior', 'player', 100, 100),
        createMockUnit('skeleton', 'bot', 100, 100),
      ];

      const config = createEmptySpellConfig();

      const result = checkAndExecuteSpells(config, units, 1);

      expect(result.events).toHaveLength(0);
      expect(result.playerSpells).toEqual([]);
      expect(result.enemySpells).toEqual([]);
    });
  });
});
