import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

const PopoverWrapper = () => <Popover>
      <PopoverTrigger>
        <Button>
          Open Popover
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>This is the popover content.</p>
      </PopoverContent>
    </Popover>;

const meta: Meta<typeof Popover> = {
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


