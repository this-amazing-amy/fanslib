/* eslint-disable functional/no-classes */
import { z } from "zod";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import type { PostMedia } from "../posts/entity";

export type CandidateStatus = "pending" | "matched" | "ignored";
export type MatchMethod = "exact_filename" | "fuzzy_filename" | "manual" | "auto_detected";
export type FanslyMediaType = "image" | "video";

@Entity("fansly_media_candidate")
export class FanslyMediaCandidate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // From Fansly API
  @Column({ type: "varchar", unique: true })
  fanslyStatisticsId!: string;

  @Column({ type: "varchar" })
  fanslyPostId!: string;

  @Column({ type: "varchar" })
  filename!: string;

  @Column({ type: "varchar", nullable: true })
  caption: string | null = null;

  @Column({ type: "bigint" })
  fanslyCreatedAt!: number;

  @Column({ type: "int" })
  position!: number;

  @Column({ type: "varchar" })
  mediaType!: FanslyMediaType;

  // Matching state
  @Column({ type: "varchar", default: "pending" })
  status!: CandidateStatus;

  @Column({ type: "varchar", nullable: true })
  matchedPostMediaId: string | null = null;

  @OneToOne("PostMedia", { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "matchedPostMediaId" })
  matchedPostMedia?: Relation<PostMedia>;

  @Column({ type: "float", nullable: true })
  matchConfidence: number | null = null;

  @Column({ type: "varchar", nullable: true })
  matchMethod: MatchMethod | null = null;

  // Timestamps
  @CreateDateColumn({ name: "capturedAt" })
  capturedAt!: Date;

  @Column({ type: "datetime", nullable: true })
  matchedAt: Date | null = null;
}

// Schemas for API validation
export const CandidateStatusSchema = z.enum(["pending", "matched", "ignored"]);

export const MatchMethodSchema = z.enum([
  "exact_filename",
  "fuzzy_filename",
  "manual",
  "auto_detected",
]);

export const FanslyMediaTypeSchema = z.enum(["image", "video"]);

export const FanslyMediaCandidateSchema = z.object({
  id: z.string(),
  fanslyStatisticsId: z.string(),
  fanslyPostId: z.string(),
  filename: z.string(),
  caption: z.string().nullable(),
  fanslyCreatedAt: z.number(),
  position: z.number(),
  mediaType: FanslyMediaTypeSchema,
  status: CandidateStatusSchema,
  matchedPostMediaId: z.string().nullable(),
  matchConfidence: z.number().nullable(),
  matchMethod: MatchMethodSchema.nullable(),
  capturedAt: z.date(),
  matchedAt: z.date().nullable(),
});

// Schema for incoming candidates from Chrome extension
export const CreateCandidateSchema = z.object({
  fanslyStatisticsId: z.string(),
  fanslyPostId: z.string(),
  filename: z.string(),
  caption: z.string().nullable(),
  fanslyCreatedAt: z.number(),
  position: z.number(),
  mediaType: FanslyMediaTypeSchema,
});

export const MatchSuggestionSchema = z.object({
  postMediaId: z.string(),
  confidence: z.number(),
  method: MatchMethodSchema,
  filename: z.string(),
  caption: z.string().optional(),
});

