import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { formatViewCount } from "~/lib/format-views";
import { useSubredditsQuery } from "~/lib/queries/subreddits";

type SubredditSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
};

export const SubredditSelect = ({ value, onChange, multiple = false }: SubredditSelectProps) => {
  const [open, setOpen] = useState(false);
  const { data: subreddits = [], isLoading } = useSubredditsQuery();

  const selectedSubreddits = (subreddits ?? []).filter((subreddit) => value.includes(subreddit.id));

  const displayValue =
    selectedSubreddits.length > 0
      ? selectedSubreddits.map((s) => `r/${s.channel?.name ?? 'Unknown'}`).join(", ")
      : "Select subreddit...";

  const selectSubreddit = (currentValue: string) => {
    if (multiple) {
      onChange(
        value.includes(currentValue)
          ? value.filter((v) => v !== currentValue)
          : [...value, currentValue]
      );
      return;
    }

    onChange([currentValue]);
    setOpen(false);
  };

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline" className="w-full justify-between">
        {isLoading ? "Loading..." : displayValue}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Popover className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search subreddits..." />
          <CommandEmpty>No subreddit found.</CommandEmpty>
          <CommandGroup>
            {(subreddits ?? []).map((subreddit) => (
              <CommandItem
                key={subreddit.id}
                value={subreddit.channel?.name ?? 'Unknown'}
                onSelect={() => selectSubreddit(subreddit.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-1">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(subreddit.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  r/{subreddit.channel?.name ?? 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatViewCount(subreddit.memberCount ?? 0)}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </Popover>
    </PopoverTrigger>
  );
};
