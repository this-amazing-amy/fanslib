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

@Entity("shoot")
// eslint-disable-next-line functional/no-classes
export class Shoot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "text", nullable: true, name: "description" })
  description: string | null = null;

  @Column({ type: "datetime", name: "shootDate" })
  shootDate!: Date;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
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