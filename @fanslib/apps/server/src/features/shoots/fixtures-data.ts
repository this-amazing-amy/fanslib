import type { Shoot } from "./entity";

export type ShootFixture = Omit<Shoot, "createdAt" | "updatedAt" | "shootDate" | "media"> & {
  shootDate: string;
  mediaIds: string[];
};

export const SHOOT_FIXTURES: ShootFixture[] = [
  {
    id: "shoot-1",
    name: "Spring 2024",
    description: "Spring photoshoot session",
    shootDate: "2024-03-15T10:00:00Z",
    mediaIds: ["media-1", "media-2"],
  },
  {
    id: "shoot-2",
    name: "Summer Collection",
    description: "Summer video collection",
    shootDate: "2024-06-20T14:00:00Z",
    mediaIds: ["media-3", "media-4", "media-5"],
  },
];
