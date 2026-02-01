import { z } from "zod";
import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Channel } from "../channels/entity";
import { MediaFilterSchema } from "../library/schemas/media-filter";

@Entity("content_schedule")
export class ContentSchedule {
  @PrimaryColumn("varchar")
  id!: string;

  @Column({ type: "varchar", nullable: true, name: "channelId" })
  channelId: string | null = null;

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

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt!: Date;

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @Column({ type: "text", nullable: true, name: "mediaFilters" })
  mediaFilters: string | null = null;

  @ManyToOne(() => Channel, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "channelId" })
  channel: Relation<Channel> | null = null;

  @OneToMany(() => SkippedScheduleSlot, (slot) => slot.schedule)
  skippedSlots!: Relation<SkippedScheduleSlot>[];

  @OneToMany(() => ScheduleChannel, (sc) => sc.schedule)
  scheduleChannels!: Relation<ScheduleChannel>[];
}

@Entity("schedule_channel")
@Index(["scheduleId", "channelId"], { unique: true })
export class ScheduleChannel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "scheduleId" })
  scheduleId!: string;

  @Column({ type: "varchar", name: "channelId" })
  channelId!: string;

  @Column({ type: "simple-json", nullable: true, name: "mediaFilterOverrides" })
  mediaFilterOverrides: z.infer<typeof MediaFilterSchema> | null = null;

  @Column({ type: "int", default: 0, name: "sortOrder" })
  sortOrder!: number;

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt!: Date;

  @ManyToOne(() => ContentSchedule, (schedule) => schedule.scheduleChannels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "scheduleId" })
  schedule!: Relation<ContentSchedule>;

  @ManyToOne(() => Channel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel!: Relation<Channel>;
}

@Entity("skipped_schedule_slot")
export class SkippedScheduleSlot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "scheduleId" })
  scheduleId!: string;

  @Column({ type: "datetime", name: "date" })
  date!: Date;

  @ManyToOne(() => ContentSchedule, { onDelete: "CASCADE" })
  @JoinColumn({ name: "scheduleId" })
  schedule!: Relation<ContentSchedule>;
}

export const ContentScheduleTypeSchema = z.union([
  z.literal("daily"),
  z.literal("weekly"),
  z.literal("monthly"),
]);

export const ScheduleChannelSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  channelId: z.string(),
  mediaFilterOverrides: MediaFilterSchema.nullable(),
  sortOrder: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ContentScheduleSchema = z.object({
  id: z.string(),
  channelId: z.string().nullable(),
  name: z.string(),
  emoji: z.string().nullable(),
  color: z.string().nullable(),
  type: ContentScheduleTypeSchema,
  postsPerTimeframe: z.number().nullable(),
  preferredDays: z.array(z.string()).nullable(),
  preferredTimes: z.array(z.string()).nullable(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  mediaFilters: z.string().nullable(),
});

export const SkippedScheduleSlotSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  date: z.coerce.date(),
});

export const ContentScheduleWithSkippedSlotsSchema = ContentScheduleSchema.extend({
  skippedSlots: z.array(SkippedScheduleSlotSchema),
});

export const ContentScheduleWithChannelsSchema = ContentScheduleSchema.extend({
  skippedSlots: z.array(SkippedScheduleSlotSchema),
  scheduleChannels: z.array(ScheduleChannelSchema),
});



