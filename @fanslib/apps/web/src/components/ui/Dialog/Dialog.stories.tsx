import type { Meta, StoryObj } from '@storybook/react';
import { useOverlayTriggerState } from 'react-stately';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from './Dialog';
import { Button } from '../Button';

const DialogWrapper = (args: any) => {
  const state = useOverlayTriggerState({});

  return (
    <>
      <Button onPress={() => state.open()}>Open Dialog</Button>
      <Dialog state={state} {...args}>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>This is a dialog description.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p>Dialog content goes here.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onPress={() => state.close()}>
            Cancel
          </Button>
          <Button variant="primary" onPress={() => state.close()}>
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: DialogWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
    isDismissable: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxWidth: 'lg',
    isDismissable: true,
  },
};

export const Small: Story = {
  args: {
    maxWidth: 'sm',
    isDismissable: true,
  },
};

export const Large: Story = {
  args: {
    maxWidth: 'xl',
    isDismissable: true,
  },
};

export const NotDismissable: Story = {
  args: {
    maxWidth: 'lg',
    isDismissable: false,
  },
};

