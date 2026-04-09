---
name: push-rules
description: Push local CLAUDE.md rules, commands, skills, and hooks from the current project to the TechNest plugin repo. Quick one-way sync for when you've made changes locally and want to share them with the team.
disable-model-invocation: true
---

# Push Rules to Plugin Repo

Push changed files from the current project to the TechNest plugin repo so the team gets them on next update.

## Step 1: Find the plugin source repo

Look for the plugin source repo in this order:
1. `~/development/programming/ai-rules/react-native-ai-rules/`
2. Search for a directory with `.claude-plugin/marketplace.json` containing "technest-toolkit" under `~/development/`
3. If not found, ask the user for the path

Verify it's the right repo by checking `git remote -v` contains `OvidiuJdira/react-native-ai-rules`.

## Step 2: Detect what changed

Compare each project file against the plugin repo template:

| Project file | Plugin repo file |
|---|---|
| `./CLAUDE.md` | `plugins/technest-react-monorepo/templates/root/CLAUDE.md` |
| `./apps/mobile/CLAUDE.md` | `plugins/technest-react-monorepo/templates/apps-mobile/CLAUDE.md` |
| `./apps/web/CLAUDE.md` | `plugins/technest-react-monorepo/templates/apps-web/CLAUDE.md` |
| `./packages/shared/CLAUDE.md` | `plugins/technest-react-monorepo/templates/packages-shared/CLAUDE.md` |
| `./.claude/commands/*.md` | `plugins/technest-react-monorepo/commands/*.md` |
| `./.claude/skills/*/SKILL.md` | `plugins/technest-react-monorepo/skills/*/SKILL.md` |
| `./.claude/hooks/*.js` | `plugins/technest-react-monorepo/hooks/*.js` |

Show only files that differ. If nothing changed, say "Everything is in sync — nothing to push."

## Step 3: Show diff summary and confirm

For each changed file, show a brief summary of what changed (added lines, removed lines, key changes). Then ask:

"Push these N changed files to the plugin repo?"

## Step 4: Copy files

Copy each changed file from the project to the plugin repo location.

**Important for hooks/*.js**: do NOT overwrite `hooks/hooks.json` — that's the plugin hook wiring config, not a project file.

## Step 5: Commit and push

```bash
cd <plugin-repo-path>
git add -A
git status
```

Show the staged changes. Ask the user for a commit message, or suggest one based on the changes. Then:

```bash
git commit -m "<message>"
git push origin main
```

## Step 6: Done

Print:
```
Pushed to OvidiuJdira/react-native-ai-rules.
Tell your team to run: /plugin marketplace update technest-toolkit
```
