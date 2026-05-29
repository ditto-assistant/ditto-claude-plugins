---
description: Recall what Ditto knows about a topic from the user's memory graph.
argument-hint: [topic or question]
allowed-tools: Bash(ditto:*), Bash(heyditto:*)
---

Recall relevant knowledge from the user's Ditto memory graph.

Topic: **$ARGUMENTS**

1. If the topic above is empty, infer the most useful topic from the recent conversation.
2. Run `ditto search "<topic>" --output json` (pass several space-separated queries to broaden recall when useful).
3. For the most relevant hits, pull full text with `ditto fetch <id> --output json`.
4. To go deeper on an entity, use `ditto subjects "<entity>" --output json` then `ditto memories <subject-id> --output json`.
5. Summarize what Ditto knows, citing the memories you used. If nothing relevant is found, say so plainly — don't invent memories.
