import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Form Controls/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost', 'error', 'success', 'warning', 'info'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg'],
    },
    isLoading: {
      control: { type: 'boolean' },
    },
    isDisabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Button',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Delete',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Confirm',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const ExtraSmall: Story = {
  args: {
    variant: 'primary',
    children: 'Extra Small',
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    variant: 'primary',
    children: 'Small',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    variant: 'primary',
    children: 'Large',
    size: 'lg',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
    isDisabled: true,
  },
};
