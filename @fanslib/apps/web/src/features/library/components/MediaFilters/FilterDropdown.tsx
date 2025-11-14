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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/Tooltip";
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

  return (
    <DropdownMenu>
      {variant === "compact" ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon" className="h-9 w-9" isDisabled={disabled}>
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add filter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenuTrigger>
          <Button variant="outline" isDisabled={disabled}>
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="start">
        {FILTER_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                if (filters.length === 0 || groupIndex === undefined) {
                  addGroupWithFilterType(option.value);
                } else {
                  addFilterWithTypeToGroup(groupIndex, option.value);
                }
              }}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
