/**
 * Placement Service for Roguelike Mode
 *
 * Handles unit placement from hand to field with gold cost validation.
 * Also handles repositioning units on the field (free).
 *
 * @module roguelike/placement/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { RoguelikeRunEntity, FieldUnit } from '../entities/run.entity';
import { RunService } from '../run/run.service';
import { DeckCard } from '../types/unit.types';
import { getRoguelikeUnit } from '../data/units.helpers';
import { RunAlreadyCompletedException } from '../exceptions/roguelike.exceptions';
import { BadRequestException } from '@nestjs/common';

/**
 * Grid constants for deployment zone.
 */
export const FIELD_CONSTANTS = {
  /** Grid width (columns) */
  WIDTH: 8,
  /** Grid height (rows) */
  HEIGHT: 2,
  /** Maximum units on field */
  MAX_UNITS: 16,
} as const;

/**
 * Result of a placement operation.
 */
export interface PlacementResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Updated hand after placement */
  hand: DeckCard[];
  /** Updated field after placement */
  field: FieldUnit[];
  /** Updated gold after placement */
  gold: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of a reposition operation.
 */
export interface RepositionResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Updated field after repositioning */
  field: FieldUnit[];
  /** Error message if failed */
  error?: string;
}

/**
 * Service for managing unit placement on the deployment field.
 *
 * Handles:
 * - Placing units from hand to field (costs gold)
 * - Repositioning units on field (free)
 * - Removing units from field back to hand (refund gold)
 *
 * @example
 * // Place a unit from hand to field
 * const result = await placementService.placeUnit(runId, playerId, instanceId, { x: 0, y: 0 });
 *
 * @example
 * // Reposition a unit on the field
 * const result = await placementService.repositionUnit(runId, playerId, instanceId, { x: 1, y: 0 });
 */
@Injectable()
export class PlacementService {
  private readonly logger = new Logger(PlacementService.name);

  constructor(private readonly runService: RunService) {}

