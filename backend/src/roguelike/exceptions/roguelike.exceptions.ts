/**
 * Custom Exceptions for Roguelike Mode
 *
 * Provides domain-specific exceptions for roguelike run operations.
 * All exceptions extend NestJS HttpException with appropriate status codes.
 *
 * @module roguelike/exceptions
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when a roguelike run is not found.
 *
 * @example
 * throw new RunNotFoundException('run-uuid-123');
 */
export class RunNotFoundException extends HttpException {
  /**
   * Creates a new RunNotFoundException.
   *
   * @param runId - The run ID that was not found
   */
  constructor(runId: string) {
    const message = `Забег не найден`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Run Not Found',
        runId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when trying to access another player's run.
 *
 * @example
 * throw new RunAccessDeniedException('run-uuid', 'player-uuid');
 */
export class RunAccessDeniedException extends HttpException {
  /**
   * Creates a new RunAccessDeniedException.
   *
   * @param runId - The run ID being accessed
   * @param playerId - The player ID attempting access
   */
  constructor(runId: string, playerId: string) {
    const message = `Доступ к забегу запрещен`;

    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: 'Run Access Denied',
        runId,
        playerId,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Exception thrown when trying to perform action on a completed run.
 *
 * @example
 * throw new RunAlreadyCompletedException('run-uuid', 'won');
 */
export class RunAlreadyCompletedException extends HttpException {
  /**
   * Creates a new RunAlreadyCompletedException.
   *
   * @param runId - The completed run ID
   * @param status - The run's final status ('won' | 'lost')
   */
  constructor(runId: string, status: 'won' | 'lost') {
    const statusText = status === 'won' ? 'выигран' : 'проигран';
    const message = `Забег уже завершен (${statusText})`;

    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Run Already Completed',
        runId,
        status,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception thrown when player already has an active run.
 *
 * @example
 * throw new ActiveRunExistsException('player-uuid', 'existing-run-uuid');
 */
export class ActiveRunExistsException extends HttpException {
  /**
   * Creates a new ActiveRunExistsException.
   *
   * @param playerId - The player ID with existing run
   * @param existingRunId - The existing active run ID
   */
  constructor(playerId: string, existingRunId: string) {
    const message = `У игрока уже есть активный забег`;

    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Active Run Exists',
        playerId,
        existingRunId,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception thrown when draft pick is invalid.
 *
 * @example
 * throw new InvalidDraftPickException('Card not in draft options', ['card-1', 'card-2']);
 */
export class InvalidDraftPickException extends HttpException {
  /**
   * Creates a new InvalidDraftPickException.
   *
   * @param reason - Why the pick is invalid
   * @param invalidPicks - The invalid card IDs
   */
  constructor(reason: string, invalidPicks?: string[]) {
    const message = `Неверный выбор драфта: ${reason}`;

    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Invalid Draft Pick',
        reason,
        invalidPicks,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when player doesn't have enough gold.
 *
 * @example
 * throw new InsufficientGoldException(5, 3, 'upgrade');
 */
export class InsufficientGoldException extends HttpException {
  /**
   * Creates a new InsufficientGoldException.
   *
   * @param required - Gold amount required
   * @param available - Gold amount available
   * @param action - The action that requires gold
   */
  constructor(required: number, available: number, action: string = 'action') {
    const message = `Недостаточно золота для ${action}: требуется ${required}, доступно ${available}`;

    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Insufficient Gold',
        required,
        available,
        action,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when upgrade is invalid.
 *
 * @example
 * throw new InvalidUpgradeException('Unit already at max tier', 'footman-1');
 */
export class InvalidUpgradeException extends HttpException {
  /**
   * Creates a new InvalidUpgradeException.
   *
   * @param reason - Why the upgrade is invalid
   * @param cardInstanceId - The card instance ID
   */
  constructor(reason: string, cardInstanceId?: string) {
    const message = `Невозможно улучшить юнита: ${reason}`;

    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Invalid Upgrade',
        reason,
        cardInstanceId,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when faction/leader combination is invalid.
 *
 * @example
 * throw new InvalidFactionLeaderException('undead', 'commander_aldric');
 */
export class InvalidFactionLeaderException extends HttpException {
  /**
   * Creates a new InvalidFactionLeaderException.
   *
   * @param faction - The selected faction
   * @param leaderId - The selected leader ID
   */
  constructor(faction: string, leaderId: string) {
    const message = `Лидер '${leaderId}' не принадлежит фракции '${faction}'`;

    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message,
        error: 'Invalid Faction Leader Combination',
        faction,
        leaderId,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Exception thrown when faction is not found.
 *
 * @example
 * throw new FactionNotFoundException('invalid_faction');
 */
export class FactionNotFoundException extends HttpException {
  /**
   * Creates a new FactionNotFoundException.
   *
   * @param factionId - The invalid faction ID
   */
  constructor(factionId: string) {
    const message = `Фракция '${factionId}' не найдена`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Faction Not Found',
        factionId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when leader is not found.
 *
 * @example
 * throw new LeaderNotFoundException('invalid_leader');
 */
export class LeaderNotFoundException extends HttpException {
  /**
   * Creates a new LeaderNotFoundException.
   *
   * @param leaderId - The invalid leader ID
   */
  constructor(leaderId: string) {
    const message = `Лидер '${leaderId}' не найден`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Leader Not Found',
        leaderId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when no opponent is found for matchmaking.
 *
 * @example
 * throw new NoOpponentFoundException('run-uuid', 3);
 */
export class NoOpponentFoundException extends HttpException {
  /**
   * Creates a new NoOpponentFoundException.
   *
   * @param runId - The run ID searching for opponent
   * @param wins - Current win count
   */
  constructor(runId: string, wins: number) {
    const message = `Противник не найден для забега с ${wins} победами`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'No Opponent Found',
        runId,
        wins,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception thrown when draft is not available.
 *
 * @example
 * throw new DraftNotAvailableException('run-uuid', 'No cards remaining in deck');
 */
export class DraftNotAvailableException extends HttpException {
  /**
   * Creates a new DraftNotAvailableException.
   *
   * @param runId - The run ID
   * @param reason - Why draft is not available
   */
  constructor(runId: string, reason: string) {
    const message = `Драфт недоступен: ${reason}`;

    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Draft Not Available',
        runId,
        reason,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

