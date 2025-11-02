import { join } from "path";

type EnvConfig = {
  port: number;
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
  const port = process.env.PORT;
  if (!port) {
    throw new Error("Required environment variable PORT is not set");
  }
  const portNum = parseInt(port, 10);
  if (isNaN(portNum)) {
    throw new Error(`Invalid PORT value: ${port} (must be a number)`);
  }

  const appdataPath = requireEnv("APPDATA_PATH");
  const libraryPath = requireEnv("LIBRARY_PATH");

  return {
    port: portNum,
    appdataPath,
    libraryPath,
    ffprobePath: process.env.FFPROBE_PATH
  };
};

export const sqliteDbPath = (): string => join(env().appdataPath, "fanslib.sqlite");
export const appdataPath = (): string => env().appdataPath;
export const browserDataPath = (): string => join(env().appdataPath, "browser");
export const fanslyCredentialsFilePath = (): string => join(env().appdataPath, "fansly-credentials.json");

