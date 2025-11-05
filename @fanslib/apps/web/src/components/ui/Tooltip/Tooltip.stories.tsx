import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

const TooltipWrapper = () => <Tooltip>
      <TooltipTrigger
      asChild
      >
        <Button>Hover me</Button>
      </TooltipTrigger>
        <TooltipContent>
          This is a tooltip
        </TooltipContent>
    </Tooltip>;

const meta: Meta<typeof Tooltip> = {
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

