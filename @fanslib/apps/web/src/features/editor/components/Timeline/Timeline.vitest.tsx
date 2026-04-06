import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useClipStore } from "~/stores/clipStore";
import { OperationBlock } from "./OperationBlock";
import { SourceMediaBar } from "./SourceMediaBar";
import { TrackHeader } from "./TrackHeader";
import { TimeRuler } from "./TimeRuler";
import { TransportControls } from "./TransportControls";

afterEach(cleanup);

describe("OperationBlock", () => {
  test("renders with type name and correct color class for caption", () => {
    render(
      <OperationBlock
        id="op-1"
        type="caption"
        label="Hello world"
        startFrame={0}
        endFrame={90}
        pixelsPerFrame={2}
        selected={false}
        totalFrames={900}
        trackId="t1"
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
      />,
    );
    const block = screen.getByTestId("operation-block-op-1");
    expect(block).toBeDefined();
    expect(block.textContent).toContain("caption");
    expect(block.className).toContain("primary");
  });

  test("renders with correct color class for blur", () => {
    render(
      <OperationBlock
        id="op-2"
        type="blur"
        startFrame={0}
        endFrame={60}
        pixelsPerFrame={2}
        selected={false}
        totalFrames={900}
        trackId="t1"
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
      />,
    );
    const block = screen.getByTestId("operation-block-op-2");
    expect(block.className).toContain("secondary");
  });

  test("shows ring highlight when selected", () => {
    render(
      <OperationBlock
        id="op-3"
        type="emoji"
        startFrame={0}
        endFrame={30}
        pixelsPerFrame={2}
        selected={true}
        totalFrames={900}
        trackId="t1"
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
      />,
    );
    const block = screen.getByTestId("operation-block-op-3");
    expect(block.className).toContain("ring");
  });

  test("caption block shows truncated text preview", () => {
    render(
      <OperationBlock
        id="op-4"
        type="caption"
        label="This is a very long caption text that should be truncated"
        startFrame={0}
        endFrame={90}
        pixelsPerFrame={2}
        selected={false}
        totalFrames={900}
        trackId="t1"
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
      />,
    );
    const block = screen.getByTestId("operation-block-op-4");
    expect(block.textContent).toContain("This is a very long");
  });

  test("block width is computed from frame range and pixelsPerFrame", () => {
    render(
      <OperationBlock
        id="op-5"
        type="blur"
        startFrame={10}
        endFrame={60}
        pixelsPerFrame={3}
        selected={false}
        totalFrames={900}
        trackId="t1"
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
      />,
    );
    const block = screen.getByTestId("operation-block-op-5");
    // width = (60 - 10) * 3 = 150px
    expect(block.style.width).toBe("150px");
    // left = 10 * 3 = 30px
    expect(block.style.left).toBe("30px");
  });

  test("renders keyframe diamonds when selected and has keyframes", () => {
    const onSeek = vi.fn();
    render(
      <OperationBlock
        id="op-kf"
        type="blur"
        startFrame={0}
        endFrame={90}
        pixelsPerFrame={2}
        selected={true}
        totalFrames={900}
        trackId="t1"
        keyframes={[{ frame: 10 }, { frame: 50 }]}
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
        onSeekToFrame={onSeek}
      />,
    );
    expect(screen.getByTestId("keyframe-diamond-0")).toBeDefined();
    expect(screen.getByTestId("keyframe-diamond-1")).toBeDefined();
  });

  test("does not render keyframe diamonds when not selected", () => {
    render(
      <OperationBlock
        id="op-kf2"
        type="blur"
        startFrame={0}
        endFrame={90}
        pixelsPerFrame={2}
        selected={false}
        totalFrames={900}
        trackId="t1"
        keyframes={[{ frame: 10 }, { frame: 50 }]}
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.queryByTestId("keyframe-diamond-0")).toBeNull();
    expect(screen.queryByTestId("keyframe-diamond-1")).toBeNull();
  });

  test("clicking a keyframe diamond calls onSeekToFrame", () => {
    const onSeek = vi.fn();
    render(
      <OperationBlock
        id="op-kf3"
        type="zoom"
        startFrame={0}
        endFrame={90}
        pixelsPerFrame={2}
        selected={true}
        totalFrames={900}
        trackId="t1"
        keyframes={[{ frame: 30 }]}
        onClick={() => {}}
        onMove={() => {}}
        onTrimStart={() => {}}
        onTrimEnd={() => {}}
        onTrackChange={() => {}}
        onDelete={() => {}}
        onSeekToFrame={onSeek}
      />,
    );
    const diamond = screen.getByTestId("keyframe-diamond-0");
    fireEvent.pointerDown(diamond);
    expect(onSeek).toHaveBeenCalledWith(30);
  });
});

