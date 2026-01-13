import { access } from "fs/promises";
import { loadSettings } from "../../settings/operations/setting/load";
import { resolveMediaPath } from "../../library/path-utils";
import type { Media } from "../../library/entity";

const MAX_CAPTION_LENGTH = 300;
const MAX_IMAGES_PER_POST = 4;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION = 60;

type ValidationError = {
  field: string;
  message: string;
};

export const validatePost = async (
  caption: string | null,
  media: Media[]
): Promise<{ valid: boolean; errors: ValidationError[] }> => {
  const errors: ValidationError[] = [];

  const settings = await loadSettings();

  if (!settings.blueskyUsername || !settings.blueskyAppPassword) {
    errors.push({
      field: "credentials",
      message: "Bluesky credentials not configured. Please set blueskyUsername and blueskyAppPassword in settings.",
    });
  }

  const captionText = caption ?? "";

  if (captionText.length > MAX_CAPTION_LENGTH) {
    errors.push({
      field: "caption",
      message: `Caption exceeds maximum length of ${MAX_CAPTION_LENGTH} characters (current: ${captionText.length})`,
    });
  }

  if (media.length === 0) {
    errors.push({
      field: "media",
      message: "At least one media file is required",
    });
  }

  if (media.length > MAX_IMAGES_PER_POST) {
    errors.push({
      field: "media",
      message: `Maximum ${MAX_IMAGES_PER_POST} images per post (current: ${media.length})`,
    });
  }

  const hasVideo = media.some((m) => m.type === "video");
  const hasImage = media.some((m) => m.type === "image");

  if (hasVideo && media.length > 1) {
    errors.push({
      field: "media",
      message: "Only one video per post is allowed",
    });
  }

  if (hasVideo && hasImage) {
    errors.push({
      field: "media",
      message: "Cannot mix images and videos in a single post",
    });
  }

  const validationPromises = media.map(async (m) => {
    const filePath = resolveMediaPath(m.relativePath);

    try {
      await access(filePath);
    } catch {
      errors.push({
        field: "media",
        message: `Media file not found: ${m.name}`,
      });
      return;
    }

    if (m.type === "video") {
      if (m.size > MAX_VIDEO_SIZE) {
        errors.push({
          field: "media",
          message: `Video ${m.name} exceeds maximum size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB (current: ${(m.size / 1024 / 1024).toFixed(2)}MB)`,
        });
      }

      if (m.duration && m.duration > MAX_VIDEO_DURATION) {
        errors.push({
          field: "media",
          message: `Video ${m.name} exceeds maximum duration of ${MAX_VIDEO_DURATION} seconds (current: ${m.duration.toFixed(2)}s)`,
        });
      }
    }
  });

  await Promise.all(validationPromises);

  return {
    valid: errors.length === 0,
    errors,
  };
};
