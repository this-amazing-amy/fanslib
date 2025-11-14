import { useChannelsQuery } from "~/lib/queries/channels";
import { cn } from "~/lib/cn";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/Popover";

type ChannelFilterSelectorProps = {
  value?: string;
  onChange: (channelId: string) => void;
};

export const ChannelFilterSelector = ({ value, onChange }: ChannelFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: channels = [], isLoading } = useChannelsQuery();

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === value),
    [channels, value]
  );

  const displayValue = selectedChannel ? selectedChannel.name : "Select channel...";

  const selectChannel = (channelId: string) => {
    onChange(channelId);
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
          <div className="flex items-center gap-2">
            {isLoading ? "Loading..." : displayValue}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search channels..." />
          <CommandEmpty>No channel found.</CommandEmpty>
          <CommandGroup>
            {channels.map((channel) => (
              <CommandItem
                key={channel.id}
                value={channel.name}
                onSelect={() => selectChannel(channel.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === channel.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {channel.name}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
