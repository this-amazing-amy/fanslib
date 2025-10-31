import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';
import { Item } from 'react-stately';

const meta: Meta<typeof Select> = {
  title: 'Form Controls/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isDisabled: {
      control: { type: 'boolean' },
    },
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
    <Select label="Choose a fruit" placeholder="Select...">
      <Item key="apple">Apple</Item>
      <Item key="banana">Banana</Item>
      <Item key="cherry">Cherry</Item>
      <Item key="date">Date</Item>
      <Item key="elderberry">Elderberry</Item>
    </Select>
  ),
};

export const WithDefaultSelection: Story = {
  render: () => (
    <Select label="Choose a color" defaultSelectedKey="blue">
      <Item key="red">Red</Item>
      <Item key="green">Green</Item>
      <Item key="blue">Blue</Item>
      <Item key="yellow">Yellow</Item>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select label="Choose an option" isDisabled>
      <Item key="option1">Option 1</Item>
      <Item key="option2">Option 2</Item>
      <Item key="option3">Option 3</Item>
    </Select>
  ),
};

export const WithoutLabel: Story = {
  render: () => (
    <Select placeholder="Select a country..." aria-label="Country">
      <Item key="us">United States</Item>
      <Item key="uk">United Kingdom</Item>
      <Item key="ca">Canada</Item>
      <Item key="au">Australia</Item>
      <Item key="de">Germany</Item>
    </Select>
  ),
};

export const ManyOptions: Story = {
  render: () => (
    <Select label="Choose a number" placeholder="Select...">
      {Array.from({ length: 20 }, (_, i) => (
        <Item key={i + 1}>{`Option ${i + 1}`}</Item>
      ))}
    </Select>
  ),
};

