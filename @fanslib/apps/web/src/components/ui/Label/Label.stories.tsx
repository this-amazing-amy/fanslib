import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../Input';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Form Controls/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
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
    children: 'Email address',
    htmlFor: 'email',
  },
};

export const Required: Story = {
  args: {
    children: 'Password',
    htmlFor: 'password',
    required: true,
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="Enter username" />
    </div>
  ),
};

export const RequiredWithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email" required>
        Email address
      </Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

