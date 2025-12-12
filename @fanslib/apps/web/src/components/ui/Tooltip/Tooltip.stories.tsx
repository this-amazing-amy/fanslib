import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Tooltip } from './Tooltip';

const TooltipWrapper = () => (
  <Tooltip content="This is a tooltip" openDelayMs={0}>
    <Button>Hover me</Button>
  </Tooltip>
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

