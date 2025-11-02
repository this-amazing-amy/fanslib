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

@Entity()
// eslint-disable-next-line functional/no-classes
export class Shoot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column("datetime")
  shootDate!: Date;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;

  @ManyToMany(() => Media, { cascade: true })
  @JoinTable({
    name: "shoot_media",
    joinColumn: { name: "shoot_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "media_id", referencedColumnName: "id" },
  })
  media!: Media[];
}



