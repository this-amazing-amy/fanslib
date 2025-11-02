import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR ?? "./data";
const THUMBNAIL_DIR = path.join(DATA_DIR, "thumbnails");

const ensureThumbnailDir = async () => {
  try {
    await fs.access(THUMBNAIL_DIR);
  } catch {
    await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
  }
};

export const generateThumbnail = async (
  mediaPath: string,
  mediaId: string,
  type: "image" | "video"
): Promise<string> => {
  await ensureThumbnailDir();

  const thumbnailPath = path.join(THUMBNAIL_DIR, `${mediaId}.jpg`);

  try {
    await fs.access(thumbnailPath);
    return thumbnailPath;
  } catch {
    // Thumbnail doesn't exist, create it
  }

  return new Promise((resolve, reject) => {
    const ffmpegArgs: string[] = [];

    if (type === "video") {
      // For videos, take a frame at 1 second or 10% of duration, whichever is less
      ffmpegArgs.push(
        "-ss",
        "1",
        "-i",
        mediaPath,
        "-vframes",
        "1",
        "-vf",
        "scale=320:-1",
        "-y",
        thumbnailPath,
      );
    } else {
      // For images, just resize
      ffmpegArgs.push("-i", mediaPath, "-vf", "scale=320:-1", "-y", thumbnailPath);
    }

    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    ffmpeg.on("error", (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
    });

    ffmpeg.on("exit", (code) => {
      if (code === 0) {
        resolve(thumbnailPath);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
};

export const getThumbnailPath = (mediaId: string): string => path.join(THUMBNAIL_DIR, `${mediaId.replace(/\/$/, "")}.jpg`);

export const thumbnailExists = async (mediaId: string): Promise<boolean> => {
  try {
    await fs.access(getThumbnailPath(mediaId));
    return true;
  } catch {
    return false;
  }
};
