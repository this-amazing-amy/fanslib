import { DateTimePicker } from "~/components/DateTimePicker";

type AssignmentDateRangeProps = {
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
};

export const AssignmentDateRange = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: AssignmentDateRangeProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <div className="text-sm font-medium">From</div>
      <DateTimePicker date={fromDate} setDate={onFromDateChange} />
    </div>
    <div className="space-y-2">
      <div className="text-sm font-medium">To</div>
      <DateTimePicker date={toDate} setDate={onToDateChange} />
    </div>
  </div>
);
