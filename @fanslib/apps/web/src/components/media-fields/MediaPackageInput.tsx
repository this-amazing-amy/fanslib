import { ComboboxInput } from "./ComboboxInput";

const PACKAGE_PRESETS = ["main", "clip1", "clip2"];

type MediaPackageInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export const MediaPackageInput = ({ value, onChange, className, "aria-label": ariaLabel }: MediaPackageInputProps) => (
  <ComboboxInput
    value={value}
    onChange={onChange}
    options={PACKAGE_PRESETS}
    placeholder="Package"
    className={className}
    aria-label={ariaLabel}
  />
);
