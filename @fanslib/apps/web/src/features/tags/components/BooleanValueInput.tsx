import { Label } from "~/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/RadioGroup";
import type { BooleanSchema } from "~/lib/tags/tagValidation";

type BooleanValueInputProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  schema: BooleanSchema;
};

export const BooleanValueInput = ({ value, onChange, schema }: BooleanValueInputProps) => {
  const trueLabel = schema.trueLabel || "Yes";
  const falseLabel = schema.falseLabel || "No";

  return (
    <div className="space-y-2">
      <Label>Value *</Label>
      <RadioGroup
        value={value.toString()}
        onChange={(stringValue) => onChange(stringValue === "true")}
        className="flex gap-6 flex-row"
      >
        <RadioGroupItem value="true">{trueLabel}</RadioGroupItem>
        <RadioGroupItem value="false">{falseLabel}</RadioGroupItem>
      </RadioGroup>
    </div>
  );
};
