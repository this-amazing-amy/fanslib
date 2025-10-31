import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(50);

    return (
      <div className="w-80">
        <Slider
          label="Volume"
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithMinMax: Story = {
  render: () => {
    const [value, setValue] = useState(25);

    return (
      <div className="w-80">
        <Slider
          label="Temperature"
          value={value}
          onChange={setValue}
          minValue={0}
          maxValue={100}
        />
      </div>
    );
  },
};

export const WithStep: Story = {
  render: () => {
    const [value, setValue] = useState(50);

    return (
      <div className="w-80">
        <Slider
          label="Brightness (increments of 10)"
          value={value}
          onChange={setValue}
          minValue={0}
          maxValue={100}
          step={10}
        />
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [value, setValue] = useState([25, 75]);

    return (
      <div className="w-80">
        <Slider
          label="Price range"
          value={value}
          onChange={setValue}
          minValue={0}
          maxValue={100}
        />
      </div>
    );
  },
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Slider label="Primary" defaultValue={50} color="primary" />
      <Slider label="Secondary" defaultValue={50} color="secondary" />
      <Slider label="Accent" defaultValue={50} color="accent" />
      <Slider label="Success" defaultValue={50} color="success" />
      <Slider label="Warning" defaultValue={50} color="warning" />
      <Slider label="Error" defaultValue={50} color="error" />
      <Slider label="Info" defaultValue={50} color="info" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Slider
        label="Disabled slider"
        defaultValue={50}
        isDisabled
      />
    </div>
  ),
};

export const CustomFormatting: Story = {
  render: () => {
    const [value, setValue] = useState(50);

    return (
      <div className="w-80">
        <Slider
          label="Volume"
          value={value}
          onChange={setValue}
          formatOptions={{ style: 'percent' }}
          minValue={0}
          maxValue={1}
          step={0.01}
        />
      </div>
    );
  },
};

