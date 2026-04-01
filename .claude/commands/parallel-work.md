# /parallel-work

Set up and manage parallel feature development using Git worktrees.

Usage: /parallel-work <subcommand> [arguments]

---

## Subcommands

### setup <feature-name>
Create a new worktree + branch for a feature and scaffold it for immediate development.

### status
Show all active worktrees, their branches, and any uncommitted changes.

### integrate <feature-1> <feature-2> [feature-3...]
Create an integration branch and merge the listed feature branches into it, resolving conflicts.

### teardown <feature-name>
Remove a worktree after its branch has been merged or abandoned.

### sync <feature-name>
Pull the latest main into a feature worktree (rebase or merge).

---

## Instructions

Read $ARGUMENTS and determine which subcommand was requested. Then follow the steps for that subcommand exactly.

---

## SETUP

When user runs: /parallel-work setup <feature-name>

**Step 1 — Validate**
- Check you are inside a git repository: `git rev-parse --git-dir`
- Check that the branch `feature/<feature-name>` does not already exist: `git branch --list feature/<feature-name>`
- If it already exists, stop and tell the user

**Step 2 — Create the worktree**
```bash
git worktree add ../<repo-name>-<feature-name> -b feature/<feature-name> main
```
Where `<repo-name>` is the name of the current directory.

**Step 3 — Install dependencies**
```bash
cd ../<repo-name>-<feature-name> && npm install
```
(Skip if no package.json exists)

**Step 4 — Scaffold a feature stub**

Create a file `app/lib/<feature-name>.ts` (or appropriate location) with:
```typescript
// <feature-name> — stub created by /parallel-work setup
// Branch: feature/<feature-name>
// TODO: implement this feature
export {};
```

Stage and commit the stub:
```bash
git add . && git commit -m "chore: scaffold feature/<feature-name> worktree"
```

**Step 5 — Report**
```
✅ Worktree ready: ../<repo-name>-<feature-name>
   Branch: feature/<feature-name>
   Based on: main (commit <sha>)

Next steps:
  cd ../<repo-name>-<feature-name>
  npm run dev        # start dev server
  # make your changes, then git add + git commit as normal
  # when done: /parallel-work integrate <feature-name>
```

---

## STATUS

When user runs: /parallel-work status

**Step 1** — Run: `git worktree list`

**Step 2** — For each worktree, run:
```bash
git -C <worktree-path> status --short
git -C <worktree-path> log --oneline main..<branch-name> 2>/dev/null | head -5
```

**Step 3 — Print a summary table:**

```
WORKTREES
─────────────────────────────────────────────────────────────
PATH                              BRANCH                    COMMITS AHEAD  DIRTY
/Users/.../expense-tracker-ai     feature-data-export-v3    0              no
/Users/.../expense-tracker-export feature/data-export       3              yes (2 files)
/Users/.../expense-tracker-anal…  feature/analytics-dash…   1              no
─────────────────────────────────────────────────────────────

DIRTY FILES in expense-tracker-export:
  M  app/page.tsx
  ?? app/lib/newfile.ts
```

---

## INTEGRATE

When user runs: /parallel-work integrate <feature-1> <feature-2> [...]

**Step 1 — Check all feature branches exist**
```bash
git branch --list feature/<feature-1>
git branch --list feature/<feature-2>
```
Stop if any are missing.

**Step 2 — Check all listed worktrees are clean**
```bash
git -C ../<repo>-<feature> status --short
```
Warn (but don't stop) if any have uncommitted changes.

**Step 3 — Create the integration branch**
```bash
git checkout main
git checkout -b integration/<feature-1>-<feature-2>
```

**Step 4 — Merge each feature branch in order**
For each feature branch:
```bash
git merge feature/<feature-name> --no-ff -m "merge: integrate feature/<feature-name>"
```

If a merge conflict occurs:
- Print every conflicting file with its conflict markers explained in plain English
- Resolve each conflict by keeping code from BOTH branches unless they are logically incompatible
- After resolving: `git add <file> && git merge --continue`
- Explain each resolution decision in a comment above the resolved block

**Step 5 — Type-check and build**
```bash
npm run build
```
If it fails, fix the errors before proceeding.

**Step 6 — Commit and push**
```bash
git push -u origin integration/<feature-1>-<feature-2>
```

**Step 7 — Report**
```
✅ Integration branch ready: integration/<feature-1>-<feature-2>

Merged:
  ✓ feature/<feature-1>  — <N> commits
  ✓ feature/<feature-2>  — <N> commits

Conflicts resolved: <N>
  - <file>: kept both [description of resolution]

Build: ✓ passing

Next steps:
  Review the integration branch, then open a PR:
  gh pr create --base main --head integration/<feature-1>-<feature-2>
```

---

## TEARDOWN

When user runs: /parallel-work teardown <feature-name>

**Step 1 — Safety checks**
- Check the worktree has no uncommitted changes: `git -C ../<repo>-<feature-name> status --short`
- Check the branch has been merged into main or another branch: `git branch --merged main | grep feature/<feature-name>`
- If either check fails, warn the user and ask for confirmation before proceeding

**Step 2 — Remove the worktree**
```bash
git worktree remove ../<repo>-<feature-name>
```

**Step 3 — Optionally delete the branch**
Ask the user: "Delete the branch feature/<feature-name> as well? (it has been merged)"
If yes:
```bash
git branch -d feature/<feature-name>
git push origin --delete feature/<feature-name>
```

**Step 4 — Report**
```
✅ Worktree removed: ../<repo>-<feature-name>
   Branch feature/<feature-name>: [kept / deleted]
```

---

## SYNC

When user runs: /parallel-work sync <feature-name>

**Step 1 — Fetch latest**
```bash
git fetch origin main
```

**Step 2 — Rebase the feature branch onto main**
```bash
git -C ../<repo>-<feature-name> rebase origin/main
```

If rebase conflicts occur, resolve them and explain each resolution.

**Step 3 — Report**
```
✅ feature/<feature-name> synced with origin/main
   Fast-forwarded: <N> commits from main applied
   Conflicts resolved: <N>
```

---

## ERROR HANDLING

In all subcommands:
- If a git command fails, print the exact error and explain what it means in plain English
- Never force-push or use --force flags without explicit user confirmation
- Never delete branches that are not yet merged without warning
- If node_modules is missing in a worktree, run npm install automatically
