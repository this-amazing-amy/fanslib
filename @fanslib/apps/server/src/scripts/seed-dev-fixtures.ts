import "reflect-metadata";
import { seedAllFixtures } from "../lib/fixtures";
import { db } from "../lib/db";
import { seedDatabase } from "../lib/seed";

process.env.FANSLIB_SEED_DEMO_DATA = "1";

await seedDatabase();
await seedAllFixtures(await db());
console.log("✅ Dev fixtures (including Fansly analytics demo data) seeded");
