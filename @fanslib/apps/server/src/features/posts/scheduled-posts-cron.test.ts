import { describe, expect, test } from "bun:test";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { Channel, ChannelType } from "../channels/entity";
import { Post } from "./entity";
import { updateOverdueScheduledNonRedditPosts } from "./scheduled-posts-cron";

describe("updateOverdueScheduledNonRedditPosts", () => {
  test("marks overdue scheduled non-Reddit posts as posted and skips Reddit posts", async () => {
    const dataSource = await setupTestDatabase();

    const channelTypeRepo = dataSource.getRepository(ChannelType);
    const channelRepo = dataSource.getRepository(Channel);
    const postRepo = dataSource.getRepository(Post);

    await Promise.all(
      ["fansly", "reddit"].map(async (id) =>
        channelTypeRepo.save(
          channelTypeRepo.create({
            id,
            name: id,
            color: null,
          })
        )
      )
    );

    const [fanslyChannel, redditChannel] = await Promise.all(
      [
        { name: "Fansly", typeId: "fansly" },
        { name: "Reddit", typeId: "reddit" },
      ].map(async ({ name, typeId }) =>
        channelRepo.save(
          channelRepo.create({
            name,
            typeId,
          })
        )
      )
    );

    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const pastDate = new Date(Date.now() - 60_000).toISOString();

    const [overdueFanslyPost, overdueRedditPost] = await Promise.all(
      [
        { channelId: fanslyChannel.id, date: pastDate },
        { channelId: redditChannel.id, date: pastDate },
      ].map(async ({ channelId, date }) =>
        postRepo.save(
          postRepo.create({
            createdAt,
            updatedAt,
            scheduleId: null,
            caption: null,
            date,
            url: null,
            fypRemovedAt: null,
            status: "scheduled",
            channelId,
            subredditId: null,
          })
        )
      )
    );

    const result = await updateOverdueScheduledNonRedditPosts();

    const [updatedFanslyPost, updatedRedditPost] = await Promise.all(
      [overdueFanslyPost.id, overdueRedditPost.id].map(async (id) => postRepo.findOneOrFail({ where: { id } }))
    );

    const updatedPostIds = result.updatedPosts.map((post) => post.postId);
    expect(updatedPostIds).toContain(overdueFanslyPost.id);
    expect(updatedPostIds).not.toContain(overdueRedditPost.id);

    expect(updatedFanslyPost.status).toBe("posted");
    expect(updatedFanslyPost.updatedAt).toBe(result.now);

    expect(updatedRedditPost.status).toBe("scheduled");
    expect(updatedRedditPost.updatedAt).toBe(updatedAt);

    await teardownTestDatabase();
  });
});

