import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { cn } from "~/lib/cn";
import { useHydrated } from "~/hooks/useHydrated";
import { Tooltip } from "~/components/ui/Tooltip";
import { FilterDropdown } from "./FilterDropdown";
import { FilterActions } from "./FilterActions";
import { FilterGroupEditor } from "./FilterGroupEditor";
import { FilterPresetDropdown } from "./FilterPresetDropdown";
import { useMediaFilters } from "./MediaFiltersContext";

type MediaFiltersProps = {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
};

export const MediaFilters = ({ className = "", collapsed = false, onToggle }: MediaFiltersProps) => {
  const { filters } = useMediaFilters();
  const isHydrated = useHydrated();

  // Force empty state until hydration completes
  const displayFilters = isHydrated ? filters : [];
  const hasFilters = displayFilters.length > 0;

  return (
    <div className={cn("flex gap-2 w-full", !hasFilters ? "items-center" : "items-start", className)}>
      {!hasFilters ? (
        /* No filters: Show "Filter" button and preset dropdown */
        <div className="flex items-center gap-1">
          <FilterDropdown />
          <Tooltip content={<p>Apply filter preset</p>} openDelayMs={0}>
            <FilterPresetDropdown className="h-9 w-9" />
          </Tooltip>
        </div>
      ) : (
        /* With filters: Show filter groups + actions (clear, add group) */
        <>
          <div className="flex-grow flex flex-col gap-2">
            {/* Collapsed state: Show summary */}
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <MediaFilterSummary mediaFilters={displayFilters} maxItems={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <FilterGroupEditor />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1">
            {onToggle && (
              <Tooltip content={<p>{collapsed ? "Expand filters" : "Collapse filters"}</p>} openDelayMs={0}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onPress={onToggle}
                >
                  {collapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip>
            )}
            <Tooltip content={<p>Apply filter preset</p>} openDelayMs={0}>
              <FilterPresetDropdown className="h-9 w-9" />
            </Tooltip>
            <FilterActions usePresetDialog={false} />
          </div>
        </>
      )}
    </div>
  );
};
