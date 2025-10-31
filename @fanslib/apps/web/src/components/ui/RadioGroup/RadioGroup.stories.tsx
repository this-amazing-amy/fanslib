import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  title: 'Form Controls/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isDisabled: {
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
  render: () => (
    <RadioGroup label="Select your plan">
      <RadioGroupItem value="free">Free</RadioGroupItem>
      <RadioGroupItem value="pro">Pro</RadioGroupItem>
      <RadioGroupItem value="enterprise">Enterprise</RadioGroupItem>
    </RadioGroup>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <RadioGroup label="Choose size" defaultValue="medium">
      <RadioGroupItem value="small">Small</RadioGroupItem>
      <RadioGroupItem value="medium">Medium</RadioGroupItem>
      <RadioGroupItem value="large">Large</RadioGroupItem>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup label="Select option" isDisabled>
      <RadioGroupItem value="option1">Option 1</RadioGroupItem>
      <RadioGroupItem value="option2">Option 2</RadioGroupItem>
      <RadioGroupItem value="option3">Option 3</RadioGroupItem>
    </RadioGroup>
  ),
};

