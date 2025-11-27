import { Search } from "lucide-react";
import { EmptyState } from "~/components/ui/EmptyState/EmptyState";
import { useMediaFilters } from "../MediaFilters/MediaFiltersContext";

type GalleryEmptyProps = {
  onScan?: () => void;
};

export const GalleryEmpty = ({ onScan }: GalleryEmptyProps) => {
  const { hasActiveFilters, clearFilters, isHydrated } = useMediaFilters();

  // Only show "has filters" state if hydrated
  const displayHasActiveFilters = isHydrated && hasActiveFilters;

  const description = displayHasActiveFilters
    ? "No media files found for the current filters."
    : "No media files found in the library matching the selected filters.";

  const action = displayHasActiveFilters
    ? {
        label: "Clear filters",
        onClick: clearFilters,
      }
    : onScan
      ? {
          label: "Scan Library",
          onClick: onScan,
        }
      : undefined;

  return (
    <div className="col-span-full">
      <EmptyState
        icon={<Search className="h-12 w-12" />}
        title="No media files found"
        description={description}
        action={action}
      />
    </div>
  );
};
