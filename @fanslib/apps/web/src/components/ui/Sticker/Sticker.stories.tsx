import type { Meta, StoryObj } from '@storybook/react';
import { Sticker } from './Sticker';

const meta: Meta<typeof Sticker> = {
  title: 'UI/Sticker',
  component: Sticker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sticker>;

export const Default: Story = {
  args: {
    children: '5',
  },
};

export const WithText: Story = {
  args: {
    children: 'NEW',
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Sticker>✓</Sticker>
      <Sticker>★</Sticker>
      <Sticker>♥</Sticker>
    </div>
  ),
};

export const CustomStyles: Story = {
  render: () => (
    <div className="flex gap-2">
      <Sticker className="bg-primary text-primary-content border-primary">HOT</Sticker>
      <Sticker className="bg-success text-success-content border-success">NEW</Sticker>
      <Sticker className="bg-error text-error-content border-error">99+</Sticker>
    </div>
  ),
};


