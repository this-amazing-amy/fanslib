import type { Meta, StoryObj } from '@storybook/react';
import { Item } from 'react-stately';
import { Button } from '../Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './DropdownMenu';

const DropdownMenuWrapper = () => (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button>
        Open Menu
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <Item key="new">New File</Item>
      <Item key="open">Open</Item>
      <Item key="save">Save</Item>
      <Item key="saveAs">Save As...</Item>
    </DropdownMenuContent>
  </DropdownMenu>);

const meta: Meta<typeof DropdownMenu> = {
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

