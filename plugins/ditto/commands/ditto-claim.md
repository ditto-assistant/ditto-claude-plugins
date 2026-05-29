---
description: Get the claim URL so the user can own this Claude agent's Ditto memories.
allowed-tools: Bash(ditto:*), Bash(heyditto:*)
---

Help the user **claim** (take ownership of) the Ditto agent account running on this machine, so its memories merge into their own Ditto account with provenance preserved.

1. Run `ditto status --output json`. If no key is set, provision one first: `ditto init --agent --agent-caller "Claude Code" --json` and capture the `claimURL` it prints.
2. If a key is already set, find the claim URL: run `ditto agent --help` to discover the right subcommand (e.g. an `agent whoami`/claim-url command) and print the claim URL.
3. Give the user the claim URL and tell them: open it while signed in to https://app.heyditto.ai to merge this agent's memories into their account. Do **not** share the raw `ditto_mcp_...` API key — only the claim URL (its one-time token lives in the `?t=...` query string).
