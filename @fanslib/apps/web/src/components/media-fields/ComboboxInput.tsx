import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Command, CommandInput, CommandItem, CommandGroup, CommandEmpty } from "~/components/ui/Command";
import { cn } from "~/lib/cn";

type ComboboxInputProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

export const ComboboxInput = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  "aria-label": ariaLabel,
}: ComboboxInputProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const showCustomOption = query.length > 0 && !options.some((o) => o.toLowerCase() === query.toLowerCase());

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        className={cn(
          "input input-sm h-8 min-h-8 w-full max-w-96 flex items-center justify-between font-bold",
          "border border-base-content cursor-pointer",
          "transition-all duration-200",
          "hover:bg-primary/20 hover:ring-2 hover:ring-primary hover:border-primary",
          className,
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">
          {value || placeholder}
        </span>
        <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-[100] mt-1 w-full max-w-96 overflow-hidden rounded-xl bg-base-100 border-2 border-base-content shadow-lg">
          <Command className="shadow-none border-0">
            <CommandInput
              placeholder="Search or type custom..."
              value={query}
              onValueChange={setQuery}
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onChange(option);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
                {showCustomOption && (
                  <CommandItem
                    value={query}
                    onSelect={() => {
                      onChange(query);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2 text-xs text-base-content/50">+</span>
                    Use &quot;{query}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
              {query && (
                <CommandEmpty>
                  <span className="text-base-content/50">No matches</span>
                </CommandEmpty>
              )}
            </div>
          </Command>
        </div>
      )}
    </div>
  );
};
