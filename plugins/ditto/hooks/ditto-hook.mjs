#!/usr/bin/env node
// ditto-hook.mjs — the engine that turns Claude Code into Ditto.
//
// One file, invoked by hooks.json for several hook events. It shells out to the
// `@heyditto/cli` binary (`ditto` / `heyditto`) and bridges Claude Code <-> the
// Ditto memory graph:
//
//   SessionStart     -> ensure an agent account exists (agent-native login),
//                       inject a short "memory connected" note + claim URL.
//   UserPromptSubmit  -> semantic-search the user's prompt against their graph
//                       and inject the most relevant memories as context (recall).
//   Stop              -> write the latest exchange back to memory (remember).
//   PreCompact        -> persist the latest exchange before context is compacted.
//
// Design rules:
//   - NEVER block the user. Any failure exits 0 with no output.
//   - Fast: every CLI call is time-boxed.
//   - Read-only-safe: on a read-only agent account, save calls fail server-side
//     and are swallowed — recall still works.
//
// Env knobs (all optional):
//   DITTO_BIN            explicit path to the ditto/heyditto binary
//   DITTO_AGENT_CALLER   agent name set once at init (default "Claude Code")
//   DITTO_RECALL_LIMIT   max memories injected per prompt (default 5)
//   DITTO_AUTOSAVE       "0" disables write-back on Stop/PreCompact (default on)
//   DITTO_MIN_PROMPT_LEN minimum prompt length to trigger recall (default 8)

import { execFileSync, spawn } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const EVENT = process.argv[2] || ""
const AGENT_CALLER = (process.env.DITTO_AGENT_CALLER || "Claude Code").slice(0, 80)
const RECALL_LIMIT = clampInt(process.env.DITTO_RECALL_LIMIT, 5, 1, 15)
const MIN_PROMPT_LEN = clampInt(process.env.DITTO_MIN_PROMPT_LEN, 8, 1, 1000)
const AUTOSAVE = process.env.DITTO_AUTOSAVE !== "0"
const AUTO_INSTALL = process.env.DITTO_AUTO_INSTALL !== "0"

// Minimum CLI version the plugin relies on (the `init --agent` self-provision
// flow landed in 1.3.x). A stale global (e.g. Apple's unrelated /usr/bin/ditto
// or an old 0.x) is treated as unusable so we fall through to a managed install.
const MIN_VERSION = [1, 3, 0]

function clampInt(v, dflt, lo, hi) {
  const n = Number.parseInt(v ?? "", 10)
  if (!Number.isFinite(n)) return dflt
  return Math.max(lo, Math.min(hi, n))
}

// Plugin-managed CLI install location — contained, never a global `-g` install.
function cliHome() {
  if (process.env.DITTO_CLI_HOME) return process.env.DITTO_CLI_HOME
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
  return path.join(base, "heyditto", "cli")
}
function managedBinPath() {
  const ext = process.platform === "win32" ? ".cmd" : ""
  return path.join(cliHome(), "node_modules", ".bin", "ditto" + ext)
}

