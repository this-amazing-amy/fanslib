import { t } from "elysia";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import type { Channel } from "../channels/entity";

@Entity()
// eslint-disable-next-line functional/no-classes
export class ContentSchedule {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  channelId!: string;

  @Column({
    type: "varchar",
    enum: ["daily", "weekly", "monthly"],
  })
  type!: "daily" | "weekly" | "monthly";

  @Column("int", { nullable: true })
  postsPerTimeframe: number | null = null;

  @Column("simple-array", { nullable: true })
  preferredDays: string[] | null = null;

  @Column("simple-array", { nullable: true })
  preferredTimes: string[] | null = null;

  @Column("varchar")
  updatedAt!: string;

  @Column("varchar")
  createdAt!: string;

  @Column("text", { nullable: true })
  mediaFilters: string | null = null;

  @ManyToOne("Channel")
  @JoinColumn({ name: "channelId" })
  channel!: Channel;
}

export const ContentScheduleTypeSchema = t.Union([
  t.Literal("daily"),
  t.Literal("weekly"),
  t.Literal("monthly"),
]);

export const ContentScheduleSchema = t.Object({
  id: t.String(),
  channelId: t.String(),
  type: ContentScheduleTypeSchema,
  postsPerTimeframe: t.Nullable(t.Number()),
  preferredDays: t.Nullable(t.Array(t.String())),
  preferredTimes: t.Nullable(t.Array(t.String())),
  updatedAt: t.String(),
  createdAt: t.String(),
  mediaFilters: t.Nullable(t.String()),
});



