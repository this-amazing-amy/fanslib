import path from "path";
import { FileStore } from "@tus/file-store";
import { Server } from "@tus/server";
import { db } from "../../lib/db";
import { env } from "../../lib/env";
import { Shoot } from "../shoots/entity";
import { finalizeUploadedMedia } from "./operations/finalize-uploaded-media";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);
const SUPPORTED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export const TUS_UPLOAD_PATH = "/api/media/upload";
export const TUS_STAGING_SUBDIR = ".tus-incoming";

const stagingDirectoryForMediaPath = (mediaPath: string) =>
  path.join(mediaPath, TUS_STAGING_SUBDIR);

const createTusServer = () =>
  new Server({
    path: TUS_UPLOAD_PATH,
    datastore: new FileStore({ directory: stagingDirectoryForMediaPath(env().mediaPath) }),
    onUploadCreate: async (_req, upload) => {
      const metadata = upload.metadata ?? {};
      const filename = metadata.filename;
      const shootId = metadata.shootId;

      if (!filename) {
        throw { status_code: 400, body: "filename is required" };
      }
      const ext = path.extname(filename).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        throw { status_code: 400, body: `Unsupported file type: ${ext}` };
      }
      if (!shootId) {
        throw { status_code: 400, body: "shootId is required" };
      }

      const database = await db();
      const shoot = await database.getRepository(Shoot).findOne({ where: { id: shootId } });
      if (!shoot) {
        throw { status_code: 404, body: `Shoot not found: ${shootId}` };
      }

      const category = metadata.category === "footage" ? "footage" : "library";
      return { metadata: { ...metadata, category } };
    },
    onUploadFinish: async (_req, upload) => {
      const metadata = upload.metadata ?? {};
      const stagedAbsolutePath = upload.storage?.path;
      if (!stagedAbsolutePath) {
        throw { status_code: 500, body: "Missing staged file path" };
      }
      const filename = metadata.filename;
      const shootId = metadata.shootId;
      if (!filename || !shootId) {
        throw { status_code: 400, body: "Missing upload metadata" };
      }

      const media = await finalizeUploadedMedia({
        stagedAbsolutePath,
        originalName: filename,
        shootId,
        category: metadata.category === "footage" ? "footage" : "library",
        note: metadata.note ?? undefined,
      });

      return {
        status_code: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(media),
      };
    },
  });

export const handleTusRequest = (request: Request): Promise<Response> =>
  createTusServer().handleWeb(request);
