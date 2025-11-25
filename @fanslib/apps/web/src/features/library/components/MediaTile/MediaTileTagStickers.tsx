import type { MediaSchema } from "@fanslib/server/schemas";
import { Sticker } from "~/components/ui/Sticker";
import { useMediaTagsQuery } from "~/lib/queries/tags";
import { getColorDefinitionFromString } from "~/lib/colors";

type Media = typeof MediaSchema.static;

type MediaTileTagStickersProps = {
  media: Media;
};

export const MediaTileTagStickers = ({ media }: MediaTileTagStickersProps) => {
  const { data: mediaTags = [] } = useMediaTagsQuery({ mediaId: media.id });

  // Filter tags that have sticker display enabled (not 'none')
  const stickerTags = (mediaTags ?? []).filter(
    (tag) => tag.stickerDisplay && tag.stickerDisplay !== "none"
  );

  if (!stickerTags.length) return null;

  // Group tags by display mode for better rendering
  const colorTags = stickerTags.filter((tag) => tag.stickerDisplay === "color");
  const shortTags = stickerTags.filter((tag) => tag.stickerDisplay === "short");

  return (
    <>
      {/* Render color stickers */}
      {colorTags.map((tag) => {
        const colors = getColorDefinitionFromString(tag.color, tag.id);

        return (
          <div
            key={tag.id}
            className="rounded-full flex items-center justify-center min-w-5 h-5 p-1 border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.foreground,
            }}
          />
        );
      })}

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
