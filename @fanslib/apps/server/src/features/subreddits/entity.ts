import { t } from "elysia";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { MediaFilterSchema } from "../library/schemas/media-filter";

type MediaFilters = typeof MediaFilterSchema.static;

export const VERIFICATION_STATUS = {
  UNKNOWN: "UNKNOWN",
  NOT_NEEDED: "NOT_NEEDED",
  NEEDED: "NEEDED",
  APPLIED: "APPLIED",
  REJECTED: "REJECTED",
  VERIFIED: "VERIFIED",
} as const;

export const VerificatoinStatusSchema = t.Union([t.Literal(VERIFICATION_STATUS.UNKNOWN), t.Literal(VERIFICATION_STATUS.NOT_NEEDED), t.Literal(VERIFICATION_STATUS.NEEDED), t.Literal(VERIFICATION_STATUS.APPLIED), t.Literal(VERIFICATION_STATUS.REJECTED), t.Literal(VERIFICATION_STATUS.VERIFIED)]);

@Entity("subreddit")
// eslint-disable-next-line functional/no-classes
export class Subreddit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "int", nullable: true, name: "maxPostFrequencyHours" })
  maxPostFrequencyHours: number | null = null;

  @Column({ type: "text", nullable: true, name: "notes" })
  notes: string | null = null;

  @Column({ type: "int", nullable: true, name: "memberCount" })
  memberCount: number | null = null;

  @Column({ type: "simple-json", nullable: true, name: "eligibleMediaFilter" })
  eligibleMediaFilter: MediaFilters | null = null;

  @Column({ type: "varchar", default: VERIFICATION_STATUS.UNKNOWN, name: "verificationStatus" })
  verificationStatus!: typeof VerificatoinStatusSchema.static;

  @Column({ type: "varchar", nullable: true, name: "defaultFlair" })
  defaultFlair: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "captionPrefix" })
  captionPrefix: string | null = null;

  @Column({ type: "simple-json", nullable: true, name: "postingTimesData" })
  postingTimesData: Array<{
    day: number;
    hour: number;
    posts: number;
    score: number;
  }> | null = null;

  @Column({ type: "datetime", nullable: true, name: "postingTimesLastFetched" })
  postingTimesLastFetched: Date | null = null;

  @Column({ type: "varchar", nullable: true, name: "postingTimesTimezone" })
  postingTimesTimezone: string | null = null;
}

export const SubredditSchema = t.Object({
  id: t.String(),
  name: t.String(),
  maxPostFrequencyHours: t.Nullable(t.Number()),
  notes: t.Nullable(t.String()),
  memberCount: t.Nullable(t.Number()),
  eligibleMediaFilter: t.Nullable(t.Any()),
  verificationStatus: VerificatoinStatusSchema,
  defaultFlair: t.Nullable(t.String()),
  captionPrefix: t.Nullable(t.String()),
  postingTimesData: t.Nullable(t.Array(t.Object({
    day: t.Number(),
    hour: t.Number(),
    posts: t.Number(),
    score: t.Number(),
  }))),
  postingTimesLastFetched: t.Nullable(t.Date()),
  postingTimesTimezone: t.Nullable(t.String()),
});

