# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) — per-PR markdown files describing version bumps and release notes.

## Adding a changeset

```bash
pnpm changeset
```

Pick the affected packages, the semver bump (patch / minor / major), and write a short summary. The CLI creates a `.changeset/<random-slug>.md` file — commit it alongside your code change.

## Release flow

1. PR with code change + `.changeset/*.md` → merged to `main`
2. The `changesets/action` workflow opens a **"Version Packages"** PR that bumps `package.json` versions and updates `CHANGELOG.md`
3. Merging that PR triggers `pnpm release` which publishes the bumped packages to npm

## Linked packages

`@wegooli/identity-types`, `@wegooli/identity-react`, `@wegooli/identity-ui` are **linked** — they always share the same major + minor + patch version. A bump in one bumps all three.

> Loosen this to `"fixed": []` and remove the `linked` group if you later want independent versioning.
