---
name: handoff
description: Save a durable handoff of the current task to Ditto, then archive the invoking agent's current chat when the user asks to hand off and close out the session.
---

# Handoff

Close out the current session with enough saved context for another agent to
continue. Use `/handoff` where the host exposes skills as slash commands, or
invoke this skill by name. A request for a handoff draft or summary alone does
not authorize saving to Ditto or archiving. If the user requests this full
workflow, that request authorizes its save and current-chat archive; do not ask
again unless the destination or target is ambiguous.

## Prepare the handoff

Finish the work already authorized for this turn, or record why it is blocked.
Follow the repository's delivery rules so valuable changes are durable before
closing the session. Do not start new work merely to make the handoff complete.

Write a concise continuation note containing:

* The user's objective, current scope and decisions that constrain the work.
* What changed and where: canonical issue, PR and artifact links, plus repository,
  branch, commit and workspace locations when useful for resuming.
* Observed validation and outcomes. Keep implementation, merge, deployment and
  live behavior distinct; include limitations and unfinished checks.
* Remaining work, blockers, next actions and any approvals still required.

Use the conversation and current evidence. Do not turn an assumption into a
verified result, include credentials, or copy the whole transcript. Mark archival
as pending in the saved note: it has not happened yet.

## Save and read back

Use the bundled `ditto-memory` skill for connection, scope and write permissions.
Inspect the live tools; use the connected account's private memory destination.
If its privacy or intended account is unclear, resolve that before saving.
Prefer a matching handoff record for this session over a duplicate. Include the
current chat reference in source metadata when the host supplies it; never guess
a chat ID or URL.

Save the note and inspect the receipt. Fetch the saved record by its returned ID
and confirm it contains the handoff before attempting archival. Search indexing
can lag a save, so prefer direct readback over a search preview. If a write times
out or has an uncertain result, reconcile by returned ID or supported stable
identity before retrying. Do not blindly repeat the write.

If Ditto is unavailable, saving fails, or readback cannot verify the note, keep
the chat open and provide the handoff text with the connection or verification
gap. A local draft or an inline summary does not satisfy this workflow's save
gate. Never put a user's handoff in the shared skill repository or public plugin.

## Archive the current chat

Inspect the current host's supported chat-management tools. Prefer an operation
that targets the calling chat implicitly. In Codex desktop, when the available
`set_thread_archived` tool documents that omitting `threadId` targets the calling
chat, call it with `archived: true` and omit the ID. If the operation requires an
explicit target, establish the current chat's identity from trusted host context;
do not infer it from a similar title or the most recently updated chat.

If no suitable tool exists, use supported host UI controls only when the current
chat and its archive action can be identified from fresh UI state. Do not invent
an archive API, edit host databases, or treat exiting a CLI session as archival.
On hosts without a supported archive operation, keep the saved handoff and give
its reference plus the manual closeout step. Do not claim archival succeeded.

Complete required tracker updates and present the handoff reference and outcome
before the archive action, since the host may end interaction immediately. Archive
only this chat, after the saved handoff has passed readback. Inspect the operation's
receipt or refreshed host state before reporting success. On an ambiguous result,
read the current state before retrying; on failure, report the saved handoff and
the archive failure. Archival is the final mutation in this workflow.

This skill does not authorize deleting files, workspaces, branches or memories,
archiving other chats, sending messages, merging or deploying. Preserve existing
authorization boundaries for any unfinished work.
