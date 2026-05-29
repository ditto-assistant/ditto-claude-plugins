---
description: Save a fact, decision, or preference to the user's Ditto memory.
argument-hint: [what to remember]
allowed-tools: Bash(ditto:*), Bash(heyditto:*)
---

Save knowledge to the user's Ditto memory graph so it persists across sessions and surfaces.

To remember: **$ARGUMENTS**

1. If the text above is empty, distill the single most important durable fact, decision, or preference from the current conversation into one or two clear sentences.
2. Save it: `ditto save "<content>" --source claude-code --source-context "<repo or project>" --output json`.
3. Confirm with the returned memory id. If the account is read-only the save will be rejected — if so, tell the user their Ditto agent is read-only and they can grant write access from Settings → Agents.
