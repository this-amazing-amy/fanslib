import { t } from "elysia";
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
export const StickerDisplayModeSchema = t.Union([
  t.Literal("none"),
  t.Literal("color"),
  t.Literal("short"),
]);

export const DataTypeSchema = t.Union([
  t.Literal("categorical"),
  t.Literal("numerical"),
  t.Literal("boolean"),
]);

export const TagSourceSchema = t.Union([
  t.Literal("manual"),
  t.Literal("automated"),
  t.Literal("imported"),
]);

export const TagDefinitionSchema = t.Object({
  id: t.Number(),
  dimensionId: t.Number(),
  value: t.String(),
  displayName: t.String(),
  description: t.Nullable(t.String()),
  metadata: t.Nullable(t.String()),
  color: t.Nullable(t.String()),
  shortRepresentation: t.Nullable(t.String()),
  sortOrder: t.Number(),
  parentTagId: t.Nullable(t.Number()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const TagDimensionSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  description: t.Nullable(t.String()),
  dataType: DataTypeSchema,
  validationSchema: t.Nullable(t.String()),
  sortOrder: t.Number(),
  stickerDisplay: StickerDisplayModeSchema,
  isExclusive: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  tags: t.Optional(t.Array(TagDefinitionSchema)),
});

export const MediaTagSchema = t.Object({
  id: t.Number(),
  mediaId: t.String(),
  tagDefinitionId: t.Number(),
  dimensionId: t.Number(),
  dimensionName: t.String(),
  dataType: DataTypeSchema,
  tagValue: t.String(),
  tagDisplayName: t.String(),
  color: t.Nullable(t.String()),
  stickerDisplay: StickerDisplayModeSchema,
  shortRepresentation: t.Nullable(t.String()),
  numericValue: t.Nullable(t.Number()),
  booleanValue: t.Nullable(t.Boolean()),
  confidence: t.Nullable(t.Number()),
  source: TagSourceSchema,
  assignedAt: t.Date(),
});



