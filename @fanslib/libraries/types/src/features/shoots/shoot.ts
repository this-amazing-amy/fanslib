import type { Media } from '../library/types';

export type Shoot = {
  id: string;
  name: string;
  description?: string;
  shootDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ShootFilter = {
  name?: string;
  startDate?: Date;
  endDate?: Date;
};

export type ShootMediaSelect = Pick<Media, "id" | "relativePath" | "type" | "name">;

export type ShootWithMedia = Shoot & {
  media: Media[];
};

export type ShootSummary = ShootWithMedia & {
  mediaCount: number;
};

