---
name: setup-rules
description: Deploy CLAUDE.md AI rules to the current EWI monorepo. Creates CLAUDE.md files in root, apps/mobile, apps/web, and packages/shared.
disable-model-invocation: true
---

# Setup AI Rules for EWI Monorepo

Deploy the TechNest AI rules to the current monorepo project.

## Steps

1. **Detect the monorepo root** — look for `apps/` and `packages/` directories. If missing, ask the user.

2. **Read and deploy template files** from the plugin's templates directory:

   | Template source | Destination |
   |----------------|-------------|
   | `${CLAUDE_PLUGIN_ROOT}/templates/root/CLAUDE.md` | `./CLAUDE.md` |
   | `${CLAUDE_PLUGIN_ROOT}/templates/apps-mobile/CLAUDE.md` | `./apps/mobile/CLAUDE.md` |
   | `${CLAUDE_PLUGIN_ROOT}/templates/apps-web/CLAUDE.md` | `./apps/web/CLAUDE.md` |
   | `${CLAUDE_PLUGIN_ROOT}/templates/packages-shared/CLAUDE.md` | `./packages/shared/CLAUDE.md` |

3. **Check for existing files** — before writing each CLAUDE.md:
   - If the file does NOT exist → create it from the template
   - If the file DOES exist → show a diff summary and ask the user if they want to overwrite, merge, or skip

4. **Create missing directories** — if target directories don't exist, create them. Ask the user first.

5. **Summary** — list all files created/updated and remind to add CLAUDE.md to `.gitignore` if not wanted in client repo.

## Important

- Use the Read tool to read each template file from `${CLAUDE_PLUGIN_ROOT}/templates/`
- Use the Write tool to create the CLAUDE.md files in the project
- NEVER overwrite without asking
- If the user says "force" or "overwrite", replace all files without asking
