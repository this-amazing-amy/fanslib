import type { Meta, StoryObj } from '@storybook/react';
import { useOverlayTriggerState } from 'react-stately';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './Sheet';
import { Button } from '../Button';

const SheetWrapper = (args: any) => {
  const state = useOverlayTriggerState({});

  return (
    <>
      <Button onPress={() => state.open()}>Open Sheet</Button>
      {state.isOpen ? (
        <Sheet state={state} {...args}>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>This is a sheet description.</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p>Sheet content goes here.</p>
          </div>
          <SheetFooter>
            <Button variant="ghost" onPress={() => state.close()}>
              Cancel
            </Button>
            <Button variant="primary" onPress={() => state.close()}>
              Confirm
            </Button>
          </SheetFooter>
        </Sheet>
      ) : null}
    </>
  );
};

const meta: Meta<typeof Sheet> = {
  title: 'Overlays/Sheet',
  component: SheetWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
    },
    isDismissable: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  args: {
    side: 'right',
    isDismissable: true,
  },
};

export const Left: Story = {
  args: {
    side: 'left',
    isDismissable: true,
  },
};

export const Top: Story = {
  args: {
    side: 'top',
    isDismissable: true,
  },
};

export const Bottom: Story = {
  args: {
    side: 'bottom',
    isDismissable: true,
  },
};

