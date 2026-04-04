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
import { Media } from "../library/entity";

export type MediaEditType = "transform" | "clip";
export type MediaEditStatus = "draft" | "queued" | "rendering" | "completed" | "failed";

@Entity("media_edit")
export class MediaEdit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "sourceMediaId" })
  sourceMediaId!: string;

  @ManyToOne(() => Media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sourceMediaId" })
  sourceMedia!: Relation<Media>;

  @Column({ type: "varchar", nullable: true, name: "outputMediaId" })
  outputMediaId: string | null = null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "outputMediaId" })
  outputMedia!: Relation<Media> | null;

  @Column({ type: "varchar", name: "type" })
  type!: MediaEditType;

  @Column({ type: "simple-json", name: "operations" })
  operations!: unknown[];

  @Column({ type: "varchar", default: "draft", name: "status" })
  status: MediaEditStatus = "draft";

  @Column({ type: "text", nullable: true, name: "error" })
  error: string | null = null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export const MediaEditTypeSchema = z.enum(["transform", "clip"]);
export const MediaEditStatusSchema = z.enum([
  "draft",
  "queued",
  "rendering",
  "completed",
  "failed",
]);

export const MediaEditSchema = z.object({
  id: z.string(),
  sourceMediaId: z.string(),
  outputMediaId: z.string().nullable(),
  type: MediaEditTypeSchema,
  operations: z.array(z.unknown()),
  status: MediaEditStatusSchema,
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
