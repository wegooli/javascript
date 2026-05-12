/**
 * Shared Tailwind preset for the platform identity design system.
 *
 * Used by:
 *   - apps/dashboard/tailwind.config.js
 *   - apps/docs-storybook/tailwind.config.*
 *
 * Anchors brand color, neutral gray scale, font stack, and radius scale used
 * by the identity-ui primitives.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f3efff',
          100: '#e6dcff',
          200: '#cdb9ff',
          300: '#b094ff',
          400: '#916eff',
          500: '#6c47ff',
          600: '#5a36e8',
          700: '#4a2bc4',
          800: '#3a229b',
          900: '#2c1a78',
          DEFAULT: '#6c47ff',
        },
        neutral: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'card-lg': '0 4px 16px rgba(0, 0, 0, 0.08), 0 16px 40px rgba(108, 71, 255, 0.08)',
      },
    },
  },
};
