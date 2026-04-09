export const SliderField = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-base-content/60">
      {label}: {value.toFixed(2)}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="range range-xs range-primary"
    />
  </div>
);
