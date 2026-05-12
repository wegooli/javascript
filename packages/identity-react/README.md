# @wegooli/identity-react

React SDK for the Wegooli Identity platform — `ZitadelProvider`, authentication hooks, and a typed BFF client.

Built on top of [TanStack Query](https://tanstack.com/query) for caching, optimistic updates, and stale-while-revalidate behavior. All tokens stay on the server side (BFF pattern) — the SDK only ever holds an `HttpOnly` session cookie reference.

## Install

```bash
npm install @wegooli/identity-react @tanstack/react-query react react-dom
# or
pnpm add @wegooli/identity-react @tanstack/react-query react react-dom
```

## Quick start

Wrap your app with `ZitadelProvider`:

```tsx
import { ZitadelProvider } from '@wegooli/identity-react';

export default function App({ children }) {
  return (
    <ZitadelProvider
      bffBaseUrl="https://api.your-domain.com"
      publishableKey="pk_live_xxx"
    >
      {children}
    </ZitadelProvider>
  );
}
```

Then consume auth state from any component:

```tsx
import { useAuth, useUser } from '@wegooli/identity-react';

export function Header() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return <span>Loading…</span>;
  if (!isSignedIn) return <a href="/sign-in">Sign in</a>;

  return (
    <>
      <span>Welcome, {user?.email}</span>
      <button onClick={() => signOut()}>Sign out</button>
    </>
  );
}
```

## Hooks

| Hook | Description |
|---|---|
| `useAuth()` | Session state, `isLoaded`, `isSignedIn`, `signOut`. |
| `useUser()` | Current user record from the BFF. |
| `useOrganization()` | Active organization, memberships, switching. |
| `useSignIn()` | Trigger OIDC sign-in flow (PKCE Authorization Code). |
| `useSignUp()` | Self-service registration. |
| `useEmailOTP()` | Send/verify email OTP. |
| `usePhoneOTP()` | Send/verify SMS OTP. |
| `useMagicLink()` | Request/consume magic link. |
| `useMFA()` | List, enroll, and verify MFA factors. |
| `usePasskey()` | WebAuthn (FIDO2) enrollment and assertion. |
| `useProfile()` | Update user profile and identifiers. |

## Mock provider (local development)

```tsx
import { MockProvider } from '@wegooli/identity-react';

<MockProvider user={{ id: '1', email: 'demo@example.com' }}>
  {children}
</MockProvider>
```

`MockProvider` is tree-shaken from production bundles when not imported.

## Peer dependencies

- `react` ≥ 18
- `react-dom` ≥ 18

## License

MIT
