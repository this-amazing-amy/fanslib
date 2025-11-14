import { Calendar, Camera, FileText, Filter, Hash, MapPin, Minus, Plus } from "lucide-react";
import type { MediaFilters } from "@fanslib/types";
import { cn } from "~/lib/cn";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/Tooltip";

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

const getIncludeIcon = (include: boolean) => {
  return include ? <Plus className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />;
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{item.tooltip}</p>
          {item.details && item.details.length > 1 && (
            <div className="mt-1 text-xs opacity-80">
              {item.details.slice(0, 5).join(", ")}
              {item.details.length > 5 && ` and ${item.details.length - 5} more`}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
      {visibleItems.map((item, index) => (
        <FilterBadge key={`${item.type}-${item.label}-${index}`} item={item} compact={compact} />
      ))}

      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-base-300 text-base-content/60 text-xs">
                +{remainingCount}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                {items
                  .slice(3)
                  .map((item) => item.label)
                  .join(", ")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

  const filterItems: FilterSummaryItem[] = [];

  mediaFilters.forEach((group) => {
    group.items.forEach((item) => {
      let type: FilterSummaryItem["type"] = "content";
      let label = "";
      let tooltip = "";

      if (item.type === "channel") {
        type = "location";
        label = group.include ? "Channels" : "Excluded channels";
        tooltip = `${group.include ? "Include" : "Exclude"} channel: ${item.id}`;
      } else if (item.type === "subreddit") {
        type = "location";
        label = group.include ? "Subreddits" : "Excluded subreddits";
        tooltip = `${group.include ? "Include" : "Exclude"} subreddit: ${item.id}`;
      } else if (item.type === "shoot") {
        type = "content";
        label = group.include ? "Shoots" : "Excluded shoots";
        tooltip = `${group.include ? "Include" : "Exclude"} shoot: ${item.id}`;
      } else if (item.type === "tag") {
        type = "tags";
        label = group.include ? "Tags" : "Excluded tags";
        tooltip = `${group.include ? "Include" : "Exclude"} tag: ${item.id}`;
      } else if (item.type === "filename") {
        type = "content";
        label = group.include ? "Filename" : "Excluded filename";
        tooltip = `${group.include ? "Include" : "Exclude"} files matching: "${item.value}"`;
      } else if (item.type === "caption") {
        type = "content";
        label = group.include ? "Caption" : "Excluded caption";
        tooltip = `${group.include ? "Include" : "Exclude"} posts with caption: "${item.value}"`;
      } else if (item.type === "posted") {
        type = "content";
        label = item.value ? "Posted" : "Unposted";
        tooltip = `Only ${item.value ? "posted" : "unposted"} content`;
      } else if (item.type === "mediaType") {
        type = "media";
        label = item.value === "image" ? "Images" : "Videos";
        tooltip = `Only ${item.value === "image" ? "image" : "video"} files`;
      } else if (item.type === "createdDateStart" || item.type === "createdDateEnd") {
        type = "date";
        label = "Date range";
        tooltip = `Created ${item.type === "createdDateStart" ? "after" : "before"} ${item.value instanceof Date ? item.value.toLocaleDateString() : ""}`;
      }

      if (label) {
        filterItems.push({
          type,
          label,
          count: 1,
          include: group.include,
          tooltip,
        });
      }
    });
  });

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

