/**
 * Draft Service for Roguelike Mode
 *
 * Manages card drafting mechanics including initial draft (3 picks from 5)
 * and post-battle draft (1 pick from 3). Uses core progression draft system.
 *
 * @module roguelike/draft/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoguelikeRunEntity } from '../entities/run.entity';
import { DeckCard } from '../types/unit.types';
import {
  RunNotFoundException,
  RunAccessDeniedException,
  RunAlreadyCompletedException,
  InvalidDraftPickException,
  DraftNotAvailableException,
} from '../exceptions/roguelike.exceptions';

/**
 * Draft options returned to the client.
 */
export interface DraftOptions {
  /** Cards available for selection */
  cards: DeckCard[];
  /** Whether this is the initial draft (3 picks) or post-battle (1 pick) */
  isInitial: boolean;
  /** Number of cards player must pick */
  requiredPicks: number;
  /** Cards remaining in deck after this draft */
  remainingInDeck: number;
}

/**
 * Result of a draft submission.
 */
export interface DraftResult {
  /** Updated hand after draft */
  hand: DeckCard[];
  /** Remaining cards in deck */
  remainingDeck: DeckCard[];
  /** Current hand size */
  handSize: number;
  /** Cards remaining in deck */
  deckRemaining: number;
}

/**
 * Draft configuration constants.
 */
const DRAFT_CONFIG = {
  /** Initial draft: pick 3 from 5 options */
  INITIAL_OPTIONS: 5,
  INITIAL_PICKS: 3,
  /** Post-battle draft: pick 1 from 3 options */
  POST_BATTLE_OPTIONS: 3,
  POST_BATTLE_PICKS: 1,
} as const;

/**
 * Service for managing roguelike draft mechanics.
 *
 * Handles initial draft at run start and post-battle drafts.
 * Uses seeded random for deterministic draft options.
 *
 * @example
 * // Get initial draft options
 * const options = await draftService.getInitialDraft(runId, playerId);
 *
 * @example
 * // Submit draft picks
 * const result = await draftService.submitPicks(runId, playerId, ['footman-1', 'archer-1', 'priest-1']);
 */
@Injectable()
export class DraftService {
  private readonly logger = new Logger(DraftService.name);

  constructor(
    @InjectRepository(RoguelikeRunEntity)
    private readonly runRepository: Repository<RoguelikeRunEntity>,
  ) {}

