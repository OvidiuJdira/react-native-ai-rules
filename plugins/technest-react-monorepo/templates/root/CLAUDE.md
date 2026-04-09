# EWI Monorepo

Turborepo monorepo with npm workspaces.

## Package Map

```
ewi/
├── apps/
│   ├── web/           # @ewi/web — Next.js 15 (App Router)
│   └── mobile/        # @ewi/mobile — Expo 52 / React Native
├── packages/
│   └── shared/        # @ewi/shared — domain logic, data layer, theme, components
```

## Package Responsibilities

| Package       | Owns                                                                                                                                                                                    | Does NOT own                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `@ewi/shared` | Domain models, use cases, data layer (API, React Query, mappers, stores), localization (`features/presentation/localization/`), shared components (`features/presentation/components/`) | Screens, routing, platform-specific UI, theming |
| `@ewi/mobile` | Screens, Expo Router navigation, RN styling, mobile-specific components, theme (`features/theme/`)                                                                                      | Domain models, API calls, business logic        |
| `@ewi/web`    | Pages, Next.js routing, CSS/Tailwind styling, web-specific components                                                                                                                   | Domain models, API calls, business logic        |

## Critical Rules

### Architecture

- **NEVER duplicate code.** If logic already exists anywhere in the codebase, reuse it. Extract it to `@ewi/shared` if needed. Duplication is never acceptable regardless of context.
- **Extract shared hook logic to `@ewi/shared`; app hooks only compose and extend.** If two or more apps need the same stateful logic (form state, validation, submit flow, data fetching), create a base hook in `@ewi/shared/features/[feature]/presentations/`. App-level hooks call the shared hook and add only platform-specific behavior (navigation, biometric auth, notifications, platform UI state). Never duplicate hook logic across apps — extract first, extend per platform. **Naming convention:** shared base hook = `use[Feature]Form` for form hooks (e.g. `useLoginForm`) or `use[Feature]Data` for data/state hooks (e.g. `useInboxData`, `useActivityHistoryData`); app-level hook = `use[Feature]` (e.g. `useLogin`, `useInbox`) — the same name on both platforms. Example: `useLoginForm` in `@ewi/shared` → `useLogin` in both mobile and web; `useInboxData` in `@ewi/shared` → `useInbox` in both mobile and web.
- **Never pass a dependency as a parameter if it can be resolved directly at the call site.** If something can be imported as a singleton (`queryClient`) or called as a hook (`useTheme()`, `useRouter()`, `useQueryClient()`, `useNavigation()`), resolve it inside the function/hook that needs it — never thread it through as a parameter. This applies everywhere: mappers, hooks, utilities, components, and callbacks. Pass only domain state (data, flags, IDs) as parameters. Example: mobile mappers call `scopedTranslations(namespace)` directly; hooks call `useTheme()` internally rather than accepting a `theme` argument.

### UI

- **Every page/component must expose a UIModel.** The custom hook (`useX.ts`) builds a UIModel — a plain object with all derived state and pre-resolved labels — using a pure mapper function. The page/component only renders what it receives from the UIModel: no `t()` calls, no value-computing ternaries, no inline logic in JSX. Conditional rendering based on UIModel boolean flags (e.g. `{uiModel.showError && <Error/>}`) is acceptable — computing or deriving values inside JSX is not. All conditional labels (e.g. "Submitting…" vs "Submit") and derived values are computed inside the hook's mapper before they reach the template.
- **NEVER deviate from provided designs.** When implementing a page or screen from any design source (`.pen` files, Figma, images, screenshots, mockups), reproduce it EXACTLY — every element, spacing, hierarchy, color, font, and alignment. Do not add UI elements that are not in the design. Do not remove or skip elements that are in the design. Do not modify layout, spacing, or visual treatment. The provided design is the single source of truth for visual implementation. If something is unclear, ask — never assume or improvise.

### Localization & Constants

- **ALL UI labels and user-facing strings must come from `@ewi/shared/localization`.** Never hardcode text strings in apps. Import label constants from the shared localization module. This includes form labels, placeholders, button text, error messages, headings, descriptions, footer links, and any other displayed text. Zod validation messages must also reference shared label constants.
- **Never call `i18n.t(key, { ns: "..." })` inline.** Use `scopedTranslations(namespace)` in pure functions and mappers; use `useTranslations(namespace)` in React hooks and components. Both are exported from `@ewi/shared/localization` and return a scoped translate function — no inline namespace argument needed. Name the result `translate[Namespace]` (e.g. `translateAuth`, `translateCommon`). Web code uses typed label constants (`authLabels`, `commonLabels`) instead.
- **Every localization key that is used by a UI element requiring accessibility must be an object with `label` and `accessibility` properties.** The `label` is the visible text; `accessibility` is the screen reader description. Example: `"registerButton": { "label": "Jetzt registrieren", "accessibility": "Registrierung starten" }`. In mappers, access via `translate("registerButton.label")` and `translate("registerButton.accessibility")`. This applies to buttons, links, inputs, images, and any interactive or meaningful element. Keys that are never attached to an accessible element (e.g. validation messages, separators) can remain plain strings.
- **NEVER use hardcoded string or numeric literals inline.** Extract every magic value — navigation targets, route names, storage keys, event names, status strings, numeric thresholds, configuration values, and **form field names** — into a named constant and reuse it. Constants live in the closest shared scope: feature-level `constants.ts` for feature-specific values, or `@ewi/shared` for cross-feature values. Name format: `UPPER_SNAKE_CASE` (e.g. `FORGOT_PASSWORD_TARGET`, `MAX_RETRY_COUNT`, `AUTH_STORAGE_KEY`). This includes form field identifiers used in callbacks — e.g. `handleInputChange("email", value)` is wrong; define `const EMAIL_FIELD = "email" as const` and use `handleInputChange(EMAIL_FIELD, value)`. This prevents typos, enables refactoring, and makes intent explicit.

