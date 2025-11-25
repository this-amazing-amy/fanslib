import { t } from "elysia";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("filter_preset")
// eslint-disable-next-line functional/no-classes
export class FilterPreset {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "text", name: "filtersJson" })
  filtersJson!: string;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export const FilterPresetSchema = t.Object({
  id: t.String(),
  name: t.String(),
  filtersJson: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});



