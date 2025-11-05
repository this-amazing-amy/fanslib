import { Sticker } from "~/components/ui/Sticker";
import type { Media } from "@fanslib/types";
import { useMediaTagsQuery } from "~/lib/queries/tags";

type MediaTileTagStickersProps = {
  media: Media;
};

export const MediaTileTagStickers = ({ media }: MediaTileTagStickersProps) => {
  const { data: mediaTags = [] } = useMediaTagsQuery(media.id);

  // Filter tags that have sticker display enabled (not 'none')
  const stickerTags = mediaTags.filter(
    (tag) => tag.stickerDisplay && tag.stickerDisplay !== "none"
  );

  if (!stickerTags.length) return null;

  // Group tags by display mode for better rendering
  const colorTags = stickerTags.filter((tag) => tag.stickerDisplay === "color");
  const shortTags = stickerTags.filter((tag) => tag.stickerDisplay === "short");

  return (
    <>
      {/* Render color bubble stickers */}
      {colorTags.length > 0 && (
        <Sticker>
          {colorTags.map((tag) => (
            <div
              key={tag.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color ?? "#666" }}
            />
          ))}
        </Sticker>
      )}

      {/* Render short text stickers */}
      {shortTags.map((tag) => {
        const displayText = tag.shortRepresentation ?? tag.tagDisplayName ?? tag.tagValue;

        return (
          <Sticker key={tag.id} className="text-xs">
            {displayText}
          </Sticker>
        );
      })}
    </>
  );
};
