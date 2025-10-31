import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Form Controls/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isDisabled: {
      control: { type: 'boolean' },
    },
    isSelected: {
      control: { type: 'boolean' },
    },
    isIndeterminate: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    children: 'I agree',
    isSelected: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled checkbox',
    isDisabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    children: 'Disabled and checked',
    isDisabled: true,
    isSelected: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Checkbox without label',
  },
};

