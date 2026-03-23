import "reflect-metadata";
import { seedAllFixtures } from "../lib/fixtures";
import { db } from "../lib/db";
import { seedDatabase } from "../lib/seed";

process.env.FANSLY_DEV_ANALYTICS_FIXTURES = "1";

await seedDatabase();
await seedAllFixtures(await db());
console.log("✅ Dev fixtures (including Fansly analytics) seeded");
