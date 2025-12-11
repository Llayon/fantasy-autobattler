-- Setup script for E2E test database
-- Creates the test database if it doesn't exist

-- Connect to postgres database to create test database
\c postgres;

-- Drop test database if it exists (for clean slate)
DROP DATABASE IF EXISTS autobattler_e2e_test;

-- Create test database
CREATE DATABASE autobattler_e2e_test;

-- Grant permissions to postgres user
GRANT ALL PRIVILEGES ON DATABASE autobattler_e2e_test TO postgres;

-- Connect to test database to verify
\c autobattler_e2e_test;

-- Show confirmation
SELECT 'Test database autobattler_e2e_test created successfully' AS status;