// A candidate is usable only if it responds to --version with >= MIN_VERSION.
function versionOK(bin) {
  try {
    const out = execFileSync(bin, ["--version"], {
      timeout: 8000,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    const m = out.match(/(\d+)\.(\d+)\.(\d+)/)
    if (!m) return true // unrecognized format — assume usable rather than block
    const v = [Number(m[1]), Number(m[2]), Number(m[3])]
    for (let i = 0; i < 3; i++) {
      if (v[i] > MIN_VERSION[i]) return true
      if (v[i] < MIN_VERSION[i]) return false
    }
    return true
  } catch {
    return false
  }
}

// Resolve and cache the ditto binary across calls within this process.
// Order: explicit override -> managed install -> PATH (`ditto`, `heyditto`).
let cachedBin = null
function dittoBin() {
  if (cachedBin) return cachedBin
  const managed = managedBinPath()
  const candidates = [process.env.DITTO_BIN, managed, "ditto", "heyditto"].filter(Boolean)
  for (const bin of candidates) {
    if (bin === managed && !existsSync(managed)) continue // avoid spawn noise
    if (versionOK(bin)) {
      cachedBin = bin
      return bin
    }
  }
  return null
}

// Kick off a background, contained install of @heyditto/cli (+ first-run agent
// login). Returns true if an install is now running or already in progress.
// Never blocks: spawns detached and returns immediately.
function startBackgroundInstall() {
  if (!AUTO_INSTALL) return false
  const home = cliHome()
  const lock = path.join(home, ".installing")
  try {
    mkdirSync(home, { recursive: true })
    if (existsSync(lock)) {
      const ageMs = Date.now() - statSync(lock).mtimeMs
      if (ageMs < 5 * 60 * 1000) return true // an install is already underway
    }
    writeFileSync(lock, String(process.pid))
  } catch {
    /* best-effort lock */
  }
  try {
    const bootstrap = fileURLToPath(new URL("./bootstrap.mjs", import.meta.url))
    const child = spawn(process.execPath, [bootstrap], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, DITTO_AGENT_CALLER: AGENT_CALLER },
    })
    child.unref()
    return true
  } catch {
    return false
  }
}

