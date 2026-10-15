#!/usr/bin/env python3
"""Check the MCP-only Claude release boundary, without connecting an account."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def validate(root):
    root = Path(root)
    plugin = root / "plugins/ditto"
    manifest = json.loads((plugin / ".claude-plugin/plugin.json").read_text())
    catalog = json.loads((root / ".claude-plugin/marketplace.json").read_text())
    forbidden = {"hooks", "commands", "agents", "mcpServers", "userConfig", "settings"}
    if forbidden & manifest.keys():
        raise ValueError("Unexpected runtime component in MCP-only manifest")
    entries = catalog.get("plugins", [])
    if len(entries) != 1 or entries[0].get("name") != "ditto" or entries[0].get("source") != "./plugins/ditto" or forbidden & entries[0].keys():
        raise ValueError("Unexpected marketplace source or runtime override")
    expected = {"mcpServers": {"ditto": {"type": "http", "url": "https://api.heyditto.ai/mcp"}}}
    if json.loads((plugin / ".mcp.json").read_text()) != expected:
        raise ValueError("Expected hosted Ditto MCP without launcher, headers or credentials")
    allowed = {".claude-plugin/plugin.json", ".mcp.json", "README.md", "shared-skills.lock.json"}
    count = 0
    for item in plugin.rglob("*"):
        if item.is_symlink():
            raise ValueError("Linked release input")
        if not item.is_file():
            continue
        count += 1
        relative = item.relative_to(plugin)
        if relative.as_posix() not in allowed and not (relative.parts[0] == "skills" and item.suffix in {".md", ".json", ".yaml", ".yml", ".txt"}):
            raise ValueError(f"Unexpected release file: {relative}")
    for name in ("ditto-memory", "curate-music"):
        if not (plugin / "skills" / name / "SKILL.md").is_file():
            raise ValueError(f"Missing skill: {name}")
    return count


if __name__ == "__main__":
    print(f"MCP-only Claude package verified: {validate(ROOT)} files")
