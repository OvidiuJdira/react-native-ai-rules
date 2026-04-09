Generate a detailed commit message for the current staged/unstaged changes.

## Steps

1. Run `git branch --show-current` to get the branch name
2. Extract the Jira ticket key by matching the pattern `[A-Z][A-Z0-9]+-[0-9]+` from the branch name (e.g. `feat/EWF-251-mobile-mock-server` → `EWF-251`). If no match, use `EWF-XX`.
3. Run `git diff --staged` and `git diff` to see **all changes including full diffs** (not just `--stat`). If nothing is staged, use unstaged changes. For large diffs, read file-by-file to understand every change.
4. Run `git log --oneline -5` to see recent commit style.
5. **Analyze every changed file** — understand what was added, modified, removed, and why. Group related changes into logical sections.
6. Generate a commit message following the format below.

## Commit message format

```
type(scope): TICKET short summary

Affected packages: package1, package2

Section1:
  1. detail of what changed
  2. detail of what changed

Section2:
  1. detail of what changed
```

### Subject line rules

- **type**: one of `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`
- **scope** (optional but encouraged): `web`, `mobile`, `shared`, or other relevant scope
- **TICKET**: the Jira key extracted from the branch name (e.g. `EWF-251`)
- **short summary**: concise description, subject line under 72 characters total

The subject line MUST pass this commitlint regex: `^(\w+)(?:\(([^)]+)\))?(!)?:\s([A-Z][A-Z0-9]+-\d+\s.+)$`

### Body rules

- Leave one blank line between subject and body
- **First line of the body**: `Affected packages:` followed by a comma-separated list of packages that have changes. Determine from file paths: `apps/mobile/` → `mobile`, `apps/web/` → `web`, `packages/shared/` → `shared`, `packages/web-ui/` → `web-ui`, root files (CLAUDE.md, pnpm-lock.yaml, etc.) → `root`.
- **Group changes by section**. Each section is a category name followed by a colon on its own line, then numbered items indented with 2 spaces. Use these sections (omit empty ones): `Components`, `Features`, `Theme`, `Localization`, `Rules`, `Config`, `Tests`, `Fix`
- Describe **what** changed and **why** — not just file names
- Mention new files/features, moved files, deleted files, renamed items
- Mention breaking changes if any
- Keep each numbered item under 100 characters

## Output

Print ONLY the commit message — nothing else. No explanation, no markdown fences, no quotes. Just the raw multi-line message ready to copy-paste.
