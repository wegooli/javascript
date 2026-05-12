import type { Meta, StoryObj } from '@storybook/react';
import { OrganizationSwitcher } from '@wegooli/identity-ui';

const meta: Meta<typeof OrganizationSwitcher> = {
  title: 'Organization/OrganizationSwitcher',
  component: OrganizationSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrganizationSwitcher>;

export const Default: Story = {
  args: {
    appearance: undefined,
    onSwitch: undefined,
  },
};

export const WithSwitchCallback: Story = {
  args: {
    appearance: undefined,
    onSwitch: (orgId: string) => console.log(`Switched to organization: ${orgId}`),
  },
};

export const WithAppearance: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#6366f1',
      },
      elements: {
        card: 'shadow-lg border-2 border-indigo-200',
      },
    },
    onSwitch: (orgId: string) => console.log(`Switched to organization: ${orgId}`),
  },
};

export const WithCustomPrimaryColor: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#14b8a6',
      },
    },
    onSwitch: undefined,
  },
};

export const WithFullAppearance: Story = {
  args: {
    appearance: {
      variables: {
        colorPrimary: '#f97316',
        borderRadius: '0.5rem',
      },
      elements: {
        card: 'shadow-md border border-orange-300',
      },
    },
    onSwitch: (orgId: string) => {
      console.log(`Organization switched to: ${orgId}`);
    },
  },
};
