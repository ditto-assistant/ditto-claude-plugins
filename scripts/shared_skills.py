#!/usr/bin/env python3
"""Build public-safe skill text; verify vendored releases without private access."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

SOURCE_REPOSITORY = "https://github.com/ditto-assistant/ditto-skills"
CORE = "skills/ditto-memory/SKILL.md"
ADAPTER = "adapters/ditto-memory.md"
OUTPUT = "plugins/ditto/skills/ditto-memory/SKILL.md"
LOCK = "plugins/ditto/shared-skills.lock.json"
GENERATOR = "scripts/shared_skills.py"
MARKER = b"\n<!-- ditto-shared-core:end -->\n\n"
MANIFESTS = {"openai": "plugins/ditto/plugin.json", "claude": "plugins/ditto/.claude-plugin/plugin.json"}


def digest(value):
    return hashlib.sha256(value).hexdigest()


def file_at(root, relative):
    root = Path(root).resolve()
    value = root / relative
    if Path(relative).is_absolute() or not value.resolve().is_relative_to(root):
        raise ValueError("Path escapes repository")
    for item in [value, *value.parents]:
        if item == root:
            break
        if item.is_symlink():
            raise ValueError("Symlinks are not release inputs or outputs")
    return value


def public_text(value):
    text = value.decode("utf-8")
    if re.search(r"/Users/|/home/|github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+|ditto_mcp_[A-Za-z0-9]{8,}", text):
        raise ValueError("Private host path or credential in release text")
    if b"\r" in value or not value.endswith(b"\n") or MARKER in value:
        raise ValueError("Expected canonical LF text with one trailing newline and no generated marker")
    return value


def source_identity(source):
    status = subprocess.check_output(["git", "-C", str(source), "status", "--porcelain", "--untracked-files=all"], text=True)
    if status:
        raise ValueError("Commit canonical source before generating a release")
    return subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()


def catalog_names(source, catalog="memory"):
    """Select an explicit surface; old source snapshots retain their catalog."""
    config = file_at(source, "scripts/catalogs.json")
    if not config.exists() and catalog == "memory":
        return None
    catalogs = json.loads(config.read_text())
    names = catalogs.get(catalog) if isinstance(catalogs, dict) else None
    if not isinstance(names, list) or not names or any(not isinstance(name, str) for name in names) or len(set(names)) != len(names):
        raise ValueError("Unknown or invalid skill catalog")
    for name in names:
        if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
            raise ValueError("Invalid catalog skill name")
        if not file_at(source, f"skills/{name}/SKILL.md").is_file():
            raise ValueError("Catalog skill is missing")
    return set(names)


def additional_files(source):
    """New public-text skills/references are discovered without new host forks."""
    result = {}
    skill_root = file_at(source, "skills")
    selected = catalog_names(source)
    for item in sorted(skill_root.rglob("*")):
        if item.is_symlink():
            raise ValueError("Symlink in canonical skills")
        if not item.is_file() or item == file_at(source, CORE):
            continue
        relative = item.relative_to(Path(source).resolve())
        if selected is not None and relative.parts[1] not in selected:
            continue
        if len(relative.parts) < 3 or not re.fullmatch(r"[a-z0-9-]+", relative.parts[1]):
            raise ValueError("Unexpected skill layout")
        if item.suffix not in {".md", ".json", ".yaml", ".yml", ".txt"}:
            raise ValueError("Common distribution supports public text; executables/assets need an explicit adapter review")
        content = public_text(item.read_bytes())
        if item.name == "SKILL.md" and not re.match(rb"\A---\nname: " + relative.parts[1].encode() + rb"\ndescription: [^\n]+\n---\n", content):
            raise ValueError("Invalid additional skill frontmatter")
        result["plugins/ditto/" + relative.as_posix()] = content
    for relative in result:
        name = Path(relative).parts[3]
        if not file_at(source, f"skills/{name}/SKILL.md").is_file():
            raise ValueError("References require a skill entrypoint")
    return result


def build(source, repo, host, bump_version=False):
    sha = source_identity(source)
    core = public_text(file_at(source, CORE).read_bytes())
    adapter = public_text(file_at(repo, ADAPTER).read_bytes())
    generator = file_at(source, GENERATOR).read_bytes()
    extra = additional_files(source)
    extra_hashes = {relative: digest(value) for relative, value in extra.items()}
    if not re.match(rb"\A---\nname: ditto-memory\ndescription: [^\n]+\n---\n", core):
        raise ValueError("Invalid canonical skill frontmatter")
    skill = core + MARKER + adapter
    lock_file = file_at(repo, LOCK)
    if lock_file.exists():
        old = json.loads(lock_file.read_text())
        # Do not churn release versions just because unrelated source docs moved.
        if old.get("core_sha256") == digest(core) and old.get("adapter_sha256") == digest(adapter) and old.get("generator_sha256") == digest(generator) and old.get("files_sha256", {}) == extra_hashes:
            verify(repo, host)
            return False
    manifest_file = file_at(repo, MANIFESTS[host])
    manifest = json.loads(manifest_file.read_text())
    output_file = file_at(repo, OUTPUT)
    if bump_version and (not output_file.exists() or output_file.read_bytes() != skill or (lock_file.exists() and old.get("files_sha256", {}) != extra_hashes)):
        match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", manifest["version"])
        if not match:
            raise ValueError("Automatic patch bump requires a stable three-part version")
        manifest["version"] = f"{match[1]}.{match[2]}.{int(match[3]) + 1}"
        manifest_file.write_text(json.dumps(manifest, indent=2) + "\n")
    lock = {
        "schema_version": 1, "source_repository": SOURCE_REPOSITORY,
        "source_commit": sha, "host": host,
        "core_sha256": digest(core), "adapter_sha256": digest(adapter),
        "generator_sha256": digest(generator), "skill_sha256": digest(skill),
        "files_sha256": extra_hashes,
    }
    for relative in (old.get("files_sha256", {}) if lock_file.exists() else {}):
        if relative not in extra:
            if not relative.startswith("plugins/ditto/skills/") or ".." in Path(relative).parts or relative == OUTPUT:
                raise ValueError("Invalid previously generated path")
            file_at(repo, relative).unlink(missing_ok=True)
    for relative, content in [(OUTPUT, skill), (GENERATOR, generator), *extra.items(), (LOCK, (json.dumps(lock, indent=2) + "\n").encode())]:
        dest = file_at(repo, relative)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
    verify(repo, host, source)
    return True


def verify(repo, host, source=None):
    lock = json.loads(file_at(repo, LOCK).read_text())
    if lock.get("schema_version") != 1 or lock.get("source_repository") != SOURCE_REPOSITORY or lock.get("host") != host:
        raise ValueError("Unexpected source or host provenance")
    if not re.fullmatch(r"[0-9a-f]{40}", lock.get("source_commit", "")):
        raise ValueError("Source must be an immutable Git commit")
    skill = file_at(repo, OUTPUT).read_bytes()
    if skill.count(MARKER) != 1:
        raise ValueError("Missing or repeated shared-core boundary")
    core, adapter = skill.split(MARKER)
    public_text(core)
    public_text(adapter)
    if adapter != file_at(repo, ADAPTER).read_bytes():
        raise ValueError("Generated host adapter drift")
    actual = {"core_sha256": digest(core), "adapter_sha256": digest(adapter),
              "generator_sha256": digest(file_at(repo, GENERATOR).read_bytes()), "skill_sha256": digest(skill)}
    if any(lock.get(key) != value for key, value in actual.items()):
        raise ValueError("Generated skill or generator differs from recorded hashes")
    extra_hashes = lock.get("files_sha256", {})
    for relative, expected in extra_hashes.items():
        if not relative.startswith("plugins/ditto/skills/") or ".." in Path(relative).parts or relative == OUTPUT or digest(file_at(repo, relative).read_bytes()) != expected:
            raise ValueError("Additional generated skill drift")
    installed = file_at(repo, "plugins/ditto/skills")
    for item in installed.rglob("*"):
        if item.is_symlink() or (item.is_file() and item.relative_to(Path(repo).resolve()).as_posix() not in {OUTPUT, *extra_hashes}):
            raise ValueError("Untracked generated skill file or symlink")
    if source is not None:
        if source_identity(source) != lock["source_commit"] or file_at(source, CORE).read_bytes() != core or file_at(source, GENERATOR).read_bytes() != file_at(repo, GENERATOR).read_bytes() or {p: digest(v) for p, v in additional_files(source).items()} != extra_hashes:
            raise ValueError("Release does not match canonical source")
    return lock


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["build", "verify"])
    parser.add_argument("--host", choices=MANIFESTS, required=True)
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--source", type=Path)
    parser.add_argument("--bump-version", action="store_true")
    args = parser.parse_args()
    if args.command == "build":
        if args.source is None:
            parser.error("build requires --source")
        changed = build(args.source, args.repo, args.host, args.bump_version)
        print(f"{args.host}: generated={changed}; shared skills verified")
    else:
        lock = verify(args.repo, args.host, args.source)
        count = 1 + sum(p.endswith('/SKILL.md') for p in lock.get('files_sha256', {}))
        print(f"{args.host}: {count} skill(s) verified; source={lock['source_commit']}")


if __name__ == "__main__":
    main()
