import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuPopover, DropdownMenuTrigger } from './DropdownMenu';

const DropdownMenuWrapper = () => (
  <DropdownMenuTrigger>
    <Button>Open Menu</Button>
    <DropdownMenuPopover>
      <DropdownMenu onAction={(key) => console.log('Selected:', key)}>
        <DropdownMenuItem id="new">New File</DropdownMenuItem>
        <DropdownMenuItem id="open">Open</DropdownMenuItem>
        <DropdownMenuItem id="save">Save</DropdownMenuItem>
        <DropdownMenuItem id="saveAs">Save As...</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuPopover>
  </DropdownMenuTrigger>
);

const meta: Meta<typeof DropdownMenuWrapper> = {
  title: 'Overlays/DropdownMenu',
  component: DropdownMenuWrapper,
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

