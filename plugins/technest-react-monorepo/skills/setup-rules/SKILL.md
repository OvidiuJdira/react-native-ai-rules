---
description: Deploy CLAUDE.md AI rules to the current React / React Native monorepo. Creates CLAUDE.md files in root, apps/mobile, apps/web, and packages.
disable-model-invocation: true
name: setup-rules
---

# Setup AI Rules for React / React Native Monorepo

You are deploying the TechNest AI rules to the current monorepo project.

## Steps

1. **Detect the monorepo root** — look for `apps/` and `packages/` directories in the current working directory. If they don't exist, ask the user if they want to create them or if the working directory is wrong.

2. **Read the template files** from the plugin's templates directory:
   - `${CLAUDE_PLUGIN_ROOT}/templates/root-CLAUDE.md` → `./CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/apps-mobile-CLAUDE.md` → `./apps/mobile/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/apps-web-CLAUDE.md` → `./apps/web/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/packages-CLAUDE.md` → `./packages/CLAUDE.md`

3. **Check for existing files** — before writing each CLAUDE.md:
   - If the file does NOT exist → create it from the template
   - If the file DOES exist → show a diff and ask the user if they want to overwrite, merge, or skip

4. **Create missing directories** — if `apps/mobile/`, `apps/web/`, or `packages/` don't exist, create them before writing the CLAUDE.md files. Ask the user first.

5. **Summary** — after deployment, list all files created/updated and remind the user to add CLAUDE.md to `.gitignore` if they don't want these committed to the client repo.

## Important

- Use the Read tool to read each template file from `${CLAUDE_PLUGIN_ROOT}/templates/`
- Use the Write tool to create the CLAUDE.md files in the project
- NEVER overwrite without asking
- If the user says "force" or "overwrite", then replace all files without asking
