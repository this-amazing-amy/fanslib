import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Form Controls/Switch',
  component: Switch,
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
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Enable notifications',
  },
};

export const Selected: Story = {
  args: {
    children: 'Dark mode',
    isSelected: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled switch',
    isDisabled: true,
  },
};

export const DisabledSelected: Story = {
  args: {
    children: 'Disabled and on',
    isDisabled: true,
    isSelected: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Toggle setting',
  },
};

