# Ditto Claude plugins

Ditto's official Claude plugin marketplace. The Ditto plugin connects to the hosted
Ditto MCP server at https://api.heyditto.ai/mcp for memory search, supporting context,
and authorized private saves or updates. Sign in through Claude's connection flow.

## Install

For **Claude Chat or Cowork**, select **Chat and Cowork** in Claude desktop first.
Open Customize → Plugins → Add → Add marketplace → Add from a repository, select
`ditto-assistant/ditto-claude-plugins`, and Sync. Add Ditto from that marketplace.
Under Yours, verify Ditto is enabled, Skills lists `curate-music` and `ditto-memory`,
and Connectors shows Ditto Connected. In a new Chat, type `/` and verify both skills
appear under Ditto before sending your request.

Claude Code has a separate plugin installation. A plugin visible in Code does not
by itself mean it is installed in Chat. For **Claude Code**:

```text
/plugin marketplace add ditto-assistant/ditto-claude-plugins
/plugin install ditto@ditto-claude-plugins
```

Complete Ditto sign-in using the host's MCP connection controls. In Claude Code,
inspect the plugin-provided Ditto server in `/mcp`. Tool availability and UI differ
by host; a plugin installation alone does not prove an authenticated connection.
No npm helper, API-key entry in chat, or agent account is required by this package.

The bundled skills are the verified Claude loading path. The hosted MCP server also
offers the canonical skill files through `skills/list`, `skills/get` and
`resources/read` for compatible importers. A successful MCP resource read does not
prove Claude automatically activates connector-provided skills; keep the bundle
installed. See the [host compatibility check](docs/host-compatibility.md).

## Shared skills

- `/ditto-memory`: recall evidence from saved memories and save or update useful
  information within the user's authorized private memory workflow.
- `/curate-music`: curate an ordered selection for the user's chosen music service
  using verified Ditto context and an accessible saved library. Prefer service
  connectors, then browser/computer controls, with web search last for recordings,
  official service links and a playlist plan. Creation and playback require separate
  music capabilities and verification; Ditto MCP does not provide music APIs.

The plugin uses MCP for memory access. It has no CLI bootstrap, shell commands,
lifecycle hooks, automatic prompt injection or transcript write-back. Update from
0.2.x to remove the former plugin components; this update does not delete existing
CLI installations, credentials, agent accounts or memories. Manage those separately
if you previously used them. A running session may need a reload or restart.

## Update and validate

Refresh the marketplace and update Ditto in Claude's plugin controls. In Claude Code:

```text
/plugin marketplace update ditto-claude-plugins
/reload-plugins
```

Maintainers: see [RELEASING.md](RELEASING.md) and [shared skills](docs/shared-skills.md).
Run `python3 scripts/shared_skills.py verify --host claude --repo .`,
`python3 -m unittest discover -s tests -v`, `python3 scripts/validate_package.py`,
and `claude plugin validate ./plugins/ditto`.

```text
.claude-plugin/marketplace.json       # marketplace catalog
plugins/ditto/.claude-plugin/plugin.json
plugins/ditto/.mcp.json               # remote Ditto MCP, host-managed OAuth
plugins/ditto/skills/                # generated shared skills
adapters/ditto-memory.md             # Claude connection guidance
```

Source, package validation, installed plugin, authenticated MCP and actual tool
execution are separate verification steps. Nothing is submitted to a store by
this repository's validation or distribution pipeline.

Support: support@heyditto.ai · [Privacy](https://heyditto.ai/privacy) ·
[Terms](https://heyditto.ai/terms). MIT — see [LICENSE](LICENSE).
