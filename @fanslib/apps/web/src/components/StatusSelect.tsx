import type { PostStatusSchema } from "@fanslib/server/schemas";
import { cn } from "~/lib/cn";
import { POST_STATUS_COLORS } from "~/lib/colors";
import { Badge } from "./ui/Badge";

type PostStatus = typeof PostStatusSchema.static;

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  scheduled: "Scheduled",
  posted: "Posted",
} as const;

const STATUS_OPTIONS = (["draft", "ready", "scheduled", "posted"] as PostStatus[]).map((status) => ({
  id: status,
  label: STATUS_LABELS[status],
  background: POST_STATUS_COLORS[status].background,
  foreground: POST_STATUS_COLORS[status].foreground,
}));

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
              backgroundColor: isSelected
                ? status.background
                : `color-mix(in oklch, ${status.background} 12%, transparent)`,
              borderColor: status.foreground,
              color: status.foreground,
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

