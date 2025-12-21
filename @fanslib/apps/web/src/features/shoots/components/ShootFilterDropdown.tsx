import { Calendar, Filter, Plus, Search } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/cn";
import { useShootFilters, type ShootFilterItem } from "./ShootFiltersContext";

type ShootFilterDropdownProps = {
  disabled?: boolean;
  variant?: "default" | "compact";
  className?: string;
};

const FILTER_TYPE_OPTIONS = [
  { value: "search" as const, label: "Search", icon: Search },
  { value: "dateRange" as const, label: "Date Range", icon: Calendar },
] as const;

export const ShootFilterDropdown = ({
  disabled = false,
  variant = "default",
  className,
}: ShootFilterDropdownProps) => {
  const { filters, addFilter } = useShootFilters();

  const availableFilters = FILTER_TYPE_OPTIONS.filter(
    (option) => !filters.some((f) => f.type === option.value)
  );

  const handleAction = (key: string | number) => {
    const filterType = key as ShootFilterItem["type"];
    addFilter(filterType);
  };

  if (variant === "compact") {
    return (
      <DropdownMenuTrigger>
        <Button
          isDisabled={disabled || availableFilters.length === 0}
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", className)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <DropdownMenuPopover placement="bottom start">
          <DropdownMenu onAction={handleAction}>
            {availableFilters.map((option) => {
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
        variant="ghost"
        size="icon"
        isDisabled={disabled || availableFilters.length === 0}
        className={cn("h-9 w-9", className)}
      >
        <Filter className="h-4 w-4" />
      </Button>
      <DropdownMenuPopover placement="bottom start">
        <DropdownMenu onAction={handleAction}>
          {availableFilters.map((option) => {
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

