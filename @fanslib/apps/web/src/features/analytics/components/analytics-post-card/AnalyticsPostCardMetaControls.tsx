import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/cn";
import { Button } from "~/components/ui/Button";

export type AnalyticsPostCardMetaControlsProps = {
  showChartToggle: boolean;
  chartExpanded: boolean;
  onToggleChart: () => void;
  actionSlot?: ReactNode;
};

export const AnalyticsPostCardMetaControls = ({
  showChartToggle,
  chartExpanded,
  onToggleChart,
  actionSlot,
}: AnalyticsPostCardMetaControlsProps) => {
  const hasIconActions = showChartToggle || actionSlot != null;

  if (!hasIconActions) return null;

  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-0.5">
      {showChartToggle ? (
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={chartExpanded}
          aria-label={chartExpanded ? "Hide chart" : "Show chart"}
          onPress={() => onToggleChart()}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", chartExpanded && "rotate-180")} />
        </Button>
      ) : null}
      {actionSlot}
    </div>
  );
};
