# Releasing

This repo ships **two** things that update on different tracks. Keep them straight.

## 1. The plugin (this repo)

The hooks, commands, and skill under `plugins/ditto/`. Distributed via the Claude Code
marketplace (`.claude-plugin/marketplace.json`, source `./plugins/ditto`).

**To release a plugin change:**

1. Make the change under `plugins/ditto/`.
2. **Bump `version`** in `plugins/ditto/.claude-plugin/plugin.json` (semver). This is the
   signal Claude Code uses to detect an update — a push without a version bump will not be
   picked up as a new version.
3. Validate locally:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'))"
   node -e "JSON.parse(require('fs').readFileSync('plugins/ditto/.claude-plugin/plugin.json','utf8'))"
   node --check plugins/ditto/hooks/ditto-hook.mjs
   node --check plugins/ditto/hooks/bootstrap.mjs
   ```
4. Commit + push to `main`. The marketplace source has no pinned `ref`, so `main` is the
   release channel.

**How users get it:** `/plugin marketplace update ditto-claude-plugins` + `/reload-plugins`,
or automatically if they enabled auto-update for the marketplace (`/plugin` → Marketplaces;
third-party marketplaces default to auto-update **off**). Clearing `~/.claude/plugins/cache`
forces a clean refresh.

> If we ever want reproducible pinning, switch the marketplace `source` to
> `git-subdir` with an explicit `ref`/`sha` (like the official catalog does) and bump the
> ref per release. Not needed while we track `main`.

## 2. The CLI (`@heyditto/cli`)

Lives in the sibling [`ditto-cli`](https://github.com/ditto-assistant/ditto-cli) repo and
publishes to npm via semantic-release on push to `main` (conventional commits → version).
**This repo does not vendor or version the CLI.**

The plugin installs the CLI into a contained dir (`~/.cache/heyditto/cli`) and
**auto-refreshes it to `@latest`** in the background every `DITTO_REFRESH_DAYS` (default 7).
So a CLI release reaches plugin users automatically within a week — or immediately via
`/ditto-update`. No plugin version bump is required for a CLI-only change.

**Compatibility:** the hook engine gates on `MIN_VERSION` (`ditto-hook.mjs`). If a future CLI
release changes the JSON shape the hooks parse (e.g. `init --json` / `status --output json`
fields), bump `MIN_VERSION` here and release a plugin version alongside the CLI change.
