import { t } from "elysia";
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
import type { Channel } from "../channels/entity";
import type { Media } from "../library/entity";
import { MediaSchema } from "../library/entity";
import { Subreddit } from "../subreddits/entity";

export type PostStatus = "draft" | "scheduled" | "posted";

@Entity()
// eslint-disable-next-line functional/no-classes
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  createdAt!: string;

  @Column("varchar")
  updatedAt!: string;

  @Column("varchar", { nullable: true })
  scheduleId: string | null = null;

  @Column("varchar", { nullable: true })
  caption: string | null = null;

  @Column("varchar")
  date!: string;

  @Column("varchar", { nullable: true })
  url: string | null = null;

  @Column("varchar", { nullable: true })
  fanslyStatisticsId: string | null = null;

  @Column("datetime", { nullable: true })
  fypRemovedAt!: Date | null;

  @Column({
    type: "varchar",
    enum: ["draft", "scheduled", "posted"],
  })
  status!: PostStatus;

  @ManyToOne("Channel")
  @JoinColumn({ name: "channelId" })
  channel!: Channel;
  @Column("varchar")
  channelId!: string;

  @ManyToOne(() => Subreddit)
  @JoinColumn({ name: "subredditId" })
  subreddit?: Subreddit;
  @Column("varchar", { nullable: true })
  subredditId: string | null = null;

  @OneToMany(() => PostMedia, (mediaOrder) => mediaOrder.post)
  postMedia!: PostMedia[];

  @OneToMany(
    "FanslyAnalyticsDatapoint",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fanslyAnalyticsDatapoint: any) => fanslyAnalyticsDatapoint.post
  )
  fanslyAnalyticsDatapoints!: FanslyAnalyticsDatapoint[];

  @OneToOne(
    "FanslyAnalyticsAggregate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fanslyAnalyticsAggregate: any) => fanslyAnalyticsAggregate.post
  )
  fanslyAnalyticsAggregate?: FanslyAnalyticsAggregate;
}

@Entity()
// eslint-disable-next-line functional/no-classes
export class PostMedia {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("int")
  order!: number;

  @Column("boolean", { default: false })
  isFreePreview!: boolean;

  @ManyToOne(() => Post, (post) => post.postMedia, { onDelete: "CASCADE" })
  @JoinColumn()
  post!: Post;

  @ManyToOne("Media", 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (media: any) => media.postMedia, { onDelete: "CASCADE" })
  @JoinColumn()
  media!: Media;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export type PostWithoutRelations = Omit<Post, "channel" | "media" | "subreddit">;

export const PostStatusSchema = t.Union([
  t.Literal('draft'),
  t.Literal('scheduled'),
  t.Literal('posted'),
]);

export const PostMediaSchema = t.Object({
  id: t.String(),
  order: t.Number(),
  isFreePreview: t.Boolean(),
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
  fanslyStatisticsId: t.Nullable(t.String()),
  fypRemovedAt: t.Nullable(t.Date()),
  status: PostStatusSchema,
  channelId: t.String(),
  subredditId: t.Nullable(t.String()),
});
