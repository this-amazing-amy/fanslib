import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Card, CardBody, CardTitle, CardActions } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    compact: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardBody>
        <CardTitle>Card Title</CardTitle>
        <p>This is a basic card with a title and some content.</p>
      </CardBody>
    </Card>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Card>
      <CardBody>
        <CardTitle>Card with Actions</CardTitle>
        <p>This card includes action buttons at the bottom.</p>
        <CardActions>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm">
            Confirm
          </Button>
        </CardActions>
      </CardBody>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-96">
      <figure>
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
          alt="Sample"
        />
      </figure>
      <CardBody>
        <CardTitle>Photo Card</CardTitle>
        <p>A card with an image at the top.</p>
        <CardActions>
          <Button variant="primary" size="sm">
            View More
          </Button>
        </CardActions>
      </CardBody>
    </Card>
  ),
};

export const Compact: Story = {
  render: () => (
    <Card compact>
      <CardBody>
        <CardTitle>Compact Card</CardTitle>
        <p>This is a compact card with less padding.</p>
      </CardBody>
    </Card>
  ),
};

export const WithBackground: Story = {
  render: () => (
    <Card className="bg-base-200">
      <CardBody>
        <CardTitle>Card With Background</CardTitle>
        <p>This card has a different background color.</p>
      </CardBody>
    </Card>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardBody>
          <CardTitle>Card 1</CardTitle>
          <p>First card in a grid.</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <CardTitle>Card 2</CardTitle>
          <p>Second card in a grid.</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <CardTitle>Card 3</CardTitle>
          <p>Third card in a grid.</p>
        </CardBody>
      </Card>
    </div>
  ),
};

export const ComplexCard: Story = {
  render: () => (
    <Card className="w-96">
      <figure>
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
          alt="Product"
        />
      </figure>
      <CardBody>
        <CardTitle>
          Premium Sneakers
          <div className="badge badge-secondary">NEW</div>
        </CardTitle>
        <p>Limited edition sneakers with premium materials and comfort.</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl font-bold">$299</span>
          <span className="text-sm line-through opacity-50">$399</span>
        </div>
        <CardActions>
          <Button variant="ghost" size="sm">
            Add to Cart
          </Button>
          <Button variant="primary" size="sm">
            Buy Now
          </Button>
        </CardActions>
      </CardBody>
    </Card>
  ),
};

