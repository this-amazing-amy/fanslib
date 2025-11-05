import { useCallback, useEffect, useState } from "react";
import { cn } from "~/lib/cn";
import { useSettingsQuery } from "~/lib/queries/settings";

export const useSfwMode = () => {
  const { data: settings } = useSettingsQuery();
  const [showContent, setShowContent] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const sfwMode = settings?.sfwMode ?? false;
  const blurIntensity = settings?.sfwBlurIntensity ?? 5;
  const hoverDelay = settings?.sfwHoverDelay ?? 300;

  const handleMouseEnter = useCallback(() => {
    if (sfwMode) {
      if (hoverDelay === 0) {
        setShowContent(true);
      } else {
        const timeout = setTimeout(() => setShowContent(true), hoverDelay);
        setHoverTimeout(timeout);
      }
    }
  }, [sfwMode, hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowContent(false);
  }, [hoverTimeout]);

  const getBlurClassName = useCallback(
    (additionalClasses?: string) => {
      if (!sfwMode) return additionalClasses ?? "";

      const blurClass = `sfw-blur-${blurIntensity}`;
      const transitionClass = "sfw-blur-transition";

      return cn(additionalClasses, !showContent && blurClass, transitionClass);
    },
    [sfwMode, blurIntensity, showContent]
  );

  useEffect(() => () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    }, [hoverTimeout]);

  return {
    sfwMode,
    handleMouseEnter,
    handleMouseLeave,
    getBlurClassName,
  };
};
