import type { Meta, StoryObj } from "@storybook/react";
import { BurgerIcon } from "./BurgerIcon";

const meta: Meta<typeof BurgerIcon> = {
  title: "UI/BurgerIcon",
  component: BurgerIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    className: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "md",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const CustomClassName: Story = {
  args: {
    size: "md",
    className: "text-primary",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <BurgerIcon size="sm" />
      <BurgerIcon size="md" />
      <BurgerIcon size="lg" />
    </div>
  ),
};
