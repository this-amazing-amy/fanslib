import type { Shoot } from '@fanslib/server/schemas';
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useShootsQuery } from "~/lib/queries/shoots";


type ShootFilterSelectorProps = {
  value?: string;
  onChange: (shootId: string) => void;
};

export const ShootFilterSelector = ({ value, onChange }: ShootFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: shoots, isLoading } = useShootsQuery();

  // Normalize empty string to undefined for consistent handling
  const normalizedValue = value && value !== "" ? value : undefined;

  const selectedShoot = useMemo(
    () => (shoots?.items as Shoot[] | undefined)?.find((shoot: Shoot) => shoot.id === normalizedValue),
    [shoots, normalizedValue]
  );

  const displayValue = normalizedValue
    ? (selectedShoot ? selectedShoot.name : "Select shoot...")
    : "All shoots";

  const selectShoot = (shootId: string) => {
    // Only call onChange if the value actually changed
    const newValue = shootId === "" ? "" : shootId;
    if (newValue !== (value ?? "")) {
      onChange(newValue);
    }
    setOpen(false);
  };

  const shootItems = (shoots?.items as Shoot[] | undefined) ?? [];
  const hasShoots = shootItems.length > 0;

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        aria-expanded={open}
        className="w-full justify-between"
      >
        {isLoading ? "Loading..." : displayValue}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Popover className="p-0 w-[min(480px,100vw-32px)]" placement="bottom start">
        <Command>
          <CommandInput placeholder="Search shoots..." />
          {!isLoading && !hasShoots ? <CommandEmpty>No shoot found.</CommandEmpty> : null}
          <div className="max-h-80 overflow-y-auto">
            <CommandGroup>
              <CommandItem
                value="All shoots"
                onSelect={() => selectShoot("")}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !normalizedValue ? "opacity-100" : "opacity-0"
                  )}
                />
                All shoots
              </CommandItem>
              {shootItems.map((shoot: Shoot) => (
                <CommandItem
                  key={shoot.id}
                  value={shoot.name}
                  onSelect={() => selectShoot(shoot.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      normalizedValue === shoot.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {shoot.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
      </Popover>
    </PopoverTrigger>
  );
};
