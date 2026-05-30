# ditto-claude-plugins

Ditto's official [Claude Code](https://code.claude.com) plugin marketplace. Give Claude a persistent, personal memory graph — with **agent-native login**, so setup is one command and never silently de-authorizes the way MCP OAuth can.

## Install

```
/plugin marketplace add ditto-assistant/ditto-claude-plugins
/plugin install ditto@ditto-claude-plugins
```

That's the whole setup — **no manual `npm install`**. On first run the plugin auto-installs the [`@heyditto/cli`](https://www.npmjs.com/package/@heyditto/cli) helper it drives into a contained cache dir (`~/.cache/heyditto/cli`, not a global install) and provisions a claimable agent account in the background. (Requires `npm` or `bun` on PATH; set `DITTO_AUTO_INSTALL=0` to opt out.)

## Plugins

| Plugin | What it does |
|---|---|
| [**ditto**](plugins/ditto) | Turns Claude Code into Ditto: automatic memory **recall** on every prompt (`UserPromptSubmit` hook), **write-back** of salient turns (`Stop`/`PreCompact`), and zero-OAuth **agent-native login** on first run (`SessionStart`). Plus `/ditto-recall`, `/ditto-save`, `/ditto-whoami`, `/ditto-claim`, `/ditto-login`. |

## How auth works (and why it's smooth)

On first session, the plugin runs `ditto init --agent` — minting a free, **claimable** agent account. No browser, no OAuth dance, no token that expires mid-session. The `ditto_mcp_…` key is stored locally; you get a **claim URL** to later merge the agent's memories into your own Ditto account (`/ditto-claim`).

Manage, pause, revoke, make read-only, or restrict which threads each agent can read from **Settings → Agents** on https://app.heyditto.ai.

## Repo layout

```
.claude-plugin/marketplace.json   # catalog (this marketplace)
plugins/
  ditto/
    .claude-plugin/plugin.json     # plugin manifest
    hooks/hooks.json               # SessionStart, UserPromptSubmit, Stop, PreCompact
    hooks/ditto-hook.mjs           # the engine (calls the ditto CLI)
    commands/                      # /ditto-recall, /ditto-save, /ditto-whoami, /ditto-claim, /ditto-login
    skills/ditto-memory/SKILL.md   # deliberate-memory decision guide
```

## License

MIT — see [LICENSE](LICENSE).

## Related

- [`@heyditto/cli`](https://www.npmjs.com/package/@heyditto/cli) ([source](https://github.com/ditto-assistant/ditto-cli)) — the memory CLI the plugin drives.
- [`ditto-clawhub`](https://github.com/ditto-assistant/ditto-clawhub) · [`ditto-hermes`](https://github.com/ditto-assistant/ditto-hermes) — sibling skill bundles for OpenClaw and Hermes.
- [`ditto-mcp`](https://github.com/ditto-assistant/ditto-mcp) — stdio MCP bridge (browser-OAuth) for Claude Desktop / Cursor.
