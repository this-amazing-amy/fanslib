import { useState } from "react";
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
import type { CreateTagDefinitionRequestBodySchema } from "@fanslib/server/schemas";
import { BooleanValueInput } from "./BooleanValueInput";
import { CategoricalValueInput } from "./CategoricalValueInput";
import { NumericValueInput } from "./NumericValueInput";

export type EditingTag =
  | {
      tag: any;
      mode: "edit";
    }
  | {
      parentTagId?: number;
      dimensionId: number;
      mode: "create";
    };

type TagDialogProps = {
  editingTag: EditingTag | null;
  dimension?: any;
  availableTags: any[];
  onClose: () => void;
  onSubmit: (data: typeof CreateTagDefinitionRequestBodySchema.static | { id: number; updates: any }) => void;
  isSubmitting: boolean;
};

export const TagDialog = ({ editingTag, dimension, availableTags, onClose, onSubmit, isSubmitting }: TagDialogProps) => {
  if (!dimension) return null;

  const isNumeric = dimension.dataType === "numerical";
  const isBoolean = dimension.dataType === "boolean";
  const isCategorical = dimension.dataType === "categorical";

  const getInitialFormData = () => {
    if (editingTag?.mode === "edit") {
      const tag = editingTag.tag;
      return {
        displayName: tag.displayName,
        value: tag.value,
        description: tag.description || "",
        parentTagId: tag.parentTagId || null,
        shortRepresentation: tag.shortRepresentation || "",
        typedValue: convertFromTagValue(tag.value, dimension.dataType),
      };
    }

    const defaultValue = getDefaultValue(dimension);
    return {
      displayName: "",
      value: "",
      description: "",
      parentTagId: editingTag?.parentTagId || null,
      shortRepresentation: "",
      typedValue: defaultValue,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (validationError || !formData.displayName.trim()) {
      return;
    }

    let finalValue = formData.value;

    if (isNumeric || isBoolean) {
      finalValue = convertToTagValue(formData.typedValue, dimension.dataType);
    } else if (isCategorical && !finalValue) {
      finalValue = formData.displayName.toLowerCase().replace(/\s+/g, "-");
    }

    const baseData = {
      value: finalValue,
      displayName: formData.displayName.trim(),
      description: formData.description.trim() || undefined,
      ...(isCategorical && {
        parentTagId: formData.parentTagId,
        shortRepresentation: formData.shortRepresentation.trim() || undefined,
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
          value={formData.value}
          description={formData.description}
          parentTagId={formData.parentTagId}
          shortRepresentation={formData.shortRepresentation}
          availableTags={availableTags}
          currentTagId={editingTag?.mode === "edit" ? editingTag.tag.id : undefined}
          onDisplayNameChange={(value) => setFormData((prev) => ({ ...prev, displayName: value }))}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, value }))}
          onDescriptionChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
          onParentTagChange={(parentId) => setFormData((prev) => ({ ...prev, parentTagId: parentId }))}
          onShortRepresentationChange={(value) => {
            setFormData((prev) => ({ ...prev, shortRepresentation: value }));
          }}
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
