/**
 * Team entity for Fantasy Autobattler.
 * Represents a player's team configuration with units and positions.
 * 
 * @fileoverview Team entity with validation for budget constraints,
 * unit positioning, and matchmaking status management.
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { Position } from '../types/game.types';
import { TEAM_LIMITS } from '../config/game.constants';

/**
 * Player interface for type safety without circular dependency.
 */
interface IPlayer {
  id: string;
  guestId: string;
  name: string;
  teams: Team[];
}

/**
 * Team unit configuration interface.
 * Defines a unit with its ID and battlefield position.
 */
export interface TeamUnit {
  /** Unit template ID from unit.data.ts */
  unitId: string;
  /** Position on the 8×10 battlefield grid */
  position: Position;
}

/**
 * Team entity representing a player's unit configuration.
 * Contains team composition, positioning, and matchmaking status.
 */
@Entity()
export class Team {
  /**
   * Unique team identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the player who owns this team.
   */
  @Column()
  playerId!: string;

  /**
   * Player entity relationship.
   */
  @ManyToOne('Player', 'teams')
  @JoinColumn({ name: 'playerId' })
  player!: IPlayer;

  /**
   * Team name for identification and display.
   */
  @Column({ length: 100 })
  name!: string;

  /**
   * Team composition with unit IDs and positions.
   * Stored as JSON array of TeamUnit objects.
   */
  @Column('json')
  units!: TeamUnit[];

  /**
   * Total cost of all units in the team.
   * Must not exceed TEAM_LIMITS.BUDGET (30 points).
   */
  @Column()
  totalCost!: number;

  /**
   * Whether this team is active for matchmaking.
   * Only one team per player can be active at a time.
   */
  @Column({ default: false })
  isActive!: boolean;

  /**
   * Team creation timestamp.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Team last update timestamp.
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Validates team configuration before database operations.
   * Ensures budget constraints and unit positioning rules are met.
   * 
   * @throws Error if team configuration is invalid
   */
  @BeforeInsert()
  @BeforeUpdate()
  validateTeam(): void {
    this.validateBudget();
    this.validateUnits();
    this.validatePositions();
  }

  /**
   * Validates that total team cost does not exceed budget limit.
   * 
   * @throws Error if team cost exceeds TEAM_LIMITS.BUDGET
   * @private
   */
  private validateBudget(): void {
    if (this.totalCost > TEAM_LIMITS.BUDGET) {
      throw new Error(
        `Team cost ${this.totalCost} exceeds maximum budget of ${TEAM_LIMITS.BUDGET} points`
      );
    }

    if (this.totalCost < 0) {
      throw new Error('Team cost cannot be negative');
    }
  }

  /**
   * Validates team units array structure and content.
   * 
   * @throws Error if units array is invalid
   * @private
   */
  private validateUnits(): void {
    if (!Array.isArray(this.units)) {
      throw new Error('Team units must be an array');
    }

    if (this.units.length === 0) {
      throw new Error('Team must have at least one unit');
    }

    if (this.units.length > TEAM_LIMITS.MAX_UNITS) {
      throw new Error(
        `Team cannot have more than ${TEAM_LIMITS.MAX_UNITS} units`
      );
    }

    // Validate each unit structure
    for (let i = 0; i < this.units.length; i++) {
      const unit = this.units[i];
      if (!unit) {
        throw new Error(`Unit at index ${i} is undefined`);
      }

      if (!unit.unitId || typeof unit.unitId !== 'string') {
        throw new Error(`Unit at index ${i} must have a valid unitId string`);
      }

      if (!unit.position || typeof unit.position !== 'object') {
        throw new Error(`Unit at index ${i} must have a valid position object`);
      }

      if (
        typeof unit.position.x !== 'number' || 
        typeof unit.position.y !== 'number'
      ) {
        throw new Error(
          `Unit at index ${i} position must have numeric x and y coordinates`
        );
      }
    }
  }

  /**
   * Validates unit positions are within grid bounds and deployment zones.
   * 
   * @throws Error if positions are invalid
   * @private
   */
  private validatePositions(): void {
    const positions = this.units.map(unit => unit.position);
    
    // Check for duplicate positions
    const positionKeys = positions.map(pos => `${pos.x},${pos.y}`);
    const uniquePositions = new Set(positionKeys);
    
    if (uniquePositions.size !== positions.length) {
      throw new Error('Team cannot have units in duplicate positions');
    }

    // Validate each position is within grid bounds
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      if (!pos) continue;

      // Grid bounds validation (8×10 grid)
      if (pos.x < 0 || pos.x >= 8 || pos.y < 0 || pos.y >= 10) {
        throw new Error(
          `Unit at index ${i} position (${pos.x}, ${pos.y}) is outside grid bounds (0-7, 0-9)`
        );
      }

      // Player deployment zone validation (rows 0-1)
      if (pos.y < 0 || pos.y > 1) {
        throw new Error(
          `Unit at index ${i} position (${pos.x}, ${pos.y}) is outside player deployment zone (rows 0-1)`
        );
      }
    }
  }

  /**
   * Calculates the total cost of all units in the team.
   * This method should be called before saving to ensure totalCost is accurate.
   * 
   * @param getUnitCost - Function to get unit cost by ID
   * @returns Total cost of all units
   * @example
   * const cost = team.calculateTotalCost((unitId) => getUnitTemplate(unitId)?.cost ?? 0);
   */
  calculateTotalCost(getUnitCost: (unitId: string) => number): number {
    return this.units.reduce((total, unit) => {
      return total + getUnitCost(unit.unitId);
    }, 0);
  }

  /**
   * Checks if the team is valid for battle participation.
   * 
   * @returns True if team meets all requirements for battle
   * @example
   * if (team.isValidForBattle()) {
   *   // Team can participate in battles
   * }
   */
  isValidForBattle(): boolean {
    try {
      this.validateTeam();
      return this.units.length > 0 && this.totalCost <= TEAM_LIMITS.BUDGET;
    } catch {
      return false;
    }
  }

  /**
   * Gets a summary of the team for display purposes.
   * 
   * @returns Team summary object
   * @example
   * const summary = team.getSummary();
   * console.log(`${summary.name}: ${summary.unitCount} units, ${summary.totalCost} points`);
   */
  getSummary(): {
    id: string;
    name: string;
    unitCount: number;
    totalCost: number;
    isActive: boolean;
    isValid: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      unitCount: this.units.length,
      totalCost: this.totalCost,
      isActive: this.isActive,
      isValid: this.isValidForBattle(),
    };
  }
}