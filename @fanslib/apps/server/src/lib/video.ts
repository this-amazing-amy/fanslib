import { exec } from "child_process";
import ffprobe from "ffprobe-static";
import { promisify } from "util";

const execAsync = promisify(exec);

export const getFfprobePath = (): string => process.env.FFPROBE_PATH ?? ffprobe.path;

export const getVideoDuration = async (filePath: string): Promise<number | undefined> => {
  try {
    const ffprobePath = getFfprobePath();

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
