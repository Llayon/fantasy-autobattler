/**
 * Tests for seeded random number generation.
 * Validates determinism properties required for battle replay.
 *
 * @module core/utils/random.spec
 */

import { seededRandom, SeededRandom } from './random';

describe('seededRandom function', () => {
  describe('determinism (Property 1)', () => {
    it('should return identical results for the same seed', () => {
      const seed = 12345;
      const result1 = seededRandom(seed);
      const result2 = seededRandom(seed);

      expect(result1).toBe(result2);
    });

    it('should be deterministic across multiple calls with same seed', () => {
      const seeds = [0, 1, 100, 999999, -1, -12345];

      for (const seed of seeds) {
        const result1 = seededRandom(seed);
        const result2 = seededRandom(seed);
        expect(result1).toBe(result2);
      }
    });
  });

  describe('output range', () => {
    it('should return values between 0 and 1', () => {
      const seeds = [0, 1, 100, 12345, 999999, -1, -12345];

      for (const seed of seeds) {
        const result = seededRandom(seed);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      }
    });
  });

  describe('distribution', () => {
    it('should produce different values for different seeds', () => {
      const results = new Set<number>();

      for (let seed = 0; seed < 100; seed++) {
        results.add(seededRandom(seed));
      }

      // Should have many unique values (good distribution)
      expect(results.size).toBeGreaterThan(90);
    });
  });
});

describe('SeededRandom class', () => {
  describe('sequence determinism (Property 2)', () => {
    it('should produce identical sequences for the same seed', () => {
      const seed = 12345;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce identical sequences across multiple instances', () => {
      const seeds = [0, 1, 100, 999999];

      for (const seed of seeds) {
        const rng1 = new SeededRandom(seed);
        const rng2 = new SeededRandom(seed);

        for (let i = 0; i < 20; i++) {
          expect(rng1.next()).toBe(rng2.next());
        }
      }
    });
  });

  describe('next()', () => {
    it('should return values between 0 and 1', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should produce different values on consecutive calls', () => {
      const rng = new SeededRandom(12345);
      const values = new Set<number>();

      for (let i = 0; i < 100; i++) {
        values.add(rng.next());
      }

      // Should have many unique values
      expect(values.size).toBeGreaterThan(90);
    });
  });

  describe('nextInt()', () => {
    it('should return integers within specified range', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(1, 6);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
      }
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100));
      }
    });

    it('should cover the full range', () => {
      const rng = new SeededRandom(12345);
      const values = new Set<number>();

      for (let i = 0; i < 1000; i++) {
        values.add(rng.nextInt(1, 6));
      }

      // Should hit all values 1-6
      expect(values.size).toBe(6);
    });
  });

  describe('shuffle()', () => {
    it('should be deterministic', () => {
      const array = [1, 2, 3, 4, 5];
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const shuffled1 = rng1.shuffle(array);
      const shuffled2 = rng2.shuffle(array);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('should not mutate original array', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      const rng = new SeededRandom(12345);

      rng.shuffle(original);

      expect(original).toEqual(copy);
    });

    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const rng = new SeededRandom(12345);

      const shuffled = rng.shuffle(original);

      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should produce different orderings for different seeds', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(54321);

      const shuffled1 = rng1.shuffle(array);
      const shuffled2 = rng2.shuffle(array);

      // Very unlikely to be the same
      expect(shuffled1).not.toEqual(shuffled2);
    });
  });

  describe('pick()', () => {
    it('should be deterministic', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng1.pick(array)).toBe(rng2.pick(array));
      }
    });

    it('should return undefined for empty array', () => {
      const rng = new SeededRandom(12345);
      expect(rng.pick([])).toBeUndefined();
    });

    it('should return elements from the array', () => {
      const array = ['a', 'b', 'c'];
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        const picked = rng.pick(array);
        expect(array).toContain(picked);
      }
    });
  });

  describe('chance()', () => {
    it('should be deterministic', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        expect(rng1.chance(0.5)).toBe(rng2.chance(0.5));
      }
    });

    it('should return boolean', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        const result = rng.chance(0.5);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should always return false for probability 0', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });

    it('should always return true for probability 1', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        expect(rng.chance(1)).toBe(true);
      }
    });
  });

  describe('getSeed() and setSeed()', () => {
    it('should allow saving and restoring state', () => {
      const rng = new SeededRandom(12345);

      // Generate some values
      rng.next();
      rng.next();
      rng.next();

      // Save state
      const savedSeed = rng.getSeed();

      // Generate more values
      const value1 = rng.next();
      const value2 = rng.next();

      // Restore state
      rng.setSeed(savedSeed);

      // Should get same values
      expect(rng.next()).toBe(value1);
      expect(rng.next()).toBe(value2);
    });
  });
});
