import { useEffect, useRef, useState } from "react";

type UseVideoPreviewOptions = {
  isActive: boolean;
  mediaType: "video" | "image";
};

export const useVideoPreview = ({ isActive, mediaType }: UseVideoPreviewOptions) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewIntervalRef = useRef<number | undefined>(undefined);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (!videoRef.current || mediaType !== "video" || !isActive) {
      setIsVideoReady(false);
      return () => {};
    }

    const video = videoRef.current;
    video.muted = true;
    video.currentTime = 0;

    const onCanPlay = () => {
      setIsVideoReady(true);
    };

    video.addEventListener("canplay", onCanPlay, { once: true });

    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        // Play may be interrupted if user moves mouse away quickly
      }
    };

    playVideo();

    // Skip forward every second
    previewIntervalRef.current = window.setInterval(() => {
      if (video.currentTime < video.duration - 2) {
        video.currentTime += 2;
      } else {
        video.currentTime = 0;
      }
    }, 1000);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.pause();
      video.currentTime = 0;
      setIsVideoReady(false);
      if (previewIntervalRef.current !== undefined) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, [isActive, mediaType]);

  return { videoRef, isVideoReady };
};
