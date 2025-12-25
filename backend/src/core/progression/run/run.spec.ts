/**
 * Run System Tests
 *
 * Unit tests and property-based tests for run operations.
 *
 * @module core/progression/run/spec
 */

import * as fc from 'fast-check';
import {
  createRun,
  recordWin,
  recordLoss,
  advancePhase,
  getCurrentPhase,
  isRunComplete,
  getRunResult,
  getRunStats,
  updateRunState,
} from './run';
import { RunConfig } from './run.types';
import {
  ROGUELIKE_RUN_CONFIG,
  BOSS_RUSH_RUN_CONFIG,
  ENDLESS_RUN_CONFIG,
} from './run.presets';
import { arbitraryRunConfig } from '../test-generators';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

interface TestState {
  gold: number;
  deck: string[];
}

const defaultState: TestState = {
  gold: 10,
  deck: ['card1', 'card2', 'card3'],
};

const simpleConfig: RunConfig = {
  winsToComplete: 3,
  maxLosses: 2,
  phases: ['battle', 'shop'],
  trackStreaks: true,
  enableRating: true,
};

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════

describe('Run System', () => {
  describe('createRun', () => {
    it('should create run with initial state', () => {
      const run = createRun(simpleConfig, defaultState);

      expect(run.id).toMatch(/^run_/);
      expect(run.config).toBe(simpleConfig);
      expect(run.wins).toBe(0);
      expect(run.losses).toBe(0);
      expect(run.currentPhaseIndex).toBe(0);
      expect(run.winStreak).toBe(0);
      expect(run.loseStreak).toBe(0);
      expect(run.status).toBe('active');
      expect(run.state).toEqual(defaultState);
      expect(run.history).toEqual([]);
    });

    it('should create run with ROGUELIKE_RUN_CONFIG', () => {
      const run = createRun(ROGUELIKE_RUN_CONFIG, {});

      expect(run.config.winsToComplete).toBe(9);
      expect(run.config.maxLosses).toBe(4);
      expect(run.config.phases).toEqual(['draft', 'battle', 'shop']);
    });

    it('should throw on invalid winsToComplete', () => {
      const invalidConfig = { ...simpleConfig, winsToComplete: 0 };
      expect(() => createRun(invalidConfig, {})).toThrow('winsToComplete must be at least 1');
    });

    it('should throw on invalid maxLosses', () => {
      const invalidConfig = { ...simpleConfig, maxLosses: 0 };
      expect(() => createRun(invalidConfig, {})).toThrow('maxLosses must be at least 1');
    });

    it('should throw on empty phases', () => {
      const invalidConfig = { ...simpleConfig, phases: [] };
      expect(() => createRun(invalidConfig, {})).toThrow('phases must not be empty');
    });
  });

  describe('recordWin', () => {
    it('should increment wins and winStreak', () => {
      const run = createRun(simpleConfig, defaultState);
      const updated = recordWin(run);

      expect(updated.wins).toBe(1);
      expect(updated.winStreak).toBe(1);
      expect(updated.loseStreak).toBe(0);
      expect(updated.status).toBe('active');
    });

    it('should reset loseStreak on win', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordLoss(run);
      run = recordWin(run);

      expect(run.winStreak).toBe(1);
      expect(run.loseStreak).toBe(0);
    });

    it('should set status to won when winsToComplete reached', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordWin(run);
      run = recordWin(run);

      expect(run.wins).toBe(3);
      expect(run.status).toBe('won');
    });

    it('should add win event to history', () => {
      const run = createRun(simpleConfig, defaultState);
      const updated = recordWin(run, 1000);

      expect(updated.history).toHaveLength(1);
      expect(updated.history[0]).toEqual({ type: 'win', timestamp: 1000 });
    });

    it('should throw when run is already complete', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordWin(run);
      run = recordWin(run);

      expect(() => recordWin(run)).toThrow('Cannot record win: run is won');
    });

    it('should not mutate original run', () => {
      const run = createRun(simpleConfig, defaultState);
      recordWin(run);

      expect(run.wins).toBe(0);
    });
  });

  describe('recordLoss', () => {
    it('should increment losses and loseStreak', () => {
      const run = createRun(simpleConfig, defaultState);
      const updated = recordLoss(run);

      expect(updated.losses).toBe(1);
      expect(updated.loseStreak).toBe(1);
      expect(updated.winStreak).toBe(0);
      expect(updated.status).toBe('active');
    });

    it('should reset winStreak on loss', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordLoss(run);

      expect(run.winStreak).toBe(0);
      expect(run.loseStreak).toBe(1);
    });

    it('should set status to lost when maxLosses reached', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordLoss(run);
      run = recordLoss(run);

      expect(run.losses).toBe(2);
      expect(run.status).toBe('lost');
    });

    it('should add loss event to history', () => {
      const run = createRun(simpleConfig, defaultState);
      const updated = recordLoss(run, 2000);

      expect(updated.history).toHaveLength(1);
      expect(updated.history[0]).toEqual({ type: 'loss', timestamp: 2000 });
    });

    it('should throw when run is already complete', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordLoss(run);
      run = recordLoss(run);

      expect(() => recordLoss(run)).toThrow('Cannot record loss: run is lost');
    });
  });

  describe('advancePhase', () => {
    it('should advance to next phase', () => {
      const run = createRun(simpleConfig, defaultState);
      expect(getCurrentPhase(run)).toBe('battle');

      const updated = advancePhase(run);
      expect(getCurrentPhase(updated)).toBe('shop');
    });

    it('should cycle back to first phase', () => {
      let run = createRun(simpleConfig, defaultState);
      run = advancePhase(run); // battle -> shop
      run = advancePhase(run); // shop -> battle

      expect(getCurrentPhase(run)).toBe('battle');
      expect(run.currentPhaseIndex).toBe(0);
    });

    it('should add phase_change event to history', () => {
      const run = createRun(simpleConfig, defaultState);
      const updated = advancePhase(run, 3000);

      expect(updated.history).toHaveLength(1);
      expect(updated.history[0]).toEqual({
        type: 'phase_change',
        timestamp: 3000,
        data: { phase: 'shop' },
      });
    });

    it('should throw when run is complete', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordWin(run);
      run = recordWin(run);

      expect(() => advancePhase(run)).toThrow('Cannot advance phase: run is won');
    });
  });

  describe('getCurrentPhase', () => {
    it('should return current phase', () => {
      const run = createRun(ROGUELIKE_RUN_CONFIG, {});
      expect(getCurrentPhase(run)).toBe('draft');
    });

    it('should return correct phase after advances', () => {
      let run = createRun(ROGUELIKE_RUN_CONFIG, {});
      run = advancePhase(run);
      expect(getCurrentPhase(run)).toBe('battle');

      run = advancePhase(run);
      expect(getCurrentPhase(run)).toBe('shop');

      run = advancePhase(run);
      expect(getCurrentPhase(run)).toBe('draft');
    });
  });

  describe('isRunComplete', () => {
    it('should return false for active run', () => {
      const run = createRun(simpleConfig, defaultState);
      expect(isRunComplete(run)).toBe(false);
    });

    it('should return true for won run', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordWin(run);
      run = recordWin(run);

      expect(isRunComplete(run)).toBe(true);
    });

    it('should return true for lost run', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordLoss(run);
      run = recordLoss(run);

      expect(isRunComplete(run)).toBe(true);
    });
  });

  describe('getRunResult', () => {
    it('should return active for ongoing run', () => {
      const run = createRun(simpleConfig, defaultState);
      expect(getRunResult(run)).toBe('active');
    });

    it('should return won for completed winning run', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordWin(run);
      run = recordWin(run);

      expect(getRunResult(run)).toBe('won');
    });

    it('should return lost for completed losing run', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordLoss(run);
      run = recordLoss(run);

      expect(getRunResult(run)).toBe('lost');
    });
  });

  describe('getRunStats', () => {
    it('should return correct stats for empty run', () => {
      const run = createRun(simpleConfig, defaultState);
      const stats = getRunStats(run);

      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.longestWinStreak).toBe(0);
    });

    it('should calculate win rate correctly', () => {
      let run = createRun(simpleConfig, defaultState);
      run = recordWin(run);
      run = recordWin(run);
      run = recordLoss(run);

      const stats = getRunStats(run);

      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.winRate).toBeCloseTo(2 / 3);
    });

    it('should track longest win streak', () => {
      let run = createRun({ ...simpleConfig, winsToComplete: 10, maxLosses: 5 }, defaultState);
      // W W L W W W L
      run = recordWin(run);
      run = recordWin(run);
      run = recordLoss(run);
      run = recordWin(run);
      run = recordWin(run);
      run = recordWin(run);
      run = recordLoss(run);

      const stats = getRunStats(run);

      expect(stats.longestWinStreak).toBe(3);
    });
  });

  describe('updateRunState', () => {
    it('should update state with new object', () => {
      const run = createRun(simpleConfig, defaultState);
      const newState = { gold: 50, deck: ['card4'] };
      const updated = updateRunState(run, newState);

      expect(updated.state).toEqual(newState);
    });

    it('should update state with updater function', () => {
      const run = createRun(simpleConfig, defaultState);
      const updated = updateRunState(run, (prev) => ({
        ...prev,
        gold: prev.gold + 10,
      }));

      expect(updated.state.gold).toBe(20);
      expect(updated.state.deck).toEqual(defaultState.deck);
    });

    it('should not mutate original run', () => {
      const run = createRun(simpleConfig, defaultState);
      updateRunState(run, { gold: 100, deck: [] });

      expect(run.state).toEqual(defaultState);
    });
  });

  describe('Presets', () => {
    it('ROGUELIKE_RUN_CONFIG should work correctly', () => {
      let run = createRun(ROGUELIKE_RUN_CONFIG, {});

      // Simulate 9 wins
      for (let i = 0; i < 9; i++) {
        run = recordWin(run);
      }

      expect(run.status).toBe('won');
    });

    it('BOSS_RUSH_RUN_CONFIG should work correctly', () => {
      let run = createRun(BOSS_RUSH_RUN_CONFIG, {});

      // One loss should end the run
      run = recordLoss(run);

      expect(run.status).toBe('lost');
    });

    it('ENDLESS_RUN_CONFIG should allow many wins', () => {
      let run = createRun(ENDLESS_RUN_CONFIG, {});

      // 50 wins should not complete the run
      for (let i = 0; i < 50; i++) {
        run = recordWin(run);
      }

      expect(run.status).toBe('active');
      expect(run.wins).toBe(50);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Run System Properties', () => {
  /**
   * **Feature: core-progression, Property 16: Win completion**
   * **Validates: Requirements 6.2**
   *
   * For any run, when wins reaches winsToComplete, status should become 'won'.
   */
  describe('Property 16: Win completion', () => {
    it('reaching winsToComplete sets status to won', () => {
      fc.assert(
        fc.property(
          arbitraryRunConfig(),
          (config) => {
            let run = createRun(config, {});

            // Record exactly winsToComplete wins
            for (let i = 0; i < config.winsToComplete; i++) {
              run = recordWin(run);
            }

            return run.status === 'won' && run.wins === config.winsToComplete;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 17: Loss elimination**
   * **Validates: Requirements 6.2**
   *
   * For any run, when losses reaches maxLosses, status should become 'lost'.
   */
  describe('Property 17: Loss elimination', () => {
    it('reaching maxLosses sets status to lost', () => {
      fc.assert(
        fc.property(
          arbitraryRunConfig(),
          (config) => {
            let run = createRun(config, {});

            // Record exactly maxLosses losses
            for (let i = 0; i < config.maxLosses; i++) {
              run = recordLoss(run);
            }

            return run.status === 'lost' && run.losses === config.maxLosses;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 18: Streak tracking**
   * **Validates: Requirements 6.2**
   *
   * For any run, consecutive wins should increment winStreak and reset loseStreak
   * (and vice versa).
   */
  describe('Property 18: Streak tracking', () => {
    it('consecutive wins increment winStreak and reset loseStreak', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (consecutiveWins) => {
            const config: RunConfig = {
              winsToComplete: 20,
              maxLosses: 10,
              phases: ['battle'],
              trackStreaks: true,
              enableRating: true,
            };

            let run = createRun(config, {});

            // First record a loss to set loseStreak
            run = recordLoss(run);
            expect(run.loseStreak).toBe(1);

            // Then record consecutive wins
            for (let i = 0; i < consecutiveWins; i++) {
              run = recordWin(run);
            }

            return run.winStreak === consecutiveWins && run.loseStreak === 0;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('consecutive losses increment loseStreak and reset winStreak', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (consecutiveLosses) => {
            const config: RunConfig = {
              winsToComplete: 20,
              maxLosses: 10,
              phases: ['battle'],
              trackStreaks: true,
              enableRating: true,
            };

            let run = createRun(config, {});

            // First record a win to set winStreak
            run = recordWin(run);
            expect(run.winStreak).toBe(1);

            // Then record consecutive losses
            for (let i = 0; i < consecutiveLosses; i++) {
              run = recordLoss(run);
            }

            return run.loseStreak === consecutiveLosses && run.winStreak === 0;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 19: Phase cycling**
   * **Validates: Requirements 6.2**
   *
   * For any run with N phases, advancePhase should cycle through
   * phases 0 → 1 → ... → N-1 → 0.
   */
  describe('Property 19: Phase cycling', () => {
    it('phases cycle correctly', () => {
      fc.assert(
        fc.property(
          arbitraryRunConfig(),
          (config) => {
            let run = createRun(config, {});
            const numPhases = config.phases.length;

            // Advance through all phases and back to start
            for (let i = 0; i < numPhases; i++) {
              const expectedPhase = config.phases[i];
              if (getCurrentPhase(run) !== expectedPhase) {
                return false;
              }
              run = advancePhase(run);
            }

            // Should be back at phase 0
            return run.currentPhaseIndex === 0 &&
              getCurrentPhase(run) === config.phases[0];
          },
        ),
        { numRuns: 100 },
      );
    });

    it('phase index wraps around correctly', () => {
      fc.assert(
        fc.property(
          arbitraryRunConfig(),
          fc.integer({ min: 1, max: 50 }),
          (config, advances) => {
            let run = createRun(config, {});
            const numPhases = config.phases.length;

            for (let i = 0; i < advances; i++) {
              run = advancePhase(run);
            }

            const expectedIndex = advances % numPhases;
            return run.currentPhaseIndex === expectedIndex;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: core-progression, Property 20: Stats accuracy**
   * **Validates: Requirements 6.2**
   *
   * For any run, getRunStats should return winRate = wins / (wins + losses)
   * and correct longestWinStreak from history.
   */
  describe('Property 20: Stats accuracy', () => {
    it('win rate is calculated correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 15 }),
          (results) => {
            const config: RunConfig = {
              winsToComplete: 20,
              maxLosses: 20,
              phases: ['battle'],
              trackStreaks: true,
              enableRating: true,
            };

            let run = createRun(config, {});
            let expectedWins = 0;
            let expectedLosses = 0;

            for (const isWin of results) {
              if (run.status !== 'active') break;

              if (isWin) {
                run = recordWin(run);
                expectedWins++;
              } else {
                run = recordLoss(run);
                expectedLosses++;
              }
            }

            const stats = getRunStats(run);
            const totalGames = expectedWins + expectedLosses;
            const expectedWinRate = totalGames > 0 ? expectedWins / totalGames : 0;

            return (
              stats.wins === expectedWins &&
              stats.losses === expectedLosses &&
              Math.abs(stats.winRate - expectedWinRate) < 0.0001
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('longest win streak is tracked correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
          (results) => {
            const config: RunConfig = {
              winsToComplete: 30,
              maxLosses: 30,
              phases: ['battle'],
              trackStreaks: true,
              enableRating: true,
            };

            let run = createRun(config, {});
            let currentStreak = 0;
            let longestStreak = 0;

            for (const isWin of results) {
              if (run.status !== 'active') break;

              if (isWin) {
                run = recordWin(run);
                currentStreak++;
                if (currentStreak > longestStreak) {
                  longestStreak = currentStreak;
                }
              } else {
                run = recordLoss(run);
                currentStreak = 0;
              }
            }

            const stats = getRunStats(run);
            return stats.longestWinStreak === longestStreak;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

