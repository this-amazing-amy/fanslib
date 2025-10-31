import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 50,
    maxValue: 100,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    maxValue: 100,
    label: 'Uploading...',
    showLabel: true,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Progress value={40} maxValue={100} variant="primary" />
      <Progress value={50} maxValue={100} variant="secondary" />
      <Progress value={60} maxValue={100} variant="accent" />
      <Progress value={70} maxValue={100} variant="success" />
      <Progress value={80} maxValue={100} variant="warning" />
      <Progress value={90} maxValue={100} variant="error" />
      <Progress value={100} maxValue={100} variant="info" />
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Progress value={25} maxValue={100} label="Task 1" showLabel variant="primary" />
      <Progress value={50} maxValue={100} label="Task 2" showLabel variant="success" />
      <Progress value={75} maxValue={100} label="Task 3" showLabel variant="warning" />
      <Progress value={100} maxValue={100} label="Task 4" showLabel variant="success" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
    variant: 'primary',
  },
};

