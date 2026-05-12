/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@wegooli/identity-ui/tailwind.preset')],
  content: [
    './stories/**/*.{ts,tsx}',
    '../../packages/identity-ui/src/**/*.{ts,tsx}',
    '../../packages/identity-react/src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
