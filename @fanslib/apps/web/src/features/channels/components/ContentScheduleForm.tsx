import type { CreateContentScheduleRequestBody, CreateContentScheduleRequestBodySchema, MediaFilter, MediaFilterSchema, ScheduleChannel, ScheduleChannelSchema } from '@fanslib/server/schemas';
import { ChevronDown, ChevronUp, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ChannelSelect } from "~/components/ChannelSelect";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { Button } from "~/components/ui/Button/Button";
import { ColorPicker } from "~/components/ui/ColorPicker";
import { EmojiPicker } from "~/components/ui/EmojiPicker";
import { Input } from "~/components/ui/Input/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/Select/Select";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { MediaFilters as MediaFiltersComponent } from "~/features/library/components/MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "~/features/library/components/MediaFilters/MediaFiltersContext";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { parseMediaFilters } from "../content-schedule-helpers";
import { SchedulePreviewCalendar } from "./SchedulePreviewCalendar";

type MediaFilters = MediaFilter;

type ScheduleChannel = ScheduleChannel;
type ScheduleType = "daily" | "weekly" | "monthly";

type ScheduleChannelInput = {
  id?: string;
  channelId: string;
  mediaFilterOverrides: MediaFilters | null;
  sortOrder: number;
};

type ContentScheduleWithChannels = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  type: ScheduleType;
  postsPerTimeframe: number | null;
  preferredDays: string[] | null;
  preferredTimes: string[] | null;
  mediaFilters: string | null;
  scheduleChannels?: ScheduleChannel[];
};

