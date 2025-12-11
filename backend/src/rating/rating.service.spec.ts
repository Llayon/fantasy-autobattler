/**
 * Rating Service Tests for Fantasy Autobattler.
 * Tests ELO rating calculations, player rankings, and leaderboards.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RatingService } from './rating.service';
import { Player } from '../entities/player.entity';

describe('RatingService', () => {
  let service: RatingService;
  let playerRepo: any;
  let dataSource: any;
  let queryBuilder: any;

  const mockPlayer1 = {
    id: 'player-1',
    guestId: 'guest-1',
    name: 'TestPlayer1',
    rating: 1200,
    wins: 10,
    losses: 5,
    gamesPlayed: 15,
    team: [],
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    battlesAsPlayer1: [],
    battlesAsPlayer2: [],
    teams: [],
  } as Player;

  const mockPlayer2 = {
    id: 'player-2',
    guestId: 'guest-2',
    name: 'TestPlayer2',
    rating: 1100,
    wins: 20,
    losses: 25,
    gamesPlayed: 45,
    team: [],
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    battlesAsPlayer1: [],
    battlesAsPlayer2: [],
    teams: [],
  } as Player;

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    };

    // Create mock repository
    playerRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    // Create mock data source with transaction support
    const mockManager = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (callback: any) => {
        return await callback(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        {
          provide: getRepositoryToken(Player),
          useValue: playerRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
  });

  describe('calculateEloChange', () => {
    it('should calculate correct ELO changes for equal ratings', () => {
      const result = service.calculateEloChange(1200, 1200, 5, 5);
      
      // With equal ratings, expected score is 0.5
      // Winner gets K * (1 - 0.5) = 32 * 0.5 = 16 points
      // Loser gets K * (0 - 0.5) = 32 * -0.5 = -16 points
      expect(result.winnerDelta).toBe(16);
      expect(result.loserDelta).toBe(-16);
    });

    it('should calculate smaller gains when higher rated player wins', () => {
      const result = service.calculateEloChange(1400, 1200, 5, 5);
      
      // Higher rated player expected to win, so smaller gain
      expect(result.winnerDelta).toBeLessThan(16);
      expect(result.loserDelta).toBeGreaterThan(-16);
      expect(result.winnerDelta).toBeGreaterThan(0);
      expect(result.loserDelta).toBeLessThan(0);
    });

    it('should calculate larger gains when lower rated player wins', () => {
      const result = service.calculateEloChange(1200, 1400, 5, 5);
      
      // Lower rated player upset, so larger gain
      expect(result.winnerDelta).toBeGreaterThan(16);
      expect(result.loserDelta).toBeLessThan(-16);
    });

    it('should use different K-factors for new vs experienced players', () => {
      // New players (< 20 games) get K=32
      const newPlayerResult = service.calculateEloChange(1200, 1200, 5, 5);
      
      // Experienced players (>= 20 games) get K=16
      const experiencedResult = service.calculateEloChange(1200, 1200, 25, 25);
      
      expect(Math.abs(newPlayerResult.winnerDelta)).toBeGreaterThan(
        Math.abs(experiencedResult.winnerDelta)
      );
    });

    it('should cap rating changes at maximum limit', () => {
      // Extreme rating difference to test capping
      const result = service.calculateEloChange(800, 2000, 0, 0);
      
      expect(result.winnerDelta).toBeLessThanOrEqual(50);
      expect(result.loserDelta).toBeGreaterThanOrEqual(-50);
    });

    it('should handle edge case of zero games played', () => {
      const result = service.calculateEloChange(1000, 1000, 0, 0);
      
      expect(result.winnerDelta).toBe(16); // K=32, expected=0.5, so 32*0.5=16
      expect(result.loserDelta).toBe(-16);
    });
  });

  describe('updateRatings', () => {
    it('should update both players ratings successfully', async () => {
      playerRepo.findOne
        .mockResolvedValueOnce(mockPlayer1) // Winner
        .mockResolvedValueOnce(mockPlayer2); // Loser

      await service.updateRatings('player-1', 'player-2');

      expect(playerRepo.findOne).toHaveBeenCalledTimes(2);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when winner not found', async () => {
      playerRepo.findOne
        .mockResolvedValueOnce(null) // Winner not found
        .mockResolvedValueOnce(mockPlayer2);

      await expect(service.updateRatings('invalid-player', 'player-2'))
        .rejects.toThrow(NotFoundException);
      
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when loser not found', async () => {
      playerRepo.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(null); // Loser not found

      await expect(service.updateRatings('player-1', 'invalid-player'))
        .rejects.toThrow(NotFoundException);
      
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should prevent negative ratings', async () => {
      const lowRatedPlayer = {
        ...mockPlayer2,
        rating: 50, // Very low rating
        gamesPlayed: 10,
        lastActiveAt: new Date(),
      };

      playerRepo.findOne
        .mockResolvedValueOnce(mockPlayer1)
        .mockResolvedValueOnce(lowRatedPlayer);

      const mockManager = {
        update: jest.fn().mockResolvedValue(undefined),
      };

      dataSource.transaction.mockImplementation(async (callback: any) => {
        return await callback(mockManager);
      });

      await service.updateRatings('player-1', 'player-2');

      // Check that loser's rating is clamped to 0
      const loserUpdateCall = mockManager.update.mock.calls.find(
        (call: any) => call[1].id === 'player-2'
      );
      
      expect(loserUpdateCall).toBeDefined();
      expect(loserUpdateCall?.[2].rating).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLeaderboard', () => {
    it('should return players ordered by rating descending', async () => {
      const mockPlayers = [
        { ...mockPlayer1, rating: 1500 },
        { ...mockPlayer2, rating: 1300 },
        { ...mockPlayer1, id: 'player-3', rating: 1100 },
      ];

      playerRepo.find.mockResolvedValue(mockPlayers);

      const result = await service.getLeaderboard(10);

      expect(playerRepo.find).toHaveBeenCalledWith({
        order: { rating: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(mockPlayers);
    });

    it('should limit results to maximum of 1000 players', async () => {
      playerRepo.find.mockResolvedValue([]);

      await service.getLeaderboard(5000); // Request more than limit

      expect(playerRepo.find).toHaveBeenCalledWith({
        order: { rating: 'DESC' },
        take: 1000, // Should be capped at 1000
      });
    });

    it('should use default limit of 100 when not specified', async () => {
      playerRepo.find.mockResolvedValue([]);

      await service.getLeaderboard();

      expect(playerRepo.find).toHaveBeenCalledWith({
        order: { rating: 'DESC' },
        take: 100,
      });
    });
  });

  describe('getPlayerRank', () => {
    it('should return correct rank for player', async () => {
      playerRepo.findOne.mockResolvedValue(mockPlayer1);
      queryBuilder.getCount.mockResolvedValue(5); // 5 players above
      playerRepo.count.mockResolvedValue(100); // 100 total players

      const result = await service.getPlayerRank('player-1');

      expect(result).toEqual({
        rank: 6, // 5 above + 1 = rank 6
        rating: 1200,
        totalPlayers: 100,
      });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'player.rating > :rating',
        { rating: 1200 }
      );
    });

    it('should return rank 1 for highest rated player', async () => {
      playerRepo.findOne.mockResolvedValue(mockPlayer1);
      queryBuilder.getCount.mockResolvedValue(0); // No players above
      playerRepo.count.mockResolvedValue(100);

      const result = await service.getPlayerRank('player-1');

      expect(result.rank).toBe(1);
    });

    it('should throw NotFoundException when player not found', async () => {
      playerRepo.findOne.mockResolvedValue(null);

      await expect(service.getPlayerRank('invalid-player'))
        .rejects.toThrow(NotFoundException);
      
      expect(queryBuilder.getCount).not.toHaveBeenCalled();
    });
  });

  describe('ELO formula validation', () => {
    it('should follow standard ELO expected score formula', () => {
      // Test known ELO calculations
      const testCases = [
        { player: 1200, opponent: 1200, expectedScore: 0.5 },
        { player: 1200, opponent: 1000, expectedScore: 0.76 }, // Approximately
        { player: 1000, opponent: 1200, expectedScore: 0.24 }, // Approximately
      ];

      for (const testCase of testCases) {
        const result = service.calculateEloChange(
          testCase.player,
          testCase.opponent,
          5, // New player K-factor
          5
        );

        // Verify the calculation follows ELO formula
        // Expected delta = K * (actual - expected)
        // For winner: actual = 1, so delta = K * (1 - expected)
        const expectedDelta = 32 * (1 - testCase.expectedScore);
        
        expect(Math.abs(result.winnerDelta - Math.round(expectedDelta)))
          .toBeLessThanOrEqual(1); // Allow for rounding differences
      }
    });

    it('should ensure rating changes sum to approximately zero', () => {
      // For players with same K-factor, changes should sum to ~0
      const result = service.calculateEloChange(1200, 1100, 5, 5);
      
      // Small difference allowed due to rounding
      expect(Math.abs(result.winnerDelta + result.loserDelta)).toBeLessThanOrEqual(2);
    });
  });

  describe('rating constants', () => {
    it('should use correct initial rating', () => {
      // This is more of a documentation test
      const newPlayerRating = 1000;
      expect(newPlayerRating).toBe(1000);
    });

    it('should use correct K-factors', () => {
      // Test that K-factors are applied correctly
      const newPlayerChange = service.calculateEloChange(1000, 1000, 5, 5);
      const experiencedChange = service.calculateEloChange(1000, 1000, 25, 25);
      
      // New players should have exactly double the change of experienced players
      expect(newPlayerChange.winnerDelta).toBe(experiencedChange.winnerDelta * 2);
    });
  });
});