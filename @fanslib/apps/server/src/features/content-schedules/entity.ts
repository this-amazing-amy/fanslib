import { t } from "elysia";
import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Channel } from "../channels/entity";

@Entity("content_schedule")
// eslint-disable-next-line functional/no-classes
export class ContentSchedule {
  @PrimaryColumn("varchar")
  id!: string;

  @Column({ type: "varchar", name: "channelId" })
  channelId!: string;

  @Column({ type: "varchar", default: "Untitled Schedule", name: "name" })
  name!: string;

  @Column({ type: "varchar", nullable: true, name: "emoji" })
  emoji: string | null = null;

  @Column({ type: "varchar", nullable: true, default: "#6366f1", name: "color" })
  color: string | null = "#6366f1";

  @Column({
    type: "varchar",
    enum: ["daily", "weekly", "monthly"],
    name: "type",
  })
  type!: "daily" | "weekly" | "monthly";

  @Column({ type: "int", nullable: true, name: "postsPerTimeframe" })
  postsPerTimeframe: number | null = null;

  @Column({ type: "simple-array", nullable: true, name: "preferredDays" })
  preferredDays: string[] | null = null;

  @Column({ type: "simple-array", nullable: true, name: "preferredTimes" })
  preferredTimes: string[] | null = null;

  @Column({ type: "varchar", name: "updatedAt" })
  updatedAt!: string;

  @Column({ type: "varchar", name: "createdAt" })
  createdAt!: string;

  @Column({ type: "text", nullable: true, name: "mediaFilters" })
  mediaFilters: string | null = null;

  @ManyToOne(() => Channel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel!: Relation<Channel>;

  @OneToMany(() => SkippedScheduleSlot, (slot) => slot.schedule)
  skippedSlots!: Relation<SkippedScheduleSlot>[];
}

@Entity("skipped_schedule_slot")
// eslint-disable-next-line functional/no-classes
export class SkippedScheduleSlot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "scheduleId" })
  scheduleId!: string;

  @Column({ type: "varchar", name: "date" })
  date!: string;

  @ManyToOne(() => ContentSchedule, { onDelete: "CASCADE" })
  @JoinColumn({ name: "scheduleId" })
  schedule!: Relation<ContentSchedule>;
}

export const ContentScheduleTypeSchema = t.Union([
  t.Literal("daily"),
  t.Literal("weekly"),
  t.Literal("monthly"),
]);

export const ContentScheduleSchema = t.Object({
  id: t.String(),
  channelId: t.String(),
  name: t.String(),
  emoji: t.Nullable(t.String()),
  color: t.Nullable(t.String()),
  type: ContentScheduleTypeSchema,
  postsPerTimeframe: t.Nullable(t.Number()),
  preferredDays: t.Nullable(t.Array(t.String())),
  preferredTimes: t.Nullable(t.Array(t.String())),
  updatedAt: t.String(),
  createdAt: t.String(),
  mediaFilters: t.Nullable(t.String()),
});

export const SkippedScheduleSlotSchema = t.Object({
  id: t.String(),
  scheduleId: t.String(),
  date: t.String(),
});

export const ContentScheduleWithSkippedSlotsSchema = t.Intersect([
  ContentScheduleSchema,
  t.Object({
    skippedSlots: t.Array(SkippedScheduleSlotSchema),
  }),
]);



