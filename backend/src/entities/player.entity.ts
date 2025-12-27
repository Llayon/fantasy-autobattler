import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { BattleLog } from './battle-log.entity';
import { Team } from './team.entity';

@Entity()
@Index('IDX_PLAYER_RATING', ['rating'])
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  guestId!: string;

  @Column({ default: 'Guest' })
  name!: string;

  @Column('json', { default: [] })
  team!: string[];

  @Column({ default: 0 })
  wins!: number;

  @Column({ default: 0 })
  losses!: number;

  @Column({ default: 1000 })
  rating!: number;

  @Column({ default: 0 })
  gamesPlayed!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => BattleLog, (battle) => battle.player1)
  battlesAsPlayer1!: BattleLog[];

  @OneToMany(() => Team, (team) => team.player)
  teams!: Team[];
}
