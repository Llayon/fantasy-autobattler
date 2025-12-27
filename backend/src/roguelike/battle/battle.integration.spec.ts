/**
 * Integration tests for Roguelike Battle Flow
 *
 * Tests the complete battle flow:
 * - Create run → Place units → Submit battle → Verify result
 * - Check BattleLog saved correctly
 * - Check battle history updated
 *
 * @module roguelike/battle/integration.spec
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoguelikeBattleService } from './battle.service';
import { BattleLog, BattleStatus } from '../../entities/battle-log.entity';
import { RoguelikeRunEntity, FieldUnit, RUN_CONSTANTS } from '../entities/run.entity';
import { RoguelikeSnapshotEntity } from '../entities/snapshot.entity';
import { BotOpponent } from '../matchmaking/matchmaking.service';
import { DeckCard } from '../types/unit.types';
import { Faction } from '../types/faction.types';

describe('RoguelikeBattleService Integration', () => {
  let service: RoguelikeBattleService;
  let battleLogRepository: Partial<Repository<BattleLog>>;

  // Test data
  const mockPlayerId = '550e8400-e29b-41d4-a716-446655440000';
  const mockRunId = '550e8400-e29b-41d4-a716-446655440001';

  /**
   * Creates a mock run entity for testing.
   */
  function createMockRun(overrides: Partial<RoguelikeRunEntity> = {}): RoguelikeRunEntity {
    const run = new RoguelikeRunEntity();
    Object.assign(run, {
      id: mockRunId,
      playerId: mockPlayerId,
      faction: 'humans' as Faction,
      leaderId: 'commander_aldric',
      deck: createMockDeck(),
      remainingDeck: [],
      hand: [],
      field: [],
      spells: [{ spellId: 'holy_light' }, { spellId: 'rally' }],
      wins: 0,
      losses: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      gold: RUN_CONSTANTS.STARTING_GOLD,
      battleHistory: [],
      status: 'active' as const,
      rating: RUN_CONSTANTS.STARTING_RATING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return run;
  }

  /**
   * Creates a mock deck for testing.
   */
  function createMockDeck(): DeckCard[] {
    return [
      { unitId: 'footman', tier: 1, instanceId: 'footman-1' },
      { unitId: 'knight', tier: 1, instanceId: 'knight-1' },
      { unitId: 'archer', tier: 1, instanceId: 'archer-1' },
    ];
  }

  /**
   * Creates mock field units for testing.
   */
  function createMockFieldUnits(): FieldUnit[] {
    return [
      { instanceId: 'footman-1', unitId: 'footman', tier: 1, position: { x: 0, y: 0 }, hasBattled: false },
      { instanceId: 'knight-1', unitId: 'knight', tier: 1, position: { x: 1, y: 0 }, hasBattled: false },
      { instanceId: 'archer-1', unitId: 'archer', tier: 1, position: { x: 2, y: 1 }, hasBattled: false },
    ];
  }

  /**
   * Creates a mock bot opponent for testing.
   */
  function createMockBotOpponent(): BotOpponent {
    return {
      id: 'bot_12345',
      name: 'Bot_0W',
      faction: 'undead',
      leaderId: 'lich_king_malachar',
      team: [
        { unitId: 'skeleton', tier: 1, position: { x: 0, y: 0 } },
        { unitId: 'zombie', tier: 1, position: { x: 1, y: 0 } },
      ],
      spellTimings: [
        { spellId: 'death_coil', timing: 'mid' },
      ],
      difficulty: 0.3,
      isBot: true,
    };
  }

  /**
   * Creates a mock player snapshot opponent for testing.
   */
  function createMockSnapshotOpponent(): RoguelikeSnapshotEntity {
    const snapshot = new RoguelikeSnapshotEntity();
    Object.assign(snapshot, {
      id: '550e8400-e29b-41d4-a716-446655440002',
      runId: '550e8400-e29b-41d4-a716-446655440003',
      playerId: '550e8400-e29b-41d4-a716-446655440004',
      wins: 2,
      rating: 1050,
      team: [
        { unitId: 'footman', tier: 2, position: { x: 0, y: 0 } },
        { unitId: 'archer', tier: 1, position: { x: 1, y: 1 } },
      ],
      spellTimings: [
        { spellId: 'holy_light', timing: 'early' },
      ],
      faction: 'humans',
      leaderId: 'commander_aldric',
      createdAt: new Date(),
    });
    return snapshot;
  }

  beforeEach(async () => {
    // Mock repository
    battleLogRepository = {
      create: jest.fn().mockImplementation((data) => ({ ...data, id: 'battle-log-uuid' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'battle-log-uuid' })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoguelikeBattleService,
        {
          provide: getRepositoryToken(BattleLog),
          useValue: battleLogRepository,
        },
      ],
    }).compile();

    service = module.get<RoguelikeBattleService>(RoguelikeBattleService);
  });

  describe('simulateAndSaveBattle', () => {
    it('should simulate battle and return result with valid battleId', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent = createMockBotOpponent();

      const result = await service.simulateAndSaveBattle(run, run.field, opponent);

      expect(result).toBeDefined();
      expect(result.battleId).toBeDefined();
      expect(result.battleId).toBe('battle-log-uuid');
      expect(['win', 'loss']).toContain(result.result);
      expect(result.replayAvailable).toBe(true);
      expect(result.rounds).toBeGreaterThanOrEqual(0);
      expect(result.seed).toBeGreaterThan(0);
    });

    it('should save BattleLog with correct data', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent = createMockBotOpponent();

      await service.simulateAndSaveBattle(run, run.field, opponent);

      expect(battleLogRepository.create).toHaveBeenCalled();
      expect(battleLogRepository.save).toHaveBeenCalled();

      const createCall = (battleLogRepository.create as jest.Mock).mock.calls[0][0];
      
      // Verify BattleLog structure
      expect(createCall.player1Id).toBe(mockPlayerId);
      expect(createCall.player2Id).toBeDefined(); // UUID for bot
      expect(createCall.player1TeamSnapshot).toBeDefined();
      expect(createCall.player1TeamSnapshot.units).toHaveLength(3);
      expect(createCall.player2TeamSnapshot).toBeDefined();
      expect(createCall.seed).toBeGreaterThan(0);
      expect(createCall.status).toBe(BattleStatus.SIMULATED);
      expect(createCall.events).toBeDefined();
      expect(Array.isArray(createCall.events)).toBe(true);
      expect(['player1', 'player2', 'draw']).toContain(createCall.winner);
    });

    it('should generate deterministic seed from runId and battleNumber', async () => {
      const run1 = createMockRun({ field: createMockFieldUnits(), wins: 0, losses: 0 });
      const run2 = createMockRun({ field: createMockFieldUnits(), wins: 1, losses: 0 });
      const opponent = createMockBotOpponent();

      const result1 = await service.simulateAndSaveBattle(run1, run1.field, opponent);
      const result2 = await service.simulateAndSaveBattle(run2, run2.field, opponent);

      // Different battle numbers should produce different seeds
      expect(result1.seed).not.toBe(result2.seed);

      // Same run and battle number should produce same seed
      const result1Again = await service.simulateAndSaveBattle(run1, run1.field, opponent);
      expect(result1.seed).toBe(result1Again.seed);
    });

    it('should handle player snapshot opponent correctly', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent = createMockSnapshotOpponent();

      const result = await service.simulateAndSaveBattle(run, run.field, opponent);

      expect(result).toBeDefined();
      expect(result.battleId).toBe('battle-log-uuid');

      const createCall = (battleLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.player2Id).toBe(opponent.playerId);
    });

    it('should map opponent positions to battle grid (y: 0-1 → y: 8-9)', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent = createMockBotOpponent();

      await service.simulateAndSaveBattle(run, run.field, opponent);

      const createCall = (battleLogRepository.create as jest.Mock).mock.calls[0][0];
      const opponentTeam = createCall.player2TeamSnapshot;

      // Opponent positions should be mapped to y: 8-9
      for (const pos of opponentTeam.positions) {
        expect(pos.y).toBeGreaterThanOrEqual(8);
        expect(pos.y).toBeLessThanOrEqual(9);
      }
    });

    it('should return auto-loss when player has no units', async () => {
      const run = createMockRun({ field: [] });
      const opponent = createMockBotOpponent();

      const result = await service.simulateAndSaveBattle(run, [], opponent);

      expect(result.result).toBe('loss');
      expect(result.replayAvailable).toBe(false);
      expect(result.rounds).toBe(0);
      
      // Should not save BattleLog for auto-results
      expect(battleLogRepository.save).not.toHaveBeenCalled();
    });

    it('should return auto-win when opponent has no units', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent: BotOpponent = {
        ...createMockBotOpponent(),
        team: [],
      };

      const result = await service.simulateAndSaveBattle(run, run.field, opponent);

      expect(result.result).toBe('win');
      expect(result.replayAvailable).toBe(false);
      expect(result.rounds).toBe(0);
    });

    it('should handle save failure gracefully with retry', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent = createMockBotOpponent();

      // First two saves fail, third succeeds
      let saveAttempts = 0;
      (battleLogRepository.save as jest.Mock).mockImplementation(() => {
        saveAttempts++;
        if (saveAttempts <= 2) {
          return Promise.reject(new Error('Database error'));
        }
        return Promise.resolve({ id: 'battle-log-uuid' });
      });

      const result = await service.simulateAndSaveBattle(run, run.field, opponent);

      // Should still return result even if save fails after retries
      expect(result).toBeDefined();
      expect(['win', 'loss']).toContain(result.result);
      expect(saveAttempts).toBe(3); // 1 initial + 2 retries
    });

    it('should return replayAvailable=false when all save attempts fail', async () => {
      const run = createMockRun({ field: createMockFieldUnits() });
      const opponent = createMockBotOpponent();

      // All saves fail
      (battleLogRepository.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.simulateAndSaveBattle(run, run.field, opponent);

      expect(result).toBeDefined();
      expect(result.replayAvailable).toBe(false);
    });
  });

  describe('generateBattleSeed', () => {
    it('should generate consistent seed for same inputs', () => {
      const seed1 = service.generateBattleSeed(mockRunId, 0);
      const seed2 = service.generateBattleSeed(mockRunId, 0);

      expect(seed1).toBe(seed2);
    });

    it('should generate different seeds for different battle numbers', () => {
      const seed1 = service.generateBattleSeed(mockRunId, 0);
      const seed2 = service.generateBattleSeed(mockRunId, 1);
      const seed3 = service.generateBattleSeed(mockRunId, 5);

      expect(seed1).not.toBe(seed2);
      expect(seed2).not.toBe(seed3);
      expect(seed1).not.toBe(seed3);
    });

    it('should generate different seeds for different run IDs', () => {
      const seed1 = service.generateBattleSeed(mockRunId, 0);
      const seed2 = service.generateBattleSeed('different-run-id', 0);

      expect(seed1).not.toBe(seed2);
    });

    it('should always return positive number', () => {
      for (let i = 0; i < 100; i++) {
        const seed = service.generateBattleSeed(`run-${i}`, i);
        expect(seed).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('tier stat multipliers', () => {
    it('should apply T1 multiplier (×1.0) correctly', async () => {
      const run = createMockRun({
        field: [
          { instanceId: 'footman-1', unitId: 'footman', tier: 1, position: { x: 0, y: 0 }, hasBattled: false },
        ],
      });
      const opponent = createMockBotOpponent();

      await service.simulateAndSaveBattle(run, run.field, opponent);

      const createCall = (battleLogRepository.create as jest.Mock).mock.calls[0][0];
      const playerUnit = createCall.player1TeamSnapshot.units[0];

      // T1 stats should be base stats (×1.0)
      expect(playerUnit.stats.hp).toBe(100); // Footman base HP
    });

    it('should apply T2 multiplier (×1.5) correctly', async () => {
      const run = createMockRun({
        field: [
          { instanceId: 'footman-1', unitId: 'footman', tier: 2, position: { x: 0, y: 0 }, hasBattled: false },
        ],
      });
      const opponent = createMockBotOpponent();

      await service.simulateAndSaveBattle(run, run.field, opponent);

      const createCall = (battleLogRepository.create as jest.Mock).mock.calls[0][0];
      const playerUnit = createCall.player1TeamSnapshot.units[0];

      // T2 stats should be base × 1.5
      expect(playerUnit.stats.hp).toBe(150); // 100 × 1.5
    });

    it('should apply T3 multiplier (×2.0) correctly', async () => {
      const run = createMockRun({
        field: [
          { instanceId: 'footman-1', unitId: 'footman', tier: 3, position: { x: 0, y: 0 }, hasBattled: false },
        ],
      });
      const opponent = createMockBotOpponent();

      await service.simulateAndSaveBattle(run, run.field, opponent);

      const createCall = (battleLogRepository.create as jest.Mock).mock.calls[0][0];
      const playerUnit = createCall.player1TeamSnapshot.units[0];

      // T3 stats should be base × 2.0
      expect(playerUnit.stats.hp).toBe(200); // 100 × 2.0
    });
  });
});
