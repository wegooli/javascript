import type { Preview } from '@storybook/react';
import React from 'react';
import { MockProvider } from '@wegooli/identity-react';
import './preview.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <MockProvider>
        <Story />
      </MockProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {},
      options: {},
    },
  },
};

export default preview;
