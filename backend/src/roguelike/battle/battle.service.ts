/**
 * Roguelike Battle Service
 *
 * Handles battle simulation and persistence for roguelike mode.
 * Integrates with existing battle simulator and BattleLog entity.
 *
 * @module roguelike/battle/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BattleLog, BattleStatus } from '../../entities/battle-log.entity';
import { simulateBattle, TeamSetup } from '../../battle/battle.simulator';
import { BattleResult } from '../../types/game.types';
import { RoguelikeRunEntity, FieldUnit } from '../entities/run.entity';
import { RoguelikeSnapshotEntity, PlacedUnit } from '../entities/snapshot.entity';
import { BotOpponent } from '../matchmaking/matchmaking.service';
import { mapToTeamSetup } from './unit-mapper';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result of a roguelike battle simulation.
 */
export interface RoguelikeBattleResult {
  /** Battle log ID (for replay) */
  battleId: string;
  /** Battle result */
  result: 'win' | 'loss';
  /** Whether replay is available */
  replayAvailable: boolean;
  /** Number of rounds fought */
  rounds: number;
  /** Battle seed (for debugging) */
  seed: number;
}

/**
 * Result of saving a battle log with retry logic.
 */
interface SaveResult {
  /** Whether save was successful */
  saved: boolean;
  /** Battle log ID if saved */
  id?: string;
}

/**
 * Service for roguelike battle simulation and persistence.
 *
 * Responsibilities:
 * - Convert roguelike units to battle-compatible format
 * - Run battle simulation using existing simulator
 * - Save battle logs for replay
 * - Handle edge cases (empty teams)
 *
 * @example
 * const result = await battleService.simulateAndSaveBattle(
 *   run,
 *   playerField,
 *   opponent
 * );
 */
@Injectable()
export class RoguelikeBattleService {
  private readonly logger = new Logger(RoguelikeBattleService.name);

  constructor(
    @InjectRepository(BattleLog)
    private readonly battleLogRepository: Repository<BattleLog>,
  ) {}

  /**
   * Simulates a roguelike battle and saves the result.
   *
   * Handles the full battle flow:
   * 1. Convert teams to battle format
   * 2. Handle edge cases (empty teams)
   * 3. Run simulation
   * 4. Save battle log
   *
   * @param run - Current run state
   * @param playerField - Player's placed units on field
   * @param opponent - Opponent snapshot or bot
   * @returns Battle result with replay availability
   *
   * @example
   * const result = await battleService.simulateAndSaveBattle(
   *   run,
   *   run.field,
   *   opponentSnapshot
   * );
   */
  async simulateAndSaveBattle(
    run: RoguelikeRunEntity,
    playerField: FieldUnit[],
    opponent: RoguelikeSnapshotEntity | BotOpponent,
  ): Promise<RoguelikeBattleResult> {
    const battleNumber = run.wins + run.losses;
    const seed = this.generateBattleSeed(run.id, battleNumber);

    this.logger.log('Starting roguelike battle simulation', {
      runId: run.id,
      playerId: run.playerId,
      battleNumber,
      playerUnits: playerField.length,
      opponentType: this.isBot(opponent) ? 'bot' : 'snapshot',
      seed,
    });

    // Handle empty team edge cases
    if (playerField.length === 0) {
      this.logger.warn('Player has no units - automatic loss', {
        runId: run.id,
        playerId: run.playerId,
      });
      return this.createAutoResult('loss', seed);
    }

    const opponentTeam = this.getOpponentTeam(opponent);
    if (opponentTeam.length === 0) {
      this.logger.warn('Opponent has no units - automatic win', {
        runId: run.id,
        playerId: run.playerId,
        opponentType: this.isBot(opponent) ? 'bot' : 'snapshot',
      });
      return this.createAutoResult('win', seed);
    }

    // Convert teams to battle format
    const playerTeamSetup = this.convertFieldToTeamSetup(playerField, 'player');
    const opponentTeamSetup = this.convertOpponentToTeamSetup(opponent);

    // Run simulation
    let battleResult: BattleResult;
    try {
      battleResult = simulateBattle(playerTeamSetup, opponentTeamSetup, seed);
    } catch (error) {
      this.logger.error('Battle simulation failed', {
        runId: run.id,
        playerId: run.playerId,
        seed,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    this.logger.log('Battle simulation completed', {
      runId: run.id,
      winner: battleResult.winner,
      rounds: battleResult.metadata.totalRounds,
      seed,
    });

    // Determine result from player perspective
    const isWin = battleResult.winner === 'player';
    const result: 'win' | 'loss' = isWin ? 'win' : 'loss';

    // Save battle log
    const saveResult = await this.saveBattleLogWithRetry(
      run,
      opponent,
      playerTeamSetup,
      opponentTeamSetup,
      battleResult,
      seed,
    );

    return {
      battleId: saveResult.id ?? uuidv4(),
      result,
      replayAvailable: saveResult.saved,
      rounds: battleResult.metadata.totalRounds,
      seed,
    };
  }

  /**
   * Generates a deterministic seed from run ID and battle number.
   * Uses simple hash function for reproducibility.
   *
   * @param runId - Run UUID
   * @param battleNumber - Current battle number (wins + losses)
   * @returns Numeric seed for battle simulation
   *
   * @example
   * const seed = generateBattleSeed('run-uuid', 5);
   */
  generateBattleSeed(runId: string, battleNumber: number): number {
    let hash = 0;
    const str = `${runId}-${battleNumber}`;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }

    const seed = Math.abs(hash);

    this.logger.debug('Battle seed generated', { runId, battleNumber, seed });

    return seed;
  }

  /**
   * Saves a battle log with retry logic.
   *
   * @param run - Current run
   * @param opponent - Opponent data
   * @param playerTeam - Player team setup
   * @param opponentTeam - Opponent team setup
   * @param battleResult - Simulation result
   * @param seed - Battle seed
   * @param maxRetries - Maximum retry attempts (default: 2)
   * @returns Save result with success status and ID
   */
  private async saveBattleLogWithRetry(
    run: RoguelikeRunEntity,
    opponent: RoguelikeSnapshotEntity | BotOpponent,
    playerTeam: TeamSetup,
    opponentTeam: TeamSetup,
    battleResult: BattleResult,
    seed: number,
    maxRetries: number = 2,
  ): Promise<SaveResult> {
    const opponentId = this.isBot(opponent) ? uuidv4() : opponent.playerId;

    // Map battle winner to BattleLog winner format
    const winner = battleResult.winner === 'player' ? 'player1' : 
                   battleResult.winner === 'bot' ? 'player2' : 'draw';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const battleLog = this.battleLogRepository.create({
          player1Id: run.playerId,
          player2Id: opponentId,
          player1TeamSnapshot: playerTeam,
          player2TeamSnapshot: opponentTeam,
          seed,
          status: BattleStatus.SIMULATED,
          events: battleResult.events,
          winner,
          rounds: battleResult.metadata.totalRounds,
          viewedByPlayer1: false,
          viewedByPlayer2: true, // Bot/opponent doesn't need to view
        });

        const saved = await this.battleLogRepository.save(battleLog);

        this.logger.log('Battle log saved', {
          battleId: saved.id,
          runId: run.id,
          playerId: run.playerId,
          winner,
          rounds: battleResult.metadata.totalRounds,
        });

        return { saved: true, id: saved.id };
      } catch (error) {
        // Log full error details for debugging
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        this.logger.warn(`BattleLog save attempt ${attempt + 1} failed`, {
          runId: run.id,
          playerId: run.playerId,
          attempt: attempt + 1,
          maxRetries,
          error: errorMessage,
          stack: errorStack,
        });

        if (attempt === maxRetries) {
          this.logger.error('BattleLog save failed after all retries', {
            runId: run.id,
            playerId: run.playerId,
            error: errorMessage,
            stack: errorStack,
          });
          return { saved: false };
        }
      }
    }

    return { saved: false };
  }

