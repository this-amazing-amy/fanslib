import type { Meta, StoryObj } from '@storybook/react';
import { useMenuTriggerState } from 'react-stately';
import { useMenuTrigger } from 'react-aria';
import { useRef } from 'react';
import { Item } from 'react-stately';
import { DropdownMenu } from './DropdownMenu';
import { Button } from '../Button';

const DropdownMenuWrapper = (args: any) => {
  const state = useMenuTriggerState({});
  const ref = useRef<HTMLButtonElement>(null);
  const { menuTriggerProps } = useMenuTrigger({}, state, ref);

  return (
    <>
      <Button {...menuTriggerProps} ref={ref}>
        Open Menu
      </Button>
      <DropdownMenu state={state} triggerRef={ref} onAction={(key) => alert(`Action: ${key}`)} {...args}>
        <Item key="new">New File</Item>
        <Item key="open">Open</Item>
        <Item key="save">Save</Item>
        <Item key="saveAs">Save As...</Item>
      </DropdownMenu>
    </>
  );
};

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

