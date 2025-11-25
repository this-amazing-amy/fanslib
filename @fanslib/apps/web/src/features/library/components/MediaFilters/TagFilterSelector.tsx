import type { TagDefinitionSchema, TagDimensionSchema } from "@fanslib/server/schemas";
import { Check, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useTagDimensionsQuery } from "~/lib/queries/tags";

type TagDimensionWithTags = typeof TagDimensionSchema.static & {
  tags?: typeof TagDefinitionSchema.static[];
};
type TagDefinition = typeof TagDefinitionSchema.static;

type TagFilterSelectorProps = {
  value?: string;
  onChange: (tagId: string) => void;
};

export const TagFilterSelector = ({ value, onChange }: TagFilterSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set());
  const [searchValue, setSearchValue] = useState("");
  const { data: dimensions = [], isLoading } = useTagDimensionsQuery();

  const categoricalDimensions = useMemo(
    () => (dimensions as TagDimensionWithTags[] ?? []).filter((d) => d.dataType === "categorical"),
    [dimensions]
  );

  const selectedDimension = categoricalDimensions.find((d) =>
    d.tags?.some((tag: TagDefinition) => tag.id.toString() === value)
  );

  const selectedTag = selectedDimension?.tags?.find((tag: TagDefinition) => tag.id.toString() === value);

  // Filter dimensions and tags based on search
  const filteredDimensionsWithTags = useMemo(() => {
    if (!searchValue.trim()) {
      return categoricalDimensions.map((dimension) => ({
        dimension,
        tags: dimension.tags ?? [],
        hasMatches: true,
      }));
    }

    const lowerSearch = searchValue.toLowerCase();
    return categoricalDimensions
      .map((dimension) => {
        const dimensionMatches = dimension.name.toLowerCase().includes(lowerSearch);
        const matchingTags = (dimension.tags ?? []).filter(
          (tag: TagDefinition) =>
            tag.displayName.toLowerCase().includes(lowerSearch) ||
            dimension.name.toLowerCase().includes(lowerSearch)
        );

        return {
          dimension,
          tags: dimensionMatches ? dimension.tags ?? [] : matchingTags,
          hasMatches: dimensionMatches || matchingTags.length > 0,
        };
      })
      .filter((item) => item.hasMatches);
  }, [categoricalDimensions, searchValue]);

  // Auto-expand dimensions that have matching tags when searching
  useMemo(() => {
    if (searchValue.trim()) {
      const dimensionsWithMatches = filteredDimensionsWithTags
        .filter((item) => item.hasMatches)
        .map((item) => item.dimension.id);
      setExpandedDimensions(new Set(dimensionsWithMatches));
    }
  }, [searchValue, filteredDimensionsWithTags]);

  const toggleDimension = (dimensionId: number) => {
    if (searchValue.trim()) return; // Don't allow manual toggle during search

    const newExpanded = new Set(expandedDimensions);
    if (newExpanded.has(dimensionId)) {
      newExpanded.delete(dimensionId);
    } else {
      newExpanded.add(dimensionId);
    }
    setExpandedDimensions(newExpanded);
  };

  const handleSelectTag = (tagId: string) => {
    onChange(tagId);
    setOpen(false);
    setSearchValue("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchValue("");
      setExpandedDimensions(new Set());
    }
  };

  const getDisplayValue = () => {
    if (isLoading) return "Loading...";
    if (!selectedTag) return "Select tag...";
    return `${selectedTag.displayName}`;
  };

  return (
    <PopoverTrigger isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        aria-expanded={open}
        className="w-full justify-between"
      >
        <span className="truncate">{getDisplayValue()}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Popover className="w-full p-0" placement="bottom start">
        <Command>
          <CommandInput
            placeholder="Search tags and dimensions..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {searchValue.trim() && <CommandEmpty>No tags found.</CommandEmpty>}
          <div className="max-h-80 overflow-y-auto">
            {filteredDimensionsWithTags.map(({ dimension, tags, hasMatches }) => {
              if (!hasMatches) return null;

              const isExpanded = expandedDimensions.has(dimension.id);
              const hasSelectedTag = tags.some((tag: TagDefinition) => tag.id.toString() === value);

              return (
                <div key={dimension.id}>
                  <div
                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer border-b"
                    onClick={() => toggleDimension(dimension.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{dimension.name}</span>
                      {hasSelectedTag && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <span className="text-xs text-muted-foreground">
                        ({tags.length} {searchValue.trim() ? "matching " : ""}tags)
                      </span>
                    </div>
                    <ChevronRight
                      className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
                    />
                  </div>
                  {isExpanded && (
                    <CommandGroup>
                      {tags
                        .sort((a: TagDefinition, b: TagDefinition) => a.displayName.localeCompare(b.displayName))
                        .map((tag: TagDefinition) => (
                          <CommandItem
                            key={tag.id}
                            value={`${dimension.name} ${tag.displayName}`}
                            onSelect={() => handleSelectTag(tag.id.toString())}
                            className="pl-6"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                value === tag.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                              style={{ backgroundColor: tag.color ?? undefined }}
                            />
                            <span className="flex-1 truncate">{tag.displayName}</span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
                </div>
              );
            })}
          </div>
        </Command>
      </Popover>
    </PopoverTrigger>
  );
};
