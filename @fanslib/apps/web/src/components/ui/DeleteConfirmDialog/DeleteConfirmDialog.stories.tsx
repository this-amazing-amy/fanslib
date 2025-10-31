import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Button } from '../Button';

const DeleteConfirmDialogWrapper = (args: any) => {
  const state = useOverlayTriggerState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    state.close();
  };

  return (
    <>
      <Button variant="error" onPress={() => state.open()}>
        Delete Item
      </Button>
      {state.isOpen ? (
        <DeleteConfirmDialog
          state={state}
          onConfirm={handleConfirm}
          isLoading={isLoading}
          {...args}
        />
      ) : null}
    </>
  );
};

const meta: Meta<typeof DeleteConfirmDialog> = {
  title: 'Overlays/DeleteConfirmDialog',
  component: DeleteConfirmDialogWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    itemName: 'Example Item',
    itemType: 'item',
  },
};

export const WithCustomText: Story = {
  args: {
    title: 'Delete Post',
    description: 'Are you absolutely sure you want to delete this post? All comments will be lost.',
    confirmText: 'Delete Post',
    cancelText: 'Keep Post',
  },
};

export const WithoutItemName: Story = {
  args: {
    itemType: 'post',
  },
};

