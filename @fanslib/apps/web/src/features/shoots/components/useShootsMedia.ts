import type { Media, MediaSchema, ShootSummary, ShootSummarySchema } from '@fanslib/server/schemas';
import { useMemo } from "react";



type GroupKey = {
  shootId: string;
  viewIndex: string;
};

export type GroupedShootMedia = {
  allMedia: Map<GroupKey, Media[]>;
  shootsMedia: Map<GroupKey, Map<string, Media[]>>;
};

const sortMediaByDate = (a: Media, b: Media) =>
  b.fileCreationDate.getTime() - a.fileCreationDate.getTime();

// Left here as a reference. Before it was grouped by category, but we can't to that anymore as we're using tags now.
const shouldBeGrouped = (_media: Media) => false;

export const useShootsMedia = (shoots: ShootSummary[]): GroupedShootMedia => useMemo(() => {
    const shootsMedia = new Map<GroupKey, Map<string, Media[]>>();
    const allMedia = new Map<GroupKey, Media[]>();

    // Sort shoots by shootDate (descending) to match the view
    const sortedShoots = [...shoots].sort(
      (a, b) => new Date(b.shootDate).getTime() - new Date(a.shootDate).getTime()
    );

    sortedShoots.forEach((shoot, viewIndex) => {
      if (!shoot.media) return;

      // Create group key with both shoot ID and view index
      const groupKey = {
        shootId: shoot.id,
        viewIndex: viewIndex.toString().padStart(5, "0"),
      };

      // Add all media to the shoot-grouped map
      const sortedMedia = [...shoot.media].sort(sortMediaByDate);
      allMedia.set(groupKey, sortedMedia);

      // Group media for this shoot
      const grouped = new Map<string, Media[]>();
      const uncategorized: Media[] = [];

      shoot.media.forEach((media) => {
        if (!shouldBeGrouped(media)) {
          uncategorized.push(media);
        } else {
          // // Sort categories to ensure stable ordering
          // const sortedCategories = [...media.categories].sort((a, b) => a.id.localeCompare(b.id));
          // sortedCategories.forEach((category) => {
          //   const existing = grouped.get(category.id) || [];
          //   grouped.set(category.id, [...existing, media]);
          // });
        }
      });

      // Sort media within each category by fileCreationDate
      grouped.forEach((mediaList, categoryId) => {
        grouped.set(categoryId, [...mediaList].sort(sortMediaByDate));
      });

      // Add uncategorized at the end if there are any
      if (uncategorized.length > 0) {
        grouped.set("uncategorized", [...uncategorized].sort(sortMediaByDate));
      }

      // If not grouping by category, create a single "ALL" group
      // if (!shootPreferences.groupByCategory) {
      // eslint-disable-next-line no-constant-condition
      if (true) {
        const sortedMap = new Map<string, Media[]>();
        sortedMap.set("ALL", sortedMedia);
        shootsMedia.set(groupKey, sortedMap);
      } else {
        // Sort category IDs to ensure stable ordering
        const sortedGrouped = new Map(
          [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
        );
        shootsMedia.set(groupKey, sortedGrouped);
      }
    });

    return { allMedia, shootsMedia };
  }, [shoots]);
