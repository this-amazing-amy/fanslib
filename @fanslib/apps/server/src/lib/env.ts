import { join } from "path";

type EnvConfig = {
  appdataPath: string;
  libraryPath: string;
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
  const libraryPath = requireEnv("LIBRARY_PATH");

  return {
    appdataPath,
    libraryPath,
    ffprobePath: process.env.FFPROBE_PATH
  };
};

export const sqliteDbPath = (): string => join(env().appdataPath, "fanslib.sqlite");
export const appdataPath = (): string => env().appdataPath;
export const browserDataPath = (): string => join(env().appdataPath, "browser");
export const fanslyCredentialsFilePath = (): string => join(env().appdataPath, "fansly-credentials.json");

