/**
 * Run Service for Roguelike Mode
 *
 * Manages roguelike run lifecycle including creation, state updates,
 * and abandonment. Uses core progression systems for run management.
 *
 * @module roguelike/run/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoguelikeRunEntity, SpellCard, RUN_CONSTANTS } from '../entities/run.entity';
import { Faction } from '../types/faction.types';
import { DeckCard } from '../types/unit.types';
import {
  RunNotFoundException,
  RunAccessDeniedException,
  RunAlreadyCompletedException,
  ActiveRunExistsException,
  InvalidFactionLeaderException,
  FactionNotFoundException,
  LeaderNotFoundException,
} from '../exceptions/roguelike.exceptions';
import { getLeader, getLeadersByFaction } from '../data/leaders.data';
import { getStarterDeck, expandStarterDeck } from '../data/starter-decks.data';
import { getFaction } from '../data/factions.data';

/**
 * Service for managing roguelike runs.
 *
 * Handles run creation, retrieval, state updates, and abandonment.
 * Uses TypeORM for persistence and core progression systems for game logic.
 *
 * @example
 * // Create a new run
 * const run = await runService.createRun(playerId, 'humans', 'commander_aldric');
 *
 * @example
 * // Get active run
 * const activeRun = await runService.getActiveRun(playerId);
 */
@Injectable()
export class RunService {
  private readonly logger = new Logger(RunService.name);

  constructor(
    @InjectRepository(RoguelikeRunEntity)
    private readonly runRepository: Repository<RoguelikeRunEntity>,
  ) {}

  /**
   * Creates a new roguelike run for a player.
   *
   * Validates faction and leader selection, checks for existing active runs,
   * and initializes the run with starter deck and spells.
   *
   * @param playerId - ID of the player creating the run
   * @param faction - Selected faction ('humans' or 'undead')
   * @param leaderId - Selected leader ID
   * @returns Created run entity
   * @throws FactionNotFoundException if faction is invalid
   * @throws LeaderNotFoundException if leader is invalid
   * @throws InvalidFactionLeaderException if leader doesn't belong to faction
   * @throws ActiveRunExistsException if player already has an active run
   *
   * @example
   * const run = await runService.createRun(
   *   'player-uuid',
   *   'humans',
   *   'commander_aldric'
   * );
   */
  async createRun(
    playerId: string,
    faction: Faction,
    leaderId: string,
  ): Promise<RoguelikeRunEntity> {
    this.logger.log('Creating new roguelike run', { playerId, faction, leaderId });

    // Validate faction exists
    const factionData = getFaction(faction);
    if (!factionData) {
      this.logger.warn('Invalid faction selected', { playerId, faction });
      throw new FactionNotFoundException(faction);
    }

    // Validate leader exists
    const leader = getLeader(leaderId);
    if (!leader) {
      this.logger.warn('Invalid leader selected', { playerId, leaderId });
      throw new LeaderNotFoundException(leaderId);
    }

    // Validate leader belongs to faction
    const factionLeaders = getLeadersByFaction(faction);
    if (!factionLeaders.some((l) => l.id === leaderId)) {
      this.logger.warn('Leader does not belong to faction', {
        playerId,
        faction,
        leaderId,
      });
      throw new InvalidFactionLeaderException(faction, leaderId);
    }

    // Check for existing active run
    const existingRun = await this.runRepository.findOne({
      where: { playerId, status: 'active' },
    });

    if (existingRun) {
      this.logger.warn('Player already has an active run', {
        playerId,
        existingRunId: existingRun.id,
      });
      throw new ActiveRunExistsException(playerId, existingRun.id);
    }

    // Get starter deck for faction
    const starterDeck = getStarterDeck(faction);
    if (!starterDeck) {
      this.logger.error('Starter deck not found for faction', { faction });
      throw new FactionNotFoundException(faction);
    }

    // Expand starter deck into individual cards
    const deck: DeckCard[] = expandStarterDeck(starterDeck);

    this.logger.debug('Expanded starter deck', {
      playerId,
      faction,
      deckSize: deck.length,
      cards: deck.map((c) => c.instanceId),
    });

    // Initialize spells from leader (timing will be selected before battle)
    const spells: SpellCard[] = leader.spellIds.map((spellId) => ({
      spellId,
    }));

    // Create run entity
    const run = this.runRepository.create({
      playerId,
      faction,
      leaderId,
      deck,
      remainingDeck: [...deck], // Copy deck to remaining
      hand: [], // Empty hand, will be filled during initial draft
      field: [], // Empty field, units placed from hand
      spells,
      wins: 0,
      losses: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      gold: RUN_CONSTANTS.STARTING_GOLD,
      battleHistory: [],
      status: 'active',
      rating: RUN_CONSTANTS.STARTING_RATING,
    });

    const savedRun = await this.runRepository.save(run);

    this.logger.log('Roguelike run created successfully', {
      runId: savedRun.id,
      playerId,
      faction,
      leaderId,
      deckSize: deck.length,
      remainingDeckSize: savedRun.remainingDeck.length,
    });

    return savedRun;
  }


