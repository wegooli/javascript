# Contributing

Thanks for your interest in improving the Wegooli Identity SDK.

## Prerequisites

- Node.js ≥ 22 (`.nvmrc` provided)
- pnpm 10+ (`corepack enable && corepack use pnpm@10.33.0`)

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Working on a package

```bash
# Watch mode for a single package
pnpm --filter @wegooli/identity-react dev

# Run that package's tests only
pnpm --filter @wegooli/identity-ui test
```

## Submitting a PR

1. Create a topic branch from `main`.
2. Make your changes and add tests.
3. **Add a changeset:**
   ```bash
   pnpm changeset
   ```
   Pick the affected packages, the semver bump (`patch` / `minor` / `major`), and write a short summary that will appear in the changelog.
4. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` locally.
5. Open the PR. CI must pass before merge.

### When to skip a changeset

If your change touches only docs, tests, build config, or workflows — i.e. it does not affect what `npm install` delivers to consumers — you can skip the changeset.

## Release flow

1. PR with code + changeset → merged to `main`
2. The release workflow opens a **"Version Packages"** PR that bumps versions and updates `CHANGELOG.md`
3. Merging that PR triggers npm publish

## Reporting issues

[Open an issue](https://github.com/wegooli/javascript/issues) with:
- Package and version (`@wegooli/identity-react@x.y.z`)
- Reproduction steps
- Expected vs actual behavior

## Code of Conduct

Be respectful. Be constructive. Assume good intent.
