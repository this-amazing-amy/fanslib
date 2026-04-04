import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import pathModule from "path";
import { promises as fs } from "fs";
import type { Repository } from "typeorm";
import { db } from "../../lib/db";
import { validationError } from "../../lib/hono-utils";
import { Media } from "./entity";
import { Shoot } from "../shoots/entity";
import { ContentRatingSchema } from "./content-rating";
import { resolveMediaPath } from "./path-utils";

const OrganizeEntrySchema = z.object({
  mediaId: z.string(),
  shootId: z.string(),
  package: z.string(),
  role: z.string(),
  contentRating: ContentRatingSchema,
});

const OrganizeRequestSchema = z.object({
  entries: z.array(OrganizeEntrySchema).min(1),
});

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

const buildTargetPath = (
  shoot: Shoot,
  pkg: string,
  role: string,
  contentRating: string,
  ext: string,
  seq?: number,
): string => {
  const dateStr = formatDate(shoot.shootDate);
  const year = shoot.shootDate.getFullYear().toString();
  const shootFolder = `${dateStr}_${shoot.name}`;
  const baseName = `${dateStr}_${shoot.name}_${pkg}_${role}_${contentRating}`;
  const seqSuffix = seq ? `_${seq}` : "";
  return `${year}/${shootFolder}/${baseName}${seqSuffix}${ext}`;
};

const pathExists = (filePath: string): Promise<boolean> =>
  fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

const findAvailablePath = async (
  shoot: Shoot,
  pkg: string,
  role: string,
  contentRating: string,
  ext: string,
): Promise<string> => {
  const basePath = buildTargetPath(shoot, pkg, role, contentRating, ext);
  if (!(await pathExists(resolveMediaPath(basePath)))) return basePath;

  // eslint-disable-next-line functional/no-let, functional/no-loop-statements
  for (let seq = 2; ; seq++) {
    const seqPath = buildTargetPath(shoot, pkg, role, contentRating, ext, seq);
    if (!(await pathExists(resolveMediaPath(seqPath)))) return seqPath;
  }
};

type OrganizeEntry = z.infer<typeof OrganizeEntrySchema>;
type OrganizeResult = { mediaId: string; finalPath: string };
type OrganizeError = { mediaId: string; error: string };

const processEntry = async (
  entry: OrganizeEntry,
  mediaRepo: Repository<Media>,
  shootRepo: Repository<Shoot>,
): Promise<OrganizeResult | OrganizeError> => {
  const media = await mediaRepo.findOne({ where: { id: entry.mediaId } });
  if (!media) return { mediaId: entry.mediaId, error: "Media not found" };

  const shoot = await shootRepo.findOne({
    where: { id: entry.shootId },
    relations: { media: true },
  });
  if (!shoot) return { mediaId: entry.mediaId, error: "Shoot not found" };

  const sourcePath = resolveMediaPath(media.relativePath);
  if (!(await pathExists(sourcePath))) {
    return { mediaId: entry.mediaId, error: "File not found on disk" };
  }

  const ext = pathModule.extname(media.name);
  const targetRelPath = await findAvailablePath(
    shoot,
    entry.package,
    entry.role,
    entry.contentRating,
    ext,
  );
  const targetAbsPath = resolveMediaPath(targetRelPath);

  await fs.mkdir(pathModule.dirname(targetAbsPath), { recursive: true });
  await fs.rename(sourcePath, targetAbsPath);

  media.relativePath = targetRelPath;
  media.name = pathModule.basename(targetRelPath);
  media.package = entry.package;
  media.role = entry.role;
  media.contentRating = entry.contentRating;
  media.isManaged = true;
  await mediaRepo.save(media);

  const alreadyLinked = shoot.media.some((m) => m.id === media.id);
  if (!alreadyLinked) {
    shoot.media.push(media);
    await shootRepo.save(shoot);
  }

  return { mediaId: media.id, finalPath: targetRelPath };
};

const isError = (r: OrganizeResult | OrganizeError): r is OrganizeError => "error" in r;

export const organizeRoutes = new Hono()
  .basePath("/api/library")
  .get("/unmanaged", async (c) => {
    const database = await db();
    const mediaRepo = database.getRepository(Media);

    const unmanagedMedia = await mediaRepo.find({
      where: { isManaged: false },
      order: { relativePath: "ASC" },
    });

    const groups = unmanagedMedia.reduce<Map<string, Media[]>>((acc, media) => {
      const folder = pathModule.dirname(media.relativePath);
      const existing = acc.get(folder) ?? [];
      acc.set(folder, [...existing, media]);
      return acc;
    }, new Map());

    const result = Array.from(groups.entries()).map(([folder, media]) => ({
      folder,
      media,
    }));

    return c.json(result);
  })
  .get("/known-roles", async (c) => {
    const database = await db();
    const results = await database
      .getRepository(Media)
      .createQueryBuilder("media")
      .select("DISTINCT media.role", "role")
      .where("media.isManaged = :managed", { managed: true })
      .andWhere("media.role IS NOT NULL")
      .getRawMany<{ role: string }>();

    return c.json(results.map((r) => r.role));
  })
  .get("/known-packages", async (c) => {
    const shootId = c.req.query("shootId");
    if (!shootId) {
      return c.json({ error: "shootId query parameter is required" }, 400);
    }

    const database = await db();
    const results = await database
      .getRepository(Media)
      .createQueryBuilder("media")
      .innerJoin("shoot_media", "sm", "sm.media_id = media.id")
      .select("DISTINCT media.package", "package")
      .where("sm.shoot_id = :shootId", { shootId })
      .andWhere("media.package IS NOT NULL")
      .getRawMany<{ package: string }>();

    return c.json(results.map((r) => r.package));
  })
  .post("/organize", zValidator("json", OrganizeRequestSchema, validationError), async (c) => {
    const { entries } = c.req.valid("json");
    const database = await db();
    const mediaRepo = database.getRepository(Media);
    const shootRepo = database.getRepository(Shoot);

    // Process entries sequentially (each may depend on prior filesystem state)
    const outcomes = await entries.reduce<Promise<Array<OrganizeResult | OrganizeError>>>(
      async (accPromise, entry) => {
        const acc = await accPromise;
        const result = await processEntry(entry, mediaRepo, shootRepo);
        return [...acc, result];
      },
      Promise.resolve([]),
    );

    return c.json({
      results: outcomes.filter((r): r is OrganizeResult => !isError(r)),
      errors: outcomes.filter(isError),
    });
  });
