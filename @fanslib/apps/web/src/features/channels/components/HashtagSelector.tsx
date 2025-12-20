import type { HashtagSchema } from "@fanslib/server/schemas";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover/Popover";
import { useCreateHashtagMutation, useHashtagsQuery } from "~/lib/queries/hashtags";

type Hashtag = typeof HashtagSchema.static;

type HashtagSelectorProps = {
  value: Hashtag[];
  onChange: (hashtags: Hashtag[]) => void;
  disabled?: boolean;
};

const normalizeHashtagName = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

export const HashtagSelector = ({ value, onChange, disabled = false }: HashtagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: allHashtags = [], isLoading } = useHashtagsQuery();
  const createHashtagMutation = useCreateHashtagMutation();

  const selectedIds = useMemo(() => new Set(value.map((h) => h.id)), [value]);

  const availableHashtags = useMemo(() => {
    return allHashtags.filter((hashtag) => !selectedIds.has(hashtag.id));
  }, [allHashtags, selectedIds]);

  const filteredHashtags = useMemo(() => {
    if (!searchQuery.trim()) return availableHashtags;
    const normalizedQuery = searchQuery.toLowerCase();
    return availableHashtags.filter((hashtag) =>
      hashtag.name.toLowerCase().includes(normalizedQuery)
    );
  }, [availableHashtags, searchQuery]);

  const canCreateNew = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const normalizedQuery = normalizeHashtagName(searchQuery);
    return (
      !availableHashtags.some((h) => h.name.toLowerCase() === normalizedQuery.toLowerCase()) &&
      !value.some((h) => h.name.toLowerCase() === normalizedQuery.toLowerCase())
    );
  }, [searchQuery, availableHashtags, value]);

  const handleSelectHashtag = (hashtag: Hashtag) => {
    if (selectedIds.has(hashtag.id)) return;
    onChange([...value, hashtag]);
    setSearchQuery("");
  };

  const handleRemoveHashtag = (hashtagId: number) => {
    onChange(value.filter((h) => h.id !== hashtagId));
  };

  const handleCreateNew = async () => {
    if (!canCreateNew || !searchQuery.trim()) return;

    const normalizedName = normalizeHashtagName(searchQuery);
    try {
      const newHashtag = await createHashtagMutation.mutateAsync({ name: normalizedName });
      onChange([...value, newHashtag]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to create hashtag:", error);
    }
  };

  return (
    <div className="space-y-3">
      <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          isDisabled={disabled}
        >
          <span className="text-base-content/50">Search or create hashtags...</span>
        </Button>
        <Popover className="w-[var(--trigger-width)] p-0">
          <Command className="border-0 shadow-none">
            <CommandInput
              placeholder="Search hashtags..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <div className="max-h-[300px] overflow-y-auto p-2">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-base-content/50">Loading...</div>
              ) : filteredHashtags.length > 0 || canCreateNew ? (
                <CommandGroup>
                  {filteredHashtags.map((hashtag) => (
                    <CommandItem
                      key={hashtag.id}
                      value={hashtag.name}
                      onSelect={() => handleSelectHashtag(hashtag)}
                    >
                      <span>{hashtag.name}</span>
                    </CommandItem>
                  ))}
                  {canCreateNew && (
                    <CommandItem
                      value={normalizeHashtagName(searchQuery)}
                      onSelect={handleCreateNew}
                      className="text-primary font-medium"
                    >
                      <span>+ Create "{normalizeHashtagName(searchQuery)}"</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              ) : (
                <CommandEmpty>No hashtags found</CommandEmpty>
              )}
            </div>
          </Command>
        </Popover>
      </PopoverTrigger>

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {value.map((hashtag) => (
              <Badge
                key={hashtag.id}
                variant="primary"
                size="md"
                className="flex items-center gap-1.5 pr-1"
              >
                <span>{hashtag.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(hashtag.id)}
                    className="ml-1 rounded-full hover:bg-base-content/20 p-0.5 transition-colors"
                    aria-label={`Remove ${hashtag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

