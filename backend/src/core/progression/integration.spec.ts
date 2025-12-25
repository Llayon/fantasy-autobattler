/**
 * Integration tests for Core Progression Systems
 *
 * Tests that all modules work together correctly.
 * Individual module tests are in their respective spec files.
 *
 * @module core/progression/integration
 */

import {
  // Types
  BaseCard,
  // Deck
  createDeck,
  addCard,
  shuffleDeck,
  drawCards,
  // Hand
  createHand,
  addToHand,
  // Draft
  createDraft,
  getDraftOptions,
  pickCard,
  isDraftComplete,
  getDraftResult,
  INITIAL_DRAFT_CONFIG,
  // Upgrade
  upgradeCard,
  getUpgradeCost,
  STANDARD_TIERS,
  // Economy
  createWallet,
  addCurrency,
  spendCurrency,
  canAfford,
  getReward,
  ROGUELIKE_ECONOMY_CONFIG,
  // Run
  createRun,
  recordWin,
  recordLoss,
  advancePhase,
  isRunComplete,
  getRunResult,
  ROGUELIKE_RUN_CONFIG,
  // Snapshot
  createSnapshot,
  findOpponent,
  generateBot,
  ROGUELIKE_SNAPSHOT_CONFIG,
  ROGUELIKE_MATCHMAKING_CONFIG,
  ROGUELIKE_BOT_CONFIG,
} from './index';

// Test card type
interface TestCard extends BaseCard {
  hp: number;
  atk: number;
  role: string;
}

// Test card pool
const createTestCardPool = (): TestCard[] => [
  { id: 'knight', name: 'Knight', baseCost: 5, tier: 1, hp: 100, atk: 10, role: 'tank' },
  { id: 'archer', name: 'Archer', baseCost: 4, tier: 1, hp: 60, atk: 15, role: 'ranged' },
  { id: 'mage', name: 'Mage', baseCost: 6, tier: 1, hp: 50, atk: 20, role: 'mage' },
  { id: 'priest', name: 'Priest', baseCost: 5, tier: 1, hp: 70, atk: 8, role: 'support' },
  { id: 'rogue', name: 'Rogue', baseCost: 4, tier: 1, hp: 55, atk: 18, role: 'melee' },
  { id: 'guardian', name: 'Guardian', baseCost: 7, tier: 1, hp: 120, atk: 8, role: 'tank' },
  { id: 'hunter', name: 'Hunter', baseCost: 5, tier: 1, hp: 65, atk: 14, role: 'ranged' },
  { id: 'warlock', name: 'Warlock', baseCost: 6, tier: 1, hp: 45, atk: 22, role: 'mage' },
  { id: 'bard', name: 'Bard', baseCost: 4, tier: 1, hp: 60, atk: 10, role: 'support' },
  { id: 'assassin', name: 'Assassin', baseCost: 5, tier: 1, hp: 50, atk: 25, role: 'melee' },
  { id: 'berserker', name: 'Berserker', baseCost: 6, tier: 1, hp: 80, atk: 20, role: 'tank' },
  { id: 'elementalist', name: 'Elementalist', baseCost: 7, tier: 1, hp: 40, atk: 28, role: 'mage' },
];

// Deck config for tests
const TEST_DECK_CONFIG = {
  maxDeckSize: 12,
  minDeckSize: 0, // Allow empty deck for testing
  allowDuplicates: false,
  maxCopies: 1,
};

// Hand config for tests
const TEST_HAND_CONFIG = {
  maxHandSize: 5,
  startingHandSize: 0,
  autoDiscard: false,
};

