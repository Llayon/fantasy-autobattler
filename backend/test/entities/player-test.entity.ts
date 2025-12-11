/**
 * Test-specific Player entity for E2E tests.
 * Simplified version without BattleLog relationships to avoid SQLite compatibility issues.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Team } from '../../src/entities/team.entity';

/**
 * Player entity for E2E testing.
 * Contains core player data without battle-related relationships.
 */
@Entity('player')
@Index('IDX_PLAYER_RATING', ['rating'])
export class PlayerTest {
  /**
   * Unique identifier for the player.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Unique guest identifier for authentication.
   */
  @Column({ unique: true })
  guestId!: string;

  /**
   * Display name for the player.
   */
  @Column({ default: 'Guest' })
  name!: string;

  /**
   * Legacy team field (deprecated, use teams relationship).
   */
  @Column('json', { default: [] })
  team!: string[];

  /**
   * Number of battles won.
   */
  @Column({ default: 0 })
  wins!: number;

  /**
   * Number of battles lost.
   */
  @Column({ default: 0 })
  losses!: number;

  /**
   * Current ELO rating.
   */
  @Column({ default: 1000 })
  rating!: number;

  /**
   * Total number of games played.
   */
  @Column({ default: 0 })
  gamesPlayed!: number;

  /**
   * Last activity timestamp.
   */
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt!: Date;

  /**
   * Entity creation timestamp.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Entity last update timestamp.
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Player's teams relationship.
   */
  @OneToMany(() => Team, (team) => team.player)
  teams!: Team[];
}