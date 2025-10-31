import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Download } from 'lucide-react';
import { Button } from '../Button';
import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Page Title',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Settings',
    description: 'Manage your account settings and preferences.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Posts',
    description: 'Manage all your posts in one place.',
    actions: (
      <>
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </>
    ),
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: 'Edit Post',
    description: 'Update your post details.',
    breadcrumbs: (
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <a>Home</a>
          </li>
          <li>
            <a>Posts</a>
          </li>
          <li>Edit Post</li>
        </ul>
      </div>
    ),
    actions: (
      <Button variant="primary" size="sm">
        Save Changes
      </Button>
    ),
  },
};

export const Complete: Story = {
  render: () => (
    <div className="bg-base-100 p-6">
      <PageHeader
        title="Media Library"
        description="Browse, organize, and manage your media files."
        breadcrumbs={
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <a>Dashboard</a>
              </li>
              <li>Media Library</li>
            </ul>
          </div>
        }
        actions={
          <>
            <Button variant="ghost" size="sm">
              Filter
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </>
        }
      />
      <div className="bg-base-200 h-64 rounded flex items-center justify-center">
        Page Content Here
      </div>
    </div>
  ),
};

