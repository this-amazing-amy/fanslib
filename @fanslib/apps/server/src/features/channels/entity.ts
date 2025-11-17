import { t } from "elysia";
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
import type { Hashtag } from "../hashtags/entity";
import { HashtagSchema } from "../hashtags/entity";
import type { MediaFilterSchema } from "../library/schemas/media-filter";

@Entity()
// eslint-disable-next-line functional/no-classes
export class ChannelType {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  color: string | null = null;
}

@Entity()
// eslint-disable-next-line functional/no-classes
export class Channel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  description: string | null = null;

  @Column("varchar")
  typeId!: string;

  @Column("simple-json", { nullable: true })
  eligibleMediaFilter: typeof MediaFilterSchema.static | null = null;

  @ManyToOne(() => ChannelType)
  @JoinColumn({ name: "typeId" })
  type!: ChannelType;

  @ManyToMany("Hashtag")
  @JoinTable({
    name: "channel_default_hashtags",
    joinColumn: { name: "channelId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "hashtagId", referencedColumnName: "id" },
  })
  defaultHashtags!: Hashtag[];
}

export type ChannelWithoutRelations = Omit<Channel, "type">;

export const ChannelTypeSchema = t.Object({
  id: t.String(),
  name: t.String(),
  color: t.Nullable(t.String()),
});

export const ChannelSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  typeId: t.String(),
  eligibleMediaFilter: t.Nullable(t.Any()), // MediaFilters - complex type, using Any for now
  defaultHashtags: t.Array(HashtagSchema),
  type: ChannelTypeSchema,
});
