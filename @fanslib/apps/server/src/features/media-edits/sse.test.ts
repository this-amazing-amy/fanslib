import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { mediaEditsRoutes } from "./routes";
import { emitRenderEvent, type RenderEvent } from "./render-events";

describe("SSE Render Progress", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", mediaEditsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  test("emitRenderEvent sends events to connected SSE clients", async () => {
    // Start SSE connection
    const response = await app.request("/api/media-edits/render-progress");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    // Emit an event
    const event: RenderEvent = {
      type: "render-started",
      editId: "test-edit-1",
      totalFrames: 100,
    };
    emitRenderEvent(event);

    // Read the SSE stream
    const body = response.body;
    if (!body) throw new Error("Response body is null");
    const reader = body.getReader();
    const decoder = new TextDecoder();

    const { value } = await reader.read();
    const text = decoder.decode(value);

    expect(text).toContain("event: render-started");
    expect(text).toContain("test-edit-1");

    reader.cancel();
  });
});
