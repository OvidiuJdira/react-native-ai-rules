# @ewi/web — Rules

Presentation layer only. Consumes `@ewi/shared` — never creates domain models, API calls, mappers, or React Query hooks here.

> All critical rules (localization, dependency resolution, naming, theming, UIModel, hook composition, forms) are defined in the **root `CLAUDE.md`**. Below are web-specific patterns for applying them.

### Dependency resolution — web uses label constants in mappers

```typescript
import { authLabels, commonLabels } from "@ewi/shared/localization";

// In mapper — import constants directly, never pass them as arguments
export const mapToAuthPageUIModel = ({
  form,
  errors,
  isSubmitting,
}: MapToAuthPageUIModelInput): AuthPageUIModel => ({
  emailPlaceholder: authLabels.emailPlaceholder,
  submitButtonLabel: isSubmitting ? authLabels.submitting : authLabels.submit,
  emailError: errors.email,
});
```

## Consuming @ewi/shared and @ewi/web-ui

```typescript
// Domain logic, use cases, data — from @ewi/shared
import { useGetProductsUseCase, useAddToCartUseCase } from "@ewi/shared";
import { ThemeProvider, useTheme } from "@ewi/shared/theme"; // → features/presentation/theme/
import { Button } from "@ewi/shared/components"; // → features/presentation/components/
import { authLabels, commonLabels } from "@ewi/shared/localization"; // → features/presentation/localization/
import type { Product, User } from "@ewi/shared";

// UI components — from @ewi/web-ui (atomic design)
import { CardTeaser, CardTeaserList, Button } from "@ewi/web-ui";
import type { CardTeaserProps } from "@ewi/web-ui";
```

All `@ewi/shared` hooks (use cases, stores, theme) require a `"use client"` boundary.

## UI Component Architecture

`@ewi/web-ui` owns all reusable presentational components, organized by atomic design:

```
packages/web-ui/src/components/
├── 0-ui/           # Base primitives (Button, Input, Tooltip, etc.)
├── 1-atoms/        # Single-responsibility elements (Heading, Text, InfoItem)
├── 2-molecules/    # Composite components from atoms (CardTeaser, DetailCard)
└── 3-organisms/    # Groups of molecules (CardTeaserList, InfoGrid)
```

### Rules

- **NEVER define reusable presentational components in `apps/web/`.** All generic UI components (cards, lists, grids, form groups, banners) must live in `@ewi/web-ui` and be imported from there. `apps/web/features/` only composes these components with domain data — it never creates its own styled markup for patterns that could be reused.
- **Install shadcn/ui components into `packages/web-ui/src/components/0-ui/` when a component needs a base primitive.** Before building any atom, molecule, or organism, check if shadcn/ui provides a suitable primitive (Button, Input, Dialog, Select, Tooltip, etc.). If it does, install it into `@ewi/web-ui` as a `0-ui` component — never into `apps/web/`. Run `npx shadcn@latest add <component>` from the `packages/web-ui/` directory. Higher-level components in `1-atoms/`, `2-molecules/`, and `3-organisms/` compose these shadcn primitives — they never reimplement functionality that shadcn already provides.
- **When building a new feature, identify the UI primitives first.** Before writing JSX, check if `@ewi/web-ui` already has the needed molecule/organism. If not, create it there before using it in the feature. The feature component should be a thin composition layer: hook + `@ewi/web-ui` components + UIModel wiring.
- **Feature components map domain data to component props via the UIModel.** The feature hook fetches data via `@ewi/shared` use cases, builds a UIModel with all display-ready values (including props shaped to match `@ewi/web-ui` component interfaces like `CardTeaserProps`), and the feature component passes them through.

### Example: feature using @ewi/web-ui organisms

```
features/campaigns/
├── Campaigns.tsx              # "use client" — composes CardTeaserList from @ewi/web-ui
├── useCampaigns.ts            # "use client" — fetches data, builds UIModel
├── mapToCampaignsUIModel.ts   # Pure mapper — maps domain models to CardTeaserProps[]
├── types.ts                   # UIModel type (items: CardTeaserProps[]), hook return type
└── index.ts                   # Barrel export
```

```typescript
// Campaigns.tsx — thin composition, no custom styled markup
"use client";
import { CardTeaserList } from "@ewi/web-ui";
import { useCampaigns } from "./useCampaigns";

export function Campaigns() {
  const { uiModel } = useCampaigns();
  return (
    <section className="mt-6">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{uiModel.heading}</h2>
      {uiModel.isLoading && <p className="text-muted-foreground">{uiModel.loadingMessage}</p>}
      {uiModel.items.length > 0 && <CardTeaserList items={uiModel.items} />}
    </section>
  );
}
```

