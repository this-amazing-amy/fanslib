import { t } from "elysia";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { PostMedia } from "../posts/entity";
import type { Shoot } from "../shoots/entity";
import type { MediaTag } from "../tags/entity";

export type MediaType = "image" | "video";

@Entity()
// eslint-disable-next-line functional/no-classes
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index(["relativePath"])
  @Column({ type: "varchar", unique: true })
  relativePath!: string;

  @Column("varchar")
  type!: MediaType;

  @Column("varchar")
  name!: string;

  @Column("bigint")
  size!: number;

  @Column({ type: "float", nullable: true })
  duration: number | null = null;

  @Column({ type: "varchar", nullable: true })
  redgifsUrl: string | null = null;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;

  @Column("datetime")
  fileCreationDate!: Date;

  @Column("datetime")
  fileModificationDate!: Date;

  @OneToMany("PostMedia", (postMedia: { media: Media }) => postMedia.media)
  postMedia!: PostMedia[];

  @ManyToMany("Shoot")
  @JoinTable({
    name: "shoot_media",
    joinColumn: { name: "media_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "shoot_id", referencedColumnName: "id" },
  })
  shoots!: Shoot[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @OneToMany("MediaTag", (mediaTag: any) => mediaTag.media)
  mediaTags!: MediaTag[];
}

export const MediaTypeSchema = t.Union([t.Literal('image'), t.Literal('video')]);

export const MediaSchema = t.Object({
  id: t.String(),
  relativePath: t.String(),
  type: MediaTypeSchema,
  name: t.String(),
  size: t.Number(),
  duration: t.Nullable(t.Number()),
  redgifsUrl: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  fileCreationDate: t.Date(),
  fileModificationDate: t.Date(),
});

export type MediaWithoutRelations = Omit<Media, "id">;
