import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useShootsQuery } from "~/lib/queries/shoots";

type ShootFilterSelectorProps = {
  value?: string;
  onChange: (shootId: string) => void;
};

export const ShootFilterSelector = ({ value, onChange }: ShootFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: shoots, isLoading } = useShootsQuery();

  const selectedShoot = useMemo(
    () => shoots?.items.find((shoot) => shoot.id === value),
    [shoots, value]
  );

  const displayValue = selectedShoot ? selectedShoot.name : "Select shoot...";

  const selectShoot = (shootId: string) => {
    onChange(shootId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {isLoading ? "Loading..." : displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search shoots..." />
          <CommandEmpty>No shoot found.</CommandEmpty>
          <CommandGroup>
            {shoots?.items.map((shoot) => (
              <CommandItem
                key={shoot.id}
                value={shoot.name}
                onSelect={() => selectShoot(shoot.id)}
              >
                <Check
                  className={cn("mr-2 h-4 w-4", value === shoot.id ? "opacity-100" : "opacity-0")}
                />
                {shoot.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
