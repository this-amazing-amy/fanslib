import { z } from "zod";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type AssetType = "image" | "audio";

@Entity("asset")
export class Asset {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "name" })
  name!: string;

  @Column({ type: "varchar", name: "type" })
  type!: AssetType;

  @Column({ type: "varchar", name: "filename" })
  filename!: string;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;
}

export const AssetTypeSchema = z.enum(["image", "audio"]);

export const AssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AssetTypeSchema,
  filename: z.string(),
  createdAt: z.coerce.date(),
});