  /**
   * Gets initial draft options for a new run.
   *
   * Returns 5 cards from the remaining deck for player to pick 3.
   * Only available when hand is empty (start of run).
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @returns Draft options with 5 cards
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   * @throws DraftNotAvailableException if initial draft already done
   *
   * @example
   * const options = await draftService.getInitialDraft('run-uuid', 'player-uuid');
   * // options.cards.length === 5
   * // options.requiredPicks === 3
   */
  async getInitialDraft(runId: string, playerId: string): Promise<DraftOptions> {
    this.logger.log('Getting initial draft options', { runId, playerId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Check if initial draft is available (hand must be empty)
    if (run.hand.length > 0) {
      this.logger.warn('Initial draft already completed', { runId, playerId, handSize: run.hand.length });
      throw new DraftNotAvailableException(runId, 'Начальный драфт уже завершен');
    }

    // Check if there are enough cards in remaining deck
    if (run.remainingDeck.length < DRAFT_CONFIG.INITIAL_OPTIONS) {
      this.logger.warn('Not enough cards for initial draft', {
        runId,
        playerId,
        remainingDeck: run.remainingDeck.length,
      });
      throw new DraftNotAvailableException(runId, 'Недостаточно карт в колоде');
    }

    // Get first N cards from remaining deck as options
    const options = run.remainingDeck.slice(0, DRAFT_CONFIG.INITIAL_OPTIONS);

    this.logger.debug('Initial draft options generated', {
      runId,
      playerId,
      optionsCount: options.length,
    });

    return {
      cards: options,
      isInitial: true,
      requiredPicks: DRAFT_CONFIG.INITIAL_PICKS,
      remainingInDeck: run.remainingDeck.length - DRAFT_CONFIG.INITIAL_OPTIONS,
    };
  }

  /**
   * Gets post-battle draft options.
   *
   * Returns 3 cards from the remaining deck for player to pick 1.
   * Available after each battle when cards remain in deck.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @returns Draft options with 3 cards
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   * @throws DraftNotAvailableException if no cards remaining
   *
   * @example
   * const options = await draftService.getPostBattleDraft('run-uuid', 'player-uuid');
   * // options.cards.length === 3 (or less if deck is small)
   * // options.requiredPicks === 1
   */
  async getPostBattleDraft(runId: string, playerId: string): Promise<DraftOptions> {
    this.logger.log('Getting post-battle draft options', { runId, playerId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Check if there are cards remaining
    if (run.remainingDeck.length === 0) {
      this.logger.warn('No cards remaining for draft', { runId, playerId });
      throw new DraftNotAvailableException(runId, 'В колоде не осталось карт');
    }

    // Get up to 3 cards from remaining deck
    const optionsCount = Math.min(DRAFT_CONFIG.POST_BATTLE_OPTIONS, run.remainingDeck.length);
    const options = run.remainingDeck.slice(0, optionsCount);

    this.logger.debug('Post-battle draft options generated', {
      runId,
      playerId,
      optionsCount: options.length,
    });

    return {
      cards: options,
      isInitial: false,
      requiredPicks: DRAFT_CONFIG.POST_BATTLE_PICKS,
      remainingInDeck: run.remainingDeck.length - optionsCount,
    };
  }

  /**
   * Submits draft picks and updates run state.
   *
   * Validates picks are from available options, adds to hand,
   * and removes all shown options from remaining deck.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @param picks - Array of card instance IDs to pick
   * @returns Updated hand and deck state
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   * @throws InvalidDraftPickException if picks are invalid
   *
   * @example
   * const result = await draftService.submitPicks(
   *   'run-uuid',
   *   'player-uuid',
   *   ['footman-1', 'archer-1', 'priest-1']
   * );
   */
  async submitPicks(
    runId: string,
    playerId: string,
    picks: string[],
  ): Promise<DraftResult> {
    this.logger.log('Submitting draft picks', { runId, playerId, picks });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Determine if this is initial or post-battle draft
    const isInitial = run.hand.length === 0;
    const requiredPicks = isInitial ? DRAFT_CONFIG.INITIAL_PICKS : DRAFT_CONFIG.POST_BATTLE_PICKS;
    const optionsCount = isInitial ? DRAFT_CONFIG.INITIAL_OPTIONS : DRAFT_CONFIG.POST_BATTLE_OPTIONS;

    // Validate pick count
    if (picks.length !== requiredPicks) {
      this.logger.warn('Invalid pick count', {
        runId,
        playerId,
        expected: requiredPicks,
        received: picks.length,
      });
      throw new InvalidDraftPickException(
        `Необходимо выбрать ${requiredPicks} карт(ы), выбрано ${picks.length}`,
        picks,
      );
    }

    // Get available options
    const availableOptions = run.remainingDeck.slice(0, Math.min(optionsCount, run.remainingDeck.length));
    const availableIds = new Set(availableOptions.map((c) => c.instanceId));

    // Validate all picks are from available options
    const invalidPicks = picks.filter((id) => !availableIds.has(id));
    if (invalidPicks.length > 0) {
      this.logger.warn('Invalid picks - not in options', {
        runId,
        playerId,
        invalidPicks,
        availableIds: Array.from(availableIds),
      });
      throw new InvalidDraftPickException('Выбранные карты не доступны для драфта', invalidPicks);
    }

    // Validate no duplicate picks
    const uniquePicks = new Set(picks);
    if (uniquePicks.size !== picks.length) {
      this.logger.warn('Duplicate picks detected', { runId, playerId, picks });
      throw new InvalidDraftPickException('Нельзя выбрать одну карту дважды', picks);
    }

    // Find picked cards
    const pickedCards = picks.map((id) => {
      const card = availableOptions.find((c) => c.instanceId === id);
      if (!card) {
        throw new InvalidDraftPickException(`Карта ${id} не найдена`, [id]);
      }
      return card;
    });

    // Update hand (add picked cards)
    const newHand = [...run.hand, ...pickedCards];

    // Update remaining deck (remove all shown options, not just picked)
    const shownOptionIds = new Set(availableOptions.map((c) => c.instanceId));
    const newRemainingDeck = run.remainingDeck.filter((c) => !shownOptionIds.has(c.instanceId));

    // Save updated run
    run.hand = newHand;
    run.remainingDeck = newRemainingDeck;
    await this.runRepository.save(run);

    this.logger.log('Draft picks submitted successfully', {
      runId,
      playerId,
      pickedCount: pickedCards.length,
      newHandSize: newHand.length,
      remainingDeckSize: newRemainingDeck.length,
    });

    return {
      hand: newHand,
      remainingDeck: newRemainingDeck,
      handSize: newHand.length,
      deckRemaining: newRemainingDeck.length,
    };
  }

  /**
   * Checks if draft is available for a run.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @returns Object indicating draft availability
   *
   * @example
   * const status = await draftService.isDraftAvailable('run-uuid', 'player-uuid');
   * if (status.available) {
   *   const options = status.isInitial
   *     ? await draftService.getInitialDraft(runId, playerId)
   *     : await draftService.getPostBattleDraft(runId, playerId);
   * }
   */
  async isDraftAvailable(
    runId: string,
    playerId: string,
  ): Promise<{ available: boolean; isInitial: boolean; reason?: string }> {
    try {
      const run = await this.getRunWithAccessCheck(runId, playerId);

      if (run.remainingDeck.length === 0) {
        return { available: false, isInitial: false, reason: 'В колоде не осталось карт' };
      }

      const isInitial = run.hand.length === 0;
      return { available: true, isInitial };
    } catch (error) {
      if (error instanceof RunAlreadyCompletedException) {
        return { available: false, isInitial: false, reason: 'Забег завершен' };
      }
      throw error;
    }
  }

  /**
   * Gets run with access control checks.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @returns Run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   * @private
   */
  private async getRunWithAccessCheck(
    runId: string,
    playerId: string,
  ): Promise<RoguelikeRunEntity> {
    const run = await this.runRepository.findOne({
      where: { id: runId },
    });

    if (!run) {
      throw new RunNotFoundException(runId);
    }

    if (run.playerId !== playerId) {
      throw new RunAccessDeniedException(runId, playerId);
    }

    if (run.isComplete()) {
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    return run;
  }
}
