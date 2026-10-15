# Releasing

The release contains hosted MCP connection metadata and shared skills. It does
not distribute or refresh a CLI, run hooks or provision agent accounts.

1. Change host metadata, `.mcp.json` or the Claude adapter here. Change common skills
   in `ditto-assistant/ditto-skills`; regenerate using its clean committed source.
2. Bump `plugins/ditto/.claude-plugin/plugin.json` for a host change. The shared-skill
   generator automatically patch-bumps changed skill content; avoid a second bump.
3. Run the offline verifier, `python3 -m unittest discover -s tests -v`,
   `python3 scripts/validate_package.py`, and `claude plugin validate ./plugins/ditto`.
4. Open a PR and inspect current-head CI and Ditto Review. Merge only when authorized.
   The marketplace tracks main, so merging updates the available plugin package.
5. Refresh the marketplace and update Ditto in the actual host. Verify the installed
   version, two skills and Ditto MCP connector. Authenticate through the host flow
   and verify tools separately before claiming live memory behavior.

Claude Code users can run `/plugin marketplace update ditto-claude-plugins` then
`/reload-plugins`. Desktop users use Customize → Plugins. Running sessions may
need a restart. Do not clear global plugin caches or delete unrelated credentials.

The 0.3.0 migration replaces the former 0.2.x CLI implementation. Old CLI commands
and lifecycle hooks are absent from the new bundle. It does not remove prior local
CLI installations, credentials, agent accounts or saved memories. Host-managed
OAuth replaces plugin-managed CLI keys; authentication may need reconnecting.

Merging or installing a package is not a store submission. Directory submission,
reviewer access, demos and functional host tests are separate release gates.
