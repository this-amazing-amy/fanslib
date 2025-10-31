import type { Meta, StoryObj } from '@storybook/react';
import { FileX, Users, Mail } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at this time.',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No posts yet',
    description: 'Get started by creating your first post.',
    action: {
      label: 'Create Post',
      onClick: () => alert('Create post'),
    },
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <FileX className="w-16 h-16 text-error" />,
    title: 'No files found',
    description: 'Upload files to get started.',
    action: {
      label: 'Upload Files',
      onClick: () => alert('Upload'),
    },
  },
};

export const NoUsers: Story = {
  args: {
    icon: <Users className="w-16 h-16 text-info" />,
    title: 'No team members',
    description: 'Invite team members to collaborate on this project.',
    action: {
      label: 'Invite Members',
      onClick: () => alert('Invite'),
    },
  },
};

export const NoMessages: Story = {
  args: {
    icon: <Mail className="w-16 h-16 text-primary" />,
    title: 'Inbox is empty',
    description: 'You have no new messages.',
  },
};

