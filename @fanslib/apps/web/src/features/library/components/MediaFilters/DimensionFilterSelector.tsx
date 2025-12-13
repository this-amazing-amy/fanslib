import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useTagDimensionsQuery } from "~/lib/queries/tags";

type DimensionFilterSelectorProps = {
  value?: number;
  onChange: (dimensionId: number) => void;
};

export const DimensionFilterSelector = ({ value, onChange }: DimensionFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: dimensions = [], isLoading } = useTagDimensionsQuery();

  const selectedDimension = (dimensions ?? []).find((d) => d.id === value);

  const handleSelectDimension = (dimensionId: number) => {
    onChange(dimensionId);
    setOpen(false);
  };

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        aria-expanded={open}
        className="w-full justify-between"
      >
        {isLoading
          ? "Loading..."
          : selectedDimension
            ? `No ${selectedDimension.name} tags`
            : "Select dimension..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Popover className="p-0 w-[min(480px,100vw-32px)]" placement="bottom start">
        <Command>
          <CommandInput placeholder="Search dimensions..." />
          <CommandEmpty>No dimension found.</CommandEmpty>
          <div className="max-h-80 overflow-y-auto">
            <CommandGroup>
              {(dimensions ?? []).map((dimension) => (
                <CommandItem
                  key={dimension.id}
                  value={dimension.name}
                  onSelect={() => handleSelectDimension(dimension.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === dimension.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {dimension.name} tags
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
      </Popover>
    </PopoverTrigger>
  );
};
