import type { Meta, StoryObj } from '@storybook/react';
import { useOverlayTriggerState } from 'react-stately';
import { FormDialog } from './FormDialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { FormField } from '../FormField';

const FormDialogWrapper = (args: any) => {
  const state = useOverlayTriggerState({});

  return (
    <>
      <Button onPress={() => state.open()}>Open Form Dialog</Button>
      {state.isOpen ? (
        <FormDialog
          state={state}
          title="Edit Profile"
          description="Make changes to your profile here."
          footer={
            <>
              <Button variant="ghost" onPress={() => state.close()}>
                Cancel
              </Button>
              <Button variant="primary" onPress={() => state.close()}>
                Save
              </Button>
            </>
          }
          {...args}
        >
          <FormField label="Name" name="name">
            <Input placeholder="Enter your name" />
          </FormField>
          <FormField label="Email" name="email">
            <Input type="email" placeholder="Enter your email" />
          </FormField>
        </FormDialog>
      ) : null}
    </>
  );
};

const meta: Meta<typeof FormDialog> = {
  title: 'Overlays/FormDialog',
  component: FormDialogWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxWidth: 'lg',
  },
};

export const Small: Story = {
  args: {
    maxWidth: 'sm',
  },
};

