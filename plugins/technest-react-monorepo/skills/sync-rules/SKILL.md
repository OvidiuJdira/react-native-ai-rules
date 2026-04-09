---
name: sync-rules
description: Bidirectional sync of CLAUDE.md rules, commands, skills, and hooks between the current project and the plugin repo. Detects changes in both directions and lets you pull updates or push local changes.
disable-model-invocation: true
---

# Sync Rules — Bidirectional

Sync CLAUDE.md files, commands, skills, and hooks between the current project's `.claude/` directory and the TechNest plugin repo.

## Step 1: Locate both sides

1. **Project side** — the current working directory. Detect:
   - `./CLAUDE.md`
   - `./apps/mobile/CLAUDE.md`
   - `./apps/web/CLAUDE.md`
   - `./packages/shared/CLAUDE.md`
   - `./.claude/commands/*.md`
   - `./.claude/skills/*/SKILL.md`
   - `./.claude/hooks/*.js`

2. **Plugin side** — find the plugin install path by reading `${CLAUDE_PLUGIN_ROOT}`. The templates and source files are at:
   - `${CLAUDE_PLUGIN_ROOT}/templates/root/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/apps-mobile/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/apps-web/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/packages-shared/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/commands/*.md`
   - `${CLAUDE_PLUGIN_ROOT}/skills/*/SKILL.md`
   - `${CLAUDE_PLUGIN_ROOT}/hooks/*.js`

## Step 2: Compare all files

For each file pair, run a diff. Categorize each file into one of:
- **Identical** — no action needed
- **Project is newer** — local changes that should be pushed to the plugin
- **Plugin is newer** — plugin was updated, project needs to pull
- **Both changed** — conflict, show both diffs and ask user

Use file modification timestamps (`stat -f %m` on macOS) to determine which side is newer. If timestamps are unreliable, show the diff and ask the user.

## Step 3: Present a summary table

```
## Sync Status

| File                        | Status          | Action needed    |
|-----------------------------|-----------------|------------------|
| CLAUDE.md (root)            | Identical       | —                |
| apps/mobile/CLAUDE.md       | Project newer   | Push to plugin   |
| apps/web/CLAUDE.md          | Plugin newer    | Pull to project  |
| packages/shared/CLAUDE.md   | Identical       | —                |
| commands/create-component   | Project newer   | Push to plugin   |
| hooks/audit-rules.js        | Identical       | —                |
```

## Step 4: Ask user what to do

Present options:
1. **Pull all** — overwrite project files with plugin versions (for files where plugin is newer)
2. **Push all** — copy project files to plugin repo (for files where project is newer)
3. **Sync both** — pull plugin-newer files AND push project-newer files
4. **Pick individually** — let me choose per file

## Step 5: Execute the sync

### For PULL (plugin → project):
- Read the template file from `${CLAUDE_PLUGIN_ROOT}/templates/...`
- Write it to the project location using the Write tool

### For PUSH (project → plugin):
- Find the plugin SOURCE repo on disk. Check these locations in order:
  1. Look for a git remote matching `OvidiuJdira/react-native-ai-rules` anywhere under `~/development/`
  2. Check common locations: `~/development/programming/ai-rules/react-native-ai-rules/`
  3. If not found, ask the user for the path

- Copy the project file to the correct plugin repo location:
  | Project file | Plugin repo destination |
  |---|---|
  | `./CLAUDE.md` | `plugins/technest-react-monorepo/templates/root/CLAUDE.md` |
  | `./apps/mobile/CLAUDE.md` | `plugins/technest-react-monorepo/templates/apps-mobile/CLAUDE.md` |
  | `./apps/web/CLAUDE.md` | `plugins/technest-react-monorepo/templates/apps-web/CLAUDE.md` |
  | `./packages/shared/CLAUDE.md` | `plugins/technest-react-monorepo/templates/packages-shared/CLAUDE.md` |
  | `./.claude/commands/*.md` | `plugins/technest-react-monorepo/commands/*.md` |
  | `./.claude/skills/*/SKILL.md` | `plugins/technest-react-monorepo/skills/*/SKILL.md` |
  | `./.claude/hooks/*.js` | `plugins/technest-react-monorepo/hooks/*.js` |

- After copying, ask the user if they want to commit and push:
  ```bash
  cd <plugin-repo-path>
  git add -A
  git commit -m "sync: update rules from project"
  git push origin main
  ```

- After pushing, remind them to tell teammates: `/plugin marketplace update technest-toolkit`

## Step 6: Handle conflicts

If both sides changed the same file:
1. Show a diff of both versions
2. Ask user: "Keep project version", "Keep plugin version", or "I'll merge manually"
3. If manual merge, open the file and let the user edit before continuing

## Important

- NEVER overwrite without showing the diff first
- NEVER push to the plugin repo without user confirmation
- Always show what will change before executing
- For new files that exist in project but not in plugin (or vice versa), flag them as "New — add to other side?"
