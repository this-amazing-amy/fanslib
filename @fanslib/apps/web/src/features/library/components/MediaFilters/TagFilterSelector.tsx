import type { TagDefinition, TagDimension } from '@fanslib/server/schemas';
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/Command";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { useTagDimensionsQuery } from "~/lib/queries/tags";
import { TagBadge } from "../MediaTagEditor/DimensionTagSelector/TagBadge";

type TagDimensionWithTags = TagDimension & {
  tags?: TagDefinition[];
};

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
            tag.displayName.toLowerCase().includes(lowerSearch) ??
            dimension.name.toLowerCase().includes(lowerSearch)
        );

        return {
          dimension,
          tags: dimensionMatches ? dimension.tags ?? [] : matchingTags,
          hasMatches: dimensionMatches ?? matchingTags.length > 0,
        };
      })
      .filter((item) => item.hasMatches);
  }, [categoricalDimensions, searchValue]);

  // Auto-expand dimensions that have matching tags when searching
  useEffect(() => {
    if (searchValue.trim()) {
      const dimensionsWithMatches = filteredDimensionsWithTags
        .filter((item) => item.hasMatches)
        .map((item) => item.dimension.id);
      setExpandedDimensions(new Set(dimensionsWithMatches));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

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
      <Popover className="p-0 w-[min(480px,100vw-32px)]" placement="bottom start">
        <Command>
          <CommandInput
            placeholder="Search tags and dimensions..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {searchValue.trim() && <CommandEmpty>No tags found.</CommandEmpty>}
          <div className="max-h-80 overflow-y-auto pb-2">
            {filteredDimensionsWithTags.map(({ dimension, tags, hasMatches }) => {
              if (!hasMatches) return null;

              const isExpanded = expandedDimensions.has(dimension.id);
              const hasSelectedTag = tags.some((tag: TagDefinition) => tag.id.toString() === value);

              return (
                <div key={dimension.id} className="mt-0.5 first:mt-0">
                  <div
                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium cursor-pointer rounded-lg border-2 border-transparent hover:border-accent hover:bg-accent/10 transition-colors"
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
                      <ul className="flex flex-wrap gap-1 px-2 py-1">
                        {tags
                          .sort((a: TagDefinition, b: TagDefinition) => a.displayName.localeCompare(b.displayName))
                          .map((tag: TagDefinition) => (
                            <CommandItem
                              key={tag.id}
                              value={`${dimension.name} ${tag.displayName}`}
                              onSelect={() => handleSelectTag(tag.id.toString())}
                              className="hover:bg-transparent hover:ring-0 focus:bg-transparent focus:ring-0 px-0 py-0"
                            >
                              <TagBadge
                                tag={{
                                  id: tag.id,
                                  color: tag.color ?? null,
                                  displayName: tag.displayName,
                                }}
                                selectionMode="radio"
                                selectionState={value === tag.id.toString() ? "checked" : "unchecked"}
                                size="md"
                                className="justify-start"
                                onSelectionChange={() => handleSelectTag(tag.id.toString())}
                              />
                            </CommandItem>
                          ))}
                      </ul>
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
