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
import { Shoot } from "../shoots/entity";
import { MediaTag } from "../tags/entity";

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

  @Column("float", { nullable: true })
  duration?: number;

  @Column("varchar", { nullable: true })
  redgifsUrl?: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;

  @Column("datetime")
  fileCreationDate!: Date;

  @Column("datetime")
  fileModificationDate!: Date;

  @OneToMany("PostMedia", (postMedia: { media: Media }) => postMedia.media)
  postMedia!: unknown[];

  @ManyToMany(() => Shoot)
  @JoinTable({
    name: "shoot_media",
    joinColumn: { name: "media_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "shoot_id", referencedColumnName: "id" },
  })
  shoots!: Shoot[];

  @OneToMany(() => MediaTag, (mediaTag) => mediaTag.media)
  mediaTags!: MediaTag[];
}

export type MediaWithoutRelations = Omit<Media, "id">;
