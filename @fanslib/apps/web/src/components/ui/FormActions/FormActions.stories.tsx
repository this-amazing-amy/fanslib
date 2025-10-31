import type { Meta, StoryObj } from '@storybook/react';
import { FormActions } from './FormActions';
import { Button } from '../Button';

const meta: Meta<typeof FormActions> = {
  title: 'Form Controls/FormActions',
  component: FormActions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    justify: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'between'],
    },
    direction: {
      control: { type: 'select' },
      options: ['row', 'col'],
    },
    spacing: {
      control: { type: 'select' },
      options: ['none', 'sm', 'default', 'lg'],
    },
    responsive: {
      control: { type: 'boolean' },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FormActions>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </FormActions>
  ),
};

export const JustifyStart: Story = {
  render: () => (
    <FormActions justify="start">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </FormActions>
  ),
};

export const JustifyCenter: Story = {
  render: () => (
    <FormActions justify="center">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </FormActions>
  ),
};

export const JustifyBetween: Story = {
  render: () => (
    <FormActions justify="between">
      <Button variant="error">Delete</Button>
      <div className="flex gap-3">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </FormActions>
  ),
};

export const Column: Story = {
  render: () => (
    <FormActions direction="col">
      <Button variant="primary">Save</Button>
      <Button variant="ghost">Cancel</Button>
    </FormActions>
  ),
};

export const SmallSpacing: Story = {
  render: () => (
    <FormActions spacing="sm">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </FormActions>
  ),
};

export const LargeSpacing: Story = {
  render: () => (
    <FormActions spacing="lg">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </FormActions>
  ),
};

export const Responsive: Story = {
  render: () => (
    <FormActions responsive>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </FormActions>
  ),
};

export const MultipleButtons: Story = {
  render: () => (
    <FormActions>
      <Button variant="error">Delete</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
      <Button variant="success">Publish</Button>
    </FormActions>
  ),
};

