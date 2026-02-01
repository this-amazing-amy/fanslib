import type { MediaFilter } from '@fanslib/server/schemas';
import { Calendar, Camera, FileText, Hash, Minus, Tag } from "lucide-react";
import { useMemo } from "react";
import { useTagFilterNames } from "~/hooks/useTagFilterNames";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useSubredditsQuery } from "~/lib/queries/subreddits";
import { Badge } from "./ui/Badge/Badge";
import { Tooltip } from "./ui/Tooltip";

type MediaFilters = MediaFilter;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type MediaFilterSummaryProps = {
  mediaFilters: MediaFilters | null;
  className?: string;
  maxItems?: number;
};

const IncludeIcon = ({ isInclude }: { isInclude: boolean }) =>
  isInclude ? null : <Minus className="h-3 w-3" />;

const FilterItemBadge = ({
  item,
  group,
  channelName,
  subredditName,
  tagName,
}: {
  item: FilterItem;
  group: FilterGroup;
  channelName?: string;
  subredditName?: string;
  tagName?: string;
}) => {
  const isInclude = group.include;

  // Channel filter
  if (item.type === "channel") {
    if (!String(item.id ?? "").trim()) return null;
    const displayName = channelName?.trim() ?? String(item.id);
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} channel: ${displayName}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "secondary"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>{displayName}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Subreddit filter
  if (item.type === "subreddit") {
    if (!String(item.id ?? "").trim()) return null;
    const displayName = subredditName?.trim() ?? String(item.id);
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} subreddit: ${displayName}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "secondary"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>r/{displayName}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Tag filter
  if (item.type === "tag") {
    if (!String(item.id ?? "").trim()) return null;
    const displayName = tagName ?? `Tag ${item.id}`;
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} tag: ${displayName}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "secondary"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <Tag className="h-3 w-3" />
            <span>{displayName}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Shoot filter
  if (item.type === "shoot") {
    if (!String(item.id ?? "").trim()) return null;
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} shoot: ${item.id}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "secondary"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>Shoot {item.id}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Filename filter
  if (item.type === "filename") {
    if (!String(item.value ?? "").trim()) return null;
    return (
      <Tooltip
        content={`${isInclude ? "Include" : "Exclude"} files matching: "${item.value}"`}
        openDelayMs={0}
      >
        <Badge
          variant="secondary"
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <FileText className="h-3 w-3" />
            <span>{`Filename: "${item.value}"`}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Caption filter
  if (item.type === "caption") {
    if (!String(item.value ?? "").trim()) return null;
    return (
      <Tooltip
        content={`${isInclude ? "Include" : "Exclude"} posts with caption: "${item.value}"`}
        openDelayMs={0}
      >
        <Badge
          variant="secondary"
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>{`Caption: "${item.value}"`}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Posted filter
  if (item.type === "posted") {
    return (
      <Tooltip content={`Only ${item.value ? "posted" : "unposted"} content`} openDelayMs={0}>
        <Badge
          variant="secondary"
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>{item.value ? "Posted" : "Unposted"}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Media type filter
  if (item.type === "mediaType") {
    return (
      <Tooltip
        content={`Only ${item.value === "image" ? "image" : "video"} files`}
        openDelayMs={0}
      >
        <Badge
          variant="secondary"
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <Camera className="h-3 w-3" />
            <span>{item.value === "image" ? "Images" : "Videos"}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Date range filter
  if (item.type === "createdDateStart" || item.type === "createdDateEnd") {
    const dateStr =
      item.value instanceof Date
        ? item.value.toLocaleDateString()
        : String(item.value);
    return (
      <Tooltip
        content={`Created ${item.type === "createdDateStart" ? "after" : "before"} ${dateStr}`}
        openDelayMs={0}
      >
        <Badge
          variant="secondary"
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <Calendar className="h-3 w-3" />
            <span>
              {item.type === "createdDateStart" ? "After" : "Before"} {dateStr}
            </span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Tag dimension (fallback)
  if (item.type === "dimensionEmpty") {
    return (
      <Tooltip content={`Tag dimension ${item.dimensionId} is empty`} openDelayMs={0}>
        <Badge
          variant="secondary"
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <Hash className="h-3 w-3" />
            <span>Dimension {item.dimensionId} empty</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  return null;
};

export const MediaFilterSummary = ({
  mediaFilters,
  className,
  maxItems,
}: MediaFilterSummaryProps) => {
  const filterGroups = Array.isArray(mediaFilters) ? mediaFilters : [];
  const { data: channels = [] } = useChannelsQuery();
  const { data: subreddits = [] } = useSubredditsQuery();
  const tagNameMap = useTagFilterNames(filterGroups);
  const getTagName = (tagId: unknown) => {
    const tagIdStr = String(tagId).trim();
    const numericId = Number(tagIdStr);
    const normalizedId = Number.isFinite(numericId) ? String(numericId) : tagIdStr;
    return tagNameMap.get(normalizedId) ?? tagNameMap.get(tagIdStr);
  };

  const channelNameById = useMemo(
    () =>
      (Array.isArray(channels) ? channels : []).reduce((map, channel) => {
        const id = typeof channel?.id === "string" ? channel.id : "";
        const name = typeof channel?.name === "string" ? channel.name : "";
        return id && name ? map.set(id, name) : map;
      }, new Map<string, string>()),
    [channels]
  );

  const subredditNameById = useMemo(
    () =>
      (Array.isArray(subreddits) ? subreddits : []).reduce((map, subreddit) => {
        const id = typeof subreddit?.id === "string" ? subreddit.id : "";
        const name = typeof subreddit?.name === "string" ? subreddit.name : "";
        return id && name ? map.set(id, name) : map;
      }, new Map<string, string>()),
    [subreddits]
  );

  if (filterGroups.length === 0) {
    return null;
  }

  // Flatten all filter items with their groups
  const allItems = filterGroups.flatMap((group) =>
    group.items.map((item: FilterItem) => ({ item, group }))
  );

  const visibleItems = maxItems !== undefined ? allItems.slice(0, maxItems) : allItems;
  const remainingCount = maxItems !== undefined ? allItems.length - maxItems : 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visibleItems.map(({ item, group }) => (
        <FilterItemBadge
          key={`${group.include ? "include" : "exclude"}-${item.type}-${"id" in item ? String(item.id ?? "") : "dimensionId" in item ? String(item.dimensionId) : "value" in item ? String(item.value ?? "") : ""}`}
          item={item}
          group={group}
          channelName={item.type === "channel" ? channelNameById.get(String(item.id)) : undefined}
          subredditName={item.type === "subreddit" ? subredditNameById.get(String(item.id)) : undefined}
          tagName={item.type === "tag" ? getTagName(item.id) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <Tooltip content={`${remainingCount} more filter${remainingCount === 1 ? "" : "s"}`} openDelayMs={0}>
          <Badge variant="secondary" className="text-xs">
            +{remainingCount} more
          </Badge>
        </Tooltip>
      )}
    </div>
  );
};