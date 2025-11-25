/* eslint-disable react/no-array-index-key */
import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './ScrollArea';

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="w-96 h-64 border border-base-300 rounded-lg p-4">
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={`item-${i}`} className="text-sm">
            Item {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea orientation="horizontal" className="w-96 border border-base-300 rounded-lg p-4">
      <div className="flex gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`item-${i}`} className="flex-shrink-0 w-32 h-32 bg-base-200 rounded-lg flex items-center justify-center">
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Both: Story = {
  render: () => (
    <ScrollArea orientation="both" className="w-96 h-64 border border-base-300 rounded-lg p-4">
      <div className="min-w-max space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={`item-${i}`} className="text-sm whitespace-nowrap">
            Item {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const WithMaxHeight: Story = {
  render: () => (
    <ScrollArea maxHeight="200px" className="w-96 border border-base-300 rounded-lg p-4">
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={`item-${i}`} className="text-sm">
            Item {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};


