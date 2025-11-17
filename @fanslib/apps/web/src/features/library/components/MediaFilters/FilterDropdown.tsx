import {
  Calendar,
  Camera,
  CheckCircle,
  FileText,
  FileVideo,
  Filter,
  Hash,
  MessageSquare,
  Plus,
  Search,
  Tag,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterDropdownProps = {
  disabled?: boolean;
  groupIndex?: number;
  variant?: "default" | "compact";
};

const FILTER_TYPE_OPTIONS = [
  { value: "channel", label: "Channel", icon: Hash },
  { value: "subreddit", label: "Subreddit", icon: MessageSquare },
  { value: "tag", label: "Tag", icon: Tag },
  { value: "dimensionEmpty", label: "Tag Dimension", icon: Tag },
  { value: "shoot", label: "Shoot", icon: Camera },
  { value: "mediaType", label: "Media Type", icon: FileVideo },
  { value: "filename", label: "Filename", icon: Search },
  { value: "caption", label: "Caption", icon: FileText },
  { value: "posted", label: "Posted Status", icon: CheckCircle },
  { value: "createdDateStart", label: "Created After", icon: Calendar },
  { value: "createdDateEnd", label: "Created Before", icon: Calendar },
] as const;

export const FilterDropdown = ({
  disabled = false,
  groupIndex,
  variant = "default",
}: FilterDropdownProps) => {
  const { filters, addGroupWithFilterType, addFilterWithTypeToGroup } = useMediaFilters();

  const handleAction = (key: string | number) => {
    if (filters.length === 0 || groupIndex === undefined) {
      addGroupWithFilterType(key as typeof FILTER_TYPE_OPTIONS[number]["value"]);
    } else {
      addFilterWithTypeToGroup(groupIndex, key as typeof FILTER_TYPE_OPTIONS[number]["value"]);
    }
  };

  if (variant === "compact") {
    return (
      <DropdownMenuTrigger>
        <Button
          isDisabled={disabled}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <DropdownMenuPopover placement="bottom start">
          <DropdownMenu onAction={handleAction}>
            {FILTER_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem key={option.value} id={option.value} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenu>
        </DropdownMenuPopover>
      </DropdownMenuTrigger>
    );
  }

  return (
    <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="md"
          isDisabled={disabled}
      >
        <Filter className="h-4 w-4" />
        Filter
      </Button>
      <DropdownMenuPopover placement="bottom start">
        <DropdownMenu onAction={handleAction}>
          {FILTER_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem key={option.value} id={option.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenu>
      </DropdownMenuPopover>
    </DropdownMenuTrigger>
  );
};
