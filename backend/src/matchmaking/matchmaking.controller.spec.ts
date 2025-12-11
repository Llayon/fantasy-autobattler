/**
 * Test suite for MatchmakingController.
 * Tests HTTP endpoints for queue management and matchmaking.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { JoinQueueDto } from './dto/matchmaking.dto';
import { MatchmakingService, QueueEntry, Match } from './matchmaking.service';
import { GuestGuard } from '../auth/guest.guard';
import { MatchmakingStatus } from '../entities/matchmaking-queue.entity';
import { MATCHMAKING_CONSTANTS } from '../config/game.constants';

describe('MatchmakingController', () => {
  let controller: MatchmakingController;
  let matchmakingService: jest.Mocked<MatchmakingService>;

  // Test data
  const mockRequest = {
    player: { id: 'player-123' },
    correlationId: 'test-correlation-id',
  };

  const mockQueueEntry: QueueEntry = {
    id: 'queue-456',
    playerId: 'player-123',
    teamId: 'team-789',
    rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
    status: MatchmakingStatus.WAITING,
    joinedAt: new Date(),
    waitTime: 30000,
  };

  const mockMatch: Match = {
    player1: mockQueueEntry,
    player2: {
      id: 'queue-opponent',
      playerId: 'player-opponent',
      teamId: 'team-opponent',
      rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO + 50,
      status: MatchmakingStatus.WAITING,
      joinedAt: new Date(),
      waitTime: 60000,
    },
    ratingDifference: 50,
    battleId: 'battle-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchmakingController],
      providers: [
        {
          provide: MatchmakingService,
          useValue: {
            joinQueue: jest.fn(),
            leaveQueue: jest.fn(),
            getPlayerQueueEntry: jest.fn(),
            findMatch: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(GuestGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<MatchmakingController>(MatchmakingController);
    matchmakingService = module.get(MatchmakingService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('joinQueue', () => {
    const joinRequest: JoinQueueDto = { teamId: 'team-789' };

    it('should successfully join queue', async () => {
      // Arrange
      matchmakingService.joinQueue.mockResolvedValue(mockQueueEntry);

      // Act
      const result = await controller.joinQueue(mockRequest, joinRequest);

      // Assert
      expect(result).toEqual(mockQueueEntry);
      expect(matchmakingService.joinQueue).toHaveBeenCalledWith('player-123', 'team-789');
    });

    it('should throw NotFoundException when player not found', async () => {
      // Arrange
      matchmakingService.joinQueue.mockRejectedValue(new NotFoundException('Игрок не найден'));

      // Act & Assert
      await expect(controller.joinQueue(mockRequest, joinRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(matchmakingService.joinQueue).toHaveBeenCalledWith('player-123', 'team-789');
    });

    it('should throw ConflictException when player already in queue', async () => {
      // Arrange
      matchmakingService.joinQueue.mockRejectedValue(
        new ConflictException('Игрок уже находится в очереди'),
      );

      // Act & Assert
      await expect(controller.joinQueue(mockRequest, joinRequest)).rejects.toThrow(
        ConflictException,
      );
      expect(matchmakingService.joinQueue).toHaveBeenCalledWith('player-123', 'team-789');
    });
  });

  describe('leaveQueue', () => {
    it('should successfully leave queue', async () => {
      // Arrange
      matchmakingService.leaveQueue.mockResolvedValue();

      // Act
      const result = await controller.leaveQueue(mockRequest);

      // Assert
      expect(result).toEqual({ success: true });
      expect(matchmakingService.leaveQueue).toHaveBeenCalledWith('player-123');
    });

    it('should throw NotFoundException when player not in queue', async () => {
      // Arrange
      matchmakingService.leaveQueue.mockRejectedValue(
        new NotFoundException('Игрок не найден в очереди'),
      );

      // Act & Assert
      await expect(controller.leaveQueue(mockRequest)).rejects.toThrow(NotFoundException);
      expect(matchmakingService.leaveQueue).toHaveBeenCalledWith('player-123');
    });
  });

  describe('getStatus', () => {
    it('should return not_in_queue when player not in queue', async () => {
      // Arrange
      matchmakingService.getPlayerQueueEntry.mockResolvedValue(null);

      // Act
      const result = await controller.getStatus(mockRequest);

      // Assert
      expect(result).toEqual({ status: 'not_in_queue' });
      expect(matchmakingService.getPlayerQueueEntry).toHaveBeenCalledWith('player-123');
    });

    it('should return queued status when player is waiting', async () => {
      // Arrange
      matchmakingService.getPlayerQueueEntry.mockResolvedValue(mockQueueEntry);

      // Act
      const result = await controller.getStatus(mockRequest);

      // Assert
      expect(result).toEqual({
        status: 'queued',
        queueEntry: {
          id: 'queue-456',
          teamId: 'team-789',
          rating: MATCHMAKING_CONSTANTS.DEFAULT_ELO,
          waitTime: 30000,
          joinedAt: expect.any(Date),
        },
      });
      expect(matchmakingService.getPlayerQueueEntry).toHaveBeenCalledWith('player-123');
    });

    it('should return matched status when player has been matched', async () => {
      // Arrange
      const matchedEntry = {
        ...mockQueueEntry,
        status: MatchmakingStatus.MATCHED,
        matchId: 'battle-123',
      };
      matchmakingService.getPlayerQueueEntry.mockResolvedValue(matchedEntry);

      // Act
      const result = await controller.getStatus(mockRequest);

      // Assert
      expect(result).toEqual({
        status: 'matched',
        match: {
          battleId: 'battle-123',
          opponentId: 'unknown',
          ratingDifference: 0,
        },
      });
      expect(matchmakingService.getPlayerQueueEntry).toHaveBeenCalledWith('player-123');
    });

    it('should return not_in_queue on service error', async () => {
      // Arrange
      matchmakingService.getPlayerQueueEntry.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await controller.getStatus(mockRequest);

      // Assert
      expect(result).toEqual({ status: 'not_in_queue' });
      expect(matchmakingService.getPlayerQueueEntry).toHaveBeenCalledWith('player-123');
    });
  });

  describe('findMatch', () => {
    it('should return match when opponent found', async () => {
      // Arrange
      matchmakingService.findMatch.mockResolvedValue(mockMatch);

      // Act
      const result = await controller.findMatch(mockRequest);

      // Assert
      expect(result).toEqual({
        found: true,
        match: {
          battleId: 'battle-123',
          opponentId: 'player-opponent',
          ratingDifference: 50,
        },
      });
      expect(matchmakingService.findMatch).toHaveBeenCalledWith('player-123');
    });

    it('should return not found when no opponent available', async () => {
      // Arrange
      matchmakingService.findMatch.mockResolvedValue(null);

      // Act
      const result = await controller.findMatch(mockRequest);

      // Assert
      expect(result).toEqual({ found: false });
      expect(matchmakingService.findMatch).toHaveBeenCalledWith('player-123');
    });

    it('should throw NotFoundException when player not in queue', async () => {
      // Arrange
      matchmakingService.findMatch.mockRejectedValue(
        new NotFoundException('Игрок не найден в очереди'),
      );

      // Act & Assert
      await expect(controller.findMatch(mockRequest)).rejects.toThrow(NotFoundException);
      expect(matchmakingService.findMatch).toHaveBeenCalledWith('player-123');
    });
  });
});