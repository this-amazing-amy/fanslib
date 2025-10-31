import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 64,
    height: 64,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="card bg-base-100 card-bordered w-96">
      <div className="card-body">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
        </div>
        <Skeleton variant="rectangular" width="100%" height={200} className="mt-4" />
      </div>
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

