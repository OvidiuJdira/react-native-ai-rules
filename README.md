# TechNest EWI Monorepo — Claude Code Toolkit

Private plugin marketplace that distributes the complete `.claude/` configuration for the EWI React / React Native monorepo.

## What's Included

### Commands (7)
| Command | Description |
|---------|-------------|
| `/commit-message` | Generate detailed commit messages with Jira ticket extraction |
| `/create-component` | Scaffold reusable feature component (mobile/web/shared) |
| `/create-mobile-page` | Scaffold a complete React Native screen with all files |
| `/create-module` | Scaffold a Clean Architecture module in @ewi/shared |
| `/create-shared-hook` | Add a shared base hook to @ewi/shared/presentations |
| `/create-use-case` | Add a new use case to an existing shared module |
| `/create-web-page` | Scaffold a Next.js page with all files |

### Skills (6)
| Skill | Description |
|-------|-------------|
| `/setup-rules` | Deploy CLAUDE.md files to the monorepo |
| `/audit` | Check structural conformance of pages, modules, components |
| `/review` | Check code against all CLAUDE.md rules |
| `data-patterns` | Auto-enforces data layer patterns (auto-invoked) |
| `hook-patterns` | Auto-enforces hook patterns (auto-invoked) |
| `ui-patterns` | Auto-enforces UI patterns (auto-invoked) |

### Hooks (10)
| Hook | Event | What it does |
|------|-------|-------------|
| `no-cross-app-imports` | PreToolUse | Blocks web/mobile cross-imports |
| `no-isDark-in-jsx` | PreToolUse | Blocks isDark branching in JSX |
| `no-single-letter-vars` | PreToolUse | Blocks single-letter variable names |
| `eslint-check` | PostToolUse | Runs ESLint on written files |
| `auto-install-deps` | PostToolUse | Auto-runs pnpm install on package.json changes |
| `audit-rules` | PostToolUse | Checks for CLAUDE.md rule violations |
| `typecheck` | PostToolUse | Runs TypeScript type checking |
| `mark-generated` | PostToolUse | Marks session as having generated code |
| `post-write-checklist` | PostToolUse | Reminds to run tests + /review |
| `run-tests-on-stop` | Stop | Blocks session stop if tests fail |

### CLAUDE.md Templates (4)
| File | Scope |
|------|-------|
| `CLAUDE.md` | Root — monorepo architecture, import boundaries, critical rules |
| `apps/mobile/CLAUDE.md` | React Native — navigation, theming, components, tenant system |
| `apps/web/CLAUDE.md` | Next.js — server/client components, Tailwind, @ewi/web-ui |
| `packages/shared/CLAUDE.md` | Clean Architecture layers, React Query, barrel exports |

---

## Quick Start

### 1. Add the marketplace (one-time per dev)

```
/plugin marketplace add OvidiuJdira/react-native-ai-rules
```

### 2. Install the plugin

```
/plugin install technest-react-monorepo@technest-toolkit
```

### 3. Deploy CLAUDE.md files to your project

Navigate to your monorepo root:

```
/setup-rules
```

---

## Updating

When rules/commands/hooks are updated in this repo:

```
/plugin marketplace update technest-toolkit
```

Then optionally re-deploy CLAUDE.md templates:

```
/setup-rules
```

---

## Auto-Discovery (optional)

Add to `.claude/settings.local.json` (gitignored in client repo) or `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "technest-toolkit": {
      "source": {
        "source": "github",
        "repo": "OvidiuJdira/react-native-ai-rules"
      }
    }
  }
}
```

---

## Keeping CLAUDE.md Out of the Client Repo

Add to the client repo's `.gitignore`:

```
CLAUDE.md
apps/*/CLAUDE.md
packages/*/CLAUDE.md
```

---

## Contributing: Adding New Commands/Skills/Hooks

### Workflow for adding new content

1. **Clone this repo**:
   ```bash
   git clone https://github.com/OvidiuJdira/react-native-ai-rules.git
   cd react-native-ai-rules
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feat/add-create-store-command
   ```

