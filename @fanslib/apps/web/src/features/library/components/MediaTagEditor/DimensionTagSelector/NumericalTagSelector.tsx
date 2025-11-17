import type { MediaTagSchema, TagDimensionSchema } from "@fanslib/server/schemas";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Slider } from "~/components/ui/Slider";
import {
  useCreateTagDefinitionMutation,
  useTagDefinitionsByDimensionQuery,
} from "~/lib/queries/tags";
import {
  formatNumericValue,
  parseNumericSchema,
  validateNumericValue,
} from "~/lib/tags/tagValidation";

type MediaTag = typeof MediaTagSchema.static;
type TagDimension = typeof TagDimensionSchema.static;

type NumericalTagSelectorProps = {
  dimension: TagDimension;
  selectedTags: MediaTag[];
  onTagsChange: (tagIds: number[]) => void;
};

export const NumericalTagSelector = ({
  dimension,
  selectedTags,
  onTagsChange,
}: NumericalTagSelectorProps) => {
  const [sliderValue, setSliderValue] = useState<number[]>([0]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const lastSavedValueRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: availableTags, refetch: refetchTags } = useTagDefinitionsByDimensionQuery({ dimensionId: dimension.id });
  const createTagMutation = useCreateTagDefinitionMutation();

  const schema = parseNumericSchema(dimension.validationSchema);
  const selectedTag = selectedTags[0]; // Numerical dimensions should only have one selected tag

  // Initialize slider value based on schema defaults
  const defaultSliderValue = schema.defaultValue ?? schema.min ?? 0;
  if (sliderValue[0] === 0 && defaultSliderValue !== 0) {
    setSliderValue([defaultSliderValue]);
  }

  const validateAndCreateTag = useCallback(
    async (value: number) => {
      const validationError = validateNumericValue(value, schema);
      if (validationError) {
        setError(validationError);
        return null;
      }

      // Check if tag already exists (with tolerance for floating point precision)
      const existingTag = availableTags?.find((tag) => {
        const tagValue = parseFloat(tag.value);
        return Math.abs(tagValue - value) < 0.0001;
      });

      if (existingTag) {
        return existingTag;
      }

      // Create new tag
      setIsCreating(true);
      try {
        const newTag = await createTagMutation.mutateAsync({
          dimensionId: dimension.id,
          value: value.toString(),
          displayName: formatNumericValue(value, schema),
          description: `${dimension.name}: ${formatNumericValue(value, schema)}`,
        });

        await refetchTags();
        return newTag;
      } catch {
        setError("Failed to create tag");
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [schema, availableTags, dimension.id, dimension.name, createTagMutation, refetchTags]
  );

  const handleRemoveTag = () => {
    onTagsChange([]);
    lastSavedValueRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSliderChange = useCallback(
    (values: number[]) => {
      setSliderValue(values);
      setError(null);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Don't auto-save if there's already a selected tag
      if (selectedTag) return;

      const currentValue = values[0];
      const defaultValue = schema.defaultValue ?? schema.min ?? 0;

      // Don't save if it's the default value or if we already saved this value
      if (currentValue === defaultValue || currentValue === lastSavedValueRef.current) {
        return;
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(async () => {
        if (!currentValue) return;
        const tag = await validateAndCreateTag(currentValue);
        if (tag) {
          onTagsChange([tag.id]);
          lastSavedValueRef.current = currentValue;
        }
        timeoutRef.current = null;
      }, 500);
    },
    [selectedTag, schema.defaultValue, schema.min, onTagsChange, validateAndCreateTag]
  );

  // Cleanup timeout on unmount
  useEffect(() => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }, []);

  return (
    <div>
      {selectedTag ? (
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            {selectedTag.tagDisplayName ||
              formatNumericValue(parseFloat(selectedTag.tagValue || "0"), schema)}
            <button
              onClick={handleRemoveTag}
              className="hover:bg-green-200 rounded-full p-0.5"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : schema.min !== undefined && schema.max !== undefined ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm text-center">
              <span className="text-gray-600">{formatNumericValue(sliderValue[0] ?? 0, schema)}</span>
              {isCreating && <span className="text-xs text-gray-500 ml-2">Saving...</span>}
            </div>
            <Slider
              value={sliderValue}
              onChangeEnd={value => {
                if (Array.isArray(value)) {
                  handleSliderChange(value);
                } else {
                  handleSliderChange([value as number]);
                }
              }}
              minValue={schema.min}
              maxValue={schema.max}
              step={schema.step ?? 1}
              className="w-full"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No range defined for this dimension</p>
          <p className="text-xs">Configure min/max values to enable slider</p>
        </div>
      )}
    </div>
  );
};
