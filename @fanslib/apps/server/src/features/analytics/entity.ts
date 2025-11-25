/* eslint-disable functional/no-classes */
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("fansly_analytics_datapoint")
export class FanslyAnalyticsDatapoint {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("int")
  timestamp!: number;

  @Column("int")
  views!: number;

  @Column("int")
  interactionTime!: number;

  @ManyToOne("Post", { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post!: unknown;

  @Column("varchar")
  postId!: string;
}

@Entity("fansly_analytics_aggregate")
export class FanslyAnalyticsAggregate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("int")
  totalViews!: number;

  @Column("float")
  averageEngagementSeconds!: number;

  @Column("float", { default: 0 })
  averageEngagementPercent!: number;

  @Column("float", { nullable: true })
  fypPerformanceScore?: number;

  @Column("json", { nullable: true })
  fypMetrics?: {
    viewVelocity: number;
    sustainedGrowth: number;
    plateauPoint: number;
    isUnderperforming: boolean;
  };

  @Column("datetime", { nullable: true })
  fypPlateauDetectedAt?: Date | undefined;

  @OneToOne("Post", { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post!: unknown;

  @Column("varchar")
  postId!: string;
}

@Entity("analytics_fetch_history")
export class AnalyticsFetchHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  timeframeIdentifier!: string;

  @Column("varchar")
  postId!: string;

  @Column("datetime")
  fetchedAt!: Date;

  @Column("datetime", { nullable: true })
  expiresAt?: Date;

  @Column("varchar")
  timeframeType!: "rolling" | "fixed";

  @ManyToOne("Post", { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post!: unknown;
}



