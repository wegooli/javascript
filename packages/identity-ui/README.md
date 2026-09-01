# @wegooli/identity-ui

Pre-built React UI components for the Wegooli Identity platform — `SignIn`, `SignUp`, `UserProfile`, `OrganizationSwitcher`, and more.

Styled with [Tailwind CSS](https://tailwindcss.com) and theme-able through an `appearance` prop. Pair with [`@wegooli/identity-react`](https://www.npmjs.com/package/@wegooli/identity-react) for end-to-end auth flows.

## Install

```bash
npm install @wegooli/identity-ui @wegooli/identity-react @tanstack/react-query react react-dom
# or
pnpm add @wegooli/identity-ui @wegooli/identity-react @tanstack/react-query react react-dom
```

## Quick start

```tsx
import { IdentityProvider } from '@wegooli/identity-react';
import { SignIn } from '@wegooli/identity-ui';

export default function SignInPage() {
  return (
    <IdentityProvider bffBaseUrl="https://api.your-domain.com" publishableKey="pk_live_xxx">
      <SignIn redirectUrl="/dashboard" />
    </IdentityProvider>
  );
}
```

## Components

| Component | Description |
|---|---|
| `<SignIn />` | Email/password, OTP, magic link, passkey, and social login. |
| `<SignUp />` | Self-service registration flow. |
| `<AuthLayout />` | Centered card layout used by SignIn/SignUp. |
| `<UserProfile />` | Profile editor (display name, email, phone, password). |
| `<OrganizationSwitcher />` | Dropdown for switching between organizations. |
| `<OrganizationProfile />` | Organization settings (name, logo, branding). |
| `<MFAChallenge />` | Step-up MFA prompt during sign-in. |
| `<MFAEnroll />` | Enroll TOTP / SMS / email factors. |
| `<PasskeyManager />` | List, add, and remove WebAuthn credentials. |
| `<ProfileManager />` | Manage identifiers (email/phone/username). |

Primitives are also exported for custom flows:

```ts
import { Button, Input, Card, Divider, SocialButton, GoogleIcon } from '@wegooli/identity-ui';
```

## Styles

Import the stylesheet once, anywhere in your app:

```ts
import '@wegooli/identity-ui/styles.css';
```

That is all. It works whether or not your app uses Tailwind, and whatever
config it has — the stylesheet ships prebuilt and every rule is scoped to the
components' own wrapper (`.wg-identity`), so it neither leaks into your markup
nor loses to your own utility classes.

> **Upgrading from 1.0.7 or earlier?** Earlier versions shipped no CSS and
> relied on the consuming app's Tailwind to generate the classes. That broke
> silently — with no error — when the app didn't add this package to its
> `content` array, didn't apply the preset, or redefined the spacing scale.
> Add the import above and you can drop both workarounds.

<details>
<summary>Using Tailwind and prefer to generate the classes yourself?</summary>

Apply the preset and include the package in `content`. Note that your own
`theme.extend.spacing` / `colors` will then apply to the components too, so a
customised scale changes how they look.

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
</details>

## Theming

```tsx
<SignIn
  appearance={{
    variables: {
      colorPrimary: '#6366F1',
      borderRadius: '0.75rem',
    },
    elements: {
      card: 'shadow-xl',
      button: 'font-semibold',
    },
  }}
/>
```

## Peer dependencies

- `react` ≥ 18
- `react-dom` ≥ 18
- `@wegooli/identity-react` (workspace peer)

## License

MIT
