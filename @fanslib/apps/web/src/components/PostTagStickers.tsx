import type { PostMediaWithMedia } from '@fanslib/server/schemas';
import { memo, useMemo } from "react";
import { groupBy } from "remeda";
import { useTagsForMediasQuery } from "~/lib/queries/tags";
import { Sticker } from "./ui/Sticker";


type PostTagStickersProps = {
  postMedia: PostMediaWithMedia[];
};

export const PostTagStickers = memo(({ postMedia }: PostTagStickersProps) => {
  const mediaIds = useMemo(
    () =>
      postMedia
        .map((pm) => pm?.media?.id)
        .filter((id): id is string => id != null),
    [postMedia]
  );
  const { data: allMediaTags = [] } = useTagsForMediasQuery(mediaIds);

  const aggregatedTags = useMemo(() => {
    if (!allMediaTags.length) return [];

    const tagGroups = groupBy(allMediaTags, (mediaTag) => mediaTag?.tagDefinitionId.toString());

    return Object.values(tagGroups).map((group) => group[0]);
  }, [allMediaTags]);

  const stickerTags = useMemo(
    () => aggregatedTags.filter((tag) => tag?.stickerDisplay && tag.stickerDisplay !== "none"),
    [aggregatedTags]
  );

  if (!stickerTags.length) return null;

  const colorTags = stickerTags.filter((tag) => tag?.stickerDisplay === "color");
  const shortTags = stickerTags.filter((tag) => tag?.stickerDisplay === "short");

  return (
    <>
      {colorTags.length > 0 && (
        <Sticker>
          {colorTags.map((tag) => (
            <div
              key={tag?.id ?? undefined}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag?.color ?? "#666" }}
            />
          ))}
        </Sticker>
      )}

      {shortTags.map((tag) => {
        const displayText = tag?.shortRepresentation ?? tag?.tagDisplayName ?? tag?.tagValue;

        return (
          <Sticker key={tag?.id} className="text-xs">
            {displayText}
          </Sticker>
        );
      })}
    </>
  );
});

PostTagStickers.displayName = "PostTagStickers";

