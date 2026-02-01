import { z } from "zod";
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

export const CaptionSnippetSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  channelId: z.union([z.string(), z.null()]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CaptionSnippet_Type = z.infer<typeof CaptionSnippetSchema>;
