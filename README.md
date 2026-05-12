# Wegooli Identity — JavaScript SDK

Official JavaScript/TypeScript SDK suite for the Wegooli Identity platform.

| Package | Description |
|---|---|
| [`@wegooli/identity-types`](./packages/identity-types) | Shared TypeScript type definitions — JWT claims, API contracts, entities |
| [`@wegooli/identity-react`](./packages/identity-react) | React SDK — `IdentityProvider`, `useAuth`, `useUser`, `useOrganization`, ... |
| [`@wegooli/identity-ui`](./packages/identity-ui) | Pre-built UI components — `SignIn`, `SignUp`, `UserProfile`, `OrganizationSwitcher`, ... |

## Quick start

```bash
pnpm add @wegooli/identity-react @wegooli/identity-ui @tanstack/react-query react react-dom
```

```tsx
import { IdentityProvider } from '@wegooli/identity-react';
import { SignIn } from '@wegooli/identity-ui';

export default function App() {
  return (
    <IdentityProvider
      bffBaseUrl="https://api.your-domain.com"
      publishableKey="pk_live_xxx"
    >
      <SignIn redirectUrl="/dashboard" />
    </IdentityProvider>
  );
}
```

See each package's README for the full API reference.

## Storybook gallery

A live gallery of every component (in `apps/docs-storybook`) consumes the SDK packages via the workspace, so component edits and their stories ship in the same PR.

```bash
# Run locally
pnpm --filter @wegooli/docs-storybook storybook

# Build the static gallery (outputs to apps/docs-storybook/storybook-static)
pnpm --filter @wegooli/docs-storybook build-storybook
```

Open <http://localhost:6006>. Stories cover `SignIn`, `SignUp`, `UserProfile`, `OrganizationProfile`, and `OrganizationSwitcher`.

## Development

This repository is a [pnpm workspace](https://pnpm.io/workspaces) managed with [Turbo](https://turbo.build) and versioned with [Changesets](https://github.com/changesets/changesets).

```bash
# Install
pnpm install

# Build all SDK packages
pnpm build

# Run tests
pnpm test

# Typecheck
pnpm typecheck

# Watch one package
pnpm --filter @wegooli/identity-react dev
```

### Adding a changeset

When you change a published package, create a changeset before opening your PR:

```bash
pnpm changeset
```

Pick the affected packages, the semver bump (`patch` / `minor` / `major`), and write a short summary. Commit the generated `.changeset/*.md` file alongside your code change.

On merge to `main`, the **Release** workflow opens a "Version Packages" PR. Merging that PR triggers npm publish.

Docs-only, CI-only, or storybook-only changes do not need a changeset — only changes that affect what `npm install` delivers to consumers require one.

## Repository layout

```
.
├── apps/
│   └── docs-storybook/        # @wegooli/docs-storybook — Storybook gallery (private)
├── packages/
│   ├── identity-types/        # @wegooli/identity-types
│   ├── identity-react/        # @wegooli/identity-react
│   └── identity-ui/           # @wegooli/identity-ui
├── .changeset/                # Pending version bumps and config
├── .github/workflows/         # CI + Release pipelines
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Where the backend lives

This repo holds the **SDK only**. The auth backend (BFF, dashboard, infra) is developed in a separate Wegooli repo. SDK consumers do not need access to it — point `bffBaseUrl` at the deployed BFF and you are done.

## License

[MIT](./LICENSE)