  /**
   * Gets a run by ID with access control.
   *
   * @param runId - ID of the run to retrieve
   * @param playerId - ID of the player requesting the run
   * @returns Run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   *
   * @example
   * const run = await runService.getRun('run-uuid', 'player-uuid');
   */
  async getRun(runId: string, playerId: string): Promise<RoguelikeRunEntity> {
    this.logger.debug('Getting run', { runId, playerId });

    const run = await this.runRepository.findOne({
      where: { id: runId },
    });

    if (!run) {
      this.logger.warn('Run not found', { runId, playerId });
      throw new RunNotFoundException(runId);
    }

    if (run.playerId !== playerId) {
      this.logger.warn('Run access denied', {
        runId,
        playerId,
        ownerId: run.playerId,
      });
      throw new RunAccessDeniedException(runId, playerId);
    }

    return run;
  }

  /**
   * Gets the active run for a player.
   *
   * @param playerId - ID of the player
   * @returns Active run entity or null if no active run
   *
   * @example
   * const activeRun = await runService.getActiveRun('player-uuid');
   * if (activeRun) {
   *   console.log('Active run:', activeRun.id);
   * }
   */
  async getActiveRun(playerId: string): Promise<RoguelikeRunEntity | null> {
    this.logger.debug('Getting active run for player', { playerId });

    const run = await this.runRepository.findOne({
      where: { playerId, status: 'active' },
    });

    if (run) {
      this.logger.debug('Found active run', { runId: run.id, playerId });
    } else {
      this.logger.debug('No active run found', { playerId });
    }

    return run;
  }

