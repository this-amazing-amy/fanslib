import type { z } from "zod";
import { Between, In } from "typeorm";
import type { FindOptionsWhere } from "typeorm";
import { db } from "../../../lib/db";
import { Post } from "../../posts/entity";
import { fetchPostsByMediaId } from "../../posts/operations/post/fetch-by-media-id";
import { fetchPostsByShootId } from "../../shoots/operations/shoot/fetch-posts-by-shoot-id";
import type {
  CaptionQueueItemSchema,
  FetchCaptionQueueRequestQuerySchema,
} from "../schema";

type CaptionQueueItem = z.infer<typeof CaptionQueueItemSchema>;

const uniqueByPostId = <T extends { postId: string }>(items: T[]): T[] =>
  items.reduce<T[]>((acc, item) => (acc.some((entry) => entry.postId === item.postId) ? acc : [...acc, item]), []);

type PostWithChannel = {
  id: string;
  caption: string | null;
  date: Date;
  channel: {
    name: string;
    type: { id: string };
  };
};

const formatRelatedCaption = (post: PostWithChannel) => ({
  postId: post.id,
  caption: post.caption ?? null,
  channelName: post.channel.name,
  channelTypeId: post.channel.type.id,
  date: post.date,
});

export const fetchCaptionQueue = async (
  query: z.infer<typeof FetchCaptionQueueRequestQuerySchema>
): Promise<CaptionQueueItem[]> => {
  const dataSource = await db();
  const postRepo = dataSource.getRepository(Post);

  const channelIds = query.channelIds.split(",").filter((value) => value.length > 0);

  const whereConditions: FindOptionsWhere<Post> = {
    status: "draft",
  };

  if (channelIds.length > 0) {
    whereConditions.channelId = In(channelIds);
  }

  if (query.fromDate && query.toDate) {
    whereConditions.date = Between(new Date(query.fromDate), new Date(query.toDate));
  }

  const posts = await postRepo.find({
    where: whereConditions,
    relations: {
      postMedia: {
        media: {
          shoots: true,
        },
      },
      channel: {
        type: true,
        defaultHashtags: true,
      },
      subreddit: true,
      schedule: true,
    },
    order: {
      date: "ASC",
      postMedia: {
        order: "ASC",
      },
    },
  });

  const queue = await Promise.all(
    posts.map(async (post) => {
      const mediaIds = post.postMedia.map((pm) => pm.media?.id).filter((id): id is string => Boolean(id));
      const shootEntries = (post.postMedia as Array<{ media?: { shoots?: Array<{ id: string; name: string }> } }>)
        .flatMap((pm) => pm.media?.shoots ?? [])
        .filter((shoot) => shoot);

      const shootIdToName = new Map(
        shootEntries.map((shoot) => [shoot.id, shoot.name])
      );

      const relatedByMediaPosts = await Promise.all(
        mediaIds.map(async (mediaId) => fetchPostsByMediaId(mediaId))
      );

      const relatedByShootPosts = await Promise.all(
        uniqueByPostId(
          shootEntries.map((shoot) => ({
            postId: shoot.id,
          }))
        ).map(async (entry) => {
          const shootPosts = await fetchPostsByShootId(entry.postId);
          const shootName = shootIdToName.get(entry.postId) ?? "Unknown";
          return shootPosts.map((p) => ({ ...p, shootName }));
        })
      );

      const relatedByMedia = uniqueByPostId(
        relatedByMediaPosts
          .flat()
          .filter((relatedPost) => relatedPost.id !== post.id)
          .filter((relatedPost) => (relatedPost.caption ?? "").trim().length > 0)
          .map(formatRelatedCaption)
      );

      const relatedByShoot = uniqueByPostId(
        relatedByShootPosts
          .flat()
          .filter((relatedPost) => relatedPost.id !== post.id)
          .filter((relatedPost) => (relatedPost.caption ?? "").trim().length > 0)
          .map((relatedPost) => ({
            ...formatRelatedCaption(relatedPost),
            shootName: relatedPost.shootName,
          }))
      );

      const linkedPosts = posts
        .filter((candidate) => candidate.id !== post.id)
        .filter((candidate) => {
          const candidateMediaIds = candidate.postMedia
            .map((pm) => pm.media?.id)
            .filter((id): id is string => Boolean(id));
          return candidateMediaIds.some((id) => mediaIds.includes(id));
        })
        .map((candidate) => ({
          postId: candidate.id,
          caption: candidate.caption ?? null,
          channelName: candidate.channel.name,
          channelTypeId: candidate.channel.type.id,
          date: candidate.date,
        }));

      return {
        post: {
          ...post,
          subreddit: post.subreddit ?? null,
          schedule: post.schedule ?? null,
        },
        relatedByMedia,
        relatedByShoot,
        linkedPosts,
      };
    })
  );

  return queue;
};
