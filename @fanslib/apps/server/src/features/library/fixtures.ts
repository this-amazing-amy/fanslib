import { getTestDataSource } from "../../lib/db.test";
import { Media as MediaEntity } from "./entity";

type Media = MediaEntity;

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

export const seedMediaFixtures = async () => {
  const dataSource = getTestDataSource();
  const mediaRepo = dataSource.getRepository(MediaEntity);
  const now = new Date();

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of MEDIA_FIXTURES) {
    const existing = await mediaRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const media = mediaRepo.create({
        id: fixture.id,
        relativePath: fixture.relativePath,
        type: fixture.type,
        name: fixture.name,
        size: fixture.size,
        duration: fixture.duration,
        fileCreationDate: now,
        fileModificationDate: now,
      });
      await mediaRepo.save(media);
    }
  }

  return await mediaRepo.find();
};

