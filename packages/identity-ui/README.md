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
import { ZitadelProvider } from '@wegooli/identity-react';
import { SignIn } from '@wegooli/identity-ui';

export default function SignInPage() {
  return (
    <ZitadelProvider bffBaseUrl="https://api.your-domain.com" publishableKey="pk_live_xxx">
      <SignIn redirectUrl="/dashboard" />
    </ZitadelProvider>
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

## Tailwind setup

Add the package to your Tailwind `content` array so its classes are not purged:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@wegooli/identity-ui/dist/**/*.{js,mjs}',
  ],
};
```

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
