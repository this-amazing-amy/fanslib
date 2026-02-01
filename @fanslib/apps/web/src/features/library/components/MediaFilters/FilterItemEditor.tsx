import type { MediaFilter } from '@fanslib/server/schemas';
import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { I18nProvider } from "react-aria";
import { Button } from "~/components/ui/Button";
import { Calendar } from "~/components/ui/Calendar";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/Select";
import { Switch } from "~/components/ui/Switch";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { DimensionFilterSelector } from "./DimensionFilterSelector";

type MediaFilters = MediaFilter;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type FilterItemEditorProps = {
  item?: FilterItem;
  onSave: (item: FilterItem) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
};

type FilterItemType = FilterItem["type"];

const FILTER_TYPE_OPTIONS: { value: FilterItemType; label: string }[] = [
  { value: "channel", label: "Channel" },
  { value: "subreddit", label: "Subreddit" },
  { value: "tag", label: "Tag" },
  { value: "dimensionEmpty", label: "Missing dimension tags" },
  { value: "shoot", label: "Shoot" },
  { value: "filename", label: "Filename" },
  { value: "caption", label: "Caption" },
  { value: "posted", label: "Posted Status" },
  { value: "createdDateStart", label: "Created After" },
  { value: "createdDateEnd", label: "Created Before" },
];

export const FilterItemEditor = ({
  item,
  onSave,
  onCancel,
  onDelete,
  isEditing = false,
}: FilterItemEditorProps) => {
  const [type, setType] = useState<FilterItemType>(item?.type ?? "filename");
  const [stringValue, setStringValue] = useState("");
  const [booleanValue, setBooleanValue] = useState(true);
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined);
  const [idValue, setIdValue] = useState("");
  const [dimensionIdValue, setDimensionIdValue] = useState(0);
  const [isValid, setIsValid] = useState(false);

  const { data: channels = [] } = useChannelsQuery();

  useEffect(() => {
    if (item) {
      setType(item.type);
      if ("value" in item) {
        if (typeof item.value === "string") {
          setStringValue(item.value);
        } else if (typeof item.value === "boolean") {
          setBooleanValue(item.value);
        } else if (item.value instanceof Date) {
          setDateValue(item.value);
        }
      } else if ("id" in item) {
        setIdValue(item.id);
      } else if ("dimensionId" in item) {
        setDimensionIdValue(item.dimensionId);
      }
    }
  }, [item]);

  useEffect(() => {
    const validateCurrentItem = () => {
      switch (type) {
        case "channel":
        case "subreddit":
        case "tag":
        case "shoot":
          setIsValid(idValue.length > 0);
          break;
        case "filename":
        case "caption":
          setIsValid(stringValue.length > 0);
          break;
        case "posted":
          setIsValid(true);
          break;
        case "createdDateStart":
        case "createdDateEnd":
          setIsValid(dateValue !== undefined);
          break;
        case "dimensionEmpty":
          setIsValid(dimensionIdValue > 0);
          break;
        default:
          setIsValid(false);
      }
    };

    validateCurrentItem();
  }, [type, stringValue, booleanValue, dateValue, idValue, dimensionIdValue]);

  const saveItem = () => {
    if (!isValid) return;

    // eslint-disable-next-line functional/no-let
    let newItem: FilterItem | undefined;

    switch (type) {
      case "channel":
      case "subreddit":
      case "tag":
      case "shoot":
        newItem = { type, id: idValue };
        break;
      case "filename":
      case "caption":
        newItem = { type, value: stringValue };
        break;
      case "posted":
        newItem = { type, value: booleanValue };
        break;
      case "createdDateStart":
      case "createdDateEnd":
        if (!dateValue) return;
        newItem = { type, value: dateValue };
        break;
      case "dimensionEmpty":
        newItem = { type, dimensionId: dimensionIdValue };
        break;
    }

    if (!newItem) return;

    onSave(newItem);
  };

  const resetForm = () => {
    setStringValue("");
    setBooleanValue(true);
    setDateValue(undefined);
    setIdValue("");
    setDimensionIdValue(0);
  };

  const handleTypeChange = (newType: FilterItemType) => {
    setType(newType);
    resetForm();
  };

  const renderValueInput = () => {
    switch (type) {
      case "channel":
        return (
          <div className="space-y-2">
            <Label htmlFor="channel-select">Channel</Label>
            <Select value={idValue} onValueChange={setIdValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {(channels ?? []).map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "subreddit":
      case "tag":
      case "shoot":
        return (
          <div className="space-y-2">
            <Label htmlFor="id-input">{type.charAt(0).toUpperCase() + type.slice(1)} ID</Label>
            <Input
              id="id-input"
              value={idValue}
              onChange={(value) => setIdValue(value)}
              placeholder={`Enter ${type} ID`}
            />
          </div>
        );

      case "filename":
      case "caption":
        return (
          <div className="space-y-2">
            <Label htmlFor="text-input">{type.charAt(0).toUpperCase() + type.slice(1)} Text</Label>
            <Input
              id="text-input"
              value={stringValue}
              onChange={(value) => setStringValue(value)}
              placeholder={`Enter ${type} text`}
            />
          </div>
        );

      case "posted":
        return (
          <div className="space-y-2">
            <Label htmlFor="posted-switch">Posted Status</Label>
            <div className="flex items-center space-x-2">
              <Switch id="posted-switch" isSelected={booleanValue} onChange={setBooleanValue} />
              <span>{booleanValue ? "Posted" : "Unposted"}</span>
            </div>
          </div>
        );

      case "createdDateStart":
      case "createdDateEnd": {
        const calendarValue = dateValue
          ? new CalendarDate(
              dateValue.getFullYear(),
              dateValue.getMonth() + 1,
              dateValue.getDate()
            )
          : undefined;
        return (
          <div className="space-y-2">
            <Label>{type === "createdDateStart" ? "Created After" : "Created Before"}</Label>
            <PopoverTrigger>
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
                        setDateValue(new Date(date.year, date.month - 1, date.day));
                      }
                    }}
                  />
                </I18nProvider>
              </Popover>
            </PopoverTrigger>
          </div>
        );
      }

      case "dimensionEmpty":
        return (
          <div className="space-y-2">
            <Label>Dimension</Label>
            <DimensionFilterSelector
              value={dimensionIdValue || undefined}
              onChange={setDimensionIdValue}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{isEditing ? "Edit Filter" : "Add Filter"}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type-select">Filter Type</Label>
        <Select
          value={type}
          onValueChange={(value) => handleTypeChange(value as FilterItemType)}
          aria-label="Filter type"
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {renderValueInput()}

      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button onPress={saveItem} isDisabled={!isValid} size="sm">
            {isEditing ? "Update" : "Add"}
          </Button>
          <Button variant="outline" onPress={onCancel} size="sm">
            Cancel
          </Button>
        </div>
        {isEditing && onDelete && (
          <Button variant="error" onPress={onDelete} size="sm">
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};
