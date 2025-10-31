import type { Meta, StoryObj } from '@storybook/react';
import { Resizable, ResizableHandle, ResizablePanel } from './Resizable';

const meta: Meta<typeof Resizable> = {
  title: 'UI/Resizable',
  component: Resizable,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Resizable>;

export const Horizontal: Story = {
  render: () => (
    <div className="h-screen p-4">
      <Resizable direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
          <div className="bg-base-200 h-full rounded-lg p-4">
            <h3 className="font-bold mb-2">Left Panel</h3>
            <p className="text-sm">This panel can be resized</p>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div className="bg-base-100 h-full rounded-lg p-4 border border-base-300">
            <h3 className="font-bold mb-2">Right Panel</h3>
            <p className="text-sm">This is the main content area</p>
          </div>
        </ResizablePanel>
      </Resizable>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-screen p-4">
      <Resizable direction="vertical">
        <ResizablePanel defaultSize={30}>
          <div className="bg-base-200 h-full rounded-lg p-4">
            <h3 className="font-bold mb-2">Top Panel</h3>
            <p className="text-sm">This panel can be resized</p>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div className="bg-base-100 h-full rounded-lg p-4 border border-base-300">
            <h3 className="font-bold mb-2">Bottom Panel</h3>
            <p className="text-sm">This is the main content area</p>
          </div>
        </ResizablePanel>
      </Resizable>
    </div>
  ),
};


