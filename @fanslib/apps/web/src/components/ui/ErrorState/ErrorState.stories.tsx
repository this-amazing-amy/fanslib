import type { Meta, StoryObj } from '@storybook/react';
import { WifiOff, Database } from 'lucide-react';
import { ErrorState } from './ErrorState';

const meta: Meta<typeof ErrorState> = {
  title: 'UI/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  args: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred.',
    retry: {
      onClick: () => alert('Retry'),
    },
  },
};

export const WithError: Story = {
  args: {
    title: 'Failed to load data',
    description: 'Could not fetch the requested information.',
    error: 'Network request failed: timeout after 30s',
    retry: {
      label: 'Reload',
      onClick: () => alert('Retry'),
    },
  },
};

export const NetworkError: Story = {
  args: {
    icon: <WifiOff className="w-16 h-16 text-error" />,
    title: 'No internet connection',
    description: 'Please check your internet connection and try again.',
    retry: {
      onClick: () => alert('Retry'),
    },
  },
};

export const DatabaseError: Story = {
  args: {
    icon: <Database className="w-16 h-16 text-error" />,
    title: 'Database error',
    description: 'Unable to connect to the database.',
    error: new Error('Connection refused: ECONNREFUSED 127.0.0.1:5432'),
    retry: {
      label: 'Reconnect',
      onClick: () => alert('Retry'),
    },
  },
};

export const WithoutRetry: Story = {
  args: {
    title: 'Access denied',
    description: 'You do not have permission to view this resource.',
  },
};

