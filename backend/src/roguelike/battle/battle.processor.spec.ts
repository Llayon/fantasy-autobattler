/**
 * Property-Based Tests for Roguelike Battle Processor
 *
 * Tests that roguelike battles correctly use ROGUELIKE_PRESET
 * with all 14 Core 2.0 mechanics enabled.
 *
 * **Feature: mechanics-optimization, Property 1: Roguelike battles use ROGUELIKE_PRESET**
 * **Validates: Requirements 1.1**
 *
 * @module roguelike/battle/processor.spec
 */

import * as fc from 'fast-check';
import {
  createMechanicsProcessor,
  ROGUELIKE_PRESET,
  MVP_PRESET,
  MechanicsProcessor,
} from '../../core/mechanics';

// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Roguelike Processor Config', () => {
  /**
   * **Feature: mechanics-optimization, Property 1: Roguelike battles use ROGUELIKE_PRESET**
   * **Validates: Requirements 1.1**
   *
   * For any roguelike battle, the MechanicsProcessor config SHALL equal
   * ROGUELIKE_PRESET with all 14 mechanics enabled.
   */
  describe('Property 1: Roguelike battles use ROGUELIKE_PRESET', () => {
    it('should create processor with ROGUELIKE_PRESET config', () => {
      const processor = createMechanicsProcessor(ROGUELIKE_PRESET);

      // Verify processor was created
      expect(processor).toBeDefined();
      expect(processor.config).toBeDefined();

      // Verify all 14 mechanics are enabled
      expect(processor.config.facing).toBe(true);
      expect(processor.config.flanking).toBe(true);
      expect(processor.config.resolve).toBeTruthy();
      expect(processor.config.engagement).toBeTruthy();
      expect(processor.config.riposte).toBeTruthy();
      expect(processor.config.intercept).toBeTruthy();
      expect(processor.config.aura).toBe(true);
      expect(processor.config.charge).toBeTruthy();
      expect(processor.config.overwatch).toBe(true);
      expect(processor.config.phalanx).toBeTruthy();
      expect(processor.config.lineOfSight).toBeTruthy();
      expect(processor.config.ammunition).toBeTruthy();
      expect(processor.config.contagion).toBeTruthy();
      expect(processor.config.armorShred).toBeTruthy();
    });

    it('should have ROGUELIKE_PRESET config different from MVP_PRESET', () => {
      const roguelikeProcessor = createMechanicsProcessor(ROGUELIKE_PRESET);
      const mvpProcessor = createMechanicsProcessor(MVP_PRESET);

      // MVP has all mechanics disabled
      expect(mvpProcessor.config.facing).toBeFalsy();
      expect(mvpProcessor.config.flanking).toBeFalsy();
      expect(mvpProcessor.config.resolve).toBeFalsy();

      // ROGUELIKE has all mechanics enabled
      expect(roguelikeProcessor.config.facing).toBe(true);
      expect(roguelikeProcessor.config.flanking).toBe(true);
      expect(roguelikeProcessor.config.resolve).toBeTruthy();
    });

    /**
     * Property: For any number of processor creations, each should have
     * identical ROGUELIKE_PRESET configuration.
     */
    it('should consistently create processors with same ROGUELIKE_PRESET config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const processors: MechanicsProcessor[] = [];

            // Create multiple processors
            for (let i = 0; i < Math.min(iterations, 10); i++) {
              processors.push(createMechanicsProcessor(ROGUELIKE_PRESET));
            }

            // All processors should have identical config
            const firstProcessor = processors[0];
            if (!firstProcessor) return true; // Edge case: no processors created

            const firstConfig = firstProcessor.config;
            for (const processor of processors) {
              expect(processor.config.facing).toBe(firstConfig.facing);
              expect(processor.config.flanking).toBe(firstConfig.flanking);
              expect(processor.config.overwatch).toBe(firstConfig.overwatch);
              expect(processor.config.aura).toBe(firstConfig.aura);

              // Check resolve config matches
              if (typeof firstConfig.resolve === 'object' && typeof processor.config.resolve === 'object') {
                expect(processor.config.resolve.maxResolve).toBe(firstConfig.resolve.maxResolve);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: ROGUELIKE_PRESET should have all 14 mechanics enabled.
     * This is a direct verification of the preset configuration.
     */
    it('should have exactly 14 mechanics enabled in ROGUELIKE_PRESET', () => {
      // Count enabled mechanics
      const enabledMechanics: string[] = [];

      if (ROGUELIKE_PRESET.facing) enabledMechanics.push('facing');
      if (ROGUELIKE_PRESET.resolve) enabledMechanics.push('resolve');
      if (ROGUELIKE_PRESET.engagement) enabledMechanics.push('engagement');
      if (ROGUELIKE_PRESET.flanking) enabledMechanics.push('flanking');
      if (ROGUELIKE_PRESET.riposte) enabledMechanics.push('riposte');
      if (ROGUELIKE_PRESET.intercept) enabledMechanics.push('intercept');
      if (ROGUELIKE_PRESET.aura) enabledMechanics.push('aura');
      if (ROGUELIKE_PRESET.charge) enabledMechanics.push('charge');
      if (ROGUELIKE_PRESET.overwatch) enabledMechanics.push('overwatch');
      if (ROGUELIKE_PRESET.phalanx) enabledMechanics.push('phalanx');
      if (ROGUELIKE_PRESET.lineOfSight) enabledMechanics.push('lineOfSight');
      if (ROGUELIKE_PRESET.ammunition) enabledMechanics.push('ammunition');
      if (ROGUELIKE_PRESET.contagion) enabledMechanics.push('contagion');
      if (ROGUELIKE_PRESET.armorShred) enabledMechanics.push('armorShred');

      expect(enabledMechanics).toHaveLength(14);
    });

    /**
     * Property: Resolve config should have correct values for roguelike mode.
     */
    it('should have correct resolve config values', () => {
      expect(ROGUELIKE_PRESET.resolve).toBeTruthy();

      if (typeof ROGUELIKE_PRESET.resolve === 'object') {
        expect(ROGUELIKE_PRESET.resolve.maxResolve).toBe(100);
        expect(ROGUELIKE_PRESET.resolve.baseRegeneration).toBe(5);
        expect(ROGUELIKE_PRESET.resolve.humanRetreat).toBe(true);
        expect(ROGUELIKE_PRESET.resolve.undeadCrumble).toBe(true);
        expect(ROGUELIKE_PRESET.resolve.flankingResolveDamage).toBe(12);
        expect(ROGUELIKE_PRESET.resolve.rearResolveDamage).toBe(20);
      }
    });

    /**
     * Property: Engagement config should enable attack of opportunity.
     */
    it('should have engagement with attack of opportunity enabled', () => {
      expect(ROGUELIKE_PRESET.engagement).toBeTruthy();

      if (typeof ROGUELIKE_PRESET.engagement === 'object') {
        expect(ROGUELIKE_PRESET.engagement.attackOfOpportunity).toBe(true);
        expect(ROGUELIKE_PRESET.engagement.archerPenalty).toBe(true);
      }
    });

    /**
     * Property: Riposte config should be initiative-based.
     */
    it('should have riposte with initiative-based config', () => {
      expect(ROGUELIKE_PRESET.riposte).toBeTruthy();

      if (typeof ROGUELIKE_PRESET.riposte === 'object') {
        expect(ROGUELIKE_PRESET.riposte.initiativeBased).toBe(true);
        expect(ROGUELIKE_PRESET.riposte.chargesPerRound).toBe('attackCount');
      }
    });
  });
});