describe('Core Progression Integration', () => {
  describe('Draft → Deck Integration', () => {
    it('should draft cards and add them to deck', () => {
      const seed = 12345;
      const cardPool = createTestCardPool();

      // Create draft
      const draft = createDraft(cardPool, INITIAL_DRAFT_CONFIG, seed);
      const options = getDraftOptions(draft);
      expect(options.length).toBe(5);

      // Pick first 3 cards
      let currentDraft = draft;
      for (let i = 0; i < 3; i++) {
        const opts = getDraftOptions(currentDraft);
        if (opts.length > 0 && opts[0]) {
          currentDraft = pickCard(currentDraft, opts[0].id);
        }
      }

      expect(isDraftComplete(currentDraft)).toBe(true);
      const result = getDraftResult(currentDraft);
      expect(result.picked.length).toBe(3);

      // Add to deck
      let deck = createDeck<TestCard>([], TEST_DECK_CONFIG);
      for (const card of result.picked as TestCard[]) {
        deck = addCard(deck, card);
      }
      expect(deck.cards.length).toBe(3);
    });
  });

  describe('Deck → Hand Integration', () => {
    it('should draw cards from deck to hand', () => {
      const cardPool = createTestCardPool();

      // Create deck with cards
      let deck = createDeck<TestCard>(cardPool.slice(0, 6), TEST_DECK_CONFIG);
      expect(deck.cards.length).toBe(6);

      // Shuffle
      deck = shuffleDeck(deck, 12345);

      // Draw cards
      const [drawnCards, remainingDeck] = drawCards(deck, 3);
      expect(drawnCards.length).toBe(3);
      expect(remainingDeck.cards.length).toBe(3);

      // Add to hand
      let hand = createHand<TestCard>(TEST_HAND_CONFIG);
      const result = addToHand(hand, drawnCards);
      hand = result.hand;
      expect(hand.cards.length).toBe(3);
    });
  });

  describe('Economy → Upgrade Integration', () => {
    it('should purchase upgrades with currency', () => {
      // Create wallet with gold
      let wallet = createWallet(ROGUELIKE_ECONOMY_CONFIG);
      wallet = addCurrency(wallet, 100); // Add more gold to ensure we can afford

      const card: TestCard = {
        id: 'knight',
        name: 'Knight',
        baseCost: 5,
        tier: 1,
        hp: 100,
        atk: 10,
        role: 'tank',
      };

      // Get upgrade cost
      const cost = getUpgradeCost(card, STANDARD_TIERS);
      expect(cost).toBeGreaterThan(0);

      // Can afford?
      expect(canAfford(wallet, cost)).toBe(true);

      // Purchase
      wallet = spendCurrency(wallet, cost);
      const upgraded = upgradeCard(card, STANDARD_TIERS);

      expect(upgraded.tier).toBe(2);
      expect(wallet.amount).toBeLessThan(110);
    });
  });

  describe('Run Progression', () => {
    it('should track wins and losses', () => {
      let run = createRun<{ deck: TestCard[] }>(ROGUELIKE_RUN_CONFIG, {
        deck: createTestCardPool().slice(0, 4),
      });

      expect(run.wins).toBe(0);
      expect(run.losses).toBe(0);

      // Win
      run = recordWin(run);
      expect(run.wins).toBe(1);
      expect(run.winStreak).toBe(1);

      // Another win
      run = recordWin(run);
      expect(run.wins).toBe(2);
      expect(run.winStreak).toBe(2);

      // Loss
      run = recordLoss(run);
      expect(run.losses).toBe(1);
      expect(run.loseStreak).toBe(1);
      expect(run.winStreak).toBe(0);
    });

    it('should complete run at 9 wins', () => {
      let run = createRun<null>(ROGUELIKE_RUN_CONFIG, null);

      for (let i = 0; i < 9; i++) {
        expect(isRunComplete(run)).toBe(false);
        run = recordWin(run);
      }

      expect(isRunComplete(run)).toBe(true);
      const result = getRunResult(run);
      expect(result).toBe('won');
    });

    it('should complete run at 4 losses', () => {
      let run = createRun<null>(ROGUELIKE_RUN_CONFIG, null);

      for (let i = 0; i < 4; i++) {
        expect(isRunComplete(run)).toBe(false);
        run = recordLoss(run);
      }

      expect(isRunComplete(run)).toBe(true);
      const result = getRunResult(run);
      expect(result).toBe('lost');
    });

    it('should cycle through phases', () => {
      let run = createRun<null>(ROGUELIKE_RUN_CONFIG, null);

      // Get initial phase
      const phase0 = run.config.phases[run.currentPhaseIndex];
      expect(phase0).toBeDefined();

      // Advance
      run = advancePhase(run);
      const phase1 = run.config.phases[run.currentPhaseIndex];
      expect(phase1).toBeDefined();

      // Advance again
      run = advancePhase(run);
      const phase2 = run.config.phases[run.currentPhaseIndex];
      expect(phase2).toBeDefined();
    });
  });

  describe('Snapshot and Matchmaking', () => {
    it('should create snapshot from run', () => {
      const run = createRun<{ deck: TestCard[] }>(ROGUELIKE_RUN_CONFIG, {
        deck: createTestCardPool().slice(0, 4),
      });

      const snapshot = createSnapshot(run, 'player-1', 1200, ROGUELIKE_SNAPSHOT_CONFIG);

      expect(snapshot.playerId).toBe('player-1');
      expect(snapshot.runId).toBe(run.id);
      expect(snapshot.wins).toBe(0);
      expect(snapshot.rating).toBe(1200);
    });

    it('should find opponent from snapshots', () => {
      const cardPool = createTestCardPool();

      // Create runs and snapshots
      const run1 = createRun<{ deck: TestCard[] }>(ROGUELIKE_RUN_CONFIG, {
        deck: cardPool.slice(0, 4),
      });
      const run2 = createRun<{ deck: TestCard[] }>(ROGUELIKE_RUN_CONFIG, {
        deck: cardPool.slice(2, 6),
      });
      const run3 = createRun<{ deck: TestCard[] }>(ROGUELIKE_RUN_CONFIG, {
        deck: cardPool.slice(4, 8),
      });

      // Record some wins
      const run1WithWins = recordWin(recordWin(recordWin(run1)));
      const run2WithWins = recordWin(recordWin(recordWin(recordWin(run2))));
      const run3WithWins = recordWin(recordWin(run3));

      const snapshots = [
        createSnapshot(run1WithWins, 'opponent-1', 1100, ROGUELIKE_SNAPSHOT_CONFIG),
        createSnapshot(run2WithWins, 'opponent-2', 1200, ROGUELIKE_SNAPSHOT_CONFIG),
        createSnapshot(run3WithWins, 'opponent-3', 1050, ROGUELIKE_SNAPSHOT_CONFIG),
      ];

      // Find opponent for player with 3 wins, 1100 rating
      const opponent = findOpponent(3, 1100, snapshots, ROGUELIKE_MATCHMAKING_CONFIG, 12345);

      expect(opponent).not.toBeNull();
      // Should find someone within wins range (±1) and rating range (±200)
      expect(Math.abs(opponent!.wins - 3)).toBeLessThanOrEqual(1);
      expect(Math.abs(opponent!.rating - 1100)).toBeLessThanOrEqual(200);
    });

    it('should generate bot when no snapshots available', () => {
      const cardPool = createTestCardPool();

      const bot = generateBot(5, cardPool, ROGUELIKE_BOT_CONFIG, 12345);

      expect(bot.name).toBeDefined();
      expect(bot.cards.length).toBeGreaterThan(0);
      expect(bot.difficulty).toBeGreaterThanOrEqual(0);
      expect(bot.difficulty).toBeLessThanOrEqual(1);
    });
  });

  describe('Determinism', () => {
    it('should produce identical results with same seed', () => {
      const seed = 54321;
      const cardPool = createTestCardPool();

      // Run 1
      const draft1 = createDraft(cardPool, INITIAL_DRAFT_CONFIG, seed);
      const options1 = getDraftOptions(draft1);

      // Run 2 with same seed
      const draft2 = createDraft(cardPool, INITIAL_DRAFT_CONFIG, seed);
      const options2 = getDraftOptions(draft2);

      // Should produce identical results
      expect(options1.map((c) => c.id)).toEqual(options2.map((c) => c.id));
    });

    it('should shuffle deck deterministically', () => {
      const cardPool = createTestCardPool();
      const seed = 99999;

      const deck1 = shuffleDeck(createDeck(cardPool.slice(0, 6), TEST_DECK_CONFIG), seed);
      const deck2 = shuffleDeck(createDeck(cardPool.slice(0, 6), TEST_DECK_CONFIG), seed);

      expect(deck1.cards.map((c) => c.id)).toEqual(deck2.cards.map((c) => c.id));
    });
  });

  describe('Economy Rewards', () => {
    it('should calculate rewards based on wins', () => {
      const reward1 = getReward(true, 1, ROGUELIKE_ECONOMY_CONFIG);
      const reward5 = getReward(true, 5, ROGUELIKE_ECONOMY_CONFIG);
      const reward8 = getReward(true, 8, ROGUELIKE_ECONOMY_CONFIG);

      // Rewards should increase with streak
      expect(reward5).toBeGreaterThanOrEqual(reward1);
      expect(reward8).toBeGreaterThanOrEqual(reward5);
    });
  });
});
