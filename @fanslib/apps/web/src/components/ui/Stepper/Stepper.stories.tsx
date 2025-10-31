import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { User, ShoppingCart, CreditCard, Check } from 'lucide-react';
import { Stepper } from './Stepper';
import { Button } from '../Button';

const meta: Meta<typeof Stepper> = {
  title: 'UI/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const basicSteps = [
  { label: 'Personal Info' },
  { label: 'Address' },
  { label: 'Payment' },
  { label: 'Review' },
];

const stepsWithDescription = [
  { label: 'Account', description: 'Create your account' },
  { label: 'Profile', description: 'Setup your profile' },
  { label: 'Preferences', description: 'Choose your preferences' },
  { label: 'Complete', description: 'Finish setup' },
];

const stepsWithIcons = [
  { label: 'Account', icon: <User className="h-4 w-4" /> },
  { label: 'Shopping', icon: <ShoppingCart className="h-4 w-4" /> },
  { label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Complete', icon: <Check className="h-4 w-4" /> },
];

export const Default: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);

    return (
      <div className="w-[600px] space-y-8">
        <Stepper
          steps={basicSteps}
          currentStep={currentStep}
        />
        <div className="flex gap-2 justify-center">
          <Button
            onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
            isDisabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onPress={() => setCurrentStep(Math.min(basicSteps.length - 1, currentStep + 1))}
            isDisabled={currentStep === basicSteps.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

export const WithDescriptions: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);

    return (
      <div className="w-[600px]">
        <Stepper
          steps={stepsWithDescription}
          currentStep={currentStep}
        />
      </div>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(2);

    return (
      <div className="w-[600px]">
        <Stepper
          steps={stepsWithIcons}
          currentStep={currentStep}
        />
      </div>
    );
  },
};

export const Clickable: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);

    return (
      <div className="w-[600px] space-y-4">
        <Stepper
          steps={basicSteps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
        <p className="text-sm text-base-content/70 text-center">
          Click on completed or current steps to navigate
        </p>
      </div>
    );
  },
};

export const Vertical: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);

    return (
      <div className="flex gap-8 items-start">
        <Stepper
          steps={stepsWithDescription}
          currentStep={currentStep}
          orientation="vertical"
        />
        <div className="flex flex-col gap-2">
          <Button
            onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
            isDisabled={currentStep === 0}
            size="sm"
          >
            Previous
          </Button>
          <Button
            onPress={() => setCurrentStep(Math.min(stepsWithDescription.length - 1, currentStep + 1))}
            isDisabled={currentStep === stepsWithDescription.length - 1}
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      <Stepper steps={basicSteps} currentStep={1} color="primary" />
      <Stepper steps={basicSteps} currentStep={1} color="secondary" />
      <Stepper steps={basicSteps} currentStep={1} color="accent" />
      <Stepper steps={basicSteps} currentStep={1} color="success" />
      <Stepper steps={basicSteps} currentStep={1} color="warning" />
      <Stepper steps={basicSteps} currentStep={1} color="error" />
    </div>
  ),
};

export const CompleteWizard: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);

    return (
      <div className="w-[600px] space-y-8">
        <Stepper
          steps={stepsWithDescription}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
        <div className="card bg-base-200 p-8">
          <h3 className="text-lg font-semibold mb-4">
            {stepsWithDescription[currentStep].label}
          </h3>
          <p className="text-base-content/70 mb-6">
            {stepsWithDescription[currentStep].description}
          </p>
          <div className="flex gap-2 justify-between">
            <Button
              variant="ghost"
              onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
              isDisabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onPress={() => setCurrentStep(Math.min(stepsWithDescription.length - 1, currentStep + 1))}
            >
              {currentStep === stepsWithDescription.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

