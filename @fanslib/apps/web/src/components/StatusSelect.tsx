import type { PostStatusSchema } from "@fanslib/server/schemas";
import { cn } from "~/lib/cn";
import { POST_STATUS_COLORS } from "~/lib/colors";
import { StatusBadge } from "./StatusBadge";

type PostStatus = typeof PostStatusSchema._type;

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
          <StatusBadge
            key={status.id}
            size="md"
            status={status.id}
            selected={isSelected}
            selectable
            responsive={false}
            className={cn(
              "rounded-full font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
              !multiple && values.length > 0 && !isSelected && "opacity-50"
            )}
            onSelectionChange={() => toggleStatus(status.id)}
          />
        );
      })}
      {includeNoneOption && (
        <button
          type="button"
          className={cn(
            "px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer text-base-content/60",
            values.length > 0 && "opacity-50"
          )}
          onClick={() => onChange([])}
        >
          None
        </button>
      )}
    </div>
  );
};

