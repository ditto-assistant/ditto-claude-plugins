## Claude host connection

Use the hosted Ditto MCP server at https://api.heyditto.ai/mcp, declared in this plugin's `.mcp.json`. Complete authentication through Claude's connection/sign-in controls. In Claude Code, inspect the plugin-provided server in `/mcp`; in desktop chat or Cowork, use the available connector controls. Availability and UI depend on the actual host.

Discover the connected server's live tools and resources, including `memory://capabilities` when exposed. Use its MCP tools for search, full-content fetch and authorized saves or updates; do not invent tool names or assume every host exposes every capability. If the server is missing or authentication has expired, explain the gap and ask the user to connect or reconnect through Claude. Never request API keys in chat or fall back to shell memory commands.

This package does not install the Ditto CLI, create agent accounts, run lifecycle hooks, inject context on every prompt, or automatically save transcripts. Follow the shared workflow for deliberate recall and authorized private capture. Music-service controls are separate capabilities; the Ditto MCP connection supplies memory context, not music-account access.
