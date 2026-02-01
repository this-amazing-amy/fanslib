import { Hono } from "hono";
import { TestCredentialsResponseSchema, testCredentials } from "./operations/test-credentials";

export const blueskyRoutes = new Hono()
  .basePath("/api/bluesky")
  .post("/test-credentials", async (c) => {
    const result = await testCredentials();
    return c.json(result);
  });
