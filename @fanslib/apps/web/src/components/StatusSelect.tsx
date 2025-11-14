import type { PostStatus } from "@fanslib/types";
import { cn } from "~/lib/cn";
import { Badge } from "./ui/Badge";

const STATUS_COLORS = {
  draft: "#94a3b8",
  scheduled: "#3b82f6",
  posted: "#22c55e",
} as const;

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  posted: "Posted",
} as const;

const STATUS_OPTIONS = [
  { id: "draft" as const, label: STATUS_LABELS.draft, color: STATUS_COLORS.draft },
  { id: "scheduled" as const, label: STATUS_LABELS.scheduled, color: STATUS_COLORS.scheduled },
  { id: "posted" as const, label: STATUS_LABELS.posted, color: STATUS_COLORS.posted },
] as const;

type StatusSelectProps = {
  value?: PostStatus[];
  onChange: (status: PostStatus[]) => void;
  multiple?: boolean;
  includeNoneOption?: boolean;
};

export const StatusSelect = ({
  value,
  onChange,
  multiple = false,
  includeNoneOption = false,
}: StatusSelectProps) => {
  const values = value ? (Array.isArray(value) ? value : [value]) : [];

  const toggleStatus = (status: PostStatus) => {
    if (multiple) {
      const newValues = values.includes(status)
        ? values.filter((v) => v !== status)
        : [...values, status];
      onChange(newValues.length === 0 && includeNoneOption ? [] : newValues);
      return;
    }

    onChange([status]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((status) => {
        const isSelected = values.includes(status.id);

        return (
          <Badge
            key={status.id}
            variant={isSelected ? "primary" : "neutral"}
            outline={!isSelected}
            className={cn(
              "transition-colors cursor-pointer",
              !multiple && values.length > 0 && !isSelected && "opacity-50"
            )}
            style={{
              backgroundColor: isSelected ? status.color : "transparent",
              borderColor: status.color,
              color: isSelected ? "white" : status.color,
            }}
            onClick={() => toggleStatus(status.id)}
          >
            {status.label}
          </Badge>
        );
      })}
      {includeNoneOption && (
        <Badge
          variant={values.length === 0 ? "neutral" : "neutral"}
          outline={values.length > 0}
          className={cn(
            "transition-colors cursor-pointer text-base-content/60",
            !multiple && values.length > 0 && "opacity-50"
          )}
          onClick={() => onChange(multiple ? [] : [])}
          style={{
            backgroundColor: values.length === 0 ? "hsl(var(--base-300))" : "transparent",
            borderColor: "hsl(var(--base-300))",
          }}
        >
          None
        </Badge>
      )}
    </div>
  );
};

