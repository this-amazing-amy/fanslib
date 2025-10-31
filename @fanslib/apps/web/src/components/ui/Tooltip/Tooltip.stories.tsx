import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { useTooltipTrigger } from 'react-aria';
import { useTooltipTriggerState } from 'react-stately';
import { Tooltip } from './Tooltip';

const TooltipWrapper = (args: any) => {
  const state = useTooltipTriggerState({ delay: 500 });
  const ref = useRef<HTMLSpanElement>(null);
  const { triggerProps, tooltipProps } = useTooltipTrigger({}, state, ref);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        {...triggerProps}
        ref={ref}
        className="btn btn-primary cursor-pointer"
      >
        Hover me
      </span>
      {state.isOpen ? (
        <Tooltip state={state} {...tooltipProps} {...args}>
          This is a tooltip
        </Tooltip>
      ) : null}
    </div>
  );
};

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: TooltipWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

