import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogModal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './AlertDialog';
import { Button } from '../Button';

const AlertDialogWrapper = () => <AlertDialogTrigger>
      <Button>Open Alert Dialog</Button>
      <AlertDialogModal isDismissable={false}>
        <AlertDialog>
          {({ close }) => (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onPress={() => {
                    console.log('Action confirmed');
                    close();
                  }}
                >
                  Continue
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialog>
      </AlertDialogModal>
    </AlertDialogTrigger>;

const meta: Meta<typeof AlertDialogWrapper> = {
  title: 'Overlays/AlertDialog',
  component: AlertDialogWrapper,
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
