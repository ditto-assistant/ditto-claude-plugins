---
name: ditto-memory
description: Save, search, fetch, and traverse the user's Ditto memory graph from Claude Code. Use whenever the user says "remember", "save this", "note that", "recall", "what did I", "from my notes", or asks something best answered from their own prior context rather than general knowledge.
---

# Ditto Memory

Ditto is the user's personal long-term memory and knowledge graph (https://heyditto.ai). This skill teaches you to read and write it through the `ditto` CLI (the `@heyditto/cli` binary; `heyditto` is an alias). The `ditto` plugin also recalls relevant memories automatically on each prompt and writes salient turns back — this skill is for when you want to drive memory **deliberately**.

## When to use

- The user says "remember…", "save this", "note that…", "for later".
- The user says "what did I…", "recall…", "have I told you…", "from my notes".
- A question is best answered from the user's prior context (preferences, decisions, people, projects) rather than general knowledge.
- The user references a topic/person/project not in this conversation but likely in their memory.

## Auth — check first

Run `ditto status --output json`. It reports `apiKey.present` and `source` (`env` | `config` | `none`).

- **Missing key** → agent-native login (no browser/OAuth): `ditto init --agent --agent-caller "Claude Code" --json`. This mints a free, claimable agent account, stores the key at `~/.config/heyditto/cli/config.json`, and prints a `claimURL`. Share the **claimURL** (not the API key) so the user can later own the agent. Do not ask for email/OTP/dashboard setup first.
- **User has a key** → `ditto login <key>`.
- **Binary missing** → the plugin auto-installs it on `SessionStart` into `~/.cache/heyditto/cli` (no global install needed). If you must do it by hand: `npm install -g @heyditto/cli` (macOS ships an unrelated `/usr/bin/ditto`; if the wrong tool runs, use `heyditto`).

A read-only agent account can search/fetch but not save; write calls will be rejected — tell the user to grant write access from **Settings → Agents** on heyditto.ai.

## Core loop: search → fetch → save

Memories are **pairs** (`pair_id`); public shares use a `share_id`; **subjects** are graph nodes (`subject_id`). Always pass `--output json` when you will parse output.

- `ditto search <query>... [--include-public] [--filter-username <u>]` — semantic search; multiple positional args = multiple queries (broadens recall). Returns lightweight previews + ids.
- `ditto fetch <id>... [--memory-format full|outline|blocks]` — full content for pair/share ids. Use `outline` to get block ids before a structured update.
- `ditto save <content> [--source <s>] [--source-context <c>]` — persist a memory. Use `--source claude-code` and `--source-context "<repo/project>"`. Save proactively for durable preferences, decisions, relationships, and facts.
- `ditto subjects <query> [--top-k <n>]` → `ditto memories <subject-id>... [--query <q>]` — the cheaper way to traverse a known topic.
- `ditto network <pair-id> [--limit <n>]` — related memories via shared subjects.
- `ditto update <id> [--content <t>|--content-file <p>|--edits-json <j>]` — edit in place; prefer full-content replacement unless you have the current revision + outline block ids.
- `ditto publish <id> --title "…"` / `ditto unpublish` — **only** after the user explicitly asks; publish runs a privacy scan that blocks secrets by default.

## Rules

- `ditto status` prints the live tool list straight from the server — trust it over this file if anything drifts.
- Don't fabricate memories. If search returns nothing relevant, say so.
- Don't publish or share the raw API key. Share only the `claimURL`.

## Source + support

- CLI on npm: https://www.npmjs.com/package/@heyditto/cli
- CLI repo: https://github.com/ditto-assistant/ditto-cli
- Plugin repo: https://github.com/ditto-assistant/ditto-claude-plugins
- Support: support@heyditto.ai
