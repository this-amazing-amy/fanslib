import type { Post, PostMedia } from "@fanslib/types";
import { getTestDataSource } from "../../lib/db.test";
import type { Channel } from "../channels/entity";
import type { Media } from "../library/entity";
import type { Subreddit } from "../subreddits/entity";
import { Post as PostEntity, PostMedia as PostMediaEntity } from "./entity";

export type PostFixture = Pick<Post, "id" | "channelId" | "subredditId" | "caption" | "status" | "date">;

export const POST_FIXTURES: PostFixture[] = [
  {
    id: "post-1",
    channelId: "channel-1",
    caption: "Check out this amazing content!",
    status: "draft",
    date: "2024-01-15",
  },
  {
    id: "post-2",
    channelId: "channel-1",
    subredditId: "subreddit-1",
    caption: "New post here!",
    status: "scheduled",
    date: "2024-01-16",
  },
  {
    id: "post-3",
    channelId: "channel-2",
    caption: "Posted content",
    status: "posted",
    date: "2024-01-17",
  },
];

export type PostMediaFixture = Pick<PostMedia, "order" | "isFreePreview"> & {
  postId: string;
  mediaId: string;
};

export const POST_MEDIA_FIXTURES: PostMediaFixture[] = [
  { postId: "post-1", mediaId: "media-1", order: 0, isFreePreview: true },
  { postId: "post-1", mediaId: "media-2", order: 1, isFreePreview: false },
  { postId: "post-2", mediaId: "media-3", order: 0, isFreePreview: true },
  { postId: "post-3", mediaId: "media-4", order: 0, isFreePreview: false },
];

export const seedPostFixtures = async (
  channels: Channel[],
  media: Media[],
  subreddits?: Subreddit[]
) => {
  const dataSource = getTestDataSource();
  const postRepo = dataSource.getRepository(PostEntity);
  const postMediaRepo = dataSource.getRepository(PostMediaEntity);
  const now = new Date().toISOString();

  const createdPosts: Post[] = [];

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of POST_FIXTURES) {
    const channel = channels.find((c) => c.id === fixture.channelId);
    if (!channel) {
      continue;
    }

    // eslint-disable-next-line functional/no-let
    let post = await postRepo.findOne({ where: { id: fixture.id } });
    if (!post) {
      post = postRepo.create({
        id: fixture.id,
        channelId: fixture.channelId,
        channel,
        subredditId: fixture.subredditId,
        subreddit: fixture.subredditId
          ? subreddits?.find((s) => s.id === fixture.subredditId)
          : undefined,
        caption: fixture.caption,
        status: fixture.status,
        date: fixture.date,
        createdAt: now,
        updatedAt: now,
      });
      post = await postRepo.save(post);
    }
    createdPosts.push(post);
  }

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of POST_MEDIA_FIXTURES) {
    const post = createdPosts.find((p) => p.id === fixture.postId);
    const mediaItem = media.find((m) => m.id === fixture.mediaId);

    if (!post || !mediaItem) {
      continue;
    }

    const existing = await postMediaRepo.findOne({
      where: { post: { id: post.id }, media: { id: mediaItem.id } },
    });

    if (!existing) {
      const postMedia = postMediaRepo.create({
        post,
        media: mediaItem,
        order: fixture.order,
        isFreePreview: fixture.isFreePreview,
      });
      await postMediaRepo.save(postMedia);
    }
  }

  return {
    posts: await postRepo.find({
      relations: { channel: true, subreddit: true, postMedia: { media: true } },
    }),
    postMedia: await postMediaRepo.find({
      relations: { post: true, media: true },
    }),
  };
};

