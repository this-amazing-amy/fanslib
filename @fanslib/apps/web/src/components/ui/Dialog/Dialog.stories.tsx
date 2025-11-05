import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../Button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog';

type DialogWrapperProps = {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  isDismissable?: boolean;
};

const DialogWrapper = ({ maxWidth = 'lg', isDismissable = true }: DialogWrapperProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <DialogContent maxWidth={maxWidth} isDismissable={isDismissable}>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>This is a dialog description.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p>Dialog content goes here.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: () => <DialogWrapper />,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DialogWrapper />,
};

export const Small: Story = {
  render: () => <DialogWrapper maxWidth="sm" />,
};

export const Large: Story = {
  render: () => <DialogWrapper maxWidth="xl" />,
};

export const NotDismissable: Story = {
  render: () => <DialogWrapper maxWidth="lg" isDismissable={false} />,
};