---

## Server vs Client Components

- **Server Components** (default): static layouts, metadata, no hooks
- **Client Components** (`"use client"`): hooks, state, event handlers, `@ewi/shared` use cases

```typescript
// layout.tsx — server component
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}

// page.tsx — client component
"use client";
import { useGetProductsUseCase } from "@ewi/shared";
```

---

## Route Structure

```
app/
├── layout.tsx          # Root layout with <Providers>
├── page.tsx            # Home page
├── providers.tsx       # "use client" — ThemeProvider, QueryClientProvider
├── globals.css
└── [feature]/
    ├── page.tsx
    ├── layout.tsx      # optional
    └── loading.tsx     # optional
```

### Providers (`providers.tsx`)

```typescript
"use client";
import { ThemeProvider } from "@ewi/shared/theme";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialMode="light">{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
```

---

## Page Components

See root `CLAUDE.md` for hook composition, UIModel, and navigation rules. Web hooks compose shared base hooks and add only web-specific behavior. Hooks never import the router — navigation is handled by a separate `use[Feature]NavigationHandler`.

### Page folder structure

Co-locate all page files alongside `page.tsx` in `app/[route]/`:

```
app/[route]/
├── page.tsx                           # "use client" — UI only, wires navigation handler
├── use[Feature].ts                       # "use client" — all logic, NO router
├── use[Feature]NavigationHandler.ts      # "use client" — owns router, reacts to navigation state
├── mapTo[Feature]PageUIModel.ts          # Pure mapper — label constants, no hooks
└── types.ts                           # Navigation target, UIModel, mapper input, hook return type
```

### Example page

```typescript
"use client";
import { useProducts } from "./useProducts";
import { useProductsNavigationHandler } from "./useProductsNavigationHandler";

export default function ProductsPage() {
  const { uiModel, navigationTarget, clearNavigationTarget } = useProducts();
  useProductsNavigationHandler(navigationTarget, clearNavigationTarget);

  return (
    <main className="bg-background">
      {uiModel.isLoading ? (
        <p>{uiModel.loadingLabel}</p>
      ) : (
        uiModel.products.map((product) => (
          <div key={product.id}>{product.name}</div>
        ))
      )}
    </main>
  );
}
```

### Example hook (NO router)

```typescript
"use client";
import { useState, useCallback } from "react";
import { useTheme } from "@ewi/shared/theme";
import { useLoginForm } from "@ewi/shared";
import { mapToAuthPageUIModel } from "./mapToAuthPageUIModel";
import type { UseLoginReturn, AuthNavigationTarget } from "./types";

export function useLogin(): UseLoginReturn {
  const { isDark } = useTheme();
  const {
    form,
    errors,
    isSubmitting,
    handleInputChange,
    handleInputBlur,
    handleLogin,
  } = useLoginForm();
  const [navigationTarget, setNavigationTarget] =
    useState<AuthNavigationTarget>(null);

  const uiModel = mapToAuthPageUIModel({ form, errors, isSubmitting, isDark });
  const handleRegister = useCallback(() => setNavigationTarget("register"), []);
  const clearNavigationTarget = useCallback(
    () => setNavigationTarget(null),
    [],
  );

  return {
    uiModel,
    navigationTarget,
    clearNavigationTarget,
    handleInputChange,
    handleInputBlur,
    handleLogin,
    handleRegister,
  };
}
```

### Example navigation handler

```typescript
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AuthNavigationTarget } from "./types";

export function useLoginNavigationHandler(
  target: AuthNavigationTarget,
  onNavigated: () => void,
) {
  const router = useRouter();

  useEffect(() => {
    if (!target) return;
    switch (target) {
      case "register":
        router.push("/register");
        break;
    }
    onNavigated();
  }, [target, router, onNavigated]);
}
```

All logic lives in the hook. The hook never imports the router — navigation is a side effect handled by the navigation handler.

---

## Naming Conventions

See root `CLAUDE.md` naming rule. Web-specific conventions:

