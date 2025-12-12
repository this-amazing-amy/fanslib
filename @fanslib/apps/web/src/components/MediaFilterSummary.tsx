import type { MediaFilterSchema } from "@fanslib/server/schemas";
import { Calendar, Camera, FileText, Hash, Minus, Tag } from "lucide-react";
import { useTagFilterNames } from "~/hooks/useTagFilterNames";
import { cn } from "~/lib/cn";
import { Badge } from "./ui/Badge/Badge";
import { Tooltip } from "./ui/Tooltip";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type MediaFilterSummaryProps = {
  mediaFilters: MediaFilters | null;
  className?: string;
};

const IncludeIcon = ({ isInclude }: { isInclude: boolean }) =>
  isInclude ? null : <Minus className="h-3 w-3" />;

const FilterItemBadge = ({
  item,
  group,
  tagName,
}: {
  item: FilterItem;
  group: FilterGroup;
  tagName?: string;
}) => {
  const isInclude = group.include;

  // Channel filter
  if (item.type === "channel") {
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} channel: ${item.id}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>Channel {item.id}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Subreddit filter
  if (item.type === "subreddit") {
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} subreddit: ${item.id}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>r/{item.id}</span>
          </span>
        </Badge>
      </Tooltip>
    );
  }

  // Tag filter
  if (item.type === "tag") {
    const displayName = tagName ?? `Tag ${item.id}`;
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} tag: ${displayName}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "error"}
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
    return (
      <Tooltip content={`${isInclude ? "Include" : "Exclude"} shoot: ${item.id}`} openDelayMs={0}>
        <Badge
          variant={isInclude ? "primary" : "error"}
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
    return (
      <Tooltip
        content={`${isInclude ? "Include" : "Exclude"} files matching: "${item.value}"`}
        openDelayMs={0}
      >
        <Badge
          variant={isInclude ? "secondary" : "error"}
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
    return (
      <Tooltip
        content={`${isInclude ? "Include" : "Exclude"} posts with caption: "${item.value}"`}
        openDelayMs={0}
      >
        <Badge
          variant={isInclude ? "secondary" : "error"}
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
          variant={isInclude ? "secondary" : "error"}
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
          variant={isInclude ? "secondary" : "error"}
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
          variant={isInclude ? "secondary" : "error"}
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
          variant={isInclude ? "secondary" : "error"}
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
}: MediaFilterSummaryProps) => {
  const filterGroups = Array.isArray(mediaFilters) ? mediaFilters : [];
  const tagNameMap = useTagFilterNames(filterGroups);
  const getTagName = (tagId: unknown) => {
    const tagIdStr = String(tagId).trim();
    const numericId = Number(tagIdStr);
    const normalizedId = Number.isFinite(numericId) ? String(numericId) : tagIdStr;
    return tagNameMap.get(normalizedId) ?? tagNameMap.get(tagIdStr);
  };

  if (filterGroups.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filterGroups.map((group, groupIdx) =>
        group.items.map((item: FilterItem, itemIdx: number) => (
          <FilterItemBadge
            key={`${groupIdx}-${itemIdx}`}
            item={item}
            group={group}
            tagName={item.type === "tag" ? getTagName(item.id) : undefined}
          />
        ))
      )}
    </div>
  );
};