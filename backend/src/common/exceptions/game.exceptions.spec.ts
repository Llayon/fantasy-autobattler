/**
 * Test suite for Custom Game Exceptions.
 * Verifies proper exception creation, status codes, and error messages.
 */

import { HttpStatus } from '@nestjs/common';
import {
  InvalidTeamException,
  BudgetExceededException,
  MatchNotFoundException,
  BattleAlreadyViewedException,
  PlayerNotInQueueException,
  ActiveTeamConflictException,
  CannotDeleteActiveTeamException,
  UnitNotFoundException,
  BattleSimulationException,
} from './game.exceptions';

describe('Game Exceptions', () => {
  describe('InvalidTeamException', () => {
    it('should create exception with default message', () => {
      const exception = new InvalidTeamException();
      
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Неверная конфигурация команды',
        error: 'Invalid Team Configuration',
      });
    });

    it('should create exception with custom message', () => {
      const customMessage = 'Позиция должна быть в зоне развертывания';
      const exception = new InvalidTeamException(customMessage);
      
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: customMessage,
        error: 'Invalid Team Configuration',
      });
    });

    it('should create exception with message and details', () => {
      const message = 'Неверная позиция';
      const details = 'ряды 0-1';
      const exception = new InvalidTeamException(message, details);
      
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Неверная позиция: ряды 0-1',
        error: 'Invalid Team Configuration',
      });
    });
  });

  describe('BudgetExceededException', () => {
    it('should create exception with cost and default budget', () => {
      const exception = new BudgetExceededException(35);
      
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Стоимость команды 35 превышает бюджет 30 очков',
        error: 'Budget Exceeded',
        actualCost: 35,
        maxBudget: 30,
      });
    });

    it('should create exception with custom budget', () => {
      const exception = new BudgetExceededException(25, 20);
      
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Стоимость команды 25 превышает бюджет 20 очков',
        error: 'Budget Exceeded',
        actualCost: 25,
        maxBudget: 20,
      });
    });
  });

  describe('MatchNotFoundException', () => {
    it('should create exception with default message', () => {
      const exception = new MatchNotFoundException();
      
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Матч не найден',
        error: 'Match Not Found',
        playerId: undefined,
      });
    });

    it('should create exception with custom message and player ID', () => {
      const message = 'Подходящие противники не найдены';
      const playerId = 'player-123';
      const exception = new MatchNotFoundException(message, playerId);
      
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Match Not Found',
        playerId,
      });
    });
  });

  describe('BattleAlreadyViewedException', () => {
    it('should create exception with battle and player IDs', () => {
      const battleId = 'battle-123';
      const playerId = 'player-456';
      const exception = new BattleAlreadyViewedException(battleId, playerId);
      
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.CONFLICT,
        message: 'Битва уже была просмотрена игроком',
        error: 'Battle Already Viewed',
        battleId,
        playerId,
      });
    });
  });

  describe('PlayerNotInQueueException', () => {
    it('should create exception with player ID', () => {
      const playerId = 'player-789';
      const exception = new PlayerNotInQueueException(playerId);
      
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Игрок не находится в очереди поиска матча',
        error: 'Player Not In Queue',
        playerId,
      });
    });
  });

  describe('ActiveTeamConflictException', () => {
    it('should create exception with player and team IDs', () => {
      const playerId = 'player-123';
      const activeTeamId = 'team-456';
      const exception = new ActiveTeamConflictException(playerId, activeTeamId);
      
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.CONFLICT,
        message: 'У игрока уже есть активная команда',
        error: 'Active Team Conflict',
        playerId,
        activeTeamId,
      });
    });
  });

  describe('CannotDeleteActiveTeamException', () => {
    it('should create exception with team ID', () => {
      const teamId = 'team-789';
      const exception = new CannotDeleteActiveTeamException(teamId);
      
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Нельзя удалить активную команду',
        error: 'Cannot Delete Active Team',
        teamId,
      });
    });
  });

  describe('UnitNotFoundException', () => {
    it('should create exception with unit ID', () => {
      const unitId = 'invalid_unit';
      const exception = new UnitNotFoundException(unitId);
      
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Юнит 'invalid_unit' не найден",
        error: 'Unit Not Found',
        unitId,
      });
    });
  });

  describe('BattleSimulationException', () => {
    it('should create exception with reason only', () => {
      const reason = 'Invalid team setup';
      const exception = new BattleSimulationException(reason);
      
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Ошибка симуляции битвы: Invalid team setup',
        error: 'Battle Simulation Failed',
        reason,
        battleId: undefined,
      });
    });

    it('should create exception with reason and battle ID', () => {
      const reason = 'Missing unit data';
      const battleId = 'battle-123';
      const exception = new BattleSimulationException(reason, battleId);
      
      expect(exception.getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Ошибка симуляции битвы: Missing unit data',
        error: 'Battle Simulation Failed',
        reason,
        battleId,
      });
    });
  });

  describe('Exception inheritance', () => {
    it('should properly extend HttpException', () => {
      const exceptions = [
        new InvalidTeamException(),
        new BudgetExceededException(35),
        new MatchNotFoundException(),
        new BattleAlreadyViewedException('battle-1', 'player-1'),
        new PlayerNotInQueueException('player-1'),
        new ActiveTeamConflictException('player-1', 'team-1'),
        new CannotDeleteActiveTeamException('team-1'),
        new UnitNotFoundException('unit-1'),
        new BattleSimulationException('test reason'),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(Error);
        expect(typeof exception.getStatus).toBe('function');
        expect(typeof exception.getResponse).toBe('function');
        expect(exception.getStatus()).toBeGreaterThanOrEqual(400);
        expect(exception.getStatus()).toBeLessThan(600);
      });
    });

    it('should have proper status codes for different exception types', () => {
      const statusCodeTests = [
        { exception: new InvalidTeamException(), expectedStatus: HttpStatus.BAD_REQUEST },
        { exception: new BudgetExceededException(35), expectedStatus: HttpStatus.BAD_REQUEST },
        { exception: new MatchNotFoundException(), expectedStatus: HttpStatus.NOT_FOUND },
        { exception: new BattleAlreadyViewedException('b1', 'p1'), expectedStatus: HttpStatus.CONFLICT },
        { exception: new PlayerNotInQueueException('p1'), expectedStatus: HttpStatus.NOT_FOUND },
        { exception: new ActiveTeamConflictException('p1', 't1'), expectedStatus: HttpStatus.CONFLICT },
        { exception: new CannotDeleteActiveTeamException('t1'), expectedStatus: HttpStatus.BAD_REQUEST },
        { exception: new UnitNotFoundException('u1'), expectedStatus: HttpStatus.NOT_FOUND },
        { exception: new BattleSimulationException('reason'), expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR },
      ];

      statusCodeTests.forEach(({ exception, expectedStatus }) => {
        expect(exception.getStatus()).toBe(expectedStatus);
      });
    });

    it('should have Russian error messages', () => {
      const exceptions = [
        new InvalidTeamException(),
        new BudgetExceededException(35),
        new MatchNotFoundException(),
        new BattleAlreadyViewedException('battle-1', 'player-1'),
        new PlayerNotInQueueException('player-1'),
        new ActiveTeamConflictException('player-1', 'team-1'),
        new CannotDeleteActiveTeamException('team-1'),
        new UnitNotFoundException('unit-1'),
        new BattleSimulationException('test reason'),
      ];

      exceptions.forEach((exception) => {
        const response = exception.getResponse() as any;
        expect(typeof response.message).toBe('string');
        expect(response.message.length).toBeGreaterThan(0);
        // Check that message contains Cyrillic characters (Russian)
        expect(/[а-яё]/i.test(response.message)).toBe(true);
      });
    });
  });
});