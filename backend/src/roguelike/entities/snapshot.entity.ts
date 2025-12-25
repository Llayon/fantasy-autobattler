/**
 * Snapshot Entity for Roguelike Mode
 *
 * Represents a team snapshot for async PvP matchmaking.
 * Snapshots are saved after each battle and used to match players
 * with similar win counts and ratings.
 *
 * @module roguelike/entities/snapshot
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Faction } from '../types/faction.types';
import { SpellTiming } from '../types/leader.types';

/**
 * Placed unit on the deployment grid.
 */
export interface PlacedUnit {
  /** Unit ID from the deck */
  unitId: string;
  /** Unit tier (1, 2, or 3) */
  tier: 1 | 2 | 3;
  /** Position on the 8×2 deployment grid */
  position: {
    x: number;
    y: number;
  };
}

/**
 * Spell timing configuration for battle.
 */
export interface SpellTimingConfig {
  /** Spell identifier */
  spellId: string;
  /** Player-selected timing */
  timing: SpellTiming;
}

/**
 * Snapshot configuration constants.
 */
export const SNAPSHOT_CONSTANTS = {
  /** Maximum snapshots to consider for matchmaking */
  MAX_MATCHMAKING_CANDIDATES: 100,
  /** Rating range for matchmaking */
  RATING_RANGE: 200,
  /** Win range for matchmaking */
  WIN_RANGE: 1,
} as const;

/**
 * Roguelike Snapshot entity.
 * Stores team configuration for async PvP matchmaking.
 * Players are matched against snapshots from other players' runs.
 *
 * @example
 * const snapshot = new RoguelikeSnapshotEntity();
 * snapshot.runId = 'run-uuid';
 * snapshot.playerId = 'player-uuid';
 * snapshot.wins = 3;
 * snapshot.rating = 1050;
 * snapshot.team = [{ unitId: 'footman', tier: 1, position: { x: 0, y: 0 } }];
 */
@Entity('roguelike_snapshots')
@Index(['playerId'])
@Index(['runId'])
@Index(['wins', 'rating', 'createdAt']) // Composite index for matchmaking queries
@Index(['faction'])
export class RoguelikeSnapshotEntity {
  /**
   * Unique snapshot identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the run this snapshot belongs to.
   */
  @Column({ type: 'uuid' })
  runId!: string;

  /**
   * ID of the player who created this snapshot.
   */
  @Column({ type: 'uuid' })
  playerId!: string;

  /**
   * Number of wins at the time of snapshot.
   * Used for matchmaking to find opponents with similar progress.
   */
  @Column({ type: 'int' })
  wins!: number;

  /**
   * Rating at the time of snapshot.
   * Used for matchmaking to find opponents of similar skill.
   */
  @Column({ type: 'int' })
  rating!: number;

  /**
   * Team composition with unit positions.
   * Represents the exact deployment configuration.
   */
  @Column({ type: 'json' })
  team!: PlacedUnit[];

  /**
   * Spell timing configurations for battle.
   */
  @Column({ type: 'json' })
  spellTimings!: SpellTimingConfig[];

  /**
   * Faction of the run.
   */
  @Column({ type: 'varchar', length: 50 })
  faction!: Faction;

  /**
   * Leader ID of the run.
   */
  @Column({ type: 'varchar', length: 100 })
  leaderId!: string;

  /**
   * Snapshot creation timestamp.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Validates snapshot before insert.
   */
  @BeforeInsert()
  validateSnapshot(): void {
    this.validateTeam();
    this.validateSpellTimings();
    this.validateWinsRating();
  }

  /**
   * Validates team structure.
   * @private
   */
  private validateTeam(): void {
    if (!Array.isArray(this.team)) {
      throw new Error('Team must be an array');
    }
    if (this.team.length === 0) {
      throw new Error('Team must have at least one unit');
    }

    // Validate each unit
    for (let i = 0; i < this.team.length; i++) {
      const unit = this.team[i];
      if (!unit) {
        throw new Error(`Unit at index ${i} is undefined`);
      }
      if (!unit.unitId || typeof unit.unitId !== 'string') {
        throw new Error(`Unit at index ${i} must have a valid unitId`);
      }
      if (![1, 2, 3].includes(unit.tier)) {
        throw new Error(`Unit at index ${i} must have tier 1, 2, or 3`);
      }
      if (!unit.position || typeof unit.position.x !== 'number' || typeof unit.position.y !== 'number') {
        throw new Error(`Unit at index ${i} must have valid position`);
      }
    }

    // Check for duplicate positions
    const positions = this.team.map((u) => `${u.position.x},${u.position.y}`);
    if (new Set(positions).size !== positions.length) {
      throw new Error('Team cannot have units in duplicate positions');
    }
  }

  /**
   * Validates spell timings structure.
   * @private
   */
  private validateSpellTimings(): void {
    if (!Array.isArray(this.spellTimings)) {
      throw new Error('Spell timings must be an array');
    }

    for (let i = 0; i < this.spellTimings.length; i++) {
      const spell = this.spellTimings[i];
      if (!spell) {
        throw new Error(`Spell timing at index ${i} is undefined`);
      }
      if (!spell.spellId || typeof spell.spellId !== 'string') {
        throw new Error(`Spell timing at index ${i} must have a valid spellId`);
      }
      if (!['early', 'mid', 'late'].includes(spell.timing)) {
        throw new Error(`Spell timing at index ${i} must be early, mid, or late`);
      }
    }
  }

  /**
   * Validates wins and rating are valid.
   * @private
   */
  private validateWinsRating(): void {
    if (this.wins < 0 || this.wins > 9) {
      throw new Error('Wins must be between 0 and 9');
    }
    if (this.rating < 0) {
      throw new Error('Rating cannot be negative');
    }
  }

  /**
   * Gets total team cost (sum of unit tiers as proxy).
   *
   * @returns Approximate team strength
   */
  getTeamStrength(): number {
    return this.team.reduce((sum, unit) => sum + unit.tier, 0);
  }

  /**
   * Gets a summary of the snapshot for display.
   *
   * @returns Snapshot summary object
   */
  getSummary(): {
    id: string;
    wins: number;
    rating: number;
    faction: Faction;
    teamSize: number;
    teamStrength: number;
  } {
    return {
      id: this.id,
      wins: this.wins,
      rating: this.rating,
      faction: this.faction,
      teamSize: this.team.length,
      teamStrength: this.getTeamStrength(),
    };
  }
}
