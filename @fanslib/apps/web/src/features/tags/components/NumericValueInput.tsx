import { useEffect, useState } from "react";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import type { NumericSchema } from "~/lib/tags/tagValidation";

type NumericValueInputProps = {
  value: number;
  onChange: (value: number) => void;
  schema: NumericSchema;
  onValidationChange?: (error: string | null) => void;
};

const getValidationError = (numericValue: number, schema: NumericSchema): string | null => {
  if (schema.min !== undefined && numericValue < schema.min) {
    return `Value must be at least ${schema.min}`;
  }
  if (schema.max !== undefined && numericValue > schema.max) {
    return `Value must be at most ${schema.max}`;
  }
  if (schema.step !== undefined && schema.min !== undefined) {
    const remainder = (numericValue - schema.min) % schema.step;
    if (Math.abs(remainder) > 0.0001) {
      return `Value must be in steps of ${schema.step}`;
    }
  }
  return null;
};

export const NumericValueInput = ({ value, onChange, schema, onValidationChange }: NumericValueInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const validateAndUpdate = (newValue: string) => {
    const numericValue = parseFloat(newValue);

    if (newValue === "" || isNaN(numericValue)) {
      const errorMsg = "Please enter a valid number";
      setError(errorMsg);
      onValidationChange?.(errorMsg);
      return;
    }

    const validationError = getValidationError(numericValue, schema);

    setError(validationError);
    onValidationChange?.(validationError);

    if (!validationError) {
      onChange(numericValue);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    validateAndUpdate(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="numericValue">
        Value *{schema.unit ? ` (${schema.unit})` : ""}
      </Label>
      <Input
        id="numericValue"
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter numeric value"
        className={error ? "border-error" : ""}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
};
