import type { Media } from "@fanslib/server/schemas";
import { useMemo } from "react";
import { getMediaThumbnailUrl } from "~/lib/media-urls";
import { useSiblingsQuery } from "~/lib/queries/library";
import { MediaTileBadges } from "../MediaTile/MediaTileBadges";
import { getSiblingSuggestionMediaId } from "./sibling-suggestions";

type SiblingMedia = Pick<Media, "id" | "name" | "contentRating" | "role">;

type SiblingSuggestionsProps = {
  selectedMedia: Media[];
  onAddMedia: (media: Media) => void;
};

export const SiblingSuggestions = ({ selectedMedia, onAddMedia }: SiblingSuggestionsProps) => {
  const queryMediaId = useMemo(
    () => getSiblingSuggestionMediaId(selectedMedia),
    [selectedMedia],
  );

  const { data: siblings } = useSiblingsQuery(queryMediaId);

  const selectedIds = useMemo(
    () => new Set(selectedMedia.map((m) => m.id)),
    [selectedMedia],
  );

  const suggestions = useMemo(() => {
    if (!siblings || !Array.isArray(siblings)) return [];
    return (siblings as SiblingMedia[]).filter((s) => !selectedIds.has(s.id));
  }, [siblings, selectedIds]);

  if (!queryMediaId || suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-base-content/60">Sibling suggestions</h4>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {suggestions.map((sibling) => (
          <button
            key={sibling.id}
            type="button"
            className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-base-300 hover:border-primary cursor-pointer transition-colors"
            onClick={() => onAddMedia(sibling as unknown as Media)}
            title={`Add ${sibling.name}`}
          >
            <img
              src={getMediaThumbnailUrl(sibling.id)}
              alt={sibling.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
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
