import { getLocalTimeZone, today } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { DateValue, RangeValue } from 'react-aria';
import { DateRangePicker } from './DateRangePicker';

const meta: Meta<typeof DateRangePicker> = {
  title: 'UI/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<RangeValue<DateValue> | null>(null);

    return (
      <div className="w-96">
        <DateRangePicker
          label="Select date range"
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithDefaultValue: Story = {
  render: () => {
    const [value, setValue] = useState<RangeValue<DateValue>>({
      start: today(getLocalTimeZone()),
      end: today(getLocalTimeZone()).add({ weeks: 1 }),
    });

    return (
      <div className="w-96">
        <DateRangePicker
          label="Trip dates"
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithMinMaxDates: Story = {
  render: () => {
    const [value, setValue] = useState<RangeValue<DateValue> | null>(null);
    const minValue = today(getLocalTimeZone());
    const maxValue = today(getLocalTimeZone()).add({ months: 1 });

    return (
      <div className="w-96">
        <DateRangePicker
          label="Schedule range"
          value={value}
          onChange={setValue}
          minValue={minValue}
          maxValue={maxValue}
        />
        <p className="text-sm text-base-content/70 mt-2">
          Only next month is selectable
        </p>
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<RangeValue<DateValue> | null>(null);

    return (
      <div className="w-96">
        <DateRangePicker
          label="Date range"
          value={value}
          onChange={setValue}
          error="Please select a date range"
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-96">
      <DateRangePicker
        label="Date range"
        value={{
          start: today(getLocalTimeZone()),
          end: today(getLocalTimeZone()).add({ weeks: 1 }),
        }}
        isDisabled
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-96">
      <DateRangePicker
        label="Date range"
        value={{
          start: today(getLocalTimeZone()),
          end: today(getLocalTimeZone()).add({ weeks: 1 }),
        }}
        isReadOnly
      />
    </div>
  ),
};

