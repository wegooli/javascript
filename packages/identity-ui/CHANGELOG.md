# @wegooli/identity-ui

## 1.0.1

### Patch Changes

- 24fc487: Verify the end-to-end automated publish flow after the NODE_AUTH_TOKEN fix in #8. No runtime change in any package.
- Updated dependencies [24fc487]
  - @wegooli/identity-types@1.0.1
  - @wegooli/identity-react@1.0.1

## 1.0.0

### Minor Changes

- 9f1c34f: **Breaking**: Renamed `ZitadelProvider` to `IdentityProvider`, `ZitadelContext` to `IdentityContext`, `ZitadelContextValue` to `IdentityContextValue`, and `useZitadelContext` to `useIdentityContext`.

  The SDK no longer exposes the upstream IdP implementation in its public API surface. The backend protocol (OIDC/OAuth2) is unchanged — only the identifier names are renamed.

  Migration:

  ```diff
  - import { ZitadelProvider, useZitadelContext } from '@wegooli/identity-react';
  + import { IdentityProvider, useIdentityContext } from '@wegooli/identity-react';

  - <ZitadelProvider bffBaseUrl="..." publishableKey="...">
  + <IdentityProvider bffBaseUrl="..." publishableKey="...">
      {children}
  - </ZitadelProvider>
  + </IdentityProvider>
  ```

  No alias is exported — this is an immediate rename.

### Patch Changes

- Updated dependencies [9f1c34f]
  - @wegooli/identity-types@1.0.0
  - @wegooli/identity-react@1.0.0

## 0.1.1

### Patch Changes

- 218a874: test CI release flow
