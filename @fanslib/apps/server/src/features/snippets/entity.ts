import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Channel } from "../channels/entity";

@Entity()
// eslint-disable-next-line functional/no-classes
export class CaptionSnippet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text")
  content!: string;

  @Column("uuid", { nullable: true })
  channelId?: string;

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn({ name: "channelId" })
  channel?: Channel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}



