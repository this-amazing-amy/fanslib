import type { MediaTag } from '@fanslib/server/schemas';
import { TagBadge } from "../MediaTagEditor/DimensionTagSelector/TagBadge";

type MediaTileTagBadgesProps = {
  tags: MediaTag[];
};

export const MediaTileTagBadges = ({ tags }: MediaTileTagBadgesProps) => {
  const stickerTags = tags.filter(
    (tag) => tag.stickerDisplay && tag.stickerDisplay !== "none" && (tag.shortRepresentation ?? tag.tagDisplayName ?? tag.tagValue)
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
            displayName: tag.shortRepresentation ?? tag.tagDisplayName ?? tag.tagValue,
          }}
          size="sm"
          className="pointer-events-none"
          selectionMode="radio"
          selectionState="checked"
        />
      ))}
    </>
  );
};


