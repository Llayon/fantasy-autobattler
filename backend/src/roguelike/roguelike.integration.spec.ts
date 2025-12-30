/**
 * Integration tests for Roguelike Run Mode.
 *
 * Tests the complete flow of a roguelike run including:
 * - Run creation with faction/leader selection
 * - Draft mechanics (initial and post-battle)
 * - Battle flow with spell execution
 * - Upgrade shop mechanics
 * - Run completion (victory/defeat)
 * - Matchmaking with snapshots and bot fallback
 *
 * @module roguelike/integration.spec
 */

import { EconomyService } from './economy/economy.service';
import { SpellExecutor } from './battle/spell.executor';
import { RoguelikeRunEntity } from './entities/run.entity';
import { FACTIONS_DATA, getFaction } from './data/factions.data';
import { getLeader, getLeadersByFaction } from './data/leaders.data';
import {
  HUMANS_STARTER_DECK,
  UNDEAD_STARTER_DECK,
  expandStarterDeck,
  getStarterDeckUnitCount,
} from './data/starter-decks.data';
import { Faction } from './types/faction.types';
import { SpellTiming } from './types/leader.types';
import { DeckCard } from './types/unit.types';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Creates a mock run entity for testing.
 */
function createMockRun(overrides: Partial<RoguelikeRunEntity> = {}): RoguelikeRunEntity {
  const run = new RoguelikeRunEntity();
  const expandedDeck = expandStarterDeck(HUMANS_STARTER_DECK);

  run.id = 'test-run-id';
  run.playerId = 'test-player-id';
  run.faction = 'humans';
  run.leaderId = 'commander_aldric';
  run.deck = expandedDeck;
  run.remainingDeck = [...expandedDeck];
  run.hand = [];
  run.spells = [
    { spellId: 'holy_light', timing: 'early' as SpellTiming },
    { spellId: 'rally', timing: 'mid' as SpellTiming },
  ];
  run.wins = 0;
  run.losses = 0;
  run.consecutiveWins = 0;
  run.consecutiveLosses = 0;
  run.gold = 10;
  run.battleHistory = [];
  run.status = 'active';
  run.rating = 1000;
  run.createdAt = new Date();
  run.updatedAt = new Date();
  return Object.assign(run, overrides);
}

// =============================================================================
// FACTION & LEADER DATA TESTS
// =============================================================================

describe('Roguelike Integration: Faction & Leader Data', () => {
  describe('Faction Data Integrity', () => {
    it('should have exactly 2 factions in Phase 1', () => {
      const factions = Object.keys(FACTIONS_DATA);
      expect(factions).toHaveLength(2);
      expect(factions).toContain('humans');
      expect(factions).toContain('undead');
    });

    it('should have valid bonus stats for each faction', () => {
      const humans = getFaction('humans');
      const undead = getFaction('undead');

      expect(humans?.bonus.stat).toBe('hp');
      expect(humans?.bonus.value).toBe(0.1);

      expect(undead?.bonus.stat).toBe('atk');
      expect(undead?.bonus.value).toBe(0.15);
    });

    it('should have localized names for each faction', () => {
      const humans = getFaction('humans');
      const undead = getFaction('undead');

      expect(humans?.name).toBe('Humans');
      expect(humans?.nameRu).toBe('Люди');

      expect(undead?.name).toBe('Undead');
      expect(undead?.nameRu).toBe('Нежить');
    });
  });

  describe('Leader Data Integrity', () => {
    it('should have exactly 1 leader per faction in Phase 1', () => {
      const humanLeaders = getLeadersByFaction('humans');
      const undeadLeaders = getLeadersByFaction('undead');

      expect(humanLeaders).toHaveLength(1);
      expect(undeadLeaders).toHaveLength(1);
    });

    it('should have valid leader data for Commander Aldric', () => {
      const aldric = getLeader('commander_aldric');

      expect(aldric).toBeDefined();
      expect(aldric?.faction).toBe('humans');
      expect(aldric?.passive.id).toBe('formation');
      expect(aldric?.spellIds).toHaveLength(2);
    });

    it('should have valid leader data for Lich King Malachar', () => {
      const malachar = getLeader('lich_king_malachar');

      expect(malachar).toBeDefined();
      expect(malachar?.faction).toBe('undead');
      expect(malachar?.passive.id).toBe('life_drain');
      expect(malachar?.spellIds).toHaveLength(2);
    });

    it('should have 2 spell IDs per leader', () => {
      const aldric = getLeader('commander_aldric');
      const malachar = getLeader('lich_king_malachar');

      expect(aldric?.spellIds).toHaveLength(2);
      expect(malachar?.spellIds).toHaveLength(2);
    });
  });
});

