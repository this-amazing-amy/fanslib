import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useSubredditsQuery } from "~/lib/queries/subreddits";

type SubredditFilterSelectorProps = {
  value?: string;
  onChange: (subredditId: string) => void;
};

export const SubredditFilterSelector = ({ value, onChange }: SubredditFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: subreddits = [], isLoading } = useSubredditsQuery();

  const selectedSubreddit = useMemo(
    () => (subreddits ?? []).find((subreddit) => subreddit.id === value),
    [subreddits, value]
  );

  const displayValue = selectedSubreddit ? selectedSubreddit.name : "Select subreddit...";

  const selectSubreddit = (subredditId: string) => {
    onChange(subredditId);
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
          <CommandInput placeholder="Search subreddits..." />
          <CommandEmpty>No subreddit found.</CommandEmpty>
          <CommandGroup>
            {(subreddits ?? []).map((subreddit) => (
              <CommandItem
                key={subreddit.id}
                value={subreddit.name}
                onSelect={() => selectSubreddit(subreddit.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === subreddit.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {subreddit.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </Popover>
    </PopoverTrigger>
  );
};
