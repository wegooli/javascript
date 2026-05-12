# @wegooli/identity-types

Shared TypeScript type definitions for the Wegooli Identity platform — JWT claims, API request/response shapes, and ERD entities.

Used internally by [`@wegooli/identity-react`](https://www.npmjs.com/package/@wegooli/identity-react) and [`@wegooli/identity-ui`](https://www.npmjs.com/package/@wegooli/identity-ui). You usually do not need to install this directly unless you are calling the BFF API yourself.

## Install

```bash
npm install @wegooli/identity-types
# or
pnpm add @wegooli/identity-types
```

## Exports

### Domain entities (`./auth`)

```ts
import type { User, PlatformUser, Organization, Member, Role, AuthState } from '@wegooli/identity-types';
```

### API contracts (`./api`)

```ts
import type {
  MeResponse,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  Invitation,
  OrgAuthPolicy,
  EmailOTPSendRequest,
  EmailOTPVerifyRequest,
} from '@wegooli/identity-types';
```

## License

MIT