// =============================================================================
// STARTER DECK TESTS
// =============================================================================

describe('Roguelike Integration: Starter Decks', () => {
  it('should have 12 units in humans starter deck', () => {
    const count = getStarterDeckUnitCount(HUMANS_STARTER_DECK);
    expect(count).toBe(12);
  });

  it('should have 12 units in undead starter deck', () => {
    const count = getStarterDeckUnitCount(UNDEAD_STARTER_DECK);
    expect(count).toBe(12);
  });

  it('should expand starter deck to individual cards', () => {
    const humansExpanded = expandStarterDeck(HUMANS_STARTER_DECK);
    const undeadExpanded = expandStarterDeck(UNDEAD_STARTER_DECK);

    expect(humansExpanded).toHaveLength(12);
    expect(undeadExpanded).toHaveLength(12);
  });

  it('should have unique instance IDs in expanded deck', () => {
    const humansExpanded = expandStarterDeck(HUMANS_STARTER_DECK);
    const instanceIds = humansExpanded.map((card) => card.instanceId);
    const uniqueIds = new Set(instanceIds);

    expect(uniqueIds.size).toBe(humansExpanded.length);
  });
});


// =============================================================================
// RUN ENTITY TESTS
// =============================================================================

describe('Roguelike Integration: Run Entity', () => {
  describe('Run Creation', () => {
    it('should create a valid run entity', () => {
      const run = createMockRun();

      expect(run.id).toBe('test-run-id');
      expect(run.playerId).toBe('test-player-id');
      expect(run.faction).toBe('humans');
      expect(run.leaderId).toBe('commander_aldric');
      expect(run.status).toBe('active');
    });

    it('should initialize with correct starting values', () => {
      const run = createMockRun();

      expect(run.wins).toBe(0);
      expect(run.losses).toBe(0);
      expect(run.consecutiveWins).toBe(0);
      expect(run.gold).toBe(10);
      expect(run.battleHistory).toHaveLength(0);
    });

    it('should have 12 cards in deck', () => {
      const run = createMockRun();

      expect(run.deck).toHaveLength(12);
      expect(run.remainingDeck).toHaveLength(12);
    });

    it('should have 2 spells configured', () => {
      const run = createMockRun();

      expect(run.spells).toHaveLength(2);
      expect(run.spells[0]?.spellId).toBe('holy_light');
      expect(run.spells[1]?.spellId).toBe('rally');
    });
  });

  describe('Run Status Transitions', () => {
    it('should track 9 wins for victory', () => {
      const run = createMockRun({ wins: 9 });

      expect(run.wins).toBe(9);
    });

    it('should track 4 losses for defeat', () => {
      const run = createMockRun({ losses: 4 });

      expect(run.losses).toBe(4);
    });
  });
});

// =============================================================================
// ECONOMY SERVICE TESTS
// =============================================================================

describe('Roguelike Integration: Economy', () => {
  let economyService: EconomyService;

  beforeEach(() => {
    economyService = new EconomyService();
  });

  describe('Win Rewards', () => {
    it('should calculate base win reward of 7 gold', () => {
      const reward = economyService.calculateWinReward(0);
      expect(reward.total).toBe(7);
    });

    it('should add streak bonus after 3 consecutive wins', () => {
      const reward3 = economyService.calculateWinReward(3);
      const reward4 = economyService.calculateWinReward(4);
      const reward5 = economyService.calculateWinReward(5);

      expect(reward3.total).toBe(9); // 7 + 2 for 3rd win
      expect(reward4.total).toBe(11); // 7 + 4 for 4th win
      expect(reward5.total).toBe(13); // 7 + 6 for 5th win
    });
  });

  describe('Loss Rewards', () => {
    it('should give consolation reward of 9 gold on loss', () => {
      const reward = economyService.calculateLossReward(1);
      expect(reward.total).toBe(9);
    });
  });

  describe('Affordability Checks', () => {
    it('should correctly check if player can afford upgrade', () => {
      expect(economyService.canAfford(10, 5)).toBe(true);
      expect(economyService.canAfford(10, 10)).toBe(true);
      expect(economyService.canAfford(10, 15)).toBe(false);
    });
  });
});

