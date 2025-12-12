import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { mapResponse } from "../../lib/serialization";
import { logError, parseResponse } from "../../test-utils/setup";
import { CHANNEL_TYPES } from "../channels/channelTypes";
import { Post } from "./entity";
import { POST_FIXTURES } from "./fixtures";
import { postsRoutes } from "./routes";

describe("Posts Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().onError(logError()).mapResponse(mapResponse).use(postsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/posts/all", () => {
    test("returns all posts", async () => {
      const response = await app.handle(new Request("http://localhost/api/posts/all"));
      expect(response.status).toBe(200);

      const data = await parseResponse<Post[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThanOrEqual(POST_FIXTURES.length);

      POST_FIXTURES.forEach((fixture) => {
        const post = data?.find((p: Post) => p.id === fixture.id);
        expect(post).toBeDefined();
        expect(post?.channelId).toBe(fixture.channelId);
        if (fixture.caption) {
          expect(post?.caption).toBe(fixture.caption);
        }
        if (fixture.subredditId) {
          expect(post?.subredditId).toBe(fixture.subredditId);
        }
      });
    });

    test("supports filters", async () => {
      const filters = JSON.stringify({ statuses: ["draft"] });
      const response = await app.handle(
        new Request(`http://localhost/api/posts/all?filters=${encodeURIComponent(filters)}`)
      );
      const data = await parseResponse<Post[]>(response);

      expect(Array.isArray(data)).toBe(true);
      data?.forEach((post: Post) => {
        expect(post.status).toBe("draft");
      });
    });
  });

  describe("GET /api/posts/by-id/:id", () => {
    test("returns post by id", async () => {
      const fixturePost = POST_FIXTURES[0];
      if (!fixturePost) {
        throw new Error("No post fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/posts/by-id/${fixturePost.id}`)
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Post>(response);
      expect(data?.id).toBe(fixturePost.id);
      expect(data?.channelId).toBe(fixturePost.channelId);
      if (fixturePost.caption) {
        expect(data?.caption).toBe(fixturePost.caption);
      }
    });

    test("returns error for non-existent post", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/posts/by-id/non-existent-id")
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Post not found");
    });
  });

  describe("GET /api/posts/by-channel-id/:channelId", () => {
    test("returns posts for specific channel", async () => {
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/posts/by-channel-id/${fixtureChannel.id}`)
      );
      const data = await parseResponse<Post[]>(response);

      expect(Array.isArray(data)).toBe(true);
      data?.forEach((post: Post) => {
        expect(post.channelId).toBe(fixtureChannel.id);
      });
    });
  });

  describe("POST /api/posts", () => {
    test("creates a new post", async () => {
      const channel = fixtures.channels.channels.find(
        (fixtureChannel) => fixtureChannel.typeId !== CHANNEL_TYPES.reddit.id
      );
      if (!channel) {
        throw new Error("No channel fixtures available");
      }

      const postData = {
        caption: "New post caption",
        status: "draft" as const,
        channelId: channel.id,
        date: new Date().toISOString(),
        mediaIds: [],
      };

      const response = await app.handle(
        new Request("http://localhost/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Post>(response);
      expect(data?.caption).toBe("New post caption");
      expect(data?.status).toBe("draft");
      expect(data?.channelId).toBe(channel.id);
      expect(Array.isArray(data?.postMedia)).toBe(true);
      expect(data?.postMedia).toHaveLength(0);
    });

    test("creates post with media", async () => {
      const channel = fixtures.channels.channels.find((c) => c.typeId === CHANNEL_TYPES.fansly.id);
      const media1 = fixtures.media[0];
      const media2 = fixtures.media[1];
      if (!channel || !media1 || !media2) {
        throw new Error("No channel or media fixtures available");
      }

      const postData = {
        caption: "Post with media",
        status: "draft" as const,
        channelId: channel.id,
        date: new Date().toISOString(),
        mediaIds: [media1.id, media2.id],
      };

      const response = await app.handle(
        new Request("http://localhost/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Post>(response);
      expect(data?.postMedia).toHaveLength(2);
    });
  });

  describe("PATCH /api/posts/by-id/:id", () => {
    test("updates post", async () => {
      const fixturePost = POST_FIXTURES[0];
      if (!fixturePost) {
        throw new Error("No post fixtures available");
      }

      const updateData = {
        caption: "Updated caption",
        status: "posted",
      };

      const response = await app.handle(
        new Request(`http://localhost/api/posts/by-id/${fixturePost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Post>(response);
      expect(data?.caption).toBe("Updated caption");
      expect(data?.status).toBe("posted");
      expect(data?.id).toBe(fixturePost.id);
    });

    test("returns error for non-existent post", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/posts/by-id/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption: "Updated" }),
        })
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Post not found");
    });
  });

  describe("DELETE /api/posts/by-id/:id", () => {
    test("deletes post", async () => {
      const fixturePost = POST_FIXTURES[POST_FIXTURES.length - 1];
      if (!fixturePost) {
        throw new Error("No post fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/posts/by-id/${fixturePost.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Post);
      const deletedPost = await repository.findOne({ where: { id: fixturePost.id } });
      expect(deletedPost).toBeNull();
    });

    test("returns 404 when post not found", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/posts/by-id/non-existent-id", {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Post not found");
    });
  });

  describe("POST /api/posts/by-id/:id/media", () => {
    test("adds media to post", async () => {
      const fixturePost = fixtures.posts.posts[0];
      const media = fixtures.media[0];
      if (!fixturePost || !media) {
        throw new Error("No post or media fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/posts/by-id/${fixturePost.id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaIds: [media.id] }),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Post>(response);
      expect(Array.isArray(data?.postMedia)).toBe(true);
      expect(data?.postMedia?.length).toBeGreaterThan(0);
    });

    test("returns error for non-existent post", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/posts/by-id/non-existent-id/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaIds: [] }),
        })
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Post not found");
    });
  });

  describe("DELETE /api/posts/by-id/:id/media", () => {
    test("removes media from post", async () => {
      const fixturePost = fixtures.posts.posts[0];
      const media1 = fixtures.media[0];
      if (!fixturePost || !media1) {
        throw new Error("No post or media fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/posts/by-id/${fixturePost.id}/media`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaIds: [media1.id] }),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Post>(response);
      expect(data).toHaveProperty("id");
      expect(data?.id).toBe(fixturePost.id);
    });

    test("returns error for non-existent post", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/posts/by-id/non-existent-id/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaIds: [] }),
        })
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Post not found");
    });
  });
});

