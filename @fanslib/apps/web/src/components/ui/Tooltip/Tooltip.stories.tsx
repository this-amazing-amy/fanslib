import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Tooltip, TooltipTrigger } from './Tooltip';

const TooltipWrapper = () => (
  <TooltipTrigger>
    <Button>Hover me</Button>
    <Tooltip>This is a tooltip</Tooltip>
  </TooltipTrigger>
);

const meta: Meta<typeof TooltipWrapper> = {
  title: 'Overlays/Tooltip',
  component: TooltipWrapper,
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

