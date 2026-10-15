# ditto (Claude Code plugin)

**Turns Claude Code into Ditto.** Claude gains a persistent, personal memory graph — it recalls relevant context automatically before each response and remembers salient turns afterward — backed by [Ditto](https://heyditto.ai). Setup is one command thanks to **agent-native login** (no OAuth that silently expires).

## What it does

| Hook | Behavior |
|---|---|
| **SessionStart** | Ensures the CLI is present (auto-installs it on first run if missing — see below) and a Ditto agent account exists. If none, it provisions a free **claimable agent account** (`ditto init --agent`) — no browser, no OAuth — and surfaces a claim URL so you can later own its memories. |
| **UserPromptSubmit** | Semantically searches your prompt against your Ditto graph and injects the most relevant memories as context. This is the "recall" that makes Claude feel like it remembers you. |
| **Stop / PreCompact** | Writes the latest exchange back to your memory graph (`--source claude-code`), so what you do in Claude Code is remembered everywhere Ditto is. Skipped on read-only agents. |

Plus slash commands: `/ditto-recall`, `/ditto-save`, `/ditto-whoami`, `/ditto-claim`, `/ditto-login`, `/ditto-update`, and a `ditto-memory` skill for deliberate memory work.

## Setup — one step

```
/plugin marketplace add ditto-assistant/ditto-claude-plugins
/plugin install ditto@ditto-claude-plugins
```

That's it. There is **no manual `npm install`**. The plugin drives the [`@heyditto/cli`](https://www.npmjs.com/package/@heyditto/cli) binary; on your first session, if it isn't already available, the `SessionStart` hook auto-installs it **into a contained cache dir** (`~/.cache/heyditto/cli` — *not* a global `-g` install, so no sudo and no PATH pollution) in the background and then provisions a claimable agent account. Recall and save activate automatically within a few seconds.

To own the agent's memories, run `/ditto-claim` and open the URL while signed in to https://app.heyditto.ai. To use an existing key instead: `/ditto-login <ditto_mcp_…>`.

> The plugin needs Node's `npm` (or `bun`) available for the auto-install. It also reuses any usable global `ditto`/`heyditto` (≥ 1.3.0) already on your PATH instead of installing its own. macOS note: Apple ships an unrelated `/usr/bin/ditto`; the plugin's version gate ignores it.

The hooks **fail open**: if the CLI can't be installed (offline, no npm) nothing breaks — the session proceeds normally and Claude is told it can offer to set things up.

## Updating

There are two independent things to keep current:

- **The CLI** (`@heyditto/cli`, the memory engine). The contained install **auto-refreshes to `@latest` in the background** roughly every 7 days (tune with `DITTO_REFRESH_DAYS`, `0` = every session). Want the newest version right now? Run `/ditto-update`.
- **The plugin** (these hooks/commands/skill). That's handled by Claude Code, not the CLI. Refresh the marketplace and reload:
  ```
  /plugin marketplace update ditto-claude-plugins
  /reload-plugins
  ```
  Or enable auto-update once via `/plugin` → **Marketplaces** → *Enable auto-update* (third-party marketplaces ship with it off by default), and new plugin versions land at startup.

## Configuration (env vars, all optional)

| Var | Default | Effect |
|---|---|---|
| `DITTO_AGENT_CALLER` | `Claude Code` | Agent name, set once at init; labels saved memories in your graph. |
| `DITTO_RECALL_LIMIT` | `5` | Max memories injected per prompt (1–15). |
| `DITTO_AUTOSAVE` | on | Set to `0` to disable write-back on Stop/PreCompact (recall still works). |
| `DITTO_MIN_PROMPT_LEN` | `8` | Minimum prompt length to trigger recall. |
| `DITTO_AUTO_INSTALL` | on | Set to `0` to disable the background CLI auto-install (falls back to a "run `npm i -g`" nudge). |
| `DITTO_REFRESH_DAYS` | `7` | How often to background-refresh the contained CLI to `@latest`. `0` = every session. |
| `DITTO_CLI_HOME` | `~/.cache/heyditto/cli` | Where the contained CLI install lives. |
| `DITTO_BIN` | — | Explicit path to a `ditto`/`heyditto` binary (skips discovery/auto-install). |

## Privacy & control

- **Read-only agents.** Provision a recall-only agent (can search/fetch, can't write) — manage this from **Settings → Agents** on heyditto.ai.
- **Per-thread read scoping.** Restrict which of your Ditto threads an agent may read, so a coding agent can't see unrelated personal memory.
- **Revoke anytime.** Pause or revoke this agent from **Settings → Agents**; revocation cascades to its API key immediately.

## Related

- [`ditto-cli`](https://github.com/ditto-assistant/ditto-cli) — the `@heyditto/cli` source.
- [`ditto-clawhub`](https://github.com/ditto-assistant/ditto-clawhub) / [`ditto-hermes`](https://github.com/ditto-assistant/ditto-hermes) — sibling skill bundles for OpenClaw and Hermes.
- [`ditto-mcp`](https://github.com/ditto-assistant/ditto-mcp) — stdio MCP bridge with browser-OAuth for Claude Desktop / Cursor.

## Music curation

The bundled `curate-music` skill uses verified Ditto memories and, when
authorized access is available, your existing playlists on the chosen music service to curate
an original, ordered selection. Try: "Curate a music playlist using my
Ditto memories for a relaxed evening, with a few discoveries."

Creating or saving a playlist and controlling playback require a separately
available music connector or supported computer/browser controls. If the host
lacks those controls, the skill returns the ordered track selections and explains
the limitation. It prefers a service connector, uses browser/computer controls
next, and uses web search last for recording discovery, service links and a
playlist plan. It honors your chosen service rather than switching providers. The plugin does not add a Ditto music API or a music-account
connection. Queue replacement and playback changes follow your explicit request.

Adapted from Omar Barazanji's original music-curation skill in heyditto-stack PR #115.
