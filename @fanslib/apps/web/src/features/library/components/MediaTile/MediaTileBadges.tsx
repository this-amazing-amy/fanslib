import type { Media, MediaTag } from "@fanslib/server/schemas";
import { MediaTileTagBadges } from "./MediaTileTagBadges";

type ContentRating = NonNullable<Media["contentRating"]>;

const CONTENT_RATING_COLORS: Record<ContentRating, string> = {
  xt: "bg-red-500",
  uc: "bg-orange-500",
  cn: "bg-yellow-500",
  sg: "bg-green-500",
  sf: "bg-blue-500",
};

type MediaTileBadgesProps = {
  contentRating: ContentRating | null;
  role: string | null;
  tags: MediaTag[];
};

export const MediaTileBadges = ({ contentRating, role, tags }: MediaTileBadgesProps) => {
  if (contentRating || role) {
    return (
      <>
        {contentRating && (
          <span
            data-testid="content-rating-badge"
            className={`${CONTENT_RATING_COLORS[contentRating]} text-white text-[9px] font-bold leading-none px-1.5 py-0.5 rounded-full pointer-events-none`}
          >
            {contentRating.toUpperCase()}
          </span>
        )}
        {role && (
          <span
            data-testid="role-badge"
            className="bg-base-300 text-base-content text-[9px] font-bold leading-none px-1.5 py-0.5 rounded-full pointer-events-none"
          >
            {role}
          </span>
        )}
      </>
    );
  }

  return <MediaTileTagBadges tags={tags} />;
};
