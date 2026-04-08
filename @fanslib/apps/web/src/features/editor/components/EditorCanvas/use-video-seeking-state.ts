import { useEffect, useState, type RefObject } from "react";

/**
 * Tracks the native `<video>` element's seeking state inside a container.
 * Handles the case where the video element may not be in the DOM yet
 * (Remotion Player mounts it lazily) by using a MutationObserver.
 */
export const useVideoSeekingState = (
  containerRef: RefObject<HTMLDivElement | null>,
  isVideo: boolean,
): boolean => {
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!isVideo) return;

    const container = containerRef.current;
    if (!container) return;

    const cleanup = { fn: undefined as (() => void) | undefined };

    const attachToVideo = () => {
      const video = container.querySelector("video");
      if (!video) return false;

      const onSeeking = () => setIsSeeking(true);
      const onSeeked = () => setIsSeeking(false);

      video.addEventListener("seeking", onSeeking);
      video.addEventListener("seeked", onSeeked);

      cleanup.fn = () => {
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("seeked", onSeeked);
      };
      return true;
    };

    if (attachToVideo()) return () => cleanup.fn?.();

    // Video element may not be in the DOM yet — wait for it
    const observer = new MutationObserver(() => {
      if (attachToVideo()) observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanup.fn?.();
    };
  }, [isVideo, containerRef]);

  return isSeeking;
};
