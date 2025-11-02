import type { Shoot, ShootMediaSelect } from "../../shoot";

export type CreateShootRequest = {
  name: string;
  description?: string;
  shootDate: Date;
  mediaIds: string[];
};

export type CreateShootResponse = Shoot & {
  media: ShootMediaSelect[];
};

