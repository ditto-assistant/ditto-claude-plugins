# Shared skill releases

The common memory workflow comes from the private `ditto-assistant/ditto-skills` source repo. Edit common behavior there. Edit this repository's `adapters/ditto-memory.md` for host-specific guidance; authentication, hooks, commands and server configuration remain owned here.

The generated SKILL.md, offline verifier and shared-skills.lock.json are materialized files, not symlinks. The lock records the immutable source revision and content hashes. Run `python3 scripts/shared_skills.py verify --host claude --repo .` without private repo access. A maintainer with a clean source clone can run its generator with `build --source <clone> --repo . --host claude --bump-version`.

Source main changes open distribution PRs through the source workflow. They do not merge, submit to a store or change hosted MCP behavior. A patch version is raised when skill text changes. Each source SHA has one proposal per host; a rejected/edited proposal requires maintainer attention rather than an automatic overwrite.

Offline hashes detect drift, not publisher identity. Verify the source commit and review host behavior before merging a generated PR. Directory approval and installed-host behavior remain separate from these checks.
