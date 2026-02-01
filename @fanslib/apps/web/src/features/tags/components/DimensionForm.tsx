import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/Select";
import { Switch } from "~/components/ui/Switch";
import { Textarea } from "~/components/ui/Textarea";
import {
  type BooleanSchema,
  type NumericSchema,
  parseBooleanSchema,
  parseNumericSchema,
} from "~/lib/tags/tagValidation";
import type { CreateTagDimensionRequestBody, TagDimension, UpdateTagDimensionRequestBody } from '@fanslib/server/schemas';


type DimensionFormProps = {
  initialData?: TagDimension;
  onSubmit: (
    data:
      | CreateTagDimensionRequestBody
      | UpdateTagDimensionRequestBody
  ) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

type DimensionFormData = {
  name: string;
  description: string;
  dataType: "categorical" | "numerical" | "boolean";
  validationSchema: string;
  sortOrder: number;
  stickerDisplay: "none" | "color" | "short";
  isExclusive: boolean;
};

export const DimensionForm = ({ initialData, onSubmit, onCancel, isSubmitting = false }: DimensionFormProps) => {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<DimensionFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    dataType: initialData?.dataType ?? "categorical",
    validationSchema: initialData?.validationSchema ?? "",
    sortOrder: initialData?.sortOrder ?? 0,
    stickerDisplay: initialData?.stickerDisplay ?? "none",
    isExclusive: initialData?.isExclusive ?? false,
  });

  const [booleanSchema, setBooleanSchema] = useState<BooleanSchema>(() =>
    parseBooleanSchema(formData.validationSchema)
  );
  const [numericSchema, setNumericSchema] = useState<NumericSchema>(() =>
    parseNumericSchema(formData.validationSchema)
  );

  const updateFormData = (updates: Partial<DimensionFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleDataTypeChange = (dataType: "categorical" | "numerical" | "boolean") => {
    const validationSchema = dataType === "boolean"
      ? JSON.stringify(booleanSchema)
      : dataType === "numerical"
        ? JSON.stringify(numericSchema)
        : "";

    updateFormData({ dataType, validationSchema });
  };

  const handleBooleanSchemaChange = (schema: BooleanSchema) => {
    setBooleanSchema(schema);
    if (formData.dataType === "boolean") {
      updateFormData({ validationSchema: JSON.stringify(schema) });
    }
  };

  const handleNumericSchemaChange = (schema: NumericSchema) => {
    setNumericSchema(schema);
    if (formData.dataType === "numerical") {
      updateFormData({ validationSchema: JSON.stringify(schema) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description?.trim() ?? undefined,
      ...(isEditing
        ? {
            validationSchema: formData.validationSchema ?? undefined,
            sortOrder: formData.sortOrder,
            stickerDisplay: formData.stickerDisplay,
            isExclusive: formData.isExclusive,
          }
        : {
            dataType: formData.dataType,
            validationSchema: formData.validationSchema ?? undefined,
            sortOrder: formData.sortOrder,
            stickerDisplay: formData.stickerDisplay,
            isExclusive: formData.isExclusive,
          }),
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dimensionName">Dimension Name *</Label>
        <Input
          id="dimensionName"
          value={formData.name}
          onChange={(value) => updateFormData({ name: value })}
          placeholder="e.g., Content Type, Quality, Mood"
          isRequired
        />
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="dataType">Data Type *</Label>
          <Select
            value={formData.dataType}
            onValueChange={(value) => handleDataTypeChange(value as "categorical" | "numerical" | "boolean")}
            aria-label="Data type"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="categorical">Categorical</SelectItem>
              <SelectItem value="numerical">Numerical</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="stickerDisplay">Sticker Display Mode</Label>
        <Select
          value={formData.stickerDisplay ?? "none"}
          onValueChange={(value) => updateFormData({ stickerDisplay: value as "none" | "color" | "short" })}
          aria-label="Sticker display mode"
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sticker display mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="color">Color</SelectItem>
            <SelectItem value="short">Short Text</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.dataType === "categorical" || !isEditing) && (
        <div className="space-y-2">
          <Label htmlFor="isExclusive">Tag Selection Mode</Label>
          <div className="flex items-center space-x-3">
            <Switch
              id="isExclusive"
              isSelected={formData.isExclusive ?? false}
              onChange={(checked) => updateFormData({ isExclusive: checked })}
              isDisabled={formData.dataType !== "categorical"}
            />
            <div className="flex-1">
              <div className="font-medium">{formData.isExclusive ? "Single Selection" : "Multiple Selection"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description ?? ""}
          onChange={(value) => updateFormData({ description: value })}
          placeholder="Optional description of what this dimension represents"
          rows={3}
        />
      </div>

      {formData.dataType === "boolean" && (
        <div className="p-4 border border-base-300 rounded-lg bg-secondary/10">
          <h3 className="font-medium mb-2">Boolean Configuration</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="trueLabel">True Value Display Name</Label>
              <Input
                id="trueLabel"
                value={booleanSchema.trueLabel ?? "Yes"}
                onChange={(value) => handleBooleanSchemaChange({ ...booleanSchema, trueLabel: value })}
                placeholder="e.g., Yes, Enabled, Featured"
              />
            </div>
            <div>
              <Label htmlFor="falseLabel">False Value Display Name</Label>
              <Input
                id="falseLabel"
                value={booleanSchema.falseLabel ?? "No"}
                onChange={(value) => handleBooleanSchemaChange({ ...booleanSchema, falseLabel: value })}
                placeholder="e.g., No, Disabled, Not Featured"
              />
            </div>

            <div className="mt-4 p-3 bg-base-100 rounded-lg border border-base-300 col-span-2">
              <p className="text-sm font-medium mb-2">Tag Preview:</p>
              <div className="flex gap-2">
                <span className="badge badge-success">{booleanSchema.trueLabel ?? "Yes"}</span>
                <span className="badge badge-error">{booleanSchema.falseLabel ?? "No"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.dataType === "numerical" && (
        <div className="p-4 border border-base-300 rounded-lg bg-success/10">
          <h3 className="font-medium mb-2">Numeric Configuration</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="min">Minimum</Label>
              <Input
                id="min"
                type="number"
                value={String(numericSchema.min ?? 0)}
                onChange={(value) =>
                  handleNumericSchemaChange({
                    ...numericSchema,
                    min: parseFloat(value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="max">Maximum</Label>
              <Input
                id="max"
                type="number"
                value={String(numericSchema.max ?? 100)}
                onChange={(value) =>
                  handleNumericSchemaChange({
                    ...numericSchema,
                    max: parseFloat(value) || 100,
                  })
                }
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="step">Step</Label>
              <Input
                id="step"
                type="number"
                value={String(numericSchema.step ?? 1)}
                onChange={(value) =>
                  handleNumericSchemaChange({
                    ...numericSchema,
                    step: parseFloat(value) || 1,
                  })
                }
                placeholder="1"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="unit">Unit (Optional)</Label>
            <Input
              id="unit"
              value={numericSchema.unit ?? ""}
              onChange={(value) => handleNumericSchemaChange({ ...numericSchema, unit: value })}
              placeholder="e.g., %, seconds, MB, points"
            />
          </div>

          <div className="mt-4 p-3 bg-base-100 rounded-lg border border-base-300">
            <p className="text-sm font-medium mb-2">Range Preview:</p>
            <div className="relative">
              <div className="h-6 bg-gradient-to-r from-success/30 via-success/50 to-success/70 rounded-md relative">
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                  <span>
                    {numericSchema.min ?? 0}
                    {numericSchema.unit && ` ${numericSchema.unit}`}
                  </span>
                  <span>
                    {numericSchema.max ?? 100}
                    {numericSchema.unit && ` ${numericSchema.unit}`}
                  </span>
                </div>
              </div>
              <div className="mt-1 text-xs text-base-content/60">
                Step: {numericSchema.step ?? 1}
                {numericSchema.unit && ` ${numericSchema.unit}`} • Possible values:{" "}
                {Math.floor(((numericSchema.max ?? 100) - (numericSchema.min ?? 0)) / (numericSchema.step ?? 1)) + 1}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" isDisabled={!formData.name.trim() || isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Dimension"
              : "Create Dimension"}
        </Button>
        <Button type="button" variant="outline" onPress={onCancel} isDisabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
