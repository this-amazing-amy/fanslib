import { existsSync } from "fs";
import { join } from "path";
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

const isPng = (buffer: ArrayBuffer): boolean => {
  const header = new Uint8Array(buffer, 0, 8);
  return PNG_MAGIC.every((byte, i) => header[i] === byte);
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
    return c.body(file.stream(), 200, {
      "Content-Type": "image/png",
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

    // Validate PNG format by checking magic bytes
    const buffer = await file.arrayBuffer();
    if (!isPng(buffer)) {
      return c.json({ error: "Only PNG files are accepted" }, 422);
    }

    const assetName = typeof name === "string" ? name : file.name ?? "Untitled";
    // Re-create the file from buffer since we already consumed it
    const pngFile = new File([buffer], file.name ?? "asset.png", { type: "image/png" });
    const result = await uploadAsset(pngFile, assetName);
    return c.json(result);
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
