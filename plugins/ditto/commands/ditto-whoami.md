---
description: Show the current Ditto connection — key source, agent identity, live tools.
allowed-tools: Bash(ditto:*), Bash(heyditto:*)
---

Report the current Ditto memory connection for this machine.

1. Run `ditto status --output json` and report: whether an API key is set, its source (`env` | `config` | `none`), the endpoint, and the live tool list.
2. If a key is set, discover agent identity: run `ditto agent --help` to find the right subcommand, then surface the agent's caller name and whether it is claimed/owned by a human and whether it is read-only.
3. If no key is set, tell the user they can connect instantly with `/ditto-login` (agent-native, no OAuth).
