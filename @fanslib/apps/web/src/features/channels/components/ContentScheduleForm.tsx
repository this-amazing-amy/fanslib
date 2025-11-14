import type {
  CreateContentScheduleRequestBodySchema,
  FetchContentSchedulesByChannelResponseSchema,
} from "@fanslib/server/schemas";
import type { MediaFilters } from "@fanslib/types";
import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/Button/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/Select/Select";
import { Stepper } from "~/components/ui/Stepper/Stepper";
import { Input } from "~/components/ui/Input/Input";
import { MediaFilters as MediaFiltersComponent } from "~/features/library/components/MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "~/features/library/components/MediaFilters/MediaFiltersContext";
import { cn } from "~/lib/cn";
import { parseMediaFilters } from "../content-schedule-helpers";

type ContentSchedule = (typeof FetchContentSchedulesByChannelResponseSchema.static)[number];
type ScheduleType = "daily" | "weekly" | "monthly";

type ContentScheduleFormProps = {
  channelId: string;
  schedule?: ContentSchedule;
  onSubmit: (data: typeof CreateContentScheduleRequestBodySchema.static) => void | Promise<void>;
  onCancel: () => void;
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getLocaleTime = () => {
  const locale = new Intl.Locale(navigator.language);
  const timeFormat = new Intl.DateTimeFormat(locale.baseName, { hour: "numeric" }).resolvedOptions();
  return timeFormat.hour12 ?? false;
};

export const ContentScheduleForm = ({
  channelId,
  schedule,
  onSubmit,
  onCancel,
}: ContentScheduleFormProps) => {
  const [type, setType] = useState<ScheduleType>(schedule?.type ?? "daily");
  const [postsPerTimeframe, setPostsPerTimeframe] = useState(schedule?.postsPerTimeframe ?? 1);
  const [preferredDays, setPreferredDays] = useState<string[]>(schedule?.preferredDays ?? []);
  const [preferredTimes, setPreferredTimes] = useState<string[]>(schedule?.preferredTimes ?? []);
  const [newTime, setNewTime] = useState("");
  const [mediaFilters, setMediaFilters] = useState<MediaFilters>(
    schedule?.mediaFilters ? parseMediaFilters(schedule.mediaFilters) ?? [] : []
  );

  const is12Hour = useMemo(() => getLocaleTime(), []);

  const handleDayToggle = (day: string) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddTime = () => {
    if (!newTime || preferredTimes.includes(newTime)) return;
    setPreferredTimes((prev) => [...prev, newTime]);
    setNewTime("");
  };

  const handleRemoveTime = (time: string) => {
    setPreferredTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: typeof CreateContentScheduleRequestBodySchema.static = {
      channelId,
      type,
      postsPerTimeframe: postsPerTimeframe > 0 ? postsPerTimeframe : undefined,
      preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
      preferredTimes: preferredTimes.length > 0 ? preferredTimes : undefined,
      mediaFilters: mediaFilters.length > 0 ? mediaFilters : undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Schedule Type */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Schedule Type</span>
        </label>
        <Select value={type} onValueChange={(value) => setType(value as ScheduleType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Per Timeframe */}
      <div>
        <label className="label">
          <span className="label-text font-medium">
            Posts per {type === "daily" ? "day" : type === "weekly" ? "week" : "month"}
          </span>
        </label>
        <Stepper
          value={postsPerTimeframe}
          onChange={setPostsPerTimeframe}
          min={1}
          max={100}
        />
      </div>

      {/* Preferred Days (for weekly and monthly) */}
      {(type === "weekly" || type === "monthly") && (
        <div>
          <label className="label">
            <span className="label-text font-medium">Preferred Days</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={cn(
                  "btn btn-sm",
                  preferredDays.includes(day) ? "btn-primary" : "btn-ghost"
                )}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Times */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Preferred Times</span>
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddTime}
              disabled={!newTime}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {preferredTimes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {preferredTimes.map((time) => (
                <div key={time} className="badge badge-neutral gap-2">
                  {time}
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(time)}
                    className="btn btn-ghost btn-xs p-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Filters */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Media Filters</span>
          <span className="label-text-alt text-base-content/60">
            Optional: Define which media is eligible for this schedule
          </span>
        </label>
        <MediaFiltersProvider filters={mediaFilters} onChange={setMediaFilters}>
          <MediaFiltersComponent />
        </MediaFiltersProvider>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {schedule ? "Update Schedule" : "Create Schedule"}
        </Button>
      </div>
    </form>
  );
};
