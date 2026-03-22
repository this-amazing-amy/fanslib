import { join } from "path";

type EnvConfig = {
  appdataPath: string;
  mediaPath: string;
  ffmpegPath: string | undefined;
  ffprobePath: string | undefined;
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};

export const env = (): EnvConfig => {
  const appdataPath = requireEnv("APPDATA_PATH");
  const mediaPath = process.env.MEDIA_PATH ?? process.env.LIBRARY_PATH;
  if (!mediaPath) {
    throw new Error(
      "Required environment variable MEDIA_PATH is not set (LIBRARY_PATH also accepted as fallback)",
    );
  }

  return {
    appdataPath,
    mediaPath,
    ffmpegPath: process.env.FFMPEG_PATH,
    ffprobePath: process.env.FFPROBE_PATH,
  };
};

export const sqliteDbPath = (): string => join(env().appdataPath, "fanslib.sqlite");
export const appdataPath = (): string => env().appdataPath;
export const browserDataPath = (): string => join(env().appdataPath, "browser");
export const fanslyCredentialsFilePath = (): string =>
  join(env().appdataPath, "fansly-credentials.json");