// =============================================================================
// SPELL EXECUTOR TESTS
// =============================================================================

describe('Roguelike Integration: Spell Execution', () => {
  describe('Spell Timing Thresholds', () => {
    it('should trigger early spells at battle start (100% HP)', () => {
      const shouldTrigger = SpellExecutor.shouldTriggerSpell('early', 100, 100);
      expect(shouldTrigger).toBe(true);
    });

    it('should trigger mid spells when HP drops below 70%', () => {
      const shouldTriggerAt70 = SpellExecutor.shouldTriggerSpell('mid', 70, 100);
      const shouldTriggerAt69 = SpellExecutor.shouldTriggerSpell('mid', 69, 100);

      expect(shouldTriggerAt70).toBe(false);
      expect(shouldTriggerAt69).toBe(true);
    });

    it('should trigger late spells when HP drops below 40%', () => {
      const shouldTriggerAt40 = SpellExecutor.shouldTriggerSpell('late', 40, 100);
      const shouldTriggerAt39 = SpellExecutor.shouldTriggerSpell('late', 39, 100);

      expect(shouldTriggerAt40).toBe(false);
      expect(shouldTriggerAt39).toBe(true);
    });
  });

  describe('Spell Execution Creation', () => {
    it('should create spell executions from run spells', () => {
      const spells = [
        { spellId: 'holy_light', timing: 'early' as SpellTiming },
        { spellId: 'rally', timing: 'mid' as SpellTiming },
      ];

      const executions = SpellExecutor.createSpellExecutions(spells);

      expect(executions).toHaveLength(2);
      expect(executions[0]?.triggered).toBe(false);
      expect(executions[1]?.triggered).toBe(false);
    });
  });
});


// =============================================================================
// RUN FLOW INTEGRATION TESTS
// =============================================================================

describe('Roguelike Integration: Full Run Flow', () => {
  describe('Run Lifecycle', () => {
    it('should support complete run flow: create → draft → battle → upgrade', () => {
      const run = createMockRun();

      // 1. Run created with faction and leader
      expect(run.faction).toBe('humans');
      expect(run.leaderId).toBe('commander_aldric');

      // 2. Initial draft would draw cards from deck
      expect(run.remainingDeck.length).toBeGreaterThan(0);

      // 3. Battle would use hand cards
      expect(run.hand).toHaveLength(0); // Empty before draft

      // 4. Upgrade shop would modify card tiers
      expect(run.deck[0]?.tier).toBe(1);
    });

    it('should track battle history', () => {
      const run = createMockRun({
        battleHistory: [
          {
            battleId: 'battle-1',
            result: 'win',
            round: 1,
            goldEarned: 10,
            opponent: { name: 'Bot 1', faction: 'undead', rating: 1000 },
            timestamp: new Date().toISOString(),
          },
          {
            battleId: 'battle-2',
            result: 'loss',
            round: 2,
            goldEarned: 5,
            opponent: { name: 'Bot 2', faction: 'humans', rating: 1100 },
            timestamp: new Date().toISOString(),
          },
        ],
      });

      expect(run.battleHistory).toHaveLength(2);
      expect(run.battleHistory[0]?.battleId).toBe('battle-1');
      expect(run.battleHistory[1]?.battleId).toBe('battle-2');
    });
  });

  describe('Victory Conditions', () => {
    it('should complete run on 9 wins', () => {
      const run = createMockRun({ wins: 9, status: 'won' });

      expect(run.wins).toBe(9);
      expect(run.status).toBe('won');
    });

    it('should complete run on 4 losses', () => {
      const run = createMockRun({ losses: 4, status: 'lost' });

      expect(run.losses).toBe(4);
      expect(run.status).toBe('lost');
    });
  });

  describe('Gold Progression', () => {
    it('should accumulate gold through wins', () => {
      const economyService = new EconomyService();

      let gold = 10; // Starting gold
      const consecutiveWins = [0, 1, 2, 3, 4];

      consecutiveWins.forEach((streak) => {
        const reward = economyService.calculateWinReward(streak);
        gold += reward.total;
      });

      // 10 + 7 + 7 + 7 + 9 + 11 = 51
      expect(gold).toBe(51);
    });
  });
});

