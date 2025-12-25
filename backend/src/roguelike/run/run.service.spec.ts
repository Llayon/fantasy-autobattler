import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RunService } from './run.service';
import { RoguelikeRunEntity, RUN_CONSTANTS } from '../entities/run.entity';
import {
  RunNotFoundException,
  RunAccessDeniedException,
  RunAlreadyCompletedException,
  ActiveRunExistsException,
  InvalidFactionLeaderException,
  FactionNotFoundException,
  LeaderNotFoundException,
} from '../exceptions/roguelike.exceptions';

describe('RunService', () => {
  let service: RunService;
  let repository: { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock };

  const mockPlayerId = 'player-uuid-123';
  const mockRunId = 'run-uuid-456';

  const createMockRun = (overrides: Partial<RoguelikeRunEntity> = {}): RoguelikeRunEntity => {
    const run = new RoguelikeRunEntity();
    Object.assign(run, {
      id: mockRunId, playerId: mockPlayerId, faction: 'humans' as const, leaderId: 'commander_aldric',
      deck: [], remainingDeck: [], hand: [], spells: [{ spellId: 'holy_light' }, { spellId: 'rally' }],
      wins: 0, losses: 0, consecutiveWins: 0, consecutiveLosses: 0, gold: RUN_CONSTANTS.STARTING_GOLD,
      battleHistory: [], status: 'active' as const, rating: RUN_CONSTANTS.STARTING_RATING,
      createdAt: new Date(), updatedAt: new Date(), ...overrides,
    });
    return run;
  };

  beforeEach(async () => {
    repository = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [RunService, { provide: getRepositoryToken(RoguelikeRunEntity), useValue: repository }],
    }).compile();
    service = module.get<RunService>(RunService);
  });

  test('should be defined', () => { expect(service).toBeDefined(); });

  describe('createRun', () => {
    test('should create run with valid faction and leader', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockRun);
      repository.save.mockResolvedValue(mockRun);
      const result = await service.createRun(mockPlayerId, 'humans', 'commander_aldric');
      expect(result.faction).toBe('humans');
    });

    test('should throw FactionNotFoundException for invalid faction', async () => {
      await expect(service.createRun(mockPlayerId, 'invalid' as 'humans', 'commander_aldric')).rejects.toThrow(FactionNotFoundException);
    });

    test('should throw LeaderNotFoundException for invalid leader', async () => {
      await expect(service.createRun(mockPlayerId, 'humans', 'invalid_leader')).rejects.toThrow(LeaderNotFoundException);
    });

    test('should throw InvalidFactionLeaderException when leader does not belong to faction', async () => {
      await expect(service.createRun(mockPlayerId, 'humans', 'lich_king_malachar')).rejects.toThrow(InvalidFactionLeaderException);
    });

    test('should throw ActiveRunExistsException when player has active run', async () => {
      repository.findOne.mockResolvedValue(createMockRun());
      await expect(service.createRun(mockPlayerId, 'humans', 'commander_aldric')).rejects.toThrow(ActiveRunExistsException);
    });
  });

  describe('getRun', () => {
    test('should return run when found and player owns it', async () => {
      repository.findOne.mockResolvedValue(createMockRun());
      const result = await service.getRun(mockRunId, mockPlayerId);
      expect(result.id).toBe(mockRunId);
    });

    test('should throw RunNotFoundException when run does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.getRun(mockRunId, mockPlayerId)).rejects.toThrow(RunNotFoundException);
    });

    test('should throw RunAccessDeniedException when player does not own run', async () => {
      repository.findOne.mockResolvedValue(createMockRun({ playerId: 'other-player' }));
      await expect(service.getRun(mockRunId, mockPlayerId)).rejects.toThrow(RunAccessDeniedException);
    });
  });

  describe('getActiveRun', () => {
    test('should return active run when exists', async () => {
      repository.findOne.mockResolvedValue(createMockRun());
      const result = await service.getActiveRun(mockPlayerId);
      expect(result?.status).toBe('active');
    });

    test('should return null when no active run exists', async () => {
      repository.findOne.mockResolvedValue(null);
      expect(await service.getActiveRun(mockPlayerId)).toBeNull();
    });
  });

  describe('abandonRun', () => {
    test('should abandon active run', async () => {
      repository.findOne.mockResolvedValue(createMockRun());
      repository.save.mockResolvedValue(createMockRun({ status: 'lost' }));
      const result = await service.abandonRun(mockRunId, mockPlayerId);
      expect(result.status).toBe('lost');
    });

    test('should throw RunAlreadyCompletedException when run is already complete', async () => {
      repository.findOne.mockResolvedValue(createMockRun({ status: 'won' }));
      await expect(service.abandonRun(mockRunId, mockPlayerId)).rejects.toThrow(RunAlreadyCompletedException);
    });
  });

  describe('getRunHistory', () => {
    test('should return run history for player', async () => {
      repository.find.mockResolvedValue([createMockRun({ id: 'run-1' }), createMockRun({ id: 'run-2' })]);
      const result = await service.getRunHistory(mockPlayerId);
      expect(result).toHaveLength(2);
    });
  });
});
