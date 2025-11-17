import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Popover, PopoverTrigger } from './Popover';

const PopoverWrapper = () => (
  <PopoverTrigger>
    <Button>Open Popover</Button>
    <Popover>
      <p>This is the popover content.</p>
    </Popover>
  </PopoverTrigger>
);

const meta: Meta<typeof PopoverWrapper> = {
  title: 'Overlays/Popover',
  component: PopoverWrapper,
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


