/**
 * Global test setup that runs once before all tests.
 * Initializes the test database to avoid circular dependency issues
 * when multiple test files load db test utilities simultaneously.
 */
import { setupTestDatabase } from "../lib/test-db";

// Initialize database once globally
await setupTestDatabase();

console.log("[Global Setup] Test database initialized");
