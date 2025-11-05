import type { TagDimension } from "@fanslib/types";

// Schema type definitions
export type NumericSchema = {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  useSlider?: boolean;
};

export type BooleanSchema = {
  trueLabel?: string;
  falseLabel?: string;
  defaultValue?: boolean;
};

export type ValidationSchema = NumericSchema | BooleanSchema;

// Schema parsing functions
export const parseNumericSchema = (schemaString?: string): NumericSchema => {
  if (!schemaString) {
    return { min: 0, step: 1 };
  }

  try {
    const parsed = JSON.parse(schemaString);
    return {
      min: parsed.min ?? 0,
      max: parsed.max,
      step: parsed.step ?? 1,
      unit: parsed.unit,
      defaultValue: parsed.defaultValue ?? parsed.min ?? 0,
      useSlider: parsed.useSlider ?? false,
    };
  } catch {
    return { min: 0, step: 1 };
  }
};

export const parseBooleanSchema = (schemaString?: string): BooleanSchema => {
  if (!schemaString) {
    return { trueLabel: "Yes", falseLabel: "No", defaultValue: false };
  }

  try {
    const parsed = JSON.parse(schemaString);
    return {
      trueLabel: parsed.trueLabel ?? "Yes",
      falseLabel: parsed.falseLabel ?? "No",
      defaultValue: parsed.defaultValue ?? false,
    };
  } catch {
    return { trueLabel: "Yes", falseLabel: "No", defaultValue: false };
  }
};

export const parseValidationSchema = (
  schemaString?: string,
  dataType?: string
): ValidationSchema => {
  switch (dataType) {
    case "numerical":
      return parseNumericSchema(schemaString);
    case "boolean":
      return parseBooleanSchema(schemaString);
    default:
      return {};
  }
};

// Validation functions
export const validateNumericValue = (value: number, schema: NumericSchema): string | null => {
  if (typeof value !== "number" || isNaN(value)) {
    return "Value must be a valid number";
  }

  if (schema.min !== undefined && value < schema.min) {
    return `Value must be at least ${schema.min}`;
  }

  if (schema.max !== undefined && value > schema.max) {
    return `Value must be at most ${schema.max}`;
  }

  if (schema.step !== undefined && schema.min !== undefined) {
    const remainder = (value - schema.min) % schema.step;
    if (Math.abs(remainder) > 0.0001) {
      return `Value must be in steps of ${schema.step}`;
    }
  }

  return null;
};

export const validateBooleanValue = (value: boolean, _schema: BooleanSchema): string | null => {
  if (typeof value !== "boolean") {
    return "Value must be a boolean";
  }
  return null;
};

export const validateTagValue = (value: unknown, dimension: TagDimension): string | null => {
  switch (dimension.dataType) {
    case "numerical": {
      if (typeof value !== "number") {
        return "Numeric value required";
      }
      const schema = parseNumericSchema(dimension.validationSchema);
      return validateNumericValue(value, schema);
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        return "Boolean value required";
      }
      const schema = parseBooleanSchema(dimension.validationSchema);
      return validateBooleanValue(value, schema);
    }
    case "categorical":
      // Categorical validation would be handled by the hierarchical editor
      return null;
    default:
      return null;
  }
};

// Value conversion utilities
export const convertToTagValue = (value: unknown, dataType: string): string => {
  switch (dataType) {
    case "numerical":
      return typeof value === "number" ? value.toString() : "0";
    case "boolean":
      return typeof value === "boolean" ? value.toString() : "false";
    case "categorical":
      return typeof value === "string" ? value : "";
    default:
      return String(value ?? "");
  }
};

export const convertFromTagValue = (tagValue: string, dataType: string): unknown => {
  switch (dataType) {
    case "numerical": {
      const parsed = parseFloat(tagValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    case "boolean":
      return tagValue.toLowerCase() === "true";
    case "categorical":
      return tagValue;
    default:
      return tagValue;
  }
};

// Formatting utilities
export const formatBooleanValue = (value: boolean, schema: BooleanSchema): string => value ? (schema.trueLabel ?? "Yes") : (schema.falseLabel ?? "No");

export const formatNumericValue = (value: number, schema: NumericSchema): string => {
  const formattedValue = schema.step && schema.step < 1 ? value.toFixed(2) : value.toString();

  return schema.unit ? `${formattedValue} ${schema.unit}` : formattedValue;
};

// Default value utilities
export const getDefaultValue = (dimension: TagDimension): unknown => {
  switch (dimension.dataType) {
    case "numerical": {
      const schema = parseNumericSchema(dimension.validationSchema);
      return schema.defaultValue ?? schema.min ?? 0;
    }
    case "boolean": {
      const schema = parseBooleanSchema(dimension.validationSchema);
      return schema.defaultValue ?? false;
    }
    case "categorical":
      return "";
    default:
      return "";
  }
};

// Schema validation utilities
export const isValidSchema = (schemaString: string, dataType: string): boolean => {
  try {
    const parsed = JSON.parse(schemaString);

    switch (dataType) {
      case "numerical":
        return typeof parsed === "object" && parsed !== null;
      case "boolean":
        return typeof parsed === "object" && parsed !== null;
      default:
        return true;
    }
  } catch {
    return false;
  }
};

export const createDefaultSchema = (dataType: string): string => {
  switch (dataType) {
    case "numerical":
      return JSON.stringify({ min: 0, max: 100, step: 1 });
    case "boolean":
      return JSON.stringify({ trueLabel: "Yes", falseLabel: "No", defaultValue: false });
    default:
      return "{}";
  }
};
