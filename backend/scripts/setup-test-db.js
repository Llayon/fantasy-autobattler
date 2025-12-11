/**
 * Setup script for E2E test database.
 * Creates PostgreSQL test database for E2E tests.
 */

const { Client } = require('pg');

/**
 * Creates the E2E test database.
 * Connects to PostgreSQL and creates autobattler_e2e_test database.
 */
async function setupTestDatabase() {
  // Connect to postgres database to create test database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();

    // Drop test database if it exists
    console.log('Dropping existing test database if it exists...');
    await client.query('DROP DATABASE IF EXISTS autobattler_e2e_test');

    // Create test database
    console.log('Creating test database...');
    await client.query('CREATE DATABASE autobattler_e2e_test');

    console.log('✅ Test database autobattler_e2e_test created successfully');
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run setup
setupTestDatabase();