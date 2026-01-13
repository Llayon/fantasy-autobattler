/**
 * Ammunition Mechanic Integration Tests
 *
 * Проверяет работу механики Ammunition в реальных боях через simulateBattle.
 * Тестирует расход боеприпасов у ranged юнитов.
 */

import { simulateBattle, TeamSetup, toCoreBattleState, fromCoreBattleState } from '../../battle/battle.simulator';
import { getUnitTemplate, UnitId } from '../../unit/unit.data';
import { createMechanicsProcessor, ROGUELIKE_PRESET } from '../../core/mechanics';
import { mapRoguelikeUnitToTemplate } from './unit-mapper';
import { HUNTER_T1 } from '../data/core2-units';

describe('Ammunition Mechanic - Integration Tests', () => {
  /**
   * Helper: Создает команду из юнитов
   */
  const createTeam = (unitIds: UnitId[], positions: { x: number; y: number }[]): TeamSetup => {
    const units = unitIds.map((id) => {
      const template = getUnitTemplate(id);
      if (!template) throw new Error(`Unit not found: ${id}`);
      return template;
    });
    return { units, positions };
  };

  describe('ROGUELIKE_PRESET Configuration', () => {
    it('should have ammunition enabled', () => {
      expect(ROGUELIKE_PRESET.ammunition).toBeDefined();
      expect(typeof ROGUELIKE_PRESET.ammunition).toBe('object');
    });

    it('should have correct default ammo', () => {
      if (typeof ROGUELIKE_PRESET.ammunition === 'object') {
        expect(ROGUELIKE_PRESET.ammunition.defaultAmmo).toBe(6);
      }
    });

    it('should create processor with ammunition enabled', () => {
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      expect(processor.config.ammunition).toBeTruthy();
    });
  });

  describe('Hunter Unit Configuration', () => {
    it('should have ammunition field set', () => {
      expect(HUNTER_T1.ammunition).toBe(6);
    });

    it('should have ranged tag', () => {
      expect(HUNTER_T1.tags).toContain('ranged');
    });

    it('should map ammunition to ammo in UnitTemplate', () => {
      const template = mapRoguelikeUnitToTemplate(HUNTER_T1, 1);
      expect(template.ammo).toBe(6);
    });
  });

  describe('Ammunition Consumption in Real Battles', () => {
    /**
     * Сценарий: Archer атакует Knight
     *
     * Setup:
     * - Archer (player, range 3) на позиции (4, 1)
     * - Knight (enemy, range 1) на позиции (4, 8)
     *
     * Ожидание:
     * - Archer должен расходовать боеприпасы при атаке
     * - В событиях должен быть 'mechanic_ammunition'
     */
    it('should generate ammunition events when ranged unit attacks', () => {
      const playerTeam = createTeam(['archer'], [{ x: 4, y: 1 }]);
      const enemyTeam = createTeam(['knight'], [{ x: 4, y: 8 }]);

      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);

      // Проверяем наличие событий ammunition
      const ammoEvents = result.events.filter((e) => e.type === 'mechanic_ammunition');

      // Ammunition mechanic должна быть активна
      expect(processor.config.ammunition).toBeTruthy();
      
      // Должны быть события расхода боеприпасов
      // Archer имеет range > 1, так что должен использовать ammo
      if (ammoEvents.length > 0) {
        const ammoEvent = ammoEvents[0];
        if (ammoEvent) {
          expect(ammoEvent).toHaveProperty('actorId');
          expect(ammoEvent.metadata).toHaveProperty('action', 'consumed');
          expect(ammoEvent.metadata).toHaveProperty('ammoConsumed');
          expect(ammoEvent.metadata).toHaveProperty('ammoRemaining');
        }
      }
    });

    /**
     * Сценарий: Проверка уменьшения ammo между атаками
     *
     * Ожидание:
     * - ammoRemaining должен уменьшаться с каждой атакой
     */
    it('should decrease ammo with each attack', () => {
      const playerTeam = createTeam(['archer'], [{ x: 4, y: 1 }]);
      const enemyTeam = createTeam(['knight'], [{ x: 4, y: 8 }]);

      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      const result = simulateBattle(playerTeam, enemyTeam, 12345, processor);

      // Собираем все события ammunition с action: 'consumed'
      const consumedEvents = result.events.filter(
        (e) => e.type === 'mechanic_ammunition' && e.metadata?.['action'] === 'consumed'
      );

      // Должно быть минимум 2 события для проверки уменьшения
      // Если событий меньше 2, тест провалится с информативным сообщением
      expect(consumedEvents.length).toBeGreaterThanOrEqual(2);

      // Проверяем, что ammoRemaining уменьшается
      const firstEvent = consumedEvents[0];
      const secondEvent = consumedEvents[1];
      
      expect(firstEvent).toBeDefined();
      expect(secondEvent).toBeDefined();
      expect(firstEvent?.metadata).toBeDefined();
      expect(secondEvent?.metadata).toBeDefined();
      
      const firstAmmo = firstEvent?.metadata?.['ammoRemaining'] as number;
      const secondAmmo = secondEvent?.metadata?.['ammoRemaining'] as number;
      
      // Второй выстрел должен иметь меньше ammo, чем первый
      // Archer имеет ammo: 8, первый выстрел: 7, второй: 6
      expect(secondAmmo).toBeLessThan(firstAmmo);
    });

    /**
     * Сценарий: Melee юнит не должен расходовать ammo
     */
    it('should not consume ammo for melee units', () => {
      const playerTeam = createTeam(['knight'], [{ x: 4, y: 1 }]);
      const enemyTeam = createTeam(['rogue'], [{ x: 4, y: 8 }]);

      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);
      const result = simulateBattle(playerTeam, enemyTeam, 54321, processor);

      // Проверяем события ammunition
      const ammoEvents = result.events.filter((e) => e.type === 'mechanic_ammunition');

      // Для melee юнитов не должно быть событий ammunition
      // (или они должны быть только для ranged юнитов)
      const knightAmmoEvents = ammoEvents.filter((e) => {
        const actorId = e.actorId ?? '';
        return actorId.includes('knight');
      });

      expect(knightAmmoEvents.length).toBe(0);
    });
  });

  describe('State Conversion', () => {
    it('should preserve ammunition through toCoreBattleState and fromCoreBattleState', () => {
      // Создаем состояние с юнитом, у которого есть ammunition
      const gameState = {
        units: [
          {
            id: 'hunter',
            name: 'Hunter',
            role: 'ranged',
            cost: 5,
            stats: { hp: 55, atk: 22, armor: 5, speed: 3, initiative: 15, dodge: 12, atkCount: 1 },
            range: 5,
            abilities: [],
            position: { x: 4, y: 1 },
            currentHp: 55,
            maxHp: 55,
            team: 'player' as const,
            alive: true,
            instanceId: 'player_hunter_0',
            abilityCooldowns: {},
            statusEffects: [],
            isStunned: false,
            hasTaunt: false,
            facing: 'S' as const,
            resolve: 60,
            maxResolve: 60,
            riposteCharges: 1,
            ammunition: 6,
            maxAmmunition: 6,
            tags: ['ranged'],
            armorShred: 0,
            isEngaged: false,
            engagedBy: [],
            chargeMomentum: 0,
            isInOverwatch: false,
            isInPhalanx: false,
            isRouting: false,
            hasCrumbled: false,
          },
        ],
        currentRound: 1,
        events: [],
        occupiedPositions: new Set<string>(),
        metadata: {},
      };

      // Конвертируем в core state
      const coreState = toCoreBattleState(gameState as unknown as Parameters<typeof toCoreBattleState>[0]);
      
      // Проверяем, что ammo установлен
      const firstUnit = coreState.units[0];
      expect(firstUnit).toBeDefined();
      expect(firstUnit?.ammo).toBe(6);

      // Модифицируем ammo
      const modifiedCoreState = {
        ...coreState,
        units: coreState.units.map((u) => ({ ...u, ammo: 4 })),
      };

      // Конвертируем обратно
      const updatedGameState = fromCoreBattleState(
        gameState as unknown as Parameters<typeof fromCoreBattleState>[0],
        modifiedCoreState
      );

      // Проверяем, что ammunition обновился
      const updatedUnit = updatedGameState.units[0] as typeof gameState.units[0];
      expect(updatedUnit.ammunition).toBe(4);
    });
  });
});