// Run a ditto subcommand, returning trimmed stdout or null on any failure.
function runDitto(args, { timeout = 15000, input } = {}) {
  const bin = dittoBin()
  if (!bin) return null
  try {
    return execFileSync(bin, args, {
      timeout,
      input,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      stdio: ["pipe", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

function parseJSON(s) {
  if (!s) return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// Emit additionalContext for context-injecting events (SessionStart / UserPromptSubmit).
function emitContext(text) {
  if (!text) process.exit(0)
  const payload = {
    hookSpecificOutput: {
      hookEventName: EVENT,
      additionalContext: text,
    },
  }
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function readStdin() {
  try {
    return readFileSync(0, "utf8")
  } catch {
    return ""
  }
}

// ---- status helpers ---------------------------------------------------------

function dittoStatus() {
  return parseJSON(runDitto(["status", "--output", "json"], { timeout: 12000 }))
}

function hasKey(status) {
  return !!(status && status.apiKey && status.apiKey.present)
}

// ---- event handlers ---------------------------------------------------------

function onSessionStart() {
  if (!dittoBin()) {
    // No usable CLI yet. Auto-provision it in the background (contained install
    // + first-run agent login) so the user never has to run npm by hand.
    if (startBackgroundInstall()) {
      emitContext(
        "Ditto memory is setting itself up for the first time — installing the @heyditto/cli helper " +
          "in the background (a contained install under ~/.cache/heyditto, no global npm, no action needed). " +
          "Memory recall and save activate automatically within a few seconds. If the user asks about memory " +
          "right now, mention it's initializing and will be ready shortly."
      )
    }
    // Auto-install disabled (DITTO_AUTO_INSTALL=0) — fall back to a gentle nudge.
    emitContext(
      "Ditto memory plugin is installed but the `ditto` CLI is unavailable and auto-install is off " +
        "(DITTO_AUTO_INSTALL=0). To enable persistent memory, run: `npm install -g @heyditto/cli`."
    )
  }

  let status = dittoStatus()

  if (!hasKey(status)) {
    // Agent-native login: mint a free, claimable agent account. No browser, no OAuth.
    const out = parseJSON(
      runDitto(["init", "--agent", "--agent-caller", AGENT_CALLER, "--json"], { timeout: 25000 })
    )
    if (out && out.apiKey) {
      const claim = out.claimURL ? `\nClaim URL (share with the user to merge this agent's memories into their own Ditto account): ${out.claimURL}` : ""
      emitContext(
        `Ditto memory is now connected. A free, claimable agent account ("${out.agentCaller || AGENT_CALLER}") was provisioned for this machine; ` +
          `relevant memories will be recalled automatically on each prompt, and salient turns are saved back.${claim}\n` +
          `Mention to the user (once) that they can claim this agent at the URL above to own its memories.`
      )
    }
    // init failed (offline, etc.) — say nothing, never block.
    emitContext("")
  }

  // Already authenticated.
  const tools = status && Array.isArray(status.tools) ? status.tools.length : null
  emitContext(
    `Ditto memory is connected${tools ? ` (${tools} tools)` : ""}. ` +
      `Relevant memories will be recalled automatically before each response. ` +
      `Use /ditto-recall, /ditto-save, /ditto-whoami, or /ditto-claim to manage memory directly.`
  )
}

function onUserPromptSubmit() {
  const input = parseJSON(readStdin())
  const prompt = (input && typeof input.prompt === "string" ? input.prompt : "").trim()
  if (prompt.length < MIN_PROMPT_LEN) emitContext("")

  const query = prompt.slice(0, 500)
  const res = parseJSON(runDitto(["search", query, "--output", "json"], { timeout: 15000 }))
  const memories = res && Array.isArray(res.memories) ? res.memories : []
  if (memories.length === 0) emitContext("")

  const lines = memories.slice(0, RECALL_LIMIT).map((m, i) => {
    const when = m.timestamp ? ` (${m.timestamp})` : ""
    const id = m.id ? ` [id: ${m.id}]` : ""
    const preview = String(m.preview || m.content || "").replace(/\s+/g, " ").slice(0, 400)
    return `${i + 1}.${when}${id} ${preview}`
  })

  emitContext(
    "Relevant memories from the user's Ditto graph (recalled automatically — cite or build on them when useful; " +
      "use `ditto fetch <id>` for full text):\n" +
      lines.join("\n")
  )
}

function saveLatestExchange(sourceContext) {
  if (!AUTOSAVE) process.exit(0)
  const input = parseJSON(readStdin())
  const transcript = input && input.transcript_path
  if (!transcript) process.exit(0)

  let raw
  try {
    raw = readFileSync(transcript, "utf8")
  } catch {
    process.exit(0)
  }

  // Walk the JSONL transcript backwards for the last assistant text and the
  // user turn that preceded it.
  const entries = raw
    .split("\n")
    .filter(Boolean)
    .map((l) => parseJSON(l))
    .filter(Boolean)

  let assistantText = ""
  let userText = ""
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]
    const msg = e.message || e
    const role = msg && msg.role
    const text = extractText(msg)
    if (!text) continue
    if (!assistantText && role === "assistant") assistantText = text
    else if (assistantText && !userText && role === "user") {
      userText = text
      break
    }
  }
  if (!assistantText || !userText) process.exit(0)

  const content =
    `Claude Code exchange — User: ${userText.slice(0, 1500)}\n\n` +
    `Assistant: ${assistantText.slice(0, 2500)}`

  // Fire-and-forget; rejected on read-only accounts and silently ignored.
  runDitto(
    ["save", content, "--source", "claude-code", "--source-context", String(sourceContext || "claude-code")],
    { timeout: 20000 }
  )
  process.exit(0)
}

function extractText(msg) {
  if (!msg) return ""
  const c = msg.content
  if (typeof c === "string") return c.trim()
  if (Array.isArray(c)) {
    return c
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n")
      .trim()
  }
  return ""
}

// ---- dispatch ---------------------------------------------------------------

try {
  switch (EVENT) {
    case "SessionStart":
      onSessionStart()
      break
    case "UserPromptSubmit":
      onUserPromptSubmit()
      break
    case "Stop":
    case "SubagentStop":
      saveLatestExchange(process.cwd())
      break
    case "PreCompact":
      saveLatestExchange(`${process.cwd()} (pre-compact)`)
      break
    default:
      process.exit(0)
  }
} catch {
  // Absolute backstop: never surface an error to the session.
  process.exit(0)
}