type ContentScheduleFormProps = {
  channelId?: string;
  schedule?: ContentScheduleWithChannels;
  onSubmit: (data: CreateContentScheduleRequestBody) => void | Promise<void>;
  onCancel: () => void;
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const initializeScheduleChannels = (
  schedule: ContentScheduleWithChannels | undefined,
  channelId: string | undefined
): ScheduleChannelInput[] => {
  if (schedule?.scheduleChannels && schedule.scheduleChannels.length > 0) {
    return schedule.scheduleChannels.map((sc, index) => ({
      id: sc.id,
      channelId: sc.channelId,
      mediaFilterOverrides: sc.mediaFilterOverrides ?? null,
      sortOrder: sc.sortOrder ?? index,
    }));
  }
  if (channelId) {
    return [{ channelId, mediaFilterOverrides: null, sortOrder: 0 }];
  }
  return [];
};

export const ContentScheduleForm = ({
  channelId,
  schedule,
  onSubmit,
  onCancel,
}: ContentScheduleFormProps) => {
  const { data: channels = [] } = useChannelsQuery();
  const [name, setName] = useState(schedule?.name ?? "");
  const [emoji, setEmoji] = useState(schedule?.emoji ?? "");
  const [color, setColor] = useState<string | null>(schedule?.color ?? null);
  const [type, setType] = useState<ScheduleType>(schedule?.type ?? "daily");
  const [postsPerTimeframe, setPostsPerTimeframe] = useState(schedule?.postsPerTimeframe ?? 1);
  const [preferredDays, setPreferredDays] = useState<string[]>(schedule?.preferredDays ?? []);
  const [preferredTimes, setPreferredTimes] = useState<string[]>(schedule?.preferredTimes ?? []);
  const [newTime, setNewTime] = useState("");
  const [mediaFilters, setMediaFilters] = useState<MediaFilters>(
    schedule?.mediaFilters ? parseMediaFilters(schedule.mediaFilters) ?? [] : []
  );
  const [scheduleChannels, setScheduleChannels] = useState<ScheduleChannelInput[]>(
    initializeScheduleChannels(schedule, channelId)
  );
  const [expandedChannelFilters, setExpandedChannelFilters] = useState<string | null>(null);

  const selectedChannelIds = scheduleChannels.map((sc) => sc.channelId);

  const handleChannelSelectionChange = (newChannelIds: string[]) => {
    setScheduleChannels((prev) => {
      const existingMap = new Map(prev.map((sc) => [sc.channelId, sc]));
      return newChannelIds.map((cid, index) => {
        const existing = existingMap.get(cid);
        return existing ?? { channelId: cid, mediaFilterOverrides: null, sortOrder: index };
      });
    });
  };

  const handleChannelFilterChange = (channelId: string, filters: MediaFilters) => {
    setScheduleChannels((prev) =>
      prev.map((sc) =>
        sc.channelId === channelId
          ? { ...sc, mediaFilterOverrides: filters.length > 0 ? filters : null }
          : sc
      )
    );
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateContentScheduleRequestBody = {
      scheduleChannels: scheduleChannels.map((sc, index) => ({
        ...(sc.id && { id: sc.id }),
        channelId: sc.channelId,
        mediaFilterOverrides: sc.mediaFilterOverrides,
        sortOrder: index,
      })),
      name: name.trim() || "Untitled Schedule",
      emoji: emoji.trim() || undefined,
      color: color ?? undefined,
      type,
      postsPerTimeframe: postsPerTimeframe > 0 ? postsPerTimeframe : undefined,
      preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
      preferredTimes: preferredTimes.length > 0 ? preferredTimes : undefined,
      mediaFilters: mediaFilters.length > 0 ? mediaFilters : undefined,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Schedule Name & Identity */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <EmojiPicker
            value={emoji}
            onChange={setEmoji}
            placeholder="📅"
          />
          <ColorPicker value={color} onChange={setColor} />
          <Input
            value={name}
            onChange={setName}
            placeholder="Schedule name"
            className="flex-1"
          />
        </div>
        <div>
          <ContentScheduleBadge
            name={name ?? "Preview"}
            emoji={emoji ?? null}
            color={color}
            responsive={false}
          />
        </div>
      </div>

      {/* Target Channels */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Target Channels</span>
          <span className="label-text-alt text-base-content/60">
            Select channels this schedule will post to
          </span>
        </label>
        <ChannelSelect
          value={selectedChannelIds}
          onChange={handleChannelSelectionChange}
          multiple
        />

        {/* Per-channel filter overrides */}
        {scheduleChannels.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-base-content/60">
              Click a channel to configure additional media filters for that channel
            </div>
            {scheduleChannels.map((sc) => {
              const channel = (channels ?? []).find((c) => c.id === sc.channelId);
              const isExpanded = expandedChannelFilters === sc.channelId;
              const hasOverrides = sc.mediaFilterOverrides && sc.mediaFilterOverrides.length > 0;

              return (
                <div key={sc.channelId} className="border border-base-300 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExpandedChannelFilters(isExpanded ? null : sc.channelId)}
                    className="w-full flex items-center justify-between p-3 hover:bg-base-200 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {channel && (
                        <ChannelBadge
                          name={channel.name}
                          typeId={channel.type.id}
                          responsive={false}
                        />
                      )}
                      {hasOverrides && (
                        <span className="badge badge-sm badge-primary">
                          <Settings2 className="w-3 h-3 mr-1" />
                          Filters
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-base-content/60" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-base-content/60" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-base-300">
                      <div className="text-sm text-base-content/60 mb-2">
                        Additional filters for {channel?.name} (e.g., censored content only)
                      </div>
                      <FilterPresetProvider
                        onFiltersChange={(filters) => handleChannelFilterChange(sc.channelId, filters)}
                      >
                        <MediaFiltersProvider
                          value={sc.mediaFilterOverrides ?? []}
                          onChange={(filters) => handleChannelFilterChange(sc.channelId, filters)}
                        >
                          <MediaFiltersComponent />
                        </MediaFiltersProvider>
                      </FilterPresetProvider>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Type */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Schedule Type</span>
        </label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as ScheduleType)}
          aria-label="Schedule type"
        >
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
        <Input
          type="number"
          value={String(postsPerTimeframe)}
          onChange={(value) => setPostsPerTimeframe(Number(value) || 1)}
          min={1}
          max={100}
        />
      </div>

      {/* Preferred Days (for weekly and monthly) */}
      {(type === "weekly" || type === "monthly") && (
        <div>
          <label className="label">
            <span className="label-text font-medium">
              {type === "weekly" ? "Preferred Days of Week" : "Preferred Weekdays"}
            </span>
            {type === "monthly" && (
              <span className="label-text-alt text-base-content/60">
                Posts will be scheduled on the first N occurrences of selected weekdays
              </span>
            )}
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
              onChange={(value) => setNewTime(value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onPress={handleAddTime}
              isDisabled={!newTime}
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

      {/* Schedule Preview */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Preview</span>
        </label>
        <SchedulePreviewCalendar
          type={type}
          postsPerTimeframe={postsPerTimeframe}
          preferredDays={preferredDays}
          preferredTimes={preferredTimes}
        />
      </div>

      {/* Media Filters */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Media Filters</span>
          <span className="label-text-alt text-base-content/60">
            Optional: Define which media is eligible for this schedule
          </span>
        </label>
        <FilterPresetProvider onFiltersChange={setMediaFilters}>
          <MediaFiltersProvider value={mediaFilters} onChange={setMediaFilters}>
            <MediaFiltersComponent />
          </MediaFiltersProvider>
        </FilterPresetProvider>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <button type="submit" className="btn btn-primary">
          {schedule ? "Update Schedule" : "Create Schedule"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
