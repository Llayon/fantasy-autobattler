/**
 * Test suite for BattleLog entity.
 * Tests entity methods, relationships, and business logic.
 */

import { BattleLog, BattleStatus, BattleWinner } from './battle-log.entity';
import { BattleEvent } from '../types/game.types';
import { TeamSetup } from '../battle/battle.simulator';

describe('BattleLog Entity', () => {
  let battleLog: BattleLog;

  // Test data
  const mockPlayer1TeamSnapshot: TeamSetup = {
    units: [
      { 
        id: 'knight', 
        name: 'Knight', 
        role: 'tank', 
        cost: 5, 
        stats: { hp: 100, atk: 15, atkCount: 1, armor: 8, speed: 1, initiative: 3, dodge: 5 },
        range: 1,
        abilities: []
      },
      { 
        id: 'mage', 
        name: 'Mage', 
        role: 'mage', 
        cost: 4, 
        stats: { hp: 60, atk: 25, atkCount: 1, armor: 2, speed: 2, initiative: 5, dodge: 10 },
        range: 3,
        abilities: []
      },
    ],
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  };

  const mockPlayer2TeamSnapshot: TeamSetup = {
    units: [
      { 
        id: 'archer', 
        name: 'Archer', 
        role: 'ranged_dps', 
        cost: 4, 
        stats: { hp: 70, atk: 20, atkCount: 1, armor: 3, speed: 2, initiative: 6, dodge: 15 },
        range: 4,
        abilities: []
      },
      { 
        id: 'rogue', 
        name: 'Rogue', 
        role: 'melee_dps', 
        cost: 5, 
        stats: { hp: 80, atk: 18, atkCount: 2, armor: 4, speed: 3, initiative: 8, dodge: 25 },
        range: 1,
        abilities: []
      },
    ],
    positions: [
      { x: 0, y: 8 },
      { x: 1, y: 8 },
    ],
  };

  const mockBattleEvents: BattleEvent[] = [
    {
      round: 1,
      type: 'move',
      actorId: 'unit-1',
      fromPosition: { x: 0, y: 0 },
      toPosition: { x: 0, y: 1 },
    },
    {
      round: 1,
      type: 'attack',
      actorId: 'unit-1',
      targetId: 'unit-2',
      damage: 15,
    },
  ];

  beforeEach(() => {
    battleLog = new BattleLog();
    battleLog.id = 'battle-123';
    battleLog.player1Id = 'player-123';
    battleLog.player2Id = 'player-456';
    battleLog.player1TeamSnapshot = mockPlayer1TeamSnapshot;
    battleLog.player2TeamSnapshot = mockPlayer2TeamSnapshot;
    battleLog.seed = 12345;
    battleLog.status = BattleStatus.PENDING;
    battleLog.viewedByPlayer1 = false;
    battleLog.viewedByPlayer2 = false;
    battleLog.createdAt = new Date();
    battleLog.updatedAt = new Date();
  });

  describe('Entity Properties', () => {
    it('should have all required properties', () => {
      expect(battleLog.id).toBe('battle-123');
      expect(battleLog.player1Id).toBe('player-123');
      expect(battleLog.player2Id).toBe('player-456');
      expect(battleLog.player1TeamSnapshot).toEqual(mockPlayer1TeamSnapshot);
      expect(battleLog.player2TeamSnapshot).toEqual(mockPlayer2TeamSnapshot);
      expect(battleLog.seed).toBe(12345);
      expect(battleLog.status).toBe(BattleStatus.PENDING);
      expect(battleLog.viewedByPlayer1).toBe(false);
      expect(battleLog.viewedByPlayer2).toBe(false);
    });

    it('should have proper default values', () => {
      const newBattle = new BattleLog();
      // Note: These would be set by TypeORM decorators in actual usage
      expect(newBattle.viewedByPlayer1).toBeUndefined(); // Will be false when saved
      expect(newBattle.viewedByPlayer2).toBeUndefined(); // Will be false when saved
    });
  });

  describe('isCompleted', () => {
    it('should return false for pending battle', () => {
      battleLog.status = BattleStatus.PENDING;
      expect(battleLog.isCompleted()).toBe(false);
    });

    it('should return true for simulated battle', () => {
      battleLog.status = BattleStatus.SIMULATED;
      expect(battleLog.isCompleted()).toBe(true);
    });

    it('should return true for viewed battle', () => {
      battleLog.status = BattleStatus.VIEWED;
      expect(battleLog.isCompleted()).toBe(true);
    });
  });

  describe('isViewedByBoth', () => {
    it('should return false when neither player has viewed', () => {
      battleLog.viewedByPlayer1 = false;
      battleLog.viewedByPlayer2 = false;
      expect(battleLog.isViewedByBoth()).toBe(false);
    });

    it('should return false when only player1 has viewed', () => {
      battleLog.viewedByPlayer1 = true;
      battleLog.viewedByPlayer2 = false;
      expect(battleLog.isViewedByBoth()).toBe(false);
    });

    it('should return false when only player2 has viewed', () => {
      battleLog.viewedByPlayer1 = false;
      battleLog.viewedByPlayer2 = true;
      expect(battleLog.isViewedByBoth()).toBe(false);
    });

    it('should return true when both players have viewed', () => {
      battleLog.viewedByPlayer1 = true;
      battleLog.viewedByPlayer2 = true;
      expect(battleLog.isViewedByBoth()).toBe(true);
    });
  });

  describe('markAsViewed', () => {
    beforeEach(() => {
      battleLog.status = BattleStatus.SIMULATED;
      battleLog.viewedByPlayer1 = false;
      battleLog.viewedByPlayer2 = false;
    });

    it('should mark player1 as viewed', () => {
      battleLog.markAsViewed('player-123');
      
      expect(battleLog.viewedByPlayer1).toBe(true);
      expect(battleLog.viewedByPlayer2).toBe(false);
      expect(battleLog.status).toBe(BattleStatus.VIEWED);
    });

    it('should mark player2 as viewed', () => {
      battleLog.markAsViewed('player-456');
      
      expect(battleLog.viewedByPlayer1).toBe(false);
      expect(battleLog.viewedByPlayer2).toBe(true);
      expect(battleLog.status).toBe(BattleStatus.VIEWED);
    });

    it('should not change status if already viewed', () => {
      battleLog.status = BattleStatus.VIEWED;
      battleLog.markAsViewed('player-123');
      
      expect(battleLog.status).toBe(BattleStatus.VIEWED);
    });

    it('should not mark unknown player as viewed', () => {
      battleLog.markAsViewed('unknown-player');
      
      expect(battleLog.viewedByPlayer1).toBe(false);
      expect(battleLog.viewedByPlayer2).toBe(false);
      expect(battleLog.status).toBe(BattleStatus.VIEWED); // Status still changes
    });

    it('should not change status from pending', () => {
      battleLog.status = BattleStatus.PENDING;
      battleLog.markAsViewed('player-123');
      
      expect(battleLog.viewedByPlayer1).toBe(true);
      expect(battleLog.status).toBe(BattleStatus.PENDING);
    });
  });

  describe('isParticipant', () => {
    it('should return true for player1', () => {
      expect(battleLog.isParticipant('player-123')).toBe(true);
    });

    it('should return true for player2', () => {
      expect(battleLog.isParticipant('player-456')).toBe(true);
    });

    it('should return false for non-participant', () => {
      expect(battleLog.isParticipant('other-player')).toBe(false);
    });
  });

  describe('getOpponentId', () => {
    it('should return player2 ID when given player1 ID', () => {
      expect(battleLog.getOpponentId('player-123')).toBe('player-456');
    });

    it('should return player1 ID when given player2 ID', () => {
      expect(battleLog.getOpponentId('player-456')).toBe('player-123');
    });

    it('should return null for non-participant', () => {
      expect(battleLog.getOpponentId('other-player')).toBeNull();
    });
  });

  describe('getSummary', () => {
    it('should return complete battle summary', () => {
      battleLog.winner = 'player1';
      battleLog.rounds = 5;
      battleLog.viewedByPlayer1 = true;
      battleLog.viewedByPlayer2 = false;

      const summary = battleLog.getSummary();

      expect(summary).toEqual({
        id: 'battle-123',
        player1Id: 'player-123',
        player2Id: 'player-456',
        status: BattleStatus.PENDING,
        winner: 'player1',
        rounds: 5,
        createdAt: battleLog.createdAt,
        viewedByPlayer1: true,
        viewedByPlayer2: false,
      });
    });

    it('should handle undefined optional fields', () => {
      const summary = battleLog.getSummary();

      expect(summary.winner).toBeUndefined();
      expect(summary.rounds).toBeUndefined();
    });
  });

  describe('Battle Status Enum', () => {
    it('should have correct enum values', () => {
      expect(BattleStatus.PENDING).toBe('pending');
      expect(BattleStatus.SIMULATED).toBe('simulated');
      expect(BattleStatus.VIEWED).toBe('viewed');
    });
  });

  describe('Battle Winner Type', () => {
    it('should accept valid winner values', () => {
      const winners: BattleWinner[] = ['player1', 'player2', 'draw'];
      
      winners.forEach(winner => {
        battleLog.winner = winner;
        expect(battleLog.winner).toBe(winner);
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete battle lifecycle', () => {
      // Start with pending battle
      expect(battleLog.isCompleted()).toBe(false);
      expect(battleLog.isViewedByBoth()).toBe(false);

      // Simulate battle
      battleLog.status = BattleStatus.SIMULATED;
      battleLog.events = mockBattleEvents;
      battleLog.winner = 'player1';
      battleLog.rounds = 3;

      expect(battleLog.isCompleted()).toBe(true);
      expect(battleLog.isViewedByBoth()).toBe(false);

      // Player1 views battle
      battleLog.markAsViewed('player-123');
      expect(battleLog.status).toBe(BattleStatus.VIEWED);
      expect(battleLog.viewedByPlayer1).toBe(true);
      expect(battleLog.isViewedByBoth()).toBe(false);

      // Player2 views battle
      battleLog.markAsViewed('player-456');
      expect(battleLog.viewedByPlayer2).toBe(true);
      expect(battleLog.isViewedByBoth()).toBe(true);
    });

    it('should maintain data integrity with team snapshots', () => {
      // Verify team snapshots are preserved
      expect(battleLog.player1TeamSnapshot.units).toHaveLength(2);
      expect(battleLog.player2TeamSnapshot.units).toHaveLength(2);
      
      // Verify specific unit data
      expect(battleLog.player1TeamSnapshot.units[0]?.id).toBe('knight');
      expect(battleLog.player2TeamSnapshot.units[0]?.id).toBe('archer');
    });
  });
});