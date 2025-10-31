import { getLocalTimeZone, today } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from './Calendar';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => <Calendar />,
};

export const SingleSelection: Story = {
  render: () => {
    const [value, setValue] = useState(today(getLocalTimeZone()));

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Single Date Selection</h3>
        <Calendar value={value} onChange={setValue} />
        <p className="text-sm text-base-content/70">
          Selected: {value.toString()}
        </p>
      </div>
    );
  },
};

export const WithMinMaxDates: Story = {
  render: () => {
    const [value, setValue] = useState(today(getLocalTimeZone()));
    const minValue = today(getLocalTimeZone());
    const maxValue = today(getLocalTimeZone()).add({ weeks: 2 });

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Date Range Restrictions</h3>
        <Calendar
          value={value}
          onChange={setValue}
          minValue={minValue}
          maxValue={maxValue}
        />
        <p className="text-sm text-base-content/70">
          Only next 2 weeks are selectable
        </p>
      </div>
    );
  },
};

export const DisabledDates: Story = {
  render: () => {
    const [value, setValue] = useState(today(getLocalTimeZone()));

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Disabled Dates</h3>
        <Calendar
          value={value}
          onChange={setValue}
          isDateUnavailable={(date) => {
            const day = date.toDate(getLocalTimeZone()).getDay();
            return day === 0 || day === 6;
          }}
        />
        <p className="text-sm text-base-content/70">
          Weekends are disabled
        </p>
      </div>
    );
  },
};

export const ReadOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Read Only Calendar</h3>
      <Calendar value={today(getLocalTimeZone())} isReadOnly />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Disabled Calendar</h3>
      <Calendar isDisabled />
    </div>
  ),
};

