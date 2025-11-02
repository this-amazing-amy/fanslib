import type { Shoot, ShootMediaSelect } from "../../shoot";

export type UpdateShootRequest = {
  name?: string;
  description?: string;
  shootDate?: Date;
  mediaIds?: string[];
};

export type UpdateShootResponse = (Shoot & {
  media: ShootMediaSelect[];
}) | null;

