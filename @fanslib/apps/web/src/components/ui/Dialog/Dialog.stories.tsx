import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

type DialogWrapperProps = {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  isDismissable?: boolean;
};

const DialogWrapper = ({ maxWidth = 'lg', isDismissable = true }: DialogWrapperProps) => {
  return (
    <DialogTrigger>
      <Button>Open Dialog</Button>
      <DialogModal isDismissable={isDismissable}>
        <Dialog maxWidth={maxWidth}>
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>This is a dialog description.</DialogDescription>
              </DialogHeader>
              <DialogBody>
                <p>Dialog content goes here.</p>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button variant="primary" onPress={close}>
                  Confirm
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};

const meta: Meta<typeof DialogWrapper> = {
  title: 'Overlays/Dialog',
  component: DialogWrapper,
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

