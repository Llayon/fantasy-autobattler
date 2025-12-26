/**
 * Run Entity for Roguelike Mode
 *
 * Represents a player's roguelike run with deck, hand, spells, and progress.
 * A run ends when the player reaches 9 wins or 4 losses.
 *
 * @module roguelike/entities/run
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Faction } from '../types/faction.types';
import { DeckCard } from '../types/unit.types';
import { SpellTiming } from '../types/leader.types';

/**
 * Run status type.
 * - 'active': Run is in progress
 * - 'won': Player achieved 9 wins
 * - 'lost': Player accumulated 4 losses
 */
export type RunStatus = 'active' | 'won' | 'lost';

/**
 * Battle history entry with full battle information.
 */
export interface BattleHistoryEntry {
  /** Battle log ID */
  battleId: string;
  /** Battle result */
  result: 'win' | 'loss';
  /** Gold earned from this battle */
  goldEarned: number;
  /** Opponent information */
  opponent: {
    name: string;
    faction: string;
    rating: number;
  };
  /** Battle timestamp */
  timestamp: string;
}

/**
 * Spell card with player-selected timing.
 */
export interface SpellCard {
  /** Spell identifier */
  spellId: string;
  /** Player-selected timing for this spell */
  timing?: SpellTiming;
}

/**
 * Run configuration constants.
 */
export const RUN_CONSTANTS = {
  /** Starting gold for new runs */
  STARTING_GOLD: 10,
  /** Starting rating for new runs */
  STARTING_RATING: 1000,
  /** Wins required to complete a run successfully */
  MAX_WINS: 9,
  /** Losses that end a run */
  MAX_LOSSES: 4,
  /** Maximum hand size */
  MAX_HAND_SIZE: 12,
  /** Initial deck size */
  DECK_SIZE: 12,
  /** Number of spells per run */
  SPELLS_COUNT: 2,
} as const;

/**
 * Roguelike Run entity.
 * Tracks player progress through a roguelike run including deck state,
 * wins/losses, gold, and battle history.
 *
 * @example
 * const run = new RoguelikeRunEntity();
 * run.playerId = 'player-uuid';
 * run.faction = 'humans';
 * run.leaderId = 'commander_aldric';
 * run.deck = [...]; // 12 DeckCards
 * run.spells = [{ spellId: 'holy_light' }, { spellId: 'rally' }];
 */
@Entity('roguelike_runs')
@Index(['playerId'])
@Index(['playerId', 'status'])
@Index(['status', 'rating'])
export class RoguelikeRunEntity {
  /**
   * Unique run identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the player who owns this run.
   */
  @Column({ type: 'uuid' })
  playerId!: string;

  /**
   * Selected faction for this run.
   */
  @Column({ type: 'varchar', length: 50 })
  faction!: Faction;

  /**
   * Selected leader ID for this run.
   */
  @Column({ type: 'varchar', length: 100 })
  leaderId!: string;


  /**
   * Full deck of cards (12 units).
   * Fixed at run start based on faction's starter deck.
   */
  @Column({ type: 'json' })
  deck!: DeckCard[];

  /**
   * Cards not yet drafted to hand.
   * Decreases as player drafts cards after battles.
   */
  @Column({ type: 'json' })
  remainingDeck!: DeckCard[];

  /**
   * Cards currently in hand (available for placement).
   * Grows from 3 to max 12 through drafts.
   */
  @Column({ type: 'json' })
  hand!: DeckCard[];

  /**
   * Spells available for this run (2 spells from leader).
   * Always available, not drafted.
   */
  @Column({ type: 'json' })
  spells!: SpellCard[];

  /**
   * Number of wins in this run (0-9).
   */
  @Column({ type: 'int', default: 0 })
  wins!: number;

  /**
   * Number of losses in this run (0-4).
   */
  @Column({ type: 'int', default: 0 })
  losses!: number;

  /**
   * Consecutive wins for streak bonus calculation.
   */
  @Column({ type: 'int', default: 0 })
  consecutiveWins!: number;

