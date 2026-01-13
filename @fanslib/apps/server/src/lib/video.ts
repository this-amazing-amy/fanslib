import { exec } from "child_process";
import ffprobeStatic from "ffprobe-static";
import { promisify } from "util";
import { env } from "./env";

const execAsync = promisify(exec);

export const getVideoDuration = async (filePath: string): Promise<number | undefined> => {
  try {
    const ffprobePath = env().ffprobePath ?? ffprobeStatic.path;

    const { stdout } = await execAsync(
      `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? undefined : duration;
  } catch (error) {
    console.error(`Failed to get duration for ${filePath}:`, error);
    return undefined;
  }
};

export const getVideoDimensions = async (filePath: string): Promise<{ width: number; height: number } | undefined> => {
  try {
    const ffprobePath = env().ffprobePath ?? ffprobeStatic.path;

    const { stdout } = await execAsync(
      `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    const lines = stdout.trim().split("\n");
    const width = parseInt(lines[0] ?? "", 10);
    const height = parseInt(lines[1] ?? "", 10);

    if (isNaN(width) || isNaN(height)) {
      return undefined;
    }

    return { width, height };
  } catch (error) {
    console.error(`Failed to get dimensions for ${filePath}:`, error);
    return undefined;
  }
};
