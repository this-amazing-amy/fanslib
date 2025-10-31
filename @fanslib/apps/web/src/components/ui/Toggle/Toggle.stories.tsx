import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost', 'primary'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => {
    const [isSelected, setIsSelected] = useState(false);

    return (
      <Toggle isSelected={isSelected} onChange={setIsSelected}>
        <Bold className="h-4 w-4 mr-2" />
        Bold
      </Toggle>
    );
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Toggle variant="default">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle variant="outline">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle variant="ghost">
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle variant="primary">
        <Bold className="h-4 w-4" />
      </Toggle>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Toggle size="sm">
        <Bold className="h-3 w-3" />
      </Toggle>
      <Toggle size="md">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="lg">
        <Bold className="h-5 w-5" />
      </Toggle>
    </div>
  ),
};

export const TextFormattingToolbar: Story = {
  render: () => {
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);

    return (
      <div className="flex gap-1 p-2 bg-base-200 rounded-lg">
        <Toggle
          variant="ghost"
          size="sm"
          isSelected={bold}
          onChange={setBold}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="ghost"
          size="sm"
          isSelected={italic}
          onChange={setItalic}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="ghost"
          size="sm"
          isSelected={underline}
          onChange={setUnderline}
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
      </div>
    );
  },
};

export const AlignmentToolbar: Story = {
  render: () => {
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

    return (
      <div className="flex gap-1 p-2 bg-base-200 rounded-lg">
        <Toggle
          variant="ghost"
          size="sm"
          isSelected={alignment === 'left'}
          onChange={() => setAlignment('left')}
          aria-label="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="ghost"
          size="sm"
          isSelected={alignment === 'center'}
          onChange={() => setAlignment('center')}
          aria-label="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="ghost"
          size="sm"
          isSelected={alignment === 'right'}
          onChange={() => setAlignment('right')}
          aria-label="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
      </div>
    );
  },
};

export const WithText: Story = {
  render: () => {
    const [isSelected, setIsSelected] = useState(false);

    return (
      <Toggle isSelected={isSelected} onChange={setIsSelected} variant="outline">
        <Bold className="h-4 w-4 mr-2" />
        Bold Text
      </Toggle>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Toggle isDisabled>
      <Bold className="h-4 w-4" />
    </Toggle>
  ),
};