describe("TrackHeader", () => {
  test("renders track name", () => {
    render(<TrackHeader name="Track 1" trackId="t1" onAddTrack={() => {}} />);
    expect(screen.getByText("Track 1")).toBeDefined();
  });
});

describe("TransportControls", () => {
  test("renders play button and timecode", () => {
    render(
      <TransportControls
        playing={false}
        currentFrame={0}
        totalFrames={900}
        fps={30}
        onPlay={() => {}}
        onPause={() => {}}
        onSkipBack={() => {}}
        onSkipForward={() => {}}
      />,
    );
    expect(screen.getByTestId("transport-play")).toBeDefined();
    expect(screen.getByTestId("transport-timecode")).toBeDefined();
  });

  test("shows pause button when playing", () => {
    render(
      <TransportControls
        playing={true}
        currentFrame={0}
        totalFrames={900}
        fps={30}
        onPlay={() => {}}
        onPause={() => {}}
        onSkipBack={() => {}}
        onSkipForward={() => {}}
      />,
    );
    expect(screen.getByTestId("transport-pause")).toBeDefined();
  });

  test("formats timecode as MM:SS:FF", () => {
    // Frame 90 at 30fps = 00:03:00
    render(
      <TransportControls
        playing={false}
        currentFrame={90}
        totalFrames={900}
        fps={30}
        onPlay={() => {}}
        onPause={() => {}}
        onSkipBack={() => {}}
        onSkipForward={() => {}}
      />,
    );
    expect(screen.getByTestId("transport-timecode").textContent).toBe("00:03:00");
  });
});

describe("TimeRuler", () => {
  test("renders without crashing", () => {
    render(<TimeRuler pixelsPerFrame={2} totalFrames={900} fps={30} scrollLeft={0} />);
    expect(screen.getByTestId("time-ruler")).toBeDefined();
  });
});

describe("SourceMediaBar", () => {
  afterEach(() => {
    useClipStore.getState().reset();
  });

  test("renders with filename and data-testid", () => {
    render(<SourceMediaBar filename="clip.mp4" totalFrames={900} pixelsPerFrame={2} />);
    const bar = screen.getByTestId("source-media-bar");
    expect(bar).toBeDefined();
    expect(bar.textContent).toContain("clip.mp4");
  });

  test("renders clip range overlays from clipStore", () => {
    useClipStore.getState().addRange(10, 100);
    useClipStore.getState().addRange(200, 400);
    render(<SourceMediaBar filename="video.mp4" totalFrames={900} pixelsPerFrame={2} />);
    expect(screen.getByTestId("source-range-0")).toBeDefined();
    expect(screen.getByTestId("source-range-1")).toBeDefined();
  });

  test("shows pending mark-in indicator", () => {
    useClipStore.getState().setMarkInAtFrame(50);
    render(<SourceMediaBar filename="video.mp4" totalFrames={900} pixelsPerFrame={2} />);
    expect(screen.getByTestId("pending-mark-in")).toBeDefined();
  });
});
