import type { Meta, StoryObj } from '@storybook/react';
import { Plus, MoreVertical } from 'lucide-react';
import { Button } from '../Button';
import { SectionHeader } from './SectionHeader';

const meta: Meta<typeof SectionHeader> = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {
  args: {
    title: 'Section Title',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Recent Activity',
    description: 'View your recent activity and notifications.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Team Members',
    description: 'Manage team access and permissions.',
    actions: (
      <>
        <Button variant="ghost" size="xs">
          <MoreVertical className="w-4 h-4" />
        </Button>
        <Button variant="primary" size="xs">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </>
    ),
  },
};

export const InCard: Story = {
  render: () => (
    <div className="card bg-base-100 card-bordered w-96">
      <div className="card-body">
        <SectionHeader
          title="Statistics"
          description="Overview of your performance metrics."
          actions={
            <Button variant="ghost" size="xs">
              View All
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="stat bg-base-200 rounded p-4">
            <div className="stat-title">Views</div>
            <div className="stat-value text-2xl">1,234</div>
          </div>
          <div className="stat bg-base-200 rounded p-4">
            <div className="stat-title">Likes</div>
            <div className="stat-value text-2xl">567</div>
          </div>
        </div>
      </div>
    </div>
  ),
};

