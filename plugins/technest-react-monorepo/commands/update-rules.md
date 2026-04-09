---
description: Update CLAUDE.md files from the latest plugin templates (overwrites existing files after confirmation)
---

# Update AI Rules

You are updating the CLAUDE.md AI rules in this monorepo to the latest version from the TechNest plugin.

## Steps

1. First, update the plugin itself by telling the user to run: `/plugin marketplace update technest-toolkit`

2. Then read the latest templates from `${CLAUDE_PLUGIN_ROOT}/templates/` and compare them with the existing CLAUDE.md files in the project.

3. For each file that differs, show a summary of what changed and ask the user to confirm the update.

4. Write the updated files.

## Target files

| Template | Destination |
|----------|-------------|
| `${CLAUDE_PLUGIN_ROOT}/templates/root-CLAUDE.md` | `./CLAUDE.md` |
| `${CLAUDE_PLUGIN_ROOT}/templates/apps-mobile-CLAUDE.md` | `./apps/mobile/CLAUDE.md` |
| `${CLAUDE_PLUGIN_ROOT}/templates/apps-web-CLAUDE.md` | `./apps/web/CLAUDE.md` |
| `${CLAUDE_PLUGIN_ROOT}/templates/packages-CLAUDE.md` | `./packages/CLAUDE.md` |