  /**
   * Updates the run state after a battle or other action.
   *
   * @param runId - ID of the run to update
   * @param playerId - ID of the player (for access control)
   * @param updates - Partial run updates
   * @returns Updated run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is already complete
   *
   * @example
   * const updatedRun = await runService.updateRunState(
   *   'run-uuid',
   *   'player-uuid',
   *   { gold: 25, wins: 1, consecutiveWins: 1 }
   * );
   */
  async updateRunState(
    runId: string,
    playerId: string,
    updates: Partial<
      Pick<
        RoguelikeRunEntity,
        | 'hand'
        | 'field'
        | 'remainingDeck'
        | 'spells'
        | 'wins'
        | 'losses'
        | 'consecutiveWins'
        | 'consecutiveLosses'
        | 'gold'
        | 'battleHistory'
        | 'status'
        | 'rating'
      >
    >,
  ): Promise<RoguelikeRunEntity> {
    this.logger.debug('Updating run state', { runId, playerId, updates });

    const run = await this.getRun(runId, playerId);

    if (run.isComplete()) {
      this.logger.warn('Cannot update completed run', {
        runId,
        playerId,
        status: run.status,
      });
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    // Apply updates
    Object.assign(run, updates);

    const savedRun = await this.runRepository.save(run);

    this.logger.log('Run state updated', {
      runId,
      playerId,
      wins: savedRun.wins,
      losses: savedRun.losses,
      gold: savedRun.gold,
      status: savedRun.status,
    });

    return savedRun;
  }

  /**
   * Records a win for the run.
   *
   * Updates wins, consecutive wins, resets consecutive losses,
   * and checks for run completion (9 wins).
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @param goldEarned - Gold earned from the battle
   * @param battleId - ID of the battle log
   * @param ratingChange - Rating change from the battle
   * @param opponent - Opponent information for history
   * @returns Updated run entity
   *
   * @example
   * const run = await runService.recordWin(
   *   'run-uuid',
   *   'player-uuid',
   *   7,
   *   'battle-uuid',
   *   15,
   *   { name: 'Bot', faction: 'humans', rating: 1000 }
   * );
   */
  async recordWin(
    runId: string,
    playerId: string,
    goldEarned: number,
    battleId: string,
    ratingChange: number,
    opponent: { name: string; faction: string; rating: number } = { name: 'Unknown', faction: 'unknown', rating: 1000 },
  ): Promise<RoguelikeRunEntity> {
    this.logger.log('Recording win', { runId, playerId, goldEarned, battleId });

    const run = await this.getRun(runId, playerId);

    if (run.isComplete()) {
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    const newWins = run.wins + 1;
    const newConsecutiveWins = run.consecutiveWins + 1;
    const newStatus = newWins >= RUN_CONSTANTS.MAX_WINS ? 'won' : 'active';

    // Create battle history entry with full information
    // Round is 1-based: wins + losses + 1 (before incrementing wins)
    const round = run.wins + run.losses + 1;
    const battleEntry = {
      battleId,
      result: 'win' as const,
      round,
      goldEarned,
      opponent,
      timestamp: new Date().toISOString(),
    };

    // Mark all units on field as having battled (cannot be returned to hand)
    const updatedField = run.field.map((unit) => ({
      ...unit,
      hasBattled: true,
    }));

    return this.updateRunState(runId, playerId, {
      wins: newWins,
      consecutiveWins: newConsecutiveWins,
      consecutiveLosses: 0,
      gold: run.gold + goldEarned,
      battleHistory: [...run.battleHistory, battleEntry],
      status: newStatus,
      rating: run.rating + ratingChange,
      field: updatedField,
    });
  }

  /**
   * Records a loss for the run.
   *
   * Updates losses, consecutive losses, resets consecutive wins,
   * and checks for run completion (4 losses).
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @param goldEarned - Gold earned from the battle (catch-up mechanic)
   * @param battleId - ID of the battle log
   * @param ratingChange - Rating change from the battle
   * @param opponent - Opponent information for history
   * @returns Updated run entity
   *
   * @example
   * const run = await runService.recordLoss(
   *   'run-uuid',
   *   'player-uuid',
   *   9,
   *   'battle-uuid',
   *   -10,
   *   { name: 'Bot', faction: 'humans', rating: 1000 }
   * );
   */
  async recordLoss(
    runId: string,
    playerId: string,
    goldEarned: number,
    battleId: string,
    ratingChange: number,
    opponent: { name: string; faction: string; rating: number } = { name: 'Unknown', faction: 'unknown', rating: 1000 },
  ): Promise<RoguelikeRunEntity> {
    this.logger.log('Recording loss', { runId, playerId, goldEarned, battleId });

    const run = await this.getRun(runId, playerId);

    if (run.isComplete()) {
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    const newLosses = run.losses + 1;
    const newConsecutiveLosses = run.consecutiveLosses + 1;
    const newStatus = newLosses >= RUN_CONSTANTS.MAX_LOSSES ? 'lost' : 'active';

    // Create battle history entry with full information
    // Round is 1-based: wins + losses + 1 (before incrementing losses)
    const round = run.wins + run.losses + 1;
    const battleEntry = {
      battleId,
      result: 'loss' as const,
      round,
      goldEarned,
      opponent,
      timestamp: new Date().toISOString(),
    };

    // Mark all units on field as having battled (cannot be returned to hand)
    const updatedField = run.field.map((unit) => ({
      ...unit,
      hasBattled: true,
    }));

    return this.updateRunState(runId, playerId, {
      losses: newLosses,
      consecutiveLosses: newConsecutiveLosses,
      consecutiveWins: 0,
      gold: run.gold + goldEarned,
      battleHistory: [...run.battleHistory, battleEntry],
      status: newStatus,
      rating: run.rating + ratingChange,
      field: updatedField,
    });
  }

  /**
   * Abandons an active run.
   *
   * Sets the run status to 'lost' without recording a battle.
   * Used when player wants to start a new run without finishing current one.
   *
   * @param runId - ID of the run to abandon
   * @param playerId - ID of the player
   * @returns Abandoned run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is already complete
   *
   * @example
   * const abandonedRun = await runService.abandonRun('run-uuid', 'player-uuid');
   */
  async abandonRun(runId: string, playerId: string): Promise<RoguelikeRunEntity> {
    this.logger.log('Abandoning run', { runId, playerId });

    const run = await this.getRun(runId, playerId);

    if (run.isComplete()) {
      this.logger.warn('Cannot abandon completed run', {
        runId,
        playerId,
        status: run.status,
      });
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    run.status = 'lost';
    const savedRun = await this.runRepository.save(run);

    this.logger.log('Run abandoned', {
      runId,
      playerId,
      finalWins: savedRun.wins,
      finalLosses: savedRun.losses,
    });

    return savedRun;
  }

  /**
   * Gets run history for a player.
   *
   * Returns completed runs ordered by creation date (newest first).
   *
   * @param playerId - ID of the player
   * @param limit - Maximum number of runs to return (default: 10)
   * @returns Array of completed run entities
   *
   * @example
   * const history = await runService.getRunHistory('player-uuid', 5);
   */
  async getRunHistory(
    playerId: string,
    limit: number = 10,
  ): Promise<RoguelikeRunEntity[]> {
    this.logger.debug('Getting run history', { playerId, limit });

    const runs = await this.runRepository.find({
      where: { playerId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    this.logger.debug('Found runs in history', {
      playerId,
      count: runs.length,
    });

    return runs;
  }
}
