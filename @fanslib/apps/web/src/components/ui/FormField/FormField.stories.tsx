import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Checkbox } from '../Checkbox';

const meta: Meta<typeof FormField> = {
  title: 'Form Controls/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    spacing: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg'],
    },
    required: {
      control: { type: 'boolean' },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  render: () => (
    <FormField label="Email" htmlFor="email" required>
      <Input id="email" type="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FormField
      label="Username"
      htmlFor="username"
      description="Choose a unique username for your account"
    >
      <Input id="username" placeholder="johndoe" />
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField label="Password" htmlFor="password" error="Password must be at least 8 characters">
      <Input id="password" type="password" placeholder="Enter password" />
    </FormField>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <FormField
      label="Bio"
      htmlFor="bio"
      helperText="Tell us a little about yourself"
    >
      <Textarea id="bio" placeholder="I love..." />
    </FormField>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <FormField>
      <Checkbox>I agree to the terms and conditions</Checkbox>
    </FormField>
  ),
};

export const SmallSpacing: Story = {
  render: () => (
    <FormField label="Name" htmlFor="name" spacing="sm">
      <Input id="name" placeholder="John Doe" />
    </FormField>
  ),
};

export const LargeSpacing: Story = {
  render: () => (
    <FormField label="Message" htmlFor="message" spacing="lg">
      <Textarea id="message" placeholder="Your message..." />
    </FormField>
  ),
};