3. **Add your file** in the correct location:
   - Commands → `plugins/technest-react-monorepo/commands/`
   - Skills → `plugins/technest-react-monorepo/skills/<skill-name>/SKILL.md`
   - Hooks (JS) → `plugins/technest-react-monorepo/hooks/`
   - Hook wiring → update `plugins/technest-react-monorepo/hooks/hooks.json`
   - CLAUDE.md templates → `plugins/technest-react-monorepo/templates/`

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add /create-store command for Zustand store scaffolding"
   git push -u origin feat/add-create-store-command
   ```

5. **Create a PR** — get at least one review from the team.

6. **After merge**, every dev runs:
   ```
   /plugin marketplace update technest-toolkit
   ```

### Updating hooks.json

When adding a new JS hook, you must also register it in `hooks/hooks.json`. Add an entry under the appropriate event (`PreToolUse`, `PostToolUse`, or `Stop`):

```json
{
  "type": "command",
  "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/your-new-hook.js",
  "timeout": 10,
  "statusMessage": "Running your check..."
}
```

---

## Handling Merge Conflicts

Since this is a shared repo with ~20 devs, conflicts will happen. Here's how to handle them:

### Prevention: structure that minimizes conflicts

- **One file per command/skill/hook** — two people rarely edit the same command
- **CLAUDE.md templates** are the most conflict-prone — coordinate changes in the team channel
- **hooks.json** — conflicts here are usually additive (both people added a new hook). Resolve by keeping both entries

### When a conflict happens

1. **Pull and rebase** (preferred over merge for cleaner history):
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Resolve conflicts by file type**:

   | File type | Resolution strategy |
   |-----------|-------------------|
   | `commands/*.md` | Usually non-overlapping. If both changed same command, compare and pick the more complete version |
   | `skills/*/SKILL.md` | Same as commands — compare and merge manually |
   | `hooks/*.js` | Rare conflicts. If both modified same hook, review the logic carefully |
   | `hooks/hooks.json` | Most common conflict. Usually both added entries — **keep both** and fix JSON syntax |
   | `templates/*/CLAUDE.md` | **Most sensitive.** Read both versions fully, merge rule by rule. Never blindly accept one side |

3. **For hooks.json conflicts** (most common):
   ```bash
   # Open the file, look for conflict markers
   # Usually both sides added a new hook entry
   # Keep both entries, fix the JSON array syntax (commas, brackets)
   # Validate: node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json'))"
   ```

4. **For CLAUDE.md template conflicts**:
   ```bash
   # These are the most important — they define team rules
   # Always read both versions fully before resolving
   # If unsure, discuss in the team channel before resolving
   # After resolving, all devs should run /setup-rules to get the updated rules
   ```

5. **Continue the rebase**:
   ```bash
   git add .
   git rebase --continue
   git push --force-with-lease  # safe force-push for your branch only
   ```

### Golden rules for this repo

- **Never force-push to `main`**
- **Always use PRs** — even for small changes
- **Coordinate CLAUDE.md template changes** — post in the team channel before modifying
- **One logical change per PR** — don't mix a new command with a CLAUDE.md rule change
- **Version bump** — update `version` in `.claude-plugin/marketplace.json` and `plugin.json` for breaking changes

---

## Repo Structure

```
.claude-plugin/
  marketplace.json                    # Marketplace catalog
plugins/
  technest-react-monorepo/
    .claude-plugin/plugin.json        # Plugin manifest
    commands/                         # 7 scaffold/workflow commands
      commit-message.md
      create-component.md
      create-mobile-page.md
      create-module.md
      create-shared-hook.md
      create-use-case.md
      create-web-page.md
    skills/                           # 6 skills (audit, review, patterns)
      setup-rules/SKILL.md
      audit/SKILL.md
      review/SKILL.md
      data-patterns/SKILL.md
      hook-patterns/SKILL.md
      ui-patterns/SKILL.md
    hooks/                            # 10 JS hooks + hooks.json wiring
      hooks.json
      audit-rules.js
      auto-install-deps.js
      eslint-check.js
      mark-generated.js
      no-cross-app-imports.js
      no-isDark-in-jsx.js
      no-single-letter-vars.js
      post-write-checklist.js
      run-tests-on-stop.js
      typecheck.js
    templates/                        # 4 CLAUDE.md rule files
      root/CLAUDE.md
      apps-mobile/CLAUDE.md
      apps-web/CLAUDE.md
      packages-shared/CLAUDE.md
```
