import { useEffect, useRef } from "react";

type UseVideoPreviewOptions = {
  isActive: boolean;
  mediaType: "video" | "image";
};

export const useVideoPreview = ({ isActive, mediaType }: UseVideoPreviewOptions) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewIntervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!videoRef.current || mediaType !== "video" || !isActive) return () => {};

    const video = videoRef.current;
    video.muted = true;
    video.currentTime = 0;

    const playVideo = async () => {
      await video.play();
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
      video.pause();
      video.currentTime = 0;
      if (previewIntervalRef.current !== undefined) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, [isActive, mediaType]);

  return { videoRef };
};
