---
description: Connect Ditto memory — agent-native login (no OAuth) or paste an existing key.
argument-hint: [ditto_mcp_... key, optional]
allowed-tools: Bash(ditto:*), Bash(heyditto:*)
---

Connect the Ditto CLI so memory recall and save work in this session.

Key argument (optional): **$ARGUMENTS**

1. Run `ditto status --output json` first. If a key is already set, report it and stop.
2. If the user supplied a key above, save it: `ditto login "$ARGUMENTS"` then confirm with `ditto status`.
3. Otherwise use **agent-native login** (the smooth path — no browser, no OAuth that expires): `ditto init --agent --agent-caller "Claude Code" --json`. This mints a free, claimable agent account, stores the key locally, and returns a `claimURL`. Tell the user they can later run `/ditto-claim` to own this agent's memories.
4. If the `ditto` binary is missing, instruct: `npm install -g @heyditto/cli` (macOS note: Apple ships `/usr/bin/ditto`; if the wrong tool runs, invoke `heyditto` instead).
