# Handoff in Claude

The bundled `handoff` skill saves a private continuation note through Ditto MCP
and compares its full readback before any chat archival. Invoke `/handoff` where
listed, or ask Claude to use the handoff skill. Select other chats explicitly for
bulk closeout. Each chat needs separate save/readback, archive and cleanup receipts.

Chat/Cowork and Claude Code installations are separate. Refresh this marketplace
and update Ditto in each intended surface. In Chat, verify the installed version,
three Skills including `handoff`, the connected Ditto connector and a new Chat's
`/` menu. In Code, run `claude plugin marketplace update ditto-claude-plugins`,
then `claude plugin update ditto@ditto-claude-plugins --scope user`, and reload the
intended running session or start a new one. Marketplace refresh alone does not
update an installed Code plugin.

Discover the actual host's chat controls. No Claude archive API is provided by
this plugin or by Ditto MCP. Use a supported host archive tool or a clearly
identified fresh UI control if one exists. If it does not, retain the verified
memory and report manual closeout; do not equate exiting Code, deleting a chat
or removing a transcript file with archival.

Chat without authorized local tools cannot measure or clean the Mac. Code/Cowork
local capabilities depend on actual grants. Follow the bundled cleanup reference:
inventory owned paths, verify pushed code/PR state and unique/ignored file recovery,
keep active/shared/pinned work safe, and require exact cleanup authorization.
No hooks, automatic capture, new MCP tools or public tool grants are added.