  /**
   * Creates an automatic result for edge cases (empty teams).
   *
   * @param result - Battle result
   * @param seed - Battle seed
   * @returns Battle result without simulation
   */
  private createAutoResult(
    result: 'win' | 'loss',
    seed: number,
  ): RoguelikeBattleResult {
    // For auto-results, we don't save a battle log (no replay needed)
    return {
      battleId: uuidv4(),
      result,
      replayAvailable: false,
      rounds: 0,
      seed,
    };
  }

  /**
   * Converts player field units to TeamSetup format.
   *
   * @param field - Player's field units
   * @param team - Team type
   * @returns TeamSetup for battle simulator
   */
  private convertFieldToTeamSetup(
    field: FieldUnit[],
    team: 'player' | 'opponent',
  ): TeamSetup {
    return mapToTeamSetup(field, team);
  }

  /**
   * Converts opponent (snapshot or bot) to TeamSetup format.
   *
   * @param opponent - Opponent snapshot or bot
   * @returns TeamSetup for battle simulator
   */
  private convertOpponentToTeamSetup(
    opponent: RoguelikeSnapshotEntity | BotOpponent,
  ): TeamSetup {
    const team = this.getOpponentTeam(opponent);

    // Convert PlacedUnit[] to FieldUnit[] format for mapToTeamSetup
    const fieldUnits: FieldUnit[] = team.map((unit) => ({
      instanceId: `opponent_${unit.unitId}_${unit.position.x}_${unit.position.y}`,
      unitId: unit.unitId,
      tier: unit.tier,
      position: unit.position,
      hasBattled: true,
    }));

    return mapToTeamSetup(fieldUnits, 'opponent');
  }

  /**
   * Gets opponent team from snapshot or bot.
   *
   * @param opponent - Opponent data
   * @returns Array of placed units
   */
  private getOpponentTeam(
    opponent: RoguelikeSnapshotEntity | BotOpponent,
  ): PlacedUnit[] {
    return opponent.team;
  }

  /**
   * Type guard to check if opponent is a bot.
   *
   * @param opponent - Opponent data
   * @returns True if opponent is a bot
   */
  private isBot(
    opponent: RoguelikeSnapshotEntity | BotOpponent,
  ): opponent is BotOpponent {
    return 'isBot' in opponent && opponent.isBot === true;
  }
}
