/**
 * Upgrade Service for Roguelike Mode
 *
 * Manages unit tier upgrades (T1 → T2 → T3) for units on the field.
 * Only units that are placed on the deployment field can be upgraded.
 *
 * @module roguelike/upgrade/service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoguelikeRunEntity, FieldUnit } from '../entities/run.entity';
import { UnitTier, calculateUpgradeCost } from '../types/unit.types';
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
 * Upgrade cost information for a unit on the field.
 */
export interface UpgradeCostInfo {
  /** Unit instance ID */
  instanceId: string;
  /** Current tier of the unit */
  currentTier: UnitTier;
  /** Target tier after upgrade */
  targetTier: UnitTier;
  /** Gold cost for upgrade */
  cost: number;
  /** Whether player can afford this upgrade */
  canAfford: boolean;
}

/**
 * Shop state with upgrade options for field units.
 */
export interface ShopState {
  /** Current field units */
  field: FieldUnit[];
  /** Current gold balance */
  gold: number;
  /** Upgrade costs for each upgradeable unit on field */
  upgradeCosts: UpgradeCostInfo[];
}

/**
 * Result of an upgrade operation.
 */
export interface UpgradeResult {
  /** The upgraded unit */
  upgradedUnit: FieldUnit;
  /** Updated field after upgrade */
  field: FieldUnit[];
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
 * Only units on the deployment field can be upgraded.
 * Upgrades are permanent and persist through the run.
 *
 * @example
 * // Get shop state with upgrade options for field units
 * const shop = await upgradeService.getShopState(runId, playerId);
 *
 * @example
 * // Upgrade a unit on the field
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
   * Gets the current shop state with upgrade options for field units.
   *
   * Returns the player's field with upgrade costs for each unit.
   * Only units below max tier (T3) can be upgraded.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @returns Shop state with field and upgrade costs
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   *
   * @example
   * const shop = await upgradeService.getShopState('run-uuid', 'player-uuid');
   * // shop.upgradeCosts contains costs for each upgradeable unit on field
   */
  async getShopState(runId: string, playerId: string): Promise<ShopState> {
    this.logger.log('Getting shop state', { runId, playerId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Calculate upgrade costs for each unit on field
    const upgradeCosts: UpgradeCostInfo[] = [];

    for (const unit of run.field) {
      if (unit.tier < MAX_TIER) {
        const cost = this.calculateUpgradeCostForUnit(unit, run.faction);
        upgradeCosts.push({
          instanceId: unit.instanceId,
          currentTier: unit.tier,
          targetTier: (unit.tier + 1) as UnitTier,
          cost,
          canAfford: run.gold >= cost,
        });
      }
    }

    this.logger.debug('Shop state generated', {
      runId,
      playerId,
      fieldSize: run.field.length,
      upgradeableCount: upgradeCosts.length,
      gold: run.gold,
    });

    return {
      field: run.field,
      gold: run.gold,
      upgradeCosts,
    };
  }

  /**
   * Gets upgrade options for a specific unit on the field.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @param unitInstanceId - Instance ID of the unit on field
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
    unitInstanceId: string,
  ): Promise<UpgradeCostInfo | null> {
    this.logger.debug('Getting upgrade options for unit', { runId, playerId, unitInstanceId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    const unit = run.field.find((u) => u.instanceId === unitInstanceId);
    if (!unit) {
      return null;
    }

    if (unit.tier >= MAX_TIER) {
      return null;
    }

    const cost = this.calculateUpgradeCostForUnit(unit, run.faction);

    return {
      instanceId: unit.instanceId,
      currentTier: unit.tier,
      targetTier: (unit.tier + 1) as UnitTier,
      cost,
      canAfford: run.gold >= cost,
    };
  }

  /**
   * Upgrades a unit on the field to the next tier.
   *
   * Validates the unit exists on field, is upgradeable, and player has enough gold.
   * Deducts gold and updates the unit's tier.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player (for access control)
   * @param unitInstanceId - Instance ID of the unit on field to upgrade
   * @returns Upgrade result with updated unit and gold
   * @throws RunNotFoundException if run doesn't exist
   * @throws RunAccessDeniedException if player doesn't own the run
   * @throws RunAlreadyCompletedException if run is complete
   * @throws InvalidUpgradeException if unit not found on field or at max tier
   * @throws InsufficientGoldException if not enough gold
   *
   * @example
   * const result = await upgradeService.upgradeUnit(
   *   'run-uuid',
   *   'player-uuid',
   *   'footman-1'
   * );
   * // result.upgradedUnit.tier === 2
   * // result.goldSpent === 3
   */
  async upgradeUnit(
    runId: string,
    playerId: string,
    unitInstanceId: string,
  ): Promise<UpgradeResult> {
    this.logger.log('Upgrading unit on field', { runId, playerId, unitInstanceId });

    const run = await this.getRunWithAccessCheck(runId, playerId);

    // Find the unit on field
    const unitIndex = run.field.findIndex((u) => u.instanceId === unitInstanceId);
    if (unitIndex === -1) {
      this.logger.warn('Unit not found on field', { runId, playerId, unitInstanceId });
      throw new InvalidUpgradeException('Юнит не найден на поле. Улучшать можно только выставленных юнитов.', unitInstanceId);
    }

    const unit = run.field[unitIndex];
    if (!unit) {
      throw new InvalidUpgradeException('Юнит не найден на поле', unitInstanceId);
    }

    // Check if unit can be upgraded
    if (unit.tier >= MAX_TIER) {
      this.logger.warn('Unit already at max tier', {
        runId,
        playerId,
        unitInstanceId,
        currentTier: unit.tier,
      });
      throw new InvalidUpgradeException('Юнит уже на максимальном уровне', unitInstanceId);
    }

    // Calculate upgrade cost
    const cost = this.calculateUpgradeCostForUnit(unit, run.faction);

    // Check if player can afford
    if (run.gold < cost) {
      this.logger.warn('Insufficient gold for upgrade', {
        runId,
        playerId,
        unitInstanceId,
        required: cost,
        available: run.gold,
      });
      throw new InsufficientGoldException(cost, run.gold, 'улучшение');
    }

    // Perform upgrade
    const upgradedUnit: FieldUnit = {
      ...unit,
      tier: (unit.tier + 1) as UnitTier,
    };

    // Update field with upgraded unit
    const newField = [...run.field];
    newField[unitIndex] = upgradedUnit;

    // Deduct gold
    const newGold = run.gold - cost;

    // Save updated run
    run.field = newField;
    run.gold = newGold;
    await this.runRepository.save(run);

    this.logger.log('Unit upgraded successfully', {
      runId,
      playerId,
      unitInstanceId,
      oldTier: unit.tier,
      newTier: upgradedUnit.tier,
      goldSpent: cost,
      remainingGold: newGold,
    });

    return {
      upgradedUnit,
      field: newField,
      gold: newGold,
      goldSpent: cost,
    };
  }

  /**
   * Checks if a unit on the field can be upgraded.
   *
   * @param runId - ID of the run
   * @param playerId - ID of the player
   * @param unitInstanceId - Instance ID of the unit on field
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
    unitInstanceId: string,
  ): Promise<{ canUpgrade: boolean; reason?: string }> {
    try {
      const run = await this.getRunWithAccessCheck(runId, playerId);

      const unit = run.field.find((u) => u.instanceId === unitInstanceId);
      if (!unit) {
        return { canUpgrade: false, reason: 'Юнит не найден на поле. Улучшать можно только выставленных юнитов.' };
      }

      if (unit.tier >= MAX_TIER) {
        return { canUpgrade: false, reason: 'Юнит уже на максимальном уровне' };
      }

      const cost = this.calculateUpgradeCostForUnit(unit, run.faction);
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
   * Calculates upgrade cost for a unit based on its base unit cost.
   *
   * @param unit - The unit on field to calculate cost for
   * @param faction - The faction (to look up unit data)
   * @returns Upgrade cost in gold
   * @private
   */
  private calculateUpgradeCostForUnit(unit: FieldUnit, faction: string): number {
    // Get base unit to find T1 cost
    const units = faction === 'humans' ? HUMANS_T1_UNITS : UNDEAD_T1_UNITS;
    const unitData = units.find((u) => u.id === unit.unitId);

    if (!unitData) {
      // Fallback to default cost calculation (assume cost 3)
      return calculateUpgradeCost(3, (unit.tier + 1) as UnitTier);
    }

    // Calculate cost based on T1 cost and target tier
    return calculateUpgradeCost(unitData.cost, (unit.tier + 1) as UnitTier);
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
