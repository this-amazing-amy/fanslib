import type { MediaFilters } from "@fanslib/types";
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

@Entity()
// eslint-disable-next-line functional/no-classes
export class ChannelType {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  color?: string;
}

@Entity()
// eslint-disable-next-line functional/no-classes
export class Channel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  description?: string;

  @Column("varchar")
  typeId!: string;

  @Column("simple-json", { nullable: true })
  eligibleMediaFilter?: MediaFilters;

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
