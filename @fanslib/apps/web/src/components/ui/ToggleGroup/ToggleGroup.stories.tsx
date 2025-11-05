import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, List, Grid } from 'lucide-react';
import { ToggleGroup } from './ToggleGroup';

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'primary'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

const alignmentOptions = [
  { value: 'left', label: 'Left', icon: <AlignLeft className="h-4 w-4" /> },
  { value: 'center', label: 'Center', icon: <AlignCenter className="h-4 w-4" /> },
  { value: 'right', label: 'Right', icon: <AlignRight className="h-4 w-4" /> },
];

const viewOptions = [
  { value: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
  { value: 'grid', label: 'Grid', icon: <Grid className="h-4 w-4" /> },
];

const textOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const DefaultComponent = () => {
  const [value, setValue] = useState('left');

  return (
    <ToggleGroup
      options={alignmentOptions}
      value={value}
      onChange={setValue}
      aria-label="Text alignment"
    />
  );
};

export const Default: Story = {
  render: () => <DefaultComponent />,
};

const WithLabelComponent = () => {
  const [value, setValue] = useState('list');

  return (
    <ToggleGroup
      label="View mode"
      options={viewOptions}
      value={value}
      onChange={setValue}
    />
  );
};

export const WithLabel: Story = {
  render: () => <WithLabelComponent />,
};

const VariantsComponent = () => {
  const [value1, setValue1] = useState('left');
  const [value2, setValue2] = useState('left');
  const [value3, setValue3] = useState('left');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-2">Default</p>
        <ToggleGroup
          options={alignmentOptions}
          value={value1}
          onChange={setValue1}
          variant="default"
        />
      </div>
      <div>
        <p className="text-sm mb-2">Outline</p>
        <ToggleGroup
          options={alignmentOptions}
          value={value2}
          onChange={setValue2}
          variant="outline"
        />
      </div>
      <div>
        <p className="text-sm mb-2">Primary</p>
        <ToggleGroup
          options={alignmentOptions}
          value={value3}
          onChange={setValue3}
          variant="primary"
        />
      </div>
    </div>
  );
};

export const Variants: Story = {
  render: () => <VariantsComponent />,
};

const SizesComponent = () => {
  const [value1, setValue1] = useState('left');
  const [value2, setValue2] = useState('left');
  const [value3, setValue3] = useState('left');

  return (
    <div className="space-y-4">
      <ToggleGroup
        options={alignmentOptions}
        value={value1}
        onChange={setValue1}
        size="sm"
      />
      <ToggleGroup
        options={alignmentOptions}
        value={value2}
        onChange={setValue2}
        size="md"
      />
      <ToggleGroup
        options={alignmentOptions}
        value={value3}
        onChange={setValue3}
        size="lg"
      />
    </div>
  );
};

export const Sizes: Story = {
  render: () => <SizesComponent />,
};

const TextOnlyComponent = () => {
  const [value, setValue] = useState('medium');

  return (
    <ToggleGroup
      label="Text size"
      options={textOptions}
      value={value}
      onChange={setValue}
      variant="outline"
    />
  );
};

export const TextOnly: Story = {
  render: () => <TextOnlyComponent />,
};

const IconOnlyComponent = () => {
  const [value, setValue] = useState('left');

  const iconOnlyOptions = [
    { value: 'left', label: <AlignLeft className="h-4 w-4" /> },
    { value: 'center', label: <AlignCenter className="h-4 w-4" /> },
    { value: 'right', label: <AlignRight className="h-4 w-4" /> },
  ];

  return (
    <ToggleGroup
      options={iconOnlyOptions}
      value={value}
      onChange={setValue}
      variant="outline"
      aria-label="Text alignment"
    />
  );
};

export const IconOnly: Story = {
  render: () => <IconOnlyComponent />,
};

const VerticalComponent = () => {
  const [value, setValue] = useState('left');

  return (
    <ToggleGroup
      label="Text alignment"
      options={alignmentOptions}
      value={value}
      onChange={setValue}
      orientation="vertical"
      variant="outline"
    />
  );
};

export const Vertical: Story = {
  render: () => <VerticalComponent />,
};

const WithDisabledOptionsComponent = () => {
  const [value, setValue] = useState('left');

  const optionsWithDisabled = [
    { value: 'left', label: 'Left', icon: <AlignLeft className="h-4 w-4" /> },
    { value: 'center', label: 'Center', icon: <AlignCenter className="h-4 w-4" />, disabled: true },
    { value: 'right', label: 'Right', icon: <AlignRight className="h-4 w-4" /> },
  ];

  return (
    <ToggleGroup
      label="Text alignment"
      options={optionsWithDisabled}
      value={value}
      onChange={setValue}
      variant="outline"
    />
  );
};

export const WithDisabledOptions: Story = {
  render: () => <WithDisabledOptionsComponent />,
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup
      label="Text alignment"
      options={alignmentOptions}
      value="left"
      isDisabled
      variant="outline"
    />
  ),
};
