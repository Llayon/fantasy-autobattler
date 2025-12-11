/**
 * Battle Log entity for Fantasy Autobattler.
 * Stores complete battle information including player data, team snapshots, and simulation results.
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne, 
  JoinColumn,
  Index 
} from 'typeorm';
import { Player } from './player.entity';
import { BattleEvent } from '../types/game.types';
import { TeamSetup } from '../battle/battle.simulator';

/**
 * Battle status enumeration.
 * Tracks the current state of battle processing and viewing.
 */
export enum BattleStatus {
  /** Battle created but simulation not started */
  PENDING = 'pending',
  /** Battle simulation completed */
  SIMULATED = 'simulated',
  /** Battle has been viewed by at least one player */
  VIEWED = 'viewed',
}

/**
 * Battle winner enumeration.
 * Represents the outcome of the battle simulation.
 */
export type BattleWinner = 'player1' | 'player2' | 'draw';

/**
 * Battle Log entity.
 * Represents a complete PvP battle between two players with full replay data.
 * 
 * @example
 * const battle = new BattleLog();
 * battle.player1Id = 'player-123';
 * battle.player2Id = 'player-456';
 * battle.seed = 12345;
 * battle.status = BattleStatus.PENDING;
 */
@Entity('battle_logs')
@Index('idx_battle_player1', ['player1Id'])
@Index('idx_battle_player2', ['player2Id'])
@Index('idx_battle_status', ['status'])
@Index('idx_battle_created', ['createdAt'])
export class BattleLog {
  /**
   * Unique identifier for the battle.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the first player in the battle.
   */
  @Column({ 
    type: 'uuid', 
    nullable: false,
    comment: 'First player participating in the battle'
  })
  player1Id!: string;

  /**
   * First player entity relationship.
   */
  @ManyToOne(() => Player, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player1Id' })
  player1!: Player;

  /**
   * ID of the second player in the battle.
   */
  @Column({ 
    type: 'uuid', 
    nullable: false,
    comment: 'Second player participating in the battle'
  })
  player2Id!: string;

  /**
   * Second player entity relationship.
   */
  @ManyToOne(() => Player, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player2Id' })
  player2!: Player;

  /**
   * Snapshot of player1's team at the time of battle.
   * Preserves the exact team composition used in the battle for replay purposes.
   */
  @Column({
    type: 'json',
    nullable: false,
    comment: 'Player 1 team snapshot at battle time'
  })
  player1TeamSnapshot!: TeamSetup;

  /**
   * Snapshot of player2's team at the time of battle.
   * Preserves the exact team composition used in the battle for replay purposes.
   */
  @Column({
    type: 'json',
    nullable: false,
    comment: 'Player 2 team snapshot at battle time'
  })
  player2TeamSnapshot!: TeamSetup;

  /**
   * Random seed used for battle simulation.
   * Ensures deterministic replay of the exact same battle.
   */
  @Column({
    type: 'integer',
    nullable: false,
    comment: 'Random seed for deterministic battle simulation'
  })
  seed!: number;

  /**
   * Current status of the battle.
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: BattleStatus.PENDING,
    comment: 'Current battle processing status'
  })
  status!: BattleStatus;

  /**
   * Complete sequence of battle events for replay.
   * Contains all actions, movements, attacks, and state changes.
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Complete battle event sequence for replay'
  })
  events?: BattleEvent[];

  /**
   * Winner of the battle simulation.
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Battle winner: player1, player2, or draw'
  })
  winner?: BattleWinner;

  /**
   * Number of rounds the battle lasted.
   */
  @Column({
    type: 'integer',
    nullable: true,
    default: 0,
    comment: 'Total number of battle rounds'
  })
  rounds?: number;

  /**
   * Whether player1 has viewed this battle.
   */
  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Has player 1 viewed this battle'
  })
  viewedByPlayer1!: boolean;

  /**
   * Whether player2 has viewed this battle.
   */
  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Has player 2 viewed this battle'
  })
  viewedByPlayer2!: boolean;

  /**
   * Timestamp when the battle was created.
   */
  @CreateDateColumn({
    comment: 'When this battle was created'
  })
  createdAt!: Date;

  /**
   * Timestamp when the battle was last updated.
   */
  @UpdateDateColumn({
    comment: 'When this battle was last updated'
  })
  updatedAt!: Date;

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if the battle has been completed (simulated).
   * 
   * @returns True if battle simulation is complete
   * @example
   * if (battle.isCompleted()) {
   *   console.log(`Winner: ${battle.winner}`);
   * }
   */
  isCompleted(): boolean {
    return this.status === BattleStatus.SIMULATED || this.status === BattleStatus.VIEWED;
  }

  /**
   * Check if the battle has been viewed by both players.
   * 
   * @returns True if both players have viewed the battle
   * @example
   * if (battle.isViewedByBoth()) {
   *   // Battle can be archived or cleaned up
   * }
   */
  isViewedByBoth(): boolean {
    return this.viewedByPlayer1 && this.viewedByPlayer2;
  }

  /**
   * Mark the battle as viewed by a specific player.
   * 
   * @param playerId - ID of the player who viewed the battle
   * @example
   * battle.markAsViewed('player-123');
   */
  markAsViewed(playerId: string): void {
    if (playerId === this.player1Id) {
      this.viewedByPlayer1 = true;
    } else if (playerId === this.player2Id) {
      this.viewedByPlayer2 = true;
    }

    // Update status to viewed if not already
    if (this.status === BattleStatus.SIMULATED) {
      this.status = BattleStatus.VIEWED;
    }
  }

  /**
   * Check if a player is a participant in this battle.
   * 
   * @param playerId - ID of the player to check
   * @returns True if the player is participant in this battle
   * @example
   * if (battle.isParticipant('player-123')) {
   *   // Player can view this battle
   * }
   */
  isParticipant(playerId: string): boolean {
    return playerId === this.player1Id || playerId === this.player2Id;
  }

  /**
   * Get the opponent's ID for a given player.
   * 
   * @param playerId - ID of the player
   * @returns ID of the opponent, or null if player is not a participant
   * @example
   * const opponentId = battle.getOpponentId('player-123');
   */
  getOpponentId(playerId: string): string | null {
    if (playerId === this.player1Id) {
      return this.player2Id;
    } else if (playerId === this.player2Id) {
      return this.player1Id;
    }
    return null;
  }

  /**
   * Get a summary of the battle for display purposes.
   * 
   * @returns Battle summary object
   * @example
   * const summary = battle.getSummary();
   * console.log(`Battle ${summary.id}: ${summary.player1Id} vs ${summary.player2Id}`);
   */
  getSummary(): {
    id: string;
    player1Id: string;
    player2Id: string;
    status: BattleStatus;
    winner?: BattleWinner;
    rounds?: number;
    createdAt: Date;
    viewedByPlayer1: boolean;
    viewedByPlayer2: boolean;
  } {
    const summary: {
      id: string;
      player1Id: string;
      player2Id: string;
      status: BattleStatus;
      winner?: BattleWinner;
      rounds?: number;
      createdAt: Date;
      viewedByPlayer1: boolean;
      viewedByPlayer2: boolean;
    } = {
      id: this.id,
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      status: this.status,
      createdAt: this.createdAt,
      viewedByPlayer1: this.viewedByPlayer1,
      viewedByPlayer2: this.viewedByPlayer2,
    };

    if (this.winner !== undefined) {
      summary.winner = this.winner;
    }
    if (this.rounds !== undefined) {
      summary.rounds = this.rounds;
    }

    return summary;
  }
}
