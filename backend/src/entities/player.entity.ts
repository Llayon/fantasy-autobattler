import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BattleLog } from './battle-log.entity';

@Entity()
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => BattleLog, (battle) => battle.player)
  battles!: BattleLog[];
}
