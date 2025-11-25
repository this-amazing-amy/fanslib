import type { MediaFilterSchema } from "@fanslib/server/schemas";
import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, VideoIcon, X } from "lucide-react";
import { useState } from "react";
import { I18nProvider } from "react-aria";
import { Button } from "~/components/ui/Button";
import { Calendar } from "~/components/ui/Calendar";
import { Input } from "~/components/ui/Input";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/Select";
import { Switch } from "~/components/ui/Switch";
import { cn } from "~/lib/cn";
import { ChannelFilterSelector } from "./ChannelFilterSelector";
import { DimensionFilterSelector } from "./DimensionFilterSelector";
import { ShootFilterSelector } from "./ShootFilterSelector";
import { SubredditFilterSelector } from "./SubredditFilterSelector";
import { TagFilterSelector } from "./TagFilterSelector";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type FilterItemRendererProps = {
  type: FilterItem["type"];
  value?: FilterItem;
  onChange: (item: FilterItem) => void;
  onRemove: () => void;
};

export const FilterItemRenderer = ({
  type,
  value,
  onChange,
  onRemove,
}: FilterItemRendererProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const RemoveButton = () => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 flex-shrink-0"
      onPress={onRemove}
    >
      <X className="h-4 w-4" />
    </Button>
  );

  switch (type) {
    case "channel":
      return (
        <div className="flex items-center gap-1">
          <ChannelFilterSelector
            value={value && "id" in value ? value.id : undefined}
            onChange={(channelId) => onChange({ type: "channel", id: channelId })}
          />
          <RemoveButton />
        </div>
      );

    case "subreddit":
      return (
        <div className="flex items-center gap-1">
          <SubredditFilterSelector
            value={value && "id" in value ? value.id : undefined}
            onChange={(subredditId) => onChange({ type: "subreddit", id: subredditId })}
          />
          <RemoveButton />
        </div>
      );

    case "tag":
      return (
        <div className="flex items-center gap-1">
          <TagFilterSelector
            value={value && "id" in value ? value.id : undefined}
            onChange={(tagId) => onChange({ type: "tag", id: tagId })}
          />
          <RemoveButton />
        </div>
      );

    case "shoot":
      return (
        <div className="flex items-center gap-1">
          <ShootFilterSelector
            value={value && "id" in value ? value.id : undefined}
            onChange={(shootId) => onChange({ type: "shoot", id: shootId })}
          />
          <RemoveButton />
        </div>
      );

    case "dimensionEmpty":
      return (
        <div className="flex items-center gap-1">
          <DimensionFilterSelector
            value={value && "dimensionId" in value ? value.dimensionId : undefined}
            onChange={(dimensionId) => onChange({ type: "dimensionEmpty", dimensionId })}
          />
          <RemoveButton />
        </div>
      );

    case "filename":
    case "caption":
      return (
        <div className="flex items-center gap-1">
          <Input
            value={value && "value" in value && typeof value.value === "string" ? value.value : ""}
            onChange={(newValue) => onChange({ type, value: newValue })}
            placeholder={`Enter ${type} text`}
          />
          <RemoveButton />
        </div>
      );

    case "posted":
      return (
        <div className="flex items-center gap-2">
          <Switch
            isSelected={
              value && "value" in value && typeof value.value === "boolean" ? value.value : false
            }
            onChange={(isSelected) => onChange({ type: "posted", value: isSelected })}
          />
          <span className="text-sm">
            {value && "value" in value && typeof value.value === "boolean" && value.value
              ? "Posted"
              : "Unposted"}
          </span>
          <RemoveButton />
        </div>
      );

    case "mediaType":
      return (
        <div className="flex items-center gap-1">
          <Select
            value={
              value && "value" in value && typeof value.value === "string" ? value.value : "image"
            }
            onValueChange={(newValue) =>
              onChange({ type: "mediaType", value: newValue as "image" | "video" })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <VideoIcon className="h-4 w-4" />
                  Video
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <RemoveButton />
        </div>
      );

    case "createdDateStart":
    case "createdDateEnd": {
      const dateValue =
        value && "value" in value && value.value instanceof Date ? value.value : undefined;
      const calendarValue = dateValue
        ? new CalendarDate(
            dateValue.getFullYear(),
            dateValue.getMonth() + 1,
            dateValue.getDate()
          )
        : undefined;
      return (
        <div className="flex items-center gap-1">
          <PopoverTrigger isOpen={calendarOpen} onOpenChange={setCalendarOpen}>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
            </Button>
            <Popover className="w-auto p-0">
              <I18nProvider locale="de-DE">
                <Calendar
                  value={calendarValue}
                  onChange={(date) => {
                    if (date) {
                      const jsDate = new Date(date.year, date.month - 1, date.day);
                      onChange({ type, value: jsDate });
                      setCalendarOpen(false);
                    }
                  }}
                />
              </I18nProvider>
            </Popover>
          </PopoverTrigger>
          <RemoveButton />
        </div>
      );
    }

    default:
      return null;
  }
};
