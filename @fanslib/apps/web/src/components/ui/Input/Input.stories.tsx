import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Form Controls/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'ghost'],
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    isDisabled: {
      control: { type: 'boolean' },
    },
    isRequired: {
      control: { type: 'boolean' },
    },
    isReadOnly: {
      control: { type: 'boolean' },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Some text',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Ghost variant',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    isDisabled: true,
  },
};

export const Required: Story = {
  args: {
    placeholder: 'Required field',
    isRequired: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: 'Read-only text',
    isReadOnly: true,
  },
};

