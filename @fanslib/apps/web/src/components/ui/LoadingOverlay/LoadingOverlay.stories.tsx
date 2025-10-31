import type { Meta, StoryObj } from '@storybook/react';
import { LoadingOverlay } from './LoadingOverlay';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'UI/LoadingOverlay',
  component: LoadingOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingOverlay>;

export const Default: Story = {
  args: {
    show: true,
  },
};

export const WithMessage: Story = {
  args: {
    show: true,
    message: 'Loading your content...',
  },
};

export const Dark: Story = {
  args: {
    show: true,
    variant: 'dark',
    message: 'Processing...',
  },
};

export const Large: Story = {
  args: {
    show: true,
    spinnerSize: 'lg',
    message: 'Please wait while we fetch your data',
  },
};

export const Small: Story = {
  args: {
    show: true,
    spinnerSize: 'sm',
    message: 'Just a moment...',
  },
};


