/* eslint-disable functional/no-classes */
import { t } from "elysia";
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
export const CandidateStatusSchema = t.Union([
  t.Literal("pending"),
  t.Literal("matched"),
  t.Literal("ignored"),
]);

export const MatchMethodSchema = t.Union([
  t.Literal("exact_filename"),
  t.Literal("fuzzy_filename"),
  t.Literal("manual"),
  t.Literal("auto_detected"),
]);

export const FanslyMediaTypeSchema = t.Union([
  t.Literal("image"),
  t.Literal("video"),
]);

export const FanslyMediaCandidateSchema = t.Object({
  id: t.String(),
  fanslyStatisticsId: t.String(),
  fanslyPostId: t.String(),
  filename: t.String(),
  caption: t.Nullable(t.String()),
  fanslyCreatedAt: t.Number(),
  position: t.Number(),
  mediaType: FanslyMediaTypeSchema,
  status: CandidateStatusSchema,
  matchedPostMediaId: t.Nullable(t.String()),
  matchConfidence: t.Nullable(t.Number()),
  matchMethod: t.Nullable(MatchMethodSchema),
  capturedAt: t.Date(),
  matchedAt: t.Nullable(t.Date()),
});

// Schema for incoming candidates from Chrome extension
export const CreateCandidateSchema = t.Object({
  fanslyStatisticsId: t.String(),
  fanslyPostId: t.String(),
  filename: t.String(),
  caption: t.Nullable(t.String()),
  fanslyCreatedAt: t.Number(),
  position: t.Number(),
  mediaType: FanslyMediaTypeSchema,
});

export const MatchSuggestionSchema = t.Object({
  postMediaId: t.String(),
  confidence: t.Number(),
  method: MatchMethodSchema,
  filename: t.String(),
  caption: t.Optional(t.String()),
});

