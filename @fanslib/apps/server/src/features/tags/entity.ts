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
  description?: string;

  @Column("varchar")
  dataType!: "categorical" | "numerical" | "boolean";

  @Column("text", { nullable: true })
  validationSchema?: string;

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

  @ManyToOne(() => TagDimension, (dimension) => dimension.tags)
  @JoinColumn({ name: "dimensionId" })
  dimension!: TagDimension;

  @Column("int")
  dimensionId!: number;

  @Column("text")
  value!: string;

  @Column("varchar")
  displayName!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column("text", { nullable: true })
  metadata?: string;

  @Column("varchar", { nullable: true })
  color?: string;

  @Column("varchar", { nullable: true })
  shortRepresentation?: string;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("int", { nullable: true })
  parentTagId?: number;

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

@Entity()
@Index(["dimensionName", "tagValue"])
@Index(["mediaId", "dimensionName"])
@Index(["dimensionName", "numericValue"])
// eslint-disable-next-line functional/no-classes
export class MediaTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar")
  mediaId!: string;

  @ManyToOne("Media")
  @JoinColumn({ name: "mediaId" })
  media: unknown;

  @Column("int")
  tagDefinitionId!: number;

  @ManyToOne(() => TagDefinition, (tag) => tag.mediaTags)
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
  color?: string;

  @Column("varchar", { default: "none" })
  stickerDisplay!: StickerDisplayMode;

  @Column("varchar", { nullable: true })
  shortRepresentation?: string;

  @Column("real", { nullable: true })
  numericValue?: number;

  @Column("boolean", { nullable: true })
  booleanValue?: boolean;

  @Column("real", { nullable: true })
  confidence?: number;

  @Column("varchar")
  source!: "manual" | "automated" | "imported";

  @CreateDateColumn()
  assignedAt!: Date;
}



