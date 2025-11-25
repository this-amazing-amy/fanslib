import { type DateValue, getLocalTimeZone, isWeekend, parseDate, today } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Calendar } from "./index";

const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

const ControlledComponent = () => {
  const [date, setDate] = useState(parseDate("2024-04-01"));

  return (
    <div className="space-y-4">
      <Calendar value={date} onChange={setDate} />
      <p className="text-sm text-muted-foreground">Selected: {date.toString()}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledComponent />,
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    isReadOnly: true,
    defaultValue: parseDate("2024-04-01"),
  },
};

const UnavailableDatesComponent = () => {
  const isDateUnavailable = (date: DateValue) => isWeekend(date, "en-US");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Weekends Unavailable</h3>
      <Calendar isDateUnavailable={isDateUnavailable} />
    </div>
  );
};

export const UnavailableDates: Story = {
  render: () => <UnavailableDatesComponent />,
};

export const MinMaxDates: Story = {
  args: {
    minValue: today(getLocalTimeZone()),
    maxValue: today(getLocalTimeZone()).add({ weeks: 2 }),
  },
};
