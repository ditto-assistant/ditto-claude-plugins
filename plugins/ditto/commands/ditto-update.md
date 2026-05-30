---
description: Update the Ditto CLI to the latest version (and check for plugin updates).
allowed-tools: Bash(ditto:*), Bash(heyditto:*), Bash(npm:*), Bash(node:*)
---

Update the `@heyditto/cli` that this plugin drives, then report versions.

1. Note the current version: `ditto --version` (or `heyditto --version`).
2. Update to latest:
   - **Contained install (default)** — the plugin keeps the CLI under `~/.cache/heyditto/cli` (or `$DITTO_CLI_HOME`). Run:
     ```bash
     npm install --prefix "${DITTO_CLI_HOME:-$HOME/.cache/heyditto/cli}" --no-fund --no-audit @heyditto/cli@latest
     ```
     then verify: `"${DITTO_CLI_HOME:-$HOME/.cache/heyditto/cli}/node_modules/.bin/ditto" --version`.
   - **Global install** — if `ditto`/`heyditto` resolves from a global npm prefix instead, run `npm install -g @heyditto/cli@latest`.
3. Confirm the new version and that `ditto status` still reports the key.

> The plugin also auto-refreshes the contained CLI in the background roughly every 7 days (`DITTO_REFRESH_DAYS`), so this is only needed when you want the newest version immediately.

**Updating the plugin itself** (hooks/commands/skill) is separate — that's Claude Code's job, not the CLI's. Tell the user to run `/plugin marketplace update ditto-claude-plugins` then `/reload-plugins` (or enable auto-update for the marketplace in `/plugin` → Marketplaces).
