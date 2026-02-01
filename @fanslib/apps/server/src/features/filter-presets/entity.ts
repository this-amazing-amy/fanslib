import { z } from "zod";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("filter_preset")
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

export const FilterPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  filtersJson: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type FilterPreset_Type = z.infer<typeof FilterPresetSchema>;
