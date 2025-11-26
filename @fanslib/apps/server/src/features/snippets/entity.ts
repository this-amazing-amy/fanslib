import { t } from "elysia";
import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Channel } from "../channels/entity";

@Entity("caption_snippet")
// eslint-disable-next-line functional/no-classes
export class CaptionSnippet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "text", name: "content" })
  content!: string;

  @Column({ type: "uuid", nullable: true, name: "channelId" })
  channelId?: string;

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn({ name: "channelId" })
  channel: Relation<Channel> | null = null;

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt" })
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



