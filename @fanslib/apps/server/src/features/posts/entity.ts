import { t } from "elysia";
import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "../analytics/entity";
import type { FanslyMediaCandidate } from "../analytics/candidate-entity";
import { Channel } from "../channels/entity";
import { ContentSchedule } from "../content-schedules/entity";
import { Media, MediaSchema } from "../library/entity";
import { Subreddit } from "../subreddits/entity";

export type PostStatus = "draft" | "ready" | "scheduled" | "posted";

@Entity("post")
// eslint-disable-next-line functional/no-classes
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "createdAt" })
  createdAt!: string;

  @Column({ type: "varchar", name: "updatedAt" })
  updatedAt!: string;

  @Column({ type: "varchar", nullable: true, name: "scheduleId" })
  scheduleId: string | null = null;

  @ManyToOne(() => ContentSchedule)
  @JoinColumn({ name: "scheduleId" })
  schedule?: Relation<ContentSchedule>;

  @Column({ type: "varchar", nullable: true, name: "caption" })
  caption: string | null = null;

  @Column({ type: "varchar", name: "date" })
  date!: string;

  @Column({ type: "varchar", nullable: true, name: "url" })
  url: string | null = null;

  @Column({ type: "datetime", nullable: true, name: "fypRemovedAt" })
  fypRemovedAt!: Date | null;

  @Column({ type: "datetime", nullable: true, name: "postponeBlueskyDraftedAt" })
  postponeBlueskyDraftedAt!: Date | null;

  @Column({
    type: "varchar",
    enum: ["draft", "ready", "scheduled", "posted"],
    name: "status",
  })
  status!: PostStatus;

  @ManyToOne(() => Channel)
  @JoinColumn({ name: "channelId" })
  channel!: Relation<Channel>;
  @Column({ type: "varchar", name: "channelId" })
  channelId!: string;

  @ManyToOne(() => Subreddit)
  @JoinColumn({ name: "subredditId" })
  subreddit?: Subreddit;
  @Column({ type: "varchar", nullable: true, name: "subredditId" })
  subredditId: string | null = null;

  @OneToMany(() => PostMedia, (mediaOrder) => mediaOrder.post)
  postMedia!: Relation<PostMedia>[];
}

@Entity("post_media")
// eslint-disable-next-line functional/no-classes
export class PostMedia {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int", name: "order" })
  order!: number;

  @Column({ type: "boolean", default: false, name: "isFreePreview" })
  isFreePreview!: boolean;

  @Column({ type: "varchar", nullable: true, name: "fanslyStatisticsId" })
  fanslyStatisticsId: string | null = null;

  @ManyToOne(() => Post, (post) => post.postMedia, { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post!: Post;

  @ManyToOne(() => Media,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (media: any) => media.postMedia, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mediaId" })
  media!: Relation<Media>;

  @OneToMany(
    "FanslyAnalyticsDatapoint",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fanslyAnalyticsDatapoint: any) => fanslyAnalyticsDatapoint.postMedia
  )
  fanslyAnalyticsDatapoints!: Relation<FanslyAnalyticsDatapoint>[];

  @OneToOne(
    "FanslyAnalyticsAggregate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fanslyAnalyticsAggregate: any) => fanslyAnalyticsAggregate.postMedia
  )
  fanslyAnalyticsAggregate?: Relation<FanslyAnalyticsAggregate>;

  @OneToOne(
    "FanslyMediaCandidate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fanslyMediaCandidate: any) => fanslyMediaCandidate.matchedPostMedia
  )
  matchedFromCandidate?: Relation<FanslyMediaCandidate>;

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt!: Date;
}

export type PostWithoutRelations = Omit<Post, "channel" | "media" | "subreddit">;

export const PostStatusSchema = t.Union([
  t.Literal('draft'),
  t.Literal('ready'),
  t.Literal('scheduled'),
  t.Literal('posted'),
]);

export const PostMediaSchema = t.Object({
  id: t.String(),
  order: t.Number(),
  isFreePreview: t.Boolean(),
  fanslyStatisticsId: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const PostMediaWithMediaSchema = t.Composite([
  PostMediaSchema,
  t.Object({
    media: MediaSchema,
  }),
]);

export const PostSchema = t.Object({
  id: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  scheduleId: t.Nullable(t.String()),
  caption: t.Nullable(t.String()),
  date: t.String(),
  url: t.Nullable(t.String()),
  fypRemovedAt: t.Nullable(t.Date()),
  postponeBlueskyDraftedAt: t.Nullable(t.Date()),
  status: PostStatusSchema,
  channelId: t.String(),
  subredditId: t.Nullable(t.String()),
});
