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

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<DateValue | null>(null);

    return (
      <div className="w-80">
        <DatePicker
          label="Select a date"
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithDefaultValue: Story = {
  render: () => {
    const [value, setValue] = useState<DateValue>(today(getLocalTimeZone()));

    return (
      <div className="w-80">
        <DatePicker
          label="Birth date"
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithMinMaxDates: Story = {
  render: () => {
    const [value, setValue] = useState<DateValue | null>(null);
    const minValue = today(getLocalTimeZone());
    const maxValue = today(getLocalTimeZone()).add({ weeks: 2 });

    return (
      <div className="w-80">
        <DatePicker
          label="Schedule date"
          value={value}
          onChange={setValue}
          minValue={minValue}
          maxValue={maxValue}
        />
        <p className="text-sm text-base-content/70 mt-2">
          Only next 2 weeks are selectable
        </p>
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<DateValue | null>(null);

    return (
      <div className="w-80">
        <DatePicker
          label="Date"
          value={value}
          onChange={setValue}
          error="Please select a date"
        />
      </div>
    );
  },
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

