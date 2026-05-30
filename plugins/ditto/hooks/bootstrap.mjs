#!/usr/bin/env node
// bootstrap.mjs — runs DETACHED from the SessionStart hook to provision Ditto
// without any user action:
//   1. install @heyditto/cli into a contained cache dir (no global `-g`)
//   2. if there's no key yet, run agent-native login (`init --agent`)
//
// It is intentionally silent and best-effort: any failure just leaves the
// plugin in its "CLI unavailable" state, which the hooks handle by no-op.

import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

const AGENT_CALLER = (process.env.DITTO_AGENT_CALLER || "Claude Code").slice(0, 80)

function cliHome() {
  if (process.env.DITTO_CLI_HOME) return process.env.DITTO_CLI_HOME
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
  return path.join(base, "heyditto", "cli")
}
function managedBinPath() {
  const ext = process.platform === "win32" ? ".cmd" : ""
  return path.join(cliHome(), "node_modules", ".bin", "ditto" + ext)
}
function have(cmd) {
  try {
    execFileSync(cmd, ["--version"], { timeout: 8000, stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

const HOME = cliHome()
const LOCK = path.join(HOME, ".installing")

try {
  // Install into HOME/node_modules. Prefer npm (most universally present),
  // fall back to bun. Neither runs as a global install.
  let installed = false
  if (have("npm")) {
    const r = spawnSync(
      "npm",
      ["install", "--prefix", HOME, "--no-fund", "--no-audit", "--silent", "@heyditto/cli@latest"],
      { timeout: 180000, stdio: "ignore" }
    )
    installed = r.status === 0
  }
  if (!installed && have("bun")) {
    const r = spawnSync("bun", ["add", "--cwd", HOME, "@heyditto/cli@latest"], {
      timeout: 180000,
      stdio: "ignore",
    })
    installed = r.status === 0
  }

  const bin = managedBinPath()
  if (installed && existsSync(bin)) {
    // Stamp the refresh marker so SessionStart throttles future auto-updates.
    try {
      writeFileSync(path.join(HOME, ".refreshed"), new Date().toISOString())
    } catch {
      /* ignore */
    }
    // First-run agent login only if there's no key already.
    let hasKey = false
    try {
      const s = execFileSync(bin, ["status", "--output", "json"], {
        timeout: 15000,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      const j = JSON.parse(s)
      hasKey = !!(j && j.apiKey && j.apiKey.present)
    } catch {
      /* status unavailable — treat as no key */
    }
    if (!hasKey) {
      try {
        execFileSync(bin, ["init", "--agent", "--agent-caller", AGENT_CALLER, "--json"], {
          timeout: 25000,
          stdio: "ignore",
        })
      } catch {
        /* offline / transient — next session retries */
      }
    }
  }
} catch {
  /* swallow — bootstrap is strictly best-effort */
} finally {
  try {
    rmSync(LOCK)
  } catch {
    /* ignore */
  }
}
