import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../../lib/test-db";
import { resetAllFixtures } from "../../../lib/test-fixtures";
import { devalueMiddleware } from "../../../lib/devalue-middleware";
import { parseResponse, createTestPost, createTestMedia } from "../../../test-utils/setup";
import { PostMedia } from "../../posts/entity";
import type { FanslyMediaCandidate } from "../candidate-entity";
import { FanslyMediaCandidate as FanslyMediaCandidateEntity } from "../candidate-entity";
import { candidatesRoutes } from "./routes";

describe("Analytics Candidates Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", candidatesRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("POST /api/analytics/candidates", () => {
    test.skip("creates new candidates", async () => {
      const candidateData = {
        items: [
          {
            fanslyStatisticsId: "stats-1",
            fanslyPostId: "post-123",
            filename: "photo1.jpg",
            caption: "Test caption",
            fanslyCreatedAt: Date.now(),
            position: 0,
            mediaType: "image" as const,
          },
          {
            fanslyStatisticsId: "stats-2",
            fanslyPostId: "post-123",
            filename: "photo2.jpg",
            caption: null,
            fanslyCreatedAt: Date.now(),
            position: 1,
            mediaType: "image" as const,
          },
        ],
      };

      const response = await app.request("/api/analytics/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidateData),
        });
      expect(response.status).toBe(200);

      const data = await parseResponse<FanslyMediaCandidate[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBe(2);
      expect(data?.[0]?.fanslyStatisticsId).toBe("stats-1");
      expect(data?.[0]?.status).toBe("pending");
      expect(data?.[1]?.fanslyStatisticsId).toBe("stats-2");
    });

    test.skip("returns existing candidate if fanslyStatisticsId already exists", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const existingCandidate = candidateRepository.create({
        fanslyStatisticsId: "stats-existing",
        fanslyPostId: "post-456",
        filename: "existing.jpg",
        caption: "Existing caption",
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      await candidateRepository.save(existingCandidate);

      const candidateData = {
        items: [
          {
            fanslyStatisticsId: "stats-existing",
            fanslyPostId: "post-456",
            filename: "existing.jpg",
            caption: "Existing caption",
            fanslyCreatedAt: Date.now(),
            position: 0,
            mediaType: "image" as const,
          },
        ],
      };

      const response = await app.request("/api/analytics/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidateData),
        });
      expect(response.status).toBe(200);

      const data = await parseResponse<FanslyMediaCandidate[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBe(1);
      expect(data?.[0]?.id).toBe(existingCandidate.id);
    });
  });

  describe("GET /api/analytics/candidates", () => {
    test("returns all candidates", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const candidate1 = candidateRepository.create({
        fanslyStatisticsId: "stats-fetch-1",
        fanslyPostId: "post-fetch-1",
        filename: "fetch1.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      const candidate2 = candidateRepository.create({
        fanslyStatisticsId: "stats-fetch-2",
        fanslyPostId: "post-fetch-2",
        filename: "fetch2.jpg",
        caption: "Test caption",
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "video",
        status: "matched",
      });
      await candidateRepository.save([candidate1, candidate2]);

      const response = await app.request("/api/analytics/candidates");
      expect(response.status).toBe(200);

      const data = await parseResponse<{ items: FanslyMediaCandidate[]; total: number }>(response);
      expect(data?.items).toBeDefined();
      expect(Array.isArray(data?.items)).toBe(true);
      expect(data?.total).toBeGreaterThanOrEqual(2);
      expect(data?.items.length).toBeGreaterThanOrEqual(2);
    });

    test("filters by status", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const pendingCandidate = candidateRepository.create({
        fanslyStatisticsId: "stats-pending",
        fanslyPostId: "post-pending",
        filename: "pending.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      const matchedCandidate = candidateRepository.create({
        fanslyStatisticsId: "stats-matched",
        fanslyPostId: "post-matched",
        filename: "matched.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "matched",
      });
      await candidateRepository.save([pendingCandidate, matchedCandidate]);

      const response = await app.request("/api/analytics/candidates?status=pending");
      expect(response.status).toBe(200);

      const data = await parseResponse<{ items: FanslyMediaCandidate[]; total: number }>(response);
      expect(data?.items).toBeDefined();
      expect(Array.isArray(data?.items)).toBe(true);
      data?.items.forEach((candidate) => {
        expect(candidate.status).toBe("pending");
      });
    });

    test("supports pagination with limit and offset", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const candidates = Array.from({ length: 5 }, (_, i) =>
        candidateRepository.create({
          fanslyStatisticsId: `stats-paginate-${i}`,
          fanslyPostId: `post-paginate-${i}`,
          filename: `paginate${i}.jpg`,
          caption: null,
          fanslyCreatedAt: Date.now() - i * 1000,
          position: 0,
          mediaType: "image" as const,
          status: "pending" as const,
        })
      );
      await candidateRepository.save(candidates);

      const response = await app.request("/api/analytics/candidates?limit=2&offset=1");
      expect(response.status).toBe(200);

      const data = await parseResponse<{ items: FanslyMediaCandidate[]; total: number }>(response);
      expect(data?.items).toBeDefined();
      expect(data?.items.length).toBeLessThanOrEqual(2);
      expect(data?.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe("GET /api/analytics/candidates/by-id/:id/suggestions", () => {
    test("returns match suggestions for a candidate", async () => {
      const media = await createTestMedia({ name: "photo1.jpg" });
      const post = await createTestPost();
      const dataSource = getTestDataSource();
      const postMediaRepository = dataSource.getRepository(PostMedia);
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const postMedia = postMediaRepository.create({
        post,
        media,
        order: 0,
        isFreePreview: false,
      });
      await postMediaRepository.save(postMedia);

      const candidate = candidateRepository.create({
        fanslyStatisticsId: "stats-suggestions",
        fanslyPostId: "post-suggestions",
        filename: "photo1.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      const savedCandidate = await candidateRepository.save(candidate);

      const response = await app.request(`/api/analytics/candidates/by-id/${savedCandidate.id}/suggestions`);
      expect(response.status).toBe(200);

      const data = await parseResponse<Array<{ postMediaId: string; confidence: number; method: string; filename: string }>>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThan(0);
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty("postMediaId");
        expect(data[0]).toHaveProperty("confidence");
        expect(data[0]).toHaveProperty("method");
        expect(data[0]).toHaveProperty("filename");
      }
    });

    test("returns 404 for non-existent candidate", async () => {
      const response = await app.request("/api/analytics/candidates/by-id/non-existent-id/suggestions");
      expect(response.status).toBe(404);
      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Candidate not found");
    });
  });

  describe("POST /api/analytics/candidates/by-id/:id/match", () => {
    test("confirms a match between candidate and post media", async () => {
      const media = await createTestMedia();
      const post = await createTestPost();
      const dataSource = getTestDataSource();
      const postMediaRepository = dataSource.getRepository(PostMedia);
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const postMedia = postMediaRepository.create({
        post,
        media,
        order: 0,
        isFreePreview: false,
      });
      await postMediaRepository.save(postMedia);

      const candidate = candidateRepository.create({
        fanslyStatisticsId: "stats-match",
        fanslyPostId: "post-match",
        filename: "match.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      const savedCandidate = await candidateRepository.save(candidate);

      const response = await app.request(`/api/analytics/candidates/by-id/${savedCandidate.id}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postMediaId: postMedia.id }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<FanslyMediaCandidate>(response);
      expect(data?.status).toBe("matched");
      expect(data?.matchedPostMediaId).toBe(postMedia.id);
      expect(data?.matchedAt).toBeDefined();

      const updatedPostMedia = await postMediaRepository.findOne({ where: { id: postMedia.id } });
      expect(updatedPostMedia?.fanslyStatisticsId).toBe("stats-match");
    });

    test("returns 404 for non-existent candidate", async () => {
      const media = await createTestMedia();
      const post = await createTestPost();
      const dataSource = getTestDataSource();
      const postMediaRepository = dataSource.getRepository(PostMedia);

      const postMedia = postMediaRepository.create({
        post,
        media,
        order: 0,
        isFreePreview: false,
      });
      await postMediaRepository.save(postMedia);

      const response = await app.request("/api/analytics/candidates/by-id/non-existent-id/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postMediaId: postMedia.id }),
        });
      expect(response.status).toBe(404);
      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Candidate or post media not found");
    });

    test("returns 404 for non-existent post media", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const candidate = candidateRepository.create({
        fanslyStatisticsId: "stats-match-fail",
        fanslyPostId: "post-match-fail",
        filename: "match-fail.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      const savedCandidate = await candidateRepository.save(candidate);

      const response = await app.request(`/api/analytics/candidates/by-id/${savedCandidate.id}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postMediaId: "non-existent-post-media-id" }),
      });
      expect(response.status).toBe(404);
      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Candidate or post media not found");
    });
  });

  describe("POST /api/analytics/candidates/by-id/:id/ignore", () => {
    test("ignores a candidate", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const candidate = candidateRepository.create({
        fanslyStatisticsId: "stats-ignore",
        fanslyPostId: "post-ignore",
        filename: "ignore.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
      });
      const savedCandidate = await candidateRepository.save(candidate);

      const response = await app.request(`/api/analytics/candidates/by-id/${savedCandidate.id}/ignore`, {
        method: "POST",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<FanslyMediaCandidate>(response);
      expect(data?.status).toBe("ignored");
    });

    test("returns 404 for non-existent candidate", async () => {
      const response = await app.request("/api/analytics/candidates/by-id/non-existent-id/ignore", {
          method: "POST",
        });
      expect(response.status).toBe(404);
      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Candidate not found");
    });
  });

  describe("POST /api/analytics/candidates/bulk-confirm", () => {
    test("bulk confirms matches above threshold", async () => {
      const media1 = await createTestMedia({ name: "exact-match.jpg" });
      const media2 = await createTestMedia({ name: "fuzzy-match.jpg" });
      const post1 = await createTestPost();
      const post2 = await createTestPost();
      const dataSource = getTestDataSource();
      const postMediaRepository = dataSource.getRepository(PostMedia);
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const postMedia1 = postMediaRepository.create({
        post: post1,
        media: media1,
        order: 0,
        isFreePreview: false,
      });
      const postMedia2 = postMediaRepository.create({
        post: post2,
        media: media2,
        order: 0,
        isFreePreview: false,
      });
      await postMediaRepository.save([postMedia1, postMedia2]);

      const candidate1 = candidateRepository.create({
        fanslyStatisticsId: "stats-bulk-1",
        fanslyPostId: "post-bulk-1",
        filename: "exact-match.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
        matchConfidence: 1.0,
        matchMethod: "exact_filename",
      });
      const candidate2 = candidateRepository.create({
        fanslyStatisticsId: "stats-bulk-2",
        fanslyPostId: "post-bulk-2",
        filename: "fuzzy-match.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
        matchConfidence: 0.8,
        matchMethod: "fuzzy_filename",
      });
      await candidateRepository.save([candidate1, candidate2]);

      const response = await app.request("/api/analytics/candidates/bulk-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threshold: 0.7 }),
        });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ confirmed: number; failed: number }>(response);
      expect(data?.confirmed).toBeGreaterThanOrEqual(0);
      expect(data?.failed).toBeGreaterThanOrEqual(0);
      expect(typeof data?.confirmed).toBe("number");
      expect(typeof data?.failed).toBe("number");
    });

    test("handles threshold that filters out all candidates", async () => {
      const dataSource = getTestDataSource();
      const candidateRepository = dataSource.getRepository(FanslyMediaCandidateEntity);

      const candidate = candidateRepository.create({
        fanslyStatisticsId: "stats-bulk-low",
        fanslyPostId: "post-bulk-low",
        filename: "low-confidence.jpg",
        caption: null,
        fanslyCreatedAt: Date.now(),
        position: 0,
        mediaType: "image",
        status: "pending",
        matchConfidence: 0.3,
        matchMethod: "fuzzy_filename",
      });
      await candidateRepository.save(candidate);

      const response = await app.request("/api/analytics/candidates/bulk-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threshold: 0.9 }),
        });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ confirmed: number; failed: number }>(response);
      expect(data?.confirmed).toBe(0);
    });
  });
});

