/**
 * Jest configuration for End-to-End tests.
 * 
 * Separate configuration for E2E tests that run against the full application.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage-e2e',
  // setupFilesAfterEnv: ['<rootDir>/test/setup-e2e.ts'],
  testTimeout: 60000, // 60 seconds for E2E tests
  maxWorkers: 1, // Run E2E tests sequentially
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Detect handles that prevent Jest from exiting
};