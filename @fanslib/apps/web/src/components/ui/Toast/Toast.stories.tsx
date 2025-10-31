import type { Meta, StoryObj } from '@storybook/react';
import { useToastQueue } from 'react-stately';
import { Button } from '../Button';
import { ToastRegion, type ToastContent } from './Toast';

const ToastWrapper = (args: any) => {
  const state = useToastQueue<ToastContent>({
    maxVisibleToasts: 5,
  });

  const showToast = (content: ToastContent) => {
    state.add(content, { timeout: 5000 });
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <Button onPress={() => showToast({ title: 'Default Toast', variant: 'default' })}>
          Default Toast
        </Button>
        <Button onPress={() => showToast({ title: 'Success!', description: 'Operation completed successfully', variant: 'success' })}>
          Success Toast
        </Button>
        <Button onPress={() => showToast({ title: 'Error!', description: 'Something went wrong', variant: 'error' })}>
          Error Toast
        </Button>
        <Button onPress={() => showToast({ title: 'Warning!', description: 'Please be careful', variant: 'warning' })}>
          Warning Toast
        </Button>
        <Button onPress={() => showToast({ title: 'Info', description: 'Here is some information', variant: 'info' })}>
          Info Toast
        </Button>
      </div>
      <ToastRegion state={state} {...args} />
    </div>
  );
};

const meta: Meta<typeof ToastRegion> = {
  title: 'Overlays/Toast',
  component: ToastWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

