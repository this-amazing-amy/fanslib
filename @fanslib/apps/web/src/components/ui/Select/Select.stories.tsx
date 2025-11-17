import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './Select';

const meta: Meta<typeof Select> = {
  title: 'Form Controls/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
        <SelectItem value="date">Date</SelectItem>
        <SelectItem value="elderberry">Elderberry</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultSelection: Story = {
  render: () => (
    <Select defaultValue="blue">
      <SelectTrigger>
        <SelectValue placeholder="Select a color..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="red">Red</SelectItem>
        <SelectItem value="green">Green</SelectItem>
        <SelectItem value="blue">Blue</SelectItem>
        <SelectItem value="yellow">Yellow</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger>
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Select>
      <SelectLabel>Country</SelectLabel>
      <SelectTrigger>
        <SelectValue placeholder="Select a country..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
        <SelectItem value="de">Germany</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const ManyOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 20 }, (_, i) => (
          <SelectItem key={i + 1} value={`option-${i + 1}`}>
            {`Option ${i + 1}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup label="Citrus">
          <SelectItem value="orange">Orange</SelectItem>
          <SelectItem value="lemon">Lemon</SelectItem>
          <SelectItem value="grapefruit">Grapefruit</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup label="Berries">
          <SelectItem value="strawberry">Strawberry</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="raspberry">Raspberry</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup label="Stone Fruits">
          <SelectItem value="peach">Peach</SelectItem>
          <SelectItem value="plum">Plum</SelectItem>
          <SelectItem value="apricot">Apricot</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('option2');
    return (
      <div className="space-y-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm">Selected value: {value}</div>
      </div>
    );
  },
};

