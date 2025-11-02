import { exec } from "child_process";
import ffprobe from "ffprobe";
import { promisify } from "util";
import { env } from "./env";

const execAsync = promisify(exec);

export const getVideoDuration = async (filePath: string): Promise<number | undefined> => {
  try {
    const ffprobePath = env().ffprobePath ?? ffprobe.path;

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
