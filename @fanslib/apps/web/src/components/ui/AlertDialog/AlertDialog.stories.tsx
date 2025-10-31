import type { Meta, StoryObj } from '@storybook/react';
import { useOverlayTriggerState } from 'react-stately';
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './AlertDialog';
import { Button } from '../Button';

const AlertDialogWrapper = (args: any) => {
  const state = useOverlayTriggerState({});

  return (
    <>
      <Button onPress={() => state.open()}>Open Alert Dialog</Button>
      {state.isOpen ? (
        <AlertDialog state={state} {...args}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => state.close()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onPress={() => state.close()}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
      ) : null}
    </>
  );
};

const meta: Meta<typeof AlertDialog> = {
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

