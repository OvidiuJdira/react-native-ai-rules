# TechNest React / React Native Monorepo — Claude Code AI Rules

Private plugin marketplace that distributes AI rules (CLAUDE.md) for React / React Native monorepo projects.

## What's Included

| Plugin | What it does |
|--------|-------------|
| `technest-react-monorepo` | Deploys CLAUDE.md files with coding conventions, architecture rules, and best practices to your monorepo |

### CLAUDE.md files deployed

| File | Scope |
|------|-------|
| `./CLAUDE.md` | Monorepo root — workspace conventions, imports, TypeScript, git workflow |
| `./apps/mobile/CLAUDE.md` | React Native — navigation, platform code, performance, native modules |
| `./apps/web/CLAUDE.md` | React web — routing, SSR, styling, SEO, accessibility |
| `./packages/CLAUDE.md` | Shared packages — API design, cross-platform rules, versioning |

## Quick Start

### 1. Add the marketplace (one-time)

Inside Claude Code:

```
/plugin marketplace add OvidiuJdira/react-native-ai-rules
```

### 2. Install the plugin

```
/plugin install technest-react-monorepo@technest-toolkit
```

### 3. Deploy AI rules to your project

Navigate to your monorepo root, then:

```
/setup-rules
```

This creates CLAUDE.md files in `./`, `./apps/mobile/`, `./apps/web/`, and `./packages/`.

## Updating

When the rules are updated, pull the latest:

```
/plugin marketplace update technest-toolkit
```

Then re-deploy:

```
/update-rules
```

## Auto-Discovery (Optional)

To make the marketplace auto-discovered for all devs in a project, add this to `.claude/settings.local.json` (gitignored):

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

Or in your personal settings (`~/.claude/settings.json`) to have it available in every project.

## Keeping CLAUDE.md out of the client repo

Add to the client repo's `.gitignore`:

```
CLAUDE.md
apps/*/CLAUDE.md
packages/CLAUDE.md
```

## Available Skills & Commands

| Command | Description |
|---------|-------------|
| `/setup-rules` | Deploy CLAUDE.md files to the monorepo (asks before overwriting) |
| `/update-rules` | Update existing CLAUDE.md files from latest templates |

## Structure

```
.claude-plugin/
  marketplace.json
plugins/
  technest-react-monorepo/
    .claude-plugin/plugin.json
    skills/setup-rules/SKILL.md
    commands/update-rules.md
    agents/rules-checker.md
    hooks/hooks.json
    templates/
      root-CLAUDE.md
      apps-mobile-CLAUDE.md
      apps-web-CLAUDE.md
      packages-CLAUDE.md
```
