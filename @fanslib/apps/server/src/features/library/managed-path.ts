import { promises as fs } from "fs";
import { resolveMediaPath } from "./path-utils";

export type ShootInfo = {
  name: string;
  shootDate: Date;
};

export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

export const buildTargetPath = (
  shoot: ShootInfo,
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

export const pathExists = (filePath: string): Promise<boolean> =>
  fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

export const findAvailablePath = async (
  shoot: ShootInfo,
  pkg: string,
  role: string,
  contentRating: string,
  ext: string,
): Promise<string> => {
  const basePath = buildTargetPath(shoot, pkg, role, contentRating, ext);
  if (!(await pathExists(resolveMediaPath(basePath)))) return basePath;

  // eslint-disable-next-line functional/no-let, functional/no-loop-statements
  for (let seq = 2; seq <= 10_000; seq++) {
    const seqPath = buildTargetPath(shoot, pkg, role, contentRating, ext, seq);
    if (!(await pathExists(resolveMediaPath(seqPath)))) return seqPath;
  }

  throw new Error(`Could not find available path after 10000 attempts for ${basePath}`);
};
