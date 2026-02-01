import { cn } from "~/lib/cn";

type ThresholdType = "views" | "engagement";

type ThresholdSelectorProps = {
  thresholdType: ThresholdType;
  thresholdValue: number;
  userAverageViews: number;
  userAverageEngagementSeconds: number;
  onThresholdTypeChange: (type: ThresholdType) => void;
  onThresholdValueChange: (value: number) => void;
};

export const ThresholdSelector = ({
  thresholdType,
  thresholdValue,
  userAverageViews,
  userAverageEngagementSeconds,
  onThresholdTypeChange,
  onThresholdValueChange,
}: ThresholdSelectorProps) => {
  const formatNumber = (num: number) =>
    num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toFixed(0);

  const averageLabel =
    thresholdType === "views"
      ? `Your avg: ${formatNumber(userAverageViews)} views`
      : `Your avg: ${userAverageEngagementSeconds.toFixed(0)}s engagement`;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium">Threshold:</span>

      <select
        className="select select-sm select-bordered"
        value={thresholdType}
        onChange={(e) => onThresholdTypeChange(e.target.value as ThresholdType)}
      >
        <option value="views">Views</option>
        <option value="engagement">Engagement</option>
      </select>

      <div className="flex items-center gap-1.5">
        <span className="text-sm text-base-content/70">Below:</span>
        <input
          type="number"
          className="input input-sm input-bordered w-24"
          value={thresholdValue}
          onChange={(e) => onThresholdValueChange(Number(e.target.value))}
          min={0}
        />
      </div>

      <span className={cn("text-sm text-base-content/60")}>{averageLabel}</span>
    </div>
  );
};
