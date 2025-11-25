/* eslint-disable react/no-array-index-key */
import type { Meta, StoryObj } from '@storybook/react';
import { GridContainer } from './GridContainer';

const meta: Meta<typeof GridContainer> = {
  title: 'UI/GridContainer',
  component: GridContainer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GridContainer>;

const ItemCard = ({ index }: { index: number }) => (
  <div className="bg-base-200 rounded-lg p-4 h-32 flex items-center justify-center">
    Item {index}
  </div>
);

export const ThreeColumns: Story = {
  render: () => (
    <GridContainer columns={3}>
      {Array.from({ length: 9 }).map((_, i) => (
        <ItemCard key={`item-${i}`} index={i + 1} />
      ))}
    </GridContainer>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <GridContainer columns={4}>
      {Array.from({ length: 12 }).map((_, i) => (
        <ItemCard key={`item-${i}`} index={i + 1} />
      ))}
    </GridContainer>
  ),
};

export const AutoFill: Story = {
  render: () => (
    <GridContainer columns="auto">
      {Array.from({ length: 15 }).map((_, i) => (
        <ItemCard key={`item-${i}`} index={i + 1} />
      ))}
    </GridContainer>
  ),
};

export const SmallGap: Story = {
  render: () => (
    <GridContainer columns={3} gap="sm">
      {Array.from({ length: 9 }).map((_, i) => (
        <ItemCard key={`item-${i}`} index={i + 1} />
      ))}
    </GridContainer>
  ),
};

export const LargeGap: Story = {
  render: () => (
    <GridContainer columns={3} gap="lg">
      {Array.from({ length: 9 }).map((_, i) => (
        <ItemCard key={`item-${i}`} index={i + 1} />
      ))}
    </GridContainer>
  ),
};


