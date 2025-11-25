import { t } from "elysia";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("FilterPreset")
// eslint-disable-next-line functional/no-classes
export class FilterPreset {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text")
  filtersJson!: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}

export const FilterPresetSchema = t.Object({
  id: t.String(),
  name: t.String(),
  filtersJson: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});



