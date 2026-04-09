# Project AI Rules — Monorepo Root

These instructions override default behavior. Follow them exactly.

## Monorepo Architecture

This is a **React / React Native monorepo** managed with Turborepo (or NX).

```
root/
├── apps/
│   ├── mobile/    # React Native app (iOS + Android)
│   └── web/       # React web app (Next.js / Vite)
├── packages/      # Shared libraries consumed by apps
├── turbo.json
├── package.json   # Workspace root
└── tsconfig.base.json
```

## Critical Rules

### Dependency Management
- **NEVER** install dependencies at the workspace root unless they are devDependencies used by build tooling (eslint, prettier, typescript, turbo).
- Install app-specific deps inside `apps/mobile/` or `apps/web/`.
- Shared deps go into the consuming package inside `packages/`.
- Use exact versions (`--save-exact`) for all dependencies.
- After adding/removing deps, run `turbo build` from root to verify nothing breaks.

### Import Boundaries
- `apps/mobile` and `apps/web` may import from `packages/*`.
- `packages/*` must NEVER import from `apps/*`.
- Cross-package imports within `packages/` are allowed only through the package's public API (index.ts barrel).
- NEVER use relative paths across workspace boundaries (e.g., `../../packages/ui`). Always use the package name (`@project/ui`).

### TypeScript
- All code is TypeScript. No `.js` files except config files (next.config.js, metro.config.js, etc.).
- Use `strict: true` in all tsconfig files.
- Prefer `interface` over `type` for object shapes that may be extended.
- Export types from `packages/` alongside runtime code in barrel files.
- Use path aliases defined in `tsconfig.base.json` — never use deep relative imports.

### Code Style
- Follow ESLint + Prettier config defined at root.
- Use named exports, not default exports (except for pages in Next.js and screens in React Navigation).
- Use `const` arrow functions for components: `const MyComponent: React.FC<Props> = ({ ... }) => { ... }`
- Destructure props in the function signature.
- Colocate types with their module: `MyComponent.tsx` + `MyComponent.types.ts` if the types file grows beyond 20 lines.

### Git & PR Conventions
- Branch naming: `feature/TICKET-123-short-description`, `fix/TICKET-456-short-description`.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- One logical change per commit. Don't mix refactors with feature code.
- PRs must include a test plan section.
- Never force-push to shared branches.

### Testing
- Every new component or function must have tests.
- Unit tests colocated: `MyComponent.test.tsx` next to `MyComponent.tsx`.
- Integration tests in `__tests__/` directory at the package/app level.
- Use `describe` / `it` blocks with clear descriptions.
- Mock external services, not internal modules.

### Performance
- Memoize expensive computations with `useMemo`.
- Use `React.memo` for pure presentational components rendered in lists.
- Avoid inline object/array literals in JSX props (causes re-renders).
- Never use `any` — use `unknown` + type narrowing if the type is truly unknown.

### Error Handling
- Wrap async operations in try/catch. Never swallow errors silently.
- Use error boundaries for UI error recovery.
- Log errors to the project's error tracking service.
- User-facing error messages should be helpful, not technical.

## When Modifying Code

1. Read the existing code and understand the patterns before making changes.
2. Check if similar functionality already exists in `packages/`.
3. Follow the existing file/folder structure — don't introduce new patterns without discussion.
4. Run `turbo build` and `turbo test` before considering a task complete.
5. If you're unsure about an architectural decision, ask rather than guessing.
