/**
 * Test suite for MatchmakingService.
 * Tests queue management, opponent matching, and battle creation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingQueue, MatchmakingStatus } from '../entities/matchmaking-queue.entity';
import { Player } from '../entities/player.entity';
import { Team } from '../entities/team.entity';
import { BattleService } from '../battle/battle.service';
import { MATCHMAKING_CONSTANTS } from '../config/game.constants';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let queueRepository: jest.Mocked<Repository<MatchmakingQueue>>;
  let playerRepository: jest.Mocked<Repository<Player>>;
  let teamRepository: jest.Mocked<Repository<Team>>;
  let battleService: jest.Mocked<BattleService>;

  // Valid UUIDs for testing
  const VALID_PLAYER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const VALID_TEAM_ID = '550e8400-e29b-41d4-a716-446655440002';
  const VALID_QUEUE_ID = '550e8400-e29b-41d4-a716-446655440003';

  // Test data
  const mockPlayer = {
    id: VALID_PLAYER_ID,
    guestId: 'guest-123',
    name: 'Test Player',
    wins: 0,
    losses: 0,
  } as Player;

  const mockTeam = {
    id: VALID_TEAM_ID,
    playerId: VALID_PLAYER_ID,
    name: 'Test Team',
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 } },
      { unitId: 'mage', position: { x: 1, y: 0 } },
    ],
    totalCost: 12,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Mock the methods that are not needed for these tests
    validateTeam: jest.fn(),
    validateBudget: jest.fn(),
    validateUnits: jest.fn(),
    validatePositions: jest.fn(),
    calculateTotalCost: jest.fn(),
    isValidForBattle: jest.fn(),
    getSummary: jest.fn(),
  } as unknown as Team;

  const mockQueueEntry = {
    id: VALID_QUEUE_ID,
    playerId: VALID_PLAYER_ID,
    teamId: VALID_TEAM_ID,
    rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
    status: MatchmakingStatus.WAITING,
    joinedAt: new Date(),
    getWaitTime: jest.fn(() => 30000), // 30 seconds
    markAsMatched: jest.fn(),
    markAsExpired: jest.fn(),
  } as unknown as MatchmakingQueue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        {
          provide: getRepositoryToken(MatchmakingQueue),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Player),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: BattleService,
          useValue: {
            startBattle: jest.fn(),
            startPvPBattle: jest.fn(),
            getRecentBattleForPlayer: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
    queueRepository = module.get(getRepositoryToken(MatchmakingQueue));
    playerRepository = module.get(getRepositoryToken(Player));
    teamRepository = module.get(getRepositoryToken(Team));
    battleService = module.get(BattleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('joinQueue', () => {
    it('should successfully add player to queue', async () => {
      // Arrange
      playerRepository.findOne.mockResolvedValue(mockPlayer);
      teamRepository.findOne.mockResolvedValue(mockTeam);
      queueRepository.findOne.mockResolvedValue(null); // No existing entry
      queueRepository.create.mockReturnValue(mockQueueEntry);
      queueRepository.save.mockResolvedValue(mockQueueEntry);

      // Act
      const result = await service.joinQueue(VALID_PLAYER_ID, VALID_TEAM_ID);

      // Assert
      expect(result).toEqual({
        id: VALID_QUEUE_ID,
        playerId: VALID_PLAYER_ID,
        teamId: VALID_TEAM_ID,
        rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
        status: MatchmakingStatus.WAITING,
        joinedAt: expect.any(Date),
        waitTime: 30000,
      });

      expect(playerRepository.findOne).toHaveBeenCalledWith({ where: { id: VALID_PLAYER_ID } });
      expect(teamRepository.findOne).toHaveBeenCalledWith({
        where: { id: VALID_TEAM_ID, playerId: VALID_PLAYER_ID, isActive: true },
      });
      expect(queueRepository.create).toHaveBeenCalledWith({
        playerId: VALID_PLAYER_ID,
        teamId: VALID_TEAM_ID,
        rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
        status: MatchmakingStatus.WAITING,
      });
    });

    it('should throw NotFoundException when player not found', async () => {
      // Arrange
      playerRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.joinQueue('invalid-player', VALID_TEAM_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(playerRepository.findOne).toHaveBeenCalledWith({ where: { id: 'invalid-player' } });
    });

    it('should throw NotFoundException when team not found or not active', async () => {
      // Arrange
      playerRepository.findOne.mockResolvedValue(mockPlayer);
      teamRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.joinQueue(VALID_PLAYER_ID, 'invalid-team')).rejects.toThrow(
        NotFoundException,
      );
      expect(teamRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invalid-team', playerId: VALID_PLAYER_ID, isActive: true },
      });
    });

    it('should remove existing queue entry and rejoin when player already in queue', async () => {
      // Arrange
      playerRepository.findOne.mockResolvedValue(mockPlayer);
      teamRepository.findOne.mockResolvedValue(mockTeam);
      queueRepository.findOne.mockResolvedValue(mockQueueEntry); // Existing entry
      queueRepository.remove.mockResolvedValue(mockQueueEntry);
      queueRepository.create.mockReturnValue(mockQueueEntry);
      queueRepository.save.mockResolvedValue(mockQueueEntry);

      // Act
      const result = await service.joinQueue(VALID_PLAYER_ID, VALID_TEAM_ID);

      // Assert
      expect(queueRepository.findOne).toHaveBeenCalledWith({
        where: { playerId: VALID_PLAYER_ID, status: MatchmakingStatus.WAITING },
      });
      expect(queueRepository.remove).toHaveBeenCalledWith(mockQueueEntry);
      expect(queueRepository.create).toHaveBeenCalled();
      expect(queueRepository.save).toHaveBeenCalled();
      expect(result.playerId).toBe(VALID_PLAYER_ID);
    });
  });

  describe('leaveQueue', () => {
    it('should successfully remove player from queue', async () => {
      // Arrange
      queueRepository.findOne.mockResolvedValue(mockQueueEntry);
      queueRepository.remove.mockResolvedValue(mockQueueEntry);

      // Act
      await service.leaveQueue(VALID_PLAYER_ID);

      // Assert
      expect(queueRepository.findOne).toHaveBeenCalledWith({
        where: { playerId: VALID_PLAYER_ID, status: MatchmakingStatus.WAITING },
      });
      expect(queueRepository.remove).toHaveBeenCalledWith(mockQueueEntry);
    });

    it('should throw NotFoundException when player not in queue', async () => {
      // Arrange
      queueRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.leaveQueue(VALID_PLAYER_ID)).rejects.toThrow(NotFoundException);
      expect(queueRepository.findOne).toHaveBeenCalledWith({
        where: { playerId: VALID_PLAYER_ID, status: MatchmakingStatus.WAITING },
      });
    });
  });

  describe('findMatch', () => {
    const VALID_OPPONENT_PLAYER_ID = '550e8400-e29b-41d4-a716-446655440004';
    const VALID_OPPONENT_TEAM_ID = '550e8400-e29b-41d4-a716-446655440005';
    const VALID_OPPONENT_QUEUE_ID = '550e8400-e29b-41d4-a716-446655440006';
    const VALID_BATTLE_ID = '550e8400-e29b-41d4-a716-446655440007';

    const mockOpponent = {
      id: VALID_OPPONENT_QUEUE_ID,
      playerId: VALID_OPPONENT_PLAYER_ID,
      teamId: VALID_OPPONENT_TEAM_ID,
      rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO + 50,
      status: MatchmakingStatus.WAITING,
      joinedAt: new Date(Date.now() - 60000), // 1 minute ago
      getWaitTime: jest.fn(() => 60000),
      markAsMatched: jest.fn(),
    } as unknown as MatchmakingQueue;

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      queueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should find and create match with suitable opponent', async () => {
      // Arrange
      queueRepository.findOne.mockResolvedValue(mockQueueEntry);
      mockQueryBuilder.getMany.mockResolvedValue([mockOpponent]);
      teamRepository.findOne
        .mockResolvedValueOnce(mockTeam) // Player team
        .mockResolvedValueOnce({ ...mockTeam, id: VALID_OPPONENT_TEAM_ID } as Team); // Opponent team
      battleService.startPvPBattle.mockResolvedValue({
        id: VALID_BATTLE_ID,
        player1Id: VALID_PLAYER_ID,
        player2Id: VALID_OPPONENT_PLAYER_ID,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        rounds: [],
        winner: VALID_PLAYER_ID,
        seed: 12345,
      } as any);
      queueRepository.save.mockResolvedValue(mockQueueEntry);

      // Act
      const result = await service.findMatch('player-123');

      // Assert
      expect(result).toEqual({
        player1: expect.objectContaining({
          playerId: VALID_PLAYER_ID,
          rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
        }),
        player2: expect.objectContaining({
          playerId: VALID_OPPONENT_PLAYER_ID,
          rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO + 50,
        }),
        ratingDifference: 50,
        battleId: VALID_BATTLE_ID,
      });

      expect(battleService.startPvPBattle).toHaveBeenCalledWith(VALID_PLAYER_ID, VALID_OPPONENT_PLAYER_ID);
      expect(mockQueueEntry.markAsMatched).toHaveBeenCalledWith(VALID_BATTLE_ID);
      expect(mockOpponent.markAsMatched).toHaveBeenCalledWith(VALID_BATTLE_ID);
      expect(queueRepository.save).toHaveBeenCalledTimes(2);
      // Note: Queue entries are scheduled for removal after 5 minutes, not immediately
    });

    it('should return null when no suitable opponent found', async () => {
      // Arrange
      queueRepository.findOne.mockResolvedValue(mockQueueEntry);
      mockQueryBuilder.getMany.mockResolvedValue([]); // No opponents

      // Act
      const result = await service.findMatch(VALID_PLAYER_ID);

      // Assert
      expect(result).toBeNull();
      expect(queueRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should return null when player not in queue', async () => {
      // Arrange
      queueRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findMatch(VALID_PLAYER_ID);

      // Assert
      expect(result).toBeNull();
      expect(queueRepository.findOne).toHaveBeenCalledWith({
        where: { playerId: VALID_PLAYER_ID, status: MatchmakingStatus.WAITING },
      });
    });

    it('should expand rating range based on wait time', async () => {
      // Arrange
      const longWaitingEntry = {
        ...mockQueueEntry,
        getWaitTime: jest.fn(() => 5 * 60 * 1000), // 5 minutes
      } as unknown as MatchmakingQueue;

      queueRepository.findOne.mockResolvedValue(longWaitingEntry);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findMatch(VALID_PLAYER_ID);

      // Assert
      const expectedExpansion = 5 * MATCHMAKING_CONSTANTS.RATING_EXPANSION_PER_MINUTE;
      const expectedMaxDiff = MATCHMAKING_CONSTANTS.MAX_RATING_DIFFERENCE + expectedExpansion;

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ABS(queue.rating - :playerRating) <= :maxRatingDiff',
        {
          playerRating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
          maxRatingDiff: expectedMaxDiff,
        },
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      // Arrange
      const mockEntries = [
        { ...mockQueueEntry, rating: 1200, getWaitTime: () => 30000 },
        { ...mockQueueEntry, rating: 1300, getWaitTime: () => 60000 },
        { ...mockQueueEntry, rating: 1100, getWaitTime: () => 45000 },
      ] as MatchmakingQueue[];

      queueRepository.find.mockResolvedValue(mockEntries);

      // Act
      const result = await service.getQueueStats();

      // Assert
      expect(result).toEqual({
        waitingPlayers: 3,
        averageWaitTime: 45000, // (30000 + 60000 + 45000) / 3
        ratingDistribution: {
          min: 1100,
          max: 1300,
          average: 1200, // (1200 + 1300 + 1100) / 3
        },
      });

      expect(queueRepository.find).toHaveBeenCalledWith({
        where: { status: MatchmakingStatus.WAITING },
      });
    });

    it('should return empty stats when no players in queue', async () => {
      // Arrange
      queueRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getQueueStats();

      // Assert
      expect(result).toEqual({
        waitingPlayers: 0,
        averageWaitTime: 0,
        ratingDistribution: { min: 0, max: 0, average: 0 },
      });
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should clean up expired queue entries', async () => {
      // Arrange
      const expiredEntry1 = { ...mockQueueEntry, markAsExpired: jest.fn() } as unknown as MatchmakingQueue;
      const expiredEntry2 = { ...mockQueueEntry, id: 'queue-expired-2', markAsExpired: jest.fn() } as unknown as MatchmakingQueue;
      const expiredEntries = [expiredEntry1, expiredEntry2];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expiredEntries),
      };

      queueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      queueRepository.save.mockResolvedValue(expiredEntries as any);

      // Act
      const result = await service.cleanupExpiredEntries();

      // Assert
      expect(result).toBe(2);
      expect(expiredEntry1.markAsExpired).toHaveBeenCalled();
      expect(expiredEntry2.markAsExpired).toHaveBeenCalled();
      expect(queueRepository.save).toHaveBeenCalledWith(expiredEntries);
    });

    it('should return 0 when no expired entries found', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      queueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.cleanupExpiredEntries();

      // Assert
      expect(result).toBe(0);
      expect(queueRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('createBattle', () => {
    const VALID_OPPONENT_PLAYER_ID_2 = '550e8400-e29b-41d4-a716-446655440008';
    const VALID_OPPONENT_TEAM_ID_2 = '550e8400-e29b-41d4-a716-446655440009';
    const VALID_OPPONENT_QUEUE_ID_2 = '550e8400-e29b-41d4-a716-44665544000a';

    it('should handle battle creation errors gracefully', async () => {
      // Arrange
      const opponent = {
        id: VALID_OPPONENT_QUEUE_ID_2,
        playerId: VALID_OPPONENT_PLAYER_ID_2,
        teamId: VALID_OPPONENT_TEAM_ID_2,
        rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO + 50,
        status: MatchmakingStatus.WAITING,
        joinedAt: new Date(Date.now() - 60000),
        getWaitTime: jest.fn(() => 60000),
        markAsMatched: jest.fn(),
      } as unknown as MatchmakingQueue;

      teamRepository.findOne
        .mockResolvedValueOnce(mockTeam)
        .mockResolvedValueOnce({ ...mockTeam, id: VALID_OPPONENT_TEAM_ID_2 } as Team);
      battleService.startPvPBattle.mockRejectedValue(new Error('Battle creation failed'));

      // Act & Assert
      await expect(service.createBattle(mockQueueEntry, opponent)).rejects.toThrow(
        'Battle creation failed',
      );
    });

    it('should throw BadRequestException when team data not found', async () => {
      // Arrange
      const opponent = {
        id: VALID_OPPONENT_QUEUE_ID_2,
        playerId: VALID_OPPONENT_PLAYER_ID_2,
        teamId: VALID_OPPONENT_TEAM_ID_2,
        rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO + 50,
        status: MatchmakingStatus.WAITING,
        joinedAt: new Date(Date.now() - 60000),
        getWaitTime: jest.fn(() => 60000),
        markAsMatched: jest.fn(),
      } as unknown as MatchmakingQueue;

      teamRepository.findOne
        .mockResolvedValueOnce(null) // Player team not found
        .mockResolvedValueOnce(mockTeam);

      // Act & Assert
      await expect(service.createBattle(mockQueueEntry, opponent)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});