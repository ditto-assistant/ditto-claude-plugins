# Owned workspace and build cleanup

Use this only with actual local inspection capabilities. A browser file upload
or cloud sandbox does not grant access to the user's Mac. Never substitute host
transcript databases, plugin caches or arbitrary directories for an owned task
workspace. Do not run a global cleanup sweep as a side effect of handoff.

## Inventory and recovery gates

Record a timestamp, filesystem free space (`df -h /System/Volumes/Data` on macOS,
or the actual workspace filesystem elsewhere), canonical candidate paths and
`du` sizes. Avoid double-counting nested checkouts. Establish ownership from the
current task, managed-worktree attachments and repository metadata, not names
or age. Exclude other sessions, primary/shared/pinned/active checkouts and source
data. Resolve symlinks; do not cross into another checkout.

Inspect tracked, staged, untracked AND ignored files, local branches, stashes and
worktrees. A clean `git status` omits ignored files. Separate reproducible builds
from unique fixtures, databases, uploads, screenshots, configuration and recovery
material. Do not expose secrets. Never assume an ignored file is disposable.

Before removing a checkout, commit and push valuable code through its delivery
rules, open/update its PR and verify remote head against local commit. Read the
PR's actual base, state, validated head and merge receipt. A merged PR does not
prove later local changes landed; squash merges also mean branch-tip ancestry
alone is insufficient. Open PRs stay by default. Closed/merged state is not
deletion permission. Preserve unique branches, stashes, untracked files and needed
ignored files durably, verify recovery, and record exact restore instructions.
Do not push secrets just to obtain a clean checkout. A summary is not a backup.

## Scope and mechanism

If the user's cleanup instruction does not cover the exact owned candidates,
present paths, sizes, preservation/recovery plan and proposed operations for
approval. Do not re-ask for exact operations already authorized. No deletion
follows merely because a handoff exists. Unique unpushed/uncommitted work and
source data must survive.

Prefer the host's managed archive-worktree mechanism for eligible attached
worktrees. Inspect its live contract and attachment identity, preserve needed
ignored files separately, and verify the snapshot/restore receipt. It may preserve
code more safely than raw removal but does not establish backup of ignored files.
Primary, pinned or shared worktrees may be ineligible; do not bypass a refusal
with recursive deletion.

For ordinary Git worktrees use supported removal only after all gates pass.
For task clones and temporary builds, remove only exact approved, inventoried
owned paths using a suitable filesystem tool. Never run arbitrary recursive `rm`,
broad `find ... -exec rm`, wildcard worktree purges or deletion by age/name.
Never remove app data, source databases, Docker volumes, global caches, primary
checkouts or another session's artifacts under this skill. Follow a separately
authorized exact cleanup plan for those.

Before stopping a process, establish PID, command, working directory and relation
to this task. Stop only owned build/preview processes; never kill by executable
name. Preserve resumption evidence first. Retain artifacts with active writers
or consumers and record the reason.

## Verify results

Inspect each archive/removal receipt and actual path state. Measure free space
again; report before/after timestamps and actual reclaimed space or uncertainty
(snapshots/open files can delay visible free space). Do not claim a `du` estimate
as actual free space gained. Verify preserved files/snapshot references and a
practical restoration path, including remote repository, branch/commit, PR and
private backup location as applicable.

Update the Ditto handoff with results and verify the update. Keep filesystem
cleanup and chat archival receipts separate. If removal or recovery verification
fails, retain remaining material, identify the failure and do not broaden deletion.
