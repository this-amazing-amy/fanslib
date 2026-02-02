import { z } from "zod";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Channel, ChannelSchema } from "../channels/entity";

export const VERIFICATION_STATUS = {
  UNKNOWN: "UNKNOWN",
  NOT_NEEDED: "NOT_NEEDED",
  NEEDED: "NEEDED",
  APPLIED: "APPLIED",
  REJECTED: "REJECTED",
  VERIFIED: "VERIFIED",
} as const;

export const VerificationStatusSchema = z.union([
  z.literal(VERIFICATION_STATUS.UNKNOWN),
  z.literal(VERIFICATION_STATUS.NOT_NEEDED),
  z.literal(VERIFICATION_STATUS.NEEDED),
  z.literal(VERIFICATION_STATUS.APPLIED),
  z.literal(VERIFICATION_STATUS.REJECTED),
  z.literal(VERIFICATION_STATUS.VERIFIED),
]);

@Entity("subreddit")
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
  eligibleMediaFilter: unknown | null = null;

  @Column({ type: "varchar", default: VERIFICATION_STATUS.UNKNOWN, name: "verificationStatus" })
  verificationStatus!: z.infer<typeof VerificationStatusSchema>;

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

  @Column({ type: "varchar", nullable: true, name: "channelId" })
  channelId: string | null = null;

  @OneToOne(() => Channel, { eager: true, nullable: true })
  @JoinColumn({ name: "channelId" })
  channel: Channel | null = null;
}

const PostingTimeSchema = z.object({
  day: z.number(),
  hour: z.number(),
  posts: z.number(),
  score: z.number(),
});

export const SubredditSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxPostFrequencyHours: z.number().nullable(),
  notes: z.string().nullable(),
  memberCount: z.number().nullable(),
  eligibleMediaFilter: z.unknown().nullable(),
  verificationStatus: VerificationStatusSchema,
  defaultFlair: z.string().nullable(),
  captionPrefix: z.string().nullable(),
  postingTimesData: z.array(PostingTimeSchema).nullable(),
  postingTimesLastFetched: z.coerce.date().nullable(),
  postingTimesTimezone: z.string().nullable(),
  channelId: z.string().nullable(),
  channel: ChannelSchema.nullable(),
});

export type Subreddit_Type = z.infer<typeof SubredditSchema>;