  /**
   * Places a unit from hand onto the deployment field.
   * Costs gold equal to the unit's cost.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @param instanceId - Instance ID of the card in hand
   * @param position - Target position on the field (x: 0-7, y: 0-1)
   * @returns Updated run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is already complete
   * @throws BadRequestException if placement is invalid
   *
   * @example
   * const run = await placementService.placeUnit(
   *   'run-uuid',
   *   'player-uuid',
   *   'card-instance-uuid',
   *   { x: 0, y: 0 }
   * );
   */
  async placeUnit(
    runId: string,
    playerId: string,
    instanceId: string,
    position: { x: number; y: number },
  ): Promise<RoguelikeRunEntity> {
    this.logger.log('Placing unit from hand to field', {
      runId,
      playerId,
      instanceId,
      position,
    });

    const run = await this.runService.getRun(runId, playerId);

    if (run.isComplete()) {
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    // Validate position
    if (!this.isValidPosition(position)) {
      this.logger.warn('Invalid position for placement', { runId, position });
      throw new BadRequestException(
        `Invalid position: x must be 0-${FIELD_CONSTANTS.WIDTH - 1}, y must be 0-${FIELD_CONSTANTS.HEIGHT - 1}`,
      );
    }

    // Check if position is occupied
    if (this.isPositionOccupied(run.field, position)) {
      this.logger.warn('Position already occupied', { runId, position });
      throw new BadRequestException('Position is already occupied');
    }

    // Find card in hand
    const cardIndex = run.hand.findIndex((c) => c.instanceId === instanceId);
    if (cardIndex === -1) {
      this.logger.warn('Card not found in hand', { runId, instanceId });
      throw new BadRequestException('Card not found in hand');
    }

    const card = run.hand[cardIndex];
    if (!card) {
      this.logger.error('Card at index is undefined', { runId, cardIndex });
      throw new BadRequestException('Card not found in hand');
    }

    // Get unit data to check cost
    const unitData = getRoguelikeUnit(card.unitId);
    if (!unitData) {
      this.logger.error('Unit data not found', { runId, unitId: card.unitId });
      throw new BadRequestException('Unit data not found');
    }

    // Check if player has enough gold
    if (run.gold < unitData.cost) {
      this.logger.warn('Not enough gold for placement', {
        runId,
        gold: run.gold,
        cost: unitData.cost,
      });
      throw new BadRequestException(
        `Not enough gold. Need ${unitData.cost}, have ${run.gold}`,
      );
    }

    // Remove from hand
    const newHand = [...run.hand];
    newHand.splice(cardIndex, 1);

    // Add to field with hasBattled = false (new units haven't fought yet)
    const fieldUnit: FieldUnit = {
      instanceId: card.instanceId,
      unitId: card.unitId,
      tier: card.tier,
      position,
      hasBattled: false,
    };
    const newField = [...run.field, fieldUnit];

    // Deduct gold
    const newGold = run.gold - unitData.cost;

    this.logger.log('Unit placed successfully', {
      runId,
      instanceId,
      unitId: card.unitId,
      position,
      goldSpent: unitData.cost,
      newGold,
    });

    return this.runService.updateRunState(runId, playerId, {
      hand: newHand,
      field: newField,
      gold: newGold,
    });
  }

  /**
   * Repositions a unit on the deployment field.
   * This is free (no gold cost).
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @param instanceId - Instance ID of the unit on field
   * @param newPosition - New position on the field
   * @returns Updated run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is already complete
   * @throws BadRequestException if reposition is invalid
   *
   * @example
   * const run = await placementService.repositionUnit(
   *   'run-uuid',
   *   'player-uuid',
   *   'card-instance-uuid',
   *   { x: 1, y: 0 }
   * );
   */
  async repositionUnit(
    runId: string,
    playerId: string,
    instanceId: string,
    newPosition: { x: number; y: number },
  ): Promise<RoguelikeRunEntity> {
    this.logger.log('Repositioning unit on field', {
      runId,
      playerId,
      instanceId,
      newPosition,
    });

    const run = await this.runService.getRun(runId, playerId);

    if (run.isComplete()) {
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    // Validate position
    if (!this.isValidPosition(newPosition)) {
      this.logger.warn('Invalid position for reposition', { runId, newPosition });
      throw new BadRequestException(
        `Invalid position: x must be 0-${FIELD_CONSTANTS.WIDTH - 1}, y must be 0-${FIELD_CONSTANTS.HEIGHT - 1}`,
      );
    }

    // Find unit on field
    const unitIndex = run.field.findIndex((u) => u.instanceId === instanceId);
    if (unitIndex === -1) {
      this.logger.warn('Unit not found on field', { runId, instanceId });
      throw new BadRequestException('Unit not found on field');
    }

    // Check if new position is occupied by another unit
    const occupyingUnit = run.field.find(
      (u) =>
        u.instanceId !== instanceId &&
        u.position.x === newPosition.x &&
        u.position.y === newPosition.y,
    );
    if (occupyingUnit) {
      this.logger.warn('Position occupied by another unit', {
        runId,
        newPosition,
        occupyingUnit: occupyingUnit.instanceId,
      });
      throw new BadRequestException('Position is occupied by another unit');
    }

    // Update position
    const newField = run.field.map((u, i) =>
      i === unitIndex ? { ...u, position: newPosition } : u,
    );

    this.logger.log('Unit repositioned successfully', {
      runId,
      instanceId,
      newPosition,
    });

    return this.runService.updateRunState(runId, playerId, {
      field: newField,
    });
  }

  /**
   * Removes a unit from the field back to hand.
   * Refunds the unit's gold cost.
   * Only units that have NOT participated in battle can be returned.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @param instanceId - Instance ID of the unit on field
   * @returns Updated run entity
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is already complete
   * @throws BadRequestException if removal is invalid or unit has battled
   *
   * @example
   * const run = await placementService.removeFromField(
   *   'run-uuid',
   *   'player-uuid',
   *   'card-instance-uuid'
   * );
   */
  async removeFromField(
    runId: string,
    playerId: string,
    instanceId: string,
  ): Promise<RoguelikeRunEntity> {
    this.logger.log('Removing unit from field to hand', {
      runId,
      playerId,
      instanceId,
    });

    const run = await this.runService.getRun(runId, playerId);

    if (run.isComplete()) {
      throw new RunAlreadyCompletedException(runId, run.status as 'won' | 'lost');
    }

    // Find unit on field
    const unitIndex = run.field.findIndex((u) => u.instanceId === instanceId);
    if (unitIndex === -1) {
      this.logger.warn('Unit not found on field', { runId, instanceId });
      throw new BadRequestException('Unit not found on field');
    }

    const fieldUnit = run.field[unitIndex];
    if (!fieldUnit) {
      this.logger.error('Field unit at index is undefined', { runId, unitIndex });
      throw new BadRequestException('Unit not found on field');
    }

    // Check if unit has participated in battle - cannot return to hand if so
    if (fieldUnit.hasBattled) {
      this.logger.warn('Cannot return battled unit to hand', {
        runId,
        instanceId,
        unitId: fieldUnit.unitId,
      });
      throw new BadRequestException(
        'Юнит уже участвовал в бою и не может быть возвращён в руку. Можно только переместить его на поле.',
      );
    }

    // Get unit data for refund
    const unitData = getRoguelikeUnit(fieldUnit.unitId);
    if (!unitData) {
      this.logger.error('Unit data not found', { runId, unitId: fieldUnit.unitId });
      throw new BadRequestException('Unit data not found');
    }

    // Remove from field
    const newField = run.field.filter((_, i) => i !== unitIndex);

    // Add back to hand as DeckCard
    const deckCard: DeckCard = {
      instanceId: fieldUnit.instanceId,
      unitId: fieldUnit.unitId,
      tier: fieldUnit.tier,
    };
    const newHand = [...run.hand, deckCard];

    // Refund gold
    const newGold = run.gold + unitData.cost;

    this.logger.log('Unit removed from field successfully', {
      runId,
      instanceId,
      unitId: fieldUnit.unitId,
      goldRefunded: unitData.cost,
      newGold,
    });

    return this.runService.updateRunState(runId, playerId, {
      hand: newHand,
      field: newField,
      gold: newGold,
    });
  }

  /**
   * Validates if a position is within the deployment grid bounds.
   *
   * @param position - Position to validate
   * @returns True if position is valid
   */
  private isValidPosition(position: { x: number; y: number }): boolean {
    return (
      position.x >= 0 &&
      position.x < FIELD_CONSTANTS.WIDTH &&
      position.y >= 0 &&
      position.y < FIELD_CONSTANTS.HEIGHT
    );
  }

  /**
   * Checks if a position is occupied by a unit.
   *
   * @param field - Current field state
   * @param position - Position to check
   * @returns True if position is occupied
   */
  private isPositionOccupied(
    field: FieldUnit[],
    position: { x: number; y: number },
  ): boolean {
    return field.some(
      (u) => u.position.x === position.x && u.position.y === position.y,
    );
  }
}
