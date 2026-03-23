import type { FilterItem, FilterGroup, MediaFilters } from "./filter-types";

export const filterItemToString = (item: FilterItem): string => {
  switch (item.type) {
    case "channel":
      return `Channel: ${item.id}`;
    case "subreddit":
      return `Subreddit: ${item.id}`;
    case "tag":
      return `Tag: ${item.id}`;
    case "shoot":
      return `Shoot: ${item.id}`;
    case "filename":
      return `Filename: "${item.value}"`;
    case "caption":
      return `Caption: "${item.value}"`;
    case "posted":
      return item.value ? "Posted" : "Unposted";
    case "mediaType":
      return `Media type: ${item.value === "image" ? "Image" : "Video"}`;
    case "createdDateStart":
      return `Created after: ${item.value.toLocaleDateString()}`;
    case "createdDateEnd":
      return `Created before: ${item.value.toLocaleDateString()}`;
    case "dimensionEmpty":
      return `Missing tags from dimension: ${item.dimensionId}`;
    case "excluded":
      return item.value ? "Excluded from posting" : "Not excluded";
    case "repostStatus": {
      const labels: Record<string, string> = {
        never_posted: "Never Posted",
        repostable: "Repostable",
        on_cooldown: "On Cooldown",
        still_growing: "Still Growing",
      };
      return labels[item.value] ?? "Unknown repost status";
    }
    default:
      return "Unknown filter";
  }
};

export const filterGroupToString = (group: FilterGroup): string => {
  if (group.items.length === 0) {
    return "";
  }

  const prefix = group.include ? "Include" : "Exclude";
  const itemStrings = group.items.map(filterItemToString);

  if (itemStrings.length === 1) {
    return `${prefix}: ${itemStrings[0]}`;
  }

  return `${prefix}: ${itemStrings.join(", ")}`;
};

export const mediaFiltersToString = (filters: MediaFilters): string => {
  if (filters?.length === 0) {
    return "No filters";
  }

  const groupStrings = filters
    .filter((group: FilterGroup) => group.items.length > 0)
    .map(filterGroupToString);

  return groupStrings.join(" | ");
};
