import { Elysia } from "elysia";
import { TestCredentialsResponseSchema, testCredentials } from "./operations/test-credentials";

export const blueskyRoutes = new Elysia({ prefix: "/api/bluesky" })
  .post("/test-credentials", async () => testCredentials(), {
    response: TestCredentialsResponseSchema,
  });
