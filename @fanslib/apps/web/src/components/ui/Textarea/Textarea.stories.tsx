import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Form Controls/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isDisabled: {
      control: { type: 'boolean' },
    },
    isRequired: {
      control: { type: 'boolean' },
    },
    isReadOnly: {
      control: { type: 'boolean' },
    },
    rows: {
      control: { type: 'number' },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'This is some text content in the textarea.',
  },
};

export const LargeRows: Story = {
  args: {
    placeholder: 'Large textarea with 8 rows',
    rows: 8,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    isDisabled: true,
  },
};

export const Required: Story = {
  args: {
    placeholder: 'This field is required',
    isRequired: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: 'This text is read-only and cannot be edited.',
    isReadOnly: true,
  },
};

