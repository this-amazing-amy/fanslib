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

@Entity()
// eslint-disable-next-line functional/no-classes
export class Subreddit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("int", { nullable: true })
  maxPostFrequencyHours: number | null = null;

  @Column("text", { nullable: true })
  notes: string | null = null;

  @Column("int", { nullable: true })
  memberCount: number | null = null;

  @Column("simple-json", { nullable: true })
  eligibleMediaFilter: MediaFilters | null = null;

  @Column("varchar", { default: VERIFICATION_STATUS.UNKNOWN })
  verificationStatus!: typeof VerificatoinStatusSchema.static;

  @Column("varchar", { nullable: true })
  defaultFlair: string | null = null;

  @Column("varchar", { nullable: true })
  captionPrefix: string | null = null;

  @Column("simple-json", { nullable: true })
  postingTimesData: Array<{
    day: number;
    hour: number;
    posts: number;
    score: number;
  }> | null = null;

  @Column("datetime", { nullable: true })
  postingTimesLastFetched: Date | null = null;

  @Column("varchar", { nullable: true })
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

