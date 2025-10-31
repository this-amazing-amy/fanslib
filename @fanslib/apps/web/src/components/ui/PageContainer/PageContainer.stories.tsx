import type { Meta, StoryObj } from '@storybook/react';
import { PageContainer } from './PageContainer';

const meta: Meta<typeof PageContainer> = {
  title: 'UI/PageContainer',
  component: PageContainer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageContainer>;

export const Default: Story = {
  render: () => (
    <PageContainer>
      <div className="bg-base-200 p-8 rounded">
        <h1 className="text-2xl font-bold">Page Content</h1>
        <p className="mt-4">This is contained within a PageContainer component.</p>
      </div>
    </PageContainer>
  ),
};

export const MaxWidthMedium: Story = {
  render: () => (
    <PageContainer maxWidth="md">
      <div className="bg-base-200 p-8 rounded">
        <h1 className="text-2xl font-bold">Centered Content</h1>
        <p className="mt-4">This container has a medium max-width and is centered.</p>
      </div>
    </PageContainer>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <PageContainer maxWidth="sm">
        <div className="bg-primary/20 p-4 rounded text-center">Small</div>
      </PageContainer>
      <PageContainer maxWidth="md">
        <div className="bg-secondary/20 p-4 rounded text-center">Medium</div>
      </PageContainer>
      <PageContainer maxWidth="lg">
        <div className="bg-accent/20 p-4 rounded text-center">Large</div>
      </PageContainer>
      <PageContainer maxWidth="xl">
        <div className="bg-info/20 p-4 rounded text-center">Extra Large</div>
      </PageContainer>
      <PageContainer maxWidth="2xl">
        <div className="bg-success/20 p-4 rounded text-center">2X Large</div>
      </PageContainer>
      <PageContainer maxWidth="full">
        <div className="bg-warning/20 p-4 rounded text-center">Full Width</div>
      </PageContainer>
    </div>
  ),
};

