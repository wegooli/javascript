import type { Meta, StoryObj } from '@storybook/react';
import { OrganizationProfile } from '@wegooli/identity-ui';

const meta: Meta<typeof OrganizationProfile> = {
  title: 'Organization/OrganizationProfile',
  component: OrganizationProfile,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrganizationProfile>;

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
        colorPrimary: '#059669',
        colorBackground: '#f0fdf4',
        borderRadius: '0.75rem',
        fontFamily: 'system-ui, sans-serif',
      },
      elements: {
        card: 'shadow-xl border-2 border-green-300 rounded-xl',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#34d399',
      },
      elements: {
        card: 'bg-gray-900 text-white border border-gray-700 shadow-2xl rounded-lg',
      },
    },
  },
};

export const MinimalStyle: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#6366f1',
        borderRadius: '0rem',
      },
      elements: {
        card: 'shadow-none border border-gray-300 rounded-none',
      },
    },
  },
};
