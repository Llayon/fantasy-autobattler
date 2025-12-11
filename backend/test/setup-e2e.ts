/**
 * E2E Test Setup Configuration.
 * 
 * Global setup for End-to-End tests including timeout configuration
 * and test environment preparation.
 */

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
});

afterAll(() => {
  // Cleanup after all tests
  delete process.env['NODE_ENV'];
});