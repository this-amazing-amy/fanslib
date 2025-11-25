import type { MediaFilterSchema } from "@fanslib/server/schemas";
import { Calendar, Camera, FileText, Filter, Hash, MapPin, Minus, Plus } from "lucide-react";
import { cn } from "~/lib/cn";
import { Tooltip, TooltipTrigger } from "./ui/Tooltip";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type FilterSummaryItem = {
  type: "content" | "location" | "media" | "date" | "tags";
  label: string;
  count: number;
  include: boolean;
  tooltip: string;
  details?: string[];
};

type MediaFilterSummaryProps = {
  mediaFilters: MediaFilters | null;
  className?: string;
  compact?: boolean;
  layout?: "inline" | "stacked" | "grouped";
};

const getFilterIcon = (type: FilterSummaryItem["type"], size = "h-3 w-3") => {
  switch (type) {
    case "location":
      return <MapPin className={size} />;
    case "content":
      return <FileText className={size} />;
    case "media":
      return <Camera className={size} />;
    case "date":
      return <Calendar className={size} />;
    case "tags":
      return <Hash className={size} />;
    default:
      return <Filter className={size} />;
  }
};

const getIncludeIcon = (include: boolean) => include ? <Plus className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />;

type FilterItemDetails = {
  type: FilterSummaryItem["type"];
  label: string;
  tooltip: string;
};

const getFilterItemDetails = (item: FilterItem, group: FilterGroup): FilterItemDetails | null => {
  if (item.type === "channel") {
    return {
      type: "location",
      label: group.include ? "Channels" : "Excluded channels",
      tooltip: `${group.include ? "Include" : "Exclude"} channel: ${item.id}`,
    };
  }
  if (item.type === "subreddit") {
    return {
      type: "location",
      label: group.include ? "Subreddits" : "Excluded subreddits",
      tooltip: `${group.include ? "Include" : "Exclude"} subreddit: ${item.id}`,
    };
  }
  if (item.type === "shoot") {
    return {
      type: "content",
      label: group.include ? "Shoots" : "Excluded shoots",
      tooltip: `${group.include ? "Include" : "Exclude"} shoot: ${item.id}`,
    };
  }
  if (item.type === "tag") {
    return {
      type: "tags",
      label: group.include ? "Tags" : "Excluded tags",
      tooltip: `${group.include ? "Include" : "Exclude"} tag: ${item.id}`,
    };
  }
  if (item.type === "filename") {
    return {
      type: "content",
      label: group.include ? "Filename" : "Excluded filename",
      tooltip: `${group.include ? "Include" : "Exclude"} files matching: "${item.value}"`,
    };
  }
  if (item.type === "caption") {
    return {
      type: "content",
      label: group.include ? "Caption" : "Excluded caption",
      tooltip: `${group.include ? "Include" : "Exclude"} posts with caption: "${item.value}"`,
    };
  }
  if (item.type === "posted") {
    return {
      type: "content",
      label: item.value ? "Posted" : "Unposted",
      tooltip: `Only ${item.value ? "posted" : "unposted"} content`,
    };
  }
  if (item.type === "mediaType") {
    return {
      type: "media",
      label: item.value === "image" ? "Images" : "Videos",
      tooltip: `Only ${item.value === "image" ? "image" : "video"} files`,
    };
  }
  if (item.type === "createdDateStart" || item.type === "createdDateEnd") {
    return {
      type: "date",
      label: "Date range",
      tooltip: `Created ${item.type === "createdDateStart" ? "after" : "before"} ${item.value instanceof Date ? item.value.toLocaleDateString() : ""}`,
    };
  }
  return null;
};

const FilterBadge = ({ item, compact }: { item: FilterSummaryItem; compact?: boolean }) => {
  const displayLabel = compact
    ? `${item.count}`
    : item.details && item.details.length > 0
      ? item.details.length === 1
        ? item.details[0]
        : `${item.details.slice(0, 2).join(", ")}${item.details.length > 2 ? ` +${item.details.length - 2}` : ""}`
      : item.count > 1
        ? `${item.label} (${item.count})`
        : item.label;

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border text-xs font-medium transition-colors cursor-default",
        item.include
          ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
          : "bg-error/10 text-error border-error/20 hover:bg-error/20",
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      )}
    >
      <span className="flex items-center gap-0.5">
        {getIncludeIcon(item.include)}
        {getFilterIcon(item.type, "h-2.5 w-2.5")}
      </span>
      <span>{displayLabel}</span>
    </span>
  );

  return (
    <TooltipTrigger>
      {badge}
      <Tooltip className="max-w-xs">
        <p>{item.tooltip}</p>
        {item.details && item.details.length > 1 && (
          <div className="mt-1 text-xs opacity-80">
            {item.details.slice(0, 5).join(", ")}
            {item.details.length > 5 && ` and ${item.details.length - 5} more`}
          </div>
        )}
      </Tooltip>
    </TooltipTrigger>
  );
};

const FilterSummary = ({ items, compact }: { items: FilterSummaryItem[]; compact?: boolean }) => {
  if (items.length === 0) {
    return null;
  }

  const visibleItems = compact ? items.slice(0, 3) : items;
  const remainingCount = compact ? Math.max(0, items.length - 3) : 0;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleItems.map((item) => (
        <FilterBadge key={`${item.type}-${item.label}-${item.tooltip}`} item={item} compact={compact} />
      ))}

      {remainingCount > 0 && (
        <TooltipTrigger>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-base-300 text-base-content/60 text-xs">
            +{remainingCount}
          </span>
          <Tooltip className="max-w-xs">
            <p>
              {items
                .slice(3)
                .map((item) => item.label)
                .join(", ")}
            </p>
          </Tooltip>
        </TooltipTrigger>
      )}
    </div>
  );
};

export const MediaFilterSummary = ({
  mediaFilters,
  className,
  compact = false,
  layout = "inline",
}: MediaFilterSummaryProps) => {
  if (!mediaFilters || mediaFilters.length === 0) {
    return null;
  }

  const filterItems: FilterSummaryItem[] = mediaFilters.flatMap((group) =>
    group.items
      .map((item) => getFilterItemDetails(item, group))
      .filter((details): details is FilterItemDetails => details !== null)
      .map((details) => ({
        ...details,
        count: 1,
        include: group.include,
      }))
  );

  if (filterItems.length === 0) {
    return null;
  }

  const includeItems = filterItems.filter((item) => item.include);
  const excludeItems = filterItems.filter((item) => !item.include);

  if (layout === "grouped" && !compact) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {includeItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-base-content/60 font-medium">Include</span>
            <FilterSummary items={includeItems} compact={compact} />
          </div>
        )}
        {excludeItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-base-content/60 font-medium">Exclude</span>
            <FilterSummary items={excludeItems} compact={compact} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <FilterSummary items={filterItems} compact={compact} />
    </div>
  );
};

