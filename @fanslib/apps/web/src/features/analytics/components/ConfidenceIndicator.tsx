import { AlertTriangle, Check } from "lucide-react";
import { Skeleton } from "~/components/ui/Skeleton";
import { cn } from "~/lib/cn";
import { useAnalyticsHealthQuery } from "~/lib/queries/analytics";

type ConfidenceIndicatorProps = {
  openDrawer: () => void;
};

export const ConfidenceIndicator = ({ openDrawer }: ConfidenceIndicatorProps) => {
  const { data: health, isLoading } = useAnalyticsHealthQuery();

  if (isLoading || !health) {
    return <Skeleton className="w-28 h-6" />;
  }

  const percent = health.coveragePercent;
  const variant = percent >= 90 ? "success" : percent >= 70 ? "warning" : "error";
  const hasActions = health.pendingMatches > 0 || health.staleCount > 0;

  return (
    <button
      onClick={openDrawer}
      className={cn(
        "badge gap-1.5 cursor-pointer transition-colors",
        variant === "success" && "badge-success",
        variant === "warning" && "badge-warning",
        variant === "error" && "badge-error"
      )}
    >
      {Math.round(percent)}% tracked
      {variant === "success" ? (
        <Check className="w-3 h-3" />
      ) : (
        <AlertTriangle className="w-3 h-3" />
      )}
      {hasActions && (
        <span className="badge badge-xs badge-neutral">!</span>
      )}
    </button>
  );
};
