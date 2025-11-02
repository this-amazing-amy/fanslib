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
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "../analytics/entity";
import { Channel } from "../channels/entity";
import { Media } from "../library/entity";
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
  scheduleId?: string;

  @Column("varchar", { nullable: true })
  caption?: string;

  @Column("varchar")
  date!: string;

  @Column("varchar", { nullable: true })
  url?: string;

  @Column("varchar", { nullable: true })
  fanslyStatisticsId?: string;

  @Column("datetime", { nullable: true })
  fypRemovedAt!: Date | null;

  @Column({
    type: "varchar",
    enum: ["draft", "scheduled", "posted"],
  })
  status!: PostStatus;

  @ManyToOne(() => Channel)
  @JoinColumn({ name: "channelId" })
  channel!: Channel;
  @Column("varchar")
  channelId!: string;

  @ManyToOne(() => Subreddit)
  @JoinColumn({ name: "subredditId" })
  subreddit?: Subreddit;
  @Column("varchar", { nullable: true })
  subredditId?: string;

  @OneToMany(() => PostMedia, (mediaOrder) => mediaOrder.post)
  postMedia!: PostMedia[];

  @OneToMany(
    () => FanslyAnalyticsDatapoint,
    (fanslyAnalyticsDatapoint) => fanslyAnalyticsDatapoint.post
  )
  fanslyAnalyticsDatapoints!: FanslyAnalyticsDatapoint[];

  @OneToOne(
    () => FanslyAnalyticsAggregate,
    (fanslyAnalyticsAggregate) => fanslyAnalyticsAggregate.post
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

  @ManyToOne(() => Media, (media) => media.postMedia, { onDelete: "CASCADE" })
  @JoinColumn()
  media!: Media;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export type PostWithoutRelations = Omit<Post, "channel" | "media" | "subreddit">;
