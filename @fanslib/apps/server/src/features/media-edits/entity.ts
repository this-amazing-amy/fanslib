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
import { Composition } from "../compositions/entity";

export type MediaEditType = "transform" | "clip" | "composition";
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

  @Column({ type: "simple-json", nullable: true, name: "tracks" })
  tracks: unknown[] | null = null;

  @Column({ type: "varchar", nullable: true, name: "compositionId" })
  compositionId: string | null = null;

  @ManyToOne(() => Composition, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "compositionId" })
  composition!: Relation<Composition> | null;

  @Column({ type: "simple-json", nullable: true, name: "segments" })
  segments: unknown[] | null = null;

  @Column({ type: "simple-json", nullable: true, name: "exportRegion" })
  exportRegion: { startFrame: number; endFrame: number } | null = null;

  @Column({ type: "varchar", nullable: true, name: "package" })
  package: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "role" })
  role: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "contentRating" })
  contentRating: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "quality" })
  quality: string | null = null;

  @Column({ type: "varchar", default: "draft", name: "status" })
  status: MediaEditStatus = "draft";

  @Column({ type: "text", nullable: true, name: "error" })
  error: string | null = null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export const MediaEditTypeSchema = z.enum(["transform", "clip", "composition"]);
export const MediaEditStatusSchema = z.enum([
  "draft",
  "queued",
  "rendering",
  "completed",
  "failed",
]);

import { TrackSchema } from "../../lib/schemas";
export { TrackSchema };

export const ExportRegionSnapshotSchema = z.object({
  startFrame: z.number(),
  endFrame: z.number(),
});

export const MediaEditSchema = z.object({
  id: z.string(),
  sourceMediaId: z.string(),
  outputMediaId: z.string().nullable(),
  compositionId: z.string().nullable(),
  type: MediaEditTypeSchema,
  operations: z.array(z.unknown()),
  tracks: z.array(TrackSchema).nullable(),
  segments: z.array(z.unknown()).nullable(),
  exportRegion: ExportRegionSnapshotSchema.nullable(),
  package: z.string().nullable(),
  role: z.string().nullable(),
  contentRating: z.string().nullable(),
  quality: z.string().nullable(),
  status: MediaEditStatusSchema,
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
