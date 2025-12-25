import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeService } from './upgrade.service';
import { RoguelikeRunEntity, RUN_CONSTANTS } from '../entities/run.entity';
import {
  RunNotFoundException,
  RunAccessDeniedException,
  RunAlreadyCompletedException,
  InsufficientGoldException,
  InvalidUpgradeException,
} from '../exceptions/roguelike.exceptions';
import { DeckCard } from '../types/unit.types';

describe('UpgradeService', () => {
  let service: UpgradeService;
  let repository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  const mockPlayerId = 'player-uuid-123';
  const mockRunId = 'run-uuid-456';

  const createMockDeckCards = (): DeckCard[] => [
    { unitId: 'footman', tier: 1, instanceId: 'footman-1' },
    { unitId: 'archer', tier: 1, instanceId: 'archer-1' },
    { unitId: 'priest', tier: 2, instanceId: 'priest-1' },
    { unitId: 'knight', tier: 3, instanceId: 'knight-1' },
  ];

  const createMockRun = (overrides: Partial<RoguelikeRunEntity> = {}): RoguelikeRunEntity => {
    const run = new RoguelikeRunEntity();
    Object.assign(run, {
      id: mockRunId,
      playerId: mockPlayerId,
      faction: 'humans' as const,
      leaderId: 'commander_aldric',
      deck: [],
      remainingDeck: [],
      hand: createMockDeckCards(),
      spells: [{ spellId: 'holy_light' }, { spellId: 'rally' }],
      wins: 0,
      losses: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      gold: 25,
      battleHistory: [],
      status: 'active' as const,
      rating: RUN_CONSTANTS.STARTING_RATING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return run;
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeService,
        {
          provide: getRepositoryToken(RoguelikeRunEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UpgradeService>(UpgradeService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getShopState', () => {
    test('should return shop state with upgrade costs', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getShopState(mockRunId, mockPlayerId);

      expect(result.hand).toHaveLength(4);
      expect(result.gold).toBe(25);
      // Only T1 and T2 cards can be upgraded (footman, archer, priest)
      expect(result.upgradeCosts).toHaveLength(3);
    });

    test('should mark canAfford correctly based on gold', async () => {
      const mockRun = createMockRun({ gold: 2 }); // Low gold
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getShopState(mockRunId, mockPlayerId);

      // With only 2 gold, most upgrades should not be affordable
      const affordableCount = result.upgradeCosts.filter((c) => c.canAfford).length;
      expect(affordableCount).toBeLessThan(result.upgradeCosts.length);
    });

    test('should throw RunNotFoundException if run does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getShopState(mockRunId, mockPlayerId),
      ).rejects.toThrow(RunNotFoundException);
    });

    test('should throw RunAccessDeniedException if player does not own run', async () => {
      const mockRun = createMockRun({ playerId: 'other-player' });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.getShopState(mockRunId, mockPlayerId),
      ).rejects.toThrow(RunAccessDeniedException);
    });
  });

  describe('getUpgradeOptions', () => {
    test('should return upgrade options for upgradeable card', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getUpgradeOptions(mockRunId, mockPlayerId, 'footman-1');

      expect(result).not.toBeNull();
      expect(result?.currentTier).toBe(1);
      expect(result?.targetTier).toBe(2);
      expect(result?.cost).toBeGreaterThan(0);
    });

    test('should return null for max tier card', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getUpgradeOptions(mockRunId, mockPlayerId, 'knight-1');

      expect(result).toBeNull();
    });

    test('should return null for non-existent card', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getUpgradeOptions(mockRunId, mockPlayerId, 'nonexistent-1');

      expect(result).toBeNull();
    });
  });

  describe('upgradeUnit', () => {
    test('should upgrade T1 card to T2', async () => {
      const mockRun = createMockRun({ gold: 25 });
      repository.findOne.mockResolvedValue(mockRun);
      repository.save.mockImplementation((run) => Promise.resolve(run));

      const result = await service.upgradeUnit(mockRunId, mockPlayerId, 'footman-1');

      expect(result.upgradedCard.tier).toBe(2);
      expect(result.goldSpent).toBeGreaterThan(0);
      expect(result.gold).toBeLessThan(25);
    });

    test('should upgrade T2 card to T3', async () => {
      const mockRun = createMockRun({ gold: 25 });
      repository.findOne.mockResolvedValue(mockRun);
      repository.save.mockImplementation((run) => Promise.resolve(run));

      const result = await service.upgradeUnit(mockRunId, mockPlayerId, 'priest-1');

      expect(result.upgradedCard.tier).toBe(3);
    });

    test('should throw InvalidUpgradeException for max tier card', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.upgradeUnit(mockRunId, mockPlayerId, 'knight-1'),
      ).rejects.toThrow(InvalidUpgradeException);
    });

    test('should throw InvalidUpgradeException for non-existent card', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.upgradeUnit(mockRunId, mockPlayerId, 'nonexistent-1'),
      ).rejects.toThrow(InvalidUpgradeException);
    });

    test('should throw InsufficientGoldException when not enough gold', async () => {
      const mockRun = createMockRun({ gold: 0 });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.upgradeUnit(mockRunId, mockPlayerId, 'footman-1'),
      ).rejects.toThrow(InsufficientGoldException);
    });

    test('should throw RunAlreadyCompletedException for completed run', async () => {
      const mockRun = createMockRun({ status: 'won' });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.upgradeUnit(mockRunId, mockPlayerId, 'footman-1'),
      ).rejects.toThrow(RunAlreadyCompletedException);
    });
  });

  describe('canUpgrade', () => {
    test('should return canUpgrade=true for valid upgrade', async () => {
      const mockRun = createMockRun({ gold: 25 });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.canUpgrade(mockRunId, mockPlayerId, 'footman-1');

      expect(result.canUpgrade).toBe(true);
    });

    test('should return canUpgrade=false for max tier', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.canUpgrade(mockRunId, mockPlayerId, 'knight-1');

      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toContain('максимальном');
    });

    test('should return canUpgrade=false for insufficient gold', async () => {
      const mockRun = createMockRun({ gold: 0 });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.canUpgrade(mockRunId, mockPlayerId, 'footman-1');

      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toContain('золота');
    });

    test('should return canUpgrade=false for non-existent card', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.canUpgrade(mockRunId, mockPlayerId, 'nonexistent-1');

      expect(result.canUpgrade).toBe(false);
    });

    test('should return canUpgrade=false for completed run', async () => {
      const mockRun = createMockRun({ status: 'lost' });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.canUpgrade(mockRunId, mockPlayerId, 'footman-1');

      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toBe('Забег завершен');
    });
  });
});
