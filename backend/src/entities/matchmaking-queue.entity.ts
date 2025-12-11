/**
 * Matchmaking Queue entity for Fantasy Autobattler.
 * Manages player queue for PvP matchmaking with ELO rating system.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Player } from './player.entity';
import { Team } from './team.entity';

/**
 * Matchmaking queue status enumeration.
 */
export enum MatchmakingStatus {
  /** Player is waiting for a match */
  WAITING = 'waiting',
  /** Player has been matched with an opponent */
  MATCHED = 'matched',
  /** Queue entry has expired due to timeout */
  EXPIRED = 'expired',
}

/**
 * Matchmaking Queue entity.
 * Represents a player's entry in the matchmaking queue with their team and rating.
 * 
 * @example
 * const queueEntry = new MatchmakingQueue();
 * queueEntry.playerId = 'player-123';
 * queueEntry.teamId = 'team-456';
 * queueEntry.rating = 1200;
 * queueEntry.status = MatchmakingStatus.WAITING;
 */
@Entity('matchmaking_queue')
@Index('idx_matchmaking_status_joined', ['status', 'joinedAt'])
@Index('idx_matchmaking_rating_status', ['rating', 'status'])
@Index('idx_matchmaking_player_waiting', ['playerId', 'status'], { 
  unique: true, 
  where: "status = 'waiting'" 
})
export class MatchmakingQueue {
  /**
   * Unique identifier for the queue entry.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the player in the queue.
   */
  @Column({ type: 'uuid', nullable: false })
  playerId!: string;

  /**
   * Player entity relationship.
   */
  @ManyToOne(() => Player, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player!: Player;

  /**
   * ID of the team the player is using for matchmaking.
   */
  @Column({ type: 'uuid', nullable: false })
  teamId!: string;

  /**
   * Team entity relationship.
   */
  @ManyToOne(() => Team, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  /**
   * Player's ELO rating for matchmaking.
   * Used to find opponents of similar skill level.
   */
  @Column({
    type: 'integer',
    nullable: false,
    default: 1200,
    comment: 'ELO rating for skill-based matchmaking'
  })
  rating!: number;

  /**
   * Timestamp when the player joined the queue.
   */
  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'When the player joined the matchmaking queue'
  })
  joinedAt!: Date;

  /**
   * Current status of the queue entry.
   */
  @Column({
    type: 'enum',
    enum: MatchmakingStatus,
    nullable: false,
    default: MatchmakingStatus.WAITING,
    comment: 'Current matchmaking status'
  })
  status!: MatchmakingStatus;

  /**
   * Optional match ID when the player has been matched.
   * Used to track which battle this queue entry resulted in.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Battle ID when matched with an opponent'
  })
  matchId?: string;

  /**
   * Timestamp when the queue entry was created.
   */
  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'When this queue entry was created'
  })
  createdAt!: Date;

  /**
   * Timestamp when the queue entry was last updated.
   */
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'When this queue entry was last updated'
  })
  updatedAt!: Date;

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if the queue entry has expired based on timeout.
   * 
   * @param timeoutMinutes - Maximum time in queue before expiring
   * @returns True if the entry should be expired
   * @example
   * const isExpired = queueEntry.isExpired(5); // 5 minute timeout
   */
  isExpired(timeoutMinutes: number = 5): boolean {
    if (this.status !== MatchmakingStatus.WAITING) {
      return false;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const elapsedMs = Date.now() - this.joinedAt.getTime();
    return elapsedMs > timeoutMs;
  }

  /**
   * Get the time spent waiting in the queue.
   * 
   * @returns Time in milliseconds since joining the queue
   * @example
   * const waitTime = queueEntry.getWaitTime();
   * console.log(`Waited ${waitTime / 1000} seconds`);
   */
  getWaitTime(): number {
    return Date.now() - this.joinedAt.getTime();
  }

  /**
   * Check if this player can be matched with another player based on rating difference.
   * 
   * @param otherRating - Rating of the potential opponent
   * @param maxRatingDiff - Maximum allowed rating difference
   * @returns True if players can be matched
   * @example
   * const canMatch = queueEntry.canMatchWith(1250, 100); // Allow 100 rating difference
   */
  canMatchWith(otherRating: number, maxRatingDiff: number = 200): boolean {
    return Math.abs(this.rating - otherRating) <= maxRatingDiff;
  }

  /**
   * Mark this queue entry as matched with an opponent.
   * 
   * @param matchId - ID of the created battle/match
   * @example
   * queueEntry.markAsMatched('battle-789');
   */
  markAsMatched(matchId: string): void {
    this.status = MatchmakingStatus.MATCHED;
    this.matchId = matchId;
  }

  /**
   * Mark this queue entry as expired due to timeout.
   * 
   * @example
   * queueEntry.markAsExpired();
   */
  markAsExpired(): void {
    this.status = MatchmakingStatus.EXPIRED;
  }

  /**
   * Get a summary of the queue entry for display.
   * 
   * @returns Summary object with key information
   * @example
   * const summary = queueEntry.getSummary();
   * console.log(`Player ${summary.playerId} waiting for ${summary.waitTimeSeconds}s`);
   */
  getSummary(): {
    id: string;
    playerId: string;
    teamId: string;
    rating: number;
    status: MatchmakingStatus;
    waitTimeSeconds: number;
    joinedAt: Date;
  } {
    return {
      id: this.id,
      playerId: this.playerId,
      teamId: this.teamId,
      rating: this.rating,
      status: this.status,
      waitTimeSeconds: Math.floor(this.getWaitTime() / 1000),
      joinedAt: this.joinedAt,
    };
  }
}