import { ComboboxInput } from "./ComboboxInput";

const ROLE_PRESETS = ["full", "trailer", "promo"];

type MediaRoleInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export const MediaRoleInput = ({ value, onChange, className, "aria-label": ariaLabel }: MediaRoleInputProps) => (
  <ComboboxInput
    value={value}
    onChange={onChange}
    options={ROLE_PRESETS}
    placeholder="Role"
    className={className}
    aria-label={ariaLabel}
  />
);
