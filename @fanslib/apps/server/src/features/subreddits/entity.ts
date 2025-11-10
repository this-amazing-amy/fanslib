import { t } from "elysia";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { MediaFilters } from "../../../../../libraries/types/src/features/library/filters";

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
  maxPostFrequencyHours?: number;

  @Column("text", { nullable: true })
  notes?: string;

  @Column("int", { nullable: true })
  memberCount?: number;

  @Column("simple-json", { nullable: true })
  eligibleMediaFilter?: MediaFilters;

  @Column("varchar", { default: VERIFICATION_STATUS.UNKNOWN })
  verificationStatus!: typeof VerificatoinStatusSchema.static;

  @Column("varchar", { nullable: true })
  defaultFlair?: string;

  @Column("varchar", { nullable: true })
  captionPrefix?: string;

  @Column("simple-json", { nullable: true })
  postingTimesData?: Array<{
    day: number;
    hour: number;
    posts: number;
    score: number;
  }>;

  @Column("datetime", { nullable: true })
  postingTimesLastFetched?: Date;

  @Column("varchar", { nullable: true })
  postingTimesTimezone?: string;
}

export const SubredditSchema = t.Object({
  id: t.String(),
  name: t.String(),
  maxPostFrequencyHours: t.Optional(t.Number()),
  notes: t.Optional(t.String()),
  memberCount: t.Optional(t.Number()),
  eligibleMediaFilter: t.Optional(t.Any()),
  verificationStatus: VerificatoinStatusSchema,
  defaultFlair: t.Optional(t.String()),
  captionPrefix: t.Optional(t.String()),
  postingTimesData: t.Optional(t.Array(t.Object({
    day: t.Number(),
    hour: t.Number(),
    posts: t.Number(),
    score: t.Number(),
  }))),
  postingTimesLastFetched: t.Optional(t.Date()),
  postingTimesTimezone: t.Optional(t.String()),
});

