import { Plus } from "lucide-react";

type TrackHeaderProps = {
  name: string;
  trackId: string;
  onAddTrack: () => void;
};

export const TrackHeader = ({ name, trackId: _trackId, onAddTrack }: TrackHeaderProps) => <div className="w-32 h-10 flex items-center justify-between px-2 border-r border-base-300 shrink-0">
      <span className="text-xs truncate">{name}</span>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
        onClick={onAddTrack}
        aria-label={`Add track after ${name}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>;