  /**
   * Consecutive losses (resets on win).
   */
  @Column({ type: 'int', default: 0 })
  consecutiveLosses!: number;

  /**
   * Current gold balance.
   * Starts at 10, increases with wins/losses.
   */
  @Column({ type: 'int', default: RUN_CONSTANTS.STARTING_GOLD })
  gold!: number;

  /**
   * Battle history with full information about each battle.
   */
  @Column({ type: 'json', default: [] })
  battleHistory!: BattleHistoryEntry[];

  /**
   * Current run status.
   */
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: RunStatus;

  /**
   * Run rating for matchmaking.
   * Starts at 1000, adjusted based on battle results.
   */
  @Column({ type: 'int', default: RUN_CONSTANTS.STARTING_RATING })
  rating!: number;

  /**
   * Run creation timestamp.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Run last update timestamp.
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Validates run state before database operations.
   */
  @BeforeInsert()
  @BeforeUpdate()
  validateRun(): void {
    this.validateWinsLosses();
    this.validateGold();
    this.validateDeck();
    this.validateStatus();
  }

  /**
   * Validates wins and losses are within bounds.
   * @private
   */
  private validateWinsLosses(): void {
    if (this.wins < 0 || this.wins > RUN_CONSTANTS.MAX_WINS) {
      throw new Error(`Wins must be between 0 and ${RUN_CONSTANTS.MAX_WINS}`);
    }
    if (this.losses < 0 || this.losses > RUN_CONSTANTS.MAX_LOSSES) {
      throw new Error(`Losses must be between 0 and ${RUN_CONSTANTS.MAX_LOSSES}`);
    }
  }

  /**
   * Validates gold is non-negative.
   * @private
   */
  private validateGold(): void {
    if (this.gold < 0) {
      throw new Error('Gold cannot be negative');
    }
  }

  /**
   * Validates deck structure.
   * @private
   */
  private validateDeck(): void {
    if (!Array.isArray(this.deck)) {
      throw new Error('Deck must be an array');
    }
    if (!Array.isArray(this.remainingDeck)) {
      throw new Error('Remaining deck must be an array');
    }
    if (!Array.isArray(this.hand)) {
      throw new Error('Hand must be an array');
    }
    if (this.hand.length > RUN_CONSTANTS.MAX_HAND_SIZE) {
      throw new Error(`Hand cannot exceed ${RUN_CONSTANTS.MAX_HAND_SIZE} cards`);
    }
  }

  /**
   * Validates and updates status based on wins/losses.
   * @private
   */
  private validateStatus(): void {
    if (this.wins >= RUN_CONSTANTS.MAX_WINS && this.status === 'active') {
      this.status = 'won';
    }
    if (this.losses >= RUN_CONSTANTS.MAX_LOSSES && this.status === 'active') {
      this.status = 'lost';
    }
  }

  /**
   * Checks if the run is still active.
   *
   * @returns True if run is active
   * @example
   * if (run.isActive()) {
   *   // Can continue playing
   * }
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Checks if the run is complete (won or lost).
   *
   * @returns True if run is complete
   */
  isComplete(): boolean {
    return this.status === 'won' || this.status === 'lost';
  }

  /**
   * Gets remaining battles until run ends.
   *
   * @returns Object with wins and losses needed
   */
  getRemainingBattles(): { winsNeeded: number; lossesAllowed: number } {
    return {
      winsNeeded: RUN_CONSTANTS.MAX_WINS - this.wins,
      lossesAllowed: RUN_CONSTANTS.MAX_LOSSES - this.losses - 1,
    };
  }

  /**
   * Gets a summary of the run for display.
   *
   * @returns Run summary object
   */
  getSummary(): {
    id: string;
    faction: Faction;
    wins: number;
    losses: number;
    gold: number;
    status: RunStatus;
    handSize: number;
    deckRemaining: number;
  } {
    return {
      id: this.id,
      faction: this.faction,
      wins: this.wins,
      losses: this.losses,
      gold: this.gold,
      status: this.status,
      handSize: this.hand.length,
      deckRemaining: this.remainingDeck.length,
    };
  }
}
