/**
 * Upgrade Service for Roguelike Mode
 *
 * Manages unit tier upgrades (T1 → T2 → T3) in the upgrade shop.
 * Uses core progression upgrade system with roguelike-specific costs.
 *
 * @module roguelike/upgrade/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoguelikeRunEntity } from '../entities/run.entity';
import { DeckCard, UnitTier, calculateUpgradeCost } from '../types/unit.types';
import {
  RunNotFoundException,
  RunAccessDeniedException,
  RunAlreadyCompletedException,
  InsufficientGoldException,
  InvalidUpgradeException,
} from '../exceptions/roguelike.exceptions';
import { HUMANS_T1_UNITS } from '../data/humans.units';
import { UNDEAD_T1_UNITS } from '../data/undead.units';

/**
 * Upgrade cost information for a card.
 */
export interface UpgradeCostInfo {
  /** Card instance ID */
  instanceId: string;
  /** Current tier of the card */
  currentTier: UnitTier;
  /** Target tier after upgrade */
  targetTier: UnitTier;
  /** Gold cost for upgrade */
  cost: number;
  /** Whether player can afford this upgrade */
  canAfford: boolean;
}

/**
 * Shop state with upgrade options.
 */
export interface ShopState {
  /** Current hand of cards */
  hand: DeckCard[];
  /** Current gold balance */
  gold: number;
  /** Upgrade costs for each upgradeable card */
  upgradeCosts: UpgradeCostInfo[];
}

/**
 * Result of an upgrade operation.
 */
export interface UpgradeResult {
  /** The upgraded card */
  upgradedCard: DeckCard;
  /** Updated hand after upgrade */
  hand: DeckCard[];
  /** Remaining gold after upgrade */
  gold: number;
  /** Gold spent on upgrade */
  goldSpent: number;
}

/**
 * Maximum tier for upgrades.
 */
const MAX_TIER: UnitTier = 3;

/**
 * Service for managing unit upgrades in roguelike mode.
 *
 * Handles upgrade cost calculation, validation, and execution.
 * Upgrades are permanent and persist through the run.
 *
 * @example
 * // Get shop state with upgrade options
 * const shop = await upgradeService.getShopState(runId, playerId);
 *
 * @example
 * // Upgrade a unit
 * const result = await upgradeService.upgradeUnit(runId, playerId, 'footman-1');
 */
@Injectable()
export class UpgradeService {
  private readonly logger = new Logger(UpgradeService.name);

  constructor(
    @InjectRepository(RoguelikeRunEntity)
    private readonly runRepository: Repository<RoguelikeRunEntity>,
  ) {}

