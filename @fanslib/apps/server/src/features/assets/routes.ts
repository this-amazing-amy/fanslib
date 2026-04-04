import { existsSync } from "fs";
import { extname, join } from "path";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { appdataPath } from "../../lib/env";
import type { AssetType } from "./entity";
import { deleteAsset } from "./operations/asset/delete";
import { fetchAllAssets } from "./operations/asset/fetch-all";
import { fetchAssetById } from "./operations/asset/fetch-by-id";
import { UpdateAssetRequestBodySchema, updateAsset } from "./operations/asset/update";
import { uploadAsset } from "./operations/asset/upload";

// PNG magic bytes: 137 80 78 71 13 10 26 10
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// MP3: starts with ID3 tag or 0xFF sync
const MP3_ID3_MAGIC = new Uint8Array([0x49, 0x44, 0x33]); // "ID3"
const MP3_SYNC = new Uint8Array([0xff, 0xfb]);

// WAV: starts with "RIFF"
const WAV_MAGIC = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // "RIFF"

const SUPPORTED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".aac", ".m4a"];

const isPng = (buffer: ArrayBuffer): boolean => {
  const header = new Uint8Array(buffer, 0, 8);
  return PNG_MAGIC.every((byte, i) => header[i] === byte);
};

const isAudio = (buffer: ArrayBuffer, filename: string): boolean => {
  const header = new Uint8Array(buffer, 0, 4);
  const ext = extname(filename).toLowerCase();

  // Check by magic bytes
  if (MP3_ID3_MAGIC.every((byte, i) => header[i] === byte)) return true;
  if (header[0] === MP3_SYNC[0] && header[1] === MP3_SYNC[1]) return true;
  if (WAV_MAGIC.every((byte, i) => header[i] === byte)) return true;

  // Fallback: check by extension for formats without reliable magic bytes (AAC)
  if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) return true;

  return false;
};

const getContentType = (filename: string, assetType: AssetType): string => {
  if (assetType === "image") return "image/png";
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".aac":
    case ".m4a":
      return "audio/aac";
    default:
      return "application/octet-stream";
  }
};

export const assetsRoutes = new Hono()
  .basePath("/api/assets")
  .get("/", async (c) => {
    const type = c.req.query("type") as AssetType | undefined;
    const assets = await fetchAllAssets(type);
    return c.json(assets);
  })
  .get("/:id/file", async (c) => {
    const id = c.req.param("id");
    const asset = await fetchAssetById(id);
    if (!asset) return c.json({ error: "Asset not found" }, 404);

    const filePath = join(appdataPath(), "assets", asset.filename);
    if (!existsSync(filePath)) return c.json({ error: "File not found" }, 404);

    const file = Bun.file(filePath);
    const contentType = getContentType(asset.filename, asset.type);
    return c.body(file.stream(), 200, {
      "Content-Type": contentType,
      "Content-Length": file.size.toString(),
    });
  })
  .post("/upload", async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const name = formData.get("name");

    if (!(file instanceof File)) {
      return c.json({ error: "File is required" }, 422);
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name ?? "asset";

    // Determine asset type
    if (isPng(buffer)) {
      const assetName = typeof name === "string" ? name : filename;
      const pngFile = new File([buffer], filename, { type: "image/png" });
      const result = await uploadAsset(pngFile, assetName, "image");
      return c.json(result);
    }

    if (isAudio(buffer, filename)) {
      const assetName = typeof name === "string" ? name : filename;
      const audioFile = new File([buffer], filename, { type: file.type });
      const result = await uploadAsset(audioFile, assetName, "audio");
      return c.json(result);
    }

    return c.json({ error: "Only PNG images and MP3/WAV/AAC audio files are accepted" }, 422);
  })
  .patch("/:id", zValidator("json", UpdateAssetRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const asset = await updateAsset(id, body);
    if (!asset) return notFound(c, "Asset not found");
    return c.json(asset);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteAsset(id);
    if (!success) return notFound(c, "Asset not found");
    return c.json({ success: true });
  });
