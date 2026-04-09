# AI Rules — Shared Packages (`packages/`)

These instructions apply when working inside `packages/`. They supplement the root CLAUDE.md rules.

## Package Structure

```
packages/
├── ui/                   # Shared UI components (cross-platform)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── theme/
│   │   └── index.ts      # Public barrel export
│   ├── package.json
│   └── tsconfig.json
├── api/                  # API client, types, hooks
│   ├── src/
│   │   ├── client/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── utils/                # Shared utilities
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── config/               # Shared config (ESLint, TypeScript, etc.)
    └── ...
```

## Package Development Rules

### Public API Design
- Every package MUST have a single `src/index.ts` barrel file that explicitly exports everything consumers can use.
- Never export internal implementation details — only the public interface.
- If you add a new module, you must also add its export to `index.ts`.
- Use `export type` for type-only exports to enable proper tree-shaking.

### Cross-Platform Compatibility
- Code in `packages/` must run on BOTH web and React Native unless the package is explicitly platform-specific.
- Never use DOM APIs (`document`, `window`, `navigator`) in shared packages. If needed, accept a platform adapter via dependency injection or props.
- Never use React Native APIs (`StyleSheet`, `Platform`, `Dimensions`) directly in shared packages. Use a theme/token system instead.
- Test shared components on both web and mobile when making changes.

### UI Package (`packages/ui`)
- Components must accept a `style` prop for customization (React Native convention that also works on web with proper setup).
- Use the project's design token system for colors, spacing, typography. Never hardcode values.
- Every component must have: props interface, default export or named export consistent with the rest, JSDoc on the component itself.
- Components must handle dark/light theme via the theme context, not hardcoded colors.

### API Package (`packages/api`)
- API client is a single configured instance (axios / fetch wrapper) in `src/client/`.
- Every endpoint gets its own function: `getUser(id: string): Promise<User>`.
- React Query hooks wrap the API functions: `useUser(id: string)`.
- API types are generated from the backend schema when possible. Manual types go in `src/types/`.
- Never hardcode API base URLs — use environment config passed at initialization.

### Versioning & Publishing
- Packages use workspace protocol (`"@project/ui": "workspace:*"`) — not published to npm.
- If a package changes, run the build and tests of all packages that depend on it.
- Breaking changes to a package's public API require updating all consumers in the same PR.

### Testing
- Every exported function and component must have unit tests.
- Tests live next to the code: `Button.test.tsx` next to `Button.tsx`.
- For cross-platform packages, test both the web and native render if the component has platform-specific behavior.
- Aim for high coverage on utility packages — they are foundational.

### Common Pitfalls to Avoid
- **NEVER** import from `apps/*` — packages don't know about consumers.
- **NEVER** add app-specific logic to a shared package. If only one app uses it, it belongs in that app.
- **NEVER** add heavy dependencies to a shared package without checking bundle impact on all consumers.
- **NEVER** break the public API without updating all imports across the monorepo.
- **NEVER** use relative paths to other packages (`../../ui/src/...`) — use the workspace package name.
