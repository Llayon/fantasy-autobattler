import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';

@Entity()
export class BattleLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  playerId!: string;

  @ManyToOne(() => Player, (player) => player.battles)
  @JoinColumn({ name: 'playerId' })
  player!: Player;

  @Column('json')
  playerTeam!: unknown;

  @Column('json')
  botTeam!: unknown;

  @Column('json')
  events!: unknown;

  @Column()
  winner!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
