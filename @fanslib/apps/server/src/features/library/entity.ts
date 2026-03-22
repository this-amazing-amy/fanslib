import type { Relation } from "typeorm";
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
import { PostMedia } from "../posts/entity";
import { Shoot } from "../shoots/entity";
import { MediaTag } from "../tags/entity";
import type { ContentRating } from "./content-rating";

export type MediaType = "image" | "video";

@Entity("media")
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

  @Column({ type: "text", nullable: true, name: "description" })
  description: string | null = null;

  @Column({ type: "boolean", default: false, name: "excluded" })
  excluded: boolean = false;

  @Column({ type: "varchar", nullable: true, name: "contentRating" })
  contentRating: ContentRating | null = null;

  @Column({ type: "varchar", nullable: true, name: "package" })
  package: string | null = null;

  @Column({ type: "varchar", nullable: true, name: "role" })
  role: string | null = null;

  @Column({ type: "boolean", default: false, name: "isManaged" })
  isManaged: boolean = false;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;

  @Column({ type: "datetime", name: "fileCreationDate" })
  fileCreationDate!: Date;

  @Column({ type: "datetime", name: "fileModificationDate" })
  fileModificationDate!: Date;

  @OneToMany(() => PostMedia, (postMedia: PostMedia) => postMedia.media)
  postMedia!: Relation<PostMedia>[];

  @ManyToMany(() => Shoot)
  @JoinTable({
    name: "shoot_media",
    joinColumn: { name: "media_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "shoot_id", referencedColumnName: "id" },
  })
  shoots!: Relation<Shoot>[];

  @OneToMany(() => MediaTag, (mediaTag: MediaTag) => mediaTag.media)
  mediaTags!: Relation<MediaTag>[];
}

export type MediaWithoutRelations = Omit<Media, "id">;

export { MediaSchema, MediaTypeSchema } from "./schema";
export { ContentRatingSchema, type ContentRating } from "./content-rating";