### Hooks

- **NEVER call `router.push()`, `router.replace()`, or any navigation method inside a custom hook, callback, or component handler.** This rule applies everywhere — hooks, page components, layout files, and callbacks. The only place `router.push/replace` is allowed is inside a `use[Feature]NavigationHandler` hook's `useEffect`. All other code must set a `navigationTarget` state (a union type or `null`) and expose a `clearNavigationTarget` callback. The page/layout passes these to the navigation handler hook which owns the router and performs navigation reactively via `useEffect`. See `hook-patterns` skill for full anti-pattern/correct-pattern examples and app-level CLAUDE.md files for platform-specific wiring.
- **All handlers returned from hooks must be wrapped in `useCallback`.** Never return inline arrows — `return { handleSubmit: () => ... }` is wrong. Define `const handleSubmit = useCallback(() => { ... }, [deps])` and return the reference.
- **Hook return types must be explicitly typed.** Never rely on inference — `export const useLogin = ()` is wrong. Always annotate: `export const useLogin = (): UseLoginReturn`. Define the return type in `types.ts`.

### Forms

- **ALL form validations live in `@ewi/shared` and use Zod.** Never define validation logic inside apps. Schemas are factory functions that accept a `translate` argument so validation messages are localized — export `createXSchema(translate)` and its inferred type from `@ewi/shared`; apps instantiate the schema with a scoped translate function and wire it to form libraries (e.g. `zodResolver(createLoginSchema(translateAuth))`).

### Testing

- **ALL generated code must be covered by unit tests with a minimum of 90% coverage — target 100%.** Every new file (hook, mapper, use case, utility, store, schema) must have a corresponding test file in `__tests__/` mirroring the source structure. Tests must pass and meet coverage thresholds before code is considered complete.

### Error Handling

