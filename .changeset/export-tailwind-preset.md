---
'@wegooli/identity-ui': patch
---

Expose `tailwind.preset.js` as a public subpath export so consumers can share the SDK's Tailwind theme tokens.

Usage:

```js
// tailwind.config.js
module.exports = {
  presets: [require('@wegooli/identity-ui/tailwind.preset')],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@wegooli/identity-ui/dist/**/*.{js,mjs}',
  ],
};
```

The preset bundles the brand color scale, neutral grays, font stack, radius scale, and card shadows used by `@wegooli/identity-ui` primitives so the consuming app stays visually in sync.
