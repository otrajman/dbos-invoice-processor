import * as dotenv from 'dotenv';
import knex from 'knex';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let testDb: any;

beforeAll(async () => {
  // Set up test database connection
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:dbos@localhost:5432/postgres_test';

  // Set up direct knex connection for test data management
  testDb = knex({
    client: 'pg',
    connection: testDatabaseUrl,
  });

  // Run migrations
  await testDb.migrate.latest();
});

afterAll(async () => {
  // Clean up
  if (testDb) {
    await testDb.destroy();
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  await testDb('line_items').del();
  await testDb('invoices').del();
  await testDb('vendors').del();
  await testDb('users').del();
});

// Export test database for use in tests
export { testDb };
