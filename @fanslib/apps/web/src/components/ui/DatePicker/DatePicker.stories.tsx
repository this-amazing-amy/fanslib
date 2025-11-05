import { getLocalTimeZone, today } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { DateValue } from 'react-aria';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

const DefaultComponent = () => {
  const [value, setValue] = useState<DateValue | null>(null);

  return (
    <div className="w-80">
      <DatePicker
        label="Select a date"
        value={value}
        onChange={(v) => setValue(v)}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <DefaultComponent />,
};

const WithDefaultValueComponent = () => {
  const [value, setValue] = useState<DateValue>(today(getLocalTimeZone()));

  return (
    <div className="w-80">
      <DatePicker
        label="Birth date"
        value={value}
        onChange={(v) => v && setValue(v)}
      />
    </div>
  );
};

export const WithDefaultValue: Story = {
  render: () => <WithDefaultValueComponent />,
};

const WithMinMaxDatesComponent = () => {
  const [value, setValue] = useState<DateValue | null>(null);
  const minValue = today(getLocalTimeZone());
  const maxValue = today(getLocalTimeZone()).add({ weeks: 2 });

  return (
    <div className="w-80">
      <DatePicker
        label="Schedule date"
        value={value}
        onChange={(v) => setValue(v)}
        minValue={minValue}
        maxValue={maxValue}
      />
      <p className="text-sm text-base-content/70 mt-2">
        Only next 2 weeks are selectable
      </p>
    </div>
  );
};

export const WithMinMaxDates: Story = {
  render: () => <WithMinMaxDatesComponent />,
};

const WithErrorComponent = () => {
  const [value, setValue] = useState<DateValue | null>(null);

  return (
    <div className="w-80">
      <DatePicker
        label="Date"
        value={value}
        onChange={(v) => setValue(v)}
        error="Please select a date"
      />
    </div>
  );
};

export const WithError: Story = {
  render: () => <WithErrorComponent />,
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <DatePicker
        label="Date"
        value={today(getLocalTimeZone())}
        isDisabled
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-80">
      <DatePicker
        label="Date"
        value={today(getLocalTimeZone())}
        isReadOnly
      />
    </div>
  ),
};

