import { z } from "zod";
import type { Relation } from "typeorm";
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
import { Channel } from "../channels/entity";

@Entity("hashtag")
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
export class HashtagChannelStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Hashtag, (hashtag) => hashtag.channelStats, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hashtagId" })
  hashtag!: Relation<Hashtag>;

  @Column({ type: "int", name: "hashtagId" })
  hashtagId!: number;

  @ManyToOne(() => Channel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel!: Relation<Channel>;

  @Column({ type: "varchar", name: "channelId" })
  channelId!: string;

  @Column({ type: "int", default: 0, name: "views" })
  views!: number;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export const HashtagChannelStatsSchema = z.object({
  id: z.number(),
  hashtagId: z.number(),
  channelId: z.string(),
  views: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const HashtagSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  channelStats: z.array(HashtagChannelStatsSchema).optional(),
});

export type Hashtag_Type = z.infer<typeof HashtagSchema>;
export type HashtagChannelStats_Type = z.infer<typeof HashtagChannelStatsSchema>;
