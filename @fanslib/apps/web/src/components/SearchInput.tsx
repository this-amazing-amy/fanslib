import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/cn";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  alwaysOpen?: boolean;
  className?: string;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  alwaysOpen = false,
  className,
}: SearchInputProps) => {
  const [isOpen, setIsOpen] = useState(Boolean(value) || alwaysOpen);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = alwaysOpen || isOpen;

  useEffect(() => {
    setLocalValue(value);
    if (value) {
      setIsOpen(true);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleBlur = () => {
    if (!localValue) {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "flex items-center border rounded-md border-base-300 transition-colors hover:bg-base-200",
        className
      )}
    >
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center cursor-pointer")}
        aria-label={isOpen ? "Close search" : "Open search"}
      >
        <Search className="h-4 w-4" />
      </button>
      <div
        className={cn(
          "relative transition-all duration-200 overflow-hidden",
          open ? "w-auto" : "w-0"
        )}
      >
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className="pl-2 pr-8 border-none rounded-none"
          />
          {localValue && (
            <Button
              variant="ghost"
              size="icon"
              onPress={handleClear}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-sm"
              aria-label="Clear search"
            >
              <X className="text-base-content/60" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