| Type      | Pattern                                   | Example                      |
| --------- | ----------------------------------------- | ---------------------------- |
| Page      | `page.tsx` default export                 | `app/shop/page.tsx`          |
| Layout    | `layout.tsx` default export (optional)    | `app/shop/layout.tsx`        |
| Loading   | `loading.tsx` default export (optional)   | `app/shop/loading.tsx`       |
| Error     | `error.tsx` + `"use client"` (optional)   | `app/shop/error.tsx`         |
| Not Found | `not-found.tsx` default export (optional) | `app/shop/not-found.tsx`     |
| Component | PascalCase in `components/`               | `components/ProductCard.tsx` |

- Route file names recognized by Next.js App Router: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Only `page.tsx` is required to define a renderable route segment.
- Page module conventions inside `app/[route]/`: `page.tsx`, `use[Feature].ts`, `use[Feature]NavigationHandler.ts`, `mapTo[Feature]PageUIModel.ts`, `types.ts`.

---

## Theming & Styling

See root `CLAUDE.md` theming rule. Web uses **Tailwind CSS v4** for all styling.

- **ALWAYS use Tailwind utility classes for styling in web components and pages.** Never use inline `style={{}}` objects. All colors, spacing, border radii, and font sizes must be expressed as Tailwind classes using the CSS custom property tokens defined in `@ewi/web-ui/styles` (e.g. `bg-card`, `text-primary`, `rounded-lg`, `text-foreground`).
- **Do NOT call `useTheme()` in web components or pages for styling purposes.** The Tailwind CSS layer handles light/dark mode automatically via CSS custom properties and the `.dark` class. `useTheme()` is only needed in hooks/mappers when `isDark` is required for UIModel logic, or in `providers.tsx` for the `ThemeProvider`.
- **Token mapping** — CSS variables from `@ewi/web-ui/styles` map to Tailwind classes via `@theme inline`:

| Token                  | Tailwind class examples                                |
| ---------------------- | ------------------------------------------------------ |
| `--background`         | `bg-background`                                        |
| `--foreground`         | `text-foreground`                                      |
| `--card`               | `bg-card`                                              |
| `--primary`            | `bg-primary`, `text-primary`                           |
| `--primary-foreground` | `text-primary-foreground`                              |
| `--muted-foreground`   | `text-muted-foreground`                                |
| `--border`             | `border-border`                                        |
| `--destructive`        | `bg-destructive`, `text-destructive`                   |
| `--radius-sm/md/lg/xl` | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` |

```tsx
// Correct — Tailwind classes
<main className="min-h-screen bg-background text-foreground">
  <article className="rounded-lg bg-card p-4">
    <h2 className="text-lg font-bold text-foreground">{uiModel.title}</h2>
  </article>
</main>

// Wrong — inline styles with useTheme()
<main style={{ backgroundColor: theme.colors.background }}>
```

---

## Error Handling — Web

See root `CLAUDE.md` for the general error handling rule. Web-specific patterns:

- **Use `error.tsx` boundaries for route segments that need route-level recovery UX** (`"use client"`) and include a user-friendly fallback with retry action.
- **Transient errors (submission failures, network errors) use toast notifications** — never `window.alert()`.
- **Persistent errors (validation, login failures) surface through the UIModel** as `uiModel.loginError`, `uiModel.showErrorBanner`, etc. The page component renders them inline.

---

## Accessibility — Web

See root `CLAUDE.md` for the general accessibility rule. Web-specific patterns:

- All interactive elements (`<button>`, `<a>`, `<input>`) must have `aria-label` or a visible associated `<label htmlFor="...">`.
- Images must have `alt` text with a descriptive string. Decorative images use `alt=""`.
- Use semantic HTML elements (`<main>`, `<nav>`, `<section>`, `<header>`, `<footer>`) — never generic `<div>` for landmark regions.
- Form inputs: always pair with a `<label>` element — never rely on `placeholder` alone.

---

## Performance — Web

See root `CLAUDE.md` for the general performance rule. Web-specific patterns:

- **Use `next/image` for all images** with explicit `width`/`height` or `fill` — never raw `<img>` tags. This enables automatic optimization, lazy loading, and responsive sizing.
- **Lazy-load below-the-fold content** using `next/dynamic` for heavy components or `loading="lazy"` for images.
- **Avoid large client-side bundles** — keep `"use client"` boundaries as narrow as possible. Prefer server components for static content.

---

## Form Handling

See root `CLAUDE.md` for form validation rules. Web-specific:

- Labels resolved in `mapToAuthPageUIModel` via `authLabels`/`commonLabels` constants — never inline in the hook
