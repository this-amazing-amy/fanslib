import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./index";

const meta: Meta = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    showOutsideDays: {
      control: { type: "boolean" },
      description: "Whether to show days from previous/next months",
    },
    selectedClassNames: {
      control: { type: "text" },
      description: "Custom CSS classes for selected days",
    },
  },
  args: {
    showOutsideDays: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showOutsideDays: true,
  },
};

export const HideOutsideDays: Story = {
  args: {
    showOutsideDays: false,
  },
};

const SingleSelectionComponent = () => {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Single Date Selection</h3>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          showOutsideDays={true}
        />
      </div>
      {selected && (
        <p className="text-sm text-muted-foreground">Selected: {selected.toLocaleDateString()}</p>
      )}
    </div>
  );
};

export const SingleSelection: Story = {
  render: () => <SingleSelectionComponent />,
};

const MultipleSelectionComponent = () => {
  const [selected, setSelected] = useState<Date[] | undefined>([]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Multiple Date Selection</h3>
        <Calendar
          mode="multiple"
          selected={selected}
          onSelect={setSelected}
          showOutsideDays={true}
        />
      </div>
      {selected && selected.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <p>Selected dates:</p>
          <ul className="list-disc list-inside">
            {selected.map((date) => (
              <li key={date.toISOString()}>{date.toLocaleDateString()}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const MultipleSelection: Story = {
  render: () => <MultipleSelectionComponent />,
};

const RangeSelectionComponent = () => {
  const [selected, setSelected] = useState<DateRange | undefined>();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Date Range Selection</h3>
        <Calendar
          mode="range"
          selected={selected}
          onSelect={setSelected}
          showOutsideDays={true}
        />
      </div>
      {selected && (
        <div className="text-sm text-muted-foreground">
          {selected.from && <p>From: {selected.from.toLocaleDateString()}</p>}
          {selected.to && <p>To: {selected.to.toLocaleDateString()}</p>}
        </div>
      )}
    </div>
  );
};

export const RangeSelection: Story = {
  render: () => <RangeSelectionComponent />,
};

const DisabledDatesComponent = () => {
  const [selected, setSelected] = useState<Date | undefined>();
  const today = new Date();
  const pastDates = { before: today };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Disabled Past Dates</h3>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          disabled={pastDates}
          showOutsideDays={true}
        />
      </div>
      <p className="text-sm text-muted-foreground">Past dates are disabled</p>
    </div>
  );
};

export const DisabledDates: Story = {
  render: () => <DisabledDatesComponent />,
};

const CustomStylingComponent = () => {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Custom Selected Styling</h3>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          selectedClassNames="bg-green-500 text-white hover:bg-green-600"
          showOutsideDays={true}
        />
      </div>
    </div>
  );
};

export const CustomStyling: Story = {
  render: () => <CustomStylingComponent />,
};

const ModifiersComponent = () => {
  const [selected, setSelected] = useState<Date | undefined>();
  const weekends = { dayOfWeek: [0, 6] };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Weekend Highlighting</h3>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{ weekends }}
          modifiersClassNames={{
            weekends: "text-red-500 font-bold",
          }}
          showOutsideDays={true}
        />
      </div>
      <p className="text-sm text-muted-foreground">Weekends are highlighted in red</p>
    </div>
  );
};

export const Modifiers: Story = {
  render: () => <ModifiersComponent />,
};
