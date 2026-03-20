import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import type { PostMedia } from "../posts/entity";

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

  @ManyToOne("PostMedia", { onDelete: "CASCADE" })
  @JoinColumn({ name: "postMediaId" })
  postMedia!: Relation<PostMedia>;

  @Column("varchar")
  postMediaId!: string;
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

  @Column("datetime", { nullable: true })
  plateauDetectedAt?: Date | undefined;

  @Column("datetime", { nullable: true })
  nextFetchAt?: Date | undefined;

  @OneToOne("PostMedia", { onDelete: "CASCADE" })
  @JoinColumn({ name: "postMediaId" })
  postMedia!: Relation<PostMedia>;

  @Column("varchar")
  postMediaId!: string;
}


