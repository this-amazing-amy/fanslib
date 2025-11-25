import { t } from "elysia";
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

export const STICKER_DISPLAY_MODES = ["none", "color", "short"] as const;
export type StickerDisplayMode = (typeof STICKER_DISPLAY_MODES)[number];

@Entity()
// eslint-disable-next-line functional/no-classes
export class TagDimension {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { unique: true })
  name!: string;

  @Column("text", { nullable: true })
  description: string | null = null;

  @Column("varchar")
  dataType!: "categorical" | "numerical" | "boolean";

  @Column("text", { nullable: true })
  validationSchema: string | null = null;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("varchar", { default: "none" })
  stickerDisplay!: StickerDisplayMode;

  @Column("boolean", { default: false })
  isExclusive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TagDefinition, (tag) => tag.dimension)
  tags!: TagDefinition[];
}

@Entity()
// eslint-disable-next-line functional/no-classes
export class TagDefinition {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => TagDimension, (dimension) => dimension.tags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "dimensionId" })
  dimension!: TagDimension;

  @Column("int")
  dimensionId!: number;

  @Column("text")
  value!: string;

  @Column("varchar")
  displayName!: string;

  @Column("text", { nullable: true })
  description: string | null = null;

  @Column("text", { nullable: true })
  metadata: string | null = null;

  @Column("varchar", { nullable: true })
  color: string | null = null;

  @Column("varchar", { nullable: true })
  shortRepresentation: string | null = null;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("int", { nullable: true })
  parentTagId: number | null = null;

  @ManyToOne(() => TagDefinition, { nullable: true })
  @JoinColumn({ name: "parentTagId" })
  parent?: TagDefinition;

  @OneToMany(() => TagDefinition, (tag) => tag.parent)
  children!: TagDefinition[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => MediaTag, (mediaTag) => mediaTag.tag)
  mediaTags!: MediaTag[];
}

@Entity("MediaTag")
@Index(["dimensionName", "tagValue"])
@Index(["mediaId", "dimensionName"])
@Index(["dimensionName", "numericValue"])
// eslint-disable-next-line functional/no-classes
export class MediaTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar")
  mediaId!: string;

  @ManyToOne("Media", { onDelete: "CASCADE" })
  @JoinColumn({ name: "mediaId" })
  media: unknown;

  @Column("int")
  tagDefinitionId!: number;

  @ManyToOne(() => TagDefinition, (tag) => tag.mediaTags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tagDefinitionId" })
  tag!: TagDefinition;

  @Column("int")
  dimensionId!: number;

  @Column("varchar")
  dimensionName!: string;

  @Column("varchar")
  dataType!: "categorical" | "numerical" | "boolean";

  @Column("text")
  tagValue!: string;

  @Column("varchar")
  tagDisplayName!: string;

  @Column("varchar", { nullable: true })
  color: string | null = null;

  @Column("varchar", { default: "none" })
  stickerDisplay!: StickerDisplayMode;

  @Column("varchar", { nullable: true })
  shortRepresentation: string | null = null;

  @Column("real", { nullable: true })
  numericValue: number | null = null;

  @Column("boolean", { nullable: true })
  booleanValue: boolean | null = null;

  @Column("real", { nullable: true })
  confidence: number | null = null;

  @Column("varchar")
  source!: "manual" | "automated" | "imported";

  @CreateDateColumn()
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



