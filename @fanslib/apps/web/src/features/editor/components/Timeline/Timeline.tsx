import { useCallback, useRef, useState } from "react";
import { useEditorStore } from "~/stores/editorStore";
import { Playhead } from "./Playhead";
import { SourceMediaBar } from "./SourceMediaBar";
import { TimeRuler } from "./TimeRuler";
import { TrackHeader } from "./TrackHeader";
import { TrackRow } from "./TrackRow";
import { TransportControls } from "./TransportControls";

type TimelineProps = {
  currentFrame: number;
  totalFrames: number;
  fps: number;
  playing: boolean;
  filename?: string;
  onSeek: (frame: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
};

export const Timeline = ({
  currentFrame,
  totalFrames,
  fps,
  playing,
  filename,
  onSeek,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
}: TimelineProps) => {
  const tracks = useEditorStore((s) => s.tracks);
  const selectedOperationId = useEditorStore((s) => s.selectedOperationId);
  const setSelectedOperationId = useEditorStore((s) => s.setSelectedOperationId);
  const addTrack = useEditorStore((s) => s.addTrack);

  const [pixelsPerFrame, setPixelsPerFrame] = useState(2);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setPixelsPerFrame((prev) =>
          Math.max(0.5, Math.min(20, prev + (e.deltaY > 0 ? -0.25 : 0.25))),
        );
      }
    },
    [],
  );

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  }, []);

  return (
    <div data-testid="timeline" className="flex flex-col border-t border-base-300 bg-base-200">
      {/* Transport bar */}
      <div className="flex items-center px-2 py-1 border-b border-base-300 bg-base-100">
        <TransportControls
          playing={playing}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          fps={fps}
          onPlay={onPlay}
          onPause={onPause}
          onSkipBack={onSkipBack}
          onSkipForward={onSkipForward}
        />
      </div>

      {/* Ruler + tracks area */}
      <div className="flex flex-col overflow-hidden" onWheel={handleWheel}>
        {/* Ruler row */}
        <div className="flex">
          <div className="w-32 shrink-0 border-r border-base-300" />
          <div className="overflow-hidden flex-1">
            <div style={{ marginLeft: `${-scrollLeft}px` }}>
              <TimeRuler
                pixelsPerFrame={pixelsPerFrame}
                totalFrames={totalFrames}
                fps={fps}
                scrollLeft={scrollLeft}
              />
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="flex flex-1 overflow-hidden">
          {/* Track headers */}
          <div className="shrink-0">
            {tracks.map((track) => (
              <TrackHeader
                key={track.id}
                name={track.name}
                trackId={track.id}
                onAddTrack={addTrack}
              />
            ))}
          </div>

          {/* Track rows with playhead */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto relative"
            onScroll={handleScroll}
          >
            <Playhead
              currentFrame={currentFrame}
              pixelsPerFrame={pixelsPerFrame}
              totalFrames={totalFrames}
              onSeek={onSeek}
            />
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                operations={
                  track.operations as Array<{
                    id: string;
                    type: string;
                    label?: string;
                    startFrame: number;
                    endFrame: number;
                  }>
                }
                pixelsPerFrame={pixelsPerFrame}
                selectedOperationId={selectedOperationId}
                onSelectOperation={setSelectedOperationId}
                totalFrames={totalFrames}
              />
            ))}
            {filename && (
              <SourceMediaBar
                filename={filename}
                totalFrames={totalFrames}
                pixelsPerFrame={pixelsPerFrame}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
