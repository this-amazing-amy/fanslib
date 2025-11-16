import type { PostStatus } from "@fanslib/types";
import { useMemo } from "react";
import { ChannelSelect } from "~/components/ChannelSelect";
import { SearchInput } from "~/components/SearchInput";
import { StatusSelect } from "~/components/StatusSelect";
import { Button } from "~/components/ui/Button";
import { defaultPreferences, type PostFilterPreferences } from "~/contexts/PostPreferencesContext";

type PostFiltersProps = {
  value: PostFilterPreferences;
  onFilterChange: (filters: Partial<PostFilterPreferences>) => void;
};

const areFiltersEqual = (a: PostFilterPreferences, b: PostFilterPreferences): boolean => {
  if (a.search !== b.search) return false;
  if (JSON.stringify(a.channels?.sort()) !== JSON.stringify(b.channels?.sort())) return false;
  if (JSON.stringify(a.statuses?.sort()) !== JSON.stringify(b.statuses?.sort())) return false;
  if (a.dateRange?.startDate !== b.dateRange?.startDate) return false;
  if (a.dateRange?.endDate !== b.dateRange?.endDate) return false;
  return true;
};

export const PostFilters = ({ value, onFilterChange }: PostFiltersProps) => {
  const hasActiveFilters = useMemo(
    () => !areFiltersEqual(value, defaultPreferences.filter),
    [value]
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-8">
            <SearchInput
              value={value.search ?? ""}
              onChange={(search) => {
                onFilterChange({
                  search: search || undefined,
                });
              }}
              placeholder="Search posts..."
            />
            <StatusSelect
              value={value.statuses}
              multiple
              onChange={(statuses) => {
                onFilterChange({
                  statuses: statuses ? (statuses as PostStatus[]) : undefined,
                });
              }}
            />
            <ChannelSelect
              value={value.channels}
              onChange={(channels) => {
                onFilterChange({
                  channels: channels.length > 0 ? channels : undefined,
                });
              }}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => onFilterChange(defaultPreferences.filter)}
            className="text-base-content/60"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

