/**
 * Reset all tables and re-seed fixtures.
 * 
 * This function is in a separate file to avoid circular dependencies.
 * The dynamic import breaks the circular dependency chain.
 */
export const resetAllFixtures = async () => {
  // Import dynamically to avoid circular dependency
  // Ensure DB is initialized (guards against beforeAll/beforeEach race in some Bun versions)
  const { clearAllTables, setupTestDatabase } = await import("./test-db");
  await setupTestDatabase();
  await clearAllTables();
  
  const { seedAllFixtures } = await import("./fixtures");
  return seedAllFixtures();
};