  /**
   * Gets the current shop state with upgrade options.
   *
   * Returns the player's hand with upgrade costs for each card.
   * Only cards below max tier (T3) can be upgraded.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @returns Shop state with hand and upgrade costs
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   *
   * @example
   * const shop = await upgradeService.getShopState('run-uuid', 'player-uuid');
   * // shop.upgradeCosts contains costs for each upgradeable card
   */
  async getShopState(runId: string, playerId: string): Promise<ShopState> {
    this.logger.log('Getting shop state', { runId, playerId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Calculate upgrade costs for each card in hand
    const upgradeCosts: UpgradeCostInfo[] = [];

    for (const card of run.hand) {
      if (card.tier < MAX_TIER) {
        const cost = this.calculateUpgradeCostForCard(card, run.faction);
        upgradeCosts.push({
          instanceId: card.instanceId,
          currentTier: card.tier,
          targetTier: (card.tier + 1) as UnitTier,
          cost,
          canAfford: run.gold >= cost,
        });
      }
    }

    this.logger.debug('Shop state generated', {
      runId,
      playerId,
      handSize: run.hand.length,
      upgradeableCount: upgradeCosts.length,
      gold: run.gold,
    });

    return {
      hand: run.hand,
      gold: run.gold,
      upgradeCosts,
    };
  }

  /**
   * Gets upgrade options for a specific card.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @param cardInstanceId - Instance ID of the card
   * @returns Upgrade cost info or null if not upgradeable
   *
   * @example
   * const info = await upgradeService.getUpgradeOptions('run-uuid', 'player-uuid', 'footman-1');
   * if (info && info.canAfford) {
   *   await upgradeService.upgradeUnit(runId, playerId, 'footman-1');
   * }
   */
  async getUpgradeOptions(
    runId: string,
    playerId: string,
    cardInstanceId: string,
  ): Promise<UpgradeCostInfo | null> {
    this.logger.debug('Getting upgrade options for card', { runId, playerId, cardInstanceId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    const card = run.hand.find((c) => c.instanceId === cardInstanceId);
    if (!card) {
      return null;
    }

    if (card.tier >= MAX_TIER) {
      return null;
    }

    const cost = this.calculateUpgradeCostForCard(card, run.faction);

    return {
      instanceId: card.instanceId,
      currentTier: card.tier,
      targetTier: (card.tier + 1) as UnitTier,
      cost,
      canAfford: run.gold >= cost,
    };
  }

  /**
   * Upgrades a unit to the next tier.
   *
   * Validates the card exists, is upgradeable, and player has enough gold.
   * Deducts gold and updates the card's tier.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @param cardInstanceId - Instance ID of the card to upgrade
   * @returns Upgrade result with updated card and gold
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   * @throws InvalidUpgradeException if card not found or at max tier
   * @throws InsufficientGoldException if not enough gold
   *
   * @example
   * const result = await upgradeService.upgradeUnit(
   *   'run-uuid',
   *   'player-uuid',
   *   'footman-1'
   * );
   * // result.upgradedCard.tier === 2
   * // result.goldSpent === 3
   */
  async upgradeUnit(
    runId: string,
    playerId: string,
    cardInstanceId: string,
  ): Promise<UpgradeResult> {
    this.logger.log('Upgrading unit', { runId, playerId, cardInstanceId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Find the card in hand
    const cardIndex = run.hand.findIndex((c) => c.instanceId === cardInstanceId);
    if (cardIndex === -1) {
      this.logger.warn('Card not found in hand', { runId, playerId, cardInstanceId });
      throw new InvalidUpgradeException('Карта не найдена в руке', cardInstanceId);
    }

    const card = run.hand[cardIndex];
    if (!card) {
      throw new InvalidUpgradeException('Карта не найдена в руке', cardInstanceId);
    }

    // Check if card can be upgraded
    if (card.tier >= MAX_TIER) {
      this.logger.warn('Card already at max tier', {
        runId,
        playerId,
        cardInstanceId,
        currentTier: card.tier,
      });
      throw new InvalidUpgradeException('Юнит уже на максимальном уровне', cardInstanceId);
    }

    // Calculate upgrade cost
    const cost = this.calculateUpgradeCostForCard(card, run.faction);

    // Check if player can afford
    if (run.gold < cost) {
      this.logger.warn('Insufficient gold for upgrade', {
        runId,
        playerId,
        cardInstanceId,
        required: cost,
        available: run.gold,
      });
      throw new InsufficientGoldException(cost, run.gold, 'улучшение');
    }

    // Perform upgrade
    const upgradedCard: DeckCard = {
      ...card,
      tier: (card.tier + 1) as UnitTier,
    };

    // Update hand with upgraded card
    const newHand = [...run.hand];
    newHand[cardIndex] = upgradedCard;

    // Deduct gold
    const newGold = run.gold - cost;

    // Save updated run
    run.hand = newHand;
    run.gold = newGold;
    await this.runRepository.save(run);

    this.logger.log('Unit upgraded successfully', {
      runId,
      playerId,
      cardInstanceId,
      oldTier: card.tier,
      newTier: upgradedCard.tier,
      goldSpent: cost,
      remainingGold: newGold,
    });

    return {
      upgradedCard,
      hand: newHand,
      gold: newGold,
      goldSpent: cost,
    };
  }

  /**
   * Checks if a card can be upgraded.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @param cardInstanceId - Instance ID of the card
   * @returns Object with canUpgrade flag and reason if not
   *
   * @example
   * const check = await upgradeService.canUpgrade('run-uuid', 'player-uuid', 'footman-1');
   * if (!check.canUpgrade) {
   *   console.log(check.reason);
   * }
   */
  async canUpgrade(
    runId: string,
    playerId: string,
    cardInstanceId: string,
  ): Promise<{ canUpgrade: boolean; reason?: string }> {
    try {
      const run = await this.getRunWithAccessCheck(runId, playerId);

      const card = run.hand.find((c) => c.instanceId === cardInstanceId);
      if (!card) {
        return { canUpgrade: false, reason: 'Карта не найдена в руке' };
      }

      if (card.tier >= MAX_TIER) {
        return { canUpgrade: false, reason: 'Юнит уже на максимальном уровне' };
      }

      const cost = this.calculateUpgradeCostForCard(card, run.faction);
      if (run.gold < cost) {
        return { canUpgrade: false, reason: `Недостаточно золота (нужно ${cost})` };
      }

      return { canUpgrade: true };
    } catch (error) {
      if (error instanceof RunAlreadyCompletedException) {
        return { canUpgrade: false, reason: 'Забег завершен' };
      }
      throw error;
    }
  }

  /**
   * Calculates upgrade cost for a card based on its base unit cost.
   *
   * @param card - The card to calculate cost for
   * @param faction - The faction (to look up unit data)
   * @returns Upgrade cost in gold
   * @private
   */
  private calculateUpgradeCostForCard(card: DeckCard, faction: string): number {
    // Get base unit to find T1 cost
    const units = faction === 'humans' ? HUMANS_T1_UNITS : UNDEAD_T1_UNITS;
    const unit = units.find((u) => u.id === card.unitId);

    if (!unit) {
      // Fallback to default cost calculation (assume cost 3)
      return calculateUpgradeCost(3, (card.tier + 1) as UnitTier);
    }

    // Calculate cost based on T1 cost and target tier
    return calculateUpgradeCost(unit.cost, (card.tier + 1) as UnitTier);
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
