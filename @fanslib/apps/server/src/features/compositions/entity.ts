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
import { Shoot } from "../shoots/entity";

@Entity("composition")
export class Composition {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "shootId" })
  shootId!: string;

  @ManyToOne(() => Shoot, { onDelete: "CASCADE" })
  @JoinColumn({ name: "shootId" })
  shoot!: Relation<Shoot>;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "simple-json", name: "segments", default: "[]" })
  segments: unknown[] = [];

  @Column({ type: "simple-json", name: "tracks", default: "[]" })
  tracks: unknown[] = [];

  @Column({ type: "simple-json", name: "exportRegions", default: "[]" })
  exportRegions: unknown[] = [];

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

const SegmentTransitionSchema = z.object({
  type: z.literal("crossfade"),
  durationFrames: z.number(),
  easing: z.string().optional(),
});

export const SegmentSchema = z.object({
  id: z.string(),
  sourceMediaId: z.string(),
  sourceStartFrame: z.number(),
  sourceEndFrame: z.number(),
  transition: SegmentTransitionSchema.optional(),
});

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  operations: z.array(z.unknown()),
});

export const ExportRegionSchema = z.object({
  id: z.string(),
  startFrame: z.number(),
  endFrame: z.number(),
  package: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  contentRating: z.string().nullable().optional(),
  quality: z.string().nullable().optional(),
});

export const CompositionSchema = z.object({
  id: z.string(),
  shootId: z.string(),
  name: z.string(),
  segments: z.array(SegmentSchema),
  tracks: z.array(TrackSchema),
  exportRegions: z.array(ExportRegionSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
