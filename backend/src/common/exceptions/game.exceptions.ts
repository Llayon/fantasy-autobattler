/**
 * Custom Game Exceptions for Fantasy Autobattler.
 * Provides domain-specific exceptions with consistent error messages.
 * 
 * @fileoverview Custom exception classes for game-specific error scenarios.
 * All exceptions extend NestJS HttpException with appropriate status codes
 * and user-friendly error messages in Russian.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when team configuration is invalid.
 * Used for team validation failures like invalid positions,
 * duplicate units, or malformed team data.
 * 
 * @example
 * throw new InvalidTeamException('Позиция должна быть в зоне развертывания (ряды 0-1)');
 */
export class InvalidTeamException extends HttpException {
  /**
   * Creates a new InvalidTeamException.
   * 
   * @param message - Specific validation error message
   * @param details - Optional additional error details
   */
  constructor(message: string = 'Неверная конфигурация команды', details?: string) {
    const fullMessage = details ? `${message}: ${details}` : message;
    
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: fullMessage,
        error: 'Invalid Team Configuration',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when team budget is exceeded.
 * Used when team cost exceeds the maximum allowed budget (30 points).
 * 
 * @example
 * throw new BudgetExceededException(35, 30);
 */
export class BudgetExceededException extends HttpException {
  /**
   * Creates a new BudgetExceededException.
   * 
   * @param actualCost - The calculated team cost
   * @param maxBudget - The maximum allowed budget
   */
  constructor(actualCost: number, maxBudget: number = 30) {
    const message = `Стоимость команды ${actualCost} превышает бюджет ${maxBudget} очков`;
    
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Budget Exceeded',
        actualCost,
        maxBudget,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when a match or opponent is not found.
 * Used in matchmaking when no suitable opponents are available
 * or when trying to access a non-existent match.
 * 
 * @example
 * throw new MatchNotFoundException('Подходящие противники не найдены');
 */
export class MatchNotFoundException extends HttpException {
  /**
   * Creates a new MatchNotFoundException.
   * 
   * @param message - Specific match error message
   * @param playerId - Optional player ID for context
   */
  constructor(
    message: string = 'Матч не найден',
    playerId?: string,
  ) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Match Not Found',
        playerId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when trying to view a battle that has already been viewed.
 * Used to prevent duplicate battle view tracking or when battle
 * viewing restrictions are in place.
 * 
 * @example
 * throw new BattleAlreadyViewedException('battle-123', 'player-456');
 */
export class BattleAlreadyViewedException extends HttpException {
  /**
   * Creates a new BattleAlreadyViewedException.
   * 
   * @param battleId - The battle ID that was already viewed
   * @param playerId - The player ID who already viewed it
   */
  constructor(battleId: string, playerId: string) {
    const message = `Битва уже была просмотрена игроком`;
    
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Battle Already Viewed',
        battleId,
        playerId,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception thrown when player is not in matchmaking queue.
 * Used when trying to perform queue operations on players
 * who are not currently queued.
 * 
 * @example
 * throw new PlayerNotInQueueException('player-123');
 */
export class PlayerNotInQueueException extends HttpException {
  /**
   * Creates a new PlayerNotInQueueException.
   * 
   * @param playerId - The player ID not found in queue
   */
  constructor(playerId: string) {
    const message = `Игрок не находится в очереди поиска матча`;
    
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Player Not In Queue',
        playerId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when player already has an active team.
 * Used when trying to activate multiple teams simultaneously
 * or when team activation conflicts occur.
 * 
 * @example
 * throw new ActiveTeamConflictException('player-123', 'team-456');
 */
export class ActiveTeamConflictException extends HttpException {
  /**
   * Creates a new ActiveTeamConflictException.
   * 
   * @param playerId - The player ID with active team conflict
   * @param activeTeamId - The currently active team ID
   */
  constructor(playerId: string, activeTeamId: string) {
    const message = `У игрока уже есть активная команда`;
    
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Active Team Conflict',
        playerId,
        activeTeamId,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception thrown when trying to delete an active team.
 * Used to prevent deletion of teams that are currently
 * being used for matchmaking or battles.
 * 
 * @example
 * throw new CannotDeleteActiveTeamException('team-123');
 */
export class CannotDeleteActiveTeamException extends HttpException {
  /**
   * Creates a new CannotDeleteActiveTeamException.
   * 
   * @param teamId - The active team ID that cannot be deleted
   */
  constructor(teamId: string) {
    const message = `Нельзя удалить активную команду`;
    
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Cannot Delete Active Team',
        teamId,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when unit is not found in the game database.
 * Used when referencing invalid unit IDs in team composition
 * or battle simulation.
 * 
 * @example
 * throw new UnitNotFoundException('invalid_unit_id');
 */
export class UnitNotFoundException extends HttpException {
  /**
   * Creates a new UnitNotFoundException.
   * 
   * @param unitId - The invalid unit ID
   */
  constructor(unitId: string) {
    const message = `Юнит '${unitId}' не найден`;
    
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Unit Not Found',
        unitId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when battle simulation fails.
 * Used when battle cannot be created or simulated due to
 * invalid teams, missing data, or system errors.
 * 
 * @example
 * throw new BattleSimulationException('Invalid team setup', 'battle-123');
 */
export class BattleSimulationException extends HttpException {
  /**
   * Creates a new BattleSimulationException.
   * 
   * @param reason - The reason why simulation failed
   * @param battleId - Optional battle ID for context
   */
  constructor(reason: string, battleId?: string) {
    const message = `Ошибка симуляции битвы: ${reason}`;
    
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'Battle Simulation Failed',
        reason,
        battleId,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}