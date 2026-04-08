import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/Select";

const CONTENT_RATINGS = [
  { value: "xt", label: "Extreme" },
  { value: "uc", label: "Uncensored" },
  { value: "cn", label: "Censored" },
  { value: "sg", label: "Suggestive" },
  { value: "sf", label: "Safe" },
] as const;

const UNSET = "__none__";

type MediaContentRatingInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export const MediaContentRatingInput = ({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: MediaContentRatingInputProps) => (
  <Select
    value={value || UNSET}
    onValueChange={(v) => onChange(v === UNSET ? "" : v)}
    className={className}
    aria-label={ariaLabel}
  >
    <SelectTrigger className="input-sm h-8 min-h-8 w-full max-w-96 py-0">
      <SelectValue placeholder="Rating" />
    </SelectTrigger>
    <SelectContent>
      {CONTENT_RATINGS.map((r) => (
        <SelectItem key={r.value} value={r.value} textValue={r.label}>
          {r.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
