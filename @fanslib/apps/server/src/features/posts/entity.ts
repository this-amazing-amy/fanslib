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
import { Media } from "../library/entity";
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

  @Column({ type: "varchar", nullable: true, name: "blueskyPostUri" })
  blueskyPostUri: string | null = null;

  @Column({ type: "text", nullable: true, name: "blueskyPostError" })
  blueskyPostError: string | null = null;

  @Column({ type: "int", default: 0, name: "blueskyRetryCount" })
  blueskyRetryCount: number = 0;

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

export { PostStatusSchema, PostMediaSchema, PostMediaWithMediaSchema, PostSchema } from "./schema";
