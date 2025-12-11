/**
 * Unit tests for TeamService.
 * Tests team CRUD operations, validation integration, and business logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamValidator, CreateTeamRequest } from './team.validator';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';

describe('TeamService', () => {
  let service: TeamService;
  let teamRepo: jest.Mocked<Repository<Team>>;
  let playerRepo: jest.Mocked<Repository<Player>>;
  let validator: jest.Mocked<TeamValidator>;

  const mockPlayer = {
    id: 'player-123',
    guestId: 'guest-123',
    name: 'Test Player',
  };

  const mockTeam = {
    id: 'team-123',
    playerId: 'player-123',
    name: 'Test Team',
    units: [
      { unitId: 'knight', position: { x: 0, y: 0 } },
      { unitId: 'mage', position: { x: 1, y: 0 } },
    ],
    totalCost: 11,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTeamRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockPlayerRepo = {
      findOne: jest.fn(),
    };

    const mockValidator = {
      validateTeam: jest.fn(),
      validateForBattle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: getRepositoryToken(Team),
          useValue: mockTeamRepo,
        },
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayerRepo,
        },
        {
          provide: TeamValidator,
          useValue: mockValidator,
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
    teamRepo = module.get(getRepositoryToken(Team));
    playerRepo = module.get(getRepositoryToken(Player));
    validator = module.get(TeamValidator);
  });

  describe('createTeam', () => {
    const teamData: CreateTeamRequest = {
      name: 'New Team',
      units: [
        { unitId: 'knight', position: { x: 0, y: 0 } },
      ],
    };

    it('should create a team successfully', async () => {
      playerRepo.findOne.mockResolvedValue(mockPlayer as Player);
      validator.validateTeam.mockReturnValue({
        valid: true,
        data: {
          totalCost: 5,
          unitCount: 1,
        },
      });
      teamRepo.create.mockReturnValue(mockTeam as Team);
      teamRepo.save.mockResolvedValue(mockTeam as Team);

      const result = await service.createTeam('player-123', teamData);

      expect(playerRepo.findOne).toHaveBeenCalledWith({ where: { id: 'player-123' } });
      expect(validator.validateTeam).toHaveBeenCalledWith(teamData);
      expect(teamRepo.create).toHaveBeenCalledWith({
        playerId: 'player-123',
        name: 'New Team',
        units: teamData.units,
        totalCost: 5,
        isActive: false,
      });
      expect(result.name).toBe('Test Team');
      expect(result.units).toHaveLength(2);
    });

    it('should throw NotFoundException if player not found', async () => {
      playerRepo.findOne.mockResolvedValue(null);

      await expect(service.createTeam('invalid-player', teamData))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if validation fails', async () => {
      playerRepo.findOne.mockResolvedValue(mockPlayer as Player);
      validator.validateTeam.mockReturnValue({
        valid: false,
        error: 'Team exceeds budget',
      });

      await expect(service.createTeam('player-123', teamData))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getPlayerTeams', () => {
    it('should return player teams', async () => {
      const teams = [mockTeam, { ...mockTeam, id: 'team-456', name: 'Team 2' }];
      teamRepo.find.mockResolvedValue(teams as Team[]);

      const result = await service.getPlayerTeams('player-123');

      expect(teamRepo.find).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Test Team');
    });
  });

  describe('getTeam', () => {
    it('should return a specific team', async () => {
      teamRepo.findOne.mockResolvedValue(mockTeam as Team);

      const result = await service.getTeam('team-123', 'player-123');

      expect(teamRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'team-123', playerId: 'player-123' },
      });
      expect(result.id).toBe('team-123');
    });

    it('should throw NotFoundException if team not found', async () => {
      teamRepo.findOne.mockResolvedValue(null);

      await expect(service.getTeam('invalid-team', 'player-123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTeam', () => {
    const updateData = {
      name: 'Updated Team',
      units: [{ unitId: 'mage', position: { x: 0, y: 0 } }],
    };

    it('should update a team successfully', async () => {
      teamRepo.findOne.mockResolvedValue(mockTeam as Team);
      validator.validateTeam.mockReturnValue({
        valid: true,
        data: {
          totalCost: 6,
          unitCount: 1,
        },
      });
      teamRepo.save.mockResolvedValue({ ...mockTeam, ...updateData } as Team);

      const result = await service.updateTeam('team-123', 'player-123', updateData);

      expect(validator.validateTeam).toHaveBeenCalled();
      expect(teamRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Team');
    });

    it('should throw NotFoundException if team not found', async () => {
      teamRepo.findOne.mockResolvedValue(null);

      await expect(service.updateTeam('invalid-team', 'player-123', updateData))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if validation fails', async () => {
      teamRepo.findOne.mockResolvedValue(mockTeam as Team);
      validator.validateTeam.mockReturnValue({
        valid: false,
        error: 'Invalid team configuration',
      });

      await expect(service.updateTeam('team-123', 'player-123', updateData))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team successfully', async () => {
      teamRepo.findOne.mockResolvedValue(mockTeam as Team);
      teamRepo.remove.mockResolvedValue(mockTeam as Team);

      await service.deleteTeam('team-123', 'player-123');

      expect(teamRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'team-123', playerId: 'player-123' },
      });
      expect(teamRepo.remove).toHaveBeenCalledWith(mockTeam);
    });

    it('should throw NotFoundException if team not found', async () => {
      teamRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteTeam('invalid-team', 'player-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if trying to delete active team', async () => {
      const activeTeam = { ...mockTeam, isActive: true };
      teamRepo.findOne.mockResolvedValue(activeTeam as Team);

      await expect(service.deleteTeam('team-123', 'player-123'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('activateTeam', () => {
    it('should activate a team successfully', async () => {
      teamRepo.findOne.mockResolvedValue(mockTeam as Team);
      validator.validateForBattle.mockReturnValue(true);
      teamRepo.update.mockResolvedValue({ affected: 1 } as any);
      teamRepo.save.mockResolvedValue({ ...mockTeam, isActive: true } as Team);

      const result = await service.activateTeam('team-123', 'player-123');

      expect(validator.validateForBattle).toHaveBeenCalledWith(mockTeam);
      expect(teamRepo.update).toHaveBeenCalledWith(
        { playerId: 'player-123', isActive: true },
        { isActive: false }
      );
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException if team not found', async () => {
      teamRepo.findOne.mockResolvedValue(null);

      await expect(service.activateTeam('invalid-team', 'player-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if team not valid for battle', async () => {
      teamRepo.findOne.mockResolvedValue(mockTeam as Team);
      validator.validateForBattle.mockReturnValue(false);

      await expect(service.activateTeam('team-123', 'player-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveTeam', () => {
    it('should return active team', async () => {
      const activeTeam = { ...mockTeam, isActive: true };
      teamRepo.findOne.mockResolvedValue(activeTeam as Team);

      const result = await service.getActiveTeam('player-123');

      expect(teamRepo.findOne).toHaveBeenCalledWith({
        where: { playerId: 'player-123', isActive: true },
      });
      expect(result?.isActive).toBe(true);
    });

    it('should return null if no active team', async () => {
      teamRepo.findOne.mockResolvedValue(null);

      const result = await service.getActiveTeam('player-123');

      expect(result).toBeNull();
    });
  });
});