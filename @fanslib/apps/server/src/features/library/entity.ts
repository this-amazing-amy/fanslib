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

@Entity("media")
// eslint-disable-next-line functional/no-classes
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index(["relativePath"])
  @Column({ type: "varchar", unique: true, name: "relativePath" })
  relativePath!: string;

  @Column({ type: "varchar", name: "type" })
  type!: MediaType;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "bigint", name: "size" })
  size!: number;

  @Column({ type: "float", nullable: true, name: "duration" })
  duration: number | null = null;

  @Column({ type: "varchar", nullable: true, name: "redgifsUrl" })
  redgifsUrl: string | null = null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;

  @Column({ type: "datetime", name: "fileCreationDate" })
  fileCreationDate!: Date;

  @Column({ type: "datetime", name: "fileModificationDate" })
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
