import type { Meta, StoryObj } from '@storybook/react';
import { SignIn } from '@wegooli/identity-ui';

const meta: Meta<typeof SignIn> = {
  title: 'Auth/SignIn',
  component: SignIn,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SignIn>;

export const Default: Story = {
  args: {
    onSuccess: undefined,
    redirectUrl: undefined,
    authPolicy: {
      allowPasskey: true,
      allowEmailOtp: true,
      allowedOauthProviders: ['google'],
    },
    appearance: undefined,
  },
};

export const WithAppearance: Story = {
  args: {
    onSuccess: () => console.log('Sign-in successful'),
    redirectUrl: '/dashboard',
    authPolicy: {
      allowPasskey: true,
      allowEmailOtp: true,
      allowedOauthProviders: ['google', 'github'],
    },
    appearance: {
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#f9fafb',
        borderRadius: '0.75rem',
        fontFamily: 'system-ui, sans-serif',
      },
      elements: {
        card: 'shadow-xl border-2 border-purple-200',
        primaryButton: 'font-bold text-lg',
      },
      logoUrl: 'https://via.placeholder.com/40',
      logoAlt: 'Company Logo',
    },
  },
};

export const WithCustomColors: Story = {
  args: {
    onSuccess: () => console.log('Sign-in successful'),
    authPolicy: {
      allowPasskey: true,
      allowEmailOtp: true,
      allowedOauthProviders: ['google'],
    },
    appearance: {
      variables: {
        colorPrimary: '#dc2626',
        borderRadius: '0.375rem',
      },
      elements: {
        card: 'border border-red-300',
      },
    },
  },
};

export const EmailOtpOnly: Story = {
  args: {
    onSuccess: () => console.log('Email OTP sign-in successful'),
    authPolicy: {
      allowPasskey: false,
      allowEmailOtp: true,
      allowedOauthProviders: [],
    },
    appearance: undefined,
  },
};

export const WithAllOAuthProviders: Story = {
  args: {
    onSuccess: undefined,
    redirectUrl: '/onboarding',
    authPolicy: {
      allowPasskey: true,
      allowEmailOtp: true,
      allowedOauthProviders: ['google', 'github', 'microsoft'],
    },
    appearance: {
      variables: {
        colorPrimary: '#3b82f6',
      },
    },
  },
};
