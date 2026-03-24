import type { Media } from "@fanslib/server/schemas";
import { useNavigate } from "@tanstack/react-router";
import { getMediaThumbnailUrl } from "~/lib/media-urls";
import { MediaTileBadges } from "../MediaTile/MediaTileBadges";

type SiblingMedia = Pick<Media, "id" | "name" | "contentRating" | "role">;

type SiblingStripProps = {
  siblings: SiblingMedia[];
};

export const SiblingStrip = ({ siblings }: SiblingStripProps) => {
  const navigate = useNavigate();

  if (siblings.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Siblings</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {siblings.map((sibling) => (
          <button
            key={sibling.id}
            type="button"
            className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-base-300 hover:border-primary cursor-pointer transition-colors"
            onClick={() =>
              navigate({
                to: "/content/library/media/$mediaId",
                params: { mediaId: sibling.id },
              })
            }
          >
            <img
              src={getMediaThumbnailUrl(sibling.id)}
              alt={sibling.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-1 flex gap-0.5">
              <MediaTileBadges
                contentRating={sibling.contentRating ?? null}
                role={sibling.role ?? null}
                tags={[]}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
