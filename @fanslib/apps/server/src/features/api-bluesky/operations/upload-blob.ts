import { readFile } from "fs/promises";
import { extname } from "path";
import sharp from "sharp";
import { getBlueskyAgent } from "../client";
import { resolveMediaPath } from "../../library/path-utils";
import type { Media } from "../../library/entity";

const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
const COMPRESSION_QUALITY_START = 85;
const COMPRESSION_QUALITY_MIN = 50;
const COMPRESSION_QUALITY_STEP = 10;

const getMimeType = (filePath: string): string => {
  const ext = extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
  };
  return mimeTypes[ext] ?? "application/octet-stream";
};

const isCompressibleImage = (mimeType: string): boolean =>
  ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(mimeType);

const compressAtQuality = async (buffer: Buffer, quality: number): Promise<Buffer> =>
  sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();

const tryCompressionQualities = async (
  buffer: Buffer,
  quality: number
): Promise<Buffer> => {
  if (quality < COMPRESSION_QUALITY_MIN) {
    return buffer;
  }

  const compressed = await compressAtQuality(buffer, quality);

  if (compressed.length <= MAX_IMAGE_SIZE) {
    return compressed;
  }

  return tryCompressionQualities(buffer, quality - COMPRESSION_QUALITY_STEP);
};

const resizeAndCompress = async (buffer: Buffer, currentSize: number): Promise<Buffer> => {
  const metadata = await sharp(buffer).metadata();
  const scaleFactor = Math.sqrt(MAX_IMAGE_SIZE / currentSize) * 0.9;
  const newWidth = Math.floor((metadata.width ?? 1920) * scaleFactor);

  return sharp(buffer)
    .resize({ width: newWidth, withoutEnlargement: true })
    .jpeg({ quality: COMPRESSION_QUALITY_MIN, mozjpeg: true })
    .toBuffer();
};

const compressImage = async (buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> => {
  if (buffer.length <= MAX_IMAGE_SIZE) {
    return { buffer, mimeType };
  }

  if (!isCompressibleImage(mimeType)) {
    return { buffer, mimeType };
  }

  const outputMimeType = "image/jpeg";
  const compressedBuffer = await tryCompressionQualities(buffer, COMPRESSION_QUALITY_START);

  const finalBuffer = compressedBuffer.length > MAX_IMAGE_SIZE
    ? await resizeAndCompress(buffer, compressedBuffer.length)
    : compressedBuffer;

  console.info("Image compressed for Bluesky upload", {
    originalSize: `${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
    compressedSize: `${(finalBuffer.length / 1024 / 1024).toFixed(2)}MB`,
    originalMimeType: mimeType,
    outputMimeType,
  });

  return { buffer: finalBuffer, mimeType: outputMimeType };
};

export const uploadBlob = async (media: Media): Promise<{ blob: unknown; mimeType: string }> => {
  const filePath = resolveMediaPath(media.relativePath);
  const fileBuffer = await readFile(filePath);
  const originalMimeType = getMimeType(filePath);

  const { buffer: uploadBuffer, mimeType } = media.type === "image"
    ? await compressImage(fileBuffer, originalMimeType)
    : { buffer: fileBuffer, mimeType: originalMimeType };

  const agent = await getBlueskyAgent();

  const blobResponse = await agent.uploadBlob(uploadBuffer, {
    encoding: mimeType,
  });

  return {
    blob: blobResponse.data.blob,
    mimeType,
  };
};
