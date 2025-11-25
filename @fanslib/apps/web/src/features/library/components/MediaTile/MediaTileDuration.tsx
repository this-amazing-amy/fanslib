import { formatDuration } from "~/lib/video";

type MediaTileDurationProps = {
  duration: number;
};

export const MediaTileDuration = ({ duration }: MediaTileDurationProps) => <div className="absolute bottom-1 right-1 bg-black/50 px-1 py-0.5 rounded text-[9px] text-white font-medium leading-tight">
      {formatDuration(duration)}
    </div>;
