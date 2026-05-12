import type { Meta, StoryObj } from '@storybook/react';
import { SignUp } from '@wegooli/identity-ui';

const meta: Meta<typeof SignUp> = {
  title: 'Auth/SignUp',
  component: SignUp,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SignUp>;

export const Default: Story = {
  args: {
    onSuccess: undefined,
    redirectUrl: undefined,
    appearance: undefined,
  },
};

export const WithAppearance: Story = {
  args: {
    onSuccess: () => console.log('Sign-up successful'),
    redirectUrl: '/onboarding',
    appearance: {
      variables: {
        colorPrimary: '#10b981',
        colorBackground: '#f0fdf4',
        borderRadius: '0.75rem',
        fontFamily: 'system-ui, sans-serif',
      },
      elements: {
        card: 'shadow-xl border-2 border-green-200',
        primaryButton: 'font-bold text-lg',
        formFieldLabel: 'text-green-700 font-semibold',
      },
      logoUrl: 'https://via.placeholder.com/40',
      logoAlt: 'App Logo',
    },
  },
};

export const WithCustomColors: Story = {
  args: {
    onSuccess: () => console.log('Sign-up successful'),
    appearance: {
      variables: {
        colorPrimary: '#f59e0b',
        borderRadius: '0.5rem',
      },
      elements: {
        card: 'border border-amber-300',
      },
    },
  },
};

export const WithRedirectUrl: Story = {
  args: {
    onSuccess: undefined,
    redirectUrl: '/dashboard',
    appearance: {
      variables: {
        colorPrimary: '#0ea5e9',
      },
    },
  },
};

export const MinimalStyle: Story = {
  args: {
    onSuccess: () => console.log('Sign-up successful'),
    redirectUrl: undefined,
    appearance: {
      variables: {
        colorPrimary: '#6366f1',
        borderRadius: '0rem',
      },
      elements: {
        card: 'shadow-none border border-gray-300',
      },
    },
  },
};
