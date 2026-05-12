# @wegooli/identity-react

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