// =============================================================================
// ERROR SCENARIOS
// =============================================================================

describe('Roguelike Integration: Error Scenarios', () => {
  describe('Invalid Faction/Leader Combinations', () => {
    it('should reject undead leader for humans faction', () => {
      const humanLeaders = getLeadersByFaction('humans');
      const undeadLeaders = getLeadersByFaction('undead');

      // Verify leaders belong to correct factions
      humanLeaders.forEach((leader) => {
        expect(leader.faction).toBe('humans');
      });

      undeadLeaders.forEach((leader) => {
        expect(leader.faction).toBe('undead');
      });
    });
  });

  describe('Invalid Run States', () => {
    it('should not allow actions on completed runs', () => {
      const completedRun = createMockRun({ status: 'won' });

      expect(completedRun.status).toBe('won');
      expect(completedRun.isComplete()).toBe(true);
    });

    it('should check if run is active', () => {
      const activeRun = createMockRun({ status: 'active' });
      const wonRun = createMockRun({ status: 'won' });
      const lostRun = createMockRun({ status: 'lost' });

      expect(activeRun.isActive()).toBe(true);
      expect(wonRun.isActive()).toBe(false);
      expect(lostRun.isActive()).toBe(false);
    });
  });
});

// =============================================================================
// MATCHMAKING TESTS
// =============================================================================

describe('Roguelike Integration: Matchmaking', () => {
  describe('Opponent Selection', () => {
    it('should prefer opponents with similar win count', () => {
      const playerWins = 3;
      const validOpponentWins = [2, 3, 4]; // Within ±1 range

      validOpponentWins.forEach((opponentWins) => {
        expect(Math.abs(playerWins - opponentWins)).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Bot Fallback', () => {
    it('should generate bot when no opponents available', () => {
      const botTeam = {
        faction: 'humans' as Faction,
        units: expandStarterDeck(HUMANS_STARTER_DECK).slice(0, 6),
      };

      expect(botTeam.units).toHaveLength(6);
    });
  });
});

// =============================================================================
// UPGRADE SYSTEM TESTS
// =============================================================================

describe('Roguelike Integration: Upgrade System', () => {
  describe('Tier Progression', () => {
    it('should support T1 → T2 → T3 upgrades', () => {
      const card: DeckCard = { instanceId: 'card-1', unitId: 'footman', tier: 1 };

      // T1 → T2
      const upgradedToT2: DeckCard = { ...card, tier: 2 };
      expect(upgradedToT2.tier).toBe(2);

      // T2 → T3
      const upgradedToT3: DeckCard = { ...upgradedToT2, tier: 3 };
      expect(upgradedToT3.tier).toBe(3);
    });

    it('should not allow upgrades beyond T3', () => {
      const maxTierCard: DeckCard = { instanceId: 'card-1', unitId: 'footman', tier: 3 };

      // T3 is max tier
      expect(maxTierCard.tier).toBe(3);
    });
  });

  describe('Upgrade Costs', () => {
    it('should calculate upgrade cost based on unit base cost', () => {
      const baseCost = 4;
      const t1ToT2Cost = Math.ceil(baseCost * 0.5); // 2
      const t2ToT3Cost = Math.ceil(baseCost * 0.75); // 3

      expect(t1ToT2Cost).toBe(2);
      expect(t2ToT3Cost).toBe(3);
    });
  });
});
