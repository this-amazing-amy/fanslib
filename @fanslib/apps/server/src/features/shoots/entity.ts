import { t } from "elysia";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Media } from "../library/entity";

@Entity("Shoot")
// eslint-disable-next-line functional/no-classes
export class Shoot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text", { nullable: true })
  description: string | null = null;

  @Column("datetime")
  shootDate!: Date;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;

  @ManyToMany("Media", { cascade: true })
  @JoinTable({
    name: "shoot_media",
    joinColumn: { name: "shoot_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "media_id", referencedColumnName: "id" },
  })
  media!: Media[];
}

export const ShootSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  shootDate: t.Date(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});