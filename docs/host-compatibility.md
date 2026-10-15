# Claude host compatibility

## Live check: October 15, 2026

Ditto 0.3.0 was enabled in Claude Code, but the separate Chat/Cowork plugin list
was empty. Adding the same official repository marketplace in Chat/Cowork and
installing Ditto resolved the setup gap without changing the package or permissions.
The Chat plugin showed two bundled skills and one Connected Ditto connector.
Both `curate-music` and `ditto-memory` appeared under Ditto in a new Chat's `/` menu.
No message, memory write, playlist creation or playback was performed in this check;
task execution remains a separate user acceptance test.

An authenticated production HTTP probe against `https://api.heyditto.ai/mcp`
negotiated both `2025-06-18` and `2025-11-25`. Each profile advertised the Skills
extension, listed two skills, returned matching list/get manifests, and delivered
all three files with the declared byte lengths and SHA-256 digests. The bytes
matched the canonical export from source commit
`cf27d1fda5ca1ba9e54c4f5fe65630f4da3a2e05`. Tool listing returned 24 tools,
prompt listing returned four prompts, and an unknown/traversing skill URI was
rejected. The served backend build was
`c1d776753c97d6ffcea302d5f43e24d0df2e9822`.

This probe used a separate authenticated client, not Claude's native skill importer.
It proves live MCP delivery, not automatic skill activation from a bare connector.
The Chat composer proves bundled skill registration, not successful task execution.
Keep bundled skills until native loading is observed in the intended host. The
initialization-era compatibility profiles also do not establish complete MCP
2026-07-28 `server/discover` support. Nothing was submitted to a store.

## Repeat the host check

1. Select Chat and Cowork and inspect Customize → Plugins → Yours. Install Ditto
   there even when it is already installed in Claude Code.
2. Verify the installed version, enabled switch, both Skills and the Connected
   connector at exactly `https://api.heyditto.ai/mcp`.
3. Open a new Chat and type `/`. Confirm `curate-music` and `ditto-memory` under Ditto.
4. Run an explicitly requested task. For memory recall, verify Claude calls Ditto
   and grounds the response in returned evidence. For music, verify the chosen
   service and distinguish recommendations from an actually saved playlist.
5. Record failures separately for connection, skill registration, tool execution
   and output quality. Do not diagnose a missing Chat install by changing backend
   auth, adding CLI helpers, or broadening tool permissions.

Run the package validation commands in the README independently. Offline hash
checks establish bundle consistency; they do not establish authentication or host
execution.
