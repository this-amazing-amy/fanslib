import type { MediaFilterSchema } from "@fanslib/server/schemas";
import { Calendar, Camera, FileText, Hash, Minus, Tag } from "lucide-react";
import { useTagFilterNames } from "~/hooks/useTagFilterNames";
import { cn } from "~/lib/cn";
import { Badge } from "./ui/Badge/Badge";
import { Tooltip, TooltipTrigger } from "./ui/Tooltip";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type MediaFilterSummaryProps = {
  mediaFilters: MediaFilters | null;
  className?: string;
};

const IncludeIcon = ({ isInclude }: { isInclude: boolean }) => {
  return isInclude ? (
    null
  ) : (
    <Minus className="h-3 w-3" />
  );
};

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
      <TooltipTrigger>
        <Badge
          variant={isInclude ? "primary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>Channel {item.id}</span>
          </span>
        </Badge>
        <Tooltip>{isInclude ? "Include" : "Exclude"} channel: {item.id}</Tooltip>
      </TooltipTrigger>
    );
  }

  // Subreddit filter
  if (item.type === "subreddit") {
    return (
      <TooltipTrigger>
        <Badge
          variant={isInclude ? "primary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>r/{item.id}</span>
          </span>
        </Badge>
        <Tooltip>{isInclude ? "Include" : "Exclude"} subreddit: {item.id}</Tooltip>
      </TooltipTrigger>
    );
  }

  // Tag filter
  if (item.type === "tag") {
    const displayName = tagName || `Tag ${item.id}`;
    return (
      <TooltipTrigger>
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
        <Tooltip>{isInclude ? "Include" : "Exclude"} tag: {displayName}</Tooltip>
      </TooltipTrigger>
    );
  }

  // Shoot filter
  if (item.type === "shoot") {
    return (
      <TooltipTrigger>
        <Badge
          variant={isInclude ? "primary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>Shoot {item.id}</span>
          </span>
        </Badge>
        <Tooltip>{isInclude ? "Include" : "Exclude"} shoot: {item.id}</Tooltip>
      </TooltipTrigger>
    );
  }

  // Filename filter
  if (item.type === "filename") {
    return (
      <TooltipTrigger>
        <Badge
          variant={isInclude ? "secondary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <FileText className="h-3 w-3" />
            <span>Filename: "{item.value}"</span>
          </span>
        </Badge>
        <Tooltip>
          {isInclude ? "Include" : "Exclude"} files matching: "{item.value}"
        </Tooltip>
      </TooltipTrigger>
    );
  }

  // Caption filter
  if (item.type === "caption") {
    return (
      <TooltipTrigger>
        <Badge
          variant={isInclude ? "secondary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>Caption: "{item.value}"</span>
          </span>
        </Badge>
        <Tooltip>
          {isInclude ? "Include" : "Exclude"} posts with caption: "{item.value}"
        </Tooltip>
      </TooltipTrigger>
    );
  }

  // Posted filter
  if (item.type === "posted") {
    return (
      <TooltipTrigger>
        <Badge
          variant={isInclude ? "secondary" : "error"}
          className="text-xs"
        >
          <span className="flex items-center gap-1">
            <IncludeIcon isInclude={isInclude} />
            <span>{item.value ? "Posted" : "Unposted"}</span>
          </span>
        </Badge>
        <Tooltip>Only {item.value ? "posted" : "unposted"} content</Tooltip>
      </TooltipTrigger>
    );
  }

  // Media type filter
  if (item.type === "mediaType") {
    return (
      <TooltipTrigger>
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
        <Tooltip>
          Only {item.value === "image" ? "image" : "video"} files
        </Tooltip>
      </TooltipTrigger>
    );
  }

  // Date range filter
  if (item.type === "createdDateStart" || item.type === "createdDateEnd") {
    const dateStr =
      item.value instanceof Date
        ? item.value.toLocaleDateString()
        : String(item.value);
    return (
      <TooltipTrigger>
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
        <Tooltip>
          Created{" "}
          {item.type === "createdDateStart" ? "after" : "before"} {dateStr}
        </Tooltip>
      </TooltipTrigger>
    );
  }

  // Tag dimension (fallback)
  if (item.type === "dimensionEmpty") {
    return (
      <TooltipTrigger>
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
        <Tooltip>Tag dimension {item.dimensionId} is empty</Tooltip>
      </TooltipTrigger>
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
            tagName={item.type === "tag" ? tagNameMap.get(item.id) : undefined}
          />
        ))
      )}
    </div>
  );
};