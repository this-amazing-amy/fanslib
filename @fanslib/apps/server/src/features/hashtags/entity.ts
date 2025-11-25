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

@Entity("hashtag")
// eslint-disable-next-line functional/no-classes
export class Hashtag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true, name: "name" })
  name!: string;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;

  @OneToMany(() => HashtagChannelStats, (stats) => stats.hashtag)
  channelStats!: HashtagChannelStats[];
}

@Entity("hashtag_channel_stats")
@Unique(["hashtag", "channel"])
// eslint-disable-next-line functional/no-classes
export class HashtagChannelStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Hashtag, (hashtag) => hashtag.channelStats, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hashtagId" })
  hashtag!: Hashtag;

  @Column({ type: "int", name: "hashtagId" })
  hashtagId!: number;

  @ManyToOne("Channel", { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel!: Channel;

  @Column({ type: "varchar", name: "channelId" })
  channelId!: string;

  @Column({ type: "int", default: 0, name: "views" })
  views!: number;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
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



