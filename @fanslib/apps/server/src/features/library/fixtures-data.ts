import type { Media } from "./entity";

export type MediaFixture = Omit<Media, "createdAt" | "updatedAt" | "fileCreationDate" | "fileModificationDate" | "redgifsUrl" | "postMedia" | "shoots" | "mediaTags">;

export const MEDIA_FIXTURES: MediaFixture[] = [
  {
    id: "media-1",
    relativePath: "/test/images/photo1.jpg",
    type: "image",
    name: "photo1.jpg",
    size: 1024000,
    duration: null,
  },
  {
    id: "media-2",
    relativePath: "/test/images/photo2.jpg",
    type: "image",
    name: "photo2.jpg",
    size: 2048000,
    duration: null,
  },
  {
    id: "media-3",
    relativePath: "/test/videos/video1.mp4",
    type: "video",
    name: "video1.mp4",
    size: 10240000,
    duration: 60.5,
  },
  {
    id: "media-4",
    relativePath: "/test/images/photo3.jpg",
    type: "image",
    name: "photo3.jpg",
    size: 1536000,
    duration: null,
  },
  {
    id: "media-5",
    relativePath: "/test/videos/video2.mp4",
    type: "video",
    name: "video2.mp4",
    size: 20480000,
    duration: 120.0,
  },
];
