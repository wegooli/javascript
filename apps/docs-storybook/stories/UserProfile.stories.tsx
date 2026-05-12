import type { Meta, StoryObj } from '@storybook/react';
import { UserProfile } from '@wegooli/identity-ui';

const meta: Meta<typeof UserProfile> = {
  title: 'User/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserProfile>;

export const Default: Story = {
  args: {
    appearance: undefined,
  },
};

export const WithPrimaryColor: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#8b5cf6',
      },
    },
  },
};

export const WithFullAppearance: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#06b6d4',
        colorBackground: '#ecf0f1',
        borderRadius: '0.75rem',
        fontFamily: 'system-ui, sans-serif',
      },
      elements: {
        card: 'shadow-xl border-2 border-cyan-300',
        primaryButton: 'text-cyan-700 font-semibold',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#a78bfa',
      },
      elements: {
        card: 'bg-gray-900 text-white border border-gray-700 shadow-2xl',
        primaryButton: 'border-gray-600 hover:bg-gray-800 text-gray-100',
      },
    },
  },
};

export const WithCustomElements: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#ec4899',
        borderRadius: '1rem',
      },
      elements: {
        card: 'shadow-lg rounded-3xl border-2 border-pink-200',
        primaryButton: 'bg-pink-500 hover:bg-pink-600 text-white font-bold',
      },
    },
  },
};
