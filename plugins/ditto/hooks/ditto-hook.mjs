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

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const EVENT = process.argv[2] || ""
const AGENT_CALLER = (process.env.DITTO_AGENT_CALLER || "Claude Code").slice(0, 80)
const RECALL_LIMIT = clampInt(process.env.DITTO_RECALL_LIMIT, 5, 1, 15)
const MIN_PROMPT_LEN = clampInt(process.env.DITTO_MIN_PROMPT_LEN, 8, 1, 1000)
const AUTOSAVE = process.env.DITTO_AUTOSAVE !== "0"

function clampInt(v, dflt, lo, hi) {
  const n = Number.parseInt(v ?? "", 10)
  if (!Number.isFinite(n)) return dflt
  return Math.max(lo, Math.min(hi, n))
}

// Resolve and cache the ditto binary across calls within this process.
let cachedBin = null
function dittoBin() {
  if (cachedBin) return cachedBin
  const candidates = [process.env.DITTO_BIN, "ditto", "heyditto"].filter(Boolean)
  for (const bin of candidates) {
    try {
      execFileSync(bin, ["--version"], { timeout: 8000, stdio: ["ignore", "ignore", "ignore"] })
      cachedBin = bin
      return bin
    } catch {
      /* try next candidate */
    }
  }
  return null
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
    // CLI not installed — nudge Claude to offer setup, but stay out of the way.
    emitContext(
      "Ditto memory plugin is installed but the `ditto` CLI is not on PATH. " +
        "If the user wants persistent memory, offer to run: `npm install -g @heyditto/cli`. " +
        "Otherwise ignore this and proceed normally."
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
