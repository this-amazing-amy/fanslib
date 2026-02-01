import type { Media, MediaSchema } from '@fanslib/server/schemas';
import { useMediaTagsQuery } from "~/lib/queries/tags";
import { TagBadge } from "../MediaTagEditor/DimensionTagSelector/TagBadge";


type MediaTileTagBadgesProps = {
  media: Media;
};

export const MediaTileTagBadges = ({ media }: MediaTileTagBadgesProps) => {
  const { data: mediaTags = [] } = useMediaTagsQuery({ mediaId: media.id });

  const stickerTags = (mediaTags ?? []).filter(
    (tag) => tag.stickerDisplay && tag.stickerDisplay !== "none"
  );

  if (!stickerTags.length) return null;

  return (
    <>
      {stickerTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={{
            id: tag.tagDefinitionId,
            color: tag.color,
            displayName: tag.shortRepresentation ?? tag.tagDisplayName,
          }}
          size="sm"
          className="text-[10px]"
          selectionMode="radio"
        />
      ))}
    </>
  );
};


