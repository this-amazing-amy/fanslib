import type { Meta, StoryObj } from '@storybook/react';
import { Status } from './Status';

const meta: Meta<typeof Status> = {
  title: 'UI/Status',
  component: Status,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Status>;

export const Default: Story = {
  args: {
    children: 'Neutral',
    variant: 'neutral',
  },
};

export const Success: Story = {
  args: {
    children: 'Active',
    variant: 'success',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Status variant="primary">Primary</Status>
      <Status variant="secondary">Secondary</Status>
      <Status variant="accent">Accent</Status>
      <Status variant="info">Info</Status>
      <Status variant="success">Success</Status>
      <Status variant="warning">Warning</Status>
      <Status variant="error">Error</Status>
      <Status variant="neutral">Neutral</Status>
    </div>
  ),
};

export const MultipleStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Status variant="success">Online</Status>
      <Status variant="warning">Away</Status>
      <Status variant="error">Offline</Status>
      <Status variant="neutral">Unknown</Status>
    </div>
  ),
};

export const StatusExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span>Server:</span>
        <Status variant="success">Running</Status>
      </div>
      <div className="flex items-center gap-2">
        <span>Build:</span>
        <Status variant="info">In Progress</Status>
      </div>
      <div className="flex items-center gap-2">
        <span>Deploy:</span>
        <Status variant="warning">Pending</Status>
      </div>
      <div className="flex items-center gap-2">
        <span>Tests:</span>
        <Status variant="error">Failed</Status>
      </div>
    </div>
  ),
};

