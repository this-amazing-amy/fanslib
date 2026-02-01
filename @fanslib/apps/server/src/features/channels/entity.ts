import { z } from "zod";
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Hashtag } from "../hashtags/entity";

@Entity("channel_type")
export class ChannelType {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  color: string | null = null;
}

@Entity("channel")
export class Channel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  description: string | null = null;

  @Column({ type: "varchar", name: "typeId" })
  typeId!: string;

  @Column({ type: "simple-json", nullable: true, name: "eligibleMediaFilter" })
  eligibleMediaFilter: unknown | null = null;

  @ManyToOne(() => ChannelType)
  @JoinColumn({ name: "typeId" })
  type!: ChannelType;

  @ManyToMany(() => Hashtag)
  @JoinTable({
    name: "channel_default_hashtags",
    joinColumn: { name: "channelId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "hashtagId", referencedColumnName: "id" },
  })
  defaultHashtags!: Hashtag[];
}

export type ChannelWithoutRelations = Omit<Channel, "type">;

export const ChannelTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
});

export const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  typeId: z.string(),
  eligibleMediaFilter: z.unknown().nullable(),
  defaultHashtags: z.unknown(),
  type: ChannelTypeSchema,
});

export type Channel_Type = z.infer<typeof ChannelSchema>;
export type ChannelType_Type = z.infer<typeof ChannelTypeSchema>;
