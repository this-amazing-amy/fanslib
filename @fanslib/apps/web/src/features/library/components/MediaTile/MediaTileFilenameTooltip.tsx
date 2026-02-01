import type { Media } from '@fanslib/server/schemas';


import { useState } from "react";

type MediaFileFilenameTooltipProps = {
  media: Media;
  children: React.ReactNode;
};

export const MediaFileFilenameTooltip = ({ media, children }: MediaFileFilenameTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-white text-black p-2 rounded-md shadow-lg max-w-[300px] break-all text-xs"
          style={{ pointerEvents: "none" }}
        >
          {media.name}
        </div>
      )}
    </div>
  );
};
