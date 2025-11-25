import { t } from "elysia";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Channel } from "../channels/entity";

@Entity("CaptionSnippet")
// eslint-disable-next-line functional/no-classes
export class CaptionSnippet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text")
  content!: string;

  @Column("uuid", { nullable: true })
  channelId?: string;

  @ManyToOne("Channel", { nullable: true })
  @JoinColumn({ name: "channelId" })
  channel: Channel | null = null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const CaptionSnippetSchema = t.Object({
  id: t.String(),
  name: t.String(),
  content: t.String(),
  channelId: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});



