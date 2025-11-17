import type { ShootSchema } from "@fanslib/server/schemas";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useShootsQuery } from "~/lib/queries/shoots";

type Shoot = typeof ShootSchema.static;

type ShootFilterSelectorProps = {
  value?: string;
  onChange: (shootId: string) => void;
};

export const ShootFilterSelector = ({ value, onChange }: ShootFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: shoots, isLoading } = useShootsQuery();

  const selectedShoot = useMemo(
    () => (shoots?.items as Shoot[] | undefined)?.find((shoot: Shoot) => shoot.id === value),
    [shoots, value]
  );

  const displayValue = selectedShoot ? selectedShoot.name : "Select shoot...";

  const selectShoot = (shootId: string) => {
    onChange(shootId);
    setOpen(false);
  };

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
      <Popover className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search shoots..." />
          <CommandEmpty>No shoot found.</CommandEmpty>
          <CommandGroup>
            {(shoots?.items as Shoot[] | undefined)?.map((shoot: Shoot) => (
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
      </Popover>
    </PopoverTrigger>
  );
};
