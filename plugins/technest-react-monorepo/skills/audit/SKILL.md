---
name: audit
description: Checks structural conformance of existing pages, modules, and components against expected file patterns. Detects missing files (types.ts, mapper, navigation handler, styles, route file), incomplete shared modules, and orphaned routes. Complements /review which checks content rules.
---

Audit the project's file structure against expected patterns. **Report violations only — fix nothing.**

## Scope

If arguments are provided, audit only those features/paths. Otherwise, audit all features under `apps/mobile/features/`, `apps/web/app/`, and `packages/shared/src/features/`.

Ignore `node_modules/`, `__tests__/`, `designSystem/`, `networking/`, `appConfig/`, and `presentation/` (cross-cutting module).

## Structural rules to check

### 1. Mobile page completeness

Every folder under `apps/mobile/features/[feature]/pages/[page]/` must contain:

| Required file                      | Pattern                                            |
| ---------------------------------- | -------------------------------------------------- |
| `index.tsx`                        | Page component — exports named + default           |
| `use[Feature].ts`                  | Custom hook — no router import                     |
| `use[Feature]NavigationHandler.ts` | Navigation handler — owns router                   |
| `mapTo[Feature]UIModel.ts`         | Pure mapper                                        |
| `styles.ts`                        | StyleSheet.create                                  |
| `types.ts`                         | NavigationTarget, UIModel, MapperInput, HookReturn |

Flag any missing file. Flag extra hook files that don't match the naming convention.

### 2. Web page completeness

Every route folder under `apps/web/app/[route]/` that contains a `page.tsx` must also contain:

| Required file                      | Pattern                                            |
| ---------------------------------- | -------------------------------------------------- |
| `page.tsx`                         | `"use client"` + default export                    |
| `use[Feature].ts`                  | Custom hook — no router import                     |
| `use[Feature]NavigationHandler.ts` | Navigation handler — owns router                   |
| `mapTo[Feature]PageUIModel.ts`     | Pure mapper                                        |
| `types.ts`                         | NavigationTarget, UIModel, MapperInput, HookReturn |

Flag any missing file.

### 3. Shared module completeness

Every folder under `packages/shared/src/features/[feature]/` (excluding `presentation/`) must contain:

| Required             | Path                                              |
| -------------------- | ------------------------------------------------- |
| `index.ts`           | Barrel exports — use cases, domain models, stores |
| `domain/model/`      | At least one domain model file                    |
| `domain/useCase/`    | At least one use case file                        |
| `data/remote/`       | At least one remote function                      |
| `data/repositories/` | At least one repository hook                      |
| `data/model/`        | At least one data model                           |
| `data/mapper/`       | At least one mapper                               |

Optional (flag as info, not violation):

- `data/local/` — only if feature has client state
- `presentations/` — only if feature has shared hooks
- `presentations/validators/` — only if feature has forms

### 4. Mobile route file exists

For every page under `apps/mobile/features/[feature]/pages/[page]/`, check that a corresponding route file exists somewhere under `apps/mobile/app/`. The route file must import from the page's `index.tsx`.

Flag pages with no matching route file.

### 5. Barrel export completeness

For each shared module's `index.ts`:

- Every file in `domain/useCase/` should have a corresponding export
- Every file in `domain/model/` should have a corresponding type export
- If `data/local/` exists, `initializeXStore`, `useXStore`, `getXStore` should be exported
- **No** data-layer internals exported (remote functions, data models, mappers, repository hooks)

### 6. Root barrel sync

Check `packages/shared/src/index.ts`:

- Every module's exported use cases and models should be re-exported here
- No stale re-exports pointing to modules/files that no longer exist

### 7. Mobile component completeness

Every folder under `apps/mobile/features/[feature]/components/[Component]/` must contain:

| Required file | Pattern                  |
| ------------- | ------------------------ |
| `index.tsx`   | Component — named export |
| `styles.ts`   | StyleSheet.create        |

Optional: `use[Component].ts`, `types.ts` — flag as info if hook exists without types.

### 8. Localization coverage

For each feature that has pages:

- Check that a localization file exists in `packages/shared/src/features/presentation/localization/` for that feature's namespace
- Check that mappers reference `scopedTranslations` with the feature's namespace (mobile) or import label constants (web)

## How to audit

1. Use `Glob` to discover all page/module/component folders
2. For each folder, use `Glob` to check which expected files exist
3. For barrel exports (rules 5–6), read the `index.ts` files and cross-reference against the filesystem
4. Collect all violations

## Output format

```
## Audit Results

### Passing
- [structures with zero violations]

### Violations found

#### [Rule name]
- `path/to/feature/page/` — missing `use[Feature]NavigationHandler.ts`
- `path/to/feature/page/` — missing `types.ts`

### Info (optional, not violations)
- `path/to/feature/` — no `presentations/` folder (no shared hooks)

### Summary
X violation(s) across Y location(s). Z rule(s) clean.
```

If zero violations: `All structures pass audit — no conformance issues found.`