- **Errors surface through the UIModel — never catch and swallow silently.** API errors are handled by the shared data layer (interceptors + `mitt` events for auth errors, React Query's `onError` for mutation failures). App hooks expose error state via the UIModel (e.g. `uiModel.loginError`, `uiModel.showErrorBanner`). Never use raw `try/catch` in app-level code — let React Query and the interceptor layer handle API errors. For non-API errors (e.g. biometric failures), catch in the hook, set an error state, and expose it through the UIModel. Never show raw error messages to users — always map to a localized, user-friendly string via the mapper. See app-level CLAUDE.md files for platform-specific error surfacing patterns (Notifier on mobile, toast/error boundaries on web).

### Accessibility

- **All interactive elements must have accessibility labels.** Every interactive element must be labeled for screen readers. Images must have descriptive text; decorative images must be hidden from assistive technology. Form inputs must be associated with labels — never rely on placeholder text alone for context. See app-level CLAUDE.md files for platform-specific accessibility patterns.

### Performance

- **Use `useMemo` and `useCallback` only where measurable benefit exists.** Wrap handlers in `useCallback` (already required by the hooks rule). Use `useMemo` for expensive computations (filtering/sorting large lists, complex derived state) — never for simple object literals or string concatenations. Do not wrap every value in `useMemo` preemptively.
- **Optimize images.** Use appropriately sized and compressed assets. Lazy-load below-the-fold images. See app-level CLAUDE.md files for platform-specific image and list performance patterns.

### Code Style

- **NEVER use `require()`.** All imports must use ES module `import` syntax. CommonJS `require()` is forbidden — it breaks tree-shaking, is not type-safe, and is flagged by TypeScript ESLint. This applies everywhere: source files, barrel exports, mappers, utilities, and test files.
- **NEVER use `window` — use `globalThis` instead.** `globalThis` is the standard cross-environment global object and works in browsers, Node.js, and React Native. Using `window` directly breaks SSR (Next.js server components) and non-browser runtimes. This applies everywhere: event listeners, storage access, feature detection, scroll handling, and any other global API access. Example: `globalThis.addEventListener(...)` not `window.addEventListener(...)`, `globalThis.localStorage` not `window.localStorage`. **SSR guard exception:** `typeof window === "undefined"` is the accepted pattern for detecting server-side rendering — do not replace it with `typeof globalThis === "undefined"` because `globalThis` exists in Node.js and will never be `"undefined"`.
- **NEVER abbreviate with single letters or cryptic short forms — in variables, hook names, method names, parameters, aliases, and inline arrow functions.** Every name must communicate its full purpose without abbreviation. No `e`, `v`, `i`, `t`, `x`, `cb`, `fn`, `res`, `err`, `val`, `tmp`, `idx`, `ref`, or any single-letter prefix (e.g. `tAuth`, `vResult`). The rule applies everywhere: components, hooks, mappers, utilities, callbacks, and method signatures. Examples: `event` not `e`, `value` not `v`, `index` not `i`, `error` not `err`, `response` not `res`, `callback` not `cb`, `translateAuth` not `tAuth`, `isVisible` not `vis`.

### Naming Conventions

- **Apply naming rules from `documentation/content/adr/naming-conventions.md` across all packages.** Package-level CLAUDE files extend these rules but must not conflict with them.
- **Feature folders use kebab-case for directories.** Nest sub-features by domain area.
- **Component files and folders use PascalCase.** Props types use `[ComponentName]Props`.
- **Hook naming must follow the project templates.** Shared base form hooks use `use[Feature]Form`; app hooks use `use[Feature]`; navigation side-effects live in `use[Feature]NavigationHandler`.
- **Hook-related type naming is mandatory.** Return type: `Use[Feature]Return`; navigation target union: `[Feature]NavigationTarget`; UI model: `[Feature]UIModel` or `[Feature]PageUIModel`.
- **Shared package layer naming follows clean-architecture templates.** Use case: `useVerbEntityUseCase.ts`; repository hook: `use[Feature]Repository.ts`; mapper: `mapToEntity.ts`; validation schema: `[feature]Schema.ts`.
- **Next.js App Router naming must follow framework-recognized file names.** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` are valid route files; only `page.tsx` is required for a renderable route segment.
- **Expo Router naming must follow framework route conventions.** Common route file names include `index.tsx`, `[param].tsx`, `[...param].tsx`, `(group)/index.tsx`, and `_layout.tsx`.

## Import Conventions

```typescript
import { useGetXUseCase, User } from "@ewi/shared";
import { Button } from "@ewi/shared/components"; // → features/presentation/components/
import { authLabels, commonLabels } from "@ewi/shared/localization"; // → features/presentation/localization/
import { scopedTranslations, useTranslations } from "@ewi/shared/localization";
```

- Apps depend on `@ewi/shared`, never on each other
- Never duplicate domain models, API calls, or React Query hooks in apps
- Shared package has zero platform-specific dependencies (no `react-native`, no `next`)
- Localization and components live under `packages/shared/src/features/presentation/` — never at the top level of `src/`
- **Always use the package alias for internal imports within `@ewi/web-ui`.** Import sibling components via `from "@ewi/web-ui"` (e.g. `import { Heading, TextWithIcon } from "@ewi/web-ui"`), never relative paths. This keeps imports consistent and leverages the barrel exports
- Theme lives in `apps/mobile/features/theme/` — not in `@ewi/shared`. See `apps/mobile/CLAUDE.md` for theming rules

## Scripts

```bash
npm run dev:web
npm run dev:mobile
npm run build:web
npm run build
npm run lint
```

## Post-Write Verification

After **generating new code** (new files, new features, new components), ALWAYS perform both steps below — no exceptions, no waiting for the user to ask. Skip this for non-code tasks (commit messages, rule edits, documentation, reviews).

1. **Run tests with coverage** — execute `npm run test:coverage` (scoped to the affected package). Verify coverage meets the 90%+ threshold. If it does not, write additional tests until it does. **Always include a coverage table in the response** showing `% Stmts`, `% Branch`, `% Funcs`, `% Lines` for every new or modified file.
2. **Run `/review`** — run the review skill to check all project rules. Include the review report in your response. If violations are found, fix them before considering the task complete.

Both reports (coverage table + review) must be visible to the user in every code generation response. No code is considered complete until both reports pass.

3. **Code Review Feedback** — after every response where code was written or edited, include a short section at the end:
   - **Possible Rules (1-3):** Reusable patterns from this code that could become CLAUDE.md rules. Be specific — name the pattern and where it applies. Say "None" if clean.
   - **Possible Improvements (1-3):** Concrete suggestions — naming, abstractions, performance, accessibility. Reference specific files. Say "None" if clean.

## Package-Specific Rules

Detailed rules are scoped per package and loaded automatically when working in those directories:

- `packages/shared/CLAUDE.md` — Clean Architecture, naming, React Query, networking
- `apps/mobile/CLAUDE.md` — Screen patterns, navigation, styling, forms
- `apps/web/CLAUDE.md` — Next.js App Router, server/client components, theming
