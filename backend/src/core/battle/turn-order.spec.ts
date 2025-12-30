/**
 * Unit tests for core turn order system.
 * Tests initiative-based sorting, deterministic ordering, and queue management.
 * Uses minimal TurnOrderUnit interface instead of game-specific BattleUnit.
 *
 * @module core/battle/turn-order.spec
 */

import {
  buildTurnQueue,
  getNextUnit,
  removeDeadUnits,
  removeInactiveUnits,
  hasLivingUnits,
  hasActiveUnits,
  getLivingUnitsByTeam,
  countLivingUnitsByTeam,
  findUnitById,
  getTurnOrderPreview,
  validateTurnQueue,
  isTurnQueueSorted,
  advanceToNextTurn,
  shouldStartNewRound,
  canUnitAct,
  TurnOrderUnit,
  ResolveState,
} from './turn-order';

describe('Turn Order System (Core)', () => {
  // Helper function to create a mock unit using minimal TurnOrderUnit interface
  const createMockUnit = (
    id: string,
    initiative: number,
    speed: number,
    team: 'player' | 'bot' = 'player',
    alive: boolean = true,
    currentHp: number = 100,
    resolveState?: ResolveState
  ): TurnOrderUnit => {
    const unit: TurnOrderUnit = {
      id,
      instanceId: `${id}_1`,
      alive,
      currentHp,
      stats: {
        initiative,
        speed,
      },
      team,
    };
    if (resolveState !== undefined) {
      unit.resolveState = resolveState;
    }
    return unit;
  };

  describe('buildTurnQueue', () => {
    it('should sort by initiative descending (primary)', () => {
      const units = [
        createMockUnit('knight', 4, 2),
        createMockUnit('rogue', 9, 4),
        createMockUnit('mage', 6, 2),
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual(['rogue', 'mage', 'knight']);
      expect(queue.map((u) => u.stats.initiative)).toEqual([9, 6, 4]);
    });

    it('should sort by speed descending when initiative is equal', () => {
      const units = [
        createMockUnit('slow', 5, 1),
        createMockUnit('fast', 5, 4),
        createMockUnit('medium', 5, 2),
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual(['fast', 'medium', 'slow']);
      expect(queue.map((u) => u.stats.speed)).toEqual([4, 2, 1]);
    });

    it('should sort by ID alphabetically when initiative and speed are equal', () => {
      const units = [
        createMockUnit('zebra', 5, 2),
        createMockUnit('alpha', 5, 2),
        createMockUnit('beta', 5, 2),
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual(['alpha', 'beta', 'zebra']);
    });

    it('should exclude dead units from queue', () => {
      const units = [
        createMockUnit('alive1', 8, 3, 'player', true),
        createMockUnit('dead', 9, 4, 'player', false),
        createMockUnit('alive2', 6, 2, 'player', true),
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual(['alive1', 'alive2']);
      expect(queue.every((u) => u.alive)).toBe(true);
    });

    it('should handle complex sorting with all criteria', () => {
      const units = [
        createMockUnit('unit_c', 5, 2), // Same init/speed, ID tiebreaker
        createMockUnit('unit_a', 5, 2), // Same init/speed, ID tiebreaker
        createMockUnit('fast_unit', 5, 3), // Same init, higher speed
        createMockUnit('high_init', 7, 1), // Highest initiative
        createMockUnit('unit_b', 5, 2), // Same init/speed, ID tiebreaker
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual([
        'high_init', // Initiative 7
        'fast_unit', // Initiative 5, Speed 3
        'unit_a', // Initiative 5, Speed 2, ID 'a'
        'unit_b', // Initiative 5, Speed 2, ID 'b'
        'unit_c', // Initiative 5, Speed 2, ID 'c'
      ]);
    });

    it('should be deterministic with identical inputs', () => {
      const units = [
        createMockUnit('rogue', 9, 4),
        createMockUnit('knight', 4, 2),
        createMockUnit('mage', 6, 2),
      ];

      const queue1 = buildTurnQueue([...units]);
      const queue2 = buildTurnQueue([...units]);

      expect(queue1.map((u) => u.id)).toEqual(queue2.map((u) => u.id));
    });
  });

  describe('getNextUnit', () => {
    it('should return first living unit', () => {
      const units = [
        createMockUnit('first', 9, 4, 'player', true),
        createMockUnit('second', 6, 2, 'player', true),
      ];

      const next = getNextUnit(units);

      expect(next?.id).toBe('first');
    });

    it('should skip dead units and return first living unit', () => {
      const units = [
        createMockUnit('dead1', 9, 4, 'player', false),
        createMockUnit('dead2', 8, 3, 'player', false),
        createMockUnit('alive', 6, 2, 'player', true),
      ];

      const next = getNextUnit(units);

      expect(next?.id).toBe('alive');
    });

    it('should return null when no living units', () => {
      const units = [
        createMockUnit('dead1', 9, 4, 'player', false),
        createMockUnit('dead2', 6, 2, 'player', false),
      ];

      const next = getNextUnit(units);

      expect(next).toBeNull();
    });

    it('should return null for empty queue', () => {
      const next = getNextUnit([]);

      expect(next).toBeNull();
    });
  });

  describe('removeDeadUnits', () => {
    it('should remove dead units and preserve order', () => {
      const units = [
        createMockUnit('alive1', 9, 4, 'player', true),
        createMockUnit('dead', 8, 3, 'player', false),
        createMockUnit('alive2', 6, 2, 'player', true),
      ];

      const cleaned = removeDeadUnits(units);

      expect(cleaned.map((u) => u.id)).toEqual(['alive1', 'alive2']);
      expect(cleaned.every((u) => u.alive)).toBe(true);
    });

    it('should return empty array when all units are dead', () => {
      const units = [
        createMockUnit('dead1', 9, 4, 'player', false),
        createMockUnit('dead2', 6, 2, 'player', false),
      ];

      const cleaned = removeDeadUnits(units);

      expect(cleaned).toEqual([]);
    });

    it('should return same array when all units are alive', () => {
      const units = [
        createMockUnit('alive1', 9, 4, 'player', true),
        createMockUnit('alive2', 6, 2, 'player', true),
      ];

      const cleaned = removeDeadUnits(units);

      expect(cleaned.length).toBe(2);
      expect(cleaned.map((u) => u.id)).toEqual(['alive1', 'alive2']);
    });
  });

  describe('hasLivingUnits', () => {
    it('should return true when living units exist', () => {
      const units = [
        createMockUnit('alive', 9, 4, 'player', true),
        createMockUnit('dead', 6, 2, 'player', false),
      ];

      expect(hasLivingUnits(units)).toBe(true);
    });

    it('should return false when no living units', () => {
      const units = [
        createMockUnit('dead1', 9, 4, 'player', false),
        createMockUnit('dead2', 6, 2, 'player', false),
      ];

      expect(hasLivingUnits(units)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasLivingUnits([])).toBe(false);
    });
  });

  describe('getLivingUnitsByTeam', () => {
    it('should return living units from specified team', () => {
      const units = [
        createMockUnit('player1', 9, 4, 'player', true),
        createMockUnit('bot1', 8, 3, 'bot', true),
        createMockUnit('player2', 6, 2, 'player', false), // Dead
        createMockUnit('bot2', 5, 1, 'bot', true),
      ];

      const playerUnits = getLivingUnitsByTeam(units, 'player');
      const botUnits = getLivingUnitsByTeam(units, 'bot');

      expect(playerUnits.map((u) => u.id)).toEqual(['player1']);
      expect(botUnits.map((u) => u.id)).toEqual(['bot1', 'bot2']);
    });
  });

  describe('countLivingUnitsByTeam', () => {
    it('should count living units by team', () => {
      const units = [
        createMockUnit('player1', 9, 4, 'player', true),
        createMockUnit('player2', 8, 3, 'player', true),
        createMockUnit('player3', 7, 2, 'player', false), // Dead
        createMockUnit('bot1', 6, 1, 'bot', true),
        createMockUnit('bot2', 5, 1, 'bot', false), // Dead
      ];

      const counts = countLivingUnitsByTeam(units);

      expect(counts).toEqual({ player: 2, bot: 1 });
    });

    it('should return zero counts for empty array', () => {
      const counts = countLivingUnitsByTeam([]);

      expect(counts).toEqual({ player: 0, bot: 0 });
    });
  });

  describe('findUnitById', () => {
    it('should find unit by instance ID', () => {
      const units = [createMockUnit('unit1', 9, 4), createMockUnit('unit2', 6, 2)];

      const found = findUnitById(units, 'unit2_1');

      expect(found?.id).toBe('unit2');
    });

    it('should return null when unit not found', () => {
      const units = [createMockUnit('unit1', 9, 4)];

      const found = findUnitById(units, 'nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('getTurnOrderPreview', () => {
    it('should return turn order preview for next few turns', () => {
      const units = [
        createMockUnit('first', 9, 4),
        createMockUnit('second', 6, 2),
        createMockUnit('third', 4, 1),
      ];

      const preview = getTurnOrderPreview(units, 5);

      expect(preview).toEqual(['first_1', 'second_1', 'third_1', 'first_1', 'second_1']);
    });

    it('should handle dead units in preview', () => {
      const units = [
        createMockUnit('alive1', 9, 4, 'player', true),
        createMockUnit('dead', 8, 3, 'player', false),
        createMockUnit('alive2', 6, 2, 'player', true),
      ];

      const preview = getTurnOrderPreview(units, 4);

      expect(preview).toEqual(['alive1_1', 'alive2_1', 'alive1_1', 'alive2_1']);
    });
  });

  describe('validateTurnQueue', () => {
    it('should validate correct queue', () => {
      const units = [
        createMockUnit('unit1', 9, 4, 'player', true, 50),
        createMockUnit('unit2', 6, 2, 'player', true, 75),
      ];

      const validation = validateTurnQueue(units);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect duplicate instance IDs', () => {
      const unit1 = createMockUnit('unit1', 9, 4);
      const unit2 = createMockUnit('unit2', 6, 2);
      unit2.instanceId = unit1.instanceId; // Duplicate ID

      const validation = validateTurnQueue([unit1, unit2]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(`Duplicate unit instance ID: ${unit1.instanceId}`);
    });

    it('should detect invalid HP states', () => {
      const units = [
        createMockUnit('negative_hp', 9, 4, 'player', true, -10),
        createMockUnit('zero_hp_alive', 6, 2, 'player', true, 0),
        createMockUnit('hp_but_dead', 4, 1, 'player', false, 50),
      ];

      const validation = validateTurnQueue(units);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Unit negative_hp_1 has negative HP: -10');
      expect(validation.errors).toContain('Unit zero_hp_alive_1 has 0 HP but is marked alive');
      expect(validation.errors).toContain('Unit hp_but_dead_1 has HP but is marked dead');
    });
  });

  describe('isTurnQueueSorted', () => {
    it('should return true for properly sorted queue', () => {
      const units = buildTurnQueue([
        createMockUnit('high', 9, 4),
        createMockUnit('medium', 6, 2),
        createMockUnit('low', 4, 1),
      ]);

      expect(isTurnQueueSorted(units)).toBe(true);
    });

    it('should return false for improperly sorted queue', () => {
      const units = [
        createMockUnit('low', 4, 1),
        createMockUnit('high', 9, 4), // Out of order
        createMockUnit('medium', 6, 2),
      ];

      expect(isTurnQueueSorted(units)).toBe(false);
    });

    it('should handle dead units in sorting check', () => {
      const units = [
        createMockUnit('high', 9, 4, 'player', true),
        createMockUnit('dead', 8, 3, 'player', false), // Dead unit
        createMockUnit('low', 6, 2, 'player', true),
      ];

      expect(isTurnQueueSorted(units)).toBe(true);
    });
  });

  describe('advanceToNextTurn', () => {
    it('should remove current unit and return remaining queue', () => {
      const queue = [
        createMockUnit('current', 9, 4),
        createMockUnit('next', 6, 2),
        createMockUnit('after', 4, 1),
      ];

      const newQueue = advanceToNextTurn(queue, queue);

      expect(newQueue.map((u) => u.id)).toEqual(['next', 'after']);
    });

    it('should rebuild queue when no living units remain', () => {
      const currentQueue = [createMockUnit('last', 4, 1, 'player', true)];

      const allUnits = [
        createMockUnit('unit1', 9, 4, 'player', true),
        createMockUnit('unit2', 6, 2, 'player', true),
        createMockUnit('last', 4, 1, 'player', true),
      ];

      const newQueue = advanceToNextTurn(currentQueue, allUnits);

      // Should rebuild from all units
      expect(newQueue.map((u) => u.id)).toEqual(['unit1', 'unit2', 'last']);
    });
  });

  describe('shouldStartNewRound', () => {
    it('should return true when queue is empty but living units exist', () => {
      const emptyQueue: TurnOrderUnit[] = [];
      const allUnits = [
        createMockUnit('unit1', 9, 4, 'player', true),
        createMockUnit('unit2', 6, 2, 'player', true),
      ];

      expect(shouldStartNewRound(emptyQueue, allUnits)).toBe(true);
    });

    it('should return false when living units remain in queue', () => {
      const queue = [createMockUnit('remaining', 6, 2, 'player', true)];
      const allUnits = [
        createMockUnit('unit1', 9, 4, 'player', true),
        createMockUnit('remaining', 6, 2, 'player', true),
      ];

      expect(shouldStartNewRound(queue, allUnits)).toBe(false);
    });

    it('should return false when no living units exist anywhere', () => {
      const emptyQueue: TurnOrderUnit[] = [];
      const allUnits = [
        createMockUnit('dead1', 9, 4, 'player', false),
        createMockUnit('dead2', 6, 2, 'player', false),
      ];

      expect(shouldStartNewRound(emptyQueue, allUnits)).toBe(false);
    });
  });

  describe('GDD compliance and determinism', () => {
    it('should follow exact GDD section 5.3 sorting rules', () => {
      // Test case from GDD: initiative > speed > ID
      const units = [
        createMockUnit('warrior', 5, 2),
        createMockUnit('rogue', 9, 4),
        createMockUnit('mage', 6, 2),
        createMockUnit('archer', 6, 3), // Same initiative as mage, higher speed
        createMockUnit('priest', 6, 2), // Same as mage, ID tiebreaker
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual([
        'rogue', // Initiative 9
        'archer', // Initiative 6, Speed 3
        'mage', // Initiative 6, Speed 2, ID 'm'
        'priest', // Initiative 6, Speed 2, ID 'p'
        'warrior', // Initiative 5
      ]);
    });

    it('should be completely deterministic', () => {
      const units = [
        createMockUnit('unit_z', 5, 2),
        createMockUnit('unit_a', 5, 2),
        createMockUnit('unit_m', 5, 2),
      ];

      // Run multiple times to ensure determinism
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(buildTurnQueue([...units]).map((u) => u.id));
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }

      // Should be alphabetical order
      expect(results[0]).toEqual(['unit_a', 'unit_m', 'unit_z']);
    });
  });

  // =============================================================================
  // RESOLVE STATE TESTS
  // =============================================================================

  describe('canUnitAct', () => {
    it('should return true for alive unit without resolve state', () => {
      const unit = createMockUnit('unit1', 9, 4, 'player', true);
      expect(canUnitAct(unit)).toBe(true);
    });

    it('should return true for alive unit with STEADY resolve', () => {
      const unit = createMockUnit('unit1', 9, 4, 'player', true, 100, ResolveState.STEADY);
      expect(canUnitAct(unit)).toBe(true);
    });

    it('should return true for alive unit with WAVERING resolve', () => {
      const unit = createMockUnit('unit1', 9, 4, 'player', true, 100, ResolveState.WAVERING);
      expect(canUnitAct(unit)).toBe(true);
    });

    it('should return false for alive unit with ROUTING resolve', () => {
      const unit = createMockUnit('unit1', 9, 4, 'player', true, 100, ResolveState.ROUTING);
      expect(canUnitAct(unit)).toBe(false);
    });

    it('should return false for dead unit', () => {
      const unit = createMockUnit('unit1', 9, 4, 'player', false);
      expect(canUnitAct(unit)).toBe(false);
    });

    it('should return false for dead unit even with STEADY resolve', () => {
      const unit = createMockUnit('unit1', 9, 4, 'player', false, 0, ResolveState.STEADY);
      expect(canUnitAct(unit)).toBe(false);
    });
  });

  describe('buildTurnQueue with resolve state', () => {
    it('should exclude routing units from queue', () => {
      const units = [
        createMockUnit('steady', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 8, 3, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('wavering', 6, 2, 'player', true, 100, ResolveState.WAVERING),
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual(['steady', 'wavering']);
      expect(queue.every((u) => u.resolveState !== ResolveState.ROUTING)).toBe(true);
    });

    it('should include units without resolve state', () => {
      const units = [
        createMockUnit('no_resolve', 9, 4, 'player', true),
        createMockUnit('routing', 8, 3, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('steady', 6, 2, 'player', true, 100, ResolveState.STEADY),
      ];

      const queue = buildTurnQueue(units);

      expect(queue.map((u) => u.id)).toEqual(['no_resolve', 'steady']);
    });

    it('should return empty queue when all units are routing', () => {
      const units = [
        createMockUnit('routing1', 9, 4, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('routing2', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      const queue = buildTurnQueue(units);

      expect(queue).toEqual([]);
    });
  });

  describe('getNextUnit with resolve state', () => {
    it('should skip routing units and return first active unit', () => {
      const units = [
        createMockUnit('routing1', 9, 4, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('routing2', 8, 3, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('active', 6, 2, 'player', true, 100, ResolveState.STEADY),
      ];

      const next = getNextUnit(units);

      expect(next?.id).toBe('active');
    });

    it('should return null when all units are routing', () => {
      const units = [
        createMockUnit('routing1', 9, 4, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('routing2', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      const next = getNextUnit(units);

      expect(next).toBeNull();
    });
  });

  describe('removeInactiveUnits', () => {
    it('should remove dead units', () => {
      const units = [
        createMockUnit('alive', 9, 4, 'player', true),
        createMockUnit('dead', 6, 2, 'player', false),
      ];

      const cleaned = removeInactiveUnits(units);

      expect(cleaned.map((u) => u.id)).toEqual(['alive']);
    });

    it('should remove routing units', () => {
      const units = [
        createMockUnit('steady', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      const cleaned = removeInactiveUnits(units);

      expect(cleaned.map((u) => u.id)).toEqual(['steady']);
    });

    it('should keep wavering units', () => {
      const units = [
        createMockUnit('steady', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('wavering', 6, 2, 'player', true, 100, ResolveState.WAVERING),
      ];

      const cleaned = removeInactiveUnits(units);

      expect(cleaned.map((u) => u.id)).toEqual(['steady', 'wavering']);
    });
  });

  describe('hasActiveUnits', () => {
    it('should return true when active units exist', () => {
      const units = [
        createMockUnit('routing', 9, 4, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('active', 6, 2, 'player', true, 100, ResolveState.STEADY),
      ];

      expect(hasActiveUnits(units)).toBe(true);
    });

    it('should return false when all units are routing', () => {
      const units = [
        createMockUnit('routing1', 9, 4, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('routing2', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      expect(hasActiveUnits(units)).toBe(false);
    });

    it('should return false when all units are dead', () => {
      const units = [
        createMockUnit('dead1', 9, 4, 'player', false),
        createMockUnit('dead2', 6, 2, 'player', false),
      ];

      expect(hasActiveUnits(units)).toBe(false);
    });

    it('should return true for units without resolve state', () => {
      const units = [createMockUnit('no_resolve', 9, 4, 'player', true)];

      expect(hasActiveUnits(units)).toBe(true);
    });
  });

  describe('getTurnOrderPreview with resolve state', () => {
    it('should exclude routing units from preview', () => {
      const units = [
        createMockUnit('first', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 8, 3, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('second', 6, 2, 'player', true, 100, ResolveState.WAVERING),
      ];

      const preview = getTurnOrderPreview(units, 4);

      expect(preview).toEqual(['first_1', 'second_1', 'first_1', 'second_1']);
    });
  });

  describe('validateTurnQueue with resolve state', () => {
    it('should warn about routing units in queue', () => {
      const units = [
        createMockUnit('steady', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      const validation = validateTurnQueue(units);

      expect(validation.valid).toBe(true); // Still valid, just a warning
      expect(validation.warnings).toContain('Unit routing_1 is routing and should skip turns');
    });
  });

  describe('isTurnQueueSorted with resolve state', () => {
    it('should ignore routing units when checking sort order', () => {
      const units = [
        createMockUnit('high', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 8, 3, 'player', true, 100, ResolveState.ROUTING), // Routing, ignored
        createMockUnit('low', 6, 2, 'player', true, 100, ResolveState.STEADY),
      ];

      expect(isTurnQueueSorted(units)).toBe(true);
    });
  });

  describe('advanceToNextTurn with resolve state', () => {
    it('should rebuild queue when only routing units remain', () => {
      const currentQueue = [
        createMockUnit('current', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      const allUnits = [
        createMockUnit('unit1', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('unit2', 6, 2, 'player', true, 100, ResolveState.STEADY),
      ];

      const newQueue = advanceToNextTurn(currentQueue, allUnits);

      // Should rebuild from all units since only routing unit remains
      expect(newQueue.map((u) => u.id)).toEqual(['unit1', 'unit2']);
    });
  });

  describe('shouldStartNewRound with resolve state', () => {
    it('should return true when only routing units remain in queue', () => {
      const queue = [createMockUnit('routing', 6, 2, 'player', true, 100, ResolveState.ROUTING)];
      const allUnits = [
        createMockUnit('unit1', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('routing', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      expect(shouldStartNewRound(queue, allUnits)).toBe(true);
    });

    it('should return false when active units remain in queue', () => {
      const queue = [createMockUnit('active', 6, 2, 'player', true, 100, ResolveState.STEADY)];
      const allUnits = [
        createMockUnit('unit1', 9, 4, 'player', true, 100, ResolveState.STEADY),
        createMockUnit('active', 6, 2, 'player', true, 100, ResolveState.STEADY),
      ];

      expect(shouldStartNewRound(queue, allUnits)).toBe(false);
    });

    it('should return false when all units are routing', () => {
      const emptyQueue: TurnOrderUnit[] = [];
      const allUnits = [
        createMockUnit('routing1', 9, 4, 'player', true, 100, ResolveState.ROUTING),
        createMockUnit('routing2', 6, 2, 'player', true, 100, ResolveState.ROUTING),
      ];

      expect(shouldStartNewRound(emptyQueue, allUnits)).toBe(false);
    });
  });
});
