import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { Button } from '../Button';
import { Popover } from './Popover';

const PopoverWrapper = (args: any) => {
  const state = useOverlayTriggerState({});
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button onPress={() => state.toggle()} ref={ref}>
        Open Popover
      </Button>
      <Popover state={state} triggerRef={ref} {...args}>
        <div>
          <h3 className="font-bold text-lg mb-2">Popover Title</h3>
          <p className="text-sm">This is the popover content.</p>
        </div>
      </Popover>
    </>
  );
};

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: PopoverWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right', 'top start', 'top end', 'bottom start', 'bottom end'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Bottom: Story = {
  args: {
    placement: 'bottom',
  },
};

export const Top: Story = {
  args: {
    placement: 'top',
  },
};

export const Left: Story = {
  args: {
    placement: 'left',
  },
};

export const Right: Story = {
  args: {
    placement: 'right',
  },
};

