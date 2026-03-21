import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../../lib/test-db";
import { resetAllFixtures } from "../../../lib/test-fixtures";
import { createTestChannel, createTestMedia, createTestPost } from "../../../test-utils/setup";
import { PostMedia, Post } from "../entity";
import { FanslyAnalyticsAggregate } from "../../analytics/entity";
import { processScheduleCapture } from "./schedule-capture";

describe("processScheduleCapture", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  const createReadyFanslyPost = async (caption: string) => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const post = await createTestPost(channel.id, {
      caption,
      status: "ready",
      date: new Date(),
    });
    const media = await createTestMedia();
    const postMedia = postMediaRepo.create({
      post,
      media,
      order: 0,
    });
    await postMediaRepo.save(postMedia);
    return { post, postMedia, channel };
  };

  test("matches post by exact caption and links it", async () => {
    const dataSource = getTestDataSource();
    const postRepo = dataSource.getRepository(Post);
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

    const { post, postMedia } = await createReadyFanslyPost(
      "Hello world! This is my first post 🎉",
    );

    const result = await processScheduleCapture({
      contentId: "fansly-content-123",
      caption: "Hello world! This is my first post 🎉",
    });

    expect(result.matched).toBe(true);
    expect(result.postId).toBe(post.id);

    // Post status should be "scheduled"
    const updatedPost = await postRepo.findOne({ where: { id: post.id } });
    expect(updatedPost?.status).toBe("scheduled");

    // PostMedia should have fanslyStatisticsId set
    const updatedPostMedia = await postMediaRepo.findOne({ where: { id: postMedia.id } });
    expect(updatedPostMedia?.fanslyStatisticsId).toBe("fansly-content-123");

    // Aggregate should be created with initial nextFetchAt
    const aggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
    expect(aggregate).toBeTruthy();
    expect(aggregate?.nextFetchAt).toBeInstanceOf(Date);
  });

  test("returns unmatched when no caption matches above threshold", async () => {
    await createReadyFanslyPost("Completely different caption");

    const result = await processScheduleCapture({
      contentId: "fansly-content-456",
      caption: "This is nothing alike at all",
    });

    expect(result.matched).toBe(false);
    expect(result.postId).toBeUndefined();
  });

  test("matches with similarity >= 0.9 (minor differences)", async () => {
    const dataSource = getTestDataSource();
    const postRepo = dataSource.getRepository(Post);

    const { post } = await createReadyFanslyPost("Check out my new photo shoot! Link in bio");

    const result = await processScheduleCapture({
      contentId: "fansly-content-789",
      caption: "Check out my new photo shoot! link in bio", // lowercase "link" vs "Link"
    });

    expect(result.matched).toBe(true);
    expect(result.postId).toBe(post.id);

    const updatedPost = await postRepo.findOne({ where: { id: post.id } });
    expect(updatedPost?.status).toBe("scheduled");
  });

  test("does not match at similarity 0.89 (below threshold)", async () => {
    await createReadyFanslyPost("ABCDEFGHIJ");

    // "ABCDEFGHIJ" vs "ABCDEFGHxx" = 2 edits out of 10 = 0.8 similarity (below 0.9)
    const result = await processScheduleCapture({
      contentId: "fansly-content-000",
      caption: "ABCDEFGHxx",
    });

    expect(result.matched).toBe(false);
  });

  test("only matches posts with status 'ready'", async () => {
    const dataSource = getTestDataSource();
    const channel = await createTestChannel({ typeId: "fansly" });
    const post = await createTestPost(channel.id, {
      caption: "Exact match caption",
      status: "scheduled",
      date: new Date(),
    });
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const media = await createTestMedia();
    await postMediaRepo.save(postMediaRepo.create({ post, media, order: 0 }));

    const result = await processScheduleCapture({
      contentId: "fansly-content-111",
      caption: "Exact match caption",
    });

    expect(result.matched).toBe(false);
  });

  test("only matches fansly channel posts", async () => {
    const dataSource = getTestDataSource();
    const channelTypeRepo = dataSource.getRepository("ChannelType");

    // eslint-disable-next-line functional/no-let
    let blueskyType = await channelTypeRepo.findOne({ where: { id: "bluesky" } });
    if (!blueskyType) {
      blueskyType = channelTypeRepo.create({ id: "bluesky", name: "Bluesky" });
      await channelTypeRepo.save(blueskyType);
    }

    const channel = await createTestChannel({ typeId: "bluesky" });
    const post = await createTestPost(channel.id, {
      caption: "Exact match but wrong channel",
      status: "ready",
      date: new Date(),
    });
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const media = await createTestMedia();
    await postMediaRepo.save(postMediaRepo.create({ post, media, order: 0 }));

    const result = await processScheduleCapture({
      contentId: "fansly-content-222",
      caption: "Exact match but wrong channel",
    });

    expect(result.matched).toBe(false);
  });

  test("does not mutate data when no match", async () => {
    const dataSource = getTestDataSource();
    const postRepo = dataSource.getRepository(Post);

    const { post } = await createReadyFanslyPost("My post caption");

    await processScheduleCapture({
      contentId: "fansly-content-333",
      caption: "Totally unrelated scheduling text",
    });

    const unchangedPost = await postRepo.findOne({ where: { id: post.id } });
    expect(unchangedPost?.status).toBe("ready");
  });

  test("links only attachments[0] (first PostMedia by order)", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const post = await createTestPost(channel.id, {
      caption: "Multi-media post",
      status: "ready",
      date: new Date(),
    });
    const media1 = await createTestMedia();
    const media2 = await createTestMedia();
    const pm1 = postMediaRepo.create({ post, media: media1, order: 0 });
    const pm2 = postMediaRepo.create({ post, media: media2, order: 1 });
    await postMediaRepo.save(pm1);
    await postMediaRepo.save(pm2);

    const result = await processScheduleCapture({
      contentId: "fansly-multi-001",
      caption: "Multi-media post",
    });

    expect(result.matched).toBe(true);

    const updatedPm1 = await postMediaRepo.findOne({ where: { id: pm1.id } });
    const updatedPm2 = await postMediaRepo.findOne({ where: { id: pm2.id } });
    expect(updatedPm1?.fanslyStatisticsId).toBe("fansly-multi-001");
    expect(updatedPm2?.fanslyStatisticsId).toBeNull();
  });

  test("handles null caption in queue post gracefully", async () => {
    const channel = await createTestChannel({ typeId: "fansly" });
    const post = await createTestPost(channel.id, {
      caption: null,
      status: "ready",
      date: new Date(),
    });
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const media = await createTestMedia();
    await postMediaRepo.save(postMediaRepo.create({ post, media, order: 0 }));

    const result = await processScheduleCapture({
      contentId: "fansly-content-444",
      caption: "Some caption",
    });

    expect(result.matched).toBe(false);
  });
});
