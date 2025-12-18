import type {
  CreateTagDefinitionRequestBodySchema,
  TagDefinitionSchema,
  TagDimensionSchema,
  UpdateTagDefinitionRequestBodySchema,
} from "@fanslib/server/schemas";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import {
  convertFromTagValue,
  convertToTagValue,
  getDefaultValue,
  parseBooleanSchema,
  parseNumericSchema,
} from "~/lib/tags/tagValidation";
import { BooleanValueInput } from "./BooleanValueInput";
import { CategoricalValueInput } from "./CategoricalValueInput";
import { NumericValueInput } from "./NumericValueInput";

type TagDefinition = typeof TagDefinitionSchema.static;
type TagDimension = typeof TagDimensionSchema.static;

export type EditingTag =
  | {
      tag: TagDefinition;
      mode: "edit";
    }
  | {
      parentTagId?: number;
      dimensionId: number;
      mode: "create";
    };

type TagDialogProps = {
  editingTag: EditingTag | null;
  dimension?: TagDimension;
  availableTags: TagDefinition[];
  onClose: () => void;
  onSubmit: (data: typeof CreateTagDefinitionRequestBodySchema.static | { id: number; updates: typeof UpdateTagDefinitionRequestBodySchema.static }) => void;
  isSubmitting: boolean;
};

export const TagDialog = ({ editingTag, dimension, availableTags, onClose, onSubmit, isSubmitting }: TagDialogProps) => {
  const isNumeric = dimension?.dataType === "numerical";
  const isBoolean = dimension?.dataType === "boolean";
  const isCategorical = dimension?.dataType === "categorical";

  const getInitialFormData = useCallback(() => {
    if (!dimension) {
      return {
        displayName: "",
        value: "",
        description: "",
        parentTagId: null,
        shortRepresentation: "",
        color: null as string | null,
        typedValue: "",
      };
    }

    if (editingTag?.mode === "edit") {
      const tag = editingTag.tag;
      return {
        displayName: tag.displayName,
        value: tag.value,
        description: tag.description ?? "",
        parentTagId: tag.parentTagId ?? null,
        shortRepresentation: tag.shortRepresentation ?? "",
        color: tag.color ?? null,
        typedValue: convertFromTagValue(tag.value, dimension.dataType),
      };
    }

    const defaultValue = getDefaultValue(dimension);
    return {
      displayName: "",
      value: "",
      description: "",
      parentTagId: editingTag?.parentTagId ?? null,
      shortRepresentation: "",
      color: null as string | null,
      typedValue: defaultValue,
    };
  }, [dimension, editingTag]);

  const [formData, setFormData] = useState(getInitialFormData);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const initialData = getInitialFormData();
    setFormData(initialData);
    setValidationError(null);
  }, [editingTag, dimension, getInitialFormData]);

  if (!dimension) return null;

  const handleSubmit = () => {
    if (validationError || !formData.displayName.trim()) {
      return;
    }

    const finalValue = (isNumeric || isBoolean)
      ? convertToTagValue(formData.typedValue, dimension.dataType)
      : (isCategorical && !formData.value)
        ? formData.displayName.toLowerCase().replace(/\s+/g, "-")
        : formData.value;

    const baseData = {
      value: finalValue,
      displayName: formData.displayName.trim(),
      description: formData.description.trim() ?? undefined,
      ...(isCategorical && {
        parentTagId: formData.parentTagId,
        shortRepresentation: formData.shortRepresentation.trim() ?? undefined,
        color: formData.color ?? undefined,
      }),
    };

    if (editingTag?.mode === "edit") {
      onSubmit({
        id: editingTag.tag.id,
        updates: baseData,
      });
    } else {
      onSubmit({
        ...baseData,
        dimensionId: dimension.id,
      } as typeof CreateTagDefinitionRequestBodySchema.static);
    }
  };

  const getDialogTitle = () => {
    const typeLabel = isNumeric ? "Numeric" : isBoolean ? "Boolean" : "Categorical";
    return editingTag?.mode === "edit" ? `Edit ${typeLabel} Tag` : `Create ${typeLabel} Tag`;
  };

  const getDialogDescription = () => {
    const action = editingTag?.mode === "edit" ? "Update" : "Add";
    const typeLabel = dimension.dataType;
    return `${action} a ${typeLabel} tag in the "${dimension.name}" dimension.`;
  };

  const renderValueInput = () => {
    if (isNumeric) {
      const schema = parseNumericSchema(dimension.validationSchema);
      return (
        <NumericValueInput
          value={formData.typedValue as number}
          onChange={(value) => setFormData((prev) => ({ ...prev, typedValue: value }))}
          schema={schema}
          onValidationChange={setValidationError}
        />
      );
    }

    if (isBoolean) {
      const schema = parseBooleanSchema(dimension.validationSchema);
      return (
        <BooleanValueInput
          value={formData.typedValue as boolean}
          onChange={(value) => setFormData((prev) => ({ ...prev, typedValue: value }))}
          schema={schema}
        />
      );
    }

    if (isCategorical) {
      return (
        <CategoricalValueInput
          displayName={formData.displayName}
          description={formData.description}
          parentTagId={formData.parentTagId}
          shortRepresentation={formData.shortRepresentation}
          color={formData.color}
          availableTags={availableTags}
          currentTagId={editingTag?.mode === "edit" ? editingTag.tag.id : undefined}
          onDisplayNameChange={(value) => setFormData((prev) => ({ ...prev, displayName: value }))}
          onDescriptionChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
          onParentTagChange={(parentId) => setFormData((prev) => ({ ...prev, parentTagId: parentId }))}
          onShortRepresentationChange={(value) => {
            setFormData((prev) => ({ ...prev, shortRepresentation: value }));
          }}
          onColorChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
        />
      );
    }

    return null;
  };

  return (
    <DialogTrigger isOpen={!!editingTag} onOpenChange={(open) => !open && onClose()}>
      <DialogModal>
        <Dialog maxWidth="lg" showCloseButton={false}>
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogDescription>{getDialogDescription()}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(isNumeric || isBoolean) && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Tag Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(value) => setFormData((prev) => ({ ...prev, displayName: value }))}
                      placeholder={isNumeric ? "e.g., Duration, Count, Rating" : "e.g., Is Featured, Has Audio"}
                      isRequired
                    />
                  </div>
                )}

                {renderValueInput()}

                {(isNumeric || isBoolean) && (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                      placeholder="Brief description of this tag"
                    />
                  </div>
                )}

                {validationError && <p className="text-xs text-error">{validationError}</p>}
              </div>

              <DialogFooter>
                <Button variant="outline" onPress={close} isDisabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    handleSubmit();
                    close();
                  }}
                  isDisabled={isSubmitting || !!validationError || !formData.displayName.trim()}
                >
                  {isSubmitting ? "Saving..." : editingTag?.mode === "edit" ? "Update Tag" : "Create Tag"}
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};
