# AI Rules — React Web App (`apps/web`)

These instructions apply when working inside `apps/web/`. They supplement the root CLAUDE.md rules.

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages (or Vite entry)
│   ├── components/       # Web-specific UI components
│   ├── hooks/            # Web-specific custom hooks
│   ├── services/         # API clients, auth, analytics
│   ├── lib/              # Framework utilities (next-auth config, etc.)
│   ├── styles/           # Global styles, theme config
│   ├── utils/            # Web-specific utilities
│   └── types/            # Web-specific type definitions
├── public/               # Static assets
├── __tests__/            # Integration / E2E tests
├── next.config.js        # (or vite.config.ts)
└── package.json
```

## React Web Rules

### Routing & Pages
- Use the project's routing convention (Next.js App Router / Pages Router / React Router).
- Pages/routes are the only files that may use default exports.
- Keep pages thin: they should compose components and handle data fetching, not contain business logic.
- Server Components (Next.js App Router): default to server components. Add `"use client"` only when the component needs interactivity, hooks, or browser APIs.

### Components
- Web-specific components live in `src/components/`. Shared components come from `@project/ui`.
- Follow atomic design loosely: atoms, molecules, organisms — but don't over-engineer the folder structure.
- Every component gets its own directory if it has more than 1 file: `Button/index.tsx`, `Button/Button.test.tsx`, `Button/Button.styles.ts`.

### Styling
- Follow the project's established approach (Tailwind CSS / CSS Modules / styled-components).
- If Tailwind: use utility classes directly. Extract repeated patterns into components, not `@apply` classes.
- If CSS Modules: name files `Component.module.css`. Use camelCase for class names.
- Responsive design: mobile-first approach. Use the project's breakpoint tokens.
- Never use inline styles except for truly dynamic values (e.g., computed positions).

### Data Fetching
- Use React Query / TanStack Query for client-side data fetching.
- Use Next.js `fetch` in Server Components when available.
- API calls go through service modules in `src/services/` — never call fetch directly in components.
- Handle loading, error, and empty states for every data-dependent UI.

### State Management
- Use the project's state management library for global state.
- React Query handles server state — don't duplicate API data in client state.
- Form state: use React Hook Form or the project's form library.
- URL state (filters, pagination): use URL search params, not React state.

### Authentication & Authorization
- Auth logic lives in `src/lib/` or `src/services/auth/`.
- Protected routes should use middleware (Next.js) or route guards (React Router).
- Never check auth in individual components — handle it at the layout/route level.
- Never expose tokens or secrets in client-side code.

### Performance
- Use `next/image` (or equivalent) for all images — never raw `<img>` tags.
- Lazy-load below-the-fold components with `React.lazy` + `Suspense` or `next/dynamic`.
- Avoid large client-side bundles: check bundle size impact when adding dependencies.
- Use `useMemo` / `useCallback` where profiling shows unnecessary re-renders — not everywhere.
- Implement proper caching headers for API routes.

### SEO & Accessibility
- Every page must have a unique `<title>` and `<meta description>`.
- Use semantic HTML: `<main>`, `<nav>`, `<article>`, `<section>`, `<button>` (not `<div onClick>`).
- All interactive elements must be keyboard accessible.
- Images must have `alt` text. Decorative images use `alt=""`.
- Color contrast must meet WCAG AA standards.

### Testing
- Use `@testing-library/react` for component tests.
- Use Cypress or Playwright for E2E tests in `__tests__/` or `e2e/`.
- Test user interactions and outcomes, not implementation details.
- Mock API calls with MSW (Mock Service Worker) — not manual fetch mocks.

### Common Pitfalls to Avoid
- **NEVER** use `document.querySelector` or direct DOM manipulation — use refs.
- **NEVER** store sensitive data in localStorage — use httpOnly cookies.
- **NEVER** disable ESLint rules without a comment explaining why.
- **NEVER** use `dangerouslySetInnerHTML` without sanitizing input.
- **NEVER** import from `apps/mobile/` — use shared packages instead.
