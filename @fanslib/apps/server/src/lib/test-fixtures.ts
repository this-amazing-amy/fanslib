/**
 * Reset all tables and re-seed fixtures.
 * 
 * This function is in a separate file to avoid circular dependencies.
 * The dynamic import breaks the circular dependency chain.
 */
export const resetAllFixtures = async () => {
  // Import clearAllTables dynamically to avoid circular dependency
  const { clearAllTables } = await import("./test-db");
  await clearAllTables();
  
  const { seedAllFixtures } = await import("./fixtures");
  return seedAllFixtures();
};
