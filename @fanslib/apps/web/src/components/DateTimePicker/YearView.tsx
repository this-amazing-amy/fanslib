import { ChevronDown, ChevronUp } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";

type YearViewProps = {
  tempDate: Date;
  yearInputValue: string;
  setYearInputValue: (value: string) => void;
  handleYearChange: (year: number) => void;
  commitYearInput: (value: string) => void;
  incrementYear: () => void;
  decrementYear: () => void;
  switchToDateMode: () => void;
  currentDate: string;
  yearRef: RefObject<HTMLInputElement | null>;
  view: "date" | "time" | "year";
};

export const YearView = ({
  tempDate,
  yearInputValue,
  setYearInputValue,
  handleYearChange,
  commitYearInput,
  incrementYear,
  decrementYear,
  switchToDateMode,
  currentDate,
  yearRef,
  view,
}: YearViewProps) => (
  <div
    className={cn(
      "flex flex-col absolute inset-0 p-3",
      view === "year" ? "pointer-events-auto" : "pointer-events-none",
    )}
    style={{ visibility: view === "year" ? "visible" : "hidden" }}
  >
    <Button
      variant="ghost"
      onPress={switchToDateMode}
      className="w-full justify-start text-left font-normal text-sm transition-opacity hover:opacity-80 mb-4"
    >
      <span className="font-bold">{currentDate}</span>
    </Button>
    <div className="border-t border-border pt-3 flex-1 flex flex-col">
      <div className="flex flex-col flex-1 items-center justify-center">
        {/* Year Display */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementYear}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Increment year"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={yearInputValue}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow digits and limit to 4 digits
              if (value === "" || /^\d{1,4}$/.test(value)) {
                setYearInputValue(value);
                // Only update the date if we have a valid 4-digit year
                if (value.length === 4) {
                  const year = parseInt(value, 10);
                  if (!isNaN(year) && year >= 1900 && year <= 2100) {
                    handleYearChange(year);
                  }
                }
              }
            }}
            onFocus={(e) => {
              e.target.select();
            }}
            onBlur={() => {
              commitYearInput(yearInputValue);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                incrementYear();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                decrementYear();
              } else if (e.key === "Enter") {
                e.preventDefault();
                commitYearInput(yearInputValue);
                switchToDateMode();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setYearInputValue(tempDate.getFullYear().toString());
                switchToDateMode();
              }
            }}
            className="text-6xl font-mono font-bold text-center w-48 bg-transparent border-none outline-none focus:bg-muted/50 rounded px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -1 : 1;
              handleYearChange(tempDate.getFullYear() + delta);
            }}
          />
          <button
            type="button"
            onClick={decrementYear}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Decrement year"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
