import { t } from "elysia";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Channel } from "../channels/entity";

@Entity()
// eslint-disable-next-line functional/no-classes
export class Hashtag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { unique: true })
  name!: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;

  @OneToMany(() => HashtagChannelStats, (stats) => stats.hashtag)
  channelStats!: HashtagChannelStats[];
}

@Entity()
@Unique(["hashtag", "channel"])
// eslint-disable-next-line functional/no-classes
export class HashtagChannelStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Hashtag, (hashtag) => hashtag.channelStats)
  @JoinColumn({ name: "hashtagId" })
  hashtag!: Hashtag;

  @Column("int")
  hashtagId!: number;

  @ManyToOne("Channel")
  @JoinColumn({ name: "channelId" })
  channel!: Channel;

  @Column("varchar")
  channelId!: string;

  @Column("int", { default: 0 })
  views!: number;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}

export const HashtagChannelStatsSchema = t.Object({
  id: t.Number(),
  hashtagId: t.Number(),
  channelId: t.String(),
  views: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const HashtagSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  channelStats: t.Optional(t.Array(HashtagChannelStatsSchema)),
});



