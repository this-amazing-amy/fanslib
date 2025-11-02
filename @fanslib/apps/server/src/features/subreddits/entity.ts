import type { MediaFilters } from "@fanslib/types";
import { VERIFICATION_STATUS, type VerificationStatus } from "@fanslib/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
  verificationStatus!: VerificationStatus;

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

