---
name: review
description: ALWAYS run this skill after writing, editing, or generating any code in the EWI project. Checks for rule violations — hardcoded strings, design tokens, single-letter names, logic in JSX, missing UIModel, form validation in apps, isDark branching, dependency threading, direct API calls, duplicated logic. Must run after every code change, no exceptions.
---

Review changed files against the project's critical rules. **Report violations only — fix nothing.**

## Scope

If arguments are provided, review only those files/paths. Otherwise, review all files with uncommitted changes. Ignore `node_modules/`, lock files, and config files.

To find changed files, run: `git diff --name-only HEAD` and `git diff --cached --name-only` and `git ls-files --others --exclude-standard -- 'apps/' 'packages/'`.

## Rules to check

### 1. Hardcoded strings in UI

Look for literal strings in JSX that are user-facing labels. Should come from `@ewi/shared/localization`.

### 2. Hardcoded design tokens

- Hex colors (`#` + 3-8 hex chars) in app files
- Raw pixel numbers in style props (except `0`, `1`, `flex: 1`)
- Font size literals
- Missing `useTheme()` when file uses colors/spacing/fontSizes/borderRadius

### 3. `isDark` branching in JSX

Any `isDark` ternary inside a JSX return block. Acceptable in hooks/mappers only.

### 4. Single-letter or cryptic names

Vars, params, aliases, or arrow args that are single letters or abbreviations: `e`, `v`, `i`, `t`, `x`, `err`, `res`, `val`, `tmp`, `cb`, `fn`, `idx`, `ref`. Exception: `_` for unused params.

### 5. Inline `i18n.t()` with namespace

Calls matching `i18n.t(` or `t(` with `{ ns:` argument. Should use `scopedTranslations` or `useTranslations`.

### 6. Form validation in apps

Zod schema definitions (`z.object(`, `z.string(`) inside `apps/`. Or `useState` for form fields in app hooks.

### 7. Dependencies as parameters

Hooks accepting `theme`, `router`, `queryClient`, `navigation`, `translate` as params. Mappers accepting `translate` when they could use `scopedTranslations` at module level.

### 8. Logic in JSX

Value-computing ternaries in JSX (`{isX ? "label" : "other"}`, `{price * qty}`). Conditional rendering is fine (`{flag && <X/>}`). Also: `t()` calls or `translate()` in JSX return blocks.

### 9. Missing UIModel pattern

Page components not consuming `uiModel`. Hooks returning raw use case data without a `mapTo*UIModel` call.

### 10. Duplicated logic across apps

Similar hook logic in both `apps/mobile/` and `apps/web/` that should be in `@ewi/shared`.

### 11. Direct API calls in apps

`axios`, `fetch(`, or `executeRequest` imported inside `apps/`.

### 12. Code duplication

Identical functions, mappers, or types in multiple locations.

### 13. Router in custom hooks

`useRouter`, `router.push`, `router.replace`, or `router.back` imported/used in any hook file that is NOT a `*NavigationHandler.ts`. Hooks must expose `navigationTarget` state; only `use[Feature]NavigationHandler` files may import the router.

## Output format

```
## Review Results

### No violations
- [rules with zero violations]

### Violations found

#### [Rule name]
- `path/to/file.tsx:42` — [brief description]

### Summary
X violation(s) across Y file(s). Z rule(s) clean.
```

If zero violations: `All files pass review — no rule violations found.`
