import { z } from "zod";
import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Media } from "../library/entity";

@Entity("shoot")
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

  @ManyToMany(() => Media, { cascade: true })
  @JoinTable({
    name: "shoot_media",
    joinColumn: { name: "shoot_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "media_id", referencedColumnName: "id" },
  })
  media!: Relation<Media>[];
}

export const ShootSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  shootDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Shoot_Type = z.infer<typeof ShootSchema>;