import type { Meta, StoryObj } from '@storybook/react';
import { Heart } from 'lucide-react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    showIcon: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully!',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your changes before continuing.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred while processing your request.',
  },
};

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Important Notice',
    children: 'Please read this important information carefully.',
  },
};

export const WithoutIcon: Story = {
  args: {
    variant: 'info',
    children: 'This alert has no icon.',
    showIcon: false,
  },
};

export const CustomIcon: Story = {
  args: {
    variant: 'success',
    children: 'Custom icon example',
    icon: <Heart className="w-6 h-6" />,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info">This is an informational message.</Alert>
      <Alert variant="success">Operation completed successfully!</Alert>
      <Alert variant="warning">Please proceed with caution.</Alert>
      <Alert variant="error">An error has occurred.</Alert>
    </div>
  ),
};

export const WithTitles: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" title="Information">
        Here is some helpful information for you.
      </Alert>
      <Alert variant="success" title="Success">
        Your changes have been saved.
      </Alert>
      <Alert variant="warning" title="Warning">
        This action cannot be undone.
      </Alert>
      <Alert variant="error" title="Error">
        Failed to save changes.
      </Alert>
    </div>
  ),
};

