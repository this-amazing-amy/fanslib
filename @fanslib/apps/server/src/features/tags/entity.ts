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
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Media } from "../library/entity";

export const STICKER_DISPLAY_MODES = ["none", "color", "short"] as const;
export type StickerDisplayMode = (typeof STICKER_DISPLAY_MODES)[number];

@Entity("tag_dimension")
export class TagDimension {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true, name: "name" })
  name!: string;

  @Column({ type: "text", nullable: true, name: "description" })
  description: string | null = null;

  @Column({ type: "varchar", name: "dataType" })
  dataType!: "categorical" | "numerical" | "boolean";

  @Column({ type: "text", nullable: true, name: "validationSchema" })
  validationSchema: string | null = null;

  @Column({ type: "int", default: 0, name: "sortOrder" })
  sortOrder!: number;

  @Column({ type: "varchar", default: "none", name: "stickerDisplay" })
  stickerDisplay!: StickerDisplayMode;

  @Column({ type: "boolean", default: false, name: "isExclusive" })
  isExclusive!: boolean;

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt!: Date;

  @OneToMany(() => TagDefinition, (tag) => tag.dimension)
  tags!: TagDefinition[];
}

@Entity("tag_definition")
export class TagDefinition {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => TagDimension, (dimension) => dimension.tags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "dimensionId" })
  dimension!: TagDimension;

  @Column({ type: "int", name: "dimensionId" })
  dimensionId!: number;

  @Column({ type: "text", name: "value" })
  value!: string;

  @Column({ type: "varchar", name: "displayName" })
  displayName!: string;

  @Column({ type: "text", nullable: true, name: "description" })
  description: string | null = null;

  @Column({ type: "text", nullable: true, name: "metadata" })
  metadata: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "color" })
  color: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "shortRepresentation" })
  shortRepresentation: string | null = null;

  @Column({ type: "int", default: 0, name: "sortOrder" })
  sortOrder!: number;

  @Column({ type: "int", nullable: true, name: "parentTagId" })
  parentTagId: number | null = null;

  @ManyToOne(() => TagDefinition, { nullable: true })
  @JoinColumn({ name: "parentTagId" })
  parent?: TagDefinition;

  @OneToMany(() => TagDefinition, (tag) => tag.parent)
  children!: TagDefinition[];

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt!: Date;

  @OneToMany(() => MediaTag, (mediaTag) => mediaTag.tag)
  mediaTags!: MediaTag[];
}

@Entity("media_tag")
@Index(["dimensionName", "tagValue"])
@Index(["mediaId", "dimensionName"])
@Index(["dimensionName", "numericValue"])
export class MediaTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", name: "mediaId" })
  mediaId!: string;

  @ManyToOne(() => Media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mediaId" })
  media!: Relation<Media>;

  @Column({ type: "int", name: "tagDefinitionId" })
  tagDefinitionId!: number;

  @ManyToOne(() => TagDefinition, (tag) => tag.mediaTags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tagDefinitionId" })
  tag!: TagDefinition;

  @Column({ type: "int", name: "dimensionId" })
  dimensionId!: number;

  @Column({ type: "varchar", name: "dimensionName" })
  dimensionName!: string;

  @Column({ type: "varchar", name: "dataType" })
  dataType!: "categorical" | "numerical" | "boolean";

  @Column({ type: "text", name: "tagValue" })
  tagValue!: string;

  @Column({ type: "varchar", name: "tagDisplayName" })
  tagDisplayName!: string;

  @Column({ type: "varchar", nullable: true, name: "color" })
  color: string | null = null;

  @Column({ type: "varchar", default: "none", name: "stickerDisplay" })
  stickerDisplay!: StickerDisplayMode;

  @Column({ type: "varchar", nullable: true, name: "shortRepresentation" })
  shortRepresentation: string | null = null;

  @Column({ type: "real", nullable: true, name: "numericValue" })
  numericValue: number | null = null;

  @Column({ type: "boolean", nullable: true, name: "booleanValue" })
  booleanValue: boolean | null = null;

  @Column({ type: "real", nullable: true, name: "confidence" })
  confidence: number | null = null;

  @Column({ type: "varchar", name: "source" })
  source!: "manual" | "automated" | "imported";

  @CreateDateColumn({ name: "assignedAt" })
  assignedAt!: Date;
}

// Schemas
export const StickerDisplayModeSchema = z.enum(["none", "color", "short"]);

export const DataTypeSchema = z.enum(["categorical", "numerical", "boolean"]);

export const TagSourceSchema = z.enum(["manual", "automated", "imported"]);

export const TagDefinitionSchema = z.object({
  id: z.number(),
  dimensionId: z.number(),
  value: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  metadata: z.string().nullable(),
  color: z.string().nullable(),
  shortRepresentation: z.string().nullable(),
  sortOrder: z.number(),
  parentTagId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TagDimensionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  dataType: DataTypeSchema,
  validationSchema: z.string().nullable(),
  sortOrder: z.number(),
  stickerDisplay: StickerDisplayModeSchema,
  isExclusive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(TagDefinitionSchema).optional(),
});

export const MediaTagSchema = z.object({
  id: z.number(),
  mediaId: z.string(),
  tagDefinitionId: z.number(),
  dimensionId: z.number(),
  dimensionName: z.string(),
  dataType: DataTypeSchema,
  tagValue: z.string(),
  tagDisplayName: z.string(),
  color: z.string().nullable(),
  stickerDisplay: StickerDisplayModeSchema,
  shortRepresentation: z.string().nullable(),
  numericValue: z.number().nullable(),
  booleanValue: z.boolean().nullable(),
  confidence: z.number().nullable(),
  source: TagSourceSchema,
  assignedAt: z.date(),
});



