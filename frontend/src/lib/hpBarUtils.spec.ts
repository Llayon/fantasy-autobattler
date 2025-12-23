/**
 * Property-based tests for HP bar color utility.
 * 
 * @fileoverview Tests for getHpBarColor function using fast-check.
 * **Feature: hp-bar-visibility**
 */

import * as fc from 'fast-check';
import { getHpBarColor } from './hpBarUtils';

describe('getHpBarColor', () => {
  /**
   * **Feature: hp-bar-visibility, Property 1: HP color green for healthy units**
   * **Validates: Requirements 2.1**
   * 
   * For any unit with HP percentage greater than 50%, 
   * the getHpBarColor function should return 'bg-green-500'
   */
  it('Property 1: returns green for HP > 50%', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50.001, max: 100, noNaN: true }),
        (hpPercent) => {
          const result = getHpBarColor(hpPercent);
          return result === 'bg-green-500';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: hp-bar-visibility, Property 2: HP color yellow for damaged units**
   * **Validates: Requirements 2.2**
   * 
   * For any unit with HP percentage between 25% (exclusive) and 50% (inclusive),
   * the getHpBarColor function should return 'bg-yellow-500'
   */
  it('Property 2: returns yellow for HP between 25% and 50%', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 25.001, max: 50, noNaN: true }),
        (hpPercent) => {
          const result = getHpBarColor(hpPercent);
          return result === 'bg-yellow-500';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: hp-bar-visibility, Property 3: HP color red for critical units**
   * **Validates: Requirements 2.3**
   * 
   * For any unit with HP percentage of 25% or less,
   * the getHpBarColor function should return 'bg-red-500'
   */
  it('Property 3: returns red for HP <= 25%', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 25, noNaN: true }),
        (hpPercent) => {
          const result = getHpBarColor(hpPercent);
          return result === 'bg-red-500';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Edge case: negative HP values should be clamped to 0 and return red.
   */
  it('handles negative HP values by returning red', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: -0.001, noNaN: true }),
        (hpPercent) => {
          const result = getHpBarColor(hpPercent);
          return result === 'bg-red-500';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Edge case: HP values > 100 should be clamped to 100 and return green.
   */
  it('handles HP > 100% by returning green', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100.001, max: 1000, noNaN: true }),
        (hpPercent) => {
          const result = getHpBarColor(hpPercent);
          return result === 'bg-green-500';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Boundary tests for exact threshold values.
   */
  describe('boundary values', () => {
    it('returns red for exactly 25%', () => {
      expect(getHpBarColor(25)).toBe('bg-red-500');
    });

    it('returns yellow for just above 25%', () => {
      expect(getHpBarColor(25.001)).toBe('bg-yellow-500');
    });

    it('returns yellow for exactly 50%', () => {
      expect(getHpBarColor(50)).toBe('bg-yellow-500');
    });

    it('returns green for just above 50%', () => {
      expect(getHpBarColor(50.001)).toBe('bg-green-500');
    });

    it('returns red for 0%', () => {
      expect(getHpBarColor(0)).toBe('bg-red-500');
    });

    it('returns green for 100%', () => {
      expect(getHpBarColor(100)).toBe('bg-green-500');
    });
  });
});
