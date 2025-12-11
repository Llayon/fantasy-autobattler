/**
 * Test-specific Team entity for E2E tests.
 * Simplified version without complex relationships to avoid SQLite compatibility issues.
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
import { Position } from '../../src/types/game.types';
import { PlayerTest } from './player-test.entity';

/**
 * Team unit configuration interface for testing.
 */
export interface TeamUnitTest {
  /** Unit template ID from unit.data.ts */
  unitId: string;
  /** Position on the 8×10 battlefield grid */
  position: Position;
}

/**
 * Team entity for E2E testing.
 * Contains core team data without complex player relationships.
 */
@Entity('team')
@Index(['playerId'])
@Index(['isActive'])
@Index(['playerId', 'isActive'])
export class TeamTest {
  /**
   * Unique team identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the player who owns this team.
   */
  @Column({ type: 'varchar' })
  playerId!: string;

  /**
   * Player entity relationship.
   */
  @ManyToOne(() => PlayerTest, (player) => player.teams)
  @JoinColumn({ name: 'playerId' })
  player!: PlayerTest;

  /**
   * Team name for identification and display.
   */
  @Column({ length: 100 })
  name!: string;

  /**
   * Team composition with unit IDs and positions.
   * Stored as JSON array of TeamUnit objects.
   */
  @Column({ 
    type: 'text',
    nullable: false,
    transformer: {
      to: (value: TeamUnitTest[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  units!: TeamUnitTest[];

  /**
   * Total cost of all units in the team.
   */
  @Column({ 
    type: 'integer',
    default: 0
  })
  totalCost!: number;

  /**
   * Whether this team is active for matchmaking.
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
}