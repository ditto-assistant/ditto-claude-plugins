import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("package", ROOT / "scripts/validate_package.py")
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)


class MCPReleaseTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for folder in ("plugins", ".claude-plugin"):
            shutil.copytree(ROOT / folder, self.root / folder)

    def test_release_passes(self):
        self.assertGreater(package.validate(self.root), 0)

    def test_cli_hook_cannot_return_through_default_scan(self):
        hook = self.root / "plugins/ditto/hooks/hooks.json"
        hook.parent.mkdir()
        hook.write_text('{"hooks":{}}')
        with self.assertRaisesRegex(ValueError, "Unexpected release file"):
            package.validate(self.root)

    def test_marketplace_cannot_override_mcp_runtime(self):
        f = self.root / ".claude-plugin/marketplace.json"
        data = json.loads(f.read_text())
        data["plugins"][0]["mcpServers"] = {"ditto": {"command": "npx"}}
        f.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, "runtime override"):
            package.validate(self.root)

    def test_credentials_and_shell_launchers_are_rejected(self):
        f = self.root / "plugins/ditto/.mcp.json"
        original = json.loads(f.read_text())
        for field, value in (("command", "npx"), ("headers", {"Authorization": "Bearer example"})):
            data = json.loads(json.dumps(original))
            data["mcpServers"]["ditto"][field] = value
            f.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, "Expected hosted Ditto MCP"):
                package.validate(self.root)

    def test_other_endpoint_is_rejected(self):
        f = self.root / "plugins/ditto/.mcp.json"
        f.write_text(f.read_text().replace("api.heyditto.ai", "example.com"))
        with self.assertRaisesRegex(ValueError, "Expected hosted Ditto MCP"):
            package.validate(self.root)


if __name__ == "__main__":
    unittest.main()
