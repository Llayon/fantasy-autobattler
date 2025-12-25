/**
 * Unit tests for RoguelikeSnapshotEntity
 *
 * @module roguelike/entities/snapshot.spec
 */

import {
  RoguelikeSnapshotEntity,
  PlacedUnit,
  SpellTimingConfig,
  SNAPSHOT_CONSTANTS,
} from './snapshot.entity';

describe('RoguelikeSnapshotEntity', () => {
  /**
   * Creates a valid snapshot entity for testing.
   */
  function createValidSnapshot(): RoguelikeSnapshotEntity {
    const snapshot = new RoguelikeSnapshotEntity();
    snapshot.runId = '550e8400-e29b-41d4-a716-446655440001';
    snapshot.playerId = '550e8400-e29b-41d4-a716-446655440000';
    snapshot.wins = 3;
    snapshot.rating = 1050;
    snapshot.team = createTeam();
    snapshot.spellTimings = createSpellTimings();
    snapshot.faction = 'humans';
    snapshot.leaderId = 'commander_aldric';
    return snapshot;
  }

  /**
   * Creates a sample team for testing.
   */
  function createTeam(): PlacedUnit[] {
    return [
      { unitId: 'footman', tier: 1, position: { x: 0, y: 0 } },
      { unitId: 'knight', tier: 2, position: { x: 1, y: 0 } },
      { unitId: 'archer', tier: 1, position: { x: 2, y: 1 } },
    ];
  }

  /**
   * Creates sample spell timings for testing.
   */
  function createSpellTimings(): SpellTimingConfig[] {
    return [
      { spellId: 'holy_light', timing: 'mid' },
      { spellId: 'rally', timing: 'early' },
    ];
  }

  describe('SNAPSHOT_CONSTANTS', () => {
    it('should have correct values', () => {
      expect(SNAPSHOT_CONSTANTS.MAX_MATCHMAKING_CANDIDATES).toBe(100);
      expect(SNAPSHOT_CONSTANTS.RATING_RANGE).toBe(200);
      expect(SNAPSHOT_CONSTANTS.WIN_RANGE).toBe(1);
    });
  });

  describe('validateSnapshot', () => {
    describe('team validation', () => {
      it('should accept valid team', () => {
        const snapshot = createValidSnapshot();
        expect(() => snapshot.validateSnapshot()).not.toThrow();
      });

      it('should reject non-array team', () => {
        const snapshot = createValidSnapshot();
        snapshot.team = 'invalid' as unknown as PlacedUnit[];
        expect(() => snapshot.validateSnapshot()).toThrow('Team must be an array');
      });

      it('should reject empty team', () => {
        const snapshot = createValidSnapshot();
        snapshot.team = [];
        expect(() => snapshot.validateSnapshot()).toThrow('Team must have at least one unit');
      });

      it('should reject unit without unitId', () => {
        const snapshot = createValidSnapshot();
        snapshot.team = [{ unitId: '', tier: 1, position: { x: 0, y: 0 } }];
        expect(() => snapshot.validateSnapshot()).toThrow('must have a valid unitId');
      });

      it('should reject unit with invalid tier', () => {
        const snapshot = createValidSnapshot();
        snapshot.team = [{ unitId: 'footman', tier: 4 as 1 | 2 | 3, position: { x: 0, y: 0 } }];
        expect(() => snapshot.validateSnapshot()).toThrow('must have tier 1, 2, or 3');
      });

      it('should reject unit without position', () => {
        const snapshot = createValidSnapshot();
        snapshot.team = [{ unitId: 'footman', tier: 1, position: undefined as unknown as { x: number; y: number } }];
        expect(() => snapshot.validateSnapshot()).toThrow('must have valid position');
      });

      it('should reject duplicate positions', () => {
        const snapshot = createValidSnapshot();
        snapshot.team = [
          { unitId: 'footman', tier: 1, position: { x: 0, y: 0 } },
          { unitId: 'knight', tier: 2, position: { x: 0, y: 0 } },
        ];
        expect(() => snapshot.validateSnapshot()).toThrow('cannot have units in duplicate positions');
      });
    });

    describe('spell timings validation', () => {
      it('should accept valid spell timings', () => {
        const snapshot = createValidSnapshot();
        expect(() => snapshot.validateSnapshot()).not.toThrow();
      });

      it('should reject non-array spell timings', () => {
        const snapshot = createValidSnapshot();
        snapshot.spellTimings = 'invalid' as unknown as SpellTimingConfig[];
        expect(() => snapshot.validateSnapshot()).toThrow('Spell timings must be an array');
      });

      it('should reject spell timing without spellId', () => {
        const snapshot = createValidSnapshot();
        snapshot.spellTimings = [{ spellId: '', timing: 'mid' }];
        expect(() => snapshot.validateSnapshot()).toThrow('must have a valid spellId');
      });

      it('should reject invalid timing value', () => {
        const snapshot = createValidSnapshot();
        snapshot.spellTimings = [{ spellId: 'holy_light', timing: 'invalid' as 'early' | 'mid' | 'late' }];
        expect(() => snapshot.validateSnapshot()).toThrow('must be early, mid, or late');
      });

      it('should accept all valid timing values', () => {
        const snapshot = createValidSnapshot();
        snapshot.spellTimings = [
          { spellId: 'spell1', timing: 'early' },
          { spellId: 'spell2', timing: 'mid' },
          { spellId: 'spell3', timing: 'late' },
        ];
        expect(() => snapshot.validateSnapshot()).not.toThrow();
      });
    });

    describe('wins and rating validation', () => {
      it('should accept valid wins (0-9)', () => {
        const snapshot = createValidSnapshot();
        snapshot.wins = 5;
        expect(() => snapshot.validateSnapshot()).not.toThrow();
      });

      it('should reject negative wins', () => {
        const snapshot = createValidSnapshot();
        snapshot.wins = -1;
        expect(() => snapshot.validateSnapshot()).toThrow('Wins must be between 0 and 9');
      });

      it('should reject wins > 9', () => {
        const snapshot = createValidSnapshot();
        snapshot.wins = 10;
        expect(() => snapshot.validateSnapshot()).toThrow('Wins must be between 0 and 9');
      });

      it('should accept positive rating', () => {
        const snapshot = createValidSnapshot();
        snapshot.rating = 1500;
        expect(() => snapshot.validateSnapshot()).not.toThrow();
      });

      it('should accept zero rating', () => {
        const snapshot = createValidSnapshot();
        snapshot.rating = 0;
        expect(() => snapshot.validateSnapshot()).not.toThrow();
      });

      it('should reject negative rating', () => {
        const snapshot = createValidSnapshot();
        snapshot.rating = -100;
        expect(() => snapshot.validateSnapshot()).toThrow('Rating cannot be negative');
      });
    });
  });

  describe('getTeamStrength', () => {
    it('should calculate team strength as sum of tiers', () => {
      const snapshot = createValidSnapshot();
      snapshot.team = [
        { unitId: 'unit1', tier: 1, position: { x: 0, y: 0 } },
        { unitId: 'unit2', tier: 2, position: { x: 1, y: 0 } },
        { unitId: 'unit3', tier: 3, position: { x: 2, y: 0 } },
      ];
      expect(snapshot.getTeamStrength()).toBe(6); // 1 + 2 + 3
    });

    it('should return 0 for empty team', () => {
      const snapshot = createValidSnapshot();
      snapshot.team = [];
      expect(snapshot.getTeamStrength()).toBe(0);
    });

    it('should handle all T1 units', () => {
      const snapshot = createValidSnapshot();
      snapshot.team = [
        { unitId: 'unit1', tier: 1, position: { x: 0, y: 0 } },
        { unitId: 'unit2', tier: 1, position: { x: 1, y: 0 } },
        { unitId: 'unit3', tier: 1, position: { x: 2, y: 0 } },
      ];
      expect(snapshot.getTeamStrength()).toBe(3);
    });
  });

  describe('getSummary', () => {
    it('should return correct summary', () => {
      const snapshot = createValidSnapshot();
      snapshot.id = 'test-snapshot-id';
      snapshot.wins = 5;
      snapshot.rating = 1200;
      snapshot.faction = 'undead';
      snapshot.team = [
        { unitId: 'unit1', tier: 1, position: { x: 0, y: 0 } },
        { unitId: 'unit2', tier: 2, position: { x: 1, y: 0 } },
      ];

      const summary = snapshot.getSummary();

      expect(summary.id).toBe('test-snapshot-id');
      expect(summary.wins).toBe(5);
      expect(summary.rating).toBe(1200);
      expect(summary.faction).toBe('undead');
      expect(summary.teamSize).toBe(2);
      expect(summary.teamStrength).toBe(3); // 1 + 2
    });
  });
});
