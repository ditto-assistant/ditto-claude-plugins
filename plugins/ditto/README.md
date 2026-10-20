# Ditto for Claude

Connect Claude to your Ditto memory through the hosted MCP server at
https://api.heyditto.ai/mcp. Sign in through Claude's connection controls; never
paste API keys into chat. The package includes no CLI helper or lifecycle hooks.

In Claude desktop, select Chat and Cowork, then open Customize → Plugins → Add →
Add marketplace → Add from a repository. Select
`ditto-assistant/ditto-claude-plugins`, Sync, and add Ditto. Verify the plugin is
enabled and its Ditto connector is Connected. Chat/Cowork and Code have separate
plugin installations.

In Claude Code, install from the official Ditto marketplace:

```text
/plugin marketplace add ditto-assistant/ditto-claude-plugins
/plugin install ditto@ditto-claude-plugins
```

Use `/ditto-memory` to search memories, fetch supporting content, and save or
update useful information when authorized. Live MCP schemas determine available
tools and permissions. If the connection is unavailable, reconnect in the host
rather than substituting shell commands or creating a new agent account.

Use `/curate-music` to curate a playlist for your preferred music service from
verified Ditto context and an accessible saved music library. Service connectors
come first, browser/computer controls next, and web search last for recordings,
official links and an ordered plan. Saving playlists or changing playback requires
separate music capabilities; confirm the actual result before claiming success.

Try: "Curate a playlist on my preferred music service using my Ditto memories for
a relaxed evening, with a few discoveries."

Use `/handoff` for verified private
continuation notes and supported host archival, including explicitly selected
bulk closeout. Disk assessment requires local tools; cleanup requires exact
authority and verified code/file recovery. A memory summary is not a file backup.
If this host cannot archive, the skill saves the handoff and explains the manual
closeout step. Exiting Claude Code is not an archive operation.

The plugin respects your current instructions, private capture preferences,
source authorship and actual tool grants. The plugin does not automatically save
transcripts or inject context at every prompt. Native chat listing/sending and
music-account access are not supplied by this package. UI support depends on the
actual host. Installation alone does not prove authenticated tool execution.

Upgrading from 0.2.x removes the old plugin's CLI hooks and commands. Previously
installed CLI software, credentials, agent accounts and saved memories remain;
manage those separately if no longer needed. Reload or restart running sessions
to pick up the new plugin components.

Support: support@heyditto.ai. [Privacy](https://heyditto.ai/privacy) ·
[Terms](https://heyditto.ai/terms). Music skill adapted from Omar Barazanji's
[heyditto-stack PR #115](https://github.com/ditto-assistant/heyditto-stack/pull/115).
