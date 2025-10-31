import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './Separator';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div>
      <p>Content above the separator</p>
      <Separator />
      <p>Content below the separator</p>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div>
      <p>First section</p>
      <Separator>OR</Separator>
      <p>Second section</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center">
      <div className="px-4">Left content</div>
      <Separator orientation="vertical" />
      <div className="px-4">Right content</div>
    </div>
  ),
};